import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { GUI } from "https://cdn.skypack.dev/dat.gui";

const simplex = new SimplexNoise(); // Initialize SimplexNoise

let scene, camera, renderer, particles;
let particleMaterial, particleGeometry;
let pointCloud;
let targetNoiseScale = 5.0; // Target noise scale for morphing
let currentNoiseScale = 0.1;
let isMorphing = false; // Toggle between noise scales
let targetZoom = 3.0; // Default zoom level (far)
let currentZoom = 3.0;

const width = 512,
  height = 512;
let settings = {
  baseShape: "Sphere", // Current base shape
  noiseScale: 0.1,
  pointSize: 3.5, // Larger point size for better visibility
  particleColor: "#ffffff",
  opacity: 0.8,
  morphSpeed: 0.05,
  zoomSpeed: 0.05, // Speed of zoom effect
  minZoom: 2.0, // Minimum zoom level (close)
  maxZoom: 5.0, // Maximum zoom level (far)
  shapeScale: 3.0, // Scale of base shape for larger visibility
  particleCount: 262144 // New setting for particle count (512 * 512)
};

init();
animate();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = currentZoom; // Initialize camera zoom

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  createParticles(settings.baseShape);

  window.addEventListener("resize", onWindowResize);
  window.addEventListener("click", onClick);

  // Dat.GUI setup
  const gui = new GUI();
  gui
    .add(settings, "baseShape", ["Sphere", "Cube", "Torus"])
    .name("Base Shape")
    .onChange((value) => {
      scene.remove(pointCloud); // Remove the old particle system
      createParticles(value); // Create a new particle system with selected base shape
    });
  gui
    .add(settings, "pointSize", 0.1, 10.0)
    .name("Point Size")
    .onChange((value) => {
      particleMaterial.uniforms.pointSize.value = value;
    });
  gui
    .addColor(settings, "particleColor")
    .name("Particle Color")
    .onChange((value) => {
      particleMaterial.uniforms.color.value.set(value);
    });
  gui
    .add(settings, "opacity", 0.1, 1.0)
    .name("Opacity")
    .onChange((value) => {
      particleMaterial.uniforms.opacity.value = value;
    });
  gui.add(settings, "morphSpeed", 0.01, 0.1).name("Morph Speed");
  gui.add(settings, "zoomSpeed", 0.01, 0.1).name("Zoom Speed");
  gui
    .add(settings, "shapeScale", 1.0, 10.0)
    .name("Shape Scale")
    .onChange(() => {
      scene.remove(pointCloud);
      createParticles(settings.baseShape); // Recreate particles to apply new shape scale
    });
  // Add particle count control
  gui
    .add(settings, "particleCount", 1000, 300000)
    .step(1000)
    .name("Particle Count")
    .onChange(() => {
      scene.remove(pointCloud);
      createParticles(settings.baseShape);
    });
}

function createParticles(baseShape) {
  // Particle geometry setup
  particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(settings.particleCount * 3);

  // Choose the base shape for particle arrangement
  switch (baseShape) {
    case "Cube":
      createCubeShape(positions);
      break;
    case "Torus":
      createTorusShape(positions);
      break;
    case "Sphere":
    default:
      createSphereShape(positions);
  }

  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );

  // Particle material
  particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
      pointSize: { value: settings.pointSize },
      color: { value: new THREE.Color(settings.particleColor) },
      opacity: { value: settings.opacity },
      time: { value: 0.0 }
    },
    vertexShader: `
      uniform float pointSize;
      uniform float time;
      varying float vNoise;
      void main() {
        vec3 pos = position;
        float noiseVal = sin(time + position.x * 10.0) * 0.6;
        vNoise = noiseVal;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = pointSize * (1.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float opacity;
      varying float vNoise;
      void main() {
        float alpha = smoothstep(0.4, 0.8, vNoise);
        gl_FragColor = vec4(color, alpha * opacity);
      }
    `,
    transparent: true
  });

  pointCloud = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(pointCloud);
}

// Functions for different shapes
function createSphereShape(positions) {
  for (let i = 0; i < settings.particleCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const radius = Math.random() * 0.65 + 0.65; // Radius size centered around the origin

    const x = settings.shapeScale * radius * Math.sin(phi) * Math.cos(theta);
    const y = settings.shapeScale * radius * Math.sin(phi) * Math.sin(theta);
    const z = settings.shapeScale * radius * Math.cos(phi);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
}

function createCubeShape(positions) {
  for (let i = 0; i < settings.particleCount; i++) {
    const x = (Math.random() * 2 - 1) * settings.shapeScale;
    const y = (Math.random() * 2 - 1) * settings.shapeScale;
    const z = (Math.random() * 2 - 1) * settings.shapeScale;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
}

function createTorusShape(positions) {
  const radius = settings.shapeScale;
  const tubeRadius = settings.shapeScale * 0.3;
  for (let i = 0; i < settings.particleCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 2;

    const x = (radius + tubeRadius * Math.cos(theta)) * Math.cos(phi);
    const y = (radius + tubeRadius * Math.cos(theta)) * Math.sin(phi);
    const z = tubeRadius * Math.sin(theta);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onClick() {
  // Toggle between noise scales and zoom levels
  if (isMorphing) {
    targetNoiseScale = 0.1;
    targetZoom = settings.maxZoom; // Zoom out
  } else {
    targetNoiseScale = 5.0;
    targetZoom = settings.minZoom; // Zoom in
  }
  isMorphing = !isMorphing;
}

function animate() {
  requestAnimationFrame(animate);

  const time = performance.now() * 0.001;

  particleMaterial.uniforms.time.value = time * settings.morphSpeed;

  // Gradually morph noise scale
  currentNoiseScale += (targetNoiseScale - currentNoiseScale) * 0.02;
  settings.noiseScale = currentNoiseScale;

  // Gradually zoom in/out
  currentZoom += (targetZoom - currentZoom) * settings.zoomSpeed;
  camera.position.z = currentZoom;

  // Apply Simplex noise to the particle positions for morphing
  const positions = particleGeometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    // Keep morphing noise effect centered
    const noiseValue = simplex.noise3D(
      x * settings.noiseScale,
      y * settings.noiseScale,
      z * settings.noiseScale
    );
    positions[i] = x + noiseValue * 0.02; // Apply a small offset based on noise
    positions[i + 1] = y + noiseValue * 0.02;
    positions[i + 2] = z + noiseValue * 0.02;
  }

  particleGeometry.attributes.position.needsUpdate = true;

  // Render the scene
  renderer.render(scene, camera);
}