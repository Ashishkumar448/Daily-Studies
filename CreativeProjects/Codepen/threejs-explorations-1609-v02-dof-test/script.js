// Import necessary modules from Three.js
import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/ShaderPass.js";
import { BokehPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/BokehPass.js";
import { RGBELoader } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/RGBELoader.js";

let scene,
  camera,
  renderer,
  shape1,
  rubikCube,
  composer,
  controls,
  bokehPass,
  grainPass;
let gui, params;

function init() {
  // Scene setup
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 1); // Black background
  renderer.outputEncoding = THREE.sRGBEncoding; // Enhance color rendering
  document.body.appendChild(renderer.domElement);

  // OrbitControls setup
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.screenSpacePanning = false;
  controls.minDistance = 0.1;
  controls.maxDistance = 50;
  controls.maxPolarAngle = Math.PI;

  // Material: Soft white to highlight DOF effect
  const softMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.8,
    clearcoat: 0.9,
    clearcoatRoughness: 0.4
  });

  // Shape 1: TorusKnot with soft white material
  const geometry1 = new THREE.TorusKnotGeometry(0.7, 0.2, 150, 20);
  shape1 = new THREE.Mesh(geometry1, softMaterial);
  shape1.position.set(-1.2, 0, 0);
  scene.add(shape1);

  // Create a Rubik's Cube-like structure with soft white material
  rubikCube = new THREE.Group();
  const cubeSize = 0.3;
  const gap = 0.05;
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (Math.abs(x) + Math.abs(y) + Math.abs(z) !== 0) {
          const cubeGeometry = new THREE.BoxGeometry(
            cubeSize,
            cubeSize,
            cubeSize
          );
          const cube = new THREE.Mesh(cubeGeometry, softMaterial.clone());
          cube.position.set(
            x * (cubeSize + gap),
            y * (cubeSize + gap),
            z * (cubeSize + gap)
          );
          rubikCube.add(cube);
        }
      }
    }
  }
  rubikCube.position.set(1.2, 0, 0);
  scene.add(rubikCube);

  // Lighting setup
  // Ambient light to provide soft overall illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // Soft ambient light
  scene.add(ambientLight);

  // Soft box light effect using a large area light (simulated with a directional light)
  const boxLight = new THREE.DirectionalLight(0xffffff, 0.5);
  boxLight.position.set(5, 5, 5); // Positioning the light to create soft shadows
  boxLight.castShadow = true;
  boxLight.shadow.mapSize.width = 4096; // High resolution for softer shadows
  boxLight.shadow.mapSize.height = 4096;
  boxLight.shadow.radius = 10; // Increase blur radius for softer shadows
  boxLight.shadow.bias = -0.005; // Adjust bias to reduce shadow artifacts
  scene.add(boxLight);

  // HDR Environment Map for soft lighting and reflections
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  new RGBELoader().load(
    "https://modelviewer.dev/shared-assets/environments/spruit_sunrise_1k.hdr", // Soft HDRI environment map
    (texture) => {
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      scene.environment = envMap;
      scene.background = null; // Keep the background black
      texture.dispose();
      pmremGenerator.dispose();
    }
  );

  camera.position.z = 2;

  // Set up post-processing with EffectComposer
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  // High-quality BokehPass for refined DOF effect
  bokehPass = new BokehPass(scene, camera, {
    focus: 0.8, // Set focus closer to simulate macro photography
    aperture: 0.00015, // Lower aperture for softer, high-quality blur
    maxblur: 0.03, // Increased blur strength for visible DOF
    width: window.innerWidth,
    height: window.innerHeight
  });
  composer.addPass(bokehPass);

  // Film grain effect
  const grainShader = {
    uniforms: {
      tDiffuse: { value: null },
      time: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float time;
      varying vec2 vUv;

      // Simple noise function for grain effect
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        float grain = random(vUv + time) * 0.05; // Adjust grain intensity
        color.rgb += grain; // Add grain to the color
        gl_FragColor = vec4(color.rgb, 1.0);
      }
    `
  };

  grainPass = new ShaderPass(grainShader);
  composer.addPass(grainPass);

  // GUI for tweaking DOF parameters
  gui = new dat.GUI();
  params = {
    focalDepth: 0.8,
    aperture: 0.00015,
    maxBlur: 0.03
  };

  gui
    .add(params, "focalDepth", 0, 10, 0.01)
    .name("Focal Depth")
    .onChange((value) => {
      bokehPass.uniforms.focus.value = value;
    });

  gui
    .add(params, "aperture", 0.00005, 0.005, 0.00001)
    .name("Aperture")
    .onChange((value) => {
      bokehPass.uniforms.aperture.value = value;
    });

  gui
    .add(params, "maxBlur", 0, 0.1, 0.001)
    .name("Max Blur")
    .onChange((value) => {
      bokehPass.uniforms.maxblur.value = value;
    });

  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  controls.update();
  grainPass.uniforms.time.value += 0.01; // Animate grain over time
  composer.render();
}

init();
animate();