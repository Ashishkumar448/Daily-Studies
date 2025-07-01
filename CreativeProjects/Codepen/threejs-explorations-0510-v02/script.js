import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js";
import { GUI } from "https://cdn.skypack.dev/dat.gui";

let scene, camera, renderer, controls;
let outerTorus, innerTorus, mouseSphere;
let cubeRenderTarget, cubeCamera;
let backgroundTexture, backgroundMesh;
let mouse = new THREE.Vector2();

const PARAMS = {
  material: {
    color: "#FFFFFF",
    metalness: 0.0,
    roughness: 0.1,
    transmission: 1.0,
    thickness: 1.0,
    ior: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.1
  },
  rotationSpeed: 0.5
};

async function init() {
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 0);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 10);

  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  await setupBackground();
  setupLights();
  createMaterials();
  createShapes();
  setupGUI();

  window.addEventListener("resize", onWindowResize, false);
  document.addEventListener("mousemove", onMouseMove, false);

  animate();
}

function setupLights() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);
}

async function setupBackground() {
  const loader = new THREE.TextureLoader();
  backgroundTexture = await new Promise((resolve) => {
    loader.load(
      "https://images.unsplash.com/photo-1504805572947-34fad45aed93?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      resolve
    );
  });

  updateBackgroundSize();
}

function updateBackgroundSize() {
  if (backgroundTexture) {
    const aspect = window.innerWidth / window.innerHeight;
    const imageAspect =
      backgroundTexture.image.width / backgroundTexture.image.height;

    let scale;
    if (aspect > imageAspect) {
      scale = new THREE.Vector2(1, imageAspect / aspect);
    } else {
      scale = new THREE.Vector2(aspect / imageAspect, 1);
    }

    backgroundTexture.offset.set((1 - scale.x) / 2, (1 - scale.y) / 2);
    backgroundTexture.repeat.set(scale.x, scale.y);

    scene.background = backgroundTexture;
  }
}

function createMaterials() {
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(PARAMS.material.color),
    metalness: PARAMS.material.metalness,
    roughness: PARAMS.material.roughness,
    transmission: PARAMS.material.transmission,
    thickness: PARAMS.material.thickness,
    ior: PARAMS.material.ior,
    clearcoat: PARAMS.material.clearcoat,
    clearcoatRoughness: PARAMS.material.clearcoatRoughness,
    side: THREE.DoubleSide,
    transparent: true,
    envMapIntensity: 1,
    refractionRatio: 0.98
  });

  cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
    format: THREE.RGBAFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter
  });
  cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
  glassMaterial.envMap = cubeRenderTarget.texture;
  glassMaterial.envMap.mapping = THREE.CubeRefractionMapping;

  return glassMaterial;
}

function createShapes() {
  const glassMaterial = createMaterials();
  const outerTorusGeometry = new THREE.TorusGeometry(2, 0.6, 64, 64);
  const innerTorusGeometry = new THREE.TorusGeometry(1, 0.3, 64, 64);
  const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);

  outerTorus = new THREE.Mesh(outerTorusGeometry, glassMaterial);
  innerTorus = new THREE.Mesh(innerTorusGeometry, glassMaterial);
  mouseSphere = new THREE.Mesh(sphereGeometry, glassMaterial);

  outerTorus.position.x = 0;
  innerTorus.position.x = 0;

  scene.add(outerTorus);
  scene.add(innerTorus);
  scene.add(mouseSphere);
}

function setupGUI() {
  const gui = new GUI();
  const matFolder = gui.addFolder("Material");
  matFolder.addColor(PARAMS.material, "color").onChange((value) => {
    outerTorus.material.color.set(value);
    innerTorus.material.color.set(value);
    mouseSphere.material.color.set(value);
  });
  matFolder.add(PARAMS.material, "metalness", 0, 1).onChange((value) => {
    outerTorus.material.metalness = value;
    innerTorus.material.metalness = value;
    mouseSphere.material.metalness = value;
  });
  matFolder.add(PARAMS.material, "roughness", 0, 1).onChange((value) => {
    outerTorus.material.roughness = value;
    innerTorus.material.roughness = value;
    mouseSphere.material.roughness = value;
  });
  matFolder.add(PARAMS.material, "transmission", 0, 1).onChange((value) => {
    outerTorus.material.transmission = value;
    innerTorus.material.transmission = value;
    mouseSphere.material.transmission = value;
  });
  matFolder.add(PARAMS.material, "thickness", 0, 5).onChange((value) => {
    outerTorus.material.thickness = value;
    innerTorus.material.thickness = value;
    mouseSphere.material.thickness = value;
  });
  matFolder.add(PARAMS.material, "ior", 1, 2.333).onChange((value) => {
    outerTorus.material.ior = value;
    innerTorus.material.ior = value;
    mouseSphere.material.ior = value;
  });
  matFolder.add(PARAMS.material, "clearcoat", 0, 1).onChange((value) => {
    outerTorus.material.clearcoat = value;
    innerTorus.material.clearcoat = value;
    mouseSphere.material.clearcoat = value;
  });
  matFolder
    .add(PARAMS.material, "clearcoatRoughness", 0, 1)
    .onChange((value) => {
      outerTorus.material.clearcoatRoughness = value;
      innerTorus.material.clearcoatRoughness = value;
      mouseSphere.material.clearcoatRoughness = value;
    });
  gui.add(PARAMS, "rotationSpeed", 0, 2);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateBackgroundSize();
}

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function animate() {
  requestAnimationFrame(animate);

  // Rotate outer and inner torus
  outerTorus.rotation.x += PARAMS.rotationSpeed * 0.01;
  outerTorus.rotation.y += PARAMS.rotationSpeed * 0.01;
  innerTorus.rotation.x -= PARAMS.rotationSpeed * 0.015;
  innerTorus.rotation.z += PARAMS.rotationSpeed * 0.015;

  // Update mouse sphere position
  const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
  vector.unproject(camera);
  const dir = vector.sub(camera.position).normalize();
  const distance = -camera.position.z / dir.z;
  const pos = camera.position.clone().add(dir.multiplyScalar(distance));
  mouseSphere.position.copy(pos);

  // Update cube camera for refraction
  outerTorus.visible = false;
  innerTorus.visible = false;
  mouseSphere.visible = false;
  cubeCamera.position.copy(outerTorus.position);
  cubeCamera.update(renderer, scene);
  outerTorus.visible = true;
  innerTorus.visible = true;
  mouseSphere.visible = true;

  controls.update();
  renderer.render(scene, camera);
}

init();