import * as THREE from "https://cdn.skypack.dev/three@0.149.0";
import { GUI } from "https://cdn.skypack.dev/dat.gui@0.7.9";

// Initialize scene, camera, and renderer
const scene = new THREE.Scene();

// Use an orthographic camera for a more flat, full-screen look
const aspectRatio = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
  -10 * aspectRatio,
  10 * aspectRatio,
  10,
  -10,
  0.1,
  1000
);

// Set up renderer with alpha
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Initialize settings object - simplified to avoid any potential issues
const settings = {
  // Physics settings
  dampening: 0.985,
  diagonalWeight: 0.15,
  cardinalWeight: 0.2,
  waveHeight: 1.5,
  surfaceTension: 0.05,

  // Interaction settings
  minHoverStrength: 0.7,
  hoverStrengthMultiplier: 30.0,
  movementThreshold: 0.015,
  interactionDelay: 50,
  slowMovementBoost: 2.5,
  speedTransition: 0.02,
  swirlingFactor: 5.0,

  // Ambient waves
  ambientWaveSpeed: 0.2,
  ambientWaveHeight: 0.08,

  // Material settings
  milkColor: "#ffffff",
  roughness: 0.23,
  transmission: 0.81,
  thickness: 1.2,
  clearcoat: 0.15,
  clearcoatRoughness: 0.53,
  ior: 1.3,
  reflectivity: 0.2,
  opacity: 0.92,

  // Light settings
  ambientIntensity: 0.7,
  directionalIntensity: 0.5,
  pointLightIntensity: 0.4,

  // Background and fog
  backgroundColor: "#000000",
  fogDensity: 0.023,

  // Simulation settings
  simulationResolution: 150
};

// Initialize GUI
const gui = new GUI();
gui.width = 300;

// Add presets folder
const presetFolder = gui.addFolder("Presets");
presetFolder
  .add(
    {
      applyMilk: function () {
        console.log("Applying Milk preset");
        settings.milkColor = "#ffffff";
        settings.roughness = 0.23;
        settings.transmission = 0.81;
        settings.thickness = 1.2;
        settings.dampening = 0.985;
        settings.waveHeight = 1.5;
        settings.clearcoat = 0.15;
        settings.clearcoatRoughness = 0.53;
        settings.ior = 1.3;
        settings.surfaceTension = 0.05;
        settings.ambientWaveHeight = 0.08;
        settings.ambientWaveSpeed = 0.2;
        updateMaterial();
        updateLights();
        updateBackground();
        updateControllers();
      }
    },
    "applyMilk"
  )
  .name("Apply Milk Preset");

presetFolder
  .add(
    {
      applyWater: function () {
        console.log("Applying Water preset");
        settings.milkColor = "#e6f9ff";
        settings.roughness = 0.05;
        settings.transmission = 0.9;
        settings.thickness = 0.8;
        settings.dampening = 0.996;
        settings.waveHeight = 1.2;
        settings.clearcoat = 0.8;
        settings.clearcoatRoughness = 0.1;
        settings.ior = 1.33;
        settings.surfaceTension = 0.07;
        settings.ambientWaveHeight = 0.1;
        settings.ambientWaveSpeed = 0.3;
        updateMaterial();
        updateLights();
        updateBackground();
        updateControllers();
      }
    },
    "applyWater"
  )
  .name("Apply Water Preset");

presetFolder
  .add(
    {
      applyHoney: function () {
        console.log("Applying Honey preset");
        settings.milkColor = "#ffcc00";
        settings.roughness = 0.2;
        settings.transmission = 0.5;
        settings.thickness = 3.0;
        settings.dampening = 0.975;
        settings.waveHeight = 0.3;
        settings.clearcoat = 0.9;
        settings.clearcoatRoughness = 0.3;
        settings.ior = 1.6;
        settings.surfaceTension = 0.12;
        settings.ambientWaveHeight = 0.02;
        settings.ambientWaveSpeed = 0.05;
        updateMaterial();
        updateLights();
        updateBackground();
        updateControllers();
      }
    },
    "applyHoney"
  )
  .name("Apply Honey Preset");

presetFolder
  .add(
    {
      applyOil: function () {
        console.log("Applying Oil preset");
        settings.milkColor = "#ffffe0";
        settings.roughness = 0.1;
        settings.transmission = 0.6;
        settings.thickness = 1.5;
        settings.dampening = 0.982;
        settings.waveHeight = 0.5;
        settings.clearcoat = 0.7;
        settings.clearcoatRoughness = 0.2;
        settings.ior = 1.5;
        settings.surfaceTension = 0.09;
        settings.ambientWaveHeight = 0.05;
        settings.ambientWaveSpeed = 0.15;
        updateMaterial();
        updateLights();
        updateBackground();
        updateControllers();
      }
    },
    "applyOil"
  )
  .name("Apply Oil Preset");

