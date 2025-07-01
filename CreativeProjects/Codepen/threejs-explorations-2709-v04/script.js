import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { GUI } from "https://cdn.skypack.dev/dat.gui";

let camera, scene, renderer, gui;
let uniforms = {
  iResolution: { value: new THREE.Vector2() },
  iTime: { value: 0 },
  grainIntensity: { value: 0.2 },
  grainScale: { value: 2.0 },
  noiseFrequency: { value: 2.5 },
  sphereRotationSpeed: { value: 0.1 } // New parameter for controlling sphere rotation
};

init();
animate();

function init() {
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 4); // Adjusted camera position to center the sphere

  scene = new THREE.Scene();

  const geometry = new THREE.PlaneGeometry(2, 2);

  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: `
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      #define PI 3.14159265359

      uniform vec2 iResolution;
      uniform float iTime;
      uniform float grainIntensity;
      uniform float grainScale;
      uniform float noiseFrequency;
      uniform float sphereRotationSpeed;

      mat2 rot(float angle) {
        float c = cos(angle);
        float s = sin(angle);
        return mat2(c, -s, s, c);
      }

      vec3 hash(vec3 p) {
        return vec3(sin(dot(p, vec3(127.1, 311.7, 74.7))), cos(dot(p, vec3(269.5, 183.3, 246.1))), sin(dot(p, vec3(113.5, 271.9, 124.6))));
      }

      float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);

        vec3 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(dot(hash(i + vec3(0,0,0)), f - vec3(0,0,0)),
                           dot(hash(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
                      mix(dot(hash(i + vec3(0,1,0)), f - vec3(0,1,0)),
                           dot(hash(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
                 mix(mix(dot(hash(i + vec3(0,0,1)), f - vec3(0,0,1)),
                           dot(hash(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
                      mix(dot(hash(i + vec3(0,1,1)), f - vec3(0,1,1)),
                           dot(hash(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z);
      }

      float map(vec3 p) {
        float noiseValue = noise(p * noiseFrequency + iTime * 0.1);
        return length(p) - (1.0 + noiseValue * 0.5);
      }

      vec3 getNormal(vec3 p) {
        vec2 e = vec2(.00001f, 0);
        vec3 n = map(p) - vec3(map(p - e.xyy), map(p - e.yxy), map(p - e.yyx));
        return normalize(n);
      }

      vec3 findPaletteColor(float t) {
        vec3 a = vec3(0.518, 0.580, 0.580);
        vec3 b = vec3(0.515, 0.515, 0.421);
        vec3 c = vec3(0.336, 0.336, 0.210);
        vec3 d = vec3(-1.122, -0.792, -0.452);
        return a + b * cos(16.28318 * (c * t + d));
      }

      vec4 render(vec2 uv) {
        vec3 ro = vec3(0.0, 0.0, 3.0);
        vec3 rd = normalize(vec3(uv, -1.0));

        // Apply rotation to the sphere over time
        ro.xz *= rot(sphereRotationSpeed * iTime);
        rd.xz *= rot(sphereRotationSpeed * iTime);

        vec3 p = ro;
        for (int i = 0; i < 100; i++) {
          float d = map(p);
          if (d < 0.001) {
            vec3 normal = getNormal(p);
            vec3 color = findPaletteColor(0.5 * length(p) + 0.5);
            return vec4(color * 0.8 + 0.2 * normal, 1.0);
          }
          p += rd * d;
        }
        return vec4(0.0);
      }

      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        vec2 uv = (fragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
        vec3 color = vec3(0.0);

        // Apply grain effect
        vec2 grainUv = fragCoord * grainScale / iResolution.xy;
        float grain = fract(sin(dot(grainUv, vec2(12.9898, 78.233))) * 43758.5453123) * grainIntensity;
        vec4 scene = render(uv);
        color = mix(color, scene.rgb, scene.a);
        color = clamp(color + grain - grainIntensity * 0.5, 0.0, 1.0);

        fragColor = vec4(color, 1.0);
      }

      void main() {
        mainImage(gl_FragColor, gl_FragCoord.xy);
      }
    `
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  onWindowResize();
  window.addEventListener("resize", onWindowResize);

  setupGUI();
}

function setupGUI() {
  gui = new GUI();
  gui.add(uniforms.grainIntensity, "value", 0, 0.5).name("Grain Intensity");
  gui.add(uniforms.grainScale, "value", 0.5, 5).name("Grain Scale");
  gui.add(uniforms.noiseFrequency, "value", 1.0, 10.0).name("Noise Frequency");
  gui
    .add(uniforms.sphereRotationSpeed, "value", 0.1, 2.0)
    .name("Rotation Speed"); // GUI for sphere rotation speed
}

function onWindowResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.iResolution.value.set(window.innerWidth, window.innerHeight);
}

function animate(timestamp) {
  uniforms.iTime.value = timestamp * 0.001;
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}