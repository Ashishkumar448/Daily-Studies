import * as THREE from "https://esm.sh/three@0.175.0";

// Scene setup
let scene, camera, renderer;
let shaderMaterial,
  time = 0;
let frameCount = 0;
let lastTime = performance.now();
let fpsElement;

// Audio variables
let audioContext, analyser, dataArray;
let audioElement;
let lowFreq = 0,
  midFreq = 0,
  highFreq = 0;
let prevBassFreq = 0;
let playing = false;
let audioSource;

// Animation state
const animState = {
  targetZoom: 1.0,
  currentZoom: 1.0,
  targetPop: 0.0,
  currentPop: 0.0,
  easeSpeed: 0.05
};

// Mouse position
const mouse = {
  x: 0.5,
  y: 0.5,
  centerDistance: 0
};

// Shader parameters
const params = {
  // Light color
  lightColor: [0, 0, 107],

  // Camera settings
  cameraRotationSpeed: 0.024,
  cameraRotationRange: 0.24,
  cameraFixedPosition: false,
  sceneDistance: 7.0,

  // Light source settings
  lightSourceVisible: false,
  lightSourceIntensity: 1.8,
  lightSourceX: 2.9,
  lightSourceY: 1.5,
  lightSourceZ: -1,

  // Scene rotation settings
  sceneRotationX: 1.53,
  sceneRotationY: 3.14,
  sceneRotationZ: 0.91,

  // Film grain settings
  grainAmount: 0.12,
  grainSize: 4.1,
  grainShadowBoost: 0.54,

  // Anamorphic lens flare settings
  anamorphicFlare: true,
  flareIntensity: 0.49,
  flareWidth: 2,
  flareColor: [4, 4, 160],
  flareThreshold: 0.28,
  flareSmoothing: 1,
  flareStreakIntensity: 1,

  // Mouse reactivity
  mouseReactivity: 0.5,

  // Sphere movement settings
  sphereMovementAmount: 0.3
};

// Store default flare settings
const defaultSettings = {
  flareIntensity: params.flareIntensity,
  flareWidth: params.flareWidth,
  flareThreshold: params.flareThreshold,
  flareSmoothing: params.flareSmoothing,
  flareStreakIntensity: params.flareStreakIntensity
};

// Transition state for smooth fade-out
const transition = {
  active: false,
  startTime: 0,
  duration: 2000, // 2 seconds fade-out
  startValues: {
    lowFreq: 0,
    midFreq: 0,
    highFreq: 0,
    flareIntensity: 0,
    flareWidth: 0,
    flareThreshold: 0,
    flareSmoothing: 0,
    flareStreakIntensity: 0
  }
};

