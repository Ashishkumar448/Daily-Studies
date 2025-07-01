import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { GUI } from "https://cdn.skypack.dev/dat.gui";

let camera, scene, renderer, gui;
let matcapTexture;
let uniforms = {
  iResolution: { value: new THREE.Vector2() },
  iMouse: { value: new THREE.Vector2() },
  iTime: { value: 0 },
  grainIntensity: { value: 0.2 },
  grainScale: { value: 2.0 },
  m1: { value: 8.0 },
  n11: { value: 0.2 },
  n12: { value: 1.7 },
  n13: { value: 1.7 },
  m2: { value: 8.0 },
  n21: { value: 0.2 },
  n22: { value: 1.7 },
  n23: { value: 1.7 },
  matcap: { value: null } // Matcap uniform
};

init();
animate();

function init() {
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene = new THREE.Scene();

  const geometry = new THREE.PlaneGeometry(2, 2);

  // Load the Matcap Texture
  const textureLoader = new THREE.TextureLoader();
  matcapTexture = textureLoader.load(
    "https://raw.githubusercontent.com/nidorx/matcaps/master/1024/0A0A0A_A9A9A9_525252_747474.png",
    () => {
      uniforms.matcap.value = matcapTexture; // Pass matcap texture to the shader
    }
  );

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
      uniform float m1, n11, n12, n13, m2, n21, n22, n23;
      uniform sampler2D matcap;

      float supershape(float theta, float m, float n1, float n2, float n3) {
          float t1 = abs(cos(m * theta / 4.0));
          t1 = pow(t1, n2);
          float t2 = abs(sin(m * theta / 4.0));
          t2 = pow(t2, n3);
          float r = pow(t1 + t2, -1.0 / n1);
          return r;
      }

      float distanceToSupershape(vec3 p) {
          float phi = atan(p.z, p.x);
          float r1 = supershape(phi, m1, n11, n12, n13);

          float theta = atan(p.y, length(vec2(p.x, p.z)));
          float r2 = supershape(theta, m2, n21, n22, n23);

          float r = r1 * r2;
          vec3 ss = vec3(r * cos(theta) * cos(phi), r * sin(theta), r * cos(theta) * sin(phi));

          return length(p - ss);
      }

      // Binary search to refine intersection point
      vec3 binaryMarch(vec3 ro, vec3 rd) {
          float tMin = 0.0;
          float tMax = 50.0;
          vec3 hitPoint;

          for (int i = 0; i < 50; i++) {  // 50 binary iterations for precision
              float tMid = (tMin + tMax) / 42.0;
              hitPoint = ro + tMid * rd;
              float dist = distanceToSupershape(hitPoint);
              if (dist < 0.001) {  // Precision threshold
                  tMax = tMid;
              } else {
                  tMin = tMid;
              }
          }

          return hitPoint;
      }

      // Calculate normal by using a small epsilon offset
      vec3 getNormal(vec3 p) {
          float eps = 0.1;
          vec3 n;
          n.x = distanceToSupershape(p + vec3(eps, 0, 0)) - distanceToSupershape(p - vec3(eps, 0, 0));
          n.y = distanceToSupershape(p + vec3(0, eps, 0)) - distanceToSupershape(p - vec3(0, eps, 0));
          n.z = distanceToSupershape(p + vec3(0, 0, eps)) - distanceToSupershape(p - vec3(0, 0, eps));
          return normalize(n);
      }

      // Use the normal to apply the matcap texture
      vec4 applyMatcap(vec3 normal) {
          vec3 r = reflect(vec3(0, 0, 1), normal);  // Reflected vector
          float m = 2.828427 * sqrt(r.z + 1.0);      // For spherical projection
          vec2 uv = r.xy / m + 0.5;                 // Convert to matcap texture UV
          return texture2D(matcap, uv);
      }

      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
          vec2 uv = fragCoord.xy / iResolution.xy * 2.0 - 1.0;
          uv.x *= iResolution.x / iResolution.y;

          vec3 ro = vec3(0.0, 0.0, 2.0);  // Camera position
          vec3 rd = normalize(vec3(uv, -1.0));  // Ray direction

          vec3 p = binaryMarch(ro, rd);  // Find intersection point with binary search
          vec3 normal = getNormal(p);    // Get the surface normal at the intersection point

          // Apply matcap texture based on the surface normal
          vec4 matcapColor = applyMatcap(normal);

          // Grain effect
          vec2 grainUv = fragCoord * grainScale / iResolution.xy;
          float grain = fract(sin(dot(grainUv, vec2(12.9898, 78.233))) * 43758.5453123) * grainIntensity;
          vec3 color = clamp(matcapColor.rgb + grain - grainIntensity * 0.5, 0.0, 1.0);

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
}

function onWindowResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.iResolution.value.set(window.innerWidth, window.innerHeight);
}

function animate(timestamp) {
  const timeInSeconds = timestamp * 0.001;

  // Animate the supershape parameters in JavaScript, not in the shader
  uniforms.m1.value = 8.0 + 2.0 * Math.sin(timeInSeconds * 0.5);
  uniforms.m2.value = 8.0 + 2.0 * Math.cos(timeInSeconds * 0.7);
  uniforms.n11.value = 0.2 + 0.5 * Math.cos(timeInSeconds * 0.5);
  uniforms.n12.value = 1.7 + 0.5 * Math.sin(timeInSeconds * 0.4);
  uniforms.n13.value = 1.7 + 0.5 * Math.cos(timeInSeconds * 0.3);
  uniforms.n21.value = 0.2 + 0.5 * Math.sin(timeInSeconds * 0.6);
  uniforms.n22.value = 1.7 + 0.5 * Math.cos(timeInSeconds * 0.5);
  uniforms.n23.value = 1.7 + 0.5 * Math.sin(timeInSeconds * 0.7);

  uniforms.iTime.value = timeInSeconds;

  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}