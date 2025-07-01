import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { GUI } from "https://cdn.skypack.dev/dat.gui";

// Initialize Three.js scene
const canvas = document.getElementById("renderCanvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Settings controlled by dat.GUI
const settings = {
  detail: 32,
  radius: 1.0,
  speed: 0.05,
  variation: 0.0,
  pulsate: true,
  multiAxisRotation: true,
  colorScheme: "Pink",

  // Additional effect controls
  rimLight: 0.3,
  specularPower: 200,
  shadowIntensity: 0.8,

  // Reset to defaults
  resetDefaults: function () {
    settings.detail = 32;
    settings.radius = 1.0;
    settings.speed = 0.05;
    settings.variation = 0.0;
    settings.pulsate = true;
    settings.multiAxisRotation = true;
    settings.colorScheme = "Pink";
    settings.rimLight = 0.3;
    settings.specularPower = 200;
    settings.shadowIntensity = 0.8;

    // Update uniforms
    updateUniforms();

    // Update GUI controllers
    updateGUIControllers();
  }
};

// Color schemes
const colorSchemes = {
  Pink: {
    color1: new THREE.Color("#e6c1d4"),
    color2: new THREE.Color("#9a5f7a")
  },
  Blue: {
    color1: new THREE.Color("#c8d9f5"),
    color2: new THREE.Color("#4b6cb7")
  },
  Teal: {
    color1: new THREE.Color("#c7f0db"),
    color2: new THREE.Color("#48a999")
  },
  Gold: {
    color1: new THREE.Color("#f5e0b7"),
    color2: new THREE.Color("#d4a657")
  },
  Purple: {
    color1: new THREE.Color("#e8c8e8"),
    color2: new THREE.Color("#9d529d")
  }
};

// Create a custom shader for our raymarched scene
const shaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    resolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight)
    },
    mouse: { value: new THREE.Vector2(0.5, 0.5) },
    detail: { value: settings.detail },
    radius: { value: settings.radius },
    speed: { value: settings.speed },
    variation: { value: settings.variation },
    pulsate: { value: settings.pulsate },
    multiAxisRotation: { value: settings.multiAxisRotation },
    color1: { value: colorSchemes[settings.colorScheme].color1 },
    color2: { value: colorSchemes[settings.colorScheme].color2 },
    rimLight: { value: settings.rimLight },
    specularPower: { value: settings.specularPower },
    shadowIntensity: { value: settings.shadowIntensity }
  },
  vertexShader: `
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
  fragmentShader: `
        precision highp float;
        
        uniform float time;
        uniform vec2 resolution;
        uniform vec2 mouse;
        uniform float detail;
        uniform float radius;
        uniform float speed;
        uniform float variation;
        uniform bool pulsate;
        uniform bool multiAxisRotation;
        uniform vec3 color1;
        uniform vec3 color2;
        uniform float rimLight;
        uniform float specularPower;
        uniform float shadowIntensity;
        
        varying vec2 vUv;
        
        #define Shadow 1
        #define PI 3.14159265359
        #define rot(t) mat2(cos(t), sin(t), -sin(t), cos(t))
        
        int obj;
        float dist;
        
        float smin(float d1, float d2, float k) {
          float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
          return mix(d2, d1, h) - k * h * (1.0 - h);
        }
        
        float smax(float d1, float d2, float k) {
          return smin(d1, d2, -k);
        }
        
        // Enhanced gyrold distance function with additional parameters and variations
        float gyr(vec3 p) {
          obj = 0;
          float r = radius;
          
          // Add pulsating effect if enabled
          if (pulsate) {
            r *= (1.0 + 0.1 * sin(time * 0.3 * speed + length(p)));
          }
          
          float d1 = length(p) - r;
          
          vec3 q = p;
          
          // Scale the patterns based on variation
          float baseFreq = 4.0 * (1.0 + variation * sin(time * 0.2));
          float d2 = dot(cos(q.yzx * baseFreq), sin(q * baseFreq)) / baseFreq;
          
          float k = detail;
          
          // Add variation to the high frequency pattern
          float varK = k * (1.0 + 0.2 * variation * sin(time * 0.1));
          float d6 = dot(cos(p * varK), sin(p.yzx * varK)) / varK;
          
          // Add a third frequency component for more detail
          float extraFreq = mix(8.0, 16.0, variation);
          float d7 = dot(cos(p * extraFreq), sin(p.zxy * extraFreq)) / extraFreq * 0.5;
          
          // Complex combination with additional variations
          float d5 = length(max(abs(vec2(d2, d1)), 0.0)) - 0.03;
          
          // Enhanced displacement based on variation
          float displace = mix(0.01, 0.05, variation);
          
          // Core formula with adjustments
          dist = 0.5 * smin(
            d5, 
            length(
              smax(0.0, 
                smax(d1, 
                  smax(abs(d2), abs(d6) - displace, 0.03), 
                0.03), 
              0.01) - 0.001
            ), 
            0.01
          );
          
          // Add extra displacement for more organic feel
          if (variation > 0.3) {
            float noise = sin(p.x * 10.0) * sin(p.y * 10.0) * sin(p.z * 10.0) * 0.01 * variation;
            dist += noise;
          }
          
          return dist;
        }
        
        float map(vec3 p) {
          if (multiAxisRotation) {
            // Multiple rotation axes for more complex motion
            p.xz *= rot(time * speed);
            p.xy *= rot(time * speed * 0.3);
            p.yz *= rot(time * speed * 0.15);
          } else {
            // Single axis rotation
            p.xz *= rot(time * speed);
          }
          
          return gyr(p);
        }
        
        // Enhanced shadow calculation
        float calcSoftshadow(in vec3 ro, in vec3 rd) {
          float res = 1.0;
          float t = 0.001;
          float ph = 1e10;
          float tmax = 5.0;
          float w = 0.2;
          
          for (int i = 0; i < 32; i++) {
            float h = map(ro + rd * t);
            float dm = max(dist, 0.001);
            
            float y = dm * dm / (2.0 * ph);
            float d = sqrt(dm * dm - y * y);
            res = min(res, d / (w * max(0.0, t - y)));
            ph = dm;
            
            t += h;
            
            if (res < 0.0001 || t > tmax) break;
          }
          
          res = clamp(res, 0.0, 1.0);
          return res * res * (3.0 - 2.0 * res);
        }
        
        // Calculate normal using central differences
        vec3 calcNormal(vec3 p) {
          const float h = 0.0001;
          const vec2 k = vec2(1, -1);
          return normalize(
            k.xyy * map(p + k.xyy * h) +
            k.yxy * map(p + k.yxy * h) +
            k.yyx * map(p + k.yyx * h) +
            k.xxx * map(p + k.xxx * h)
          );
        }
        
        // Enhanced raymarch function with better rendering
        vec4 raymarch(vec3 ro, vec3 rd) {
          vec4 color = vec4(0.0);
          vec3 p;
          float t = 0.0;
          
          for (int i = 0; i < 256 && t < 20.0; i++) {
            p = ro + rd * t;
            float d = map(p);
            
            if (d < 0.001) {
              // Calculate normal
              vec3 n = calcNormal(p);
              
              // Light direction
              vec3 s = normalize(vec3(-1.0, 2.0, -3.0));
              
              // Enhanced lighting
              float f = 0.5 + 0.5 * dot(n, s);
              float g = max(dot(n, s), 0.0);
              
              // More dramatic specular highlights
              float c = 1.0 + pow(f, specularPower) - f * 0.3;
              
              // Base color with depth variations
              vec3 baseColor = mix(color1, color2, 0.5 + 0.5 * sin(length(p) * 3.0));
              
              // Add variations based on position
              if (variation > 0.5) {
                baseColor = mix(
                  baseColor,
                  mix(color1, color2, 0.5 + 0.5 * sin(dot(cos(p * 8.0), sin(p * 8.0)))),
                  variation - 0.5
                );
              }
              
              // Apply lighting
              color.rgb = baseColor * c * g;
              color.a = 1.0;
              
              #if Shadow == 1
              vec3 rf = normalize(s * 100.0 - p);
              float shd = calcSoftshadow(p - rd * 0.001, rf);
              color.rgb *= mix(1.0, shd + 0.2, shadowIntensity);
              #endif
              
              // Enhanced depth effect
              float depthFade = smoothstep(15.0, 0.0, length(p));
              color.rgb *= depthFade;
              
              // Rim lighting
              if (rimLight > 0.0) {
                float rim = pow(1.0 - max(0.0, dot(n, -rd)), 4.0);
                color.rgb += rim * color1 * rimLight;
              }
              
              // Gamma correction
              color.rgb = pow(color.rgb, vec3(0.8));
              
              return color;
            }
            
            t += d * 0.95;
          }
          
          return color;
        }
        
        void main() {
          // Convert from uv space to centered screen space
          vec2 screenSpace = (vUv * 2.0 - 1.0) * vec2(resolution.x / resolution.y, 1.0);
          
          // Camera setup
          vec3 ro = vec3(0.0, 0.0, -2.5); // Camera position
          vec3 rd = normalize(vec3(screenSpace, 1.5)); // Ray direction
          
          // Add camera movement based on mouse
          float angle = mouse.x * PI * 2.0;
          float height = (mouse.y - 0.5) * 1.0;
          ro.x = sin(angle) * 2.5;
          ro.z = cos(angle) * 2.5;
          ro.y = height;
          
          // Look at center
          vec3 target = vec3(0.0, 0.0, 0.0);
          vec3 forward = normalize(target - ro);
          vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
          vec3 up = cross(forward, right);
          rd = normalize(screenSpace.x * right + screenSpace.y * up + 1.5 * forward);
          
          // Execute the raymarching
          vec4 color = raymarch(ro, rd);
          
          // Background with subtle gradient
          if (color.a < 0.1) {
            float y = rd.y * 0.5 + 0.5;
            color.rgb = mix(color2 * 0.1, color1 * 0.2, y);
            color.a = 1.0;
          }
          
          gl_FragColor = color;
        }
      `,
  transparent: true
});

// Create a full-screen quad to run the shader
const quadGeometry = new THREE.PlaneGeometry(2, 2);
const quad = new THREE.Mesh(quadGeometry, shaderMaterial);

// Create a scene and camera for the quad
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
scene.add(quad);

// Function to update all uniforms based on settings
function updateUniforms() {
  shaderMaterial.uniforms.detail.value = settings.detail;
  shaderMaterial.uniforms.radius.value = settings.radius;
  shaderMaterial.uniforms.speed.value = settings.speed;
  shaderMaterial.uniforms.variation.value = settings.variation;
  shaderMaterial.uniforms.pulsate.value = settings.pulsate;
  shaderMaterial.uniforms.multiAxisRotation.value = settings.multiAxisRotation;
  shaderMaterial.uniforms.color1.value =
    colorSchemes[settings.colorScheme].color1;
  shaderMaterial.uniforms.color2.value =
    colorSchemes[settings.colorScheme].color2;
  shaderMaterial.uniforms.rimLight.value = settings.rimLight;
  shaderMaterial.uniforms.specularPower.value = settings.specularPower;
  shaderMaterial.uniforms.shadowIntensity.value = settings.shadowIntensity;
}

// Setup dat.GUI using the imported GUI class
const gui = new GUI();

// Core parameters folder
const coreFolder = gui.addFolder("Core Parameters");
const detailController = coreFolder
  .add(settings, "detail", 4, 48, 4)
  .onChange((value) => {
    shaderMaterial.uniforms.detail.value = value;
  });
const radiusController = coreFolder
  .add(settings, "radius", 0.5, 2.0, 0.05)
  .onChange((value) => {
    shaderMaterial.uniforms.radius.value = value;
  });
const speedController = coreFolder
  .add(settings, "speed", 0.01, 0.2, 0.01)
  .onChange((value) => {
    shaderMaterial.uniforms.speed.value = value;
  });
coreFolder.open();

// Effect parameters folder
const effectsFolder = gui.addFolder("Effect Parameters");
const variationController = effectsFolder
  .add(settings, "variation", 0, 1, 0.05)
  .onChange((value) => {
    shaderMaterial.uniforms.variation.value = value;
  });
const pulsateController = effectsFolder
  .add(settings, "pulsate")
  .onChange((value) => {
    shaderMaterial.uniforms.pulsate.value = value;
  });
const multiAxisRotationController = effectsFolder
  .add(settings, "multiAxisRotation")
  .onChange((value) => {
    shaderMaterial.uniforms.multiAxisRotation.value = value;
  });
effectsFolder.open();

// Visual parameters folder
const visualFolder = gui.addFolder("Visual Parameters");
const colorSchemeController = visualFolder
  .add(settings, "colorScheme", Object.keys(colorSchemes))
  .onChange((value) => {
    shaderMaterial.uniforms.color1.value = colorSchemes[value].color1;
    shaderMaterial.uniforms.color2.value = colorSchemes[value].color2;
  });
const rimLightController = visualFolder
  .add(settings, "rimLight", 0, 1, 0.05)
  .onChange((value) => {
    shaderMaterial.uniforms.rimLight.value = value;
  });
const specularPowerController = visualFolder
  .add(settings, "specularPower", 20, 500, 10)
  .onChange((value) => {
    shaderMaterial.uniforms.specularPower.value = value;
  });
const shadowIntensityController = visualFolder
  .add(settings, "shadowIntensity", 0, 1, 0.05)
  .onChange((value) => {
    shaderMaterial.uniforms.shadowIntensity.value = value;
  });
visualFolder.open();

// Presets folder
const presetsFolder = gui.addFolder("Presets");

// Define presets
const presets = {
  Classic: {
    detail: 32,
    radius: 1.0,
    speed: 0.05,
    variation: 0.0,
    pulsate: true,
    multiAxisRotation: false,
    colorScheme: "Pink",
    rimLight: 0.3,
    specularPower: 200,
    shadowIntensity: 0.8
  },
  Crystal: {
    detail: 48,
    radius: 0.8,
    speed: 0.03,
    variation: 0.2,
    pulsate: false,
    multiAxisRotation: true,
    colorScheme: "Blue",
    rimLight: 0.5,
    specularPower: 400,
    shadowIntensity: 0.9
  },
  Organic: {
    detail: 24,
    radius: 1.2,
    speed: 0.08,
    variation: 0.6,
    pulsate: true,
    multiAxisRotation: true,
    colorScheme: "Teal",
    rimLight: 0.4,
    specularPower: 100,
    shadowIntensity: 0.6
  },
  Cosmic: {
    detail: 16,
    radius: 1.1,
    speed: 0.12,
    variation: 0.8,
    pulsate: true,
    multiAxisRotation: true,
    colorScheme: "Purple",
    rimLight: 0.6,
    specularPower: 150,
    shadowIntensity: 0.7
  }
};

// Add preset buttons
Object.keys(presets).forEach((presetName) => {
  presetsFolder
    .add(
      {
        apply: function () {
          const preset = presets[presetName];

          // Apply preset to settings
          Object.keys(preset).forEach((key) => {
            settings[key] = preset[key];
          });

          // Update uniforms
          updateUniforms();

          // Update GUI controllers
          updateGUIControllers();
        }
      },
      "apply"
    )
    .name(presetName);
});

// Add reset button
gui.add(settings, "resetDefaults").name("Reset to Defaults");

// Function to update GUI controllers on reset
function updateGUIControllers() {
  detailController.updateDisplay();
  radiusController.updateDisplay();
  speedController.updateDisplay();
  variationController.updateDisplay();
  pulsateController.updateDisplay();
  multiAxisRotationController.updateDisplay();
  colorSchemeController.updateDisplay();
  rimLightController.updateDisplay();
  specularPowerController.updateDisplay();
  shadowIntensityController.updateDisplay();
}

// Handle window resize
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  shaderMaterial.uniforms.resolution.value.set(
    window.innerWidth,
    window.innerHeight
  );
});

// Handle mouse movement
window.addEventListener("mousemove", (event) => {
  const mouseX = event.clientX / window.innerWidth;
  const mouseY = event.clientY / window.innerHeight;
  shaderMaterial.uniforms.mouse.value.set(mouseX, mouseY);
});

// Animation loop
function animate() {
  const time = performance.now() * 0.001;
  shaderMaterial.uniforms.time.value = time;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();