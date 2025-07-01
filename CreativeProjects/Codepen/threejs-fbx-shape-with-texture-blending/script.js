import { EffectComposer } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js";
import { FBXLoader } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/FBXLoader.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js";

let scene, camera, renderer, shape1, composer, controls, light;
let gui, params;
let clock = new THREE.Clock();
let fallingCircles = []; // Array to hold falling circles

function init() {
  // Initialize scene and camera
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  // Create a transparent WebGLRenderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); // Full transparency
  document.body.appendChild(renderer.domElement);

  // Set up OrbitControls for smooth user interaction
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // Enables smooth, inertia-like damping on the controls
  controls.dampingFactor = 0.07; // How much the controls slow down after the user stops dragging
  controls.enableZoom = true; // Allows the user to zoom in and out
  controls.zoomSpeed = 0.5; // Controls the speed of zooming
  controls.minDistance = 0.5; // Minimum zoom distance
  controls.maxDistance = 15; // Maximum zoom distance

  // Set up post-processing composer and render pass
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  // Load a 3D model using FBXLoader
  const fbxLoader = new FBXLoader();
  fbxLoader.load(
    "https://miroleon.github.io/daily-assets/two_hands_01.fbx",
    function (object) {
      object.traverse(function (child) {
        if (child.isMesh) {
          child.material = createCustomMaterial();
        }
      });

      object.position.set(0, 0, 0);
      object.scale.setScalar(0.05);
      scene.add(object);
      shape1 = object;
    }
  );

  // Add lights to the scene
  light = new THREE.DirectionalLight(0xffffff, 1.5); // Increased intensity
  light.position.set(3, 3, 5); // Adjusted position for better lighting
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0x999999, 0.3); // Increased ambient light for better visibility
  scene.add(ambientLight);

  camera.position.z = 2;

  // Create small circular shapes and add them to the scene
  createFallingCircles(6);

  // Set up dat.GUI for parameter controls
  gui = new dat.GUI();
  params = {
    noiseIntensity: 0.2,
    wireframe: false,
    zoom: 2,
    fallingSpeed: 0.005 // Adjust speed of falling circles
  };

  gui
    .add(params, "noiseIntensity", 0, 0.5, 0.01)
    .name("Film Noise")
    .onChange((value) => {
      if (shape1) {
        shape1.traverse((child) => {
          if (child.isMesh) {
            child.material.uniforms.noiseIntensity.value = value;
          }
        });
      }
    });

  gui
    .add(params, "wireframe")
    .name("Wireframe Mode")
    .onChange((value) => {
      if (shape1) {
        shape1.traverse((child) => {
          if (child.isMesh) {
            child.material.wireframe = value;
          }
        });
      }
    });

  gui
    .add(params, "zoom", 0.1, 12, 0.1)
    .name("Zoom")
    .onChange((value) => {
      camera.position.z = value;
    });

  gui.add(params, "fallingSpeed", 0.001, 0.05, 0.001).name("Falling Speed");

  window.addEventListener("resize", onWindowResize, false);
}

function createFallingCircles(count) {
  const circleMaterial = createCustomMaterial(); // Use the same custom material

  for (let i = 0; i < count; i++) {
    const radius = Math.random() * 0.05 + 0.02; // Random radius for each circle
    const circleGeometry = new THREE.SphereGeometry(radius, 32, 32); // Create perfectly circular shapes
    const circle = new THREE.Mesh(circleGeometry, circleMaterial);
    circle.position.set(
      Math.random() * 2 - 1, // Random x position
      Math.random() * 2 + 1, // Random y position above the scene
      Math.random() * 2 - 1 // Random z position
    );
    fallingCircles.push(circle);
    scene.add(circle);
  }
}

function createCustomMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      resolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight)
      },
      noiseIntensity: { value: 0.2 }
    },
    vertexShader: `
            varying vec3 vNormal;
            varying vec2 vUv;
            uniform float time;

            void main() {
                vNormal = normal;
                vUv = uv;
                vec3 pos = position;
                pos += normal * 0.01 * sin(time + position.y * 4.0);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
    fragmentShader: `
            varying vec3 vNormal;
            varying vec2 vUv;
            uniform float time;
            uniform vec2 resolution;
            uniform float noiseIntensity;

            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }

            void main() {
                vec3 light = normalize(vec3(0.7, 0.9, 1.2)); // Adjust light direction to enhance highlights
                float intensity = pow(dot(vNormal, light) * 0.7 + 0.7, 2.0); // Increased exponent for more contrast
                vec3 color = vec3(intensity);

                vec2 uv = gl_FragCoord.xy / resolution.xy;
                float grain = random(uv) * noiseIntensity - noiseIntensity / 2.0;
                color += vec3(grain);

                float vignette = smoothstep(0.3, 1.0, length(vUv - 0.5));
                color *= 1.0 - vignette * 0.5; // Increased vignette to deepen shadows

                gl_FragColor = vec4(color, 1.0);
            }
        `
  });
}

function animate() {
  requestAnimationFrame(animate);

  let elapsedTime = clock.getElapsedTime();

  if (shape1) {
    shape1.position.y = Math.sin(elapsedTime * 0.5) * 0.1;
    shape1.position.x = Math.cos(elapsedTime * 0.3) * 0.05;

    shape1.traverse((child) => {
      if (child.isMesh) {
        child.material.uniforms.time.value += 0.01;
      }
    });
  }

  // Animate falling circles
  fallingCircles.forEach((circle) => {
    circle.position.y -= params.fallingSpeed; // Use the GUI adjustable falling speed
    // Check if the circle is out of the canvas
    if (circle.position.y < -1.5) {
      // Adjust threshold for resetting circle
      circle.position.y = Math.random() * 2 + 1;
      circle.position.x = Math.random() * 2 - 1;
      circle.position.z = Math.random() * 2 - 1;
    }
  });

  controls.update();

  // Render the scene with the composer, which now only includes the RenderPass
  composer.render();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);

  if (shape1) {
    shape1.traverse((child) => {
      if (child.isMesh) {
        child.material.uniforms.resolution.value.set(
          window.innerWidth,
          window.innerHeight
        );
      }
    });
  }
}

init();
animate();