import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { MarchingCubes } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/objects/MarchingCubes.js";
import { EffectComposer } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/UnrealBloomPass.js";

// Register ScrollTrigger with GSAP
gsap.registerPlugin(ScrollTrigger);

let scene, camera, renderer, clock, composer;
let metaballs = [];
let effect;
let matcapTexture;

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 10;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.getElementById("container").appendChild(renderer.domElement);

  window.addEventListener("resize", onWindowResize, false);

  clock = new THREE.Clock();

  // Load matcap texture
  const textureLoader = new THREE.TextureLoader();
  matcapTexture = textureLoader.load(
    "https://raw.githubusercontent.com/nidorx/matcaps/master/1024/3E2335_D36A1B_8E4A2E_2842A5.png"
  );

  const material = new THREE.MeshMatcapMaterial({
    matcap: matcapTexture,
    transparent: true,
    opacity: 0.9
  });

  const resolution = 128;
  effect = new MarchingCubes(resolution, material, true, true, 500000);
  effect.position.set(0, 0, 0);
  effect.scale.set(5, 5, 5);
  scene.add(effect);

  // Initialize 4 metaballs with different sizes
  const sizes = [1.2, 0.9, 1.1, 0.8];
  for (let i = 0; i < 4; i++) {
    metaballs.push({
      position: new THREE.Vector3(0, 0, 0),
      strength: sizes[i],
      baseStrength: sizes[i],
      subtract: 12,
      rotationSpeed: (Math.random() - 0.5) * 0.02
    });
  }

  // Post-processing
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.5,
    0.4,
    0.85
  );
  composer.addPass(bloomPass);

  createAnimations();
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  updateMetaballs(delta, time);

  // Subtle rotation of the entire effect
  effect.rotation.y = Math.sin(time * 0.1) * 0.1;
  effect.rotation.x = Math.cos(time * 0.1) * 0.1;

  composer.render();
}

function updateMetaballs(delta, time) {
  effect.reset();

  metaballs.forEach((metaball, index) => {
    // Apply individual rotation
    metaball.position.applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      metaball.rotationSpeed * delta
    );

    // Add subtle movement
    metaball.position.x += Math.sin(time * 0.5 + index) * 0.002;
    metaball.position.y += Math.cos(time * 0.5 + index) * 0.002;

    const ballX = (metaball.position.x / effect.scale.x + 0.5 + 1) % 1;
    const ballY = (metaball.position.y / effect.scale.y + 0.5 + 1) % 1;
    const ballZ = (metaball.position.z / effect.scale.z + 0.5 + 1) % 1;

    effect.addBall(ballX, ballY, ballZ, metaball.strength, metaball.subtract);
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

function createAnimations() {
  // Initial state: all metaballs merged
  gsap.set(
    metaballs.map((mb) => mb.position),
    { x: 0, y: 0, z: 0 }
  );

  // Main timeline for smooth transitions
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".scroll-sections",
      start: "top top",
      end: "bottom bottom",
      scrub: 1.5, // Increased for smoother scrolling
      ease: "power1.inOut", // Smooth easing
      anticipatePin: 1 // Helps with smoother start of animations
    }
  });

  // Phase 1: Gradual split into two groups
  tl.to(
    [metaballs[0].position, metaballs[1].position],
    {
      x: -2,
      duration: 2,
      ease: "power2.inOut"
    },
    0
  )
    .to(
      [metaballs[2].position, metaballs[3].position],
      {
        x: 2,
        duration: 2,
        ease: "power2.inOut"
      },
      0
    )
    .to(
      metaballs,
      {
        strength: (index, target) => target.baseStrength * 0.95,
        duration: 2,
        ease: "power2.inOut"
      },
      0
    );

  // Phase 2: Further gradual split
  tl.to(
    metaballs[0].position,
    { x: -3, y: 0.5, z: 0, duration: 2, ease: "power2.inOut" },
    2
  )
    .to(
      metaballs[1].position,
      { x: -3, y: -0.5, z: 0, duration: 2, ease: "power2.inOut" },
      2
    )
    .to(
      metaballs[2].position,
      { x: 3, y: 0.5, z: 0, duration: 2, ease: "power2.inOut" },
      2
    )
    .to(
      metaballs[3].position,
      { x: 3, y: -0.5, z: 0, duration: 2, ease: "power2.inOut" },
      2
    )
    .to(
      metaballs,
      {
        strength: (index, target) => target.baseStrength * 0.8,
        duration: 2,
        ease: "power2.inOut"
      },
      2
    );

  // Phase 3: Gradual merge back to center
  tl.to(
    metaballs.map((mb) => mb.position),
    {
      x: 0,
      y: 0,
      z: 0,
      duration: 3,
      ease: "power2.inOut"
    },
    4
  ).to(
    metaballs,
    {
      strength: (index, target) => target.baseStrength,
      duration: 3,
      ease: "power2.inOut"
    },
    4
  );
}