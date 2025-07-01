import { EffectComposer } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/UnrealBloomPass.js";
import { FBXLoader } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/FBXLoader.js";

let scene, camera, renderer, shape1;
let mouseX = 0,
  mouseY = 0;
let gui, params;

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // Enable alpha for transparency
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); // Transparent background
  document.body.appendChild(renderer.domElement);

  // Shape 1: TorusKnot for a complex yet clean organic look
  const geometry1 = new THREE.TorusKnotGeometry(0.7, 0.2, 150, 20);

  // Shader material with enhanced grain and shadowing effects
  const customMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      resolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight)
      },
      noiseIntensity: { value: 0.2 } // Add noiseIntensity uniform
    },
    vertexShader: `
            varying vec3 vNormal;
            varying vec2 vUv;
            uniform float time;

            void main() {
                vNormal = normal;
                vUv = uv;
                vec3 pos = position;
                // Subtle shape distortion for a dynamic but stable look
                pos += normal * 0.01 * sin(time + position.y * 4.0);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
    fragmentShader: `
            varying vec3 vNormal;
            varying vec2 vUv;
            uniform float time;
            uniform vec2 resolution;
            uniform float noiseIntensity; // Use noiseIntensity uniform

            // Function for generating film grain
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }

            void main() {
                vec3 light = normalize(vec3(0.5, 0.8, 1.0));
                float intensity = pow(dot(vNormal, light) * 0.5 + 0.5, 1.5);
                vec3 color = vec3(intensity); // Monochrome intensity

                // Adding film grain texture with adjustable intensity
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                float grain = random(uv) * noiseIntensity - noiseIntensity / 2.0; // Grain controlled by noiseIntensity
                color += vec3(grain);

                // Vignette effect for soft shadows
                float vignette = smoothstep(0.4, 1.0, length(vUv - 0.5));
                color *= 1.0 - vignette * 0.4;

                gl_FragColor = vec4(color, 1.0);
            }
        `
  });

  // Create the mesh with the geometry and shader material
  shape1 = new THREE.Mesh(geometry1, customMaterial);
  shape1.position.set(0, 0, 0);

  scene.add(shape1);

  // Add lights to enhance visibility
  const ambientLight = new THREE.AmbientLight(0x999999); // Soft ambient light
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(2, 2, 5);
  scene.add(directionalLight);

  camera.position.z = 2; // Increased initial zoom level

  // Add dat.GUI controls
  gui = new dat.GUI();
  params = {
    noiseIntensity: 0.2,
    wireframe: false,
    zoom: 2 // Initial zoom level
  };

  gui
    .add(params, "noiseIntensity", 0, 0.5, 0.01)
    .name("Film Noise")
    .onChange((value) => {
      shape1.material.uniforms.noiseIntensity.value = value;
    });

  gui
    .add(params, "wireframe")
    .name("Wireframe Mode")
    .onChange((value) => {
      shape1.material.wireframe = value; // Switch the first shape's wireframe mode
    });

  gui
    .add(params, "zoom", 0.1, 12, 0.1)
    .name("Zoom")
    .onChange((value) => {
      camera.position.z = value; // Adjust camera position based on GUI input
    });

  document.addEventListener("mousemove", onDocumentMouseMove, false);
}

function onDocumentMouseMove(event) {
  mouseX = (event.clientX - window.innerWidth / 2) / 100;
  mouseY = (event.clientY - window.innerHeight / 2) / 100;
}

function animate() {
  requestAnimationFrame(animate);

  // Rotate shape based on mouse movement
  shape1.rotation.y += (mouseX - shape1.rotation.y) * 0.05;
  shape1.rotation.x += (mouseY - shape1.rotation.x) * 0.05;

  shape1.material.uniforms.time.value += 0.01;
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  shape1.material.uniforms.resolution.value.set(
    window.innerWidth,
    window.innerHeight
  );
}

window.addEventListener("resize", onWindowResize, false);

init();
animate();