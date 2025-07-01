import * as THREE from "https://esm.sh/three@0.175.0";
import { EffectComposer } from "https://esm.sh/three@0.175.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://esm.sh/three@0.175.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://esm.sh/three@0.175.0/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "https://esm.sh/three@0.175.0/examples/jsm/postprocessing/UnrealBloomPass.js";
import { GUI } from "https://esm.sh/dat.gui@0.7.9";
import Stats from "https://esm.sh/stats.js@0.17.0";

// Audio setup
const audioElement = document.getElementById("background-music");
const audioToggle = document.getElementById("audio-toggle");
const playIcon = document.getElementById("play-icon");
const pauseIcon = document.getElementById("pause-icon");
const audioStatus = document.getElementById("audio-status");

audioToggle.addEventListener("click", () => {
  if (audioElement.paused) {
    audioElement
      .play()
      .then(() => {
        playIcon.style.display = "none";
        pauseIcon.style.display = "block";
        audioStatus.textContent = "Stop";
      })
      .catch((error) => {
        console.error("Audio playback failed:", error);
      });
  } else {
    audioElement.pause();
    playIcon.style.display = "block";
    pauseIcon.style.display = "none";
    audioStatus.textContent = "Play Music";
  }
});

// Initialize stats.js
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb
stats.dom.style.cssText =
  "position:absolute;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000;";
document.body.appendChild(stats.dom);

// Settings object for dat.gui - updated with requested values
const settings = {
  // Black hole settings
  holeRadius: 0.27,
  holeSoftness: 0.15,
  centerGlowIntensity: 2.5,
  ringRadius: 0.35,
  ringWidth: 0.3,

  // Mouse interaction settings
  mouseInteractionEnabled: true,
  mouseInteractionStrength: 0.1, // 20% variation
  easingSpeed: 0.025, // Controls how fast the easing effect is (lower = slower)

  // Noise settings
  noiseScale: 3.8,
  noiseIntensity: 1.0,
  noiseSpeed: 0.33,
  noiseDetail: 2,

  // Grid-breaking settings (minimal changes)
  noiseOffset: 0.0,
  noiseRotation: 0.0,

  // Vignette settings
  vignetteRadius: 1.2,
  vignetteSoftness: 0.68,

  // Animation settings
  animationSpeed: 1.4,
  rotationSpeed: 0.05,

  // Post-processing
  bloomStrength: 0.15,
  bloomRadius: 0.4,
  bloomThreshold: 0.9,
  filmGrainIntensity: 0.065,

  // Background particles settings
  particlesEnabled: true,
  particleCount: 2000,
  particleSize: 0.5,
  particleSpeed: 0.2,
  particleDepth: 50,
  particleColor: "#ffffff"
};

