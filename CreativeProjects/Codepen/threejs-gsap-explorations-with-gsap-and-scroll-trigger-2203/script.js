// Import libraries from CDN
import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { gsap } from "https://cdn.skypack.dev/gsap@3.11.0";
import { ScrollTrigger } from "https://cdn.skypack.dev/gsap@3.11.0/ScrollTrigger";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Initialize scene, camera, and renderer
const scene = new THREE.Scene();
scene.background = null; // Set to null for transparency

// Set up camera with centered position
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 5);
camera.lookAt(0, 0, 0);

// Set up renderer with transparency
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0); // Transparent background
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Set canvas to appear above content
const canvas = renderer.domElement;
canvas.style.position = "fixed";
canvas.style.top = "0";
canvas.style.left = "0";
canvas.style.width = "100%";
canvas.style.height = "100%";
canvas.style.zIndex = "10"; // Higher than content
canvas.style.pointerEvents = "none"; // Allow clicking through

// Create a star texture for particles
function createStarTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");

  // Draw a radial gradient for a star
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.2, "rgba(240, 240, 255, 0.8)");
  gradient.addColorStop(0.5, "rgba(160, 160, 255, 0.3)");
  gradient.addColorStop(1, "rgba(0, 0, 64, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);

  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Create a group to hold the cube and its wireframe
const cubeGroup = new THREE.Group();
scene.add(cubeGroup);

// Create higher-resolution cube geometry
const geometry = new THREE.BoxGeometry(2, 2, 2, 4, 4, 4);

// Create custom vertex shader with enhanced position and normal data
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Create shader material with enhanced uniforms
const uniforms = {
  iTime: { value: 0 },
  iResolution: { value: new THREE.Vector2(512, 512) },
  scrollProgress: { value: 0.0 } // Track scroll progress
};

// Enhanced galaxy shader with nebula and color shifts
const fragmentShader = `
  uniform float iTime;
  uniform vec2 iResolution;
  uniform float scrollProgress;
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  void mainImage(out vec4 O, vec2 I) {
      vec2 r = iResolution.xy;
      vec2 z;
      vec2 i;
      vec2 f = I*(z+=4.-4.*abs(.7-dot(I=(I+I-r)/r.y, I)));
      
      // Add subtle movement to pattern
      float timeOffset = sin(iTime * 0.2) * 0.1;
      f.x += timeOffset;
      f.y -= timeOffset;
      
      // More iterations based on scroll progress for increasing detail
      float iterations = mix(8.0, 12.0, scrollProgress);
      
      for(O *= 0.; i.y++<iterations;
          O += (sin(f += cos(f.yx*i.y+i+iTime)/i.y+.7)+1.).xyyx
          * abs(f.x-f.y));
      
      O = tanh(7.*exp(z.x-4.-I.y*vec4(-1,1,2,0))/O);
      
      // Add pulsing effect
      float pulse = 1.0 + 0.2 * sin(iTime * 0.5);
      O.rgb *= pulse;
      
      // Add color shifting nebula effect
      float nebula = sin(I.x * 0.01 + iTime * 0.3) * sin(I.y * 0.01 - iTime * 0.2);
      nebula = abs(nebula) * 0.5;
      
      // Create shifting color palette that changes with scroll
      vec3 color1 = mix(vec3(0.1, 0.2, 0.8), vec3(0.8, 0.1, 0.5), scrollProgress); // Blue to purple
      vec3 color2 = mix(vec3(0.8, 0.2, 0.7), vec3(0.2, 0.8, 0.7), scrollProgress); // Purple to teal
      vec3 colorMix = mix(color1, color2, sin(iTime * 0.2) * 0.5 + 0.5);
      
      // Apply nebula color to darker areas
      O.rgb = mix(O.rgb, colorMix, nebula * (1.0 - length(O.rgb)));
  }
  
  void main() {
      // Map the position on the cube face to shader coordinates
      vec2 cubeUV = vUv * iResolution;
      
      vec4 fragColor;
      mainImage(fragColor, cubeUV);
      
      // Add depth effect based on normals and position
      float depthFactor = abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
      fragColor.rgb *= 0.7 + 0.3 * depthFactor;
      
      // Add edge glow - intensity increases with scroll
      float edge = 1.0 - max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)) * 2.0;
      edge = pow(edge, 4.0);
      fragColor.rgb += edge * vec3(0.1, 0.2, 0.8) * (0.6 + scrollProgress * 0.4);
      
      // Boost brightness
      fragColor.rgb *= 2.0;
      
      gl_FragColor = fragColor;
  }
`;

// Create material with optimized settings for visibility
const material = new THREE.ShaderMaterial({
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  uniforms: uniforms,
  transparent: true,
  opacity: 1.0,
  side: THREE.DoubleSide
});

// Create cube mesh
const cube = new THREE.Mesh(geometry, material);
cube.castShadow = true;
cube.receiveShadow = true;
cubeGroup.add(cube);

// Create wireframe for edges
const wireframe = new THREE.LineSegments(
  new THREE.EdgesGeometry(geometry, 10), // Lower threshold for more visible edges
  new THREE.LineBasicMaterial({
    color: 0x4488ff,
    linewidth: 1.5,
    transparent: true,
    opacity: 0.8
  })
);
wireframe.scale.setScalar(1.001); // Slightly larger to prevent z-fighting
cubeGroup.add(wireframe);

// Create an enhanced particle system
function createEnhancedParticles() {
  const particleSettings = {
    PARTICLE_MOUSE_INFLUENCE: 0.0002,
    PARTICLE_REPULSION_RADIUS: 0.9,
    PARTICLE_REPULSION_STRENGTH: 0.0001
  };

  const particles = new THREE.BufferGeometry();
  const particleCount = 750;
  const positions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 6; // Wider spread
    positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;

    velocities[i * 3] = (Math.random() - 0.5) * 0.001;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.001;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.001;

    sizes[i] = Math.random() * 0.01 + 0.005;

    // Randomize colors with blue tint
    colors[i * 3] = 0.5 + Math.random() * 0.5; // R
    colors[i * 3 + 1] = 0.5 + Math.random() * 0.5; // G
    colors[i * 3 + 2] = 0.8 + Math.random() * 0.2; // B (weighted toward blue)
  }

  particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  particles.setAttribute("velocity", new THREE.BufferAttribute(velocities, 3));
  particles.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  particles.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const particleTexture = createStarTexture();

  const particleMaterial = new THREE.PointsMaterial({
    size: 0.02,
    map: particleTexture,
    transparent: true,
    vertexColors: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const particleSystem = new THREE.Points(particles, particleMaterial);
  scene.add(particleSystem);

  return { particleSystem, settings: particleSettings };
}

// Create enhanced particles
const enhancedParticles = createEnhancedParticles();

// Add lighting for better 3D perception
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 10, 7);
directionalLight.castShadow = true;
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0x3366ff, 1.5, 20);
pointLight.position.set(-3, 2, 5);
scene.add(pointLight);

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Set up mouse interaction with improved stability
const mouse = new THREE.Vector2(0, 0);

