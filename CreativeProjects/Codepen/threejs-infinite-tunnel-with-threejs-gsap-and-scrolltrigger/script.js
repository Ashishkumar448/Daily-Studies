// Import modules
import * as THREE from "https://esm.sh/three@0.175.0";
import { Pane } from "https://cdn.skypack.dev/tweakpane@4.0.4";
import Stats from "https://esm.sh/stats.js@0.17.0";
import { EffectComposer } from "https://esm.sh/three@0.175.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://esm.sh/three@0.175.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://esm.sh/three@0.175.0/examples/jsm/postprocessing/UnrealBloomPass.js";

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Detect device capabilities for performance optimization
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
  navigator.userAgent
);
const isLowEndDevice =
  isMobile ||
  (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

// Color presets
const colorPresets = {
  default: {
    colorA: "#ff3030", // Start of tunnel
    colorB: "#ff6000", // After first quarter
    colorC: "#00ffff", // After second quarter
    colorD: "#8800ff" // End of tunnel
  },
  "dark-abyss": {
    colorA: "#0a0a2a", // Deep dark blue
    colorB: "#1a1a4a", // Dark blue
    colorC: "#3a1a6a", // Dark purple
    colorD: "#0a0a1a" // Almost black
  },
  "neon-dreams": {
    colorA: "#ff00ff", // Neon pink
    colorB: "#00ff99", // Neon green
    colorC: "#ff3399", // Bright pink
    colorD: "#9900ff" // Neon purple
  },
  "golden-hour": {
    colorA: "#ff7700", // Bright orange
    colorB: "#ff3300", // Reddish orange
    colorC: "#ffaa00", // Golden yellow
    colorD: "#ff0000" // Deep red
  },
  "deep-ocean": {
    colorA: "#006699", // Deep blue
    colorB: "#00aacc", // Turquoise
    colorC: "#006666", // Teal
    colorD: "#003366" // Navy blue
  },
  "aurora-borealis": {
    colorA: "#00cc99", // Green
    colorB: "#6600cc", // Purple
    colorC: "#00ffcc", // Bright green
    colorD: "#3300ff" // Deep blue
  }
};

// Parameters
const params = {
  // Structure
  tunnelDepth: 50,
  circleCount: isLowEndDevice ? 60 : 100,
  tunnelRadius: 3,
  tubeThickness: 0.5,
  circleSegments: isLowEndDevice ? 64 : 128,
  tubeSegments: isLowEndDevice ? 6 : 8,
  pathAmplitude: 0.5,

  // Appearance
  colorA: "#ff3030", // Start of tunnel
  colorB: "#ff6000", // After first quarter
  colorC: "#00ffff", // After second quarter
  colorD: "#8800ff", // End of tunnel
  emission: 0.1,
  metalness: 0.7,
  roughness: 0.4,
  fogDensity: 0.065,

  // Effects
  pulseSpeed: 4.7,
  pulseIntensity: 0.8,
  rotationSpeed: 0.011,
  particlesEnabled: true,
  particleCount: isLowEndDevice ? 500 : 1000,
  particleSize: 0.04,
  particleSpeed: 0.5,

  // Stars
  starsEnabled: true,
  starCount: isLowEndDevice ? 1000 : 2000,
  starSize: 0.05,

  // Movement
  autoMovement: true,
  manualPosition: 0,
  scrollSpeed: 1.0,
  fadeStart: 0.85,
  fadeIntensity: 3.0,

  // Performance
  qualityPreset: isLowEndDevice ? "low" : "high",
  useBloom: !isLowEndDevice,

  // Presets
  colorPreset: "default",

  // Title settings
  titleShowThreshold: 0.95, // When to show the title (0-1)
  titleHideThreshold: 0.93 // When to hide the title when scrolling back (0-1)
};

// Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x000000, params.fogDensity);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("tunnel"),
  antialias: !isLowEndDevice,
  powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(isLowEndDevice ? 1 : window.devicePixelRatio || 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// Setup post-processing with bloom
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Add bloom effect
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5, // Bloom strength
  0.75, // Bloom radius
  0.2 // Bloom threshold
);
composer.addPass(bloomPass);

// Stats
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

// Add lights
const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

const light1 = new THREE.PointLight(0xff3030, 2, 50);
light1.position.set(0, 0, 10);
scene.add(light1);

const light2 = new THREE.PointLight(0xff6000, 2, 50);
light2.position.set(0, 0, -20);
scene.add(light2);

// Object pool for geometry reuse
const geometryPool = {
  torus: {}
};

// Get or create torus geometry from pool
function getTorusGeometry(radius, tubeThickness, tubeSegments, circleSegments) {
  const key = `${radius}-${tubeThickness}-${tubeSegments}-${circleSegments}`;
  if (!geometryPool.torus[key]) {
    geometryPool.torus[key] = new THREE.TorusGeometry(
      radius,
      tubeThickness,
      tubeSegments,
      circleSegments
    );
  }
  return geometryPool.torus[key];
}

// Create tunnel path
function createPath() {
  const path = [];
  const segments = 100;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const z = -t * params.tunnelDepth;

    // Sine wave path for more interest
    const x = Math.sin(t * 10) * params.pathAmplitude;
    const y = Math.cos(t * 8) * params.pathAmplitude;

    path.push(new THREE.Vector3(x, y, z));
  }

  return new THREE.CatmullRomCurve3(path);
}

