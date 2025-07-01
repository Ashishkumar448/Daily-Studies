import * as THREE from "https://esm.sh/three@0.175.0";
import { GUI } from "https://esm.sh/dat.gui@0.7.9";
import Stats from "https://esm.sh/stats.js@0.17.0";
import { EffectComposer } from "https://esm.sh/three@0.175.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://esm.sh/three@0.175.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://esm.sh/three@0.175.0/examples/jsm/postprocessing/UnrealBloomPass.js";

// Shaders
const vertexShader = `
precision highp float;

// Attributes
attribute vec3 position;
attribute vec2 uv;
attribute float pindex;
attribute vec3 offset;
attribute float angle;

// Uniforms
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float uTime;
uniform float uRandom;
uniform float uDepth;
uniform float uSize;
uniform vec2 uTextureSize;
uniform sampler2D uTexture;
uniform sampler2D uTouch;
uniform vec2 uMouse;
uniform float uMouseSize;
uniform float uMouseForce;
uniform float uEasingFactor;
uniform float uIdleMovement;
uniform float uIdleSpeed;
uniform float uIdleIntensity;
uniform float uParticleSpring;

// Varying
varying vec2 vPUv;
varying vec2 vUv;
varying float vGrey;
varying float vDistance;

// Function to generate random value
float random(float n) {
  return fract(sin(n) * 43758.5453123);
}

// Simplex noise function
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise_1_2(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Cubic easing function
float easeCubicOut(float t) {
  float f = t - 1.0;
  return f * f * f + 1.0;
}

// Exponential easing function
float easeExpoOut(float t) {
  return t == 1.0 ? 1.0 : 1.0 - pow(2.0, -10.0 * t);
}

// Elastic easing function (more natural)
float easeElasticOut(float t) {
  float p = 0.3;
  return pow(2.0, -10.0 * t) * sin((t - p / 4.0) * (2.0 * 3.14159) / p) + 1.0;
}

void main() {
  vUv = uv;
  
  // Pixel UV coordinates within the texture
  vec2 puv = offset.xy / uTextureSize;
  vPUv = puv;
  
  // Sample the image pixel color
  vec4 colA = texture2D(uTexture, puv);
  float grey = colA.r * 0.21 + colA.g * 0.71 + colA.b * 0.07;
  vGrey = grey;
  
  // Original position (home position)
  vec3 homePosition = vec3(offset.xy, 0.0);
  
  // Displacement
  vec3 displaced = homePosition;
  
  // Randomize position slightly
  displaced.xy += vec2(random(pindex) - 0.5, random(offset.x + pindex) - 0.5) * uRandom;
  
  // Calculate random z value for depth variation
  float rndz = (random(pindex) + snoise_1_2(vec2(pindex * 0.1, uTime * 0.1)));
  displaced.z += rndz * (random(pindex) * 2.0 * uDepth);
  
  // Apply touch interaction from texture
  float t = texture2D(uTouch, puv).r;
  displaced.z += t * 10.0 * rndz;
  displaced.x += cos(angle) * t * 10.0 * rndz;
  displaced.y += sin(angle) * t * 10.0 * rndz;
  
  // IDLE ANIMATION - subtle movement when no mouse interaction
  // Each particle moves in a unique pattern based on its index
  if (uIdleMovement > 0.0) {
    float idleTime = uTime * uIdleSpeed;
    float noise1 = snoise_1_2(vec2(pindex * 0.01, idleTime * 0.1));
    float noise2 = snoise_1_2(vec2(pindex * 0.02, idleTime * 0.15 + 100.0));
    float noise3 = snoise_1_2(vec2(pindex * 0.03, idleTime * 0.05 + 300.0));
    
    // Create a breathing effect
    float breathe = sin(idleTime * 0.2 + pindex * 0.01) * 0.5 + 0.5;
    
    // Apply subtle movement
    displaced.x += noise1 * uIdleIntensity * uIdleMovement * (1.0 - min(1.0, t * 2.0));
    displaced.y += noise2 * uIdleIntensity * uIdleMovement * (1.0 - min(1.0, t * 2.0));
    displaced.z += noise3 * uIdleIntensity * 2.0 * uIdleMovement * breathe * (1.0 - min(1.0, t * 2.0));
  }
  
  // DIRECT MOUSE INTERACTION
  // Calculate distance from this particle to mouse position
  float dist = distance(offset.xy, uMouse * uTextureSize);
  vDistance = dist;
  
  // If within mouse influence radius, apply force
  if (dist < uMouseSize) {
    // Calculate force based on distance (closer = stronger)
    float forceFactor = 1.0 - dist/uMouseSize;
    
    // Apply easing for smoother effect
    float easedForce = easeExpoOut(forceFactor) * uMouseForce;
    
    // Get direction from mouse to particle (for pushing away effect)
    vec2 dir = normalize(offset.xy - uMouse * uTextureSize);
    
    // Apply force with spring-like behavior
    float springFactor = uParticleSpring;
    float dampingFactor = 0.6;
    
    // Create a more organic movement with noise
    float uniqueness = snoise_1_2(vec2(pindex * 0.1, uTime * 0.2));
    float organicFactor = 0.8 + uniqueness * 0.4;
    
    // Apply force with organic variation
    displaced.x += dir.x * easedForce * 8.0 * organicFactor;
    displaced.y += dir.y * easedForce * 8.0 * organicFactor;
    
    // Z-axis movement for depth effect
    float zForce = easedForce * 15.0 * rndz * organicFactor;
    
    // Particles closer to the center move more in Z
    float centerFactor = 1.0 - min(1.0, dist / (uMouseSize * 0.5));
    displaced.z += zForce * (0.5 + centerFactor * 0.5);
  }
  
  // Calculate particle size with subtle variation
  float psize = (snoise_1_2(vec2(uTime * 0.3, pindex) * 0.5) * 0.3 + 1.7);
  psize *= max(grey, 0.2);
  psize *= uSize;
  
  // Position of the vertex within the particle quad
  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  mvPosition.xyz += position * psize;
  
  gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = `
