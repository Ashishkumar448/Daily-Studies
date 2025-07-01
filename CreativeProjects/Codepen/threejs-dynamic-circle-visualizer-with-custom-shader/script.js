import * as THREE from "https://esm.sh/three@0.175.0";
import { GUI } from "https://esm.sh/dat.gui@0.7.9";

// Initialize mouse coordinates for the shader
const mouse = {
  x: 0.5, // Default to center
  y: 0.5
};

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.z = 1;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("canvas").replaceWith(renderer.domElement);
renderer.domElement.id = "canvas";

// Expanded color preset definitions
const colorPresets = {
  monochrome: {
    background: [0.05, 0.05, 0.05],
    ring1: [0.9, 0.9, 0.9],
    ring2: [0.6, 0.6, 0.6],
    ring3: [0.75, 0.75, 0.75]
  },
  teal: {
    background: [34 / 255, 30 / 255, 38 / 255],
    ring1: [10 / 255, 205 / 255, 203 / 255],
    ring2: [46 / 255, 72 / 255, 82 / 255],
    ring3: [54 / 255, 147 / 255, 147 / 255]
  },
  sunset: {
    background: [15 / 255, 15 / 255, 30 / 255],
    ring1: [255 / 255, 180 / 255, 80 / 255],
    ring2: [240 / 255, 90 / 255, 40 / 255],
    ring3: [180 / 255, 50 / 255, 120 / 255]
  },
  ocean: {
    background: [10 / 255, 20 / 255, 30 / 255],
    ring1: [60 / 255, 220 / 255, 250 / 255],
    ring2: [30 / 255, 90 / 255, 180 / 255],
    ring3: [20 / 255, 150 / 255, 200 / 255]
  },
  colorfulAudio: {
    background: [0.1, 0.05, 0.2],
    ring1: [1.0, 0.5, 0.0], // Orange inner
    ring2: [1.0, 0.0, 0.0], // Red
    ring3: [0.0, 0.0, 1.0] // Blue
  },
  neon: {
    background: [5 / 255, 5 / 255, 15 / 255],
    ring1: [255 / 255, 50 / 255, 220 / 255],
    ring2: [40 / 255, 240 / 255, 100 / 255],
    ring3: [0 / 255, 180 / 255, 255 / 255]
  },
  retrowave: {
    background: [20 / 255, 10 / 255, 40 / 255],
    ring1: [255 / 255, 60 / 255, 220 / 255],
    ring2: [120 / 255, 40 / 255, 180 / 255],
    ring3: [10 / 255, 230 / 255, 230 / 255]
  }
};

// Parameters for GUI - using the specific defaults from the image
const params = {
  mouseStrength: 0.8, // Bend strength
  mouseRadius: 0.5, // Radius of effect
  grainIntensity: 0.05, // Film grain intensity (from image)
  grainMean: 0.0, // Grain mean value
  grainVariance: 0.5, // Grain variance
  easingSpeed: 0.06, // How quickly the easing happens
  ringCount: 6, // Number of rings
  ringWidth: 0.0072, // Width of rings
  ringSpacing: 0.03, // Space between rings (from image)
  colorPreset: "retrowave", // Current color preset (from image)
  glowStrength: 0.5, // Strength of bloom effect (from image)
  glowSize: 0.03, // Size of the outer glow (from image)
  glowIntensity: 2.0, // Intensity of the glow
  glowThreshold: 0.0, // Threshold for glow effect
  colorIntensity: 1.2, // Color intensity
  additiveBlending: true, // Whether to use additive blending
  animationSpeed: 0.0, // Speed of the animation (default to 0)
  proximityRadius: 0.4 // Radius for proximity glow effect
};

// Setup GUI with proper placement to ensure visibility
const gui = new GUI({ autoPlace: false });
const guiContainer = document.querySelector(".gui-container");
if (guiContainer) {
  guiContainer.appendChild(gui.domElement);
} else {
  document.querySelector("body").appendChild(gui.domElement);
}
gui.domElement.style.position = "absolute";
gui.domElement.style.top = "0";
gui.domElement.style.right = "0";
gui.domElement.style.zIndex = "1000"; // Ensure it's above other elements

