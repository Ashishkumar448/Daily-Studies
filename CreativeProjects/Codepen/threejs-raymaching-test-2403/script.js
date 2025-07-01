import * as THREE from "https://esm.sh/three";
import { GUI } from "https://esm.sh/dat.gui";

// Register ScrollTrigger with GSAP
gsap.registerPlugin(ScrollTrigger);

// Performance monitoring variables
let frameCount = 0;
let previousTime = 0;
let fps = 0;
let isLowPerformance = false;

// Initialize Three.js scene
const canvas = document.getElementById("raymarchCanvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
// Lower pixel ratio for better performance
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// Mouse tracking – throttled using requestAnimationFrame
let mouseX = 0;
let targetMouseX = 0;
const MAX_ROTATION_X = 0.7; // ~40° max rotation

document.addEventListener("mousemove", (event) => {
  targetMouseX =
    Math.max(-1, Math.min(1, (event.clientX / window.innerWidth) * 2 - 1)) *
    MAX_ROTATION_X;
});

// Configuration parameters
const params = {
  quality: "low", // low, medium, high
  adaptiveQuality: true,
  showFPS: false,
  debugNormals: false, // NEW: debug normals mode
  terrainHeight: 0.1,
  terrainSpeed: 0.4,
  terrainComplexity: 0.1,
  floatingIslands: false,
  islandHeight: 1.5,
  cameraHeight: 0.5,
  cameraDistance: 10.0,
  sunIntensity: 1.0,
  ambientLight: 0.2,
  fogDensity: 0.15,
  primaryColor: [150, 80, 200],
  secondaryColor: [50, 220, 100],
  glowIntensity: 0.7,
  glowColor: [255, 100, 50],
  animationSpeed: 1.0,
  pauseAnimation: false,
  smoothScrolling: true,
  scrollIntensity: 1.0,
  grainStrength: 0.05,
  intensity: 0.95,
  resetDefaults: function () {
    Object.assign(this, {
      quality: "medium",
      adaptiveQuality: true,
      showFPS: false,
      debugNormals: false,
      terrainHeight: 0.8,
      terrainSpeed: 0.4,
      terrainComplexity: 1.0,
      floatingIslands: true,
      islandHeight: 1.5,
      cameraHeight: 2.0,
      cameraDistance: 3.0,
      sunIntensity: 1.0,
      ambientLight: 0.2,
      fogDensity: 0.15,
      primaryColor: [150, 80, 200],
      secondaryColor: [50, 220, 100],
      glowIntensity: 0.7,
      glowColor: [255, 100, 50],
      animationSpeed: 1.0,
      pauseAnimation: false,
      smoothScrolling: true,
      scrollIntensity: 1.0,
      grainStrength: 0.05,
      intensity: 0.95
    });
    updateGUI();
    updateQualitySettings();
    alienShaderMaterial.uniforms.iDebug.value = params.debugNormals;
  }
};

// Setup GUI
const gui = new GUI({ width: 300 });
const performanceFolder = gui.addFolder("Performance");
performanceFolder
  .add(params, "quality", ["low", "medium", "high"])
  .name("Quality")
  .onChange(updateQualitySettings);
performanceFolder.add(params, "adaptiveQuality").name("Adaptive Quality");
performanceFolder.add(params, "showFPS").name("Show FPS");
performanceFolder
  .add(params, "debugNormals")
  .name("Debug Normals")
  .onChange(() => {
    alienShaderMaterial.uniforms.iDebug.value = params.debugNormals;
  });
performanceFolder.open();

const terrainFolder = gui.addFolder("Terrain Parameters");
terrainFolder.add(params, "terrainHeight", 0.1, 2.0).name("Terrain Height");
terrainFolder.add(params, "terrainSpeed", 0.1, 2.0).name("Terrain Speed");
terrainFolder
  .add(params, "terrainComplexity", 0.1, 3.0)
  .name("Terrain Complexity");
terrainFolder.add(params, "floatingIslands").name("Floating Islands");
terrainFolder.add(params, "islandHeight", 0.5, 3.0).name("Island Height");
terrainFolder.open();

const cameraFolder = gui.addFolder("Camera");
cameraFolder.add(params, "cameraHeight", 0.5, 10.0).name("Camera Height");
cameraFolder.add(params, "cameraDistance", 1.0, 10.0).name("Camera Distance");

const visualFolder = gui.addFolder("Visual Effects");
visualFolder.add(params, "sunIntensity", 0.0, 3.0).name("Sun Intensity");
visualFolder.add(params, "ambientLight", 0.0, 1.0).name("Ambient Light");
visualFolder.add(params, "fogDensity", 0.0, 0.5).name("Fog Density");
visualFolder.addColor(params, "primaryColor").name("Primary Color");
visualFolder.addColor(params, "secondaryColor").name("Secondary Color");
visualFolder.add(params, "glowIntensity", 0.0, 2.0).name("Glow Intensity");
visualFolder.addColor(params, "glowColor").name("Glow Color");

const effectsFolder = gui.addFolder("Post-Processing");
effectsFolder.add(params, "grainStrength", 0.0, 0.3).name("Grain Strength");
effectsFolder.add(params, "intensity", 0.0, 2.0).name("Intensity");
effectsFolder.open();

const animationFolder = gui.addFolder("Animation");
animationFolder.add(params, "animationSpeed", 0.1, 3.0).name("Animation Speed");
animationFolder.add(params, "pauseAnimation").name("Pause Animation");

const scrollFolder = gui.addFolder("Scroll Behavior");
scrollFolder.add(params, "smoothScrolling").name("Smooth Scrolling");
scrollFolder.add(params, "scrollIntensity", 0.1, 2.0).name("Scroll Intensity");

gui.add(params, "resetDefaults").name("Reset to Defaults");

function updateGUI() {
  Object.values(gui.__controllers).forEach((controller) =>
    controller.updateDisplay()
  );
  Object.values(gui.__folders).forEach((folder) => {
    Object.values(folder.__controllers).forEach((controller) =>
      controller.updateDisplay()
    );
  });
}

// Scroll-based animation setup
let animationTime = 0;
let scrollBasedParams = {
  cameraHeight: 2.0,
  cameraDistance: 3.0,
  terrainHeight: 0.8,
  terrainComplexity: 1.0,
  sunPosition: 0.5,
  islandHeight: 1.5
};

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

// Main timeline – one tween now uses "sine.inOut" easing for experimentation
const mainTimeline = gsap.timeline({
  scrollTrigger: {
    trigger: "body",
    start: "top top",
    end: "bottom bottom",
    scrub: params.smoothScrolling ? 1 : 0.1,
    onUpdate: (self) => {
      animationTime = self.progress * 20.0 * params.scrollIntensity;
    }
  }
});
mainTimeline.to(
  scrollBasedParams,
  {
    cameraHeight: 4.0,
    duration: 0.2,
    ease: "sine.inOut" // changed easing for smoother transition
  },
  0.1
);

// Animate sections on viewport entry
document.querySelectorAll(".section").forEach((section) => {
  ScrollTrigger.create({
    trigger: section,
    start: "top 80%",
    onEnter: () => section.classList.add("visible"),
    onLeave: () => section.classList.remove("visible"),
    onEnterBack: () => section.classList.add("visible"),
    onLeaveBack: () => section.classList.remove("visible")
  });
});

// FPS Display
const fpsDisplay = document.createElement("div");
Object.assign(fpsDisplay.style, {
  position: "absolute",
  top: "10px",
  left: "10px",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  color: "white",
  padding: "5px",
  fontFamily: "monospace",
  zIndex: "1000",
  display: "none"
});
document.body.appendChild(fpsDisplay);

// Quality settings
const qualitySettings = {
  low: {
    maxSteps: 48,
    shadowSteps: 8,
    aoSteps: 2,
    fbmOctaves: 3,
    islandDensity: 0.8
  },
  medium: {
    maxSteps: 64,
    shadowSteps: 12,
    aoSteps: 4,
    fbmOctaves: 4,
    islandDensity: 0.75
  },
  high: {
    maxSteps: 96,
    shadowSteps: 16,
    aoSteps: 5,
    fbmOctaves: 5,
    islandDensity: 0.7
  }
};

let currentQuality = qualitySettings.medium;
function updateQualitySettings() {
  currentQuality = qualitySettings[params.quality];
  if (alienShaderMaterial) {
    const u = alienShaderMaterial.uniforms;
    u.iMaxSteps.value = currentQuality.maxSteps;
    u.iShadowSteps.value = currentQuality.shadowSteps;
    u.iAOSteps.value = currentQuality.aoSteps;
    u.iFBMOctaves.value = currentQuality.fbmOctaves;
    u.iIslandDensity.value = currentQuality.islandDensity;
  }
}

// Create shader material with optimized raymarching code (with added debug uniform)
const alienShaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    iTime: { value: 0 },
    iResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight)
    },
    iMouse: { value: new THREE.Vector4(0, 0, 0, 0) },
    iTerrainHeight: { value: 0.8 },
    iTerrainSpeed: { value: 0.4 },
    iTerrainComplexity: { value: 1.0 },
    iFloatingIslands: { value: true },
    iIslandHeight: { value: 1.5 },
    iCameraHeight: { value: 2.0 },
    iCameraDistance: { value: 3.0 },
    iSunIntensity: { value: 1.0 },
    iAmbientLight: { value: 0.2 },
    iFogDensity: { value: 0.15 },
    iPrimaryColor: { value: new THREE.Vector3(150 / 255, 80 / 255, 200 / 255) },
    iSecondaryColor: {
      value: new THREE.Vector3(50 / 255, 220 / 255, 100 / 255)
    },
    iGlowIntensity: { value: 0.7 },
    iGlowColor: { value: new THREE.Vector3(1.0, 100 / 255, 50 / 255) },
    iSunPosition: { value: 0.5 },
    iGrainStrength: { value: 0.05 },
    iIntensity: { value: 0.95 },
    iMaxSteps: { value: 64 },
    iShadowSteps: { value: 12 },
    iAOSteps: { value: 4 },
    iFBMOctaves: { value: 4 },
    iIslandDensity: { value: 0.75 },
    iDebug: { value: false } // NEW: debug mode uniform
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;
    uniform float iTime;
    uniform vec2 iResolution;
    uniform vec4 iMouse;
    uniform float iTerrainHeight;
    uniform float iTerrainSpeed;
    uniform float iTerrainComplexity;
    uniform bool iFloatingIslands;
    uniform float iIslandHeight;
    uniform float iCameraHeight;
    uniform float iCameraDistance;
    uniform float iSunIntensity;
    uniform float iAmbientLight;
    uniform float iFogDensity;
    uniform vec3 iPrimaryColor;
    uniform vec3 iSecondaryColor;
    uniform float iGlowIntensity;
    uniform vec3 iGlowColor;
    uniform float iSunPosition;
    uniform float iGrainStrength;
    uniform float iIntensity;
    uniform int iMaxSteps;
    uniform int iShadowSteps;
    uniform int iAOSteps;
    uniform int iFBMOctaves;
    uniform float iIslandDensity;
    uniform bool iDebug; // NEW: debug mode flag
    varying vec2 vUv;

    #define SURF_DIST 0.01
    #define MAX_DIST 100.0
    #define PI 3.14159265359

    float random(vec2 st) {
      return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    float hash(float n) { 
      return fract(sin(n) * 43758.5453); 
    }
    float noise(vec3 x) {
      vec3 p = floor(x);
      vec3 f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      float n = p.x + p.y * 157.0 + 113.0 * p.z;
      return mix(
        mix(mix(hash(n), hash(n + 1.0), f.x),
            mix(hash(n + 157.0), hash(n + 158.0), f.x), f.y),
        mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
            mix(hash(n + 270.0), hash(n + 271.0), f.x), f.y), f.z
      );
    }
    float fbm(vec3 p) {
      float f = 0.0;
      float weight = 0.5;
      float freq = 1.0;
      for (int i = 0; i < 5; i++) {
        if(i >= iFBMOctaves) break;
        f += weight * noise(p * freq);
        weight *= 0.5;
        freq *= 2.0;
      }
      return f;
    }
    float sdSphere(vec3 p, float r) {
      float d2 = dot(p, p);
      if (d2 > r * r * 4.0) return r * 2.0;
      return length(p) - r;
    }
    float alienTerrain(vec3 p) {
      float t = iTime * iTerrainSpeed;
      float height = fbm(vec3(p.xz * 0.4 * iTerrainComplexity, t * 0.1)) * iTerrainHeight;
      height += 0.2 * sin(p.x * 0.8 * iTerrainComplexity + t * 0.2) *
                sin(p.z * 0.7 * iTerrainComplexity + t * 0.1) * iTerrainHeight;
      if(iFBMOctaves > 3) {
        height += 0.1 * fbm(vec3(p.xz * 1.5 * iTerrainComplexity, t * 0.05)) * iTerrainHeight;
      }
      float crack = smoothstep(0.1, 0.4, abs(sin(p.x * 2.0 + p.z * 2.0 + t * 0.1)));
      height -= crack * 0.2 * iTerrainHeight;
      return height;
    }
    float landscape(vec3 p) {
      float terrain = p.y - alienTerrain(p);
      if (iFloatingIslands) {
        vec3 cellPos = floor(p * 0.2);
        float cellNoise = hash(cellPos.x + cellPos.z * 100.0 + 17.0);
        if (cellNoise > iIslandDensity) {
          vec3 localPos = fract(p * 0.2) * 5.0 - 2.5;
          float islandTime = iTime * 0.2 + cellNoise * 10.0;
          localPos.y -= 1.0 + sin(islandTime) * 0.5 * iIslandHeight;
          float islandSize = 0.6 + cellNoise * 0.4;
          float island = sdSphere(localPos, islandSize);
          if(iFBMOctaves > 3) {
            island -= 0.2 * fbm(localPos * 3.0 + vec3(0, islandTime * 0.1, 0));
          }
          terrain = min(terrain, island);
        }
      }
      return terrain;
    }
    vec3 getSkyColor(vec3 rd) {
      vec3 sunDir = normalize(vec3(0.2, 0.6 * iSunPosition + 0.2, 0.5));
      float sun = max(0.0, dot(rd, sunDir));
      vec3 sun2Dir = normalize(vec3(-0.3, 0.4 * iSunPosition + 0.3, 0.6));
      float sun2 = max(0.0, dot(rd, sun2Dir));
      vec3 skyColor = mix(iPrimaryColor * 0.5, vec3(0.05, 0.05, 0.1), pow(rd.y * 0.5 + 0.5, 2.0));
      bool highQuality = (iFBMOctaves > 3);
      if(highQuality) {
        float nebula = fbm(rd * 5.0 + vec3(iTime * 0.02, 0, 0)) * 0.5;
        skyColor = mix(skyColor, iSecondaryColor * 0.3, nebula * (1.0 - rd.y));
      }
      vec3 sunColor = vec3(1.0, 0.7, 0.3) * iSunIntensity;
      vec3 sun2Color = vec3(0.2, 0.5, 1.0) * iSunIntensity * 0.7;
      if(sun > 0.9) skyColor += pow(sun, 32.0) * sunColor;
      if(sun2 > 0.9) skyColor += pow(sun2, 24.0) * sun2Color;
      return skyColor;
    }
    float getDist(vec3 p) {
      return landscape(p);
    }
    float rayMarch(vec3 ro, vec3 rd) {
      float dO = 0.0;
      float lastDist = 1000.0;
      for (int i = 0; i < 100; i++) {
        if(i >= iMaxSteps) break;
        vec3 p = ro + rd * dO;
        float dS = getDist(p);
        dO += dS * 0.7;
        if(dO > MAX_DIST || abs(dS) < SURF_DIST) break;
        if(dS > lastDist * 1.2 && dO > 10.0) break;
        lastDist = dS;
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
      float ph = 1e10;
      for (int i = 0; i < 16; i++) {
        if(i >= iShadowSteps) break;
        float h = getDist(ro + rd * t);
        float y = h*h/(2.0*ph);
        float d = sqrt(h*h - y*y);
        res = min(res, k * d / max(0.0, t - y));
        ph = h;
        t += clamp(h, 0.02, 0.2);
        if(res < 0.05 || t > maxt) break;
      }
      return clamp(res, 0.0, 1.0);
    }
    float calcAO(vec3 p, vec3 n) {
      float occ = 0.0;
      float sca = 1.0;
      for (int i = 0; i < 5; i++) {
        if(i >= iAOSteps) break;
        float hr = 0.01 + 0.12 * float(i) / 4.0;
        vec3 aopos = n * hr + p;
        float dd = getDist(aopos);
        occ += -(dd - hr) * sca;
        sca *= 0.95;
      }
      return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
    }
    float getGlow(vec3 p) {
      float pattern = fbm(p * 1.2 + vec3(0, iTime * 0.1, 0));
      return pattern * iGlowIntensity;
    }
    vec3 render(vec3 ro, vec3 rd) {
      vec3 col = vec3(0.0);
      float d = rayMarch(ro, rd);
      if(d < MAX_DIST) {
        vec3 p = ro + rd * d;
        vec3 n = getNormal(p);
        vec3 r = reflect(rd, n);
        float terrainPattern = fbm(p * 1.5);
        vec3 materialColor = mix(iPrimaryColor, iSecondaryColor, terrainPattern);
        materialColor = mix(materialColor, iPrimaryColor * 0.5, smoothstep(0.0, 2.0, p.y));
        float glow = (iGlowIntensity > 0.1) ? getGlow(p) : 0.0;
        vec3 sunDir = normalize(vec3(0.5, 0.8 * iSunPosition + 0.2, -0.3));
        vec3 sun2Dir = normalize(vec3(-0.3, 0.4 * iSunPosition + 0.3, 0.6));
        float diff1 = max(dot(n, sunDir), 0.0);
        float diff2 = max(dot(n, sun2Dir), 0.0) * 0.6;
        float spec1 = 0.0;
        float spec2 = 0.0;
        float dotRS1 = dot(r, sunDir);
        float dotRS2 = dot(r, sun2Dir);
        if(dotRS1 > 0.9) spec1 = pow(dotRS1, 16.0);
        if(dotRS2 > 0.9) spec2 = pow(dotRS2, 12.0) * 0.6;
        float fresnel = pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
        float shadow1 = (diff1 > 0.1) ? softshadow(p, sunDir, 0.01, 5.0, 16.0) : 1.0;
        float shadow2 = (diff2 > 0.1) ? softshadow(p, sun2Dir, 0.01, 5.0, 16.0) : 1.0;
        float ao = (iAOSteps > 0) ? calcAO(p, n) : 1.0;
        vec3 sunColor = vec3(1.0, 0.7, 0.3) * iSunIntensity;
        vec3 sun2Color = vec3(0.2, 0.5, 1.0) * iSunIntensity * 0.7;
        vec3 diffLight = (diff1 * shadow1 * sunColor + diff2 * shadow2 * sun2Color);
        vec3 specLight = (spec1 * shadow1 * sunColor + spec2 * shadow2 * sun2Color);
        vec3 ambLight = vec3(iAmbientLight);
        vec3 glowLight = iGlowColor * glow;
        col = materialColor * (diffLight + ambLight) * ao + specLight + glowLight;
        col += fresnel * iSecondaryColor * 0.2;
        if(iFBMOctaves > 3) {
          vec3 skyRefl = getSkyColor(r);
          col = mix(col, skyRefl, fresnel * 0.3);
        }
      } else {
        col = getSkyColor(rd);
      }
      float fogFactor = 1.0 - exp(-d * iFogDensity);
      col = mix(col, getSkyColor(rd) * 0.5, fogFactor);
      if (iGrainStrength > 0.01) {
        float luminance = dot(col, vec3(0.299, 0.587, 0.114));
        col = mix(col, vec3(luminance), 0.3);
        vec2 uv = gl_FragCoord.xy / iResolution.xy;
        float grain = random(uv + iTime * 0.1) * iGrainStrength;
        col += vec3(grain);
      }
      col *= iIntensity;
      col = col / (1.0 + col);
      col = pow(col, vec3(0.454));
      return col;
    }
    void main() {
      vec2 uv = vUv * 2.0 - 1.0;
      uv.x *= iResolution.x / iResolution.y;
      vec3 ro = vec3(0, iCameraHeight, -iCameraDistance);
      vec3 rd = normalize(vec3(uv.x, uv.y, 1));
      float rotAngle = -iMouse.x / iResolution.x * 2.0 + 1.0;
      mat2 rot = mat2(cos(rotAngle), -sin(rotAngle), sin(rotAngle), cos(rotAngle));
      ro.xz = rot * ro.xz;
      rd.xz = rot * rd.xz;
      
      // NEW: If debug mode is enabled, output normals as colors.
      if(iDebug) {
        float d = rayMarch(ro, rd);
        if(d < MAX_DIST) {
          vec3 p = ro + rd * d;
          vec3 n = getNormal(p);
          gl_FragColor = vec4(n * 0.5 + 0.5, 1.0);
        } else {
          gl_FragColor = vec4(getSkyColor(rd), 1.0);
        }
        return;
      }
      
      vec3 col = render(ro, rd);
      gl_FragColor = vec4(col, 1.0);
    }
  `
});

// Create fullscreen quad
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), alienShaderMaterial);
scene.add(quad);

// Resize handling
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  alienShaderMaterial.uniforms.iResolution.value.set(
    window.innerWidth,
    window.innerHeight
  );
});

// Apply initial quality settings
updateQualitySettings();

// Update ScrollTrigger when parameters change
function updateScrollTrigger() {
  ScrollTrigger.getAll().forEach((trigger) => {
    if (trigger.vars.scrub) {
      trigger.vars.scrub = params.smoothScrolling ? 1 : 0.1;
      trigger.refresh();
    }
  });
}
const scrollController = gui.__folders["Scroll Behavior"].__controllers.find(
  (c) => c.property === "smoothScrolling"
);
scrollController.onChange(updateScrollTrigger);

// Adaptive quality check based on FPS
function checkPerformance() {
  if (!params.adaptiveQuality) return;
  if (fps < 30 && !isLowPerformance) {
    isLowPerformance = true;
    params.quality = "low";
    updateQualitySettings();
    gui.__folders["Performance"].__controllers
      .find((c) => c.property === "quality")
      .updateDisplay();
  } else if (fps > 45 && isLowPerformance) {
    isLowPerformance = false;
    params.quality = "medium";
    updateQualitySettings();
    gui.__folders["Performance"].__controllers
      .find((c) => c.property === "quality")
      .updateDisplay();
  }
}

// Main animation loop
function animate(currentTime) {
  const deltaTime = (currentTime - previousTime) * 0.001;
  previousTime = currentTime;
  frameCount++;
  if (frameCount >= 10) {
    fps = Math.round(1 / (deltaTime / frameCount));
    frameCount = 0;
    fpsDisplay.style.display = params.showFPS ? "block" : "none";
    if (params.showFPS) fpsDisplay.textContent = `FPS: ${fps}`;
    checkPerformance();
  }
  requestAnimationFrame(animate);

  // Smooth mouse movement update
  mouseX += (targetMouseX - mouseX) * 0.05;

  // Only update animation time if not paused
  if (!params.pauseAnimation) {
    animationTime += deltaTime * params.animationSpeed;
  }

  // Cache uniforms for fewer lookups
  const u = alienShaderMaterial.uniforms;
  u.iTime.value = animationTime;
  u.iMouse.value.x = ((mouseX / MAX_ROTATION_X + 1) * window.innerWidth) / 2;
  u.iMouse.value.y = window.innerHeight / 2;

  // Update color uniforms
  u.iPrimaryColor.value.set(
    params.primaryColor[0] / 255,
    params.primaryColor[1] / 255,
    params.primaryColor[2] / 255
  );
  u.iSecondaryColor.value.set(
    params.secondaryColor[0] / 255,
    params.secondaryColor[1] / 255,
    params.secondaryColor[2] / 255
  );
  u.iGlowColor.value.set(
    params.glowColor[0] / 255,
    params.glowColor[1] / 255,
    params.glowColor[2] / 255
  );

  // Update other parameters with scroll modulation
  u.iFloatingIslands.value = params.floatingIslands;
  u.iTerrainHeight.value =
    (params.terrainHeight * scrollBasedParams.terrainHeight) / 0.8;
  u.iTerrainSpeed.value = params.terrainSpeed;
  u.iTerrainComplexity.value =
    params.terrainComplexity * scrollBasedParams.terrainComplexity;
  u.iIslandHeight.value =
    params.islandHeight * (scrollBasedParams.islandHeight / 1.5);
  u.iCameraHeight.value =
    params.cameraHeight * (scrollBasedParams.cameraHeight / 2.0);
  u.iCameraDistance.value =
    params.cameraDistance * (scrollBasedParams.cameraDistance / 3.0);
  u.iSunIntensity.value = params.sunIntensity;
  u.iAmbientLight.value = params.ambientLight;
  u.iFogDensity.value = params.fogDensity;
  u.iGlowIntensity.value = params.glowIntensity;
  u.iSunPosition.value = scrollBasedParams.sunPosition;
  u.iGrainStrength.value = params.grainStrength;
  u.iIntensity.value = params.intensity;

  renderer.render(scene, camera);
}
animate(0);

console.log("Optimized Alien Landscape Raymarching Controls:");
console.log("- Scroll to animate the landscape");
console.log("- Move mouse left/right to look around");
console.log("- Use the GUI to customize effects and toggle debug normals");
console.log("- Adjust Quality settings to match performance");