import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/ShaderPass.js";
import { BokehPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/BokehPass.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

const sphereGeometry = new THREE.SphereGeometry(1, 512, 512);

const vertexShader = `
    uniform float time;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    float noise(vec3 p) {
        // Implement a 3D noise function here
        // This is a placeholder and should be replaced with a proper noise function
        return fract(sin(dot(p, vec3(12.9898, 78.233, 45.5432))) * 43758.5453);
    }

    void main() {
        vUv = uv;
        vNormal = normal;
        vPosition = position;

        float displacement = noise(position * 5.0 + time * 0.1) * 0.1;
        vec3 newPosition = position + normal * displacement;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
`;

const fragmentShader = `
    uniform float time;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    float noise(vec3 p) {
        // Same noise function as in vertex shader
        return fract(sin(dot(p, vec3(12.9898, 78.233, 45.5432))) * 43758.5453);
    }

    void main() {
        vec3 light = normalize(vec3(1.0, 1.0, 1.0));
        float dProd = max(0.0, dot(vNormal, light));

        // Create contour lines
        float n = noise(vPosition * 10.0 + time * 0.1);
        float line = smoothstep(0.0, 0.1, abs(fract(n * 20.0) - 0.5));

        // Combine lighting and contours
        vec3 color = vec3(dProd * line);

        // Add some variation
        color *= 0.8 + 0.2 * noise(vPosition * 20.0);

        gl_FragColor = vec4(color, 1.0);
    }
`;

const material = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 }
  },
  vertexShader,
  fragmentShader
});

const sphere = new THREE.Mesh(sphereGeometry, material);
scene.add(sphere);

camera.position.z = 2;

// Post-processing
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// Depth of Field
const bokehPass = new BokehPass(scene, camera, {
  focus: 2.0,
  aperture: 0.005,
  maxblur: 0.01
});
composer.addPass(bokehPass);

// Film Grain and Vignette
// Film Grain and Vignette
const filmShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    nIntensity: { value: 0.5 },
    sIntensity: { value: 0.05 },
    sCount: { value: 4096 },
    grayscale: { value: 0 }
  },
  vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
  fragmentShader: `
        uniform float time;
        uniform float nIntensity;
        uniform float sIntensity;
        uniform float sCount;
        uniform bool grayscale;
        uniform sampler2D tDiffuse;
        varying vec2 vUv;

        float rand(vec2 co) {
            return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
            vec4 cTextureScreen = texture2D(tDiffuse, vUv);
            float dx = rand(vUv + time);
            vec3 cResult = cTextureScreen.rgb + cTextureScreen.rgb * clamp(0.1 + dx, 0.0, 1.0);
            vec2 sc = vec2(sin(vUv.y * sCount), cos(vUv.y * sCount));
            cResult += cTextureScreen.rgb * vec3(sc.x, sc.y, sc.x) * sIntensity;
            cResult = cTextureScreen.rgb + clamp(nIntensity, 0.0, 1.0) * (cResult - cTextureScreen.rgb);
            if(grayscale) {
                cResult = vec3(cResult.r * 0.3 + cResult.g * 0.59 + cResult.b * 0.11);
            }
            gl_FragColor = vec4(cResult, cTextureScreen.a);
        }
    `
};

const filmPass = new ShaderPass(filmShader);
composer.addPass(filmPass);

function animate(time) {
  requestAnimationFrame(animate);

  time *= 0.001; // convert to seconds

  sphere.material.uniforms.time.value = time;
  filmPass.uniforms.time.value = time;

  controls.update();
  composer.render();
}

animate(0);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});