// Color presets for different themes
const colorPresets = {
  default: {
    name: "Cosmic Default",
    particleColor: "#ffffff",
    holeColor: new THREE.Vector3(1.0, 1.0, 1.0), // White
    ringColor: new THREE.Vector3(1.0, 1.0, 1.0), // White
    glowColor: new THREE.Vector3(1.0, 1.0, 1.0), // White
    bloomStrength: 0.15
  },
  emerald: {
    name: "Emerald Nebula",
    particleColor: "#00ff9d",
    holeColor: new THREE.Vector3(0.0, 1.0, 0.6), // Emerald green
    ringColor: new THREE.Vector3(0.0, 0.8, 0.4), // Darker green
    glowColor: new THREE.Vector3(0.2, 1.0, 0.5), // Bright green
    bloomStrength: 0.2
  },
  crimson: {
    name: "Crimson Void",
    particleColor: "#ff3860",
    holeColor: new THREE.Vector3(1.0, 0.2, 0.2), // Red
    ringColor: new THREE.Vector3(0.8, 0.1, 0.2), // Dark red
    glowColor: new THREE.Vector3(1.0, 0.3, 0.1), // Orange-red
    bloomStrength: 0.25
  },
  azure: {
    name: "Azure Depths",
    particleColor: "#36a3ff",
    holeColor: new THREE.Vector3(0.2, 0.4, 1.0), // Blue
    ringColor: new THREE.Vector3(0.1, 0.3, 0.8), // Dark blue
    glowColor: new THREE.Vector3(0.3, 0.7, 1.0), // Light blue
    bloomStrength: 0.18
  },
  amethyst: {
    name: "Amethyst Dream",
    particleColor: "#9d4edd",
    holeColor: new THREE.Vector3(0.6, 0.3, 0.8), // Purple
    ringColor: new THREE.Vector3(0.5, 0.2, 0.7), // Dark purple
    glowColor: new THREE.Vector3(0.7, 0.4, 1.0), // Light purple
    bloomStrength: 0.22
  },
  sunset: {
    name: "Cosmic Sunset",
    particleColor: "#ff9e64",
    holeColor: new THREE.Vector3(1.0, 0.6, 0.2), // Orange
    ringColor: new THREE.Vector3(0.9, 0.4, 0.1), // Dark orange
    glowColor: new THREE.Vector3(1.0, 0.7, 0.3), // Yellow-orange
    bloomStrength: 0.2
  },
  // New gradient/colorful themes
  neon: {
    name: "Neon Pulse",
    particleColor: "#ff00ff",
    holeColor: new THREE.Vector3(1.0, 0.0, 1.0), // Magenta
    ringColor: new THREE.Vector3(0.0, 1.0, 1.0), // Cyan
    glowColor: new THREE.Vector3(0.5, 0.0, 1.0), // Purple
    bloomStrength: 0.3
  },
  rainbow: {
    name: "Rainbow Spectrum",
    particleColor: "#ff0099",
    holeColor: new THREE.Vector3(1.0, 0.0, 0.6), // Pink
    ringColor: new THREE.Vector3(0.0, 0.8, 1.0), // Cyan-blue
    glowColor: new THREE.Vector3(1.0, 0.8, 0.0), // Yellow
    bloomStrength: 0.25
  },
  galaxy: {
    name: "Galaxy Swirl",
    particleColor: "#00ffff",
    holeColor: new THREE.Vector3(0.0, 0.5, 1.0), // Blue
    ringColor: new THREE.Vector3(1.0, 0.0, 0.5), // Pink
    glowColor: new THREE.Vector3(0.5, 0.0, 1.0), // Purple
    bloomStrength: 0.28
  },
  toxic: {
    name: "Toxic Nebula",
    particleColor: "#39ff14",
    holeColor: new THREE.Vector3(0.2, 1.0, 0.1), // Green
    ringColor: new THREE.Vector3(1.0, 0.8, 0.0), // Yellow
    glowColor: new THREE.Vector3(0.0, 0.8, 0.2), // Green
    bloomStrength: 0.22
  },
  inferno: {
    name: "Cosmic Inferno",
    particleColor: "#ff3d00",
    holeColor: new THREE.Vector3(1.0, 0.2, 0.0), // Orange-red
    ringColor: new THREE.Vector3(1.0, 0.8, 0.0), // Yellow
    glowColor: new THREE.Vector3(0.8, 0.0, 0.0), // Red
    bloomStrength: 0.3
  },
  // 5 new themes
  cyberpunk: {
    name: "Cyberpunk City",
    particleColor: "#00f3ff",
    holeColor: new THREE.Vector3(0.0, 0.95, 1.0), // Cyan
    ringColor: new THREE.Vector3(1.0, 0.1, 0.7), // Hot pink
    glowColor: new THREE.Vector3(0.8, 0.8, 0.0), // Yellow
    bloomStrength: 0.35
  },
  aurora: {
    name: "Aurora Borealis",
    particleColor: "#80ff72",
    holeColor: new THREE.Vector3(0.5, 1.0, 0.45), // Light green
    ringColor: new THREE.Vector3(0.0, 0.6, 1.0), // Blue
    glowColor: new THREE.Vector3(0.7, 0.3, 1.0), // Purple
    bloomStrength: 0.28
  },
  quantum: {
    name: "Quantum Flux",
    particleColor: "#7b2ff7",
    holeColor: new THREE.Vector3(0.48, 0.18, 0.97), // Purple
    ringColor: new THREE.Vector3(0.0, 0.8, 0.8), // Teal
    glowColor: new THREE.Vector3(0.9, 0.2, 0.5), // Pink
    bloomStrength: 0.32
  },
  plasma: {
    name: "Plasma Field",
    particleColor: "#fb33db",
    holeColor: new THREE.Vector3(0.98, 0.2, 0.86), // Hot pink
    ringColor: new THREE.Vector3(0.2, 0.4, 1.0), // Blue
    glowColor: new THREE.Vector3(1.0, 0.6, 0.0), // Orange
    bloomStrength: 0.4
  },
  vaporwave: {
    name: "Vaporwave Dream",
    particleColor: "#ff71ce",
    holeColor: new THREE.Vector3(1.0, 0.44, 0.81), // Pink
    ringColor: new THREE.Vector3(0.01, 0.7, 0.89), // Cyan
    glowColor: new THREE.Vector3(0.9, 0.8, 0.2), // Yellow
    bloomStrength: 0.3
  },
  // New Dark Nebula theme with reversed colors
  darknebula: {
    name: "Dark Nebula",
    particleColor: "#ffffff", // Bright white stars
    holeColor: new THREE.Vector3(0.05, 0.05, 0.1), // Very dark blue
    ringColor: new THREE.Vector3(0.1, 0.1, 0.2), // Dark blue
    glowColor: new THREE.Vector3(0.2, 0.2, 0.4), // Slightly brighter blue
    bloomStrength: 0.4 // Strong bloom for bright stars
  }
};