window.addEventListener("mousemove", (event) => {
  // Update mouse position for cube rotation
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Only apply mouse rotation when not scrolling
  if (!ScrollTrigger.isScrolling()) {
    gsap.to(cubeGroup.rotation, {
      x: "+=" + (mouse.y * 0.03 - cubeGroup.rotation.x * 0.02),
      y: "+=" + (mouse.x * 0.03 - cubeGroup.rotation.y * 0.02),
      duration: 1,
      ease: "power2.out",
      overwrite: "auto"
    });
  }
});

// Change colors on click
document.addEventListener("click", () => {
  // Random animation on click
  gsap.to(cubeGroup.rotation, {
    x: cubeGroup.rotation.x + Math.PI * 0.25 * (Math.random() - 0.5),
    y: cubeGroup.rotation.y + Math.PI * 0.25 * (Math.random() - 0.5),
    z: cubeGroup.rotation.z + Math.PI * 0.25 * (Math.random() - 0.5),
    duration: 1,
    ease: "back.out(1.5)"
  });
});

// Text animation function
function animateTextElements() {
  // Get all section titles and descriptions
  const titles = document.querySelectorAll(".title");
  const descriptions = document.querySelectorAll(".description");

  // Create a timeline for each section
  document.querySelectorAll(".section").forEach((section, index) => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 80%",
        end: "top 20%",
        scrub: 1,
        toggleActions: "play none none reverse"
      }
    });

    tl.to(
      titles[index],
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power2.out"
      },
      0
    );

    tl.to(
      descriptions[index],
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power2.out",
        delay: 0.2
      },
      0
    );

    // Add parallax effect
    tl.to(
      cubeGroup.position,
      {
        z: -1 * index, // Move cube deeper with each section
        duration: 1
      },
      0
    );
  });
}

