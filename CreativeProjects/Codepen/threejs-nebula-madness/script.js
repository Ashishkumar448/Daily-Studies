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

// Color themes with improved colors and gradients
const colorThemes = {
  cosmic: {
    name: "Cosmic Purple",
    baseColor: [0.7, 0.5, 1.0], // Light purple
    accentColor: [0.8, 0.3, 0.8], // Pink-purple
    edgeColor: [0.3, 0.1, 0.6], // Dark purple
    glowColor: [0.6, 0.2, 1.0], // Bright purple
    tintColor: [43, 0, 25], // Dark purple tint
    tintStrength: 0.36,
    bloomStrength: 0.05 // Reduced bloom
  },
  azure: {
    name: "Azure Nebula",
    baseColor: [0.4, 0.7, 1.0], // Light blue
    accentColor: [0.2, 0.5, 0.9], // Medium blue
    edgeColor: [0.0, 0.2, 0.5], // Dark blue
    glowColor: [0.5, 0.8, 1.0], // Bright blue
    tintColor: [0, 30, 60], // Deep blue tint
    tintStrength: 0.4,
    bloomStrength: 0.05 // Reduced bloom
  },
  emerald: {
    name: "Emerald Dust",
    baseColor: [0.3, 0.8, 0.5], // Light green
    accentColor: [0.1, 0.6, 0.4], // Medium green
    edgeColor: [0.0, 0.4, 0.2], // Dark green
    glowColor: [0.4, 1.0, 0.6], // Bright green
    tintColor: [0, 50, 30], // Deep green tint
    tintStrength: 0.35,
    bloomStrength: 0.05 // Reduced bloom
  },
  crimson: {
    name: "Crimson Nova",
    baseColor: [1.0, 0.4, 0.4], // Light red
    accentColor: [0.9, 0.2, 0.2], // Medium red
    edgeColor: [0.5, 0.1, 0.1], // Dark red
    glowColor: [1.0, 0.3, 0.3], // Bright red
    tintColor: [60, 0, 10], // Deep red tint
    tintStrength: 0.45,
    bloomStrength: 0.05 // Reduced bloom
  },
  amber: {
    name: "Amber Glow",
    baseColor: [1.0, 0.8, 0.3], // Light amber
    accentColor: [0.9, 0.6, 0.1], // Medium amber
    edgeColor: [0.6, 0.3, 0.0], // Dark amber
    glowColor: [1.0, 0.7, 0.2], // Bright amber
    tintColor: [43, 0, 25], // Using the value from screenshot
    tintStrength: 0, // Using the value from screenshot
    bloomStrength: 0.05 // Reduced bloom
  },
  // New gradient themes
  twilight: {
    name: "Twilight Gradient",
    baseColor: [0.6, 0.4, 0.8], // Lavender
    accentColor: [0.3, 0.5, 0.9], // Blue-purple
    edgeColor: [0.1, 0.0, 0.3], // Deep purple
    glowColor: [0.8, 0.6, 1.0], // Light purple
    tintColor: [20, 10, 40], // Dark purple-blue tint
    tintStrength: 0.38,
    bloomStrength: 0.05
  },
  sunset: {
    name: "Sunset Gradient",
    baseColor: [1.0, 0.6, 0.4], // Peach
    accentColor: [0.9, 0.4, 0.3], // Coral
    edgeColor: [0.5, 0.2, 0.0], // Burnt orange
    glowColor: [1.0, 0.8, 0.5], // Gold
    tintColor: [43, 0, 25], // Using the value from screenshot
    tintStrength: 0, // Using the value from screenshot
    bloomStrength: 0.05
  },
  oceanic: {
    name: "Oceanic Gradient",
    baseColor: [0.3, 0.7, 0.8], // Teal
    accentColor: [0.1, 0.5, 0.7], // Medium blue
    edgeColor: [0.0, 0.3, 0.5], // Deep blue
    glowColor: [0.5, 0.9, 1.0], // Light cyan
    tintColor: [0, 40, 50], // Deep teal tint
    tintStrength: 0.37,
    bloomStrength: 0.05
  },
  // New bright/white theme
  celestial: {
    name: "Celestial Light",
    baseColor: [0.95, 0.95, 1.0], // Almost white with slight blue tint
    accentColor: [0.9, 0.9, 1.0], // Slightly blue-white
    edgeColor: [0.8, 0.8, 0.9], // Light blue-gray
    glowColor: [1.0, 1.0, 1.0], // Pure white glow
    tintColor: [240, 240, 255], // Very light blue tint
    tintStrength: 0.2,
    bloomStrength: 0.08 // Slightly stronger bloom for the bright theme
  },
  // New dark/moody/mysterious theme
  abyss: {
    name: "Abyssal Depths",
    baseColor: [0.25, 0.28, 0.35], // Lighter dark blue-gray
    accentColor: [0.15, 0.18, 0.25], // Dark blue-gray
    edgeColor: [0.08, 0.1, 0.15], // Very dark blue-gray but still visible
    glowColor: [0.4, 0.45, 0.6], // Brighter blue glow for contrast
    tintColor: [20, 22, 30], // Dark blue-gray tint
    tintStrength: 0.3, // Reduced tint strength for better visibility
    bloomStrength: 0.12 // Increased bloom for better visibility
  }
};

