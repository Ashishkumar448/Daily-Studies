import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js";
import { RectAreaLightUniformsLib } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { RectAreaLightHelper } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/helpers/RectAreaLightHelper.js";
import Stats from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/libs/stats.module.js";
import { GUI } from "https://cdn.skypack.dev/dat.gui";
import { EffectComposer } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/UnrealBloomPass.js";

let renderer, scene, camera;
let stats, tetrahedron, tetrahedronFrame;
let rectLight1, rectLight2, rectLight3;
let composer, noisePass, bwPass, bloomPass;
let gui, params;

init();

function init() {
  params = {
    rotationSpeed: 1,
    light1Intensity: 12,
    light1Width: 1,
    light1Height: 20,
    light2Intensity: 12,
    light2Width: 1,
    light2Height: 20,
    light3Intensity: 12,
    light3Width: 1,
    light3Height: 20,
    noiseAmount: 0.08,
    blackAndWhite: 1,
    bloomStrength: 1,
    bloomRadius: 1,
    bloomThreshold: 0
  };

  RectAreaLightUniformsLib.init();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animation);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  document.body.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(0, 5, -15);

  scene = new THREE.Scene();

  // Environment map
  const envMap = new THREE.CubeTextureLoader()
    .setPath(
      "https://cdn.skypack.dev/three@0.136.0/examples/textures/cube/Park3Med/"
    )
    .load(["px.jpg", "nx.jpg", "py.jpg", "ny.jpg", "pz.jpg", "nz.jpg"]);
  scene.background = envMap;
  scene.environment = envMap;

  rectLight1 = new THREE.RectAreaLight(
    0xff0000,
    params.light1Intensity,
    params.light1Width,
    params.light1Height
  );
  rectLight1.position.set(-5, 5, 5);
  rectLight1.helper = new RectAreaLightHelper(rectLight1);
  scene.add(rectLight1);
  scene.add(rectLight1.helper);

  rectLight2 = new THREE.RectAreaLight(
    0x00ff00,
    params.light2Intensity,
    params.light2Width,
    params.light2Height
  );
  rectLight2.position.set(0, 5, 5);
  rectLight2.helper = new RectAreaLightHelper(rectLight2);
  scene.add(rectLight2);
  scene.add(rectLight2.helper);

  rectLight3 = new THREE.RectAreaLight(
    0x0000ff,
    params.light3Intensity,
    params.light3Width,
    params.light3Height
  );
  rectLight3.position.set(5, 5, 5);
  rectLight3.helper = new RectAreaLightHelper(rectLight3);
  scene.add(rectLight3);
  scene.add(rectLight3.helper);

  const geoFloor = new THREE.BoxGeometry(2000, 0.1, 2000);
  const matStdFloor = new THREE.MeshStandardMaterial({
    color: 0xbcbcbc,
    roughness: 0.1,
    metalness: 0
  });
  const mshStdFloor = new THREE.Mesh(geoFloor, matStdFloor);
  scene.add(mshStdFloor);

  // Add tetrahedrons
  const geometry = new THREE.TetrahedronGeometry(3, 0);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0,
    metalness: 0,
    envMap: envMap
  });
  tetrahedron = new THREE.Mesh(geometry, material);
  tetrahedron.position.set(0, 5, 0);
  scene.add(tetrahedron);

  const geometryFrame = new THREE.TetrahedronGeometry(5, 1);
  const materialFrame = new THREE.MeshBasicMaterial({
    wireframe: true,
    transparent: true,
    opacity: 0.1,
    color: 0xffffff
  });
  tetrahedronFrame = new THREE.Mesh(geometryFrame, materialFrame);
  tetrahedronFrame.position.set(0, 5, 0);
  scene.add(tetrahedronFrame);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(tetrahedron.position);
  controls.update();

  // Post-processing
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  // Noise shader
  const noiseShader = {
    uniforms: {
      tDiffuse: { value: null },
      amount: { value: params.noiseAmount }
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
                    uniform float amount;
                    varying vec2 vUv;
                    float random(vec2 co) {
                        return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
                    }
                    void main() {
                        vec4 color = texture2D(tDiffuse, vUv);
                        float noise = (random(vUv * 100.0) - 0.5) * amount;
                        color.rgb += noise;
                        gl_FragColor = color;
                    }
                `
  };

  noisePass = new ShaderPass(noiseShader);
  composer.addPass(noisePass);

  // Black and white shader
  const bwShader = {
    uniforms: {
      tDiffuse: { value: null },
      amount: { value: params.blackAndWhite }
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
                    uniform float amount;
                    varying vec2 vUv;
                    void main() {
                        vec4 color = texture2D(tDiffuse, vUv);
                        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                        gl_FragColor = mix(color, vec4(gray, gray, gray, color.a), amount);
                    }
                `
  };

  bwPass = new ShaderPass(bwShader);
  composer.addPass(bwPass);

  // Bloom pass
  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    params.bloomStrength,
    params.bloomRadius,
    params.bloomThreshold
  );
  composer.addPass(bloomPass);

  window.addEventListener("resize", onWindowResize);

  stats = new Stats();
  document.body.appendChild(stats.dom);

  // GUI
  gui = new GUI();
  gui.add(params, "rotationSpeed", 0, 5);

  const light1Folder = gui.addFolder("Red Light");
  light1Folder.add(params, "light1Intensity", 0, 20).onChange((value) => {
    rectLight1.intensity = value;
  });
  light1Folder.addColor(rectLight1, "color");
  light1Folder.add(params, "light1Width", 0.1, 20).onChange((value) => {
    rectLight1.width = value;
    updateLightHelper(rectLight1);
  });
  light1Folder.add(params, "light1Height", 1, 20).onChange((value) => {
    rectLight1.height = value;
    updateLightHelper(rectLight1);
  });

  const light2Folder = gui.addFolder("Green Light");
  light2Folder.add(params, "light2Intensity", 0, 20).onChange((value) => {
    rectLight2.intensity = value;
  });
  light2Folder.addColor(rectLight2, "color");
  light2Folder.add(params, "light2Width", 0.1, 20).onChange((value) => {
    rectLight2.width = value;
    updateLightHelper(rectLight2);
  });
  light2Folder.add(params, "light2Height", 1, 20).onChange((value) => {
    rectLight2.height = value;
    updateLightHelper(rectLight2);
  });

  const light3Folder = gui.addFolder("Blue Light");
  light3Folder.add(params, "light3Intensity", 0, 20).onChange((value) => {
    rectLight3.intensity = value;
  });
  light3Folder.addColor(rectLight3, "color");
  light3Folder.add(params, "light3Width", 0.1, 20).onChange((value) => {
    rectLight3.width = value;
    updateLightHelper(rectLight3);
  });
  light3Folder.add(params, "light3Height", 1, 20).onChange((value) => {
    rectLight3.height = value;
    updateLightHelper(rectLight3);
  });

  gui.add(params, "noiseAmount", 0, 0.5).onChange((value) => {
    noisePass.uniforms.amount.value = value;
  });

  gui.add(params, "blackAndWhite", 0, 1).onChange((value) => {
    bwPass.uniforms.amount.value = value;
  });

  gui.add(params, "bloomStrength", 0, 3).onChange((value) => {
    bloomPass.strength = Number(value);
  });

  gui.add(params, "bloomRadius", 0, 1).onChange((value) => {
    bloomPass.radius = Number(value);
  });

  gui.add(params, "bloomThreshold", 0, 1).onChange((value) => {
    bloomPass.threshold = Number(value);
  });
}

function updateLightHelper(light) {
  scene.remove(light.helper);
  light.helper = new RectAreaLightHelper(light);
  scene.add(light.helper);
}

function onWindowResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  composer.setSize(window.innerWidth, window.innerHeight);
}

function animation(time) {
  tetrahedron.rotation.y = time * 0.001 * params.rotationSpeed;
  tetrahedronFrame.rotation.y = time * 0.0005 * params.rotationSpeed;

  composer.render();
  stats.update();
}