presetFolder.open();

// Helper function to update all controllers
function updateControllers() {
  Object.values(gui.__folders).forEach(function (folder) {
    folder.__controllers.forEach(function (controller) {
      controller.updateDisplay();
    });
  });
}

// Add interaction settings folder
const interactionFolder = gui.addFolder("Interaction");
interactionFolder
  .add(settings, "movementThreshold", 0.001, 0.05)
  .name("Movement Threshold");
interactionFolder
  .add(settings, "interactionDelay", 0, 200)
  .name("Interaction Delay (ms)");
interactionFolder
  .add(settings, "slowMovementBoost", 1, 5)
  .name("Slow Movement Boost");
interactionFolder
  .add(settings, "speedTransition", 0.005, 0.05)
  .name("Speed Transition Point");
interactionFolder
  .add(settings, "hoverStrengthMultiplier", 5, 50)
  .name("Hover Strength");
interactionFolder
  .add(settings, "minHoverStrength", 0, 2)
  .name("Min Hover Strength");
interactionFolder.open();

// Add physics folder
const physicsFolder = gui.addFolder("Physics");
physicsFolder.add(settings, "dampening", 0.95, 0.999).name("Fluid Thickness");
physicsFolder.add(settings, "diagonalWeight", 0, 0.2).name("Diagonal Weight");
physicsFolder
  .add(settings, "cardinalWeight", 0.05, 0.3)
  .name("Cardinal Weight");
physicsFolder.add(settings, "waveHeight", 0.1, 2).name("Wave Height");
physicsFolder.add(settings, "surfaceTension", 0, 0.2).name("Surface Tension");
physicsFolder
  .add(settings, "ambientWaveHeight", 0, 0.3)
  .name("Ambient Wave Height");
physicsFolder
  .add(settings, "ambientWaveSpeed", 0, 1)
  .name("Ambient Wave Speed");
physicsFolder.open();

// Add material folder
const materialFolder = gui.addFolder("Material");
materialFolder
  .addColor(settings, "milkColor")
  .name("Fluid Color")
  .onChange(updateMaterial);
materialFolder
  .add(settings, "roughness", 0, 1)
  .name("Roughness")
  .onChange(updateMaterial);
materialFolder
  .add(settings, "transmission", 0, 1)
  .name("Transmission")
  .onChange(updateMaterial);
materialFolder
  .add(settings, "thickness", 0, 5)
  .name("Thickness")
  .onChange(updateMaterial);
materialFolder
  .add(settings, "clearcoat", 0, 1)
  .name("Clearcoat")
  .onChange(updateMaterial);
materialFolder
  .add(settings, "clearcoatRoughness", 0, 1)
  .name("Clearcoat Roughness")
  .onChange(updateMaterial);
materialFolder
  .add(settings, "ior", 1, 2)
  .name("Index of Refraction")
  .onChange(updateMaterial);
materialFolder
  .add(settings, "opacity", 0, 1)
  .name("Opacity")
  .onChange(updateMaterial);
materialFolder.open();

// Add lighting folder
const lightingFolder = gui.addFolder("Lighting");
lightingFolder
  .add(settings, "ambientIntensity", 0, 1)
  .name("Ambient Light")
  .onChange(updateLights);
lightingFolder
  .add(settings, "directionalIntensity", 0, 1)
  .name("Directional Light")
  .onChange(updateLights);
lightingFolder
  .add(settings, "pointLightIntensity", 0, 1)
  .name("Point Lights")
  .onChange(updateLights);
lightingFolder
  .addColor(settings, "backgroundColor")
  .name("Background Color")
  .onChange(updateBackground);
lightingFolder
  .add(settings, "fogDensity", 0, 0.1)
  .name("Fog Density")
  .onChange(updateBackground);

// Add simulation folder
const simulationFolder = gui.addFolder("Simulation");
simulationFolder.add(settings, "swirlingFactor", 0, 10).name("Swirling Effect");

// Set up scene elements
scene.fog = new THREE.FogExp2(settings.backgroundColor, settings.fogDensity);
scene.background = new THREE.Color(settings.backgroundColor);