let tunnelPath = createPath();

// Group for all circles
let tunnelGroup = new THREE.Group();
scene.add(tunnelGroup);

// Particle system for floating dust
let particles;
let particleTexture;

// Star field
let starField;
let starTexture;

// Create a circular particle texture (only once)
function createParticleTexture() {
  if (particleTexture) return particleTexture;

  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;

  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, 32, 32);

  particleTexture = new THREE.Texture(canvas);
  particleTexture.needsUpdate = true;
  return particleTexture;
}

// Create a star texture (only once)
function createStarTexture() {
  if (starTexture) return starTexture;

  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;

  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.4, "rgba(200,220,255,0.8)");
  gradient.addColorStop(1, "rgba(200,220,255,0)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, 32, 32);

  starTexture = new THREE.Texture(canvas);
  starTexture.needsUpdate = true;
  return starTexture;
}

// Create star field (background stars, no warp effect)
function createStarField() {
  if (starField) scene.remove(starField);

  if (!params.starsEnabled) return;

  const starGeo = new THREE.BufferGeometry();
  const starPositions = [];
  const starSizes = [];
  const starColors = [];

  // Create stars in a spherical distribution around the tunnel
  const sphereRadius = 100; // Large radius to place stars far away

  for (let i = 0; i < params.starCount; i++) {
    // Random spherical coordinates
    const theta = Math.random() * Math.PI * 2; // Azimuthal angle
    const phi = Math.acos(2 * Math.random() - 1); // Polar angle

    // Convert to Cartesian coordinates
    const x = sphereRadius * Math.sin(phi) * Math.cos(theta);
    const y = sphereRadius * Math.sin(phi) * Math.sin(theta);
    const z = sphereRadius * Math.cos(phi);

    starPositions.push(x, y, z);

    // Random size variation
    const size = params.starSize * (0.5 + Math.random() * 0.5);
    starSizes.push(size);

    // Slightly varied white/blue colors for stars
    const r = 0.8 + Math.random() * 0.2;
    const g = 0.8 + Math.random() * 0.2;
    const b = 0.9 + Math.random() * 0.1;
    starColors.push(r, g, b);
  }

  // Set attributes
  starGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starPositions, 3)
  );
  starGeo.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(starColors, 3)
  );
  starGeo.setAttribute("size", new THREE.Float32BufferAttribute(starSizes, 1));

  // Create material with custom shader for better star rendering
  const starMaterial = new THREE.PointsMaterial({
    size: params.starSize,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    map: createStarTexture(),
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  starField = new THREE.Points(starGeo, starMaterial);
  scene.add(starField);
}

// Create particles
function createParticles() {
  if (particles) scene.remove(particles);

  if (!params.particlesEnabled) return;

  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = [];
  const particleColors = [];
  const particleVelocities = [];

  const colorA = new THREE.Color(params.colorA);
  const colorB = new THREE.Color(params.colorB);
  const colorC = new THREE.Color(params.colorC);
  const colorD = new THREE.Color(params.colorD);

  for (let i = 0; i < params.particleCount; i++) {
    // Random position within tunnel volume
    const t = Math.random();
    const ringRadius = params.tunnelRadius * (0.5 + Math.random() * 0.5); // Vary radius
    const angle = Math.random() * Math.PI * 2;

    // Calculate position on path
    const pathPoint = tunnelPath.getPointAt(t);

    // Random position within tube radius
    const x = pathPoint.x + Math.cos(angle) * ringRadius;
    const y = pathPoint.y + Math.sin(angle) * ringRadius;
    const z = pathPoint.z;

    particlePositions.push(x, y, z);

    // Random velocities for movement
    particleVelocities.push(
      (Math.random() - 0.5) * 0.01,
      (Math.random() - 0.5) * 0.01,
      (Math.random() - 0.5) * 0.01
    );

    // Blend colors based on position in tunnel
    let color;
    if (t < 0.25) {
      color = new THREE.Color().lerpColors(colorA, colorB, t * 4);
    } else if (t < 0.5) {
      color = new THREE.Color().lerpColors(colorB, colorC, (t - 0.25) * 4);
    } else if (t < 0.75) {
      color = new THREE.Color().lerpColors(colorC, colorD, (t - 0.5) * 4);
    } else {
      color = colorD.clone();
    }

    particleColors.push(color.r, color.g, color.b);
  }

  // Set attributes
  particleGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(particlePositions, 3)
  );
  particleGeo.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(particleColors, 3)
  );

  // Create material
  const particleMaterial = new THREE.PointsMaterial({
    size: params.particleSize,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    map: createParticleTexture(),
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  particles = new THREE.Points(particleGeo, particleMaterial);
  particles.userData = {
    initialPositions: [...particlePositions], // Clone the initial positions
    velocities: particleVelocities
  };

  scene.add(particles);
}

// Create the tunnel
function createTunnel() {
  // Remove previous tunnel
  scene.remove(tunnelGroup);
  tunnelGroup = new THREE.Group();
  scene.add(tunnelGroup);

  // Update path
  tunnelPath = createPath();

  // Create particle system
  createParticles();

  // Create star field (background only, no warp)
  createStarField();

  // Create materials
  const colorA = new THREE.Color(params.colorA);
  const colorB = new THREE.Color(params.colorB);
  const colorC = new THREE.Color(params.colorC);
  const colorD = new THREE.Color(params.colorD);

  // Get shared geometry from pool
  const geometry = getTorusGeometry(
    params.tunnelRadius,
    params.tubeThickness,
    params.tubeSegments,
    params.circleSegments
  );

  // Create circles along the path
  for (let i = 0; i < params.circleCount; i++) {
    const t = i / (params.circleCount - 1);
    const pathPoint = tunnelPath.getPointAt(t);

    // Calculate color for this ring using 4-color gradient
    let color;
    if (t < 0.25) {
      // First quarter: colorA to colorB
      color = new THREE.Color().lerpColors(colorA, colorB, t * 4);
    } else if (t < 0.5) {
      // Second quarter: colorB to colorC
      color = new THREE.Color().lerpColors(colorB, colorC, (t - 0.25) * 4);
    } else if (t < 0.75) {
      // Third quarter: colorC to colorD
      color = new THREE.Color().lerpColors(colorC, colorD, (t - 0.5) * 4);
    } else {
      // Last quarter: colorD with darkening
      color = colorD.clone().multiplyScalar(1 - (t - 0.75) * 0.5);
    }

    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color.clone().multiplyScalar(params.emission),
      metalness: params.metalness,
      roughness: params.roughness,
      transparent: true
    });

    // Create a torus (ring tube) - reuse geometry
    const torus = new THREE.Mesh(geometry, material);

    // Get tangent direction for orientation
    const tangent = tunnelPath.getTangentAt(t);

    // Position and orient the ring
    torus.position.copy(pathPoint);

    // Align ring with the tangent direction
    if (Math.abs(tangent.y) < 0.99) {
      torus.lookAt(
        pathPoint.x + tangent.x,
        pathPoint.y + tangent.y,
        pathPoint.z + tangent.z
      );
    }

    // Store some data for animations
    torus.userData = {
      initialPositionZ: torus.position.z,
      index: i,
      t: t
    };

    tunnelGroup.add(torus);
  }

  // Update fog
  scene.fog.density = params.fogDensity;
}

