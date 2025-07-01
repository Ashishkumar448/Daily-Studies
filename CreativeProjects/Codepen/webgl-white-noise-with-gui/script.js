import * as THREE from "https://cdn.skypack.dev/three@0.133.1/build/three.module";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.133.1/examples/jsm/controls/OrbitControls";
import { GUI } from "https://cdn.jsdelivr.net/npm/dat.gui@0.7.7/build/dat.gui.module.js";

// Parameters
const params = {
  color1: 0x4444ff,
  color2: 0xff4444,
  noiseScale: 0.5,
  noiseSpeed: 0.2,
  displacementScale: 0.2,
  rotationSpeed: 0.001,
  wireframe: false,
  terrainScale: 1.0,
  craterScale: 0.5,
  craterDepth: 0.2,
  atmosphereColor: 0x87ceeb,
  atmosphereIntensity: 0.3,
  cloudScale: 0.5,
  cloudSpeed: 0.05
};

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Geometry
const geometry = new THREE.SphereGeometry(1, 256, 128);

// Shader material
const shaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color(params.color1) },
    uColor2: { value: new THREE.Color(params.color2) },
    uNoiseScale: { value: params.noiseScale },
    uNoiseSpeed: { value: params.noiseSpeed },
    uDisplacementScale: { value: params.displacementScale },
    uTerrainScale: { value: params.terrainScale },
    uCraterScale: { value: params.craterScale },
    uCraterDepth: { value: params.craterDepth },
    uAtmosphereColor: { value: new THREE.Color(params.atmosphereColor) },
    uAtmosphereIntensity: { value: params.atmosphereIntensity },
    uCloudScale: { value: params.cloudScale },
    uCloudSpeed: { value: params.cloudSpeed }
  },
  vertexShader: `
    uniform float uTime;
    uniform float uNoiseScale;
    uniform float uNoiseSpeed;
    uniform float uDisplacementScale;
    uniform float uTerrainScale;
    uniform float uCraterScale;
    uniform float uCraterDepth;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    // Improved noise function
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      for (int i = 0; i < 6; i++) {
        value += amplitude * snoise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      return value;
    }

    void main() {
      vUv = uv;
      vNormal = normal;
      vPosition = position;

      // Terrain variation
      float noise = fbm(position * uTerrainScale + uTime * uNoiseSpeed);
      
      // Crater formation
      float crater = smoothstep(0.4, 0.5, snoise(position * uCraterScale));
      
      // Combine displacement
      float displacement = noise * uDisplacementScale - crater * uCraterDepth;
      vec3 newPosition = position + normal * displacement;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uAtmosphereColor;
    uniform float uAtmosphereIntensity;
    uniform float uCloudScale;
    uniform float uCloudSpeed;
    uniform float uTime;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    // Improved noise function
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    void main() {
      // Base color
      vec3 color = mix(uColor1, uColor2, vUv.y);
      
      // Simple lighting
      float light = dot(vNormal, normalize(vec3(1.0, 1.0, 1.0)));
      color *= 0.5 + 0.5 * light;

      // Atmosphere glow
      float atmosphere = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
      atmosphere = pow(atmosphere, 3.0);
      color = mix(color, uAtmosphereColor, atmosphere * uAtmosphereIntensity);

      // Simple cloud pattern
      float cloud = snoise(vPosition * uCloudScale + uTime * uCloudSpeed);
      cloud = smoothstep(0.4, 0.6, cloud);
      color = mix(color, vec3(1.0), cloud * 0.3);

      gl_FragColor = vec4(color, 1.0);
    }
  `,
  wireframe: params.wireframe
});

// Create the sphere
const sphere = new THREE.Mesh(geometry, shaderMaterial);
scene.add(sphere);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 0, 3);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// GUI
const gui = new GUI();
gui
  .addColor(params, "color1")
  .onChange((value) => shaderMaterial.uniforms.uColor1.value.setHex(value));
gui
  .addColor(params, "color2")
  .onChange((value) => shaderMaterial.uniforms.uColor2.value.setHex(value));
gui
  .add(params, "noiseScale", 0.1, 2)
  .onChange((value) => (shaderMaterial.uniforms.uNoiseScale.value = value));
gui
  .add(params, "noiseSpeed", 0, 1)
  .onChange((value) => (shaderMaterial.uniforms.uNoiseSpeed.value = value));
gui
  .add(params, "displacementScale", 0, 0.5)
  .onChange(
    (value) => (shaderMaterial.uniforms.uDisplacementScale.value = value)
  );
gui.add(params, "rotationSpeed", -0.01, 0.01);
gui
  .add(params, "wireframe")
  .onChange((value) => (shaderMaterial.wireframe = value));
gui
  .add(params, "terrainScale", 0.1, 5)
  .onChange((value) => (shaderMaterial.uniforms.uTerrainScale.value = value));
gui
  .add(params, "craterScale", 0.1, 2)
  .onChange((value) => (shaderMaterial.uniforms.uCraterScale.value = value));
gui
  .add(params, "craterDepth", 0, 0.5)
  .onChange((value) => (shaderMaterial.uniforms.uCraterDepth.value = value));
gui
  .addColor(params, "atmosphereColor")
  .onChange((value) =>
    shaderMaterial.uniforms.uAtmosphereColor.value.setHex(value)
  );
gui
  .add(params, "atmosphereIntensity", 0, 1)
  .onChange(
    (value) => (shaderMaterial.uniforms.uAtmosphereIntensity.value = value)
  );
gui
  .add(params, "cloudScale", 0.1, 2)
  .onChange((value) => (shaderMaterial.uniforms.uCloudScale.value = value));
gui
  .add(params, "cloudSpeed", 0, 0.2)
  .onChange((value) => (shaderMaterial.uniforms.uCloudSpeed.value = value));

// Animation
const clock = new THREE.Clock();

function animate() {
  const elapsedTime = clock.getElapsedTime();

  // Update uniforms
  shaderMaterial.uniforms.uTime.value = elapsedTime;

  // Rotate sphere
  sphere.rotation.y += params.rotationSpeed;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call animate again on the next frame
  requestAnimationFrame(animate);
}

// Start the animation loop
animate();

// Handle window resizing
window.addEventListener("resize", () => {
  // Update sizes
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Update camera
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

console.log("Enhanced planet visualization setup complete.");