// Light setup
const ambientLight = new THREE.AmbientLight(
  0xfffaf0,
  settings.ambientIntensity
);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(
  0xfff3e0,
  settings.directionalIntensity
);
directionalLight.position.set(0, 5, 5);
scene.add(directionalLight);

// Add multiple point lights
const milkColors = [0xffe6cc, 0xfff0e6, 0xfff6e0, 0xffffeb];
const pointLights = [];

for (let i = 0; i < 4; i++) {
  const light = new THREE.PointLight(
    milkColors[i],
    settings.pointLightIntensity,
    30
  );
  light.position.set(
    Math.sin((i * Math.PI) / 2) * 10,
    5,
    Math.cos((i * Math.PI) / 2) * 10
  );
  scene.add(light);
  pointLights.push(light);
}

// Function to update lights
function updateLights() {
  ambientLight.intensity = settings.ambientIntensity;
  directionalLight.intensity = settings.directionalIntensity;
  pointLights.forEach(function (light) {
    light.intensity = settings.pointLightIntensity;
  });
}

// Function to update background
function updateBackground() {
  scene.background = new THREE.Color(settings.backgroundColor);
  scene.fog = new THREE.FogExp2(settings.backgroundColor, settings.fogDensity);
}

// Define water extent
const waterExtent = 30;

// Set up water simulation parameters
let width = settings.simulationResolution;
let height = settings.simulationResolution;
let size = width * height;

// Create data arrays for wave simulation
let current = new Float32Array(size);
let previous = new Float32Array(size);

// Mouse tracking for interaction
const mouse = new THREE.Vector2();
const lastMouse = new THREE.Vector2();
let isMouseDown = false;
let lastWaveTime = 0;
let mouseMoveDistance = 0;

// Create water geometry
const waterGeometry = new THREE.PlaneGeometry(
  waterExtent * 2,
  waterExtent * 2,
  width - 1,
  height - 1
);

// Keep water parallel to screen
waterGeometry.rotateX(-Math.PI / 2);

// Create material
const milkMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color(settings.milkColor),
  metalness: 0.0,
  roughness: settings.roughness,
  transmission: settings.transmission,
  thickness: settings.thickness,
  clearcoat: settings.clearcoat,
  clearcoatRoughness: settings.clearcoatRoughness,
  ior: settings.ior,
  reflectivity: settings.reflectivity,
  opacity: settings.opacity,
  transparent: true,
  side: THREE.DoubleSide
});

// Function to update material
function updateMaterial() {
  milkMaterial.color = new THREE.Color(settings.milkColor);
  milkMaterial.roughness = settings.roughness;
  milkMaterial.transmission = settings.transmission;
  milkMaterial.thickness = settings.thickness;
  milkMaterial.clearcoat = settings.clearcoat;
  milkMaterial.clearcoatRoughness = settings.clearcoatRoughness;
  milkMaterial.ior = settings.ior;
  milkMaterial.opacity = settings.opacity;
}

// Create milk mesh
const milk = new THREE.Mesh(waterGeometry, milkMaterial);
scene.add(milk);

// Position camera
camera.position.set(0, 20, 0);
camera.lookAt(0, 0, 0);

// Add colored planes underneath
const colorPlanes = [];
const colorPositions = [
  { x: -waterExtent / 2, z: -waterExtent / 2, color: 0xffe6f2 },
  { x: waterExtent / 2, z: -waterExtent / 2, color: 0xf5f0ff },
  { x: -waterExtent / 2, z: waterExtent / 2, color: 0xf0f8ff },
  { x: waterExtent / 2, z: waterExtent / 2, color: 0xfff0e6 }
];

colorPositions.forEach(function (pos) {
  const planeGeometry = new THREE.PlaneGeometry(waterExtent, waterExtent);
  planeGeometry.rotateX(-Math.PI / 2);

  const planeMaterial = new THREE.MeshBasicMaterial({
    color: pos.color,
    transparent: true,
    opacity: 0.2
  });

  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.position.set(pos.x, -1, pos.z);
  scene.add(plane);
  colorPlanes.push(plane);
});

// Ray for mouse interaction
const raycaster = new THREE.Raycaster();

