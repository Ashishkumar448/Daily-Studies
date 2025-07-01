import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { GUI } from "https://cdn.skypack.dev/dat.gui";

// MatCap texture URL
const matcapURL =
  "https://raw.githubusercontent.com/nidorx/matcaps/master/1024/1D2424_565F66_4E555A_646C6E.png";

let camera, scene, renderer, gui, matcapTexture, mesh, smallMesh, capturer;
let recording = false;

// Uniforms for the shader
let uniforms = {
  iResolution: {
    value: new THREE.Vector2(window.innerWidth, window.innerHeight)
  },
  iTime: { value: 0 },
  grainIntensity: { value: 0.2 },
  grainScale: { value: 2.0 },
  brightness: { value: 0.5 },
  contrast: { value: 2.0 },
  matcapTexture: { value: null } // MatCap texture
};

// Custom background color setting
let backgroundColor = {
  color: "#000000" // Default background color (black)
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
  camera.position.set(0, 0, 4);

  scene = new THREE.Scene();

  // Load MatCap texture
  const textureLoader = new THREE.TextureLoader();
  textureLoader.load(matcapURL, function (texture) {
    uniforms.matcapTexture.value = texture;
  });

  // Main object (larger object)
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = createShaderMaterial();
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Smaller object (scaled-down object)
  const smallGeometry = new THREE.PlaneGeometry(1, 1); // Smaller geometry
  const smallMaterial = createShaderMaterial(); // Reusing the same shader material
  smallMesh = new THREE.Mesh(smallGeometry, smallMaterial);
  smallMesh.position.set(1, 1, 0); // Adjust position so it's next to the main object
  scene.add(smallMesh);

  // Create a background plane for the background color, but exclude it from shading effects
  const backgroundGeometry = new THREE.PlaneGeometry(2, 2);
  const backgroundMaterial = new THREE.MeshBasicMaterial({
    color: backgroundColor.color
  });
  const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
  scene.add(backgroundMesh);
  backgroundMesh.position.z = -1; // Ensure it stays behind the shader

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  onWindowResize();
  window.addEventListener("resize", onWindowResize);

  setupGUI();
}

function createShaderMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: `
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      #define iterations 1
      #define flowintensity 1.25
      #define numOctaves 5
      #define flowoffset 0.25

      uniform vec2 iResolution;
      uniform float iTime;
      uniform float grainIntensity;
      uniform float grainScale;
      uniform float brightness;
      uniform float contrast;
      uniform sampler2D matcapTexture;

      float hash(vec3 p3) {
        p3  = fract(p3 * .1031);
        p3 += dot(p3, p3.zyx + 31.32);
        return (fract((p3.x + p3.y) * p3.z)-.5)*1.25;
      }

      vec4 noised(in vec3 x) {
        vec3 i = vec3(floor(x));
        vec3 w = fract(x);
        vec3 u = w*w*(3.0-2.0*w);
        vec3 du = 6.0*w*(1.0-w); 

        float a = hash(i+vec3(0,0,0));
        float b = hash(i+vec3(1,0,0));
        float c = hash(i+vec3(0,1,0));
        float d = hash(i+vec3(1,1,0));
        float e = hash(i+vec3(0,0,1));
        float f = hash(i+vec3(1,0,1));
        float g = hash(i+vec3(0,1,1));
        float h = hash(i+vec3(1,1,1));

        float k0 = a;
        float k1 = b - a;
        float k2 = c - a;
        float k3 = e - a;
        float k4 = a - b - c + d;
        float k5 = a - c - e + g;
        float k6 = a - b - e + f;
        float k7 = -a + b + c - d + e - f - g + h;

        return vec4( k0 + k1*u.x + k2*u.y + k3*u.z + k4*u.x*u.y + k5*u.y*u.z + k6*u.z*u.x + k7*u.x*u.y*u.z, 
                     du * vec3( k1 + k4*u.y + k6*u.z + k7*u.y*u.z,
                                k2 + k5*u.z + k4*u.x + k7*u.z*u.x,
                                k3 + k6*u.x + k5*u.y + k7*u.x*u.y ) );
      }

      vec4 fbm(vec3 x) {    
        float G = exp2(-1.);
        float f = 1.0;
        float a = 1.0;
        vec4 t = vec4(0.0);
        for (int i = 0; i<numOctaves; i++) {
            t += a*noised(x * f);
            f *= 1.15;
            a *= G;
        }
        return t;
      }

      float curl(vec3 p, vec3 n) {
        for (int i=0; i<iterations; i++) {
          vec3 x = p + flowoffset;
          vec3 g = cross(fbm(x).yzw, n);
          p -= (flowintensity / float(iterations)) * g;
        }
        return (fbm(p).x + 1.0) / 2.0;
      }

      float sdSphere(in vec3 p, in float r) {
        vec3 q = normalize(p);
        float k = curl(p + iTime * .265, q);
        return length(p) - r - k * .267;
      }

      vec3 applyGrain(vec2 uv) {
        vec2 grainUv = uv * grainScale;
        float grain = fract(sin(dot(grainUv, vec2(12.9898, 78.233))) * 43758.5453123) * grainIntensity;
        return vec3(grain);
      }

      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        vec2 uv = (fragCoord - .5 * iResolution.xy) / iResolution.y;
        vec3 ro = vec3(.0, .0, 1.95);
        vec3 rd = normalize(vec3(uv.x, uv.y, -1.0));
        vec3 col = vec3(1., .7, .4);
        float td = .0;

        for (int i = 0; i < 30; ++i) {
          vec3 p = ro + td * rd;
          float d = sdSphere(p, .5) * .9;
          td += d;
          if (d < .01) {
            vec3 q = normalize(p);
            col = texture(matcapTexture, q.xy * 0.5 + 0.5).rgb; // MatCap applied
            break;
          }
          if (td > 10.0)
            break;
        }

        // Convert to grayscale for black and white effect
        float gray = dot(col, vec3(0.299, 0.587, 0.114));
        col = vec3(gray);

        // Apply brightness and contrast (only to the object)
        col = (col - 0.5) * contrast + 0.65;
        col *= brightness;

        // Apply grain effect
        col += applyGrain(fragCoord.xy / iResolution);

        fragColor = vec4(col, 1.0);
      }

      void main() {
        mainImage(gl_FragColor, gl_FragCoord.xy);
      }
    `
  });
}

function setupGUI() {
  gui = new GUI();
  gui.add(uniforms.grainIntensity, "value", 0, 0.5).name("Grain Intensity");
  gui.add(uniforms.grainScale, "value", 0.5, 5).name("Grain Scale");
  gui.add(uniforms.brightness, "value", 0.5, 2).name("Brightness");
  gui.add(uniforms.contrast, "value", 0.5, 2).name("Contrast");
  gui
    .addColor(backgroundColor, "color")
    .name("Background Color")
    .onChange((color) => {
      scene.children[2].material.color.set(color); // Update background color (index adjusted for background mesh)
    });
  gui.add({ record: startRecording }, "record").name("Record MP4 Video"); // Button to start recording
}

function startRecording() {
  if (!recording) {
    // Ensure CCapture is loaded properly
    if (typeof CCapture !== "undefined") {
      capturer = new CCapture({ format: "webm", framerate: 60 });
      capturer.start();
      recording = true;
    } else {
      console.error("CCapture is not available.");
    }
  } else {
    capturer.stop();
    capturer.save();
    recording = false;
  }
}

function onWindowResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.iResolution.value.set(window.innerWidth, window.innerHeight);
}

function animate(timestamp) {
  uniforms.iTime.value = timestamp * 0.001;
  requestAnimationFrame(animate);
  renderer.render(scene, camera);

  if (recording && capturer) {
    capturer.capture(renderer.domElement);
  }
}