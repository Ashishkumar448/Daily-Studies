import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { GUI } from "https://cdn.jsdelivr.net/npm/dat.gui@0.7.9/build/dat.gui.module.js";

let container, camera, scene, renderer;
let uniforms;
let guiOptions = {
  blackAndWhite: false,
  grainStrength: 0.1,
  grainIntensity: 0.5,
  squareBorders: true
};

init();
animate();

function init() {
  // Create a container to hold the canvas
  container = document.createElement("div");
  document.body.appendChild(container);

  // Create the camera
  camera = new THREE.Camera();
  camera.position.z = 1;

  // Create the scene
  scene = new THREE.Scene();

  // Define uniforms for the shader
  uniforms = {
    iTime: { value: 0 },
    iResolution: {
      value: new THREE.Vector3(window.innerWidth, window.innerHeight, 1)
    },
    iMouse: { value: new THREE.Vector2() },
    uBlackAndWhite: { value: guiOptions.blackAndWhite },
    uGrainStrength: { value: guiOptions.grainStrength },
    uGrainIntensity: { value: guiOptions.grainIntensity },
    uSquareBorders: { value: guiOptions.squareBorders }
  };

  // Create a PlaneGeometry with a ShaderMaterial
  const geometry = new THREE.PlaneBufferGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    fragmentShader: fragmentShader()
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Set up the renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // Update resolution when window resizes
  onWindowResize();
  window.addEventListener("resize", onWindowResize, false);

  // Handle mouse movement with clamping
  document.addEventListener("mousemove", (event) => {
    let mouseX = event.clientX;
    let mouseY = window.innerHeight - event.clientY;

    // Clamp the mouse values to keep them within the canvas boundary
    mouseX = Math.max(0, Math.min(window.innerWidth, mouseX));
    mouseY = Math.max(0, Math.min(window.innerHeight, mouseY));

    uniforms.iMouse.value.x = mouseX;
    uniforms.iMouse.value.y = mouseY;
  });

  // dat.GUI for user controls
  const gui = new GUI();
  gui
    .add(guiOptions, "blackAndWhite")
    .name("Black & White")
    .onChange((value) => {
      uniforms.uBlackAndWhite.value = value;
    });
  gui
    .add(guiOptions, "grainStrength", 0, 1)
    .name("Grain Strength")
    .onChange((value) => {
      uniforms.uGrainStrength.value = value;
    });
  gui
    .add(guiOptions, "grainIntensity", 0, 2)
    .name("Grain Intensity")
    .onChange((value) => {
      uniforms.uGrainIntensity.value = value;
    });
  gui
    .add(guiOptions, "squareBorders")
    .name("Square Borders")
    .onChange((value) => {
      uniforms.uSquareBorders.value = value;
    });
}

function onWindowResize() {
  uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  uniforms.iTime.value += 0.05;
  renderer.render(scene, camera);
}

function fragmentShader() {
  return `
    uniform float iTime;
    uniform vec2 iMouse;
    uniform vec3 iResolution;
    uniform bool uBlackAndWhite;
    uniform float uGrainStrength;
    uniform float uGrainIntensity;
    uniform bool uSquareBorders;

    #define M_PI 3.1415926535897932384626433832795
    #define M_TWO_PI (2.0 * M_PI)

    float rand(vec2 n) {
        return fract(sin(dot(n, vec2(12.9898,12.1414))) * 83758.5453);
    }

    float noise(vec2 n) {
        const vec2 d = vec2(0.0, 1.0);
        vec2 b = floor(n);
        vec2 f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
        return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
    }

    vec3 ramp(float t) {
        return t <= .5 ? vec3( 1. - t * 1.4, .2, 1.05 ) / t : vec3( .3 * (1. - t) * 2., .2, 1.05 ) / t;
    }

    vec2 polarMap(vec2 uv, float shift, float inner) {
        uv = vec2(0.5) - uv;
        float px = 1.0 - fract(atan(uv.y, uv.x) / 6.28 + 0.25) + shift;
        float shape = uSquareBorders ? max(abs(uv.x), uv.y) : sqrt(uv.x * uv.x + uv.y * uv.y);
        float squircle = length(uv * uv * uv * 4.);
        float py = (squircle * (1.0 + inner * 2.0) - inner) * 2.0;
        return vec2(px, py);
    }

    float fire(vec2 n) {
        return noise(n) + noise(n * 2.1) * .6 + noise(n * 5.4) * .42;
    }

    float shade(vec2 uv, float t) {
        uv.x += uv.y < .5 ? 23.0 + t * .035 : -11.0 + t * .03;    
        uv.y = abs(uv.y - .5);
        uv.x *= 35.0;
        float q = fire(uv - t * .013) / 2.0;
        vec2 r = vec2(fire(uv + q / 2.0 + t - uv.x - uv.y), fire(uv + q - t));
        return pow((r.y + r.y) * max(.0, uv.y) + .1, 4.0);
    }

    vec3 applyGrain(vec3 color, vec2 uv) {
        float grain = noise(uv * iResolution.xy) * uGrainStrength;
        return color + vec3(grain) * uGrainIntensity;
    }

    vec3 applyBlackAndWhite(vec3 color) {
        return vec3(dot(color, vec3(0.3, 0.59, 0.11)));
    }

    vec3 color(float grad, vec2 uv) {
        float m2 = iMouse.y * 3.0 / iResolution.y;
        grad = sqrt(grad);
        vec3 color = ramp(grad);
        color /= (m2 + max(vec3(0), color));

        // Apply grain effect
        color = applyGrain(color, uv);

        // Apply black & white toggle
        if (uBlackAndWhite) {
            color = applyBlackAndWhite(color);
        }

        return color;
    }

    void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        float m1 = iMouse.x * 5.0 / iResolution.x;
        float t = iTime;
        vec2 uv = fragCoord.xy / iResolution.xy;
        float ff = 1.0 - uv.y;
        vec2 uv2 = uv;
        uv2.y = 1.0 - uv2.y;
        uv = polarMap(uv, 1.3, m1);
        uv2 = polarMap(uv2, 1.9, m1);
        vec3 c1 = color(shade(uv, t), uv) * ff;
        vec3 c2 = color(shade(uv2, t), uv2) * (1.0 - ff);
        fragColor = vec4(c1 + c2, 1.0);
    }

    void main() {
        mainImage(gl_FragColor, gl_FragCoord.xy);
    }
    `;
}