// Event listeners with movement threshold
document.addEventListener("mousemove", function (event) {
  // Store previous mouse position
  lastMouse.x = mouse.x;
  lastMouse.y = mouse.y;

  // Convert to normalized device coordinates
  const newMouseX = (event.clientX / window.innerWidth) * 2 - 1;
  const newMouseY = -(event.clientY / window.innerHeight) * 2 + 1;

  // Calculate movement distance
  const dx = newMouseX - mouse.x;
  const dy = newMouseY - mouse.y;
  const movementDistance = Math.sqrt(dx * dx + dy * dy);

  // Update current mouse position
  mouse.x = newMouseX;
  mouse.y = newMouseY;

  // Add to total movement accumulator
  mouseMoveDistance += movementDistance;

  // Only create waves if moved enough OR enough time has passed
  const currentTime = performance.now();
  const timeSinceLastWave = currentTime - lastWaveTime;

  if (
    mouseMoveDistance > settings.movementThreshold ||
    (isMouseDown && timeSinceLastWave > settings.interactionDelay)
  ) {
    createWaves();
    mouseMoveDistance = 0;
    lastWaveTime = currentTime;
  }
});

document.addEventListener("mousedown", function () {
  isMouseDown = true;
});

document.addEventListener("mouseup", function () {
  isMouseDown = false;
});