const interactionFolder = gui.addFolder("Interaction");
interactionFolder.add(params, "mouseStrength", 0, 2).name("Bend Strength");
interactionFolder.add(params, "mouseRadius", 0.1, 1.0).name("Bend Radius");
interactionFolder.add(params, "proximityRadius", 0.1, 1.0).name("Glow Radius");
interactionFolder.add(params, "easingSpeed", 0.01, 0.2).name("Easing Speed");
interactionFolder.add(params, "animationSpeed", 0, 1).name("Anim Speed");
interactionFolder.open();

const visualFolder = gui.addFolder("Visual");
visualFolder.add(params, "ringCount", 3, 20, 1).name("Ring Count");
visualFolder.add(params, "ringWidth", 0.001, 0.02).name("Ring Width");
visualFolder.add(params, "ringSpacing", 0.005, 0.03).name("Ring Spacing");
visualFolder
  .add(params, "colorPreset", [
    "monochrome",
    "teal",
    "sunset",
    "ocean",
    "colorfulAudio",
    "neon",
    "retrowave"
  ])
  .name("Color Preset");
visualFolder.add(params, "colorIntensity", 0.5, 2).name("Color Intensity");
visualFolder.open();

const glowFolder = gui.addFolder("Glow Effect");
glowFolder.add(params, "glowStrength", 0, 3).name("Glow Strength");
glowFolder.add(params, "glowSize", 0.001, 0.1).name("Glow Size");
glowFolder.add(params, "glowIntensity", 0, 3).name("Glow Intensity");
glowFolder.add(params, "glowThreshold", 0, 0.2).name("Threshold");
glowFolder.add(params, "additiveBlending").name("Additive Blend");
glowFolder.open();

const effectsFolder = gui.addFolder("Effects");
effectsFolder.add(params, "grainIntensity", 0, 0.2).name("Film Grain");
effectsFolder.open();