// Set up GSAP ScrollTrigger with smooth easing
ScrollTrigger.defaults({
  scrub: 1.2, // Higher value for more inertia
  ease: "power2.out" // Smooth deceleration when stopping
});

// Create rotation timeline with smoother stopping
const scrollTimeline = gsap.timeline({
  scrollTrigger: {
    trigger: ".content",
    start: "top top",
    end: "bottom bottom",
    scrub: 1.2,
    markers: false,
    onUpdate: (self) => {
      // Update scroll progress uniform in shader
      uniforms.scrollProgress.value = self.progress;
    }
  }
});

// Keep cube centered during rotation and zoom effect
scrollTimeline
  .to(cubeGroup.rotation, {
    x: Math.PI * 1.5,
    y: Math.PI * 2,
    z: Math.PI * 0.5,
    ease: "power2.out",
    immediateRender: false
  })
  .to(
    camera.position,
    {
      z: 3.5, // Zoom in slightly
      y: 0,
      x: 0,
      ease: "power2.out"
    },
    0
  )
  .to(
    {},
    {
      duration: 1,
      onUpdate: function () {
        camera.lookAt(cubeGroup.position);
      }
    },
    0
  );

// Animation loop with enhanced effects
function animate(timestamp) {
  requestAnimationFrame(animate);

  const timeSeconds = timestamp * 0.001;

  // Update time uniform for galaxy shader
  uniforms.iTime.value = timeSeconds;

  // Update particle animation
  if (enhancedParticles && enhancedParticles.particleSystem) {
    const particleSystem = enhancedParticles.particleSystem;
    const settings = enhancedParticles.settings;

    const positions = particleSystem.geometry.attributes.position.array;
    const velocities = particleSystem.geometry.attributes.velocity.array;
    const sizes = particleSystem.geometry.attributes.size.array;
    const colors = particleSystem.geometry.attributes.color.array;
    const particleCount = positions.length / 3;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Random movement
      positions[i3] += velocities[i3];
      positions[i3 + 1] += velocities[i3 + 1];
      positions[i3 + 2] += velocities[i3 + 2];

      // Global subtle movement based on mouse position
      positions[i3] +=
        (mouse.x - positions[i3]) * settings.PARTICLE_MOUSE_INFLUENCE;
      positions[i3 + 1] +=
        (mouse.y - positions[i3 + 1]) * settings.PARTICLE_MOUSE_INFLUENCE;

      // Mouse interaction for nearby particles
      const dx = positions[i3] - mouse.x * 3; // Scale mouse effect
      const dy = positions[i3 + 1] - mouse.y * 3;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < settings.PARTICLE_REPULSION_RADIUS) {
        const repelFactor =
          settings.PARTICLE_REPULSION_STRENGTH / (dist * dist + 0.00001);
        positions[i3] += dx * repelFactor;
        positions[i3 + 1] += dy * repelFactor;
        positions[i3 + 2] += (Math.random() - 0.5) * repelFactor; // Add Z movement
      }

      // Wrap around edges in a spherical manner
      const distFromCenter = Math.sqrt(
        positions[i3] * positions[i3] +
          positions[i3 + 1] * positions[i3 + 1] +
          positions[i3 + 2] * positions[i3 + 2]
      );

      if (distFromCenter > 8) {
        // Reset to opposite side of sphere
        const scale = 6 / distFromCenter;
        positions[i3] *= -scale;
        positions[i3 + 1] *= -scale;
        positions[i3 + 2] *= -scale;
      }

      // Slightly vary particle size over time for twinkling effect
      sizes[i] = (Math.sin(timeSeconds * 2 + i) * 0.5 + 0.5) * 0.01 + 0.005;

      // Color variation over time
      const colorPhase = Math.sin(timeSeconds * 0.5 + i) * 0.5 + 0.5;
      colors[i3] = 0.5 + colorPhase * 0.5; // R
      colors[i3 + 1] = 0.5 + colorPhase * 0.5; // G
      colors[i3 + 2] = 0.8 + colorPhase * 0.2; // B
    }

    particleSystem.geometry.attributes.position.needsUpdate = true;
    particleSystem.geometry.attributes.size.needsUpdate = true;
    particleSystem.geometry.attributes.color.needsUpdate = true;
  }

  renderer.render(scene, camera);
}

// Initialize text animations when page loads
window.addEventListener("DOMContentLoaded", () => {
  animateTextElements();
});

// Start animation loop
animate(0);