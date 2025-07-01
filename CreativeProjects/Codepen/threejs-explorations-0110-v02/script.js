import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js";
import dat from "https://cdn.skypack.dev/dat.gui";

let scene, camera, renderer, container;
let primitive;
let mat;
let gui;
let start;

const options = {
  camera: {
    zoom: 12
  },
  perlin: {
    vel: 0.002,
    speed: 0.00001,
    perlins: 1.0,
    decay: 0.1,
    complex: 0.3,
    waves: 20.0,
    fragment: true
  },
  spin: {
    sinVel: 0.0,
    ampVel: 80.0
  },
  grain: {
    strength: 0.5,
    intensity: 0.5
  },
  blackAndWhite: true,
  detail: 50,
  opacity: 0.5
};

function init() {
  createScene();
  createPrimitive();
  createGUI();
  start = Date.now();
  animate();
}

function createScene() {
  scene = new THREE.Scene();
  scene.background = null; // Set background to null for transparency

  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(55, aspect, 1, 1000);
  camera.position.z = options.camera.zoom;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // Enable alpha
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); // Set clear color with 0 alpha (fully transparent)

  container = document.getElementById("container");
  container.appendChild(renderer.domElement);

  window.addEventListener("resize", onWindowResize, false);
}

function createPrimitive() {
  const geometry = new THREE.IcosahedronBufferGeometry(3, options.detail);

  mat = new THREE.ShaderMaterial({
    wireframe: false,
    transparent: true, // Enable transparency
    uniforms: {
      time: { type: "f", value: 0.0 },
      pointscale: { type: "f", value: 0.0 },
      decay: { type: "f", value: 0.0 },
      complex: { type: "f", value: 0.0 },
      waves: { type: "f", value: 0.0 },
      fragment: { type: "i", value: true },
      grainStrength: { type: "f", value: 0.5 },
      grainIntensity: { type: "f", value: 0.5 },
      blackAndWhite: { type: "i", value: false },
      opacity: { type: "f", value: options.opacity }
    },
    vertexShader: document.getElementById("vertexShader").textContent,
    fragmentShader: document.getElementById("fragmentShader").textContent
  });

  const mesh = new THREE.Points(geometry, mat);
  primitive = new THREE.Object3D();
  primitive.add(mesh);
  scene.add(primitive);
}

function createGUI() {
  gui = new dat.GUI();

  const camFolder = gui.addFolder("Camera");
  camFolder.add(camera.position, "z", 3, 20).name("Zoom").listen();
  camFolder.add(options.perlin, "vel", 0.0, 0.02).name("Velocity").listen();

  const mathFolder = gui.addFolder("Math Options");
  mathFolder.add(options.spin, "sinVel", 0.0, 0.5).name("Sine").listen();
  mathFolder.add(options.spin, "ampVel", 0.0, 90.0).name("Amplitude").listen();

  const perlinFolder = gui.addFolder("Setup Perlin Noise");
  perlinFolder.add(options.perlin, "perlins", 1.0, 5.0).name("Size").step(1);
  perlinFolder.add(options.perlin, "speed", 0.0, 0.0005).name("Speed").listen();
  perlinFolder.add(options.perlin, "decay", 0.0, 1.0).name("Decay").listen();
  perlinFolder.add(options.perlin, "waves", 0.0, 20.0).name("Waves").listen();
  perlinFolder.add(options.perlin, "fragment").name("Fragment");
  perlinFolder
    .add(options.perlin, "complex", 0.1, 1.0)
    .name("Complex")
    .listen();

  const grainFolder = gui.addFolder("Grain Effect");
  grainFolder
    .add(options.grain, "strength", 0.0, 1.0)
    .name("Strength")
    .listen();
  grainFolder
    .add(options.grain, "intensity", 0.0, 1.0)
    .name("Intensity")
    .listen();

  gui.add(options, "blackAndWhite").name("Black & White");
  gui
    .add(options, "detail", 1, 100)
    .step(1)
    .name("Detail")
    .onChange(updateDetail);
  gui.add(options, "opacity", 0, 1).name("Opacity").onChange(updateOpacity);

  perlinFolder.open();
  grainFolder.open();
}

function updateDetail() {
  scene.remove(primitive);
  createPrimitive();
}

function updateOpacity(value) {
  mat.uniforms.opacity.value = value;
}

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
}

function animate() {
  requestAnimationFrame(animate);

  const performance = Date.now() * 0.003;

  primitive.rotation.y += options.perlin.vel;
  primitive.rotation.x =
    (Math.sin(performance * options.spin.sinVel) *
      options.spin.ampVel *
      Math.PI) /
    180;

  mat.uniforms["time"].value = options.perlin.speed * (Date.now() - start);
  mat.uniforms["pointscale"].value = options.perlin.perlins;
  mat.uniforms["decay"].value = options.perlin.decay;
  mat.uniforms["complex"].value = options.perlin.complex;
  mat.uniforms["waves"].value = options.perlin.waves;
  mat.uniforms["fragment"].value = options.perlin.fragment;
  mat.uniforms["grainStrength"].value = options.grain.strength;
  mat.uniforms["grainIntensity"].value = options.grain.intensity;
  mat.uniforms["blackAndWhite"].value = options.blackAndWhite;

  camera.lookAt(scene.position);
  renderer.render(scene, camera);
}

init();