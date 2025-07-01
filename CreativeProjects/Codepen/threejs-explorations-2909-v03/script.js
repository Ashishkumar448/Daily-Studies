import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/geometries/RoundedBoxGeometry.js";
import { GUI } from "https://cdn.skypack.dev/dat.gui";
import gsap from "https://cdn.skypack.dev/gsap@3.12.5";

let scene, camera, renderer, controls, cube, particles;
let noise3D;

let isZoomed = false;
let zoomFactorCube = 1;
let zoomFactorParticles = 1;

const params = {
  particleCount: 30000,
  particleSize: 0.01,
  particleSpeed: 0.5,
  particleColor: "#cccccc",
  particleOpacity: 0.3,
  cubeOpacity: 0.85
};

const textures = {
  matcap:
    "https://images.unsplash.com/photo-1499875470908-f67c014dab92?q=80&w=2332&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
};

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 5);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false; // Disable zoom in OrbitControls

  createNoise3D();
  createCube();
  createParticles();
  setupGUI();

  window.addEventListener("resize", onWindowResize);
  document.addEventListener("click", toggleZoom);
  document.addEventListener("mousemove", handleMouseMove);

  animate();
}

function createNoise3D() {
  noise3D = new SimplexNoise();
}

function createCube() {
  const geometry = new RoundedBoxGeometry(1, 1, 1, 16, 0.1);

  const textureLoader = new THREE.TextureLoader();
  const matcapTexture = textureLoader.load(textures.matcap);

  const material = new THREE.MeshMatcapMaterial({
    matcap: matcapTexture,
    transparent: true,
    opacity: params.cubeOpacity
  });

  cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
}

