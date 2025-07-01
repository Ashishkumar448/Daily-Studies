import * as THREE from "https://cdn.skypack.dev/three@0.149.0";
import { gsap } from "https://cdn.skypack.dev/gsap@3.12.5";
import { ScrollTrigger } from "https://cdn.skypack.dev/gsap@3.12.5/ScrollTrigger";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Wait for everything to load
window.addEventListener("load", () => {
  // Enhanced settings with optimized values
  const settings = {
    lineCount: 35,
    lineWidth: 0.02,
    lineSharpness: 25.0,
    rimEffect: 0.8,
    rimIntensity: 3.0,
    rimWidth: 0.6,
    offset: 0.0,
    sphereDetail: 96, // Reduced for better performance
    gap: 0.3,
    distortion: 0.0,
    twist: 0.0,
    useHighlights: true,
    highlightIntensity: 0.7,
    occlusion: 0.3,
    // New enhanced settings
    glowIntensity: 0.6,
    glowColor: new THREE.Color(0x3388ff),
    colorShift: 0.0,
    pulseSpeed: 0.5,
    lineColorA: new THREE.Color(0xffffff),
    lineColorB: new THREE.Color(0x88ccff)
  };

  // Improved noise and utility functions
  const helperFunctions = `
    // Classic hash function
    float hash(float n) { 
      return fract(sin(n) * 43758.5453123); 
    }
    
    float hash(vec3 p) {
      p = fract(p * 0.3183099 + .1);
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }
    
    // Improved smooth step with adjustable edge
    float smootherstep(float edge0, float edge1, float x, float smoothness) {
      x = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
      return pow(x, smoothness) * (smoothness + 1.0) - pow(x, smoothness + 1.0) * smoothness;
    }
    
    // Enhanced function to create extremely sharp contour lines
    float contour(float val, float width, float sharpness) {
      float contourVal = abs(fract(val) - 0.5);
      return pow(smoothstep(0.0, width, contourVal), sharpness);
    }
    
    // Improved Fresnel effect calculation
    float fresnel(vec3 normal, vec3 viewDir, float power) {
      return pow(1.0 - abs(dot(normal, viewDir)), power);
    }
    
    // Optimized noise function for distortion
    float noise(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      f = f*f*(3.0-2.0*f);
      
      float n = i.x + i.y*157.0 + 113.0*i.z;
      return mix(
        mix(mix(hash(n+0.0), hash(n+1.0), f.x),
            mix(hash(n+157.0), hash(n+158.0), f.x), f.y),
        mix(mix(hash(n+113.0), hash(n+114.0), f.x),
            mix(hash(n+270.0), hash(n+271.0), f.x), f.y), f.z);
    }
    
    // New: Improved FBM (Fractal Brownian Motion) for more detailed noise
    float fbm(vec3 p, int octaves) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      
      for (int i = 0; i < octaves; i++) {
        value += amplitude * noise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
        
        // Break early for performance if contribution is minimal
        if (amplitude < 0.01) break;
      }
      
      return value;
    }
    
    // New: Color mixing utility
    vec3 mixColor(vec3 colorA, vec3 colorB, float t) {
      return mix(colorA, colorB, t);
    }
  `;

  // Enhanced vertex shader with improved deformations
  const vertexShader = `
    ${helperFunctions}
    
    varying vec3 vNormal;
    varying vec3 vViewDir;
    varying vec3 vPosition;
    varying vec3 vOrigPosition;
    varying vec3 vWorldPosition;
    varying float vFresnel;
    varying float vElevation;
    varying float vDistortion;
    
    uniform float uRimEffect;
    uniform float uRimIntensity;
    uniform float uScrollProgress;
    uniform float uDistortion;
    uniform float uTwist;
    uniform float uTime;
    uniform float uPulseSpeed;
    
    // Improved function to twist a point around an axis
    vec3 twist(vec3 p, float strength) {
      float c = cos(strength * p.y);
      float s = sin(strength * p.y);
      mat2 m = mat2(c, -s, s, c);
      return vec3(m * p.xz, p.y).xzy;
    }
    
    // New: Pulse effect based on time
    float pulseEffect(float time, float speed) {
      return 0.5 * sin(time * speed) + 0.5;
    }
    
    void main() {
      vOrigPosition = position;
      
      // Apply progressive deformation based on scroll
      vec3 pos = position;
      
      // Time-based pulse for subtle animation
      float pulse = pulseEffect(uTime, uPulseSpeed);
      
      // Apply twist deformation with subtle time-based variation
      float twistAmount = uTwist * (1.0 + pulse * 0.1);
      pos = twist(pos, twistAmount);
      
      // Apply enhanced noise-based distortion
      float distortionAmount = uDistortion;
      float noiseValue = 0.0;
      
      if (distortionAmount > 0.0) {
        // Use FBM for more detailed distortion
        noiseValue = fbm(pos * 3.0 + vec3(0.0, uTime * 0.1, uScrollProgress * 10.0), 3) * 2.0 - 1.0;
        pos += normal * noiseValue * distortionAmount;
        vDistortion = noiseValue * distortionAmount; // Pass distortion to fragment shader
      } else {
        vDistortion = 0.0;
      }
      
      // Calculate normal in view space (based on deformed position)
      vec3 transformedNormal = normalize(normal);
      if (distortionAmount > 0.0 || twistAmount > 0.0) {
        // Approximate new normal by calculating partial derivatives
        float delta = 0.01;
        vec3 tangent = normalize(cross(normal, vec3(0.0, 1.0, 0.0)));
        vec3 bitangent = normalize(cross(normal, tangent));
        
        vec3 posP1 = position + tangent * delta;
        vec3 posP2 = position + bitangent * delta;
        
        // Apply same deformations to neighboring points
        if (twistAmount > 0.0) {
          posP1 = twist(posP1, twistAmount);
          posP2 = twist(posP2, twistAmount);
        }
        
        if (distortionAmount > 0.0) {
          float n1 = fbm(posP1 * 3.0 + vec3(0.0, uTime * 0.1, uScrollProgress * 10.0), 2) * 2.0 - 1.0;
          float n2 = fbm(posP2 * 3.0 + vec3(0.0, uTime * 0.1, uScrollProgress * 10.0), 2) * 2.0 - 1.0;
          posP1 += normal * n1 * distortionAmount;
          posP2 += normal * n2 * distortionAmount;
        }
        
        // Calculate new tangent and bitangent vectors
        vec3 newTangent = normalize(posP1 - pos);
        vec3 newBitangent = normalize(posP2 - pos);
        
        // Recalculate normal as cross product
        transformedNormal = normalize(cross(newTangent, newBitangent));
      }
      
      vNormal = normalMatrix * transformedNormal;
      vPosition = pos;
      
      // Calculate world position
      vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
      
      // View direction
      vec3 worldCameraPos = cameraPosition;
      vec3 worldViewDir = normalize(worldCameraPos - vWorldPosition);
      vViewDir = worldViewDir;
      
      // Calculate fresnel-like rim effect with pulse variation
      vFresnel = fresnel(normalize((modelMatrix * vec4(transformedNormal, 0.0)).xyz), worldViewDir, uRimIntensity * (1.0 + pulse * 0.2));
      
      // Calculate elevation (used for contour lines)
      vElevation = length(pos);
      
      // Final position
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  // Enhanced fragment shader with improved visual effects
  const fragmentShader = `
    ${helperFunctions}
    
    varying vec3 vNormal;
    varying vec3 vViewDir;
    varying vec3 vPosition;
    varying vec3 vOrigPosition;
    varying vec3 vWorldPosition;
    varying float vFresnel;
    varying float vElevation;
    varying float vDistortion;
    
    uniform float uLineCount;
    uniform float uLineWidth;
    uniform float uLineSharpness;
    uniform float uRimEffect;
    uniform float uRimWidth;
    uniform float uOffset;
    uniform bool uUseHighlights;
    uniform float uHighlightIntensity;
    uniform float uOcclusion;
    uniform float uScrollProgress;
    uniform float uDistortion;
    uniform float uTime;
    uniform float uGlowIntensity;
    uniform vec3 uGlowColor;
    uniform float uColorShift;
    uniform vec3 uLineColorA;
    uniform vec3 uLineColorB;
    
    void main() {
      // Normalized direction to position (for gradient calculation)
      vec3 dir = normalize(vPosition);
      
      // Base elevation value for contour lines
      float elevation = vElevation;
      
      // Add subtle variation based on normal direction
      elevation += dot(normalize(vNormal), dir) * 0.05;
      
      // Add time-based subtle movement to contours
      float timeOffset = sin(uTime * 0.2) * 0.05;
      
      // Rim enhancement - concentrate lines at edges
      float rimFactor = vFresnel * uRimEffect;
      
      // Calculate gradient for line concentration
      float gradient = 1.0 + pow(rimFactor, 2.0) * 5.0;
      
      // Dynamically change contour pattern based on scroll
      float contourValue;
      
      // Each section has different contour pattern with enhanced transitions
      if (uScrollProgress < 0.33) {
        // Section 1: Enhanced basic contours with scrolling offset and time variation
        contourValue = (elevation + uOffset + uScrollProgress + timeOffset) * uLineCount * mix(1.0, gradient, uRimWidth);
      } else if (uScrollProgress < 0.66) {
        // Section 2: Enhanced radial contours from center with pulse effect
        float localProgress = (uScrollProgress - 0.33) * 3.0;
        float pulseEffect = 0.2 + 0.1 * sin(uTime * 0.5);
        vec3 localPos = vPosition * (1.0 + sin(localProgress * 6.28) * pulseEffect);
        contourValue = length(localPos.xz) * uLineCount * 2.0;
      } else {
        // Section 3: Enhanced complex pattern with distortion influence and time variation
        float localProgress = (uScrollProgress - 0.66) * 3.0;
        float noise1 = fbm(vPosition * 5.0 + vec3(uTime * 0.1, 0.0, uScrollProgress), 2);
        float noise2 = fbm(vPosition * 2.0 - vec3(0.0, uTime * 0.2, uScrollProgress * 3.0), 2);
        contourValue = (elevation * noise1 + noise2 * 2.0) * uLineCount;
      }
      
      // Extremely sharp contour lines
      float lineVal = 1.0 - contour(contourValue, uLineWidth, uLineSharpness);
      
      // Apply extra sharpening at rim
      lineVal = mix(lineVal, step(uLineWidth * 2.0, abs(fract(contourValue) - 0.5)), rimFactor * 0.7);
      
      // Calculate color shift based on position, distortion and time
      float colorMix = 0.5 + 0.5 * sin(vElevation * 5.0 + uTime * 0.3 + vDistortion * 2.0);
      colorMix = mix(colorMix, rimFactor, uColorShift); // Blend with rim effect
      
      // Mix between two colors for the lines
      vec3 lineColor = mixColor(uLineColorA, uLineColorB, colorMix);
      
      // Base color (colored lines on transparent background)
      vec3 color = lineColor * lineVal;
      
      // Apply subtle lighting effects if enabled
      if (uUseHighlights) {
        // Enhanced lighting direction (changes with scroll and time)
        vec3 lightDir = normalize(vec3(
          sin(uScrollProgress * 6.28 + uTime * 0.2), 
          1.0, 
          cos(uScrollProgress * 6.28 + uTime * 0.2)
        ));
        
        // Specular highlight with enhanced control
        vec3 halfVector = normalize(lightDir + vViewDir);
        float specular = pow(max(0.0, dot(vNormal, halfVector)), 16.0);
        
        // Apply highlights to lines only
        color += vec3(specular) * lineVal * uHighlightIntensity;
        
        // Apply ambient occlusion
        float ao = 1.0 - uOcclusion * (1.0 - dot(vNormal, vec3(0.0, 1.0, 0.0)));
        color *= ao;
      }
      
      // Add very subtle noise to break up perfection
      color *= (0.98 + hash(vPosition * 1000.0) * 0.04);
      
      // Add glow effect based on fresnel
      vec3 glowColor = uGlowColor * rimFactor * uGlowIntensity;
      color += glowColor;
      
      // Calculate alpha based on line value and fresnel
      // This makes the sphere transparent except for the contour lines
      float alpha = lineVal * 0.8 + rimFactor * 0.2;
      
      // Output final color with transparency
      gl_FragColor = vec4(color, alpha);
    }
  `;

  // Setup renderer with transparency
  const canvas = document.querySelector("canvas.webgl");
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true // Enable transparency
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Reduced for performance
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); // Transparent background

  // Setup camera
  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 3.5);

  // Create scene
  const scene = new THREE.Scene();

  // Create shader material with uniforms and transparency
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uLineCount: { value: settings.lineCount },
      uLineWidth: { value: settings.lineWidth },
      uLineSharpness: { value: settings.lineSharpness },
      uRimEffect: { value: settings.rimEffect },
      uRimIntensity: { value: settings.rimIntensity },
      uRimWidth: { value: settings.rimWidth },
      uOffset: { value: settings.offset },
      uUseHighlights: { value: settings.useHighlights },
      uHighlightIntensity: { value: settings.highlightIntensity },
      uOcclusion: { value: settings.occlusion },
      uScrollProgress: { value: 0.0 },
      uDistortion: { value: settings.distortion },
      uTwist: { value: settings.twist },
      uTime: { value: 0.0 }, // Time uniform for animations
      uGlowIntensity: { value: settings.glowIntensity },
      uGlowColor: { value: settings.glowColor },
      uColorShift: { value: settings.colorShift },
      uPulseSpeed: { value: settings.pulseSpeed },
      uLineColorA: { value: settings.lineColorA },
      uLineColorB: { value: settings.lineColorB }
    },
    transparent: true, // Enable transparency
    side: THREE.DoubleSide,
    depthWrite: false // Improve transparency rendering
  });

  // Create a group for both hemispheres
  const group = new THREE.Group();
  scene.add(group);

  // Create variables to track hemispheres
  let leftSphere, rightSphere;
  let materials = [];
  let lastDetailLevel, lastGap;

  // Optimized function to create/update geometry
  function createGeometry() {
    // Remove existing spheres if they exist
    if (leftSphere) {
      group.remove(leftSphere);
      group.remove(rightSphere);
    }

    // Create geometry with current detail level
    const sphereDetail = parseInt(settings.sphereDetail);

    // Use IcosahedronGeometry for more even triangulation and better performance
    const radius = 1;
    const leftGeometry = new THREE.SphereGeometry(
      radius,
      sphereDetail,
      sphereDetail,
      0,
      Math.PI,
      0,
      Math.PI
    );

    const rightGeometry = new THREE.SphereGeometry(
      radius,
      sphereDetail,
      sphereDetail,
      Math.PI,
      Math.PI,
      0,
      Math.PI
    );

    // Create materials (clone to allow independent updates)
    const leftMaterial = material.clone();
    const rightMaterial = material.clone();

    // Create meshes
    leftSphere = new THREE.Mesh(leftGeometry, leftMaterial);
    rightSphere = new THREE.Mesh(rightGeometry, rightMaterial);

    // Position with gap
    const gap = settings.gap / 2;
    leftSphere.position.x = -gap;
    rightSphere.position.x = gap;

    // Add to group
    group.add(leftSphere);
    group.add(rightSphere);

    // Store materials for updates
    materials = [leftMaterial, rightMaterial];

    // Track settings
    lastDetailLevel = settings.sphereDetail;
    lastGap = settings.gap;
  }

  // Initial geometry creation
  createGeometry();

  // Handle window resize with debounce for better performance
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }, 250);
  });

  // Animation variables
  let scrollProgress = 0;
  let initialGroupRotation = { x: 0, y: 0, z: 0 };
  let clock = new THREE.Clock();

  // Create enhanced scroll animations with GSAP
  function setupScrollAnimations() {
    // Store initial rotation for reset
    initialGroupRotation = {
      x: group.rotation.x,
      y: group.rotation.y,
      z: group.rotation.z
    };

    // Text animations for each section
    gsap.utils.toArray("section").forEach((section, i) => {
      const heading = section.querySelector("h1");
      const paragraph = section.querySelector("p");

      // Create a tween for each section
      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        })
        .to(heading, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out"
        })
        .to(
          paragraph,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out"
          },
          "-=0.4"
        );
    });

    // Main scroll animation for the sphere with enhanced transitions
    ScrollTrigger.create({
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        // Get scroll progress
        scrollProgress = self.progress;

        // Update scrollProgress uniform
        materials.forEach((mat) => {
          mat.uniforms.uScrollProgress.value = scrollProgress;
        });

        // Enhanced section-specific transformations with smoother transitions
        if (scrollProgress < 0.25) {
          // Section 1: Expanding gap with enhanced effects
          const localProgress = scrollProgress * 4.0;
          settings.gap = gsap.utils.interpolate(0.1, 0.5, localProgress);
          settings.distortion = gsap.utils.interpolate(0.0, 0.1, localProgress);
          settings.twist = 0.0;
          settings.colorShift = gsap.utils.interpolate(0.0, 0.3, localProgress);
          settings.glowIntensity = gsap.utils.interpolate(
            0.2,
            0.4,
            localProgress
          );

          group.rotation.x = gsap.utils.interpolate(0, 0.2, localProgress);
          group.rotation.y = gsap.utils.interpolate(
            0,
            Math.PI * 0.25,
            localProgress
          );
        } else if (scrollProgress < 0.5) {
          // Section 2: Twisting effect with enhanced colors
          const localProgress = (scrollProgress - 0.25) * 4.0;
          settings.gap = gsap.utils.interpolate(0.5, 0.3, localProgress);
          settings.distortion = gsap.utils.interpolate(0.1, 0.2, localProgress);
          settings.twist = gsap.utils.interpolate(0.0, 3.0, localProgress);
          settings.colorShift = gsap.utils.interpolate(0.3, 0.6, localProgress);
          settings.glowIntensity = gsap.utils.interpolate(
            0.4,
            0.6,
            localProgress
          );

          group.rotation.x = gsap.utils.interpolate(
            0.2,
            Math.PI * 0.25,
            localProgress
          );
          group.rotation.y = gsap.utils.interpolate(
            Math.PI * 0.25,
            Math.PI * 0.5,
            localProgress
          );
        } else if (scrollProgress < 0.75) {
          // Section 3: High distortion with maximum effects
          const localProgress = (scrollProgress - 0.5) * 4.0;
          settings.gap = 0.3;
          settings.distortion = gsap.utils.interpolate(0.2, 0.5, localProgress);
          settings.twist = gsap.utils.interpolate(3.0, 1.0, localProgress);
          settings.colorShift = gsap.utils.interpolate(0.6, 0.8, localProgress);
          settings.glowIntensity = gsap.utils.interpolate(
            0.6,
            0.8,
            localProgress
          );

          group.rotation.x = Math.PI * 0.25;
          group.rotation.y = gsap.utils.interpolate(
            Math.PI * 0.5,
            Math.PI,
            localProgress
          );
        } else {
          // Section 4: Reset to clean form with subtle effects
          const localProgress = (scrollProgress - 0.75) * 4.0;
          settings.gap = gsap.utils.interpolate(0.3, 0.2, localProgress);
          settings.distortion = gsap.utils.interpolate(0.5, 0.0, localProgress);
          settings.twist = gsap.utils.interpolate(1.0, 0.0, localProgress);
          settings.colorShift = gsap.utils.interpolate(0.8, 0.0, localProgress);
          settings.glowIntensity = gsap.utils.interpolate(
            0.8,
            0.2,
            localProgress
          );

          group.rotation.x = gsap.utils.interpolate(
            Math.PI * 0.25,
            0,
            localProgress
          );
          group.rotation.y = gsap.utils.interpolate(
            Math.PI,
            Math.PI * 2,
            localProgress
          );
        }

        // Update material uniforms for enhanced effects
        materials.forEach((mat) => {
          mat.uniforms.uDistortion.value = settings.distortion;
          mat.uniforms.uTwist.value = settings.twist;
          mat.uniforms.uGlowIntensity.value = settings.glowIntensity;
          mat.uniforms.uColorShift.value = settings.colorShift;
        });

        // Update sphere positions for gap
        if (leftSphere && rightSphere) {
          const gap = settings.gap / 2;
          leftSphere.position.x = -gap;
          rightSphere.position.x = gap;
          lastGap = settings.gap;
        }

        // Update line count based on scroll (more lines as we scroll)
        const lineCount = gsap.utils.interpolate(30, 60, scrollProgress);
        settings.lineCount = lineCount;

        // Dynamically change colors based on scroll position
        const startColor = new THREE.Color(0xffffff);
        const midColor = new THREE.Color(0x88ccff);
        const endColor = new THREE.Color(0x44aaff);

        if (scrollProgress < 0.5) {
          settings.lineColorA = startColor
            .clone()
            .lerp(midColor, scrollProgress * 2);
        } else {
          settings.lineColorA = midColor
            .clone()
            .lerp(endColor, (scrollProgress - 0.5) * 2);
        }

        materials.forEach((mat) => {
          mat.uniforms.uLineColorA.value = settings.lineColorA;
        });
      }
    });
  }

  // Initialize animations
  setupScrollAnimations();

  // Animation loop with time-based effects
  function animate() {
    requestAnimationFrame(animate);

    // Update time uniform for animations
    const elapsedTime = clock.getElapsedTime();
    materials.forEach((material) => {
      material.uniforms.uTime.value = elapsedTime;
    });

    // Update uniforms from settings for both materials
    materials.forEach((material) => {
      material.uniforms.uLineCount.value = settings.lineCount;
      material.uniforms.uLineWidth.value = settings.lineWidth;
      material.uniforms.uLineSharpness.value = settings.lineSharpness;
      material.uniforms.uRimEffect.value = settings.rimEffect;
      material.uniforms.uRimIntensity.value = settings.rimIntensity;
      material.uniforms.uRimWidth.value = settings.rimWidth;
      material.uniforms.uOffset.value = settings.offset;
      material.uniforms.uUseHighlights.value = settings.useHighlights;
      material.uniforms.uHighlightIntensity.value = settings.highlightIntensity;
      material.uniforms.uOcclusion.value = settings.occlusion;
      material.uniforms.uPulseSpeed.value = settings.pulseSpeed;
      material.uniforms.uLineColorB.value = settings.lineColorB;
    });

    // Recreate geometry if detail level has changed
    if (lastDetailLevel !== settings.sphereDetail) {
      createGeometry();
    }

    // Add subtle continuous rotation for more life
    group.rotation.z = Math.sin(elapsedTime * 0.1) * 0.05;

    // Render the scene
    renderer.render(scene, camera);
  }

  // Start animation
  animate();
});