// Vertex shader - simple pass-through
const vertexShader = `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment shader with simplified glow (no blur or DOF)
const fragmentShaderSource = `
  precision highp float;
  
  varying vec2 vUv;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uTime;
  uniform float uMouseStrength;
  uniform float uMouseRadius;
  uniform int uRingCount;
  uniform float uRingWidth;
  uniform float uRingSpacing;
  
  // Glow effect uniforms
  uniform float uGlowStrength;
  uniform float uGlowSize;
  uniform float uGlowIntensity;
  uniform float uGlowThreshold;
  uniform float uColorIntensity;
  uniform bool uAdditiveBlending;
  uniform float uProximityRadius;
  
  // Grain effect uniforms
  uniform float uGrainIntensity;
  uniform float uGrainMean;
  uniform float uGrainVariance;
  
  // Color uniforms
  uniform vec3 uBackgroundColor;
  uniform vec3 uRing1Color;
  uniform vec3 uRing2Color;
  uniform vec3 uRing3Color;
  uniform float uAnimationSpeed;
  
  // Constants
  const float PI = 3.14159265359;
  const float TAU = 6.28318530718;
  
  // Hash function for film grain
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  
  // Advanced grain function
  float gaussian(float z, float u, float o) {
    return (1.0 / (o * sqrt(2.0 * PI))) * exp(-(((z - u) * (z - u)) / (2.0 * (o * o))));
  }
  
  // Generate a ring with wave effect
  float generateRing(float baseRadius, float waveFactor, float angle, float finalMultiplier) {
    return baseRadius + 0.04 * cos(angle * 7.0 + waveFactor) * finalMultiplier;
  }
  
  // Calculate distance to a ring
  float ringDistance(float radius, float pos) {
    return abs(radius - pos);
  }
  
  // Simple glow effect (no blur) - optimized version
  vec3 simpleGlow(float dist, float size, float intensity, vec3 color) {
    float glowFactor = smoothstep(size * 3.0, 0.0, dist) * intensity;
    return color * glowFactor;
  }
  
  // Apply film grain - enhanced to work over all elements
  vec3 applyGrain(vec3 color, float seed) {
    // Generate noise
    float noise = fract(sin(seed) * 43758.5453);
    noise = gaussian(noise, uGrainMean, uGrainVariance * uGrainVariance);
    
    // Create grain effect that works on all brightness levels
    // This approach ensures grain is visible on both dark and bright areas
    vec3 grainColor = vec3(noise * 2.0 - 1.0);
    
    // Apply with specified intensity - using a method that affects all luminance levels
    return mix(color, color + grainColor, uGrainIntensity);
  }
  
  void main() {
    // Scaling
    vec2 fragCoord = vUv * uResolution;
    vec2 Scaled = (fragCoord * 2.0 - uResolution) / uResolution.y * 0.6;
    float t = 2.0 / uResolution.y;
    
    // Mouse coordinates in the same space as Scaled
    vec2 mouseScaled = (uMouse * 2.0 - uResolution) / uResolution.y * 0.6;
    
    // Flip Y coordinate to fix top/bottom orientation issue
    mouseScaled.y = -mouseScaled.y;
    
    // Info
    float Length = length(Scaled);
    float Angle = atan(Scaled.y, Scaled.x) + PI; // [-Pi,Pi]->[0,2Pi]
    
    // Mouse angle
    float mouseAngle = atan(mouseScaled.y, mouseScaled.x) + PI;
    
    // Calculate distance to mouse for bending and glow effects
    float distToMouse = length(Scaled - mouseScaled);
    
    // Calculate mouse proximity for glow effect
    float glowProximity = max(0.0, 1.0 - distToMouse / uProximityRadius);
    // Square it for more concentrated effect near mouse
    glowProximity = glowProximity * glowProximity;
    
    // Mouse proximity for bending effect
    float bendProximity = smoothstep(uMouseRadius, 0.0, distToMouse);
    
    // Default is perfectly circular rings (no wave)
    float FinalMultiplier = 0.0;
    
    // Only apply wave effect near the mouse
    if (distToMouse < uMouseRadius) {
      // Calculate the angular distance from the mouse angle
      float AngleDifference = abs(mouseAngle - Angle);
      float DistanceToWave = min(AngleDifference, TAU - AngleDifference);
      
      // Apply the wave multiplier
      FinalMultiplier = pow(max(1.0, DistanceToWave), -4.0) * bendProximity * uMouseStrength;
    }
    
    // Time-based animation
    float animTime = uTime * uAnimationSpeed;
    
    // Initialize colors
    vec3 bgColor = uBackgroundColor;
    vec3 ringColor = vec3(0.0);
    vec3 glowColor = vec3(0.0);
    
    // Base radius for first ring
    float baseRadius = 0.5;
    
    // Create arrays to store ring information
    float ringDistances[20];  // Distance from current pixel to each ring
    vec3 ringColors[20];      // Color for each ring
    
    // Calculate all ring positions and distances
    for (int i = 0; i < 20; i++) {
      if (i >= uRingCount) break;
      
      // Calculate base ring radius
      float ringRadius = baseRadius - float(i) * uRingSpacing;
      
      // Add variation to wave phase for each ring
      float phaseFactor = 0.0;
      vec3 color;
      
      // Determine color based on ring index
      int colorIndex = i % 3;
      if (colorIndex == 0) {
        phaseFactor = 0.0;
        color = uRing1Color;
      } else if (colorIndex == 1) {
        phaseFactor = TAU / 3.0;
        color = uRing2Color;
      } else {
        phaseFactor = -TAU / 3.0;
        color = uRing3Color;
      }
      
      // Add subtle time-based animation to the phase
      phaseFactor += animTime * float(i % 2 == 0 ? 1.0 : -1.0);
      
      // Generate ring position with wave effect
      float ringPos = generateRing(ringRadius, phaseFactor, Angle, FinalMultiplier);
      
      // Calculate distance to this ring
      ringDistances[i] = ringDistance(ringPos, Length);
      ringColors[i] = color * uColorIntensity;
    }
    
    // Start with background
    vec3 finalColor = bgColor;
    
    // First pass - Draw rings
    for (int i = 0; i < 20; i++) {
      if (i >= uRingCount) break;
      
      float dist = ringDistances[i];
      vec3 color = ringColors[i];
      
      // Draw the ring itself
      float ringMask = smoothstep(uRingWidth + t, uRingWidth, dist);
      
      // Apply the ring color
      ringColor = color * ringMask;
      finalColor += ringColor;
    }
    
    // Second pass - Apply simple glow (no blur)
    if (glowProximity > 0.0) {
      vec3 glowEffect = vec3(0.0);
      
      for (int i = 0; i < 20; i++) {
        if (i >= uRingCount) break;
        
        float dist = ringDistances[i];
        if (dist <= uRingWidth) continue; // Skip the ring itself
        
        // Apply simple glow to this ring
        vec3 ringGlow = simpleGlow(
          dist,
          uGlowSize,
          uGlowIntensity,
          ringColors[i]
        );
        
        // Scale glow by proximity to mouse
        ringGlow *= glowProximity * uGlowStrength;
        
        // Add to glow accumulation
        glowEffect += ringGlow;
      }
      
      // Apply the glow using additive or screen blend
      if (uAdditiveBlending) {
        // Additive blending - more intense
        finalColor += glowEffect;
      } else {
        // Screen blending - softer
        finalColor = 1.0 - (1.0 - finalColor) * (1.0 - glowEffect);
      }
    }
    
    // Apply film grain with time variation for better animation
    float seed = dot(vUv, vec2(12.9898, 78.233)) + uTime * 0.5;
    finalColor = applyGrain(finalColor, seed);
    
    // Tone mapping to prevent oversaturation
    finalColor = finalColor / (1.0 + finalColor);
    
    // Output final color
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// Get preset colors
function getColorsFromPreset(presetName) {
  return colorPresets[presetName];
}

// Create shader material with initial colors
const currentColors = getColorsFromPreset(params.colorPreset);
const material = new THREE.ShaderMaterial({
  vertexShader: vertexShader,
  fragmentShader: fragmentShaderSource,
  uniforms: {
    uResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight)
    },
    uMouse: {
      value: new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2)
    },
    uTime: { value: 0 },
    uMouseStrength: { value: params.mouseStrength },
    uMouseRadius: { value: params.mouseRadius },
    uRingCount: { value: params.ringCount },
    uRingWidth: { value: params.ringWidth },
    uRingSpacing: { value: params.ringSpacing },
    uGlowStrength: { value: params.glowStrength },
    uGlowSize: { value: params.glowSize },
    uGlowIntensity: { value: params.glowIntensity },
    uGlowThreshold: { value: params.glowThreshold },
    uColorIntensity: { value: params.colorIntensity },
    uAdditiveBlending: { value: params.additiveBlending },
    uGrainIntensity: { value: params.grainIntensity },
    uGrainMean: { value: params.grainMean },
    uGrainVariance: { value: params.grainVariance },
    uAnimationSpeed: { value: params.animationSpeed },
    uProximityRadius: { value: params.proximityRadius },
    uBackgroundColor: { value: new THREE.Vector3(...currentColors.background) },
    uRing1Color: { value: new THREE.Vector3(...currentColors.ring1) },
    uRing2Color: { value: new THREE.Vector3(...currentColors.ring2) },
    uRing3Color: { value: new THREE.Vector3(...currentColors.ring3) }
  }
});