// Vertex shader source
const vertexShaderSource = `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment shader source
const fragmentShaderSource = `
  precision highp float;
  
  uniform vec2 iResolution;
  uniform float iTime;
  uniform vec2 iMouse;
  uniform float lowFreq;
  uniform float midFreq;
  uniform float highFreq;
  uniform float mouseDistance;
  uniform float mouseReactivity;
  uniform vec3 mouseWorldPos; // Add this new uniform
  
  varying vec2 vUv;
  
  // Camera settings
  uniform float cameraRotationSpeed;
  uniform float cameraRotationRange;
  uniform bool cameraFixedPosition;
  uniform float sceneDistance;
  
  // Light source settings
  uniform bool lightSourceVisible;
  uniform float lightSourceIntensity;
  uniform vec3 lightSourcePosition;
  
  // Scene rotation settings
  uniform vec3 sceneRotation;
  
  // Light color
  uniform vec3 lightColor;
  
  // Film grain settings
  uniform float grainAmount;
  uniform float grainSize;
  uniform float grainShadowBoost;
  
  // Animation state
  uniform float currentZoom;
  uniform float currentPop;
  
  // Anamorphic lens flare
  uniform bool anamorphicFlare;
  uniform float flareIntensity;
  uniform float flareWidth;
  uniform vec3 flareColor;
  uniform float flareThreshold;
  uniform float flareSmoothing;
  uniform float flareStreakIntensity;
  
  // Sphere movement settings
  uniform float sphereMovementAmount;
  
  // Background colors
  vec3 bgColorDown = vec3(0.2, 0.1, 0.1);
  vec3 bgColorUp = vec3(0.1, 0.1, 0.2);
  
  // Point colors
  vec3 P1ColorIn = vec3(1.0, 0.5, 0.0);
  vec3 P1ColorOut = vec3(1.0, 0.0, 0.0);
  
  vec3 P2ColorIn = vec3(0.0, 0.5, 1.0);
  vec3 P2ColorOut = vec3(0.0, 0.0, 1.0);
  
  // Optimized film grain noise function
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  
  float hash(float n) {
    return fract(sin(n) * 43758.5453);
  }
  
  // Optimized rotation matrix for scene rotation
  mat3 rotationMatrix(vec3 rotation) {
    vec3 c = cos(rotation);
    vec3 s = sin(rotation);
    
    // Combined rotation matrix - optimized calculation
    mat3 rotMat;
    rotMat[0] = vec3(c.y*c.z, c.y*s.z, -s.y);
    rotMat[1] = vec3(s.x*s.y*c.z-c.x*s.z, s.x*s.y*s.z+c.x*c.z, s.x*c.y);
    rotMat[2] = vec3(c.x*s.y*c.z+s.x*s.z, c.x*s.y*s.z-s.x*c.z, c.x*c.y);
    return rotMat;
  }
  
  // Optimized sphere intersection function
  float asphere(in vec3 ro, in vec3 rd, in vec3 sp, in float sr) { 
    vec3 oc = ro - sp;
    float b = dot(oc, rd);
    float c = dot(oc, oc) - sr*sr;
    float h = b*b - c;
    if(h < 0.0) return 1000.0;
    return -b - sqrt(h);
  }
  
  // Sphere data structure
  struct Sphere {
    vec3 position;
    float radius;
    float glowIntensity;
    float glowRadius;
    bool isLightSource;
  };
  
  // Get all spheres in the scene - optimized to reduce calculations
  void getSpheres(out Sphere spheres[6]) {
    // Enhanced scaling based on music - more reactive but with reduced movement
    float musicScale1 = 1.5 * (1.0 + 0.35 * lowFreq);
    float musicScale2 = 1.0 * (1.0 + 0.35 * midFreq);
    float musicScale3 = 1.0 * (1.0 + 0.35 * highFreq);
    
    // Add "pop" effect when music starts - enhanced
    float popScale = 1.0 + 0.25 * currentPop;
    
    // Add more subtle movement to spheres based on music
    float timeScale = iTime * 0.3; // Slower time scale for smoother movement
    
    // Use smoother sine waves with different phases to prevent synchronization
    float lowFreqMovement = sin(timeScale + 0.5) * lowFreq * sphereMovementAmount * 0.4;
    float midFreqMovement = cos(timeScale * 0.7 + 1.3) * midFreq * sphereMovementAmount * 0.3;
    float highFreqMovement = sin(timeScale * 0.5 + 2.1) * highFreq * sphereMovementAmount * 0.2;
    
    // Define spheres with position, radius, glow intensity, and glow radius
    vec3 pos0 = vec3(0.0 + sin(timeScale * 0.4) * lowFreqMovement * 0.3, 
                     0.0 + cos(timeScale * 0.5) * midFreqMovement * 0.3, 
                     0.0 + sin(timeScale * 0.6) * highFreqMovement * 0.3);
    
    vec3 pos1 = vec3(-2.1 + cos(timeScale * 0.3 + 0.7) * lowFreqMovement * 0.4, 
                     0.6 + sin(timeScale * 0.4 + 1.2) * midFreqMovement * 0.4, 
                     0.3 + cos(timeScale * 0.5 + 0.9) * highFreqMovement * 0.2);
    
    vec3 pos2 = vec3(0.4 + sin(timeScale * 0.35 + 1.5) * midFreqMovement * 0.3, 
                     -1.8 + cos(timeScale * 0.45 + 0.8) * lowFreqMovement * 0.3, 
                     0.2 + sin(timeScale * 0.55 + 2.0) * highFreqMovement * 0.2);
    
    vec3 pos3 = vec3(1.0 + cos(timeScale * 0.25 + 0.3) * highFreqMovement * 0.3, 
                     1.0 + sin(timeScale * 0.35 + 1.7) * lowFreqMovement * 0.3, 
                     1.2 + cos(timeScale * 0.45 + 1.1) * midFreqMovement * 0.3);
    
    vec3 pos4 = vec3(0.3 + sin(timeScale * 0.3 + 2.2) * midFreqMovement * 0.2, 
                     0.1 + cos(timeScale * 0.4 + 0.5) * highFreqMovement * 0.2, 
                     -2.3 + sin(timeScale * 0.5 + 1.3) * lowFreqMovement * 0.2);
    
    // Calculate proximity effect for each sphere
    float proxEffect0 = 1.0 + 0.5 * smoothstep(5.0, 0.5, length(mouseWorldPos - pos0));
    float proxEffect1 = 1.0 + 0.5 * smoothstep(5.0, 0.5, length(mouseWorldPos - pos1));
    float proxEffect2 = 1.0 + 0.5 * smoothstep(5.0, 0.5, length(mouseWorldPos - pos2));
    float proxEffect3 = 1.0 + 0.5 * smoothstep(5.0, 0.5, length(mouseWorldPos - pos3));
    float proxEffect4 = 1.0 + 0.5 * smoothstep(5.0, 0.5, length(mouseWorldPos - pos4));
    
    spheres[0] = Sphere(
      pos0,
      musicScale1 * popScale,
      (0.6 + 0.6 * lowFreq + 0.3 * currentPop) * proxEffect0,
      (3.0 + 1.5 * lowFreq + 1.5 * currentPop) * proxEffect0,
      false
    );
    
    spheres[1] = Sphere(
      pos1,
      musicScale2 * popScale,
      (0.5 + 0.5 * midFreq + 0.3 * currentPop) * proxEffect1,
      (2.5 + 1.2 * midFreq + 1.5 * currentPop) * proxEffect1,
      false
    );
    
    spheres[2] = Sphere(
      pos2,
      musicScale2 * popScale,
      (0.5 + 0.5 * midFreq + 0.3 * currentPop) * proxEffect2,
      (2.5 + 1.2 * midFreq + 1.5 * currentPop) * proxEffect2,
      false
    );
    
    spheres[3] = Sphere(
      pos3,
      musicScale3 * popScale,
      (0.5 + 0.6 * highFreq + 0.3 * currentPop) * proxEffect3,
      (2.8 + 1.3 * highFreq + 1.5 * currentPop) * proxEffect3,
      false
    );
    
    spheres[4] = Sphere(
      pos4,
      musicScale2 * popScale,
      (0.5 + 0.5 * midFreq + 0.3 * currentPop) * proxEffect4,
      (2.5 + 1.2 * midFreq + 1.5 * currentPop) * proxEffect4,
      false
    );
    
    // Add dedicated light source sphere - more reactive to music
    vec3 lightPos = lightSourcePosition + vec3(
      cos(timeScale * 0.2 + 0.9) * lowFreqMovement * 0.2,
      sin(timeScale * 0.3 + 1.8) * midFreqMovement * 0.2,
      cos(timeScale * 0.4 + 0.6) * highFreqMovement * 0.2
    );
    
    float proxEffectLight = 1.0 + 0.5 * smoothstep(5.0, 0.5, length(mouseWorldPos - lightPos));
    
    spheres[5] = Sphere(
      lightPos,
      lightSourceVisible ? 0.5 : 0.01, // Very small if not visible
      lightSourceIntensity * (1.0 + 0.8 * lowFreq + 0.5 * currentPop) * proxEffectLight,
      (5.0 + 3.0 * lowFreq + 3.0 * currentPop) * proxEffectLight,
      true
    );
  }
  
  // Calculate distance to nearest sphere and get its glow contribution
  float calculateGlow(in vec3 p, out float glowAmount, out bool isLight) {
    Sphere spheres[6];
    getSpheres(spheres);
    
    float minDist = 1000.0;
    glowAmount = 0.0;
    isLight = false;
    
    // Check each sphere
    for (int i = 0; i < 6; i++) {
      float dist = length(p - spheres[i].position) - spheres[i].radius;
      
      // Calculate glow based on distance from sphere surface
      if (dist < spheres[i].glowRadius) {
        // Smooth falloff for glow
        float glowFactor = 1.0 - smoothstep(0.0, spheres[i].glowRadius, dist);
        
        // Apply quadratic falloff for more natural light attenuation
        glowFactor = glowFactor * glowFactor;
        
        // Scale by sphere's glow intensity
        glowFactor *= spheres[i].glowIntensity;
        
        // Accumulate glow (stronger when closer to multiple spheres)
        if (spheres[i].isLightSource && glowFactor > glowAmount) {
          isLight = true;
        }
        
        glowAmount = max(glowAmount, glowFactor);
      }
      
      // Track closest sphere for actual intersection
      minDist = min(minDist, dist);
    }
    
    return minDist;
  }
  
  // Find closest sphere intersection
  float map(in vec3 ro, in vec3 rd, out bool hitLight) { 
    Sphere spheres[6];
    getSpheres(spheres);
    
    float minDist = 1000.0;
    hitLight = false;
    
    for (int i = 0; i < 6; i++) {
      float dist = asphere(ro, rd, spheres[i].position, spheres[i].radius);
      
      if (dist > 0.0 && dist < minDist) {
        minDist = dist;
        hitLight = spheres[i].isLightSource;
      }
    }
    
    return minDist;
  }
  
  // Enhanced anamorphic lens flare effect with mouse position reactivity
  vec3 addAnamorphicFlare(vec3 color, vec2 uv) {
    if (!anamorphicFlare) return color;
    
    // Center point for the flare
    vec2 flareCenter = vec2(0.5, 0.5);
    
    // Calculate distance from center (stretched horizontally for anamorphic look)
    vec2 delta = uv - flareCenter;
    
    // Calculate mouse distance factor (1.0 at center, 0.0 at edges)
    // This will make the flare larger when mouse is closer to center
    float mouseDistanceFactor = 1.0 - mouseDistance * mouseReactivity;
    
    // Make flare width react to music and mouse position
    float dynamicFlareWidth = flareWidth * (1.0 + lowFreq * 0.5 + midFreq * 0.3) * (0.5 + mouseDistanceFactor);
    
    float distX = abs(delta.x) / dynamicFlareWidth;
    float distY = abs(delta.y) * 2.0;
    float dist = max(distX, distY);
    
    // Create the flare with smooth falloff using threshold and smoothing parameters
    // Make threshold react to music and mouse position
    float dynamicThreshold = flareThreshold * (1.0 + lowFreq * 0.3) * (0.8 + mouseDistanceFactor * 0.4);
    float dynamicSmoothing = flareSmoothing * (1.0 + midFreq * 0.2);
    
    float flare = smoothstep(dynamicThreshold, dynamicThreshold - dynamicSmoothing, dist);
    
    // Add some variation based on time, audio, and mouse position
    flare *= 0.8 + 0.3 * sin(iTime * 0.5 + lowFreq * 3.0);
    flare *= 1.0 + 0.8 * lowFreq + 0.5 * currentPop + 0.3 * mouseDistanceFactor;
    
    // Add some horizontal streaks with controllable intensity
    float streaks = smoothstep(0.95, 0.0, abs(delta.y) * 20.0) * smoothstep(0.6, 0.0, abs(delta.x));
    streaks *= flareStreakIntensity + 0.3 * sin(iTime * 0.2 + delta.x * 10.0 + lowFreq * 5.0);
    
    // Make streaks react to music and mouse position
    streaks *= 1.0 + midFreq * 0.7 + mouseDistanceFactor * 0.5;
    
    // Combine flare and streaks
    float finalFlare = (flare + streaks) * flareIntensity * (1.0 + lowFreq * 0.5) * (0.7 + mouseDistanceFactor * 0.6);
    
    // Add the flare to the scene with the specified color
    vec3 flareColorRGB = flareColor / 255.0;
    
    // Make flare color slightly shift with music and mouse position
    flareColorRGB += vec3(0.1, 0.1, 0.3) * lowFreq + vec3(0.05, 0.0, 0.2) * mouseDistanceFactor;
    
    return color + finalFlare * flareColorRGB;
  }
  
  vec3 ascene(in vec3 ro, in vec3 rd, in vec2 uv) {
    vec3 col = vec3(0);
    
    // Now do the regular scene rendering
    bool hitLight;
    float t = map(ro, rd, hitLight);
    
    if (t == 1000.0) {
      // Background - very dark
      col += vec3(0.02);
      
      // Add subtle god rays - enhanced with music reactivity
      vec2 uvRay = rd.xy;
      uvRay = uvRay * 2.0 - 1.0;
      vec2 rayOrigin = vec2(0.2, 0.3);
      float rayIntensity = 0.02 + 0.05 * midFreq; // Enhanced intensity
      
      float rays = 0.0;
      float rayCount = 5.0;
      for(float i = 0.0; i < rayCount; i++) {
        float angle = i * (6.28 / rayCount) + iTime * 0.02 + lowFreq * 0.5; // Make rays rotate with music
        vec2 rayDir = vec2(cos(angle), sin(angle));
        float dist = abs(dot(uvRay - rayOrigin, vec2(-rayDir.y, rayDir.x)));
        rays += smoothstep(0.08, 0.0, dist) * rayIntensity * (0.5 + 0.5 * sin(iTime * 0.2 + i + lowFreq * 3.0));
      }
      
      col += rays * vec3(0.2, 0.2, 0.3) * (1.0 + lowFreq * 0.5); // Enhanced music reactivity
      
      // Calculate position in world space for this ray
      // We use a reasonable distance for background points
      vec3 worldPos = ro + rd * 10.0;
      
      // Check for glow from nearby spheres
      float glowAmount;
      bool isLightGlow;
      calculateGlow(worldPos, glowAmount, isLightGlow);
      
      // Apply soft glow with proper falloff - enhanced with music
      vec3 glowColor = lightColor / 255.0; // Use the uniform light color
      col += glowAmount * glowColor * (0.15 + 0.1 * lowFreq); // Enhanced music reactivity
    }
    else {
      // We hit a sphere
      vec3 loc = t * rd + ro;
      
      if (hitLight && !lightSourceVisible) {
        // If we hit the invisible light source, treat it as background
        col += vec3(0.02);
      } else {
        // Base sphere color - grayscale with position-based shading
        float intensity = 0.4 + 0.4 * dot(normalize(loc), vec3(1.0));
        
        // Add subtle texture to spheres - enhanced with music
        intensity += 0.05 * hash(loc.xy + loc.yz + iTime * 0.1 + lowFreq * 2.0);
        
        // Adjust intensity for light source - more reactive to music
        if (hitLight) {
          intensity = 0.8 + 0.3 * sin(iTime * 2.0 + lowFreq * 8.0);
        }
        
        col += vec3(intensity);
        
        // Calculate glow amount at this position
        float glowAmount;
        bool isLightGlow;
        calculateGlow(loc, glowAmount, isLightGlow);
        
        // Add glow to sphere surface - enhanced with music
        vec3 glowColor = lightColor / 255.0; // Use the uniform light color
        col += glowAmount * glowColor * (0.2 + 0.15 * lowFreq); // Enhanced music reactivity
      }
    }
    
    return col;
  }
  
  void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Create rotation matrix for scene
    
    // Camera position calculation
    vec3 cameraPos;
    
    // Calculate mouse influence - stronger when music is not playing
    float musicIntensity = lowFreq + midFreq + highFreq;
    float mouseInfluence = 1.0 - min(1.0, musicIntensity * 2.0); // More mouse influence when music is quiet
    
    // Convert mouse position to rotation angles
    float mouseRotX = (iMouse.y / iResolution.y - 0.5) * 0.5 * mouseInfluence;
    float mouseRotY = (iMouse.x / iResolution.x - 0.5) * 0.8 * mouseInfluence;
    
    if (cameraFixedPosition) {
      // Fixed camera position that matches the screenshot
      // This is a specific angle that shows the light source behind spheres
      // Added more subtle movement based on music and mouse
      cameraPos = vec3(
        -5.0 + 0.1 * sin(lowFreq * 2.0) + mouseRotY * 2.0,
        3.0 + 0.1 * sin(midFreq * 2.0) + mouseRotX * 2.0,
        5.0 + 0.1 * sin(highFreq * 2.0)
      );
    } else {
      // Limited rotation camera that stays within a good viewing angle
      float baseAngle = 0.7; // Base angle for good composition
      float limitedT = baseAngle + sin(iTime) * cameraRotationRange; // Limited rotation
      
      // Enhanced camera movement with music and mouse
      cameraPos = sceneDistance * vec3(
        sin(limitedT * 0.7) + 0.1 * sin(lowFreq * 2.0) + mouseRotY * 3.0,
        cos(limitedT * 0.5) + 0.1 * sin(midFreq * 2.0) + mouseRotX * 2.0,
        cos(limitedT * 0.6) + 0.1 * sin(highFreq * 2.0)
      );
    }

    // Add mouse-based rotation to scene rotation
    vec3 mouseSceneRot = sceneRotation + vec3(
        mouseRotX * 0.3, 
        mouseRotY * 0.3, 
        (mouseRotX + mouseRotY) * 0.1
    );
    mat3 rotMat = rotationMatrix(mouseSceneRot);
    
    // Apply scene rotation to camera position
    cameraPos = rotMat * cameraPos;
    
    // Apply zoom effect based on animation state - enhanced
    cameraPos /= currentZoom;
    
    // Subtle zoom on bass - enhanced
    float zoom = 1.0 - 0.05 * lowFreq; // Increased from 0.03 to 0.05
    cameraPos *= zoom;
    
    vec3 cameraDir = -cameraPos;
    cameraDir = normalize(cameraDir);
    
    vec3 Z = vec3(0.0, 0.0, 1.0);
    vec3 cameraX = cross(cameraDir, Z);
    cameraX = normalize(cameraX);
    
    vec3 cameraY = cross(cameraX, cameraDir);
    cameraY = normalize(cameraY);
    
    vec3 colorTotal = vec3(0.0, 0.0, 0.0);
    float colorCount = 0.0;
    
    // Add the missing lens and sensor variables before the DOF calculation:
    // Add these before the DOF loop (around line 520)
    vec2 sensorLoc = fragCoord.xy / iResolution.x;
    sensorLoc = vec2(0.5, 0.5*(iResolution.y/iResolution.x)) - sensorLoc;
    float lensDis = 0.67 * (1.0 + midFreq * 0.15); // Enhanced music reactivity
    float lensSiz = 0.1 * (1.0 + lowFreq * 0.3); // Enhanced music reactivity
    float focalDis = 17.0 * (1.0 + midFreq * 0.15); // Enhanced music reactivity
    
    // Simplified DOF calculation for performance
    for (int lx = -1; lx <= 1; lx++) {
      for (int ly = -1; ly <= 1; ly++) {
        vec2 lensLoc = vec2(float(lx), float(ly)) * lensSiz * 0.5 / 3.0;
        
        if (length(lensLoc) < (lensSiz/2.0)) {
          vec3 lensRel = cameraX*(lensLoc.x) + cameraY*(lensLoc.y);
          vec3 lensPos = cameraPos + lensRel;
          vec3 rayDir1 = lensPos - (cameraPos - lensDis*cameraDir + cameraX*sensorLoc.x + cameraY*sensorLoc.y);
          float focal = 1.0 + lensDis/focalDis;
          vec3 rayDir2 = rayDir1 - focal*(lensRel);
          rayDir2 = normalize(rayDir2);
          vec2 uv = fragCoord.xy / iResolution.xy;
          vec3 color = ascene(lensPos, rayDir2, uv);
          colorTotal = colorTotal + color;
          colorCount += 1.0;
        }
      }
    }
    
    // Final color with subtle vignette
    vec3 finalColor = colorTotal/colorCount - length(sensorLoc)*0.15;
    
    // Add lens flares
    vec2 uv = fragCoord.xy / iResolution.xy;
    
    // Add anamorphic lens flare
    finalColor = addAnamorphicFlare(finalColor, uv);
    
    // Film grain effect with customizable parameters
    vec2 uvRandom = fragCoord.xy / 100.0;
    float noise = 0.0;
    
    // Base layer
    noise += 0.65 * (hash(uvRandom * grainSize + iTime * 0.01) * 2.0 - 1.0);
    
    // Medium detail layer
    noise += 0.25 * (hash(uvRandom * grainSize * 2.0 + vec2(iTime * 0.02, 0.0)) * 2.0 - 1.0);
    
    // Fine detail layer
    noise += 0.1 * (hash(uvRandom * grainSize * 5.0 + vec2(0.0, iTime * 0.03)) * 2.0 - 1.0);
    
    // Apply grain with brightness-based modulation (more visible in shadows)
    float grainMask = 1.0 - dot(finalColor, vec3(0.299, 0.587, 0.114)) * grainShadowBoost;
    finalColor += noise * grainAmount * grainMask;
    
    // Ensure values are in valid range
    finalColor = clamp(finalColor, 0.0, 1.0);
    
    fragColor = vec4(finalColor, 1.0);
  }
  
  void main() {
    vec2 fragCoord = vUv * iResolution;
    vec4 fragColor;
    mainImage(fragColor, fragCoord);
    gl_FragColor = fragColor;
  }
