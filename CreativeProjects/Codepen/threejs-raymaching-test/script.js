import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { GUI } from "https://cdn.skypack.dev/dat.gui";

// Register ScrollTrigger with GSAP
gsap.registerPlugin(ScrollTrigger);

// Initialize Three.js scene
const canvas = document.getElementById("raymarchCanvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// Mouse tracking for camera rotation (horizontal only)
let mouseX = 0;
let targetMouseX = 0;

// Camera rotation limits
const MAX_ROTATION_X = 0.7; // About 40 degrees max left/right

document.addEventListener("mousemove", (event) => {
  // Convert to -1 to 1 range with limits (horizontal only)
  targetMouseX =
    Math.max(-1, Math.min(1, (event.clientX / window.innerWidth) * 2 - 1)) *
    MAX_ROTATION_X;
});

// Configuration parameters with defaults
const params = {
  // Wave parameters
  waveHeight: 0.5,
  waveSpeed: 1.0,
  waveComplexity: 1.0,

  // Camera parameters
  cameraHeight: 2.0,
  cameraDistance: 3.0,

  // Lighting and colors
  sunIntensity: 1.0,
  reflectionStrength: 0.8,
  waterDepth: 0.4,
  waterColor: [0, 40, 100],

  // Animation controls
  animationSpeed: 1.0,
  pauseAnimation: false,

  // Scroll behavior
  smoothScrolling: true,
  scrollIntensity: 1.0,

  // Black and white effect
  grainStrength: 0.1,
  intensity: 0.85,

  // Reset to defaults
  resetDefaults: function () {
    this.waveHeight = 0.5;
    this.waveSpeed = 1.0;
    this.waveComplexity = 1.0;
    this.cameraHeight = 2.0;
    this.cameraDistance = 3.0;
    this.sunIntensity = 1.0;
    this.reflectionStrength = 0.8;
    this.waterDepth = 0.4;
    this.waterColor = [0, 40, 100];
    this.animationSpeed = 1.0;
    this.pauseAnimation = false;
    this.smoothScrolling = true;
    this.scrollIntensity = 1.0;
    this.grainStrength = 0.1;
    this.intensity = 0.85;

    // Update GUI
    for (let controller of Object.values(gui.__controllers)) {
      controller.updateDisplay();
    }
    for (let folder of Object.values(gui.__folders)) {
      for (let controller of Object.values(folder.__controllers)) {
        controller.updateDisplay();
      }
    }
  }
};

// Setup GUI using imported constructor
const gui = new GUI({ width: 300 });

// Create folders for organization
const waveFolder = gui.addFolder("Wave Parameters");
waveFolder.add(params, "waveHeight", 0.1, 2.0).name("Wave Height");
waveFolder.add(params, "waveSpeed", 0.1, 3.0).name("Wave Speed");
waveFolder.add(params, "waveComplexity", 0.1, 3.0).name("Wave Complexity");
waveFolder.open();

const cameraFolder = gui.addFolder("Camera");
cameraFolder.add(params, "cameraHeight", 0.5, 10.0).name("Camera Height");
cameraFolder.add(params, "cameraDistance", 1.0, 10.0).name("Camera Distance");

const visualFolder = gui.addFolder("Visual Effects");
visualFolder.add(params, "sunIntensity", 0.0, 3.0).name("Sun Intensity");
visualFolder.add(params, "reflectionStrength", 0.0, 1.0).name("Reflections");
visualFolder.add(params, "waterDepth", 0.1, 1.0).name("Water Depth");
visualFolder.addColor(params, "waterColor").name("Water Color");

// Add the black and white effects controls
const milkyStyleFolder = gui.addFolder("Milky Style");
milkyStyleFolder.add(params, "grainStrength", 0.0, 0.5).name("Grain Strength");
milkyStyleFolder.add(params, "intensity", 0.0, 2.0).name("Intensity");
milkyStyleFolder.open();

const animationFolder = gui.addFolder("Animation");
animationFolder.add(params, "animationSpeed", 0.1, 3.0).name("Animation Speed");
animationFolder.add(params, "pauseAnimation").name("Pause Animation");

const scrollFolder = gui.addFolder("Scroll Behavior");
scrollFolder.add(params, "smoothScrolling").name("Smooth Scrolling");
scrollFolder.add(params, "scrollIntensity", 0.1, 2.0).name("Scroll Intensity");

// Reset button
gui.add(params, "resetDefaults").name("Reset to Defaults");

// Animation parameters for scrolling
let animationTime = 0;
let scrollBasedParams = {
  cameraHeight: 2.0,
  cameraDistance: 3.0,
  waveHeight: 0.5,
  waveComplexity: 1.0,
  sunPosition: 0.5
};

// Setup timeline with smoother easing
const progressBar = document.querySelector(".progress-bar");
gsap.to(progressBar, {
  width: "100%",
  scrollTrigger: {
    trigger: "body",
    start: "top top",
    end: "bottom bottom",
    scrub: true
  }
});

// Main timeline for scroll-based animation
const mainTimeline = gsap.timeline({
  scrollTrigger: {
    trigger: "body",
    start: "top top",
    end: "bottom bottom",
    scrub: params.smoothScrolling ? 1 : 0.1, // Adjustable smoothing
    onUpdate: function (self) {
      // Use the progress to set animation time
      animationTime = self.progress * 20.0 * params.scrollIntensity;
    }
  }
});

// Camera height animation
mainTimeline.to(
  scrollBasedParams,
  {
    cameraHeight: 4.0,
    duration: 0.2,
    ease: "power1.inOut"
  },
  0.1
);

mainTimeline.to(
  scrollBasedParams,
  {
    cameraHeight: 1.5,
    duration: 0.2,
    ease: "power1.inOut"
  },
  0.3
);

mainTimeline.to(
  scrollBasedParams,
  {
    cameraHeight: 3.0,
    duration: 0.2,
    ease: "power1.inOut"
  },
  0.5
);

// Camera distance animation
mainTimeline.to(
  scrollBasedParams,
  {
    cameraDistance: 5.0,
    duration: 0.25,
    ease: "power2.inOut"
  },
  0.2
);

mainTimeline.to(
  scrollBasedParams,
  {
    cameraDistance: 2.0,
    duration: 0.25,
    ease: "power2.inOut"
  },
  0.4
);

mainTimeline.to(
  scrollBasedParams,
  {
    cameraDistance: 4.0,
    duration: 0.25,
    ease: "power2.inOut"
  },
  0.6
);

// Wave height animation
mainTimeline.to(
  scrollBasedParams,
  {
    waveHeight: 1.2,
    duration: 0.3,
    ease: "power1.inOut"
  },
  0.15
);

mainTimeline.to(
  scrollBasedParams,
  {
    waveHeight: 0.3,
    duration: 0.3,
    ease: "power1.inOut"
  },
  0.45
);

mainTimeline.to(
  scrollBasedParams,
  {
    waveHeight: 0.8,
    duration: 0.3,
    ease: "power1.inOut"
  },
  0.75
);

// Wave complexity
mainTimeline.to(
  scrollBasedParams,
  {
    waveComplexity: 2.0,
    duration: 0.3,
    ease: "sine.inOut"
  },
  0.35
);

// Sun position
mainTimeline.to(
  scrollBasedParams,
  {
    sunPosition: 0.8,
    duration: 0.4,
    ease: "sine.inOut"
  },
  0.5
);

// Animate sections as they enter the viewport
const sections = document.querySelectorAll(".section");
sections.forEach((section) => {
  ScrollTrigger.create({
    trigger: section,
    start: "top 80%",
    onEnter: () => section.classList.add("visible"),
    onLeave: () => section.classList.remove("visible"),
    onEnterBack: () => section.classList.add("visible"),
    onLeaveBack: () => section.classList.remove("visible")
  });
});

// Create a shader material with the ocean raymarching code
const oceanShaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    iTime: { value: 0 },
    iResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight)
    },
    iMouse: { value: new THREE.Vector4(0, 0, 0, 0) },
    iWaveHeight: { value: 0.5 },
    iWaveSpeed: { value: 1.0 },
    iWaveComplexity: { value: 1.0 },
    iCameraHeight: { value: 2.0 },
    iCameraDistance: { value: 3.0 },
    iSunIntensity: { value: 1.0 },
    iReflectionStrength: { value: 0.8 },
    iWaterDepth: { value: 0.4 },
    iWaterColor: { value: new THREE.Vector3(0 / 255, 40 / 255, 100 / 255) },
    iSunPosition: { value: 0.5 },
    // Add the black and white effect uniforms
    iGrainStrength: { value: 0.1 },
    iIntensity: { value: 0.85 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float iTime;
    uniform vec2 iResolution;
    uniform vec4 iMouse;
    uniform float iWaveHeight;
    uniform float iWaveSpeed;
    uniform float iWaveComplexity;
    uniform float iCameraHeight;
    uniform float iCameraDistance;
    uniform float iSunIntensity;
    uniform float iReflectionStrength;
    uniform float iWaterDepth;
    uniform vec3 iWaterColor;
    uniform float iSunPosition;
    // Black and white effect uniforms
    uniform float iGrainStrength;
    uniform float iIntensity;
    varying vec2 vUv;

    #define MAX_STEPS 100
    #define MAX_DIST 100.0
    #define SURF_DIST 0.01
    #define PI 3.14159265359

    // Random function for grain effect
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    // Noise functions
    float hash(float n) { return fract(sin(n) * 43758.5453); }
    
    float noise(vec3 x) {
      vec3 p = floor(x);
      vec3 f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      
      float n = p.x + p.y * 157.0 + 113.0 * p.z;
      return mix(
        mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
            mix(hash(n + 157.0), hash(n + 158.0), f.x), f.y),
        mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
            mix(hash(n + 270.0), hash(n + 271.0), f.x), f.y), f.z
      );
    }

    // Enhanced wave function with parameters
    float wave(vec2 p) {
      float time = iTime * iWaveSpeed;
      float height = 0.0;
      float waveFactor = iWaveHeight;
      float complexity = iWaveComplexity;
      
      // Primary waves
      height += sin(p.x * 0.5 * complexity + time * 0.5) * 
               cos(p.y * 0.3 * complexity + time * 0.3) * 0.5 * waveFactor;
      
      // Secondary waves
      height += sin(p.x * 0.2 * complexity - time * 0.2) * 
               cos(p.y * 0.7 * complexity + time * 0.4) * 0.3 * waveFactor;
      
      // Noise detail
      height += noise(vec3(p * 0.1 * complexity, time * 0.05)) * 0.4 * waveFactor;
      
      return height;
    }

    // Sky color with adjustable sun position
    vec3 getSkyColor(vec3 rd) {
      // Adjustable sun position based on parameter
      vec3 sunDir = normalize(vec3(0.2, 0.6 * iSunPosition + 0.2, 0.5));
      float sun = max(0.0, dot(rd, sunDir));
      
      // Basic sky gradient
      vec3 skyColor = mix(vec3(0.2, 0.4, 0.8), vec3(0.8, 0.9, 1.0), rd.y * 0.5 + 0.5);
      
      // Sun with adjustable intensity
      return skyColor + pow(sun, 32.0) * vec3(1.0, 0.8, 0.4) * 2.0 * iSunIntensity;
    }

    float getDist(vec3 p) {
      float sea = p.y - wave(p.xz);
      return sea;
    }

    float rayMarch(vec3 ro, vec3 rd) {
      float dO = 0.0;
      for(int i = 0; i < MAX_STEPS; i++) {
        vec3 p = ro + rd * dO;
        float dS = getDist(p) * 0.5;  // Reduced step size for better detail
        dO += dS;
        if(dO > MAX_DIST || abs(dS) < SURF_DIST) break;
      }
      return dO;
    }

    vec3 getNormal(vec3 p) {
      float d = getDist(p);
      vec2 e = vec2(0.01, 0);
      vec3 n = d - vec3(
        getDist(p - e.xyy),
        getDist(p - e.yxy),
        getDist(p - e.yyx)
      );
      return normalize(n);
    }

    float softshadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
      float res = 1.0;
      float t = mint;
      for(int i = 0; i < 16; i++) {
        float h = getDist(ro + rd * t);
        if(h < 0.001) return 0.0;
        res = min(res, k * h / t);
        t += clamp(h, 0.01, 0.2);
        if(t > maxt) break;
      }
      return res;
    }

    float calcAO(vec3 p, vec3 n) {
      float occ = 0.0;
      float sca = 1.0;
      for(int i = 0; i < 5; i++) {
        float hr = 0.01 + 0.12 * float(i) / 4.0;
        vec3 aopos = n * hr + p;
        float dd = getDist(aopos);
        occ += -(dd - hr) * sca;
        sca *= 0.95;
      }
      return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
    }

    vec3 render(vec3 ro, vec3 rd) {
      vec3 col = vec3(0);
      float d = rayMarch(ro, rd);

      if(d < MAX_DIST) {
        vec3 p = ro + rd * d;
        vec3 n = getNormal(p);
        vec3 r = reflect(rd, n);

        // Lighting with adjustable sun position
        vec3 sunDir = normalize(vec3(0.5, 0.8 * iSunPosition + 0.2, -0.3));
        float diff = max(dot(n, sunDir), 0.0);
        float spec = pow(max(dot(r, sunDir), 0.0), 32.0);
        float fresnel = pow(1.0 - max(dot(n, -rd), 0.0), 5.0);

        // Shadowing and AO
        float shadow = softshadow(p, sunDir, 0.01, 5.0, 32.0);
        float ao = calcAO(p, n);

        // Customizable water color
        vec3 deepColor = iWaterColor * 0.5; // Darker for deep water
        vec3 shallowColor = iWaterColor * 1.5; // Lighter for shallow water
        vec3 waterColor = mix(deepColor, shallowColor, fresnel);
        
        // Adjust water depth perception
        waterColor = mix(deepColor, waterColor, iWaterDepth);

        // Combine lighting
        col = waterColor * diff * shadow * ao;
        col += spec * shadow * vec3(1.0);
        
        // Add sky reflection with controllable strength
        vec3 skyRefl = getSkyColor(r);
        col = mix(col, skyRefl, fresnel * iReflectionStrength);

      } else {
        col = getSkyColor(rd);
      }

      // Atmospheric perspective
      col = mix(col, getSkyColor(rd), 1.0 - exp(-0.00002 * d * d));

      // Convert to grayscale using luminance formula (milky style)
      float luminance = dot(col, vec3(0.299, 0.587, 0.114));
      col = vec3(luminance);
      
      // Add grain effect
      vec2 uv = gl_FragCoord.xy / iResolution.xy;
      float grain = random(uv + iTime) * iGrainStrength;
      col += vec3(grain);
      
      // Apply intensity adjustment
      col *= iIntensity;

      // Apply squared look for milky style
      col = col * col;

      // Tone mapping and gamma correction
      col = col / (1.0 + col);
      col = pow(col, vec3(0.4545));

      return col;
    }

    void main() {
      vec2 uv = vUv * 2.0 - 1.0;
      uv.x *= iResolution.x / iResolution.y;

      // Camera setup with adjustable height and distance
      vec3 ro = vec3(0, iCameraHeight, -iCameraDistance);
      vec3 rd = normalize(vec3(uv.x, uv.y, 1));
      
      // Apply camera rotation (horizontal only)
      float rotAngle = -iMouse.x / iResolution.x * 2.0 + 1.0;
      mat2 rot = mat2(cos(rotAngle), -sin(rotAngle), sin(rotAngle), cos(rotAngle));
      ro.xz = rot * ro.xz;
      rd.xz = rot * rd.xz;

      vec3 col = render(ro, rd);

      gl_FragColor = vec4(col, 1.0);
    }
  `
});

// Create a fullscreen quad to render the shader on
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), oceanShaderMaterial);
scene.add(quad);

// Handle window resize
window.addEventListener("resize", () => {
  // Update renderer
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Update shader uniforms
  oceanShaderMaterial.uniforms.iResolution.value.x = window.innerWidth;
  oceanShaderMaterial.uniforms.iResolution.value.y = window.innerHeight;
});

// Update ScrollTrigger when parameters change
function updateScrollTrigger() {
  ScrollTrigger.getAll().forEach((trigger) => {
    if (trigger.vars.scrub) {
      trigger.vars.scrub = params.smoothScrolling ? 1 : 0.1;
      trigger.refresh();
    }
  });
}

// Listen for changes to the smoothScrolling parameter
const scrollController = gui.__folders["Scroll Behavior"].__controllers.find(
  (c) => c.property === "smoothScrolling"
);
scrollController.onChange(updateScrollTrigger);

// Animation loop
let previousTime = 0;
function animate(currentTime) {
  const deltaTime = (currentTime - previousTime) / 1000; // Convert to seconds
  previousTime = currentTime;

  requestAnimationFrame(animate);

  // Smooth mouse movement
  mouseX += (targetMouseX - mouseX) * 0.05;

  // Update time only if not paused
  if (!params.pauseAnimation) {
    animationTime += deltaTime * params.animationSpeed;
  }

  // Update shader uniforms
  oceanShaderMaterial.uniforms.iTime.value = animationTime;
  oceanShaderMaterial.uniforms.iMouse.value.x =
    ((mouseX / MAX_ROTATION_X + 1) * window.innerWidth) / 2;
  oceanShaderMaterial.uniforms.iMouse.value.y = window.innerHeight / 2; // Fixed vertical position

  // Update water color from GUI
  oceanShaderMaterial.uniforms.iWaterColor.value.x = params.waterColor[0] / 255;
  oceanShaderMaterial.uniforms.iWaterColor.value.y = params.waterColor[1] / 255;
  oceanShaderMaterial.uniforms.iWaterColor.value.z = params.waterColor[2] / 255;

  // Blend GUI controls with scroll-based animation
  oceanShaderMaterial.uniforms.iWaveHeight.value =
    (params.waveHeight * scrollBasedParams.waveHeight) / 0.5;
  oceanShaderMaterial.uniforms.iWaveSpeed.value = params.waveSpeed;
  oceanShaderMaterial.uniforms.iWaveComplexity.value =
    params.waveComplexity * scrollBasedParams.waveComplexity;
  oceanShaderMaterial.uniforms.iCameraHeight.value =
    params.cameraHeight * (scrollBasedParams.cameraHeight / 2.0);
  oceanShaderMaterial.uniforms.iCameraDistance.value =
    params.cameraDistance * (scrollBasedParams.cameraDistance / 3.0);
  oceanShaderMaterial.uniforms.iSunIntensity.value = params.sunIntensity;
  oceanShaderMaterial.uniforms.iReflectionStrength.value =
    params.reflectionStrength;
  oceanShaderMaterial.uniforms.iWaterDepth.value = params.waterDepth;
  oceanShaderMaterial.uniforms.iSunPosition.value =
    scrollBasedParams.sunPosition;

  // Update black and white effect uniforms
  oceanShaderMaterial.uniforms.iGrainStrength.value = params.grainStrength;
  oceanShaderMaterial.uniforms.iIntensity.value = params.intensity;

  // Render
  renderer.render(scene, camera);
}

animate(0);

// Log instructions to the console
console.log("Ocean Raymarching Controls:");
console.log("- Scroll to animate the ocean scene");
console.log("- Move mouse left/right to look around");
console.log("- Use the GUI panel to customize the water and milky style");