// Add currentPreset to settings - set default as default
settings.currentPreset = "default";

// Mouse tracking
const mouse = new THREE.Vector2(0, 0);
let mouseDistance = 1.0;
let isMouseInCanvas = false;

// Current dynamic values with easing
const currentValues = {
  holeRadius: settings.holeRadius,
  noiseScale: settings.noiseScale,
  noiseIntensity: settings.noiseIntensity
};

// Target values (what we're easing towards)
const targetValues = {
  holeRadius: settings.holeRadius,
  noiseScale: settings.noiseScale,
  noiseIntensity: settings.noiseIntensity
};

// Linear interpolation function for smooth transitions
function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

document.addEventListener("mousemove", (event) => {
  isMouseInCanvas = true;
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  mouseDistance = Math.min(
    1.0,
    Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y)
  );
});

// Handle mouse leaving the canvas
document.addEventListener("mouseout", () => {
  isMouseInCanvas = false;
});

// Create noise textures
function createNoiseTexture(size = 512) {
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size * 4; i += 4) {
    const val = Math.random() * 255;
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
    data[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.format = THREE.RGBAFormat;
  texture.needsUpdate = true;
  return texture;
}

const noiseTexture = createNoiseTexture();
const noiseTexture2 = createNoiseTexture();

// Completely reworked black hole shader to be truly full screen
const blackHoleShader = {
  uniforms: {
    iTime: { value: 0 },
    iResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight)
    },
    iMouse: { value: new THREE.Vector4() },
    iNoise1: { value: noiseTexture },
    iNoise2: { value: noiseTexture2 },

    // Configurable uniforms
    holeRadius: { value: settings.holeRadius },
    holeSoftness: { value: settings.holeSoftness },
    centerGlowIntensity: { value: settings.centerGlowIntensity },
    ringRadius: { value: settings.ringRadius },
    ringWidth: { value: settings.ringWidth },
    vignetteRadius: { value: settings.vignetteRadius },
    vignetteSoftness: { value: settings.vignetteSoftness },
    noiseScale: { value: settings.noiseScale },
    noiseIntensity: { value: settings.noiseIntensity },
    noiseSpeed: { value: settings.noiseSpeed },
    noiseDetail: { value: settings.noiseDetail },
    noiseOffset: { value: settings.noiseOffset },
    noiseRotation: { value: settings.noiseRotation },

    // Color uniforms
    holeColor: { value: colorPresets.default.holeColor },
    ringColor: { value: colorPresets.default.ringColor },
    glowColor: { value: colorPresets.default.glowColor }
  },
  vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
  fragmentShader: `
        uniform float iTime;
        uniform vec2 iResolution;
        uniform vec4 iMouse;
        uniform sampler2D iNoise1;
        uniform sampler2D iNoise2;
        varying vec2 vUv;
        
        // Configurable uniforms
        uniform float holeRadius;
        uniform float holeSoftness;
        uniform float centerGlowIntensity;
        uniform float ringRadius;
        uniform float ringWidth;
        uniform float vignetteRadius;
        uniform float vignetteSoftness;
        uniform float noiseScale;
        uniform float noiseIntensity;
        uniform float noiseSpeed;
        uniform float noiseDetail;
        uniform float noiseOffset;
        uniform float noiseRotation;

        // Color uniforms
        uniform vec3 holeColor;
        uniform vec3 ringColor;
        uniform vec3 glowColor;

        // Improved hash function to break up grid patterns
        float hash21(vec2 p) {
          // Use prime numbers and irrational offsets to break up patterns
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 19.19);
          return fract(p.x * p.y);
        }

        // Improved noise function with subtle rotation to break grid patterns
        float noise(vec2 p) {
          // Add a subtle rotation to break grid alignment
          float angle = noiseRotation;
          mat2 rot = mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
          p = rot * p;
          
          vec2 i = floor(p);
          vec2 f = fract(p);
          
          // Smoother interpolation
          vec2 u = f * f * (3.0 - 2.0 * f);
          
          // Add a small offset to each grid cell to break alignment
          float offset = noiseOffset;
          float a = hash21(i + vec2(0.0, 0.0) + offset);
          float b = hash21(i + vec2(1.0, 0.0) + offset);
          float c = hash21(i + vec2(0.0, 1.0) + offset);
          float d = hash21(i + vec2(1.0, 1.0) + offset);
          
          float noise = mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
          
          // Add a subtle distortion to break up straight lines
          return noise;
        }

        // FBM (Fractal Brownian Motion)
        float fbm(vec2 p) {
          float f = 0.0;
          float w = 0.5;
          float sum = 0.0;
          
          for(int i = 0; i < 8; i++) {
            if (i >= int(noiseDetail)) break; // Configurable detail level
            
            // Add a slight rotation for each octave to break up patterns
            float octaveAngle = float(i) * 0.1;
            mat2 rot = mat2(cos(octaveAngle), sin(octaveAngle), -sin(octaveAngle), cos(octaveAngle));
            
            f += w * noise(p);
            sum += w;
            w *= 0.5;
            p = rot * p * 2.0; // Scale and rotate for next octave
          }
          
          return f / sum;
        }

        void main() {
          // Get the aspect ratio
          float aspect = iResolution.x / iResolution.y;
          
          // Calculate UV coordinates that maintain the center regardless of aspect ratio
          vec2 uv = vUv;
          
          // Calculate the center point
          vec2 center = vec2(0.5, 0.5);
          
          // Calculate distance from center for circular elements
          // This is where we apply aspect ratio correction ONLY for circular elements
          vec2 circleUV = uv - center;
          if (aspect > 1.0) {
            // Landscape: correct the x coordinate for circles
            circleUV.x *= aspect;
          } else {
            // Portrait: correct the y coordinate for circles
            circleUV.y /= aspect;
          }
          float dist = length(circleUV);
          
          // For the noise pattern, we use the raw UV coordinates
          // This ensures the noise fills the entire screen
          vec2 noiseUV = uv;
          
          // Time variables
          float t = iTime * noiseSpeed;
          
          // Create dynamic distortion
          // Scale the coordinates for the noise pattern
          vec2 p = (noiseUV - 0.5) * noiseScale;
          
          // Apply rotation
          float angle = t * 0.2;
          mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
          p = rot * p;
          
          // This is the key for the flowing effect
          vec2 rv = p / (length(p * 2.5) * (p * 30.0 + sin(t * 0.2) * 5.0));
          
          // Generate base pattern
          float val = 0.5 * fbm(p * 2.0 + fbm(p + vec2(t * 0.1, t * -0.05)) * 5.0);
          
          // Apply counter-rotation for more movement
          p = rot * p * 0.7;
          
          // Add more detail
          float pattern = val + 0.5 * fbm(p * val * 8.0 + t * 0.1);
          
          // Enhance the pattern contrast to make it more visible
          pattern = pow(pattern, 0.8) * noiseIntensity;
          
          // Create a bright center with pulsing
          float centerGlow = 1.0 - smoothstep(0.0, 0.6, dist);
          centerGlow = pow(centerGlow, 1.2) * (centerGlowIntensity + sin(t * 1.2) * 0.5);
          
          // Create accretion disk with dynamic thickness
          float ringWidthDynamic = ringWidth + sin(t * 1.5) * 0.05;
          float ringRadiusDynamic = ringRadius + sin(t * 0.7) * 0.05;
          float ringMask = smoothstep(ringRadiusDynamic - ringWidthDynamic, ringRadiusDynamic, dist) * 
                          smoothstep(ringRadiusDynamic + ringWidthDynamic, ringRadiusDynamic, dist);
          
          // Add noise to the ring
          ringMask *= 1.0 + pattern * 0.5;
          
          // Create black hole center
          float holeRadiusDynamic = holeRadius + sin(t * 0.5) * 0.02;
          float holeMask = smoothstep(holeRadiusDynamic - holeSoftness, holeRadiusDynamic + holeSoftness, dist);
          
          // Add noise to hole edge
          holeMask = mix(holeMask, holeMask * (1.0 + pattern * 0.5 - 0.25), 0.7);
          
          // Create the main color with dark rings
          float brightness = pattern * 0.6;  // Increased base brightness for noise
          
          // Apply colors to different components
          vec3 noiseColor = holeColor * brightness;
          vec3 ringComponent = ringColor * ringMask * 0.4;
          vec3 glowComponent = glowColor * centerGlow * 0.2;
          
          // Combine components
          vec3 finalColor = noiseColor + ringComponent + glowComponent;
          
          // Apply hole mask
          finalColor *= holeMask;
          
          // Create vignette for blending - less intense to show more of the pattern
          float vignette = smoothstep(vignetteRadius, vignetteRadius - vignetteSoftness, dist + pattern * 0.1);
          
          // Apply vignette to brightness
          finalColor *= vignette;
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
};

// Film grain shader
const filmGrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0.0 },
    intensity: { value: settings.filmGrainIntensity }
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
        uniform float time;
        uniform float intensity;
        varying vec2 vUv;

        #define SPEED 2.0
        #define MEAN 0.0
        #define VARIANCE 0.5

        float random(vec2 co) {
          return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        float gaussian(float z, float u, float o) {
          return (1.0 / (o * sqrt(2.0 * 3.1415))) * exp(-(((z - u) * (z - u)) / (2.0 * (o * o))));
        }

        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          
          float t = time * SPEED;
          float seed = dot(vUv, vec2(12.9898, 78.233));
          float noise = fract(sin(seed) * 43758.5453 + t);
          noise = gaussian(noise, MEAN, VARIANCE * VARIANCE);
          
          // Apply grain
          vec3 grain = vec3(noise) * (1.0 - color.rgb);
          color.rgb += grain * intensity;
          
          gl_FragColor = color;
        }
      `
};

