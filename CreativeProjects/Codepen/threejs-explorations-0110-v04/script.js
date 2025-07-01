import * as THREE from "https://cdn.skypack.dev/three@0.133.1";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.133.1/examples/jsm/controls/OrbitControls.js";
import { TextGeometry } from "https://cdn.skypack.dev/three@0.133.1/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from "https://cdn.skypack.dev/three@0.133.1/examples/jsm/loaders/FontLoader.js";
import { RGBELoader } from "https://cdn.skypack.dev/three@0.133.1/examples/jsm/loaders/RGBELoader.js";
import { EffectComposer } from "https://cdn.skypack.dev/three@0.133.1/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.skypack.dev/three@0.133.1/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://cdn.skypack.dev/three@0.133.1/examples/jsm/postprocessing/ShaderPass.js";

let scene, camera, renderer, controls;
let text, transmissionMaterial;
let composer;

init();
animate();

function init() {
  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf2f2f5);

  // Camera setup (PerspectiveCamera for better angle view)
  camera = new THREE.PerspectiveCamera(
    60, // Field of view
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(10, 20, 20); // Positioned at an angle
  camera.lookAt(0, 0, 0); // Look at the center of the scene

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true; // Enable shadow maps
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0; // Reduced exposure for balanced brightness
  renderer.physicallyCorrectLights = true; // Enable physically correct lighting
  document.body.appendChild(renderer.domElement);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = true;
  controls.minPolarAngle = Math.PI / 3; // Allow some vertical rotation
  controls.maxPolarAngle = Math.PI / 3;
  controls.enablePan = false; // Disable panning to match React example

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // Directional light to cast shadows
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 10, 10);
  directionalLight.castShadow = true;

  // Configure shadow properties for soft shadows
  directionalLight.shadow.mapSize.width = 2048; // Increased shadow map resolution
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.radius = 8; // Increased shadow radius for softness
  directionalLight.shadow.bias = -0.0005; // Adjusted shadow bias to reduce artifacts

  // Optionally, visualize the shadow camera frustum
  // const helper = new THREE.CameraHelper(directionalLight.shadow.camera);
  // scene.add(helper);

  scene.add(directionalLight);

  // Load HDR environment and create text
  new RGBELoader()
    .setDataType(THREE.UnsignedByteType)
    .load(
      "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr",
      function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
        createText(texture);
        setupPostprocessing();
      }
    );

  // Ground plane to receive shadows
  const groundGeo = new THREE.PlaneGeometry(100, 100);
  const groundMat = new THREE.ShadowMaterial({ opacity: 0.3 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = -1.01;
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Grid helper
  const gridHelper = new THREE.GridHelper(50, 50, 0xbbbbbb, 0xbbbbbb);
  gridHelper.position.y = -1;
  scene.add(gridHelper);

  window.addEventListener("resize", onWindowResize);
}

function createText(envMap) {
  const loader = new FontLoader();
  loader.load(
    "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
    function (font) {
      const textGeometry = new TextGeometry("Inter", {
        font: font,
        size: 3,
        height: 0.55,
        curveSegments: 64,
        bevelEnabled: true,
        bevelThickness: 0.01,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 8
      });

      // Center the text geometry
      textGeometry.computeBoundingBox();
      const bbox = textGeometry.boundingBox;
      const centerX = -0.5 * (bbox.max.x + bbox.min.x);
      const centerY = -0.5 * (bbox.max.y + bbox.min.y);
      const centerZ = -0.5 * (bbox.max.z + bbox.min.z);
      textGeometry.translate(centerX, centerY, centerZ);

      transmissionMaterial = new THREE.MeshPhysicalMaterial({
        transmission: 1,
        thickness: 0.3,
        roughness: 0,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.0,
        color: 0xffffff,
        ior: 1.25,
        side: THREE.DoubleSide,
        envMap: envMap,
        envMapIntensity: 1.0, // Reduced for less reflection brightness
        specularIntensity: 1,
        specularColor: new THREE.Color(0xffffff)
      });

      text = new THREE.Mesh(textGeometry, transmissionMaterial);
      text.position.set(0, -1, 2.25);
      text.rotation.x = -Math.PI / 2; // Lie flat on the ground
      text.castShadow = true;
      text.receiveShadow = true;
      scene.add(text);
    }
  );
}

function setupPostprocessing() {
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Brightness and Contrast Shader Pass
  const brightnessContrastShader = {
    uniforms: {
      tDiffuse: { value: null },
      brightness: { value: 0.0 }, // Start with no brightness adjustment
      contrast: { value: 0.2 } // Slightly increase contrast
    },
    vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
        `,
    fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform float brightness;
            uniform float contrast;
            varying vec2 vUv;

            void main() {
                vec4 color = texture2D(tDiffuse, vUv);
                color.rgb += brightness;
                if (contrast > 0.0) {
                    color.rgb = (color.rgb - 0.5) / (1.0 - contrast) + 0.5;
                } else {
                    color.rgb = (color.rgb - 0.5) * (1.0 + contrast) + 0.5;
                }
                gl_FragColor = color;
            }
        `
  };

  const brightnessContrastPass = new ShaderPass(brightnessContrastShader);
  brightnessContrastPass.uniforms["brightness"].value = 0.0; // No added brightness
  brightnessContrastPass.uniforms["contrast"].value = 0.2; // Slight contrast increase
  composer.addPass(brightnessContrastPass);
}

function onWindowResize() {
  // Update camera aspect ratio and projection matrix
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // Update renderer size
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Update composer size
  if (composer) {
    composer.setSize(window.innerWidth, window.innerHeight);
  }
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // Render the scene with postprocessing
  if (composer) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
}