// Settings object for dat.gui - updated with values from screenshot
const settings = {
  // Supernova settings
  zoom: 1.4,
  maxZoom: 7.0,
  rotationSpeed: 0.1,
  autoRotation: false, // From screenshot
  dithering: false, // From screenshot
  background: true, // From screenshot
  toneMapping: false, // From screenshot

  // Mouse interaction settings
  mouseInteractionEnabled: true, // From screenshot
  mouseInteractionStrength: 0.07, // From screenshot
  zoomWithMouse: true, // From screenshot
  zoomStrength: 0.15, // From screenshot
  zoomSmoothness: 0.082, // From screenshot
  zoomStability: 0.41, // From screenshot
  easingSpeed: 0.2, // From screenshot

  // Color settings
  currentTheme: "amber", // From screenshot
  tintColor: [43, 0, 25], // From screenshot
  tintStrength: 0, // From screenshot
  grainStrength: 0.16, // From screenshot

  // Post-processing
  bloomStrength: 0.05, // From screenshot
  bloomRadius: 0.14, // From screenshot
  bloomThreshold: 0.043 // From screenshot
};

// Mouse tracking with additional smoothing
const mouse = new THREE.Vector2(0, 0);
const smoothedMouse = new THREE.Vector2(0, 0); // For smoother mouse movement
let mouseDistance = 1.0;
let isMouseInCanvas = false;

// Current dynamic values with easing
const currentValues = {
  rotationAngle: 0,
  zoom: settings.zoom,
  // Add a history of zoom values for additional smoothing
  zoomHistory: Array(10).fill(settings.zoom)
};

// Target values (what we're easing towards)
const targetValues = {
  rotationAngle: 0,
  zoom: settings.zoom
};

// Linear interpolation function for smooth transitions
function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

// Non-linear easing function for zoom to reduce jumpiness at high zoom levels
function easeZoom(current, target, factor, stability) {
  // Calculate the zoom difference
  const diff = target - current;

  // Apply non-linear scaling based on current zoom level
  // Higher zoom = smaller steps
  const zoomFactor = 1.0 / (1.0 + current * stability);

  // Apply the scaled difference
  return current + diff * factor * zoomFactor;
}

// Function to get smoothed zoom from history
function getSmoothedZoom() {
  // Calculate weighted average of zoom history
  let totalWeight = 0;
  let weightedSum = 0;

  for (let i = 0; i < currentValues.zoomHistory.length; i++) {
    // More recent values have higher weight
    const weight = (i + 1) / currentValues.zoomHistory.length;
    weightedSum += currentValues.zoomHistory[i] * weight;
    totalWeight += weight;
  }

  return weightedSum / totalWeight;
}

// Function to update zoom history
function updateZoomHistory(newZoom) {
  // Shift all values and add new one at the end
  currentValues.zoomHistory.shift();
  currentValues.zoomHistory.push(newZoom);
}

