// Import Three.js library and GSAP with ScrollTrigger
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.124.0/build/three.module.js";

gsap.registerPlugin(ScrollTrigger);

// Get the existing canvas
const canvas = document.getElementById("shaderCanvas");

// Basic Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  canvas.clientWidth / canvas.clientHeight,
  0.1,
  100
);
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true // Enable alpha (transparency)
});
renderer.setClearColor(0x000000, 0); // Set clear color to transparent

// Set renderer size to match the canvas size
function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

// Set a dark background color
scene.background = new THREE.Color(0x000000); // Black

// Create points for the sphere
const geometry = new THREE.BufferGeometry();
const numPoints = 750;
const positions = new Float32Array(numPoints * 3);
const indices = new Float32Array(numPoints);

for (let i = 0; i < numPoints; i++) {
  indices[i] = i;
}

geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
geometry.setAttribute("vertexId", new THREE.BufferAttribute(indices, 1));

// Vertex Shader
const vertexShader = `
  #define PI radians(180.0)
  uniform float time;
  uniform float pointSize;
  uniform vec2 resolution;
  uniform float scaleFactor; // Added uniform for scaling
  attribute float vertexId;

  mat4 persp(float fov, float aspect, float zNear, float zFar) {
    float f = tan(PI * 0.5 - 0.5 * fov);
    float rangeInv = 1.0 / (zNear - zFar);
    return mat4(
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (zNear + zFar) * rangeInv, -1,
      0, 0, zNear * zFar * rangeInv * 2.0, 0);
  }

  mat4 rotY(float angleInRadians) {
    float s = sin(angleInRadians);
    float c = cos(angleInRadians);
    return mat4(
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1);
  }

  mat4 rotX(float angleInRadians) {
    float s = sin(angleInRadians);
    float c = cos(angleInRadians);
    return mat4(
      1, 0, 0, 0,
      0, c, -s, 0,
      0, s, c, 0,
      0, 0, 0, 1);
  }

  vec3 SampleSpherePos(float idx, float num) {
    idx += 0.5;
    float phi = 10.166407384630519631619018026484 * idx;
    float th_cs = 1.0 - 2.0 * idx / num;
    float th_sn = sqrt(clamp(1.0 - th_cs * th_cs, 0.0, 1.0));
    return vec3(cos(phi) * th_sn, sin(phi) * th_sn, th_cs);
  }

  void main() {
    vec3 pos = SampleSpherePos(vertexId, ${numPoints.toFixed(
      1
    )}) * scaleFactor; // Use scaleFactor to scale the sphere
    
    // Apply time-based rotation
    mat4 rotation = rotY(time * 0.1);
    
    vec4 vertPos = rotation * vec4(pos, 1.0) + vec4(0.0, 0.0, -3.0, 0.0);
    
    gl_Position = persp(PI * 0.25, resolution.x / resolution.y, 0.1, 100.0) * vertPos;
    
    // Size attenuation
    float size = pointSize * (1.0 / -vertPos.z);
    gl_PointSize = size;
  }
`;

// Fragment Shader
const fragmentShader = `
  void main() {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // Render each point as white
  }
`;

// Shader Material
const material = new THREE.ShaderMaterial({
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  uniforms: {
    time: { value: 0.0 },
    pointSize: { value: 10.0 },
    resolution: {
      value: new THREE.Vector2(canvas.clientWidth, canvas.clientHeight)
    },
    scaleFactor: { value: 1.0 } // Initial scale factor
  },
  transparent: true,
  depthWrite: false
});

const pointCloud = new THREE.Points(geometry, material);
scene.add(pointCloud);

camera.position.z = 3;

// Handle window resize
function onWindowResize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  material.uniforms.resolution.value.set(width, height);
}

window.addEventListener("resize", onWindowResize, false);

// Mouse movement handler
let targetRotationX = 0;
let targetRotationY = 0;
let currentRotationX = 0;
let currentRotationY = 0;

// Update mouse coordinates relative to the center of the window
function onMouseMove(event) {
  targetRotationX = (event.clientX / window.innerWidth - 0.5) * 2; // -1 to 1 range
  targetRotationY = (event.clientY / window.innerHeight - 0.5) * 2; // -1 to 1 range
}

window.addEventListener("mousemove", onMouseMove, false);

// Linear interpolation function to smooth motion
function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

// Initial call to set size
onWindowResize();

// Animation loop
function animate(time) {
  requestAnimationFrame(animate);
  material.uniforms.time.value = time * 0.001; // Convert to seconds

  // Smoothly interpolate current rotation towards target rotation
  currentRotationX = lerp(currentRotationX, targetRotationX, 0.05);
  currentRotationY = lerp(currentRotationY, targetRotationY, 0.05);

  // Update pointCloud rotation based on smoothed values
  pointCloud.rotation.y = currentRotationX * Math.PI * 0.5; // Adjust rotation sensitivity
  pointCloud.rotation.x = currentRotationY * Math.PI * 0.5;

  // Resize renderer if needed
  if (resizeRendererToDisplaySize(renderer)) {
    onWindowResize();
  }

  renderer.render(scene, camera); // Render the scene
}

animate();

// Use ScrollTrigger to animate the scale of the sphere
gsap.to(material.uniforms.scaleFactor, {
  value: 3.0, // Scale up to 300%
  scrollTrigger: {
    trigger: ".container",
    start: "top top",
    end: "bottom bottom",
    ease: "power1.inOut",
    scrub: true
  }
});