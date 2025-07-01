import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { GUI } from "https://cdn.skypack.dev/dat.gui";

// Setup scene, camera, and renderer with transparent background
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// Initialize WebGLRenderer with alpha for transparency
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0); // Fully transparent
document.body.appendChild(renderer.domElement);

// Create a plane geometry that fills the screen
const geometry = new THREE.PlaneGeometry(2, 2);

// Define the shader material with transparency enabled
const material = new THREE.ShaderMaterial({
  uniforms: {
    iTime: { value: 0 },
    iResolution: {
      value: new THREE.Vector3(window.innerWidth, window.innerHeight, 1)
    },
    colorShift: { value: 0 },
    blackRadius: { value: 0.15 },
    blackSharpness: { value: 0.01 },
    shaderLength: { value: 1.2 },
    shaderRadius: { value: 0.9 },
    glowStrength: { value: 0.2 },
    glowRadius: { value: 0.2 },
    innerGlowStrength: { value: 0.75 },
    innerGlowWidth: { value: 0.05 },
    innerGlowSpeed: { value: 0.1 },
    // Removed reflectionStrength and reflectionWidth
    outerRimStrength: { value: 0.3 }, // Now controls the outer blur strength
    outerBlurWidth: { value: 0.05 }, // New uniform for outer blur width
    outerRimSpeed: { value: 0.5 }, // Uniform remains for animation speed
    shapeType: { value: 0 } // New uniform for shape selection
  },
  transparent: true, // Enable transparency
  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;

    uniform float iTime;
    uniform vec3 iResolution;
    uniform float colorShift;
    uniform float blackRadius;
    uniform float blackSharpness;
    uniform float shaderLength;
    uniform float shaderRadius;
    uniform float glowStrength;
    uniform float glowRadius;
    uniform float innerGlowStrength;
    uniform float innerGlowWidth;
    uniform float innerGlowSpeed;
    uniform float outerRimStrength;
    uniform float outerBlurWidth;
    uniform float outerRimSpeed;
    uniform float shapeType; // 0.0: Circle, 1.0: Square, 2.0: Triangle

    // Smootherstep function for smoother transitions
    float smootherstep(float edge0, float edge1, float x) {
      float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
      return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
    }

    // RGB to HSV conversion
    vec3 rgb2hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }

    // HSV to RGB conversion
    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    // Function to get glow color based on angle and time
    vec3 getGlowColor(float angle) {
      float hue = fract(angle / (2.0 * 3.14159) + iTime * innerGlowSpeed);
      return hsv2rgb(vec3(hue, 1.0, 1.0));
    }

    // Function to define different shapes
    float getShape(vec2 p) {
      if (shapeType == 0.0) {
        // Circle
        return length(p);
      } else if (shapeType == 1.0) {
        // Square
        return max(abs(p.x), abs(p.y));
      } else if (shapeType == 2.0) {
        // Triangle (equilateral)
        float k = sqrt(3.0);
        p.x = abs(p.x);
        p.y = p.y + 1.0 / k;
        if (p.x + k * p.y > 1.0)
          return length(p - vec2(0.0, 2.0 / k));
        return -p.y;
      }
      // Default to circle
      return length(p);
    }

    void main() {
      vec2 fragCoord = gl_FragCoord.xy;
      vec2 p = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
      p *= 0.65 * shaderRadius;

      vec3 color = vec3(0.0);

      // Reduced loop iterations for performance
      for (int i = 0; i < 16; i++) { // Reduced from 32 to 16
        float rotation = float(i) / (4.0 * shaderLength) + iTime * 0.2;
        mat2 rot = mat2(cos(rotation), -sin(rotation), sin(rotation), cos(rotation));
        vec2 rp = rot * p;
        float shape = getShape(rp);
        float intensity = smootherstep(0.1, 0.0, shape) * 0.1;
        float brightness = (sin(rotation * 10.0 - iTime) * 0.5 + 1.0) * 1.25;
        color[i % 3] += intensity * brightness;
      }

      color = pow(color, vec3(1.75));
      
      // Convert to HSV, shift the hue, then convert back to RGB
      vec3 hsv = rgb2hsv(color);
      hsv.x = fract(hsv.x + colorShift);
      color = hsv2rgb(hsv);

      // Apply radial gradient to darken the center with adjustable sharpness
      float dist = length(p);
      float vignette = smootherstep(blackRadius, blackRadius + blackSharpness, dist);
      
      // Add outer glow with smooth transitions
      float outerGlow = smootherstep(blackRadius + glowRadius, blackRadius, dist) * glowStrength;
      color = mix(color, vec3(1.0), outerGlow);

      // Add rotating inner glow with gradient
      float angle = atan(p.y, p.x);
      float innerGlowIntensity = smootherstep(blackRadius - innerGlowWidth, blackRadius, dist) * 
                                 smootherstep(blackRadius + innerGlowWidth, blackRadius, dist);
      vec3 innerGlowColor = getGlowColor(angle);
      color = mix(color, innerGlowColor, innerGlowIntensity * innerGlowStrength);

      // Add outer rim blur effect with smooth transitions and animation
      float outerRim = smootherstep(blackRadius + blackSharpness + outerBlurWidth, blackRadius + blackSharpness, dist);
      float rimAnimation = sin(iTime * outerRimSpeed + dist * 10.0) * 0.5 + 0.5;
      color += vec3(outerRim * rimAnimation * outerRimStrength);

      // Final color adjustment
      color *= vignette;

      // Calculate alpha based on distance for transparency
      float alpha = smoothstep(blackRadius + blackSharpness + 0.1, blackRadius + blackSharpness, dist);
      alpha = clamp(alpha, 0.0, 1.0);

      gl_FragColor = vec4(color, alpha);
    }
  `
});

// Create a mesh with the geometry and material
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// Setup dat.GUI
const gui = new GUI();
const params = {
  timeScale: 1.0,
  colorCycleSpeed: 0.1,
  blackRadius: 0.15,
  blackSharpness: 0.01,
  shaderLength: 1.2,
  shaderRadius: 0.9,
  glowStrength: 0.2,
  glowRadius: 0.2,
  innerGlowStrength: 0.75,
  innerGlowWidth: 0.05,
  innerGlowSpeed: 0.1,
  // Removed reflectionStrength and reflectionWidth
  outerRimStrength: 0.3, // Now controls the outer blur strength
  outerBlurWidth: 0.05, // New parameter for outer blur width
  outerRimSpeed: 0.5, // Uniform remains for animation speed
  shapeType: "Circle" // New parameter for shape selection
};

// Add controls to dat.GUI
gui.add(params, "timeScale", 0.1, 2.0).name("Time Scale");
gui.add(params, "colorCycleSpeed", 0.01, 1.0).name("Color Cycle Speed");
gui
  .add(params, "blackRadius", 0.0, 1.0)
  .name("Black Radius")
  .onChange((value) => (material.uniforms.blackRadius.value = value));
gui
  .add(params, "blackSharpness", 0.01, 0.5)
  .name("Black Sharpness")
  .onChange((value) => (material.uniforms.blackSharpness.value = value));
gui
  .add(params, "shaderLength", 0.1, 2.0)
  .name("Shader Length")
  .onChange((value) => (material.uniforms.shaderLength.value = value));
gui
  .add(params, "shaderRadius", 0.1, 2.0)
  .name("Shader Radius")
  .onChange((value) => (material.uniforms.shaderRadius.value = value));
gui
  .add(params, "glowStrength", 0.0, 1.0)
  .name("Glow Strength")
  .onChange((value) => (material.uniforms.glowStrength.value = value));
gui
  .add(params, "glowRadius", 0.0, 0.5)
  .name("Glow Radius")
  .onChange((value) => (material.uniforms.glowRadius.value = value));
gui
  .add(params, "innerGlowStrength", 0.0, 1.0)
  .name("Inner Glow Strength")
  .onChange((value) => (material.uniforms.innerGlowStrength.value = value));
gui
  .add(params, "innerGlowWidth", 0.01, 0.2)
  .name("Inner Glow Width")
  .onChange((value) => (material.uniforms.innerGlowWidth.value = value));
gui
  .add(params, "innerGlowSpeed", 0.1, 5.0)
  .name("Inner Glow Speed")
  .onChange((value) => (material.uniforms.innerGlowSpeed.value = value));
// Removed reflectionStrength and reflectionWidth
gui
  .add(params, "outerRimStrength", 0.0, 1.0)
  .name("Outer Rim Strength")
  .onChange((value) => (material.uniforms.outerRimStrength.value = value));
gui
  .add(params, "outerBlurWidth", 0.01, 0.2)
  .name("Outer Blur Width")
  .onChange((value) => (material.uniforms.outerBlurWidth.value = value));
gui
  .add(params, "outerRimSpeed", 0.1, 5.0)
  .name("Outer Rim Speed")
  .onChange((value) => (material.uniforms.outerRimSpeed.value = value));

// Add shape selection dropdown
gui
  .add(params, "shapeType", ["Circle", "Square", "Triangle"])
  .name("Shape Type")
  .onChange((value) => {
    if (value === "Circle") {
      material.uniforms.shapeType.value = 0.0;
    } else if (value === "Square") {
      material.uniforms.shapeType.value = 1.0;
    } else if (value === "Triangle") {
      material.uniforms.shapeType.value = 2.0;
    }
  });

// Animation loop
function animate(time) {
  time *= 0.001; // Convert to seconds

  // Update uniforms based on time and GUI parameters
  material.uniforms.iTime.value = time * params.timeScale;
  material.uniforms.iResolution.value.set(
    window.innerWidth,
    window.innerHeight,
    1
  );
  material.uniforms.colorShift.value = (time * params.colorCycleSpeed) % 1.0;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Handle window resize
function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.left = -1;
  camera.right = 1;
  camera.top = 1;
  camera.bottom = -1;
  camera.updateProjectionMatrix();

  material.uniforms.iResolution.value.set(width, height, 1);
  renderer.setSize(width, height);
}

window.addEventListener("resize", onWindowResize);

// Start the animation
animate(0);