`;

// Initialize Three.js scene
function init() {
  // Get DOM elements
  const container = document.getElementById("container");
  fpsElement = document.getElementById("fps");

  // Create scene
  scene = new THREE.Scene();

  // Create camera
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  camera.position.z = 1;

  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // Create shader material
  shaderMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShaderSource,
    fragmentShader: fragmentShaderSource,
    uniforms: {
      iResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight)
      },
      iTime: { value: 0 },
      iMouse: { value: new THREE.Vector2(0.5, 0.5) },
      lowFreq: { value: 0 },
      midFreq: { value: 0 },
      highFreq: { value: 0 },
      mouseDistance: { value: 0 },
      mouseReactivity: { value: params.mouseReactivity },
      mouseWorldPos: { value: new THREE.Vector3(0, 0, 10) },

      // Camera settings
      cameraRotationSpeed: { value: params.cameraRotationSpeed },
      cameraRotationRange: { value: params.cameraRotationRange },
      cameraFixedPosition: { value: params.cameraFixedPosition },
      sceneDistance: { value: params.sceneDistance },

      // Light source settings
      lightSourceVisible: { value: params.lightSourceVisible },
      lightSourceIntensity: { value: params.lightSourceIntensity },
      lightSourcePosition: {
        value: new THREE.Vector3(
          params.lightSourceX,
          params.lightSourceY,
          params.lightSourceZ
        )
      },

      // Scene rotation settings
      sceneRotation: {
        value: new THREE.Vector3(
          params.sceneRotationX,
          params.sceneRotationY,
          params.sceneRotationZ
        )
      },

      // Light color
      lightColor: {
        value: new THREE.Vector3(
          params.lightColor[0],
          params.lightColor[1],
          params.lightColor[2]
        )
      },

      // Film grain settings
      grainAmount: { value: params.grainAmount },
      grainSize: { value: params.grainSize },
      grainShadowBoost: { value: params.grainShadowBoost },

      // Animation state
      currentZoom: { value: animState.currentZoom },
      currentPop: { value: animState.currentPop },

      // Anamorphic lens flare
      anamorphicFlare: { value: params.anamorphicFlare },
      flareIntensity: { value: params.flareIntensity },
      flareWidth: { value: params.flareWidth },
      flareColor: {
        value: new THREE.Vector3(
          params.flareColor[0],
          params.flareColor[1],
          params.flareColor[2]
        )
      },
      flareThreshold: { value: params.flareThreshold },
      flareSmoothing: { value: params.flareSmoothing },
      flareStreakIntensity: { value: params.flareStreakIntensity },

      // Sphere movement settings
      sphereMovementAmount: { value: params.sphereMovementAmount }
    }
  });

  // Create a plane geometry that fills the screen
  const geometry = new THREE.PlaneGeometry(2, 2);

  // Create mesh with shader material
  const mesh = new THREE.Mesh(geometry, shaderMaterial);
  scene.add(mesh);

  // Set up event listeners
  setupEventListeners();

  // Set up audio
  setupAudio();

  // Start animation loop
  animate();
}

// Set up event listeners
function setupEventListeners() {
  // Handle window resize
  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    shaderMaterial.uniforms.iResolution.value.set(
      window.innerWidth,
      window.innerHeight
    );
  });

  // Handle mouse movement
  let mouseMoveThrottled = false;
  const throttleTime = 16; // ~60fps

  window.addEventListener("mousemove", (event) => {
    if (!mouseMoveThrottled) {
      mouseMoveThrottled = true;
      setTimeout(() => {
        mouseMoveThrottled = false;
      }, throttleTime);

      // Update mouse position
      mouse.x = event.clientX / window.innerWidth;
      mouse.y = event.clientY / window.innerHeight;

      // Update shader uniform
      shaderMaterial.uniforms.iMouse.value.set(
        mouse.x * window.innerWidth,
        mouse.y * window.innerHeight
      );

      // Calculate distance from center (0-1 where 0 is center, 1 is corner)
      const dx = mouse.x - 0.5;
      const dy = mouse.y - 0.5;
      mouse.centerDistance = Math.min(1.0, Math.sqrt(dx * dx + dy * dy) * 2);
      shaderMaterial.uniforms.mouseDistance.value = mouse.centerDistance;

      // Calculate mouse position in 3D world space
      // Convert from screen coordinates to normalized device coordinates (-1 to 1)
      const ndcX = mouse.x * 2 - 1;
      const ndcY = -(mouse.y * 2) + 1; // Flip Y for 3D space

      // Set mouse world position (x, y in screen space, z at a fixed distance)
      // This is a simplified approach - we're projecting the mouse into the scene
      shaderMaterial.uniforms.mouseWorldPos.value.set(ndcX * 5, ndcY * 3, 3);
    }
  });

  // Handle play button
  document.getElementById("playButton").addEventListener("click", toggleAudio);
}

// Set up audio
function setupAudio() {
  audioElement = new Audio();
  audioElement.crossOrigin = "anonymous";
  audioElement.preload = "auto";
  audioElement.src = "https://assets.codepen.io/7558/lxstnght-mind-games.mp3";
  audioElement.loop = true;
}

// Toggle audio playback
function toggleAudio() {
  if (!playing) {
    // Initialize audio context if needed
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      dataArray = new Uint8Array(analyser.frequencyBinCount);

      // Connect audio element to analyzer
      audioSource = audioContext.createMediaElementSource(audioElement);
      audioSource.connect(analyser);
      analyser.connect(audioContext.destination);
    }

    // Resume audio context (needed for newer browsers)
    audioContext.resume().then(() => {
      // Play the track
      audioElement.play().catch((e) => {
        console.error("Error playing audio:", e);
      });
    });

    document.getElementById("playButton").textContent = "STOP";
    playing = true;

    // Cancel any active transition
    transition.active = false;

    // Set target zoom for "pop" effect when music starts
    animState.targetZoom = 1.15;
    animState.targetPop = 1.0;
  } else {
    // Stop playback
    audioElement.pause();
    document.getElementById("playButton").textContent = "PLAY";
    playing = false;

    // Set target zoom for easing back when music stops
    animState.targetZoom = 1.0;
    animState.targetPop = 0.0;

    // Start transition for smooth fade-out
    transition.active = true;
    transition.startTime = performance.now();

    // Store current values as starting points for the transition
    transition.startValues = {
      lowFreq: lowFreq,
      midFreq: midFreq,
      highFreq: highFreq,
      flareIntensity: params.flareIntensity,
      flareWidth: params.flareWidth,
      flareThreshold: params.flareThreshold,
      flareSmoothing: params.flareSmoothing,
      flareStreakIntensity: params.flareStreakIntensity
    };
  }
}

// Update audio frequency data
function updateFrequencies() {
  if (!playing || !analyser) return;

  analyser.getByteFrequencyData(dataArray);

  // Frequency band calculation
  const bassRange = dataArray.slice(1, 10);
  const lowMidRange = dataArray.slice(10, 20);
  const midRange = dataArray.slice(20, 40);
  const highMidRange = dataArray.slice(40, 60);
  const highRange = dataArray.slice(60, 100);

  // Calculate average for each range
  const bassFreq = getAverageVolume(bassRange) / 255;
  const lowMidFreq = getAverageVolume(lowMidRange) / 255;
  const midRangeAvg = getAverageVolume(midRange) / 255;
  const highMidFreq = getAverageVolume(highMidRange) / 255;
  const highRangeAvg = getAverageVolume(highRange) / 255;

  // Detect beats by comparing current vs previous bass
  const beatThreshold = 0.12;
  const isBeat = bassFreq > prevBassFreq + beatThreshold;

  // Amplify the effect of low frequencies for piano notes
  const pianoBoost = 1.8;

  // Smooth transitions with subtle emphasis and enhanced sensitivity
  lowFreq =
    lowFreq * 0.9 + (isBeat ? bassFreq * 1.5 : bassFreq * pianoBoost) * 0.1;
  midFreq = midFreq * 0.9 + ((lowMidFreq + midRangeAvg) / 2) * pianoBoost * 0.1;
  highFreq = highFreq * 0.9 + ((highMidFreq + highRangeAvg) / 2) * 0.1;

  // Update shader uniforms
  shaderMaterial.uniforms.lowFreq.value = lowFreq;
  shaderMaterial.uniforms.midFreq.value = midFreq;
  shaderMaterial.uniforms.highFreq.value = highFreq;

  // Store for next beat detection
  prevBassFreq = bassFreq;
}

// Calculate average volume
function getAverageVolume(array) {
  let sum = 0;
  for (let i = 0; i < array.length; i++) {
    sum += array[i];
  }
  return sum / array.length;
}

// Update transition values
function updateTransition() {
  if (!transition.active) return;

  const now = performance.now();
  const elapsed = now - transition.startTime;
  const progress = Math.min(elapsed / transition.duration, 1.0);
  const eased = easeOutCubic(progress);

  // Gradually reduce frequency values to zero
  lowFreq = transition.startValues.lowFreq * (1 - eased);
  midFreq = transition.startValues.midFreq * (1 - eased);
  highFreq = transition.startValues.highFreq * (1 - eased);

  // Update shader uniforms
  shaderMaterial.uniforms.lowFreq.value = lowFreq;
  shaderMaterial.uniforms.midFreq.value = midFreq;
  shaderMaterial.uniforms.highFreq.value = highFreq;

  // Gradually transition flare settings back to defaults
  params.flareIntensity =
    transition.startValues.flareIntensity * (1 - eased) +
    defaultSettings.flareIntensity * eased;
  params.flareWidth =
    transition.startValues.flareWidth * (1 - eased) +
    defaultSettings.flareWidth * eased;
  params.flareThreshold =
    transition.startValues.flareThreshold * (1 - eased) +
    defaultSettings.flareThreshold * eased;
  params.flareSmoothing =
    transition.startValues.flareSmoothing * (1 - eased) +
    defaultSettings.flareSmoothing * eased;
  params.flareStreakIntensity =
    transition.startValues.flareStreakIntensity * (1 - eased) +
    defaultSettings.flareStreakIntensity * eased;

  // Update shader uniforms for flare settings
  shaderMaterial.uniforms.flareIntensity.value = params.flareIntensity;
  shaderMaterial.uniforms.flareWidth.value = params.flareWidth;
  shaderMaterial.uniforms.flareThreshold.value = params.flareThreshold;
  shaderMaterial.uniforms.flareSmoothing.value = params.flareSmoothing;
  shaderMaterial.uniforms.flareStreakIntensity.value =
    params.flareStreakIntensity;

  // End transition when complete
  if (progress >= 1.0) {
    transition.active = false;
  }
}

// Easing function for smooth transitions
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Animation loop
function animate(timestamp) {
  requestAnimationFrame(animate);

  // Update time uniform
  time += 0.01;
  shaderMaterial.uniforms.iTime.value = time;

  // Update audio frequencies
  updateFrequencies();

  // Update transition if active
  if (transition.active) {
    updateTransition();
  }

  // Smooth animation transitions
  animState.currentZoom +=
    (animState.targetZoom - animState.currentZoom) * animState.easeSpeed;
  animState.currentPop +=
    (animState.targetPop - animState.currentPop) * animState.easeSpeed;

  // Update animation state uniforms
  shaderMaterial.uniforms.currentZoom.value = animState.currentZoom;
  shaderMaterial.uniforms.currentPop.value = animState.currentPop;

  // Render the scene
  renderer.render(scene, camera);

  // Calculate FPS
  frameCount++;
  const now = timestamp;
  if (now - lastTime >= 1000) {
    const fps = Math.round((frameCount * 1000) / (now - lastTime));
    fpsElement.textContent = `FPS: ${fps}`;
    frameCount = 0;
    lastTime = now;
  }
}

// Initialize when the page loads
window.onload = init;

// Custom cursor implementation with throttling for better performance
const cursor = document.querySelector(".custom-cursor");
let lastCursorUpdate = 0;

document.addEventListener("mousemove", (e) => {
  // Throttle cursor updates to every 16ms (approx 60fps)
  const now = performance.now();
  if (now - lastCursorUpdate > 16) {
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top = `${e.clientY}px`;
    lastCursorUpdate = now;
  }
});