// Initial creation
createTunnel();

// Animation and scroll handling
let scrollProgress = 0;
let lastFrameTime = 0;
let deltaTime = 0;

// Get title container element
const titleContainer = document.getElementById("title-container");
let titleVisible = false;

// Set up ScrollTrigger
ScrollTrigger.create({
  trigger: "body",
  start: "top top",
  end: "bottom bottom",
  onUpdate: (self) => {
    scrollProgress = self.progress;

    // Handle title visibility based on scroll progress
    if (scrollProgress >= params.titleShowThreshold && !titleVisible) {
      titleContainer.classList.add("visible");
      titleVisible = true;
    } else if (scrollProgress < params.titleHideThreshold && titleVisible) {
      titleContainer.classList.remove("visible");
      titleVisible = false;
    }

    if (self.progress > 0.01) {
      document.querySelector(".scroll-indicator")?.classList.add("hidden");
    }
  }
});

// Animation loop
let time = 0;
let animationFrameId;

function animate(currentTime = 0) {
  stats.begin();

  // Calculate delta time for smooth animations regardless of frame rate
  deltaTime = Math.min(0.05, (currentTime - lastFrameTime) / 1000); // Cap at 0.05 (20fps minimum)
  lastFrameTime = currentTime;

  time += deltaTime;

  // Calculate camera position based on scroll or manual position
  let pathProgress;
  if (params.autoMovement) {
    pathProgress = Math.min(scrollProgress * params.scrollSpeed, 0.99);
  } else {
    pathProgress = Math.min(Math.max(params.manualPosition, 0), 0.99);
  }

  const position = tunnelPath.getPointAt(pathProgress);

  // Set camera position
  camera.position.copy(position);

  // Look ahead
  const lookAtPosition = tunnelPath.getPointAt(
    Math.min(pathProgress + 0.01, 0.99)
  );
  camera.lookAt(lookAtPosition);

  // Move lights with camera
  light1.position.copy(camera.position);
  light1.position.z += 3;

  // Animate rings (subtle pulsing and rotation)
  if (params.pulseIntensity > 0 || params.rotationSpeed > 0) {
    // Only process visible rings for optimization
    tunnelGroup.children.forEach((ring, i) => {
      // Skip rings that are too far from camera
      const distanceToCamera = camera.position.distanceTo(ring.position);
      if (distanceToCamera > params.tunnelDepth * 0.5) return;

      if (params.pulseIntensity > 0) {
        // Calculate pulse (based on time and position)
        const pulse =
          Math.sin(time * params.pulseSpeed + ring.userData.index * 0.2) *
          params.pulseIntensity;

        // Apply pulse to emission intensity
        const baseEmission = params.emission;
        const emissionColor = ring.material.color
          .clone()
          .multiplyScalar(baseEmission * (1 + pulse));
        ring.material.emissive.copy(emissionColor);
      }

      // Add subtle rotation to each ring
      if (params.rotationSpeed > 0) {
        ring.rotation.z +=
          params.rotationSpeed *
          deltaTime *
          60 *
          (1 + Math.sin(ring.userData.index * 0.1) * 0.5);
      }
    });
  }

  // Animate particles
  if (particles && params.particlesEnabled) {
    const positions = particles.geometry.attributes.position.array;
    const initialPositions = particles.userData.initialPositions;
    const velocities = particles.userData.velocities;

    // Update particle positions - batch process for performance
    for (let i = 0; i < params.particleCount; i++) {
      const idx = i * 3;
      const vIdx = i * 3;

      // Move particles slowly
      positions[idx] +=
        velocities[vIdx] * params.particleSpeed * deltaTime * 60;
      positions[idx + 1] +=
        velocities[vIdx + 1] * params.particleSpeed * deltaTime * 60;
      positions[idx + 2] +=
        velocities[vIdx + 2] * params.particleSpeed * deltaTime * 60;

      // Reset particles that get too far from their original position
      const dx = positions[idx] - initialPositions[idx];
      const dy = positions[idx + 1] - initialPositions[idx + 1];
      const dz = positions[idx + 2] - initialPositions[idx + 2];
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance > 1.0) {
        // Reset with new velocity
        positions[idx] = initialPositions[idx];
        positions[idx + 1] = initialPositions[idx + 1];
        positions[idx + 2] = initialPositions[idx + 2];
        velocities[vIdx] = (Math.random() - 0.5) * 0.01;
        velocities[vIdx + 1] = (Math.random() - 0.5) * 0.01;
        velocities[vIdx + 2] = (Math.random() - 0.5) * 0.01;
      }
    }

    particles.geometry.attributes.position.needsUpdate = true;
  }

  // Handle fade to black at end
  if (pathProgress > params.fadeStart) {
    const fadeProgress =
      (pathProgress - params.fadeStart) / (1 - params.fadeStart);
    const fadeFactor = Math.pow(fadeProgress, params.fadeIntensity);

    // Increase fog
    scene.fog.density = params.fogDensity * (1 + fadeFactor * 30);

    // Fade out circles
    tunnelGroup.children.forEach((circle) => {
      circle.material.opacity = 1.0 - fadeFactor * 0.9;
    });

    // Fade particles too
    if (particles) {
      particles.material.opacity = 0.6 * (1.0 - fadeFactor);
    }

    // Darken background
    const darkFactor = 1.0 - fadeFactor;
    renderer.setClearColor(new THREE.Color(0, 0, 0).multiplyScalar(darkFactor));
  } else {
    // Reset
    scene.fog.density = params.fogDensity;
    tunnelGroup.children.forEach((circle) => {
      circle.material.opacity = 1.0;
    });
    if (particles) particles.material.opacity = 0.6;
    renderer.setClearColor(0x000000);
  }

  // Render with or without bloom based on settings
  if (params.useBloom) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }

  stats.end();
  animationFrameId = requestAnimationFrame(animate);
}