function createParticles() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(params.particleCount * 3);
  const originalPositions = new Float32Array(params.particleCount * 3);

  for (let i = 0; i < params.particleCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const radius = 1.0 + Math.random() * 0.8;

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    originalPositions[i * 3] = x;
    originalPositions[i * 3 + 1] = y;
    originalPositions[i * 3 + 2] = z;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute(
    "originalPosition",
    new THREE.BufferAttribute(originalPositions, 3)
  );

  const material = new THREE.PointsMaterial({
    color: params.particleColor,
    size: params.particleSize,
    transparent: true,
    opacity: params.particleOpacity,
    blending: THREE.AdditiveBlending
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);
}

function setupGUI() {
  const gui = new GUI();
  gui
    .add(params, "particleCount", 5000, 50000)
    .step(1000)
    .onChange(updateParticles);
  gui.add(params, "particleSize", 0.01, 0.2).onChange(updateParticleSize);
  gui.add(params, "particleSpeed", 0.1, 2.0);
  gui.addColor(params, "particleColor").onChange(updateParticleColor);
  gui.add(params, "particleOpacity", 0, 1).onChange(updateParticleOpacity);
  gui.add(params, "cubeOpacity", 0, 1).onChange(updateCubeOpacity);
}

function updateParticles() {
  scene.remove(particles);
  createParticles();
}

function updateParticleSize() {
  particles.material.size = params.particleSize;
}

function updateParticleColor() {
  particles.material.color.setStyle(params.particleColor);
}

function updateParticleOpacity() {
  particles.material.opacity = params.particleOpacity;
}

function updateCubeOpacity() {
  cube.material.opacity = params.cubeOpacity;
}

function toggleZoom() {
  isZoomed = !isZoomed;

  if (isZoomed) {
    // Animate zoom using GSAP for smooth transitions
    gsap.to(cube.scale, {
      x: 1.5,
      y: 1.5,
      z: 1.5,
      duration: 0.3,
      ease: "power1.inOut"
    });
    gsap.to(particles.scale, {
      x: 2.0,
      y: 2.0,
      z: 2.0,
      duration: 0.3,
      ease: "power1.inOut"
    });
  } else {
    // Return to normal scale with the same smooth animation
    gsap.to(cube.scale, {
      x: 1.0,
      y: 1.0,
      z: 1.0,
      duration: 0.3,
      ease: "power1.inOut"
    });
    gsap.to(particles.scale, {
      x: 1.0,
      y: 1.0,
      z: 1.0,
      duration: 0.3,
      ease: "power1.inOut"
    });
  }
}

let mouseX = 0,
  mouseY = 0;
let targetX = 0,
  targetY = 0;

function handleMouseMove(event) {
  mouseX = (event.clientX - window.innerWidth / 2) * 0.005;
  mouseY = (event.clientY - window.innerHeight / 2) * 0.005;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  const time = performance.now() * 0.001;
  const positions = particles.geometry.attributes.position.array;
  const originalPositions =
    particles.geometry.attributes.originalPosition.array;

  for (let i = 0; i < params.particleCount; i++) {
    const i3 = i * 3;
    const x = originalPositions[i3];
    const y = originalPositions[i3 + 1];
    const z = originalPositions[i3 + 2];

    // Add crazier particle animation effect with noise and some sinusoidal movement
    const noiseX = noise3D.noise3D(x + time * params.particleSpeed, y, z);
    const noiseY = noise3D.noise3D(x, y + time * params.particleSpeed, z);
    const noiseZ = noise3D.noise3D(x, y, z + time * params.particleSpeed);

    // Morphing and more chaotic particle movement
    positions[i3] = (x + Math.sin(time + noiseX) * 0.5) * zoomFactorParticles;
    positions[i3 + 1] =
      (y + Math.cos(time + noiseY) * 0.5) * zoomFactorParticles;
    positions[i3 + 2] =
      (z + Math.sin(time + noiseZ) * 0.5) * zoomFactorParticles;
  }

  particles.geometry.attributes.position.needsUpdate = true;

  // Apply zoom effect on cube and parallax effect on particles
  targetX = (mouseX - targetX) * 0.05;
  targetY = (mouseY - targetY) * 0.05;

  cube.rotation.y += targetX * 0.1;
  cube.rotation.x += targetY * 0.1;

  renderer.render(scene, camera);
  controls.update();
}

// Simplex Noise implementation
class SimplexNoise {
  constructor() {
    this.grad3 = [
      [1, 1, 0],
      [-1, 1, 0],
      [1, -1, 0],
      [-1, -1, 0],
      [1, 0, 1],
      [-1, 0, 1],
      [1, 0, -1],
      [-1, 0, -1],
      [0, 1, 1],
      [0, -1, 1],
      [0, 1, -1],
      [0, -1, -1]
    ];
    this.p = [];
    for (let i = 0; i < 256; i++) {
      this.p[i] = Math.floor(Math.random() * 256);
    }
    this.perm = [];
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
    }
  }

  dot(g, x, y, z) {
    return g[0] * x + g[1] * y + g[2] * z;
  }

  noise3D(xin, yin, zin) {
    let n0, n1, n2, n3;
    const F3 = 1.0 / 3.0;
    const s = (xin + yin + zin) * F3;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const k = Math.floor(zin + s);
    const G3 = 1.0 / 6.0;
    const t = (i + j + k) * G3;
    const X0 = i - t;
    const Y0 = j - t;
    const Z0 = k - t;
    const x0 = xin - X0;
    const y0 = yin - Y0;
    const z0 = zin - Z0;
    let i1, j1, k1;
    let i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) {
        i1 = 1;
        j1 = 0;
        k1 = 0;
        i2 = 1;
        j2 = 1;
        k2 = 0;
      } else if (x0 >= z0) {
        i1 = 1;
        j1 = 0;
        k1 = 0;
        i2 = 1;
        j2 = 0;
        k2 = 1;
      } else {
        i1 = 0;
        j1 = 0;
        k1 = 1;
        i2 = 1;
        j2 = 0;
        k2 = 1;
      }
    } else {
      if (y0 < z0) {
        i1 = 0;
        j1 = 0;
        k1 = 1;
        i2 = 0;
        j2 = 1;
        k2 = 1;
      } else if (x0 < z0) {
        i1 = 0;
        j1 = 1;
        k1 = 0;
        i2 = 0;
        j2 = 1;
        k2 = 1;
      } else {
        i1 = 0;
        j1 = 1;
        k1 = 0;
        i2 = 1;
        j2 = 1;
        k2 = 0;
      }
    }
    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2.0 * G3;
    const y2 = y0 - j2 + 2.0 * G3;
    const z2 = z0 - k2 + 2.0 * G3;
    const x3 = x0 - 1.0 + 3.0 * G3;
    const y3 = y0 - 1.0 + 3.0 * G3;
    const z3 = z0 - 1.0 + 3.0 * G3;
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    const gi0 = this.perm[ii + this.perm[jj + this.perm[kk]]] % 12;
    const gi1 =
      this.perm[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]] % 12;
    const gi2 =
      this.perm[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]] % 12;
    const gi3 = this.perm[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]] % 12;
    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 < 0) n0 = 0.0;
    else {
      t0 *= t0;
      n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0, z0);
    }
    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 < 0) n1 = 0.0;
    else {
      t1 *= t1;
      n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1, z1);
    }
    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 < 0) n2 = 0.0;
    else {
      t2 *= t2;
      n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2, z2);
    }
    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 < 0) n3 = 0.0;
    else {
      t3 *= t3;
      n3 = t3 * t3 * this.dot(this.grad3[gi3], x3, y3, z3);
    }
    return 32.0 * (n0 + n1 + n2 + n3);
  }
}

init();