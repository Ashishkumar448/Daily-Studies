import * as THREE from "https://esm.sh/three@0.160.0";
import { GUI } from "https://esm.sh/dat.gui@0.7.9";

// Create renderer
const renderer = new THREE.WebGLRenderer({
  antialias: false,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
document.body.appendChild(renderer.domElement);

// Setup scene
const scene = new THREE.Scene();

// Create a simple orthographic camera
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// Create a separate canvas for particles
const particleCanvas = document.createElement("canvas");
particleCanvas.width = window.innerWidth * window.devicePixelRatio;
particleCanvas.height = window.innerHeight * window.devicePixelRatio;
particleCanvas.style.width = "100vw";
particleCanvas.style.height = "100vh";
particleCanvas.style.position = "fixed";
particleCanvas.style.top = "0";
particleCanvas.style.left = "0";
particleCanvas.style.pointerEvents = "none";
document.body.appendChild(particleCanvas);

const particleCtx = particleCanvas.getContext("2d");

// Mouse tracking
const mouse = new THREE.Vector2(0.5, 0.5);
const lastMouse = new THREE.Vector2(0.5, 0.5);
const mouseVelocity = new THREE.Vector2(0, 0);
const lastDirection = new THREE.Vector2(0, 0);
const mouseTrail = [];
const MAX_TRAIL = 60;
const trailHistory = [];
const trailAge = [];
const trailVelocity = [];
let mouseDown = false;
let effectiveTrailSize = 0;
let lastMoveTime = 0;
let isMoving = false;
let lastSpeed = 0;

// Initialize mouse trail
for (let i = 0; i < MAX_TRAIL; i++) {
  mouseTrail.push(new THREE.Vector2(0.5, 0.5));
  trailHistory.push(0.0);
  trailAge.push(1.0); // 1.0 means fully faded out
  trailVelocity.push(new THREE.Vector2(0, 0));
}

// Main display shader material
const material = new THREE.ShaderMaterial({
  uniforms: {
    u_time: { value: 0 },
    u_resolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight)
    },
    u_mouse: { value: mouse },
    u_mousevel: { value: mouseVelocity },
    u_mousedown: { value: 0 },
    u_trail: { value: mouseTrail },
    u_trail_intensity: { value: trailHistory },
    u_trail_age: { value: trailAge },
    u_trailsize: { value: effectiveTrailSize },
    u_pixelSize: { value: 0.2 },
    u_aspect: { value: window.innerWidth / window.innerHeight },
    u_cursorSize: { value: 0.005 },
    u_trailRadius: { value: 0.1 },
    u_fireColorBase: { value: new THREE.Vector3(0.8, 0.1, 0.0) },
    u_fireColorHot: { value: new THREE.Vector3(1.0, 0.7, 0.3) },
    u_noiseScale: { value: 10.0 }
  },
  vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
  fragmentShader: `
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec2 u_mouse;
        uniform vec2 u_mousevel;
        uniform float u_mousedown;
        uniform vec2 u_trail[60];
        uniform float u_trail_intensity[60];
        uniform float u_trail_age[60];
        uniform int u_trailsize;
        uniform float u_pixelSize;
        uniform float u_aspect;
        uniform float u_cursorSize;
        uniform float u_trailRadius;
        uniform vec3 u_fireColorBase;
        uniform vec3 u_fireColorHot;
        uniform float u_noiseScale;
        
        varying vec2 vUv;
        
        // Hash function
        float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }
        
        // Noise function
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          
          vec2 u = f * f * (3.0 - 2.0 * f);
          
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }
        
        // Pixelate function
        vec2 pixelate(vec2 uv, float size) {
          float pixelSize = max(size, 0.01);
          
          // Calculate grid size based on resolution and pixel size
          float pixelW = u_resolution.x * pixelSize * 0.01;
          float pixelH = u_resolution.y * pixelSize * 0.01;
          
          // Pixelate
          return vec2(
            floor(uv.x * pixelW) / pixelW,
            floor(uv.y * pixelH) / pixelH
          );
        }
        
        // Calculate distance with aspect ratio correction
        float aspectCorrectedDistance(vec2 p1, vec2 p2) {
          vec2 diff = p1 - p2;
          diff.x *= u_aspect; // Correct for aspect ratio
          return length(diff);
        }
        
        // Fire Trails
        vec3 fireTrails(vec2 uv) {
          vec3 color = vec3(0.0);
          
          // Fire trails from mouse path
          for (int i = 0; i < 60; i++) {
            if (i >= u_trailsize) break;
            
            // Skip points that are fully faded out
            if (u_trail_age[i] >= 1.0) continue;
            
            float lifespan = (1.0 - u_trail_age[i]);
            vec2 trailPos = u_trail[i];
            
            // Calculate distance with aspect ratio correction
            float dist = aspectCorrectedDistance(uv, trailPos);
            
            // Fire effect with noise
            float radius = u_trailRadius * lifespan;
            float fireShape = smoothstep(radius, 0.0, dist);
            float displacement = noise(uv * u_noiseScale + vec2(0.0, u_time * 2.0));
            
            fireShape *= displacement;
            
            // Add to color with intensity
            float intensity = fireShape * lifespan * u_trail_intensity[i];
            
            // Fire colors
            vec3 flameColor = mix(
              u_fireColorBase,  // Base color
              u_fireColorHot,   // Hot spots
              intensity * 2.0
            );
            
            color += flameColor * intensity;
          }
          
          return color;
        }
        
        void main() {
          vec2 uv = vUv;
          
          // Get pixel art coordinates for everything
          vec2 pixUV = pixelate(uv, u_pixelSize * 100.0);
          
          // Get fire trail effect
          vec3 color = fireTrails(pixUV);
          
          // Add cursor with aspect ratio correction and pixelation
          // Use the pixelated coordinates for the cursor too
          float cursorDist = aspectCorrectedDistance(pixUV, pixelate(u_mouse, u_pixelSize * 100.0));
          
          // Make cursor smaller
          if (cursorDist < u_cursorSize) {
            color = mix(color, vec3(1.0), smoothstep(u_cursorSize, 0.0, cursorDist));
          }
          
          // Ensure we have some output even if no trail
          if (length(color) < 0.01) {
            color = vec3(0.0);
          }
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
});

// Create main display quad
const geometry = new THREE.PlaneGeometry(2, 2);
const quad = new THREE.Mesh(geometry, material);
scene.add(quad);

// Particle system
const particles = [];
let MAX_PARTICLES = 50; // Now controlled by GUI

// GUI
const gui = new GUI();
const params = {
  pixelSize: 0.2,
  cursorSize: 0.005,
  trailRadius: 0.03,
  maxParticles: 50,
  fadeSpeed: 0.02,
  fireColorBase: [204, 26, 0], // RGB values for #CC1A00
  fireColorHot: [255, 179, 77], // RGB values for #FFB34D
  noiseScale: 10.0,
  particlePixelScale: 5
};

// Pixel Size folder
const pixelFolder = gui.addFolder("Pixel Effect");
pixelFolder
  .add(params, "pixelSize", 0.05, 1)
  .name("Pixel Size")
  .onChange((value) => {
    material.uniforms.u_pixelSize.value = value;
  });
pixelFolder.open();

// Fire Effect folder
const fireFolder = gui.addFolder("Fire Effect");
fireFolder
  .add(params, "trailRadius", 0.01, 0.1)
  .name("Fire Size")
  .onChange((value) => {
    material.uniforms.u_trailRadius.value = value;
  });
fireFolder
  .add(params, "noiseScale", 1, 20)
  .name("Noise Scale")
  .onChange((value) => {
    material.uniforms.u_noiseScale.value = value;
  });
fireFolder.add(params, "fadeSpeed", 0.01, 0.1).name("Fade Speed");

// Fire Colors
const colorBaseController = fireFolder
  .addColor(params, "fireColorBase")
  .name("Base Color")
  .onChange((value) => {
    material.uniforms.u_fireColorBase.value.set(
      value[0] / 255,
      value[1] / 255,
      value[2] / 255
    );
  });
const colorHotController = fireFolder
  .addColor(params, "fireColorHot")
  .name("Hot Color")
  .onChange((value) => {
    material.uniforms.u_fireColorHot.value.set(
      value[0] / 255,
      value[1] / 255,
      value[2] / 255
    );
  });
fireFolder.open();

// Particles folder
const particleFolder = gui.addFolder("Particles");
particleFolder
  .add(params, "maxParticles", 0, 200)
  .step(10)
  .name("Particle Count")
  .onChange((value) => {
    MAX_PARTICLES = Math.floor(value);
  });
particleFolder
  .add(params, "particlePixelScale", 1, 20)
  .step(1)
  .name("Particle Pixelation");
particleFolder.open();

// Cursor folder
const cursorFolder = gui.addFolder("Cursor");
cursorFolder
  .add(params, "cursorSize", 0.001, 0.02)
  .name("Cursor Size")
  .onChange((value) => {
    material.uniforms.u_cursorSize.value = value;
  });
cursorFolder.open();

// Particle class
class Particle {
  constructor(x, y, vx, vy, size, r, g, b, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.color = { r, g, b };
    this.life = life;
    this.maxLife = life;
  }

  update() {
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;

    // Apply gravity or buoyancy based on color
    // Brighter particles rise, darker ones fall
    const brightness = (this.color.r + this.color.g + this.color.b) / 3;
    this.vy += brightness > 0.7 ? -0.0001 : 0.0001;

    // Add some random movement
    this.vx += (Math.random() - 0.5) * 0.0002;
    this.vy += (Math.random() - 0.5) * 0.0002;

    // Slow down over time
    this.vx *= 0.99;
    this.vy *= 0.99;

    // Reduce life
    this.life -= 0.01;

    // Shrink as life decreases
    this.size = (this.life / this.maxLife) * this.size * 1.2;

    return this.life > 0;
  }

  draw(ctx) {
    const alpha = this.life / this.maxLife;

    // Get current pixel size (0.05 to 1.0)
    const pixelSize = params.pixelSize;

    // Convert normalized coordinates to screen coordinates
    const screenX = this.x * window.innerWidth;
    const screenY = (1 - this.y) * window.innerHeight;

    // Calculate pixel grid size - INVERSE relationship to pixelSize
    // When pixelSize is small (0.05), we want more pixels (less pixelated)
    // When pixelSize is large (1.0), we want fewer pixels (more pixelated)
    const pixelGridSize = Math.max(
      1,
      Math.round((1.01 - pixelSize) * params.particlePixelScale)
    );

    // Snap to pixel grid
    const pixelX = Math.floor(screenX / pixelGridSize) * pixelGridSize;
    const pixelY = Math.floor(screenY / pixelGridSize) * pixelGridSize;

    // Set particle size based on pixel grid
    const particleSize = Math.max(1, pixelGridSize);

    ctx.globalAlpha = alpha;
    ctx.fillStyle = `rgb(${Math.floor(this.color.r * 255)}, ${Math.floor(
      this.color.g * 255
    )}, ${Math.floor(this.color.b * 255)})`;

    // Draw a pixel-aligned rectangle
    ctx.fillRect(pixelX, pixelY, particleSize, particleSize);
  }
}

// Create particles along the trail
function createParticles() {
  // Only create particles if there are active trail points
  if (effectiveTrailSize <= 0) return;

  // Determine how many particles to create based on speed and if mouse is down
  // Significantly reduced particle count
  const particleCount = isMoving
    ? Math.floor(mouseVelocity.length() * 50) + (mouseDown ? 2 : 0)
    : Math.floor(lastSpeed * 20) + (mouseDown ? 1 : 0);

  for (let i = 0; i < particleCount; i++) {
    if (particles.length >= MAX_PARTICLES) break;

    // Choose a random active trail point to emit from
    const trailIndex = Math.floor(
      Math.random() * Math.min(10, effectiveTrailSize)
    );

    if (trailAge[trailIndex] < 1.0) {
      const trailPoint = mouseTrail[trailIndex];

      // Calculate random direction
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.0005 + Math.random() * 0.001; // Reduced speed

      // Add some bias toward the trail direction
      let vx, vy;
      if (isMoving) {
        vx = Math.cos(angle) * speed + mouseVelocity.x * 0.05;
        vy = Math.sin(angle) * speed + mouseVelocity.y * 0.05;
      } else if (trailVelocity[trailIndex].length() > 0.0001) {
        vx = Math.cos(angle) * speed + trailVelocity[trailIndex].x * 0.05;
        vy = Math.sin(angle) * speed + trailVelocity[trailIndex].y * 0.05;
      } else {
        vx = Math.cos(angle) * speed + lastDirection.x * 0.05 * lastSpeed;
        vy = Math.sin(angle) * speed + lastDirection.y * 0.05 * lastSpeed;
      }

      // Random offset from trail point
      const offsetX = (Math.random() - 0.5) * 0.005;
      const offsetY = (Math.random() - 0.5) * 0.005;

      // Very small size
      const size = 0.001 + Math.random() * 0.002;

      // Get base and hot colors from params
      const baseColor = {
        r: params.fireColorBase[0] / 255,
        g: params.fireColorBase[1] / 255,
        b: params.fireColorBase[2] / 255
      };

      const hotColor = {
        r: params.fireColorHot[0] / 255,
        g: params.fireColorHot[1] / 255,
        b: params.fireColorHot[2] / 255
      };

      // Random color based on fire palette
      let r, g, b;
      const colorRand = Math.random();

      if (colorRand < 0.3) {
        // Hot color (hottest)
        r = hotColor.r;
        g = hotColor.g * (0.8 + Math.random() * 0.2);
        b = hotColor.b * (0.8 + Math.random() * 0.2);
      } else if (colorRand < 0.7) {
        // Mix of base and hot
        r = baseColor.r + (hotColor.r - baseColor.r) * 0.5;
        g = baseColor.g + (hotColor.g - baseColor.g) * 0.5;
        b = baseColor.b + (hotColor.b - baseColor.b) * 0.5;
      } else {
        // Base color (coolest)
        r = baseColor.r;
        g = baseColor.g;
        b = baseColor.b;
      }

      // Random life
      const life = 0.3 + Math.random() * 0.3; // Shorter life

      // Create particle
      particles.push(
        new Particle(
          trailPoint.x + offsetX,
          trailPoint.y + offsetY,
          vx,
          vy,
          size,
          r,
          g,
          b,
          life
        )
      );
    }
  }
}

// Update and draw particles
function updateParticles() {
  // Clear the particle canvas
  particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

  // Set blending mode for additive effect
  particleCtx.globalCompositeOperation = "lighter";

  // Update existing particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const alive = particles[i].update();
    if (alive) {
      particles[i].draw(particleCtx);
    } else {
      particles.splice(i, 1);
    }
  }

  // Create new particles
  createParticles();
}

// Resize function
function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspect = width / height;

  // Update THREE.js renderer
  renderer.setSize(width, height, true);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Update particle canvas
  particleCanvas.width = width * window.devicePixelRatio;
  particleCanvas.height = height * window.devicePixelRatio;
  particleCanvas.style.width = "100vw";
  particleCanvas.style.height = "100vh";

  // Update shader uniforms
  material.uniforms.u_resolution.value.set(width, height);
  material.uniforms.u_aspect.value = aspect;

  // Clear particle context settings that get reset on resize
  particleCtx.globalCompositeOperation = "lighter";
}

// Initial resize
onWindowResize();

// Add resize event listener
window.addEventListener("resize", onWindowResize);

window.addEventListener("mousemove", (event) => {
  // Update previous mouse position
  lastMouse.copy(mouse);

  // Update current mouse position using element bounds
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = (event.clientX - rect.left) / rect.width;
  mouse.y = 1.0 - (event.clientY - rect.top) / rect.height;

  // Calculate velocity
  mouseVelocity.subVectors(mouse, lastMouse);
  let speed = mouseVelocity.length() * 100;

  // Only update trail if there's significant movement
  if (speed > 0.1) {
    isMoving = true;
    lastMoveTime = Date.now();
    lastSpeed = speed;

    // Store last direction for when mouse stops
    if (speed > 0.5) {
      lastDirection.copy(mouseVelocity).normalize();
    }

    // Update trail intensity
    trailHistory.unshift(Math.min(speed * 5, 1.0));
    trailHistory.pop();

    // Reset age for new point
    trailAge.unshift(0.0);
    trailAge.pop();

    // Store velocity for each point
    trailVelocity.unshift(new THREE.Vector2(mouseVelocity.x, mouseVelocity.y));
    trailVelocity.pop();

    // Update mouse trail
    mouseTrail.unshift(new THREE.Vector2(mouse.x, mouse.y));
    mouseTrail.pop();

    // Update effective trail size
    effectiveTrailSize = Math.min(MAX_TRAIL, effectiveTrailSize + 1);
  }

  // Update uniforms
  material.uniforms.u_mouse.value = mouse;
  material.uniforms.u_mousevel.value = mouseVelocity;
  material.uniforms.u_trail.value = mouseTrail;
  material.uniforms.u_trail_intensity.value = trailHistory;
  material.uniforms.u_trail_age.value = trailAge;
  material.uniforms.u_trailsize.value = effectiveTrailSize;
});

window.addEventListener("mousedown", () => {
  mouseDown = true;
  material.uniforms.u_mousedown.value = 1.0;
});

window.addEventListener("mouseup", () => {
  mouseDown = false;
  material.uniforms.u_mousedown.value = 0.0;
});

// For mobile/touch support
window.addEventListener("touchstart", (event) => {
  mouseDown = true;
  material.uniforms.u_mousedown.value = 1.0;

  // Update mouse position
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = (event.touches[0].clientX - rect.left) / rect.width;
  mouse.y = 1.0 - (event.touches[0].clientY - rect.top) / rect.height;

  material.uniforms.u_mouse.value = mouse;
});

window.addEventListener("touchmove", (event) => {
  // Prevent scrolling
  event.preventDefault();

  // Update previous mouse position
  lastMouse.copy(mouse);

  // Update current mouse position
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = (event.touches[0].clientX - rect.left) / rect.width;
  mouse.y = 1.0 - (event.touches[0].clientY - rect.top) / rect.height;

  // Calculate velocity
  mouseVelocity.subVectors(mouse, lastMouse);
  let speed = mouseVelocity.length() * 100;

  // Only update trail if there's significant movement
  if (speed > 0.1) {
    isMoving = true;
    lastMoveTime = Date.now();
    lastSpeed = speed;

    // Store last direction for when mouse stops
    if (speed > 0.5) {
      lastDirection.copy(mouseVelocity).normalize();
    }

    // Update trail intensity
    trailHistory.unshift(Math.min(speed * 5, 1.0));
    trailHistory.pop();

    // Reset age for new point
    trailAge.unshift(0.0);
    trailAge.pop();

    // Store velocity for each point
    trailVelocity.unshift(new THREE.Vector2(mouseVelocity.x, mouseVelocity.y));
    trailVelocity.pop();

    // Update mouse trail
    mouseTrail.unshift(new THREE.Vector2(mouse.x, mouse.y));
    mouseTrail.pop();

    // Update effective trail size
    effectiveTrailSize = Math.min(MAX_TRAIL, effectiveTrailSize + 1);
  }

  // Update uniforms
  material.uniforms.u_mouse.value = mouse;
  material.uniforms.u_mousevel.value = mouseVelocity;
  material.uniforms.u_trail.value = mouseTrail;
  material.uniforms.u_trail_intensity.value = trailHistory;
  material.uniforms.u_trail_age.value = trailAge;
  material.uniforms.u_trailsize.value = effectiveTrailSize;
});

window.addEventListener("touchend", () => {
  mouseDown = false;
  material.uniforms.u_mousedown.value = 0.0;
});

// Animation loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  // Update time
  const elapsedTime = clock.getElapsedTime();
  material.uniforms.u_time.value = elapsedTime;

  // Decay mouse velocity
  mouseVelocity.multiplyScalar(0.95);

  // Check if mouse has stopped moving
  const currentTime = Date.now();
  if (isMoving && currentTime - lastMoveTime > 100) {
    isMoving = false;
  }

  // Update trail points
  const fadeSpeed = params.fadeSpeed; // Now controlled by GUI
  let allFaded = true;

  for (let i = 0; i < trailAge.length; i++) {
    // Age the trail points
    if (trailAge[i] < 1.0) {
      trailAge[i] = Math.min(1.0, trailAge[i] + fadeSpeed);
      if (trailAge[i] < 1.0) allFaded = false;

      // Continue movement in the last direction when not moving
      if (!isMoving) {
        // Calculate movement speed based on the point's age and last mouse speed
        const movementFactor = 0.002 * (1.0 - trailAge[i]) * lastSpeed;

        // Use the point's stored velocity or the last direction
        let moveX, moveY;
        if (i < effectiveTrailSize && trailVelocity[i].length() > 0.001) {
          // Use the point's own velocity, scaled down over time
          moveX = trailVelocity[i].x * movementFactor;
          moveY = trailVelocity[i].y * movementFactor;

          // Decay the velocity
          trailVelocity[i].multiplyScalar(0.97);
        } else {
          // Use the last overall direction
          moveX = lastDirection.x * movementFactor;
          moveY = lastDirection.y * movementFactor;
        }

        // Update the point position
        mouseTrail[i].x += moveX;
        mouseTrail[i].y += moveY;
      }
    }
  }

  // Reset trail size if all points have faded
  if (allFaded) {
    effectiveTrailSize = 0;
  }

  // Update the uniforms
  material.uniforms.u_trail.value = mouseTrail;
  material.uniforms.u_trail_age.value = trailAge;
  material.uniforms.u_trailsize.value = effectiveTrailSize;

  // Update and draw particles
  updateParticles();

  // Render main scene to screen
  renderer.render(scene, camera);
}

// Start animation
animate();