// Apply color preset
function applyColorPreset(presetName) {
  if (!colorPresets[presetName]) return;

  // Update params with preset colors
  params.colorA = colorPresets[presetName].colorA;
  params.colorB = colorPresets[presetName].colorB;
  params.colorC = colorPresets[presetName].colorC;
  params.colorD = colorPresets[presetName].colorD;

  // Update Tweakpane UI
  colorInputs.forEach((input) => input.refresh());

  // Update lights to match first color
  light1.color.set(params.colorA);
  light2.color.set(params.colorB);

  // Rebuild tunnel with new colors
  createTunnel();
}

// Apply quality preset
function applyQualityPreset(preset) {
  switch (preset) {
    case "low":
      params.circleCount = 50;
      params.circleSegments = 48;
      params.tubeSegments = 6;
      params.particlesEnabled = false;
      params.useBloom = false;
      params.starCount = 1000;
      renderer.setPixelRatio(1);
      break;
    case "medium":
      params.circleCount = 80;
      params.circleSegments = 64;
      params.tubeSegments = 6;
      params.particlesEnabled = true;
      params.particleCount = 500;
      params.useBloom = true;
      params.starCount = 1500;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      break;
    case "high":
      params.circleCount = 100;
      params.circleSegments = 128;
      params.tubeSegments = 8;
      params.particlesEnabled = true;
      params.particleCount = 1000;
      params.useBloom = true;
      params.starCount = 2000;
      renderer.setPixelRatio(window.devicePixelRatio);
      break;
  }

  // Update UI
  pane.refresh();

  // Rebuild tunnel with new settings
  createTunnel();
}