// Create a single renderer for both scenes
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Create main scene for black hole
const mainScene = new THREE.Scene();

// Orthographic camera for true full screen rendering
const mainCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
mainCamera.position.z = 1;

// Create a background for the scene
const backgroundGeometry = new THREE.PlaneGeometry(2, 2);
const backgroundMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
const background = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
background.position.z = -2;
mainScene.add(background);

// Create a full-screen quad for the black hole shader
const blackHoleQuad = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  new THREE.ShaderMaterial({
    uniforms: blackHoleShader.uniforms,
    vertexShader: blackHoleShader.vertexShader,
    fragmentShader: blackHoleShader.fragmentShader,
    transparent: false,
    depthWrite: false
  })
);
blackHoleQuad.position.z = -1;
mainScene.add(blackHoleQuad);

// Post-processing setup for main scene
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(mainScene, mainCamera);
composer.addPass(renderPass);

// Add bloom for extra glow
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  colorPresets.default.bloomStrength, // Use default bloom strength
  settings.bloomRadius,
  settings.bloomThreshold
);
composer.addPass(bloomPass);

// Add film grain as the final pass
const filmGrainPass = new ShaderPass(filmGrainShader);
composer.addPass(filmGrainPass);

// Create 3D scene for particles
const particleScene = new THREE.Scene();
const perspectiveCamera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
perspectiveCamera.position.z = 50;