precision highp float;

uniform sampler2D uTexture;
uniform float uTime;
uniform float uMouseSize;
uniform vec2 uMouse;
uniform vec2 uTextureSize;
uniform float uGlowStrength;
uniform float uColorVariation;

varying vec2 vPUv;
varying vec2 vUv;
varying float vGrey;
varying float vDistance;

void main() {
  // Sample the pixel color from the original image
  vec4 colA = texture2D(uTexture, vPUv);
  
  // Convert to greyscale using luminosity method
  float grey = vGrey;
  
  // Add subtle color variation based on time and position
  float r = grey;
  float g = grey;
  float b = grey;
  
  if (uColorVariation > 0.0) {
    float colorNoise = sin(vPUv.x * 10.0 + uTime * 0.2) * sin(vPUv.y * 8.0 - uTime * 0.1) * 0.5 + 0.5;
    float colorShift = colorNoise * uColorVariation;
    
    // Subtle color tinting
    r = grey * (1.0 + colorShift * 0.1);
    g = grey * (1.0 + colorShift * 0.05);
    b = grey * (1.0 + colorShift * 0.15);
  }
  
  vec4 colB = vec4(r, g, b, 1.0);
  
  // Create circle shape for the particle with soft edge
  float border = 0.35;
  float radius = 0.5;
  float dist = radius - distance(vUv, vec2(0.5));
  float t = smoothstep(0.0, border, dist);
  
  // Add subtle glow effect near mouse
  float mouseProximity = 1.0 - min(1.0, vDistance / uMouseSize);
  float glow = mouseProximity * uGlowStrength;
  
  // Final color with glow
  vec4 color = colB;
  color.rgb += glow * 0.2; // Subtle brightness increase near mouse
  color.a = t;
  
  gl_FragColor = color;
}
`;

class App {
  constructor() {
    this.container = document.getElementById("container");

    this.camera = null;
    this.scene = null;
    this.renderer = null;
    this.composer = null;

    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.mouse = new THREE.Vector2(0.5, 0.5); // Center of screen
    this.targetMouse = new THREE.Vector2(0.5, 0.5); // For smooth mouse movement
    this.mouseVelocity = new THREE.Vector2(0, 0);
    this.lastMouse = new THREE.Vector2(0.5, 0.5);
    this.mouseSpeed = 0;

    this.image = document.getElementById("source-image");
    this.imageTexture = null;
    this.imageWidth = 320;
    this.imageHeight = 180;
    this.numPoints = this.imageWidth * this.imageHeight;
    this.numVisiblePoints = 0;
    this.threshold = 34;

    this.touchCanvas = null;
    this.touchContext = null;
    this.touchTexture = null;

    this.time = 0;
    this.isRunning = true;
    this.isMouseMoving = false;
    this.mouseMovingTimeout = null;

    this.stats = new Stats();
    this.stats.showPanel(0);
    this.container.appendChild(this.stats.dom);

    this.gui = null;
    this.guiParams = {
      particleSize: 1.0,
      randomness: 0.6, // Reduced for more subtle effect
      depth: 3.0,
      mouseSize: 80, // Increased for wider influence
      mouseForce: 0.8, // Reduced for subtlety
      mouseSmoothing: 0.12, // Smoother movement
      idleMovement: 0.4, // Subtle movement when idle
      idleSpeed: 0.5,
      idleIntensity: 0.8,
      particleSpring: 0.7, // Spring-like behavior
      glowStrength: 0.3, // Subtle glow effect
      colorVariation: 0.15, // Subtle color variation
      fadeSpeed: 0.08, // Slower fade for smoother trails
      debug: false
    };

    this.init();
  }

  init() {
    this.initRenderer();
    this.initScene();
    this.initCamera();
    this.initLights();
    this.initPostprocessing();
    this.loadTexture();
    this.initGUI();
    this.initTouchTexture();

    this.addListeners();
    this.animate();
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);
  }

  initScene() {
    this.scene = new THREE.Scene();
  }

  initCamera() {
    const fov = 45;
    const aspect = this.width / this.height;
    const near = 1;
    const far = 1000;

    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(0, 0, 300);
  }

  initLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(ambientLight);
  }

  initPostprocessing() {
    this.composer = new EffectComposer(this.renderer);

    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.width, this.height),
      1.2, // strength (reduced for subtlety)
      0.5, // radius (increased for smoother bloom)
      0.85 // threshold
    );
    this.composer.addPass(bloomPass);
  }

  initGUI() {
    this.gui = new GUI();
    this.gui
      .add(this.guiParams, "particleSize", 0.1, 3.0)
      .name("Particle Size");
    this.gui.add(this.guiParams, "randomness", 0.0, 5.0).name("Randomness");
    this.gui.add(this.guiParams, "depth", 1.0, 10.0).name("Depth");
    this.gui.add(this.guiParams, "mouseSize", 20, 150).name("Mouse Radius");
    this.gui.add(this.guiParams, "mouseForce", 0.1, 3.0).name("Mouse Force");
    this.gui
      .add(this.guiParams, "mouseSmoothing", 0.01, 0.5)
      .name("Mouse Smoothing");

    // New parameters
    const advancedFolder = this.gui.addFolder("Advanced");
    advancedFolder
      .add(this.guiParams, "idleMovement", 0.0, 1.0)
      .name("Idle Movement");
    advancedFolder
      .add(this.guiParams, "idleSpeed", 0.1, 2.0)
      .name("Idle Speed");
    advancedFolder
      .add(this.guiParams, "idleIntensity", 0.1, 2.0)
      .name("Idle Intensity");
    advancedFolder
      .add(this.guiParams, "particleSpring", 0.1, 2.0)
      .name("Spring Effect");
    advancedFolder
      .add(this.guiParams, "glowStrength", 0.0, 1.0)
      .name("Glow Strength");
    advancedFolder
      .add(this.guiParams, "colorVariation", 0.0, 0.5)
      .name("Color Variation");
    advancedFolder
      .add(this.guiParams, "fadeSpeed", 0.01, 0.3)
      .name("Fade Speed");

    this.gui.add(this.guiParams, "debug").name("Debug Mode");
  }

  loadTexture() {
    this.image.onload = () => {
      this.imageTexture = new THREE.Texture(this.image);
      this.imageTexture.needsUpdate = true;
      this.initParticles();
    };

    // If image is already loaded
    if (this.image.complete) {
      this.imageTexture = new THREE.Texture(this.image);
      this.imageTexture.needsUpdate = true;
      this.initParticles();
    }
  }

  initTouchTexture() {
    this.touchCanvas = document.createElement("canvas");
    this.touchCanvas.width = this.imageWidth;
    this.touchCanvas.height = this.imageHeight;
    this.touchContext = this.touchCanvas.getContext("2d");

    // Create grayscale image
    this.touchContext.fillStyle = "black";
    this.touchContext.fillRect(0, 0, this.imageWidth, this.imageHeight);

    // Create texture
    this.touchTexture = new THREE.Texture(this.touchCanvas);
    this.touchTexture.minFilter = THREE.LinearFilter;
    this.touchTexture.magFilter = THREE.LinearFilter;
    this.touchTexture.needsUpdate = true;

    // Debug: Add canvas to body to see what's happening
    if (this.guiParams.debug) {
      this.touchCanvas.style.position = "absolute";
      this.touchCanvas.style.top = "0";
      this.touchCanvas.style.left = "0";
      this.touchCanvas.style.zIndex = "9999";
      this.touchCanvas.style.border = "1px solid red";
      this.touchCanvas.style.width = "320px";
      this.touchCanvas.style.height = "180px";
      document.body.appendChild(this.touchCanvas);
    }
  }

  initParticles() {
    // Filter image pixels to keep only those above threshold
    let originalColors;
    let numVisible = 0;
    const imgData = this.getImageData();
    originalColors = Float32Array.from(imgData.data);

    for (let i = 0; i < this.numPoints; i++) {
      if (originalColors[i * 4] > this.threshold) numVisible++;
    }

    this.numVisiblePoints = numVisible;

    // Create geometry
    const geometry = new THREE.InstancedBufferGeometry();

    // Positions (vertices of quad)
    const positions = new THREE.BufferAttribute(new Float32Array(4 * 3), 3);
    positions.setXYZ(0, -0.5, 0.5, 0.0);
    positions.setXYZ(1, 0.5, 0.5, 0.0);
    positions.setXYZ(2, -0.5, -0.5, 0.0);
    positions.setXYZ(3, 0.5, -0.5, 0.0);
    geometry.setAttribute("position", positions);

    // UVs
    const uvs = new THREE.BufferAttribute(new Float32Array(4 * 2), 2);
    uvs.setXY(0, 0.0, 0.0);
    uvs.setXY(1, 1.0, 0.0);
    uvs.setXY(2, 0.0, 1.0);
    uvs.setXY(3, 1.0, 1.0);
    geometry.setAttribute("uv", uvs);

    // Index
    geometry.setIndex(
      new THREE.BufferAttribute(new Uint16Array([0, 2, 1, 2, 3, 1]), 1)
    );

    // Instanced attributes
    const indices = new Uint16Array(this.numVisiblePoints);
    const offsets = new Float32Array(this.numVisiblePoints * 3);
    const angles = new Float32Array(this.numVisiblePoints);

    for (let i = 0, j = 0; i < this.numPoints; i++) {
      if (originalColors[i * 4] <= this.threshold) continue;

      offsets[j * 3 + 0] = i % this.imageWidth;
      offsets[j * 3 + 1] = Math.floor(i / this.imageWidth);
      offsets[j * 3 + 2] = 0;

      indices[j] = i;
      angles[j] = Math.random() * Math.PI;

      j++;
    }

    geometry.setAttribute(
      "pindex",
      new THREE.InstancedBufferAttribute(indices, 1, false)
    );
    geometry.setAttribute(
      "offset",
      new THREE.InstancedBufferAttribute(offsets, 3, false)
    );
    geometry.setAttribute(
      "angle",
      new THREE.InstancedBufferAttribute(angles, 1, false)
    );

    // Material
    const uniforms = {
      uTime: { value: 0 },
      uRandom: { value: this.guiParams.randomness },
      uDepth: { value: this.guiParams.depth },
      uSize: { value: this.guiParams.particleSize },
      uTextureSize: {
        value: new THREE.Vector2(this.imageWidth, this.imageHeight)
      },
      uTexture: { value: this.imageTexture },
      uTouch: { value: this.touchTexture },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uMouseSize: { value: this.guiParams.mouseSize },
      uMouseForce: { value: this.guiParams.mouseForce },
      uEasingFactor: { value: 0.2 },
      uIdleMovement: { value: this.guiParams.idleMovement },
      uIdleSpeed: { value: this.guiParams.idleSpeed },
      uIdleIntensity: { value: this.guiParams.idleIntensity },
      uParticleSpring: { value: this.guiParams.particleSpring },
      uGlowStrength: { value: this.guiParams.glowStrength },
      uColorVariation: { value: this.guiParams.colorVariation }
    };

    const material = new THREE.RawShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      depthTest: false,
      transparent: true
    });

    // Create mesh
    this.particles = new THREE.Mesh(geometry, material);
    this.scene.add(this.particles);

    // Center the particles
    this.particles.position.x = -this.imageWidth / 2;
    this.particles.position.y = -this.imageHeight / 2;
  }

  getImageData() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = this.imageWidth;
    canvas.height = this.imageHeight;
    ctx.scale(1, -1); // Flip y
    ctx.drawImage(this.image, 0, 0, this.imageWidth, this.imageHeight * -1);

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  updateTouchTexture() {
    // Clear canvas with fade effect for smoother trails
    this.touchContext.fillStyle = `rgba(0, 0, 0, ${this.guiParams.fadeSpeed})`;
    this.touchContext.fillRect(0, 0, this.imageWidth, this.imageHeight);

    // Draw mouse position with velocity-based intensity
    const x = this.mouse.x * this.imageWidth;
    const y = this.mouse.y * this.imageHeight;
    const size = this.guiParams.mouseSize;

    // Calculate intensity based on mouse speed
    const speedFactor = Math.min(1, this.mouseSpeed * 15);
    const intensity = this.isMouseMoving ? 0.7 + speedFactor * 0.3 : 0.5;

    // Create gradient with more natural falloff
    const gradient = this.touchContext.createRadialGradient(
      x,
      y,
      0,
      x,
      y,
      size
    );

    gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
    gradient.addColorStop(0.3, `rgba(255, 255, 255, ${intensity * 0.6})`);
    gradient.addColorStop(0.7, `rgba(255, 255, 255, ${intensity * 0.2})`);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0.0)");

    this.touchContext.fillStyle = gradient;
    this.touchContext.beginPath();
    this.touchContext.arc(x, y, size, 0, Math.PI * 2);
    this.touchContext.fill();

    // Add a smaller, more intense center for better definition
    if (this.isMouseMoving) {
      const centerGradient = this.touchContext.createRadialGradient(
        x,
        y,
        0,
        x,
        y,
        size * 0.3
      );

      centerGradient.addColorStop(0, `rgba(255, 255, 255, ${intensity * 1.2})`);
      centerGradient.addColorStop(1, "rgba(255, 255, 255, 0.0)");

      this.touchContext.fillStyle = centerGradient;
      this.touchContext.beginPath();
      this.touchContext.arc(x, y, size * 0.3, 0, Math.PI * 2);
      this.touchContext.fill();
    }

    this.touchTexture.needsUpdate = true;
  }

  animate() {
    if (!this.isRunning) return;

    this.stats.begin();
    this.time += 0.05;

    // Calculate mouse velocity
    this.mouseVelocity.x = this.targetMouse.x - this.lastMouse.x;
    this.mouseVelocity.y = this.targetMouse.y - this.lastMouse.y;
    this.mouseSpeed = Math.sqrt(
      this.mouseVelocity.x * this.mouseVelocity.x +
        this.mouseVelocity.y * this.mouseVelocity.y
    );
    this.lastMouse.copy(this.targetMouse);

    // Smooth mouse movement with adaptive smoothing
    // Faster mouse movement = less smoothing for more responsive feel
    const adaptiveSmoothing =
      this.guiParams.mouseSmoothing * (1 - Math.min(0.8, this.mouseSpeed * 5));
    this.mouse.x += (this.targetMouse.x - this.mouse.x) * adaptiveSmoothing;
    this.mouse.y += (this.targetMouse.y - this.mouse.y) * adaptiveSmoothing;

    // Update touch texture for traditional method
    this.updateTouchTexture();

    if (this.particles) {
      // Update uniforms
      this.particles.material.uniforms.uTime.value = this.time;
      this.particles.material.uniforms.uRandom.value = this.guiParams.randomness;
      this.particles.material.uniforms.uDepth.value = this.guiParams.depth;
      this.particles.material.uniforms.uSize.value = this.guiParams.particleSize;

      // Direct mouse uniforms
      this.particles.material.uniforms.uMouse.value.copy(this.mouse);
      this.particles.material.uniforms.uMouseSize.value = this.guiParams.mouseSize;
      this.particles.material.uniforms.uMouseForce.value = this.guiParams.mouseForce;
      this.particles.material.uniforms.uIdleMovement.value = this.guiParams.idleMovement;
      this.particles.material.uniforms.uIdleSpeed.value = this.guiParams.idleSpeed;
      this.particles.material.uniforms.uIdleIntensity.value = this.guiParams.idleIntensity;
      this.particles.material.uniforms.uParticleSpring.value = this.guiParams.particleSpring;
      this.particles.material.uniforms.uGlowStrength.value = this.guiParams.glowStrength;
      this.particles.material.uniforms.uColorVariation.value = this.guiParams.colorVariation;
    }

    this.composer.render();
    this.stats.end();

    requestAnimationFrame(this.animate.bind(this));
  }

  addListeners() {
    window.addEventListener("resize", this.onResize.bind(this));
    window.addEventListener("mousemove", this.onMouseMove.bind(this));
    window.addEventListener("touchmove", this.onTouchMove.bind(this), {
      passive: false
    });

    // Track when mouse is moving vs idle
    window.addEventListener("mousemove", () => {
      this.isMouseMoving = true;

      // Clear any existing timeout
      if (this.mouseMovingTimeout) {
        clearTimeout(this.mouseMovingTimeout);
      }

      // Set timeout to detect when mouse stops moving
      this.mouseMovingTimeout = setTimeout(() => {
        this.isMouseMoving = false;
      }, 100);
    });

    // Debug: Toggle debug view when GUI changes
    if (this.gui) {
      this.gui.__controllers.forEach((controller) => {
        if (controller.property === "debug") {
          controller.onChange((value) => {
            if (value && this.touchCanvas) {
              document.body.appendChild(this.touchCanvas);
              this.touchCanvas.style.position = "absolute";
              this.touchCanvas.style.top = "0";
              this.touchCanvas.style.left = "0";
              this.touchCanvas.style.zIndex = "9999";
              this.touchCanvas.style.border = "1px solid red";
              this.touchCanvas.style.width = "320px";
              this.touchCanvas.style.height = "180px";
            } else if (this.touchCanvas && this.touchCanvas.parentNode) {
              document.body.removeChild(this.touchCanvas);
            }
          });
        }
      });
    }
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
  }

  onMouseMove(e) {
    const canvasBounds = this.renderer.domElement.getBoundingClientRect();

    // Project onto 3D scene
    const mouseX =
      ((e.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
    const mouseY =
      -((e.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;

    // Create raycaster and set it from camera
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), this.camera);

    // Define a plane at z=0
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    // Find intersection point
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);

    // Convert to image space (0-1)
    const imgX = (intersection.x + this.imageWidth / 2) / this.imageWidth;
    const imgY = (intersection.y + this.imageHeight / 2) / this.imageHeight;

    // Update target mouse position
    this.targetMouse.set(
      Math.max(0, Math.min(1, imgX)),
      Math.max(0, Math.min(1, imgY))
    );

    // Debug output
    if (this.guiParams.debug) {
      console.log(
        `Mouse: ${this.targetMouse.x.toFixed(2)}, ${this.targetMouse.y.toFixed(
          2
        )}`
      );
    }
  }

  onTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.onMouseMove(touch);
  }
}

// Initialize when everything is loaded
window.addEventListener("load", () => {
  new App();
});