// Setup Tweakpane
const pane = new Pane({
  container: document.getElementById("tweakpane-container")
});

// Add tabs
const tabs = pane.addTab({
  pages: [
    { title: "Presets" },
    { title: "Structure" },
    { title: "Appearance" },
    { title: "Effects" },
    { title: "Stars" },
    { title: "Movement" },
    { title: "Performance" },
    { title: "Title" } // Tab for title settings
  ]
});

// Presets tab
const presetsTab = tabs.pages[0];
presetsTab
  .addBinding(params, "colorPreset", {
    options: {
      Default: "default",
      "Dark Abyss": "dark-abyss",
      "Neon Dreams": "neon-dreams",
      "Golden Hour": "golden-hour",
      "Deep Ocean": "deep-ocean",
      "Aurora Borealis": "aurora-borealis"
    }
  })
  .on("change", (ev) => {
    applyColorPreset(ev.value);
  });

// Structure tab
const structureTab = tabs.pages[1];
structureTab
  .addBinding(params, "circleCount", { min: 10, max: 120, step: 5 })
  .on("change", () => createTunnel());
structureTab
  .addBinding(params, "tunnelRadius", { min: 1, max: 10, step: 0.5 })
  .on("change", () => createTunnel());
structureTab
  .addBinding(params, "tubeThickness", { min: 0.02, max: 0.5, step: 0.01 })
  .on("change", () => createTunnel());
structureTab
  .addBinding(params, "circleSegments", { min: 12, max: 128, step: 4 })
  .on("change", () => createTunnel());
structureTab
  .addBinding(params, "tunnelDepth", { min: 50, max: 200, step: 10 })
  .on("change", () => createTunnel());
structureTab
  .addBinding(params, "pathAmplitude", { min: 0, max: 2, step: 0.1 })
  .on("change", () => createTunnel());