// Create plane geometry that fills the screen
const geometry = new THREE.PlaneGeometry(2, 2);
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// Mouse tracking with easing
let targetMouseX = window.innerWidth / 2;
let targetMouseY = window.innerHeight / 2;
let currentMouseX = targetMouseX;
let currentMouseY = targetMouseY;
let isMouseMoving = false;
let mouseTimer = null;

function onMouseMove(event) {
  targetMouseX = event.clientX;
  targetMouseY = event.clientY;
  isMouseMoving = true;

  // Update mouse position for external use
  mouse.x = event.clientX / window.innerWidth;
  mouse.y = event.clientY / window.innerHeight;

  // Clear any existing timer
  if (mouseTimer) clearTimeout(mouseTimer);

  // Set a timer to track when mouse stops moving
  mouseTimer = setTimeout(() => {
    isMouseMoving = false;
  }, 100);
}

document.addEventListener("mousemove", onMouseMove, false);

// Animation loop
const clock = new THREE.Clock();
let lastTime = 0;
let frameCount = 0;
let fps = 0;

function animate() {
  requestAnimationFrame(animate);

  // FPS counter
  const currentTime = performance.now();
  frameCount++;

  if (currentTime - lastTime >= 1000) {
    fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
    document.getElementById("fps").textContent = `FPS: ${fps}`;
    frameCount = 0;
    lastTime = currentTime;
  }

  // Get elapsed time
  const time = clock.getElapsedTime();

  // Calculate easing for mouse movement
  const easingFactor = params.easingSpeed;

  // When mouse is moving, follow closely
  // When mouse stops, ease back to center more slowly
  let xEasing = isMouseMoving ? easingFactor * 2 : easingFactor * 0.5;
  let yEasing = isMouseMoving ? easingFactor * 2 : easingFactor * 0.5;

  // Apply easing
  currentMouseX += (targetMouseX - currentMouseX) * xEasing;
  currentMouseY += (targetMouseY - currentMouseY) * yEasing;

  // Update color preset if changed
  if (
    material.uniforms.uBackgroundColor.value.x !==
      colorPresets[params.colorPreset].background[0] ||
    material.uniforms.uRing1Color.value.x !==
      colorPresets[params.colorPreset].ring1[0]
  ) {
    const newColors = getColorsFromPreset(params.colorPreset);
    material.uniforms.uBackgroundColor.value.set(...newColors.background);
    material.uniforms.uRing1Color.value.set(...newColors.ring1);
    material.uniforms.uRing2Color.value.set(...newColors.ring2);
    material.uniforms.uRing3Color.value.set(...newColors.ring3);
  }

  // Update uniforms
  material.uniforms.uTime.value = time;
  material.uniforms.uMouse.value.set(currentMouseX, currentMouseY);
  material.uniforms.uMouseStrength.value = params.mouseStrength;
  material.uniforms.uMouseRadius.value = params.mouseRadius;
  material.uniforms.uRingCount.value = params.ringCount;
  material.uniforms.uRingWidth.value = params.ringWidth;
  material.uniforms.uRingSpacing.value = params.ringSpacing;
  material.uniforms.uGlowStrength.value = params.glowStrength;
  material.uniforms.uGlowSize.value = params.glowSize;
  material.uniforms.uGlowIntensity.value = params.glowIntensity;
  material.uniforms.uGlowThreshold.value = params.glowThreshold;
  material.uniforms.uColorIntensity.value = params.colorIntensity;
  material.uniforms.uAdditiveBlending.value = params.additiveBlending;
  material.uniforms.uGrainIntensity.value = params.grainIntensity;
  material.uniforms.uGrainMean.value = params.grainMean;
  material.uniforms.uGrainVariance.value = params.grainVariance;
  material.uniforms.uAnimationSpeed.value = params.animationSpeed;
  material.uniforms.uProximityRadius.value = params.proximityRadius;

  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  material.uniforms.uResolution.value.set(
    window.innerWidth,
    window.innerHeight
  );
});

