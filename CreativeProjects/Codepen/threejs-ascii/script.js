import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { EffectComposer } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js";
import { GUI } from "https://cdn.skypack.dev/dat.gui";

let scene, camera, renderer, geometry, material, mesh;
let mouseX = 0,
  mouseY = 0;
let isHovered = false;

const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;
uniform bool iHovered;

varying vec2 vUv;

vec4 permute(vec4 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
}
vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    // First corner
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1. + 3.0 * C.xxx;

    // Permutations
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    // Gradients
    float n_ = 1.0 / 7.0; // N=7
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    // Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float sdOrientedBox(in vec2 p, in vec2 a, in vec2 b, float th) {
    float l = length(b-a);
    vec2 d = (b-a)/l;
    vec2 q = p-(a+b)*0.5;
    q = mat2(d.x,-d.y,d.y,d.x)*q;
    q = abs(q)-vec2(l*0.5,th);
    return length(max(q,0.0)) + min(max(q.x,q.y),0.0);    
}

float sdCross(in vec2 p, float th, float crossRadius) {
    float upper = 1. - crossRadius;
    float lower = 0. + crossRadius;
    
    vec2 v1 = vec2(lower, upper);
    vec2 v12 = vec2(upper, lower);
    vec2 v2 = vec2(lower, lower);
    vec2 v22 = vec2(upper, upper);

    float d1 = sdOrientedBox(p, v1, v12, th);
    float d2 = sdOrientedBox(p, v2, v22, th);

    d1 = step(d1, 0.01);
    d2 = step(d2, 0.01);
    
    return d1 + d2;
}

float square(in vec2 p, float radius) {
    vec2 value = step(radius, p) - step(1. - radius, p);
    return value.x * value.y;
}

float line(in vec2 p, float radius) {
    float upper = 1. - radius;
    float lower = 0. + radius;
    
    vec2 v1 = vec2(lower, lower);
    vec2 v12 = vec2(upper, upper);

    return step(sdOrientedBox(p, v1, v12, 0.028), 0.01);
}

float getGridColor(in vec2 p, float noise) {
    if (noise <= 0.25) {
        return square(p, 0.47) - 0.7;
    } 

    if (noise > 0.25 && noise <= 0.5) {
        return line(p, 0.68);
    }

    if (noise > 0.5 && noise <= 0.75) {
        return sdCross(p, 0.028, 0.68);
    }

    if (noise > 0.75) {
        return square(p, 0.94);
    }
    
    return 0.0; // Default return value
}

void main() {
    vec2 uv = vUv;
    uv.y *= iResolution.y / iResolution.x;
    
    float GRID_SIZE = 25.0;
    float gridSizeInverse = 1.0 / GRID_SIZE;

    vec2 uv1 = uv * GRID_SIZE;
    vec2 uv_i = floor(uv1);
    vec2 uv_f = fract(uv1);

    float noise = snoise(vec3(uv_i * gridSizeInverse * 2.2, iTime * 0.5));
    noise *= 1.4;
    noise -= 0.2;

    // Add mouse interaction
    vec2 mouseUV = iMouse / iResolution;
    float distToMouse = length(uv - mouseUV);
    noise += 0.2 * (1.0 - smoothstep(0.0, 0.2, distToMouse));

    // Add hover effect
    if (iHovered) {
        noise = fract(noise * 2.0);
    }

    float color = getGridColor(uv_f, noise);

    gl_FragColor = vec4(vec3(color), 1.0);
}
`;

function init() {
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 1;

  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("myCanvas")
  });
  renderer.setSize(window.innerWidth, window.innerHeight);

  geometry = new THREE.PlaneGeometry(2, 2);
  material = new THREE.ShaderMaterial({
    uniforms: {
      iTime: { value: 0 },
      iResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight)
      },
      iMouse: { value: new THREE.Vector2(0, 0) },
      iHovered: { value: false }
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
  });
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  document.addEventListener("mousemove", onMouseMove);
  window.addEventListener("resize", onWindowResize);
  document
    .getElementById("myCanvas")
    .addEventListener(
      "mouseenter",
      () => (material.uniforms.iHovered.value = true)
    );
  document
    .getElementById("myCanvas")
    .addEventListener(
      "mouseleave",
      () => (material.uniforms.iHovered.value = false)
    );

  animate();
}

function onMouseMove(event) {
  mouseX = event.clientX;
  mouseY = event.clientY;
  material.uniforms.iMouse.value.set(mouseX, window.innerHeight - mouseY);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  material.uniforms.iResolution.value.set(
    window.innerWidth,
    window.innerHeight
  );
}

function animate() {
  requestAnimationFrame(animate);
  material.uniforms.iTime.value += 0.01;
  renderer.render(scene, camera);
}

init();