// Appearance tab
const appearanceTab = tabs.pages[2];
const colorInputs = [
  appearanceTab
    .addBinding(params, "colorA", { label: "Color 1 (Start)" })
    .on("change", () => createTunnel()),
  appearanceTab
    .addBinding(params, "colorB", { label: "Color 2 (25%)" })
    .on("change", () => createTunnel()),
  appearanceTab
    .addBinding(params, "colorC", { label: "Color 3 (50%)" })
    .on("change", () => createTunnel()),
  appearanceTab
    .addBinding(params, "colorD", { label: "Color 4 (75%)" })
    .on("change", () => createTunnel())
];

appearanceTab
  .addBinding(params, "emission", { min: 0, max: 1, step: 0.05 })
  .on("change", () => createTunnel());
appearanceTab
  .addBinding(params, "metalness", { min: 0, max: 1, step: 0.05 })
  .on("change", () => createTunnel());
appearanceTab
  .addBinding(params, "roughness", { min: 0, max: 1, step: 0.05 })
  .on("change", () => createTunnel());
appearanceTab
  .addBinding(params, "fogDensity", { min: 0, max: 0.1, step: 0.005 })
  .on("change", () => {
    scene.fog.density = params.fogDensity;
  });

// Effects tab
const effectsTab = tabs.pages[3];
effectsTab.addBinding(params, "pulseIntensity", { min: 0, max: 1, step: 0.05 });
effectsTab.addBinding(params, "pulseSpeed", { min: 0.1, max: 5, step: 0.1 });
effectsTab.addBinding(params, "rotationSpeed", {
  min: 0,
  max: 0.05,
  step: 0.001
});
effectsTab
  .addBinding(params, "particlesEnabled")
  .on("change", () => createTunnel());
effectsTab
  .addBinding(params, "particleCount", { min: 100, max: 1000, step: 50 })
  .on("change", () => createTunnel());
effectsTab
  .addBinding(params, "particleSize", { min: 0.01, max: 0.2, step: 0.01 })
  .on("change", () => createTunnel());
effectsTab.addBinding(params, "particleSpeed", {
  min: 0.1,
  max: 1.0,
  step: 0.1
});

// Stars tab
const starsTab = tabs.pages[4];
starsTab
  .addBinding(params, "starsEnabled")
  .on("change", () => createStarField());
starsTab
  .addBinding(params, "starCount", { min: 500, max: 3000, step: 100 })
  .on("change", () => createStarField());
starsTab
  .addBinding(params, "starSize", { min: 0.01, max: 0.2, step: 0.01 })
  .on("change", () => createStarField());

// Movement tab
const movementTab = tabs.pages[5];
movementTab.addBinding(params, "autoMovement").on("change", (ev) => {
  // Show/hide manual position slider based on auto movement setting
  manualPositionInput.hidden = ev.value;
});
const manualPositionInput = movementTab.addBinding(params, "manualPosition", {
  min: 0,
  max: 0.99,
  step: 0.01
});
// Initially hide manual position if auto movement is enabled
manualPositionInput.hidden = params.autoMovement;

movementTab.addBinding(params, "scrollSpeed", {
  min: 0.1,
  max: 2.0,
  step: 0.1
});
movementTab.addBinding(params, "fadeStart", {
  min: 0.5,
  max: 0.95,
  step: 0.05
});
movementTab.addBinding(params, "fadeIntensity", { min: 1, max: 5, step: 0.5 });

// Performance tab
const performanceTab = tabs.pages[6];
performanceTab
  .addBinding(params, "qualityPreset", {
    options: {
      Low: "low",
      Medium: "medium",
      High: "high"
    }
  })
  .on("change", (ev) => {
    applyQualityPreset(ev.value);
  });

performanceTab.addBinding(params, "useBloom").on("change", () => {
  // No need to rebuild tunnel, just toggle bloom effect
});

// Title tab - for controlling title settings
const titleTab = tabs.pages[7];
titleTab.addBinding(params, "titleShowThreshold", {
  min: 0.5,
  max: 0.99,
  step: 0.01,
  label: "Show at"
});
titleTab
  .addBinding(params, "titleHideThreshold", {
    min: 0.5,
    max: 0.99,
    step: 0.01,
    label: "Hide at"
  })
  .on("change", () => {
    // Ensure hide threshold is less than show threshold
    if (params.titleHideThreshold >= params.titleShowThreshold) {
      params.titleHideThreshold = params.titleShowThreshold - 0.02;
      pane.refresh();
    }
  });

// Handle resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
animate();