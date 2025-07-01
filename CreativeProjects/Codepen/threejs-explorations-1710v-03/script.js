import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { GUI } from "https://cdn.skypack.dev/dat.gui";

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.sortObjects = true;
document.body.appendChild(renderer.domElement);

const backgroundCanvas = document.createElement("canvas");
backgroundCanvas.width = 256;
backgroundCanvas.height = 256;
const ctx = backgroundCanvas.getContext("2d");
const gradient = ctx.createLinearGradient(0, 0, 256, 256);
gradient.addColorStop(0, "#000033");
gradient.addColorStop(1, "#660066");
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 256, 256);
const backgroundTexture = new THREE.CanvasTexture(backgroundCanvas);

const geometry = new THREE.PlaneGeometry(2, 2);
const uniforms = {
  iResolution: {
    value: new THREE.Vector2(window.innerWidth, window.innerHeight)
  },
  iTime: { value: 0 },
  iMouse: { value: new THREE.Vector2() },
  iChannel0: { value: backgroundTexture },
  shapeType: { value: 0 },
  materialType: { value: 2 },
  shapeSize: { value: 1.4 },
  shapeColor: { value: new THREE.Vector4(0.2, 0.12, 1.0, 1.0) },
  followMouse: { value: false },
  armLength: { value: 0.5 },
  armWidth: { value: 0.15 },
  rotationSpeedX: { value: 0.5 },
  rotationSpeedY: { value: 1.0 },
  rotationSpeedZ: { value: 0.0 },
  bevelSize: { value: 0.06 },
  transparency: { value: 0.5 }
};

const material = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: document.getElementById("vertexShader").textContent,
  fragmentShader: document.getElementById("fragmentShader").textContent,
  transparent: true,
  depthWrite: false
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

window.addEventListener("resize", onWindowResize, false);
document.addEventListener("mousemove", onMouseMove, false);

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  uniforms.iResolution.value.set(width, height);
}

function onMouseMove(event) {
  uniforms.iMouse.value.set(event.clientX, event.clientY);
}

function animate(time) {
  requestAnimationFrame(animate);
  uniforms.iTime.value = time * 0.001;
  renderer.render(scene, camera);
}

animate();

const controls = {
  shapeType: 0,
  materialType: 2,
  shapeSize: 1.4,
  shapeColor: [0.2, 0.12, 1.0],
  followMouse: false,
  armLength: 0.5,
  armWidth: 0.15,
  rotationSpeedX: 0.5,
  rotationSpeedY: 1.0,
  rotationSpeedZ: 0.0,
  bevelSize: 0.06,
  transparency: 0.5
};

function createGUI() {
  const gui = new GUI();
  gui
    .add(controls, "shapeType", {
      Cross: 0,
      Sphere: 1,
      Torus: 2,
      Octahedron: 3,
      Capsule: 4,
      Mandelbulb: 5
    })
    .onChange(updateUniforms);
  gui
    .add(controls, "materialType", { Metallic: 0, Plastic: 1, Glass: 2 })
    .onChange(updateUniforms);
  gui.add(controls, "shapeSize", 0.1, 2.0).onChange(updateUniforms);
  gui.addColor(controls, "shapeColor").onChange(updateUniforms);
  gui.add(controls, "followMouse").onChange(updateUniforms);
  gui.add(controls, "armLength", 0.1, 1.0).onChange(updateUniforms);
  gui.add(controls, "armWidth", 0.01, 0.5).onChange(updateUniforms);
  gui.add(controls, "rotationSpeedX", -5.0, 5.0).onChange(updateUniforms);
  gui.add(controls, "rotationSpeedY", -5.0, 5.0).onChange(updateUniforms);
  gui.add(controls, "rotationSpeedZ", -5.0, 5.0).onChange(updateUniforms);
  gui.add(controls, "bevelSize", 0.0, 0.1).onChange(updateUniforms);
  gui.add(controls, "transparency", 0, 1).onChange(updateUniforms);
}

function updateUniforms() {
  uniforms.shapeType.value = controls.shapeType;
  uniforms.materialType.value = controls.materialType;
  uniforms.shapeSize.value = controls.shapeSize;
  uniforms.shapeColor.value.set(
    controls.shapeColor[0],
    controls.shapeColor[1],
    controls.shapeColor[2],
    1.0
  );
  uniforms.followMouse.value = controls.followMouse;
  uniforms.armLength.value = controls.armLength;
  uniforms.armWidth.value = controls.armWidth;
  uniforms.rotationSpeedX.value = controls.rotationSpeedX;
  uniforms.rotationSpeedY.value = controls.rotationSpeedY;
  uniforms.rotationSpeedZ.value = controls.rotationSpeedZ;
  uniforms.bevelSize.value = controls.bevelSize;
  uniforms.transparency.value = controls.transparency;
}

createGUI();