// Handle window resize
window.addEventListener("resize", function () {
  const newAspectRatio = window.innerWidth / window.innerHeight;
  camera.left = -10 * newAspectRatio;
  camera.right = 10 * newAspectRatio;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Touch support
document.addEventListener(
  "touchmove",
  function (event) {
    event.preventDefault();

    if (event.touches.length > 0) {
      lastMouse.x = mouse.x;
      lastMouse.y = mouse.y;

      mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;

      isMouseDown = true;
      createWaves();
    }
  },
  { passive: false }
);

document.addEventListener("touchstart", function (event) {
  if (event.touches.length > 0) {
    mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
    isMouseDown = true;
  }
});

document.addEventListener("touchend", function () {
  isMouseDown = false;
});

// Wave creation function with optimized handling for slow movements
function createWaves() {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(milk);

  if (intersects.length > 0) {
    const point = intersects[0].point;
    const gridX = Math.floor((point.x / (waterExtent * 2) + 0.5) * width);
    const gridY = Math.floor((point.z / (waterExtent * 2) + 0.5) * height);

    if (gridX >= 0 && gridX < width && gridY >= 0 && gridY < height) {
      const index = gridY * width + gridX;

      // Calculate speed from mouse movement
      const speed = Math.sqrt(
        Math.pow(mouse.x - lastMouse.x, 2) + Math.pow(mouse.y - lastMouse.y, 2)
      );

      // Different processing for slow vs fast movements
      let adjustedSpeed = 0;

      if (speed < settings.speedTransition) {
        // For slow movements - apply boost
        const boostFactor =
          settings.slowMovementBoost * (1 - speed / settings.speedTransition) +
          1;
        adjustedSpeed = Math.max(0, speed) * boostFactor;
      } else {
        // For faster movements
        adjustedSpeed = Math.max(0, speed - 0.005) * 1.5;
      }

      // Only create waves with meaningful movement or clicks
      if (adjustedSpeed > 0.01 || isMouseDown) {
        // Calculate hover strength
        let hoverStrength = 0;

        if (isMouseDown) {
          hoverStrength = settings.minHoverStrength * 2;
        } else {
          const minStrength = settings.minHoverStrength * 0.5;
          const calculatedStrength =
            adjustedSpeed * settings.hoverStrengthMultiplier;
          hoverStrength = Math.max(
            minStrength,
            Math.min(3.0, calculatedStrength)
          );
        }

        // Set base strength
        let strength = isMouseDown ? 3.0 : hoverStrength;

        // Apply slow movement compensation
        let slowFactor = 1.0;
        if (speed < settings.speedTransition) {
          slowFactor =
            1.0 + (settings.speedTransition - speed) / settings.speedTransition;
        }

        // Apply to current point with randomness
        const randomVariation = 0.95 + Math.random() * 0.1;
        current[index] = strength * slowFactor * randomVariation;

        // Calculate ripple size
        let radius = 4;
        if (isMouseDown) {
          radius = Math.min(8, Math.max(4, Math.floor(strength * 2)));
        } else {
          radius = Math.min(6, Math.max(2, Math.floor(strength * 1.5)));
        }

        // Set twist amount
        let twistFactor = 0;
        if (isMouseDown) {
          twistFactor = 1.2;
        } else {
          twistFactor = adjustedSpeed * settings.swirlingFactor * 0.7;
        }

        // Create ripple
        for (let i = -radius; i <= radius; i++) {
          for (let j = -radius; j <= radius; j++) {
            if (i === 0 && j === 0) continue;

            const dist = Math.sqrt(i * i + j * j);

            if (dist <= radius) {
              // Calculate falloff
              const falloff = Math.pow((radius - dist) / radius, 2.0);

              // Apply twist
              const angle =
                Math.atan2(j, i) +
                ((twistFactor * (radius - dist)) / radius) * 0.8;
              const newI = Math.floor(dist * Math.cos(angle));
              const newJ = Math.floor(dist * Math.sin(angle));

              // Set twisted position
              const x = gridX + newI;
              const y = gridY + newJ;

              if (x >= 0 && x < width && y >= 0 && y < height) {
                const idx = y * width + x;
                const randomFactor = 0.95 + Math.random() * 0.1;
                current[idx] += strength * falloff * 0.5 * randomFactor;
              }
            }
          }
        }
      }
    }
  }
}

// Enhanced wave simulation with surface tension and ambient waves
function updateWaves(time) {
  const dampening = settings.dampening;
  const cardinalWeight = settings.cardinalWeight;
  const diagonalWeight = settings.diagonalWeight;
  const waveHeight = settings.waveHeight;
  const surfaceTension = settings.surfaceTension;

  // Process inner cells
  for (let i = 2; i < height - 2; i++) {
    for (let j = 2; j < width - 2; j++) {
      const index = i * width + j;

      // Get neighbors
      const north = current[index - width];
      const south = current[index + width];
      const east = current[index + 1];
      const west = current[index - 1];

      const northeast = current[index - width + 1];
      const northwest = current[index - width - 1];
      const southeast = current[index + width + 1];
      const southwest = current[index + width - 1];

      // Calculate Laplacian for surface tension
      const center = current[index];
      const laplacian = north + south + east + west - 4 * center;

      // Wave equation with surface tension
      let val =
        (north + south + east + west) * cardinalWeight +
        (northeast + northwest + southeast + southwest) * diagonalWeight -
        previous[index] +
        surfaceTension * laplacian;

      // Apply dampening
      previous[index] = val * dampening;
    }
  }

  // Process boundaries
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const index = i * width + j;

      if (i <= 1 || i >= height - 2 || j <= 1 || j >= width - 2) {
        const edgeDistance = Math.min(
          Math.min(i, height - 1 - i),
          Math.min(j, width - 1 - j)
        );

        const localDampening = dampening - (2 - edgeDistance) * 0.01;
        current[index] *= localDampening;
      }
    }
  }

  // Swap buffers
  [current, previous] = [previous, current];

  // Update vertices with ambient waves
  const vertexOffset = 3;
  const ambientWaveHeight = settings.ambientWaveHeight;
  const ambientWaveSpeed = settings.ambientWaveSpeed;

  const positionArray = waterGeometry.attributes.position.array;

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const index = i * width + j;
      const vertexIndex = index * vertexOffset + 1;

      // Add ambient waves
      const nx = j / width;
      const ny = i / height;

      const ambientWave =
        ambientWaveHeight *
        Math.sin(nx * 5 + time * ambientWaveSpeed) *
        Math.cos(ny * 5 + time * ambientWaveSpeed * 0.7);

      // Final height
      const newHeight = current[index] * waveHeight + ambientWave;

      // Update position
      positionArray[vertexIndex] = newHeight;
    }
  }

  // Update geometry
  waterGeometry.attributes.position.needsUpdate = true;
  waterGeometry.computeVertexNormals();
}

// Animation loop
let frameCount = 0;
let lightUpdateCounter = 0;
const LIGHT_UPDATE_FREQUENCY = 3;
let lastTime = 0;

function animate(time) {
  time *= 0.001;
  const deltaTime = Math.min(0.1, time - lastTime);
  lastTime = time;
  frameCount++;

  requestAnimationFrame(animate);

  // Update waves
  updateWaves(time);

  // Update lights occasionally
  if (lightUpdateCounter++ % LIGHT_UPDATE_FREQUENCY === 0) {
    pointLights.forEach(function (light, i) {
      const angle = time * 0.2 + (i * Math.PI) / 2;
      light.position.x = Math.sin(angle) * 12;
      light.position.z = Math.cos(angle) * 12;
      light.intensity =
        settings.pointLightIntensity * (0.8 + Math.sin(time * 1.5 + i) * 0.2);
    });
  }

  // Subtle wobble
  if (frameCount % 2 === 0) {
    milk.rotation.z = Math.sin(time * 0.2) * 0.01;
  }

  // Render
  renderer.render(scene, camera);
}

// Start animation
animate(0);