// Create background particles (normal particles without DOF)
let particles;
let particlesMaterial;

function createParticles() {
  // Remove existing particles if they exist
  if (particles) {
    particleScene.remove(particles);
    particlesMaterial.dispose();
  }

  // Create particle geometry
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = settings.particleCount;
  const posArray = new Float32Array(particlesCount * 3);
  const scaleArray = new Float32Array(particlesCount);

  for (let i = 0; i < particlesCount; i++) {
    const i3 = i * 3;

    // Create particles in a spherical distribution
    const radius = settings.particleDepth * (0.2 + 0.8 * Math.random());
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    posArray[i3] = radius * Math.sin(phi) * Math.cos(theta);
    posArray[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    posArray[i3 + 2] = radius * Math.cos(phi);

    // Random scale variation for each particle
    scaleArray[i] = 0.5 + Math.random() * 0.5;
  }

  particlesGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(posArray, 3)
  );
  particlesGeometry.setAttribute(
    "scale",
    new THREE.BufferAttribute(scaleArray, 1)
  );

  // Create particle material (simple, no DOF)
  particlesMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      size: { value: settings.particleSize },
      color: { value: new THREE.Color(settings.particleColor) }
    },
    vertexShader: `
          attribute float scale;
          uniform float time;
          uniform float size;
          
          void main() {
            vec3 pos = position;
            
            // Add subtle movement
            float moveFactor = sin(time * 0.2 + position.x * 0.1) * 0.2;
            pos.y += moveFactor;
            pos.x += cos(time * 0.3 + position.y * 0.1) * 0.2;
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            
            // Size attenuation based on distance
            float dist = length(mvPosition.xyz);
            float sizeAttenuation = 1.0 / dist;
            
            gl_PointSize = size * scale * sizeAttenuation * 100.0;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
    fragmentShader: `
          uniform vec3 color;
          
          void main() {
            // Create circular particles
            vec2 uv = gl_PointCoord.xy - 0.5;
            float dist = length(uv);
            
            // Simple circle with soft edge
            float circle = 1.0 - smoothstep(0.45, 0.5, dist);
            
            // Add glow effect
            float glow = 1.0 - smoothstep(0.4, 0.5, dist);
            glow = pow(glow, 2.0) * 0.5;
            
            // Combine for final color
            vec3 finalColor = color * (circle + glow);
            
            // Discard pixels outside the circle
            if (circle < 0.05) discard;
            
            gl_FragColor = vec4(finalColor, circle);
          }
        `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  // Create the particle system
  particles = new THREE.Points(particlesGeometry, particlesMaterial);
  particleScene.add(particles);
}

createParticles();

// Setup dat.gui
const gui = new GUI();
gui.width = 300;

// Black hole folder
const blackHoleFolder = gui.addFolder("Black Hole");
blackHoleFolder.add(settings, "holeRadius", 0.05, 0.5).onChange((value) => {
  blackHoleShader.uniforms.holeRadius.value = value;
});
blackHoleFolder.add(settings, "holeSoftness", 0.01, 0.3).onChange((value) => {
  blackHoleShader.uniforms.holeSoftness.value = value;
});
blackHoleFolder
  .add(settings, "centerGlowIntensity", 0.5, 5)
  .onChange((value) => {
    blackHoleShader.uniforms.centerGlowIntensity.value = value;
  });
blackHoleFolder.add(settings, "ringRadius", 0.2, 0.8).onChange((value) => {
  blackHoleShader.uniforms.ringRadius.value = value;
});
blackHoleFolder.add(settings, "ringWidth", 0.05, 0.3).onChange((value) => {
  blackHoleShader.uniforms.ringWidth.value = value;
});

// Mouse interaction folder
const mouseFolder = gui.addFolder("Mouse Interaction");
mouseFolder
  .add(settings, "mouseInteractionEnabled")
  .name("Enable Mouse Effect");
mouseFolder
  .add(settings, "mouseInteractionStrength", 0.05, 0.5)
  .name("Effect Strength");
mouseFolder.add(settings, "easingSpeed", 0.01, 0.2).name("Easing Speed");
mouseFolder.open();

// Noise folder
const noiseFolder = gui.addFolder("Noise Pattern");
noiseFolder.add(settings, "noiseScale", 0.5, 5).onChange((value) => {
  blackHoleShader.uniforms.noiseScale.value = value;
});
noiseFolder.add(settings, "noiseIntensity", 0.1, 3).onChange((value) => {
  blackHoleShader.uniforms.noiseIntensity.value = value;
});
noiseFolder.add(settings, "noiseSpeed", 0.1, 2).onChange((value) => {
  blackHoleShader.uniforms.noiseSpeed.value = value;
});
noiseFolder.add(settings, "noiseDetail", 1, 8, 1).onChange((value) => {
  blackHoleShader.uniforms.noiseDetail.value = value;
});

// Grid-breaking folder - minimal changes
const gridBreakingFolder = gui.addFolder("Grid Breaking");
gridBreakingFolder.add(settings, "noiseOffset", 0, 10).onChange((value) => {
  blackHoleShader.uniforms.noiseOffset.value = value;
});
gridBreakingFolder.add(settings, "noiseRotation", 0, 1).onChange((value) => {
  blackHoleShader.uniforms.noiseRotation.value = value;
});

// Vignette folder
const vignetteFolder = gui.addFolder("Vignette");
vignetteFolder.add(settings, "vignetteRadius", 0.1, 3).onChange((value) => {
  blackHoleShader.uniforms.vignetteRadius.value = value;
});
vignetteFolder.add(settings, "vignetteSoftness", 0.1, 1).onChange((value) => {
  blackHoleShader.uniforms.vignetteSoftness.value = value;
});

// Background particles folder
const particlesFolder = gui.addFolder("Background Particles");
particlesFolder.add(settings, "particlesEnabled").onChange((value) => {
  // Toggle particles visibility
  if (particles) {
    particles.visible = value;
  }
});
particlesFolder
  .add(settings, "particleCount", 100, 5000, 100)
  .onChange((value) => {
    createParticles();
  });
particlesFolder.add(settings, "particleSize", 0.1, 2).onChange((value) => {
  if (particlesMaterial) {
    particlesMaterial.uniforms.size.value = value;
  }
});
particlesFolder.add(settings, "particleSpeed", 0.01, 10).onChange((value) => {
  // Update the particle speed directly
});
particlesFolder.add(settings, "particleDepth", 10, 100).onChange((value) => {
  createParticles();
});
particlesFolder.addColor(settings, "particleColor").onChange((value) => {
  if (particlesMaterial) {
    particlesMaterial.uniforms.color.value.set(value);
  }
});

// Post-processing folder
const postFolder = gui.addFolder("Post Processing");
postFolder.add(settings, "bloomStrength", 0, 1).onChange((value) => {
  bloomPass.strength = value;
});
postFolder.add(settings, "bloomRadius", 0, 1).onChange((value) => {
  bloomPass.radius = value;
});
postFolder.add(settings, "bloomThreshold", 0, 1).onChange((value) => {
  bloomPass.threshold = value;
});
postFolder.add(settings, "filmGrainIntensity", 0, 0.3).onChange((value) => {
  filmGrainPass.uniforms.intensity.value = value;
});

// Animation folder
const animationFolder = gui.addFolder("Animation");
animationFolder.add(settings, "animationSpeed", 0.1, 3);
animationFolder.add(settings, "rotationSpeed", 0.01, 10).onChange((value) => {
  // This now directly affects the particle rotation speed
});

// Add a function to apply color presets
function applyColorPreset(presetName) {
  if (!colorPresets[presetName]) return;

  const preset = colorPresets[presetName];

  // Update particle color
  settings.particleColor = preset.particleColor;
  if (particlesMaterial) {
    particlesMaterial.uniforms.color.value.set(preset.particleColor);
  }

  // Update shader colors
  blackHoleShader.uniforms.holeColor.value.copy(preset.holeColor);
  blackHoleShader.uniforms.ringColor.value.copy(preset.ringColor);
  blackHoleShader.uniforms.glowColor.value.copy(preset.glowColor);

  // Update bloom settings
  bloomPass.strength = preset.bloomStrength;
  settings.bloomStrength = preset.bloomStrength;

  // Update current preset
  settings.currentPreset = presetName;

  // Force update the GUI to reflect the changes
  for (let i = 0; i < gui.__controllers.length; i++) {
    if (gui.__controllers[i].property === "bloomStrength") {
      gui.__controllers[i].updateDisplay();
    }
    if (gui.__controllers[i].property === "particleColor") {
      gui.__controllers[i].updateDisplay();
    }
    if (gui.__controllers[i].property === "currentPreset") {
      gui.__controllers[i].updateDisplay();
    }
  }
}

// Add color preset selector to GUI
// Add this after creating the other GUI folders
const presetsFolder = gui.addFolder("Color Presets");
presetsFolder
  .add(
    settings,
    "currentPreset",
    Object.keys(colorPresets)
      .map((key) => {
        return { [colorPresets[key].name]: key };
      })
      .reduce((acc, curr) => ({ ...acc, ...curr }), {})
  )
  .name("Theme")
  .onChange(applyColorPreset);
presetsFolder.open(); // Open this folder by default

// Add a reset function to the presets folder
presetsFolder
  .add(
    {
      resetToDefault: function () {
        applyColorPreset("default"); // Reset to default
      }
    },
    "resetToDefault"
  )
  .name("Reset to Default");

// Apply default theme on initialization
applyColorPreset("default");

// Animation
let time = 0;
function animate() {
  // Begin stats measurement
  stats.begin();

  requestAnimationFrame(animate);

  time += 0.01 * settings.animationSpeed;

  // Update shader uniforms
  blackHoleShader.uniforms.iTime.value = time;
  blackHoleShader.uniforms.iMouse.value.x =
    (mouse.x * window.innerWidth) / 2 + window.innerWidth / 2;
  blackHoleShader.uniforms.iMouse.value.y =
    (-mouse.y * window.innerHeight) / 2 + window.innerHeight / 2;
  blackHoleShader.uniforms.iMouse.value.z = 1 - mouseDistance; // Mouse button state

  // Calculate target values based on mouse position or default if mouse is outside canvas
  if (settings.mouseInteractionEnabled) {
    if (isMouseInCanvas) {
      // When mouse is in canvas, calculate dynamic values based on mouse distance
      const variationFactor = 2 * mouseDistance - 1; // -1 to 1 range

      targetValues.holeRadius =
        settings.holeRadius +
        settings.holeRadius *
          settings.mouseInteractionStrength *
          variationFactor;
      targetValues.noiseScale =
        settings.noiseScale +
        settings.noiseScale *
          settings.mouseInteractionStrength *
          variationFactor;
      targetValues.noiseIntensity =
        settings.noiseIntensity +
        settings.noiseIntensity *
          settings.mouseInteractionStrength *
          variationFactor;
    } else {
      // When mouse leaves canvas, ease back to default values
      targetValues.holeRadius = settings.holeRadius;
      targetValues.noiseScale = settings.noiseScale;
      targetValues.noiseIntensity = settings.noiseIntensity;
    }

    // Apply easing to all values
    currentValues.holeRadius = lerp(
      currentValues.holeRadius,
      targetValues.holeRadius,
      settings.easingSpeed
    );
    currentValues.noiseScale = lerp(
      currentValues.noiseScale,
      targetValues.noiseScale,
      settings.easingSpeed
    );
    currentValues.noiseIntensity = lerp(
      currentValues.noiseIntensity,
      targetValues.noiseIntensity,
      settings.easingSpeed
    );

    // Apply the eased values to the shader
    blackHoleShader.uniforms.holeRadius.value = currentValues.holeRadius;
    blackHoleShader.uniforms.noiseScale.value = currentValues.noiseScale;
    blackHoleShader.uniforms.noiseIntensity.value =
      currentValues.noiseIntensity;
  } else {
    // If mouse interaction is disabled, just use the base values
    blackHoleShader.uniforms.holeRadius.value = settings.holeRadius;
    blackHoleShader.uniforms.noiseScale.value = settings.noiseScale;
    blackHoleShader.uniforms.noiseIntensity.value = settings.noiseIntensity;
  }

  filmGrainPass.uniforms.time.value = time;

  // Update background particles
  if (settings.particlesEnabled && particles) {
    // Update particle time uniform
    particlesMaterial.uniforms.time.value = time;

    // Rotate particles - now using rotationSpeed instead of particleSpeed
    particles.rotation.y += 0.001 * settings.rotationSpeed;
    particles.rotation.x += 0.0005 * settings.rotationSpeed;

    // Apply particle movement based on particleSpeed
    const positions = particles.geometry.attributes.position.array;
    const count = positions.length / 3;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Move particles based on their position and particleSpeed
      positions[i3] +=
        Math.sin(time * 0.1 + i * 0.1) * 0.01 * settings.particleSpeed;
      positions[i3 + 1] +=
        Math.cos(time * 0.1 + i * 0.2) * 0.01 * settings.particleSpeed;
      positions[i3 + 2] +=
        Math.sin(time * 0.1 + i * 0.3) * 0.01 * settings.particleSpeed;
    }

    particles.geometry.attributes.position.needsUpdate = true;
  }

  // Update perspective camera
  perspectiveCamera.updateProjectionMatrix();

  // First render the main scene with post-processing
  composer.render();

  // Then render the particles on top if enabled
  if (settings.particlesEnabled) {
    // Save the current state
    renderer.autoClear = false;
    renderer.clearDepth();

    // Render particles with proper blending
    renderer.render(particleScene, perspectiveCamera);

    // Restore state
    renderer.autoClear = true;
  }

  // End stats measurement
  stats.end();
}

animate();

// Handle window resize - CRITICAL for responsiveness
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Update renderer
  renderer.setSize(width, height);
  composer.setSize(width, height);

  // Update the resolution uniform - this is crucial for proper aspect ratio handling
  blackHoleShader.uniforms.iResolution.value.set(width, height);

  // Update perspective camera for particles
  perspectiveCamera.aspect = width / height;
  perspectiveCamera.updateProjectionMatrix();
});