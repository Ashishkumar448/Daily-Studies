import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/UnrealBloomPass.js";
import * as BufferGeometryUtils from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/utils/BufferGeometryUtils.js";
import { GUI } from "https://cdn.skypack.dev/dat.gui";

let scene, camera, renderer;
let composer, bloomPass, volumetricLightPass, noisePass, blackAndWhitePass;
let clock, controls, marker, pointCloud;
let mousePos = new THREE.Vector3();
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let isMouseControlled = false;
let lastMouseMoveTime = 0;
let orbitAngle = 1;
let orbitRadius = 2;
let blackAndWhiteMode = false;
let ambient, directionalLight;

init();
animate();

function init() {
  // Scene setup
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(0, 0, 10);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 1);
  document.body.appendChild(renderer.domElement);

  scene.fog = new THREE.FogExp2(0x11111f, 0.002);
  renderer.setClearColor(scene.fog.color);

  clock = new THREE.Clock();

  controls = new OrbitControls(camera, renderer.domElement);

  // Lighting
  ambient = new THREE.AmbientLight(0x555555);
  scene.add(ambient);

  directionalLight = new THREE.DirectionalLight(0xffeedd);
  directionalLight.position.set(0, 0, 1);
  scene.add(directionalLight);

  // Marker (sphere)
  const markerGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  const markerMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 }
    },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec3 vNormal;
      void main() {
        vec3 color = vec3(0.8, 0.2, 0.2);
        float pulse = sin(time * 2.0) * 0.5 + 0.5;
        color *= pulse;
        color += pow(max(dot(vNormal, vec3(0, 0, 1)), 0.0), 2.0) * 0.5;
        gl_FragColor = vec4(color, 1.0);
      }
    `
  });
  marker = new THREE.Mesh(markerGeometry, markerMaterial);
  marker.position.set(orbitRadius, 0, 0);
  scene.add(marker);

  // Icosahedron Point Cloud
  let geometry = new THREE.IcosahedronGeometry(4, 20);
  geometry = BufferGeometryUtils.mergeVertices(geometry);

  const pointsMaterial = new THREE.PointsMaterial({
    size: 0.05,
    color: 0x88ccee,
    onBeforeCompile: (shader) => {
      shader.uniforms.markerPos = { value: marker.position };
      shader.uniforms.time = { value: 0 };
      shader.vertexShader = `
        uniform vec3 markerPos;
        uniform float time;
        ${shader.vertexShader}
      `.replace(
        `#include <begin_vertex>`,
        `#include <begin_vertex>
        vec3 seg = position - markerPos;
        vec3 dir = normalize(seg);
        float dist = length(seg);
        if (dist < 2.){
          float force = clamp(1. / (dist * dist), 0., 1.);
          transformed += dir * force;
        }
        transformed.y += sin(time + position.x * 0.5) * 0.1;
        `
      );
    }
  });

  pointCloud = new THREE.Points(geometry, pointsMaterial);
  scene.add(pointCloud);

  // Post-processing setup
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
  );
  composer.addPass(bloomPass);

  volumetricLightPass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      lightPosition: { value: new THREE.Vector2(0.5, 0.5) },
      exposure: { value: 0.1 },
      decay: { value: 0.96 },
      density: { value: 0.54 },
      weight: { value: 0.17 },
      samples: { value: 100 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform vec2 lightPosition;
      uniform float exposure;
      uniform float decay;
      uniform float density;
      uniform float weight;
      uniform int samples;
      varying vec2 vUv;

      void main() {
        vec2 texCoord = vUv;
        vec2 deltaTextCoord = texCoord - lightPosition;
        deltaTextCoord *= 1.0 / float(samples) * density;
        vec4 color = texture2D(tDiffuse, texCoord);
        float illuminationDecay = 1.0;

        for(int i=0; i < 100; i++) {
          texCoord -= deltaTextCoord;
          vec4 sampleColor = texture2D(tDiffuse, texCoord);
          sampleColor *= illuminationDecay * weight;
          color += sampleColor;
          illuminationDecay *= decay;
        }
        gl_FragColor = color * exposure;
      }
    `
  });
  composer.addPass(volumetricLightPass);

  noisePass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      noiseIntensity: { value: 0.05 },
      noiseSize: { value: 4.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float noiseIntensity;
      uniform float noiseSize;
      varying vec2 vUv;

      float random(vec2 n) { 
        return fract(sin(dot(n, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        vec2 uvs = vUv * noiseSize;
        vec3 noise = vec3(random(uvs + 0.01)) * noiseIntensity;
        color.rgb += noise;
        gl_FragColor = color;
      }
    `
  });
  composer.addPass(noisePass);

  blackAndWhitePass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      varying vec2 vUv;
      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        gl_FragColor = vec4(vec3(gray), color.a);
      }
    `
  });

  // GUI setup
  const gui = new GUI();
  const bloomFolder = gui.addFolder("Bloom Settings");
  bloomFolder.add(bloomPass, "strength", 0, 3, 0.1).name("Strength");
  bloomFolder.add(bloomPass, "radius", 0, 1, 0.01).name("Radius");
  bloomFolder.add(bloomPass, "threshold", 0, 1, 0.01).name("Threshold");
  bloomFolder.open();

  const volumetricLightFolder = gui.addFolder("Volumetric Light Settings");
  volumetricLightFolder
    .add(volumetricLightPass.uniforms.exposure, "value", 0.0, 1.0)
    .name("Exposure");
  volumetricLightFolder
    .add(volumetricLightPass.uniforms.decay, "value", 0.8, 1.0)
    .name("Decay");
  volumetricLightFolder
    .add(volumetricLightPass.uniforms.density, "value", 0.0, 1.0)
    .name("Density");
  volumetricLightFolder
    .add(volumetricLightPass.uniforms.weight, "value", 0.0, 1.0)
    .name("Weight");
  volumetricLightFolder.open();

  const noiseFolder = gui.addFolder("Noise Settings");
  noiseFolder
    .add(noisePass.uniforms.noiseIntensity, "value", 0, 0.2)
    .name("Noise Intensity");
  noiseFolder
    .add(noisePass.uniforms.noiseSize, "value", 1, 10)
    .name("Noise Size");
  noiseFolder.open();

  gui
    .add({ blackAndWhite: false }, "blackAndWhite")
    .name("Black & White Mode")
    .onChange((value) => {
      blackAndWhiteMode = value;
      if (value) {
        composer.addPass(blackAndWhitePass);
      } else {
        composer.removePass(blackAndWhitePass);
      }
    });

  window.addEventListener("resize", onWindowResize, false);
  window.addEventListener("mousemove", onMouseMove, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersection = raycaster.intersectObject(pointCloud);

  if (intersection.length > 0) {
    mousePos.copy(intersection[0].point);
    isMouseControlled = true;
    lastMouseMoveTime = Date.now();
  }

  volumetricLightPass.uniforms.lightPosition.value.set(
    event.clientX / window.innerWidth,
    1 - event.clientY / window.innerHeight
  );
}

function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();

  // Update marker rotation and position
  if (isMouseControlled) {
    marker.position.lerp(mousePos, 0.1); // Faster lerp for quicker response
    if (Date.now() - lastMouseMoveTime > 1000) {
      // Short delay before returning to auto-rotation
      isMouseControlled = false;
      orbitAngle = Math.atan2(marker.position.y, marker.position.x);
      orbitRadius = Math.sqrt(marker.position.x ** 2 + marker.position.y ** 2);
      orbitRadius = Math.min(Math.max(orbitRadius, 1), 4); // Constrain orbit radius
    }
  } else {
    orbitAngle += 0.01;
    let newX = Math.cos(orbitAngle) * orbitRadius;
    let newY = Math.sin(orbitAngle) * orbitRadius;

    marker.position.set(newX, newY, marker.position.z);
  }

  marker.rotation.x = time * 0.5;
  marker.rotation.y = time * 0.3;

  // Update shader uniforms
  marker.material.uniforms.time.value = time;
  if (pointCloud.material.userData.shader) {
    pointCloud.material.userData.shader.uniforms.markerPos.value.copy(
      marker.position
    );
    pointCloud.material.userData.shader.uniforms.time.value = time;
  }

  controls.update();
  composer.render();
}