document.addEventListener("mousemove", (event) => {
  isMouseInCanvas = true;
  // Raw mouse position
  const rawMouseX = (event.clientX / window.innerWidth) * 2 - 1;
  const rawMouseY = -(event.clientY / window.innerHeight) * 2 + 1;

  // Apply smoothing to mouse movement
  smoothedMouse.x = lerp(smoothedMouse.x, rawMouseX, 0.1); // Slower mouse tracking
  smoothedMouse.y = lerp(smoothedMouse.y, rawMouseY, 0.1);

  // Use smoothed mouse for calculations
  mouse.x = smoothedMouse.x;
  mouse.y = smoothedMouse.y;

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

// Create a random texture for the keyboard input simulation
function createRandomTexture(size = 4) {
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

// Create textures
const noiseTexture1 = createNoiseTexture(256);
const noiseTexture2 = createNoiseTexture(256);
const keyboardTexture = createRandomTexture(4);

// Supernova shader
const supernovaShader = {
  uniforms: {
    iTime: { value: 0 },
    iResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight)
    },
    iMouse: { value: new THREE.Vector4() },
    iChannel0: { value: noiseTexture1 },
    iChannel1: { value: keyboardTexture },
    iChannel2: { value: noiseTexture2 },
    zoom: { value: settings.zoom },
    dithering: { value: settings.dithering },
    background: { value: settings.background },
    toneMapping: { value: settings.toneMapping },
    tintColor: {
      value: new THREE.Vector3(
        settings.tintColor[0] / 255,
        settings.tintColor[1] / 255,
        settings.tintColor[2] / 255
      )
    },
    tintStrength: { value: settings.tintStrength },
    grainStrength: { value: settings.grainStrength },
    rotationAngle: { value: 0 },
    // Color uniforms for better theme control
    baseColor: {
      value: new THREE.Vector3(
        colorThemes.amber.baseColor[0],
        colorThemes.amber.baseColor[1],
        colorThemes.amber.baseColor[2]
      )
    },
    accentColor: {
      value: new THREE.Vector3(
        colorThemes.amber.accentColor[0],
        colorThemes.amber.accentColor[1],
        colorThemes.amber.accentColor[2]
      )
    },
    edgeColor: {
      value: new THREE.Vector3(
        colorThemes.amber.edgeColor[0],
        colorThemes.amber.edgeColor[1],
        colorThemes.amber.edgeColor[2]
      )
    },
    glowColor: {
      value: new THREE.Vector3(
        colorThemes.amber.glowColor[0],
        colorThemes.amber.glowColor[1],
        colorThemes.amber.glowColor[2]
      )
    }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    // "Supernova remnant" by Duke
    // https://www.shadertoy.com/view/MdKXzc
    //-------------------------------------------------------------------------------------
    // Based on "Dusty nebula 4" (https://www.shadertoy.com/view/MsVXWW) 
    // and "Protoplanetary disk" (https://www.shadertoy.com/view/MdtGRl) 
    // otaviogood's "Alien Beacon" (https://www.shadertoy.com/view/ld2SzK)
    // and Shane's "Cheap Cloud Flythrough" (https://www.shadertoy.com/view/Xsc3R4) shaders
    // Some ideas came from other shaders from this wonderful site
    // Press 1-2-3 to zoom in and zoom out.
    // License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License
    //-------------------------------------------------------------------------------------
    
    uniform float iTime;
    uniform vec2 iResolution;
    uniform vec4 iMouse;
    uniform sampler2D iChannel0;
    uniform sampler2D iChannel1;
    uniform sampler2D iChannel2;
    uniform float zoom;
    uniform bool dithering;
    uniform bool background;
    uniform bool toneMapping;
    uniform vec3 tintColor;
    uniform float tintStrength;
    uniform float grainStrength;
    uniform float rotationAngle;
    // Color uniforms
    uniform vec3 baseColor;
    uniform vec3 accentColor;
    uniform vec3 edgeColor;
    uniform vec3 glowColor;
    varying vec2 vUv;
    
    #define pi 3.14159265
    #define R(p, a) p=cos(a)*p+sin(a)*vec2(p.y, -p.x)
    
    // iq's noise
    float noise(in vec3 x) {
        vec3 p = floor(x);
        vec3 f = fract(x);
        f = f*f*(3.0-2.0*f);
        vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;
        vec2 rg = texture(iChannel0, (uv+ 0.5)/256.0).yx;
        return 1. - 0.82*mix(rg.x, rg.y, f.z);
    }
    
    float fbm(vec3 p) {
       return noise(p*.06125)*.5 + noise(p*.125)*.25 + noise(p*.25)*.125 + noise(p*.4)*.2;
    }
    
    float length2(vec2 p) {
        return sqrt(p.x*p.x + p.y*p.y);
    }
    
    float length8(vec2 p) {
        p = p*p; p = p*p; p = p*p;
        return pow(p.x + p.y, 1.0/8.0);
    }
    
    float Disk(vec3 p, vec3 t) {
        vec2 q = vec2(length2(p.xy)-t.x,p.z*0.5);
        return max(length8(q)-t.y, abs(p.z) - t.z);
    }
    
    // otaviogood's noise from https://www.shadertoy.com/view/ld2SzK
    const float nudge = 0.9;    // size of perpendicular vector
    float normalizer = 1.0 / sqrt(1.0 + nudge*nudge);    // pythagorean theorem on that perpendicular to maintain scale
    
    float SpiralNoiseC(vec3 p) {
        float n = 0.0;    // noise amount
        float iter = 2.0;
        for (int i = 0; i < 8; i++) {
            // add sin and cos scaled inverse with the frequency
            n += -abs(sin(p.y*iter) + cos(p.x*iter)) / iter;    // abs for a ridged look
            // rotate by adding perpendicular and scaling down
            p.xy += vec2(p.y, -p.x) * nudge;
            p.xy *= normalizer;
            // rotate on other axis
            p.xz += vec2(p.z, -p.x) * nudge;
            p.xz *= normalizer;
            // increase the frequency
            iter *= 1.733733;
        }
        return n;
    }
    
    float NebulaNoise(vec3 p) {
        float final = Disk(p.xzy, vec3(2.0, 1.8, 1.25));
        final += fbm(p*90.);
        final += SpiralNoiseC(p.zxy*0.5123+100.0)*3.0;
        return final;
    }
    
    float map(vec3 p) {
        // Use the rotationAngle uniform instead of iMouse.x
        R(p.xz, rotationAngle);
        float NebNoise = abs(NebulaNoise(p/0.5)*0.5);
        return NebNoise+0.07;
    }
    
    // assign color to the media
    vec3 computeColor(float density, float radius) {
        // Use the color uniforms for better theme control
        // color based on density alone, gives impression of occlusion within the media
        vec3 result = mix(baseColor, edgeColor, density);
        
        // color added to the media
        vec3 colCenter = 7.0 * accentColor;
        vec3 colEdge = 1.5 * glowColor;
        result *= mix(colCenter, colEdge, min((radius+.05)/.9, 1.15));
        
        return result;
    }
    
    bool RaySphereIntersect(vec3 org, vec3 dir, out float near, out float far) {
        float b = dot(dir, org);
        float c = dot(org, org) - 8.;
        float delta = b*b - c;
        if(delta < 0.0) 
            return false;
        float deltasqrt = sqrt(delta);
        near = -b - deltasqrt;
        far = -b + deltasqrt;
        return far > 0.0;
    }
    
    // Applies the filmic curve from John Hable's presentation
    vec3 ToneMapFilmicALU(vec3 _color) {
        _color = max(vec3(0), _color - vec3(0.004));
        _color = (_color * (6.2*_color + vec3(0.5))) / (_color * (6.2 * _color + vec3(1.7)) + vec3(0.06));
        return _color;
    }
    
    float hash21(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    float white_noise(vec2 p) {
        return hash21(p);
    }
    
    void main() {
        // Convert from vUv (0-1) to fragCoord (0-resolution)
        vec2 fragCoord = vUv * iResolution;
        
        // Simulate key presses for zoom
        float key = 0.0;
        const float KEY_1 = 49.5/256.0;
        const float KEY_2 = 50.5/256.0;
        const float KEY_3 = 51.5/256.0;
        key += 0.7*texture(iChannel1, vec2(KEY_1,0.25)).x;
        key += 0.7*texture(iChannel1, vec2(KEY_2,0.25)).x;
        key += 0.7*texture(iChannel1, vec2(KEY_3,0.25)).x;
        
        // Apply zoom from settings
        key = zoom - 1.0;
        
        // ro: ray origin
        // rd: direction of the ray
        vec3 rd = normalize(vec3((fragCoord.xy-0.5*iResolution.xy)/iResolution.y, 1.));
        vec3 ro = vec3(0., 0., -6.+key*1.6);
        
        // ld, td: local, total density 
        // w: weighting factor
        float ld=0., td=0., w=0.;
        
        // t: length of the ray
        // d: distance function
        float d=1., t=0.;
        
        const float h = 0.1;
       
        vec4 sum = vec4(0.0);
       
        float min_dist=0.0, max_dist=2.0;
        
        if(RaySphereIntersect(ro, rd, min_dist, max_dist)) {
            t = min_dist*step(t,min_dist);
           
            // raymarch loop
            for (int i=0; i<64; i++) {
                vec3 pos = ro + t*rd;
              
                // Loop break conditions.
                if(td>0.7 || d<0.1*t || t>10. || sum.a > 0.99 || t>max_dist) break;
                
                // evaluate distance function
                float d = map(pos);
                       
                // change this string to control density 
                d = max(d,0.0);
                
                // point light calculations
                vec3 ldst = vec3(0.0)-pos;
                float lDist = max(length(ldst), 0.001);
                
                // the color of light - use accent color for better theming
                vec3 lightColor = accentColor * 1.5;
                
                sum.rgb+=(baseColor/(lDist*lDist*10.)/80.); // star itself
                sum.rgb+=(lightColor/exp(lDist*lDist*lDist*.08)/30.); // bloom
                
                if (d<h) {
                    // compute local density 
                    ld = h - d;
                    
                    // compute weighting factor 
                    w = (1. - td) * ld;
             
                    // accumulate density
                    td += w + 1./200.;
                
                    vec4 col = vec4(computeColor(td,lDist), td);
                    
                    // emission
                    sum += sum.a * vec4(sum.rgb, 0.0) * 0.2;    
                    
                    // uniform scale density
                    col.a *= 0.2;
                    // colour by alpha
                    col.rgb *= col.a;
                    // alpha blend in contribution
                    sum = sum + col*(1.0 - sum.a);  
               
                }
              
                td += 1./70.;
                
                if (dithering) {
                    //idea from https://www.shadertoy.com/view/lsj3Dw
                    vec2 uv = fragCoord.xy / iResolution.xy;
                    uv.y*=120.;
                    uv.x*=280.;
                    d=abs(d)*(.8+0.08*texture(iChannel2,vec2(uv.y,-uv.x+0.5*sin(4.*iTime+uv.y*4.0))).r);
                }
                
                // trying to optimize step size near the camera and near the light source
                t += max(d * 0.12 * max(min(length(ldst),length(ro)),1.0), 0.01);
            }
            
            // simple scattering
            sum *= 1. / exp(ld * 0.02) * 0.57;
                
            sum = clamp(sum, 0.0, 1.0);
           
            sum.xyz = sum.xyz*sum.xyz*(3.0-2.0*sum.xyz);
        }
        
        // stars background
        if (background && td<.3) {
            vec3 stars = vec3(noise(rd*500.0)*0.5+0.5);
            vec3 starbg = vec3(0.0);
            starbg = mix(starbg, baseColor, smoothstep(0.99, 1.0, stars)*clamp(dot(vec3(0.0),rd)+0.75,0.0,1.0));
            starbg = clamp(starbg, 0.0, 1.0);
            sum.xyz += starbg; 
        }
        
        // Apply tone mapping if enabled
        if (toneMapping) {
            sum.xyz = ToneMapFilmicALU(sum.xyz*1.0);
        }
        
        // Apply procedural grain that doesn't affect bloom
        float grain = white_noise(fragCoord + vec2(iTime * 100.0)) * grainStrength;
        sum.rgb += (grain * 2.0 - 1.0) * 0.05; // Subtle grain that doesn't darken the image
        
        // - Tint
        sum.rgb += mix(sum.rgb, tintColor, tintStrength);
        sum.rgb -= mix(sum.rgb, tintColor, tintStrength) * 0.3;
        
        gl_FragColor = vec4(sum.xyz, 1.0);
    }
  `
};

// Film grain shader - updated with the provided implementation
const filmGrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0.0 },
    resolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight)
    },
    intensity: { value: settings.grainStrength }
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
    uniform vec2 resolution;
    uniform float intensity;
    varying vec2 vUv;

    #define SHOW_NOISE 0
    #define SRGB 0
    // 0: Addition, 1: Screen, 2: Overlay, 3: Soft Light, 4: Lighten-Only
    #define BLEND_MODE 0
    #define SPEED 2.0
    // What gray level noise should tend to
    #define MEAN 0.0
    // Controls the contrast/variance of noise.
    #define VARIANCE 0.5

    vec3 channel_mix(vec3 a, vec3 b, vec3 w) {
      return vec3(mix(a.r, b.r, w.r), mix(a.g, b.g, w.g), mix(a.b, b.b, w.b));
    }

    float gaussian(float z, float u, float o) {
      return (1.0 / (o * sqrt(2.0 * 3.1415))) * exp(-(((z - u) * (z - u)) / (2.0 * (o * o))));
    }

    vec3 madd(vec3 a, vec3 b, float w) {
      return a + a * b * w;
    }

    vec3 screen(vec3 a, vec3 b, float w) {
      return mix(a, vec3(1.0) - (vec3(1.0) - a) * (vec3(1.0) - b), w);
    }

    vec3 overlay(vec3 a, vec3 b, float w) {
      return mix(a, channel_mix(
        2.0 * a * b,
        vec3(1.0) - 2.0 * (vec3(1.0) - a) * (vec3(1.0) - b),
        step(vec3(0.5), a)
      ), w);
    }

    vec3 soft_light(vec3 a, vec3 b, float w) {
      return mix(a, pow(a, pow(vec3(2.0), 2.0 * (vec3(0.5) - b))), w);
    }

    void main() {
      vec2 ps = vec2(1.0) / resolution.xy;
      vec2 uv = vUv;
      vec4 color = texture2D(tDiffuse, uv);
      #if SRGB
      color = pow(color, vec4(2.2));
      #endif
      
      float t = time * float(SPEED);
      float seed = dot(uv, vec2(12.9898, 78.233));
      float noise = fract(sin(seed) * 43758.5453 + t);
      noise = gaussian(noise, float(MEAN), float(VARIANCE) * float(VARIANCE));
      
      #if SHOW_NOISE
      color = vec4(noise);
      #else    
      // Use the intensity uniform instead of mouse
      float w = intensity;
      
      vec3 grain = vec3(noise) * (1.0 - color.rgb);
      
      #if BLEND_MODE == 0
      color.rgb += grain * w;
      #elif BLEND_MODE == 1
      color.rgb = screen(color.rgb, grain, w);
      #elif BLEND_MODE == 2
      color.rgb = overlay(color.rgb, grain, w);
      #elif BLEND_MODE == 3
      color.rgb = soft_light(color.rgb, grain, w);
      #elif BLEND_MODE == 4
      color.rgb = max(color.rgb, grain * w);
      #endif
          
      #if SRGB
      color = pow(color, vec4(1.0 / 2.2));
      #endif
      #endif
      
      gl_FragColor = color;
    }
  `
};

// Create a single renderer for both scenes
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Create main scene for supernova
const scene = new THREE.Scene();

// Orthographic camera for true full screen rendering
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.z = 1;

// Create a full-screen quad for the supernova shader
const supernovaQuad = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  new THREE.ShaderMaterial({
    uniforms: supernovaShader.uniforms,
    vertexShader: supernovaShader.vertexShader,
    fragmentShader: supernovaShader.fragmentShader,
    transparent: false,
    depthWrite: false
  })
);
scene.add(supernovaQuad);

// Post-processing setup
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Add bloom for extra glow
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  settings.bloomStrength,
  settings.bloomRadius,
  settings.bloomThreshold
);
composer.addPass(bloomPass);

// Add film grain as the final pass
const filmGrainPass = new ShaderPass(filmGrainShader);
composer.addPass(filmGrainPass);

// Apply theme function - improved to respect current bloom settings
function applyTheme(themeName) {
  if (!colorThemes[themeName]) return;

  const theme = colorThemes[themeName];

  // Store current bloom value before applying theme
  const currentBloomStrength = bloomPass.strength;

  // Update settings
  settings.tintColor = theme.tintColor;
  settings.tintStrength = theme.tintStrength;

  // Don't update bloom strength from theme
  // settings.bloomStrength = theme.bloomStrength; <- Removed to preserve user settings

  // Update shader uniforms
  supernovaShader.uniforms.tintColor.value.set(
    theme.tintColor[0] / 255,
    theme.tintColor[1] / 255,
    theme.tintColor[2] / 255
  );
  supernovaShader.uniforms.tintStrength.value = theme.tintStrength;

  // Update new color uniforms
  supernovaShader.uniforms.baseColor.value.set(
    theme.baseColor[0],
    theme.baseColor[1],
    theme.baseColor[2]
  );

  supernovaShader.uniforms.accentColor.value.set(
    theme.accentColor[0],
    theme.accentColor[1],
    theme.accentColor[2]
  );

  supernovaShader.uniforms.edgeColor.value.set(
    theme.edgeColor[0],
    theme.edgeColor[1],
    theme.edgeColor[2]
  );

  supernovaShader.uniforms.glowColor.value.set(
    theme.glowColor[0],
    theme.glowColor[1],
    theme.glowColor[2]
  );

  // Keep the current bloom strength instead of using theme's default
  // bloomPass.strength = theme.bloomStrength; <- Replace with:
  bloomPass.strength = currentBloomStrength;

  // Update current theme
  settings.currentTheme = themeName;

  // Update GUI controllers
  for (let i = 0; i < gui.__controllers.length; i++) {
    gui.__controllers[i].updateDisplay();
  }
}

// Setup dat.gui
const gui = new GUI();
gui.width = 300;

// Supernova folder
const supernovaFolder = gui.addFolder("Supernova Settings");
supernovaFolder
  .add(settings, "zoom", 0.5, settings.maxZoom)
  .onChange((value) => {
    supernovaShader.uniforms.zoom.value = value;
    currentValues.zoom = value;
    targetValues.zoom = value;
    // Reset zoom history when manually changing zoom
    currentValues.zoomHistory = Array(currentValues.zoomHistory.length).fill(
      value
    );
  });
supernovaFolder.add(settings, "autoRotation").name("Auto Rotation"); // Add auto rotation toggle
supernovaFolder
  .add(settings, "rotationSpeed", 0.01, 0.5)
  .name("Rotation Speed");
supernovaFolder.add(settings, "dithering").onChange((value) => {
  supernovaShader.uniforms.dithering.value = value;
});
supernovaFolder.add(settings, "background").onChange((value) => {
  supernovaShader.uniforms.background.value = value;
});
supernovaFolder.add(settings, "toneMapping").onChange((value) => {
  supernovaShader.uniforms.toneMapping.value = value;
});
supernovaFolder.open();

// Mouse interaction folder
const mouseFolder = gui.addFolder("Mouse Interaction");
mouseFolder
  .add(settings, "mouseInteractionEnabled")
  .name("Enable Mouse Effect");
mouseFolder
  .add(settings, "mouseInteractionStrength", 0.05, 0.5)
  .name("Rotation Strength");
mouseFolder.add(settings, "zoomWithMouse").name("Zoom With Mouse");
mouseFolder.add(settings, "zoomStrength", 0.05, 0.5).name("Zoom Strength");
mouseFolder.add(settings, "zoomSmoothness", 0.01, 0.1).name("Zoom Smoothness");
mouseFolder.add(settings, "zoomStability", 0.1, 1.0).name("Zoom Stability");
mouseFolder.add(settings, "easingSpeed", 0.01, 0.2).name("Easing Speed");
mouseFolder.open();

// Color settings folder
const colorFolder = gui.addFolder("Color Settings");
colorFolder
  .add(settings, "currentTheme", {
    "Amber Glow": "amber", // Keep amber first as the main theme
    "Celestial Light": "celestial", // New bright/white theme
    "Abyssal Depths": "abyss", // New dark/moody theme
    "Cosmic Purple": "cosmic",
    "Azure Nebula": "azure",
    "Emerald Dust": "emerald",
    "Crimson Nova": "crimson",
    "Twilight Gradient": "twilight",
    "Sunset Gradient": "sunset",
    "Oceanic Gradient": "oceanic"
  })
  .name("Theme")
  .onChange(applyTheme);
colorFolder.addColor(settings, "tintColor").onChange((value) => {
  supernovaShader.uniforms.tintColor.value.set(
    value[0] / 255,
    value[1] / 255,
    value[2] / 255
  );
});
colorFolder.add(settings, "tintStrength", 0, 1).onChange((value) => {
  supernovaShader.uniforms.tintStrength.value = value;
});
colorFolder.add(settings, "grainStrength", 0, 1).onChange((value) => {
  supernovaShader.uniforms.grainStrength.value = value;
  filmGrainPass.uniforms.intensity.value = value;
});
colorFolder.open();

// Post-processing folder
const postFolder = gui.addFolder("Post Processing");
postFolder.add(settings, "bloomStrength", 0, 3).onChange((value) => {
  bloomPass.strength = value;
});
postFolder.add(settings, "bloomRadius", 0, 1).onChange((value) => {
  bloomPass.radius = value;
});
postFolder.add(settings, "bloomThreshold", 0, 1).onChange((value) => {
  bloomPass.threshold = value;
});
postFolder.open();

// Apply the default theme (amber)
applyTheme("amber");

// Animation
let time = 0;
function animate() {
  // Begin stats measurement
  stats.begin();

  requestAnimationFrame(animate);

  time += 0.01;

  // Calculate mouse-based rotation and zoom
  if (settings.mouseInteractionEnabled) {
    if (isMouseInCanvas) {
      // When mouse is in canvas, calculate dynamic rotation based on mouse position
      const angle = Math.atan2(mouse.y, mouse.x);
      const distance = mouseDistance;

      // Set target rotation angle based on mouse position and auto rotation setting
      if (settings.autoRotation) {
        targetValues.rotationAngle =
          angle * distance * Math.PI * settings.mouseInteractionStrength +
          time * settings.rotationSpeed;
      } else {
        targetValues.rotationAngle =
          angle * distance * Math.PI * settings.mouseInteractionStrength;
      }

      // Set target zoom based on mouse distance from center if enabled
      if (settings.zoomWithMouse) {
        // Apply non-linear zoom curve for more stability at high zoom levels
        // Mouse in center = default zoom, mouse at edges = more zoom
        // Use a curve that's less sensitive at higher zoom levels
        const zoomCurve = Math.pow(distance, 1.5); // Non-linear curve for smoother zoom
        const zoomFactor =
          1.0 + zoomCurve * settings.zoomStrength * settings.maxZoom;

        // Limit zoom change rate based on current zoom level
        targetValues.zoom = settings.zoom * zoomFactor;
      } else {
        targetValues.zoom = settings.zoom;
      }
    } else {
      // When mouse leaves canvas, just use time-based rotation if auto rotation is enabled
      if (settings.autoRotation) {
        targetValues.rotationAngle = time * settings.rotationSpeed;
      }
      targetValues.zoom = settings.zoom;
    }

    // Apply easing to rotation
    currentValues.rotationAngle = lerp(
      currentValues.rotationAngle,
      targetValues.rotationAngle,
      settings.easingSpeed
    );

    // Apply special easing to zoom that's more stable at high zoom levels
    const newZoom = easeZoom(
      currentValues.zoom,
      targetValues.zoom,
      settings.zoomSmoothness,
      settings.zoomStability
    );

    // Update zoom history for additional smoothing
    updateZoomHistory(newZoom);

    // Get smoothed zoom from history
    currentValues.zoom = getSmoothedZoom();
  } else {
    // If mouse interaction is disabled, just use time-based rotation if auto rotation is enabled
    if (settings.autoRotation) {
      currentValues.rotationAngle = time * settings.rotationSpeed;
    }
    currentValues.zoom = settings.zoom;
  }

  // Update shader uniforms
  supernovaShader.uniforms.iTime.value = time;
  supernovaShader.uniforms.iMouse.value.x =
    (mouse.x * window.innerWidth) / 2 + window.innerWidth / 2;
  supernovaShader.uniforms.iMouse.value.y =
    (-mouse.y * window.innerHeight) / 2 + window.innerHeight / 2;
  supernovaShader.uniforms.rotationAngle.value = currentValues.rotationAngle;
  supernovaShader.uniforms.zoom.value = currentValues.zoom;

  // Update film grain
  filmGrainPass.uniforms.time.value = time;

  // Render with post-processing
  composer.render();

  // End stats measurement
  stats.end();
}

animate();

// Handle window resize
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Update renderer
  renderer.setSize(width, height);
  composer.setSize(width, height);

  // Update the resolution uniforms
  supernovaShader.uniforms.iResolution.value.set(width, height);
  filmGrainPass.uniforms.resolution.value.set(width, height);
});