// Custom cursor implementation with throttling for better performance
const cursor = document.querySelector(".custom-cursor");
let lastCursorUpdate = 0;

// Make sure the cursor variable is defined
if (cursor) {
  document.addEventListener("mousemove", (e) => {
    // Throttle cursor updates to every 16ms (approx 60fps)
    const now = performance.now();
    if (now - lastCursorUpdate > 16) {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
      lastCursorUpdate = now;
    }
  });

  // Make cursor larger on hover over interactive elements
  document.addEventListener("mouseover", (e) => {
    if (
      e.target.tagName === "BUTTON" ||
      e.target.tagName === "A" ||
      e.target.classList.contains("interactive")
    ) {
      cursor.style.width = "calc(var(--cursor-size) * 2)";
      cursor.style.height = "calc(var(--cursor-size) * 2)";
    }
  });

  // Reset cursor size when not hovering over interactive elements
  document.addEventListener("mouseout", (e) => {
    if (
      e.target.tagName === "BUTTON" ||
      e.target.tagName === "A" ||
      e.target.classList.contains("interactive")
    ) {
      cursor.style.width = "var(--cursor-size)";
      cursor.style.height = "var(--cursor-size)";
    }
  });

  // Hide system cursor when custom cursor is active
  document.body.style.cursor = "none";

  // Handle cursor on page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      // Position cursor in the center initially
      cursor.style.left = `${window.innerWidth / 2}px`;
      cursor.style.top = `${window.innerHeight / 2}px`;
    });
  } else {
    // DOM already loaded, position cursor now
    cursor.style.left = `${window.innerWidth / 2}px`;
    cursor.style.top = `${window.innerHeight / 2}px`;
  }
}

// Play button functionality
const playButton = document.getElementById("playButton");
if (playButton) {
  playButton.addEventListener("click", () => {
    // You can add play/pause functionality here
    console.log("Play button clicked");

    // Toggle animation speed as an example
    if (params.animationSpeed === 0) {
      params.animationSpeed = 0.5;
      playButton.textContent = "PAUSE";
    } else {
      params.animationSpeed = 0;
      playButton.textContent = "PLAY";
    }
  });
}

// Start the animation loop
animate();