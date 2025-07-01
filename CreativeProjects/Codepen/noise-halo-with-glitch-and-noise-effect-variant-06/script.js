// Import necessary modules from Three.js and examples
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.124.0/build/three.module.js";
import { GUI } from "https://cdn.jsdelivr.net/npm/dat.gui/build/dat.gui.module.js";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/postprocessing/RenderPass.js";
import { GlitchPass } from "https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/postprocessing/GlitchPass.js";
import { FilmPass } from "https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/postprocessing/FilmPass.js";
import { UnrealBloomPass } from "https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/postprocessing/ShaderPass.js"; // Correct ShaderPass import

let scene, camera, renderer, shaderMaterial, clock, settings, gui;
let composer, renderPass, glitchPass, filmPass, bloomPass, chromaticAberrationPass;
let mouse = new THREE.Vector2(0, 0);
let raycaster = new THREE.Raycaster();
let mainShape;

init();
animate();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 1;
  clock = new THREE.Clock();

  settings = {
    shapeRadius: 0.5,
    noiseScale: 0.65,
    noiseStrength: 0.1,
    morphStrength: 0.5,
    cursorSize: 0.05,
    interactionProximity: 0.3,
    color1: "#ff43fe",
    color2: "#ffd200",
    color3: "#333333",
    cursorColor: "#ffffff",
    glitchIntensity: 0.05,
    noiseIntensity: 0.05,
    scanlineIntensity: 0.025,
    grayscale: false,
    glowIntensity: 0.6,
    glowSize: 0.1,
    bloomIntensity: 0.5, // Bloom effect intensity
    chromaticAberration: 0.005, // Chromatic Aberration intensity
  };

  shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      iTime: { value: 0.0 },
      iResolution: { value: new THREE.Vector3(window.innerWidth, window.innerHeight, 1) },
      shapeRadius: { value: settings.shapeRadius },
      noiseScale: { value: settings.noiseScale },
      noiseStrength: { value: settings.noiseStrength },
      morphStrength: { value: settings.morphStrength },
      color1: { value: new THREE.Color(settings.color1) },
      color2: { value: new THREE.Color(settings.color2) },
      color3: { value: new THREE.Color(settings.color3) },
      cursorColor: { value: new THREE.Color(settings.cursorColor) },
      cursorPosition: { value: new THREE.Vector2(0, 0) },
      cursorSize: { value: settings.cursorSize },
      interactionProximity: { value: settings.interactionProximity },
      glowIntensity: { value: settings.glowIntensity },
      glowSize: { value: settings.glowSize },
    },
    fragmentShader: `
      uniform float iTime;
      uniform vec3 iResolution;
      uniform float shapeRadius;
      uniform float noiseScale;
      uniform float noiseStrength;
      uniform float morphStrength;
      uniform vec3 color1;
      uniform vec3 color2;
      uniform vec3 color3;
      uniform vec3 cursorColor;
      uniform vec2 cursorPosition;
      uniform float cursorSize;
      uniform float interactionProximity;
      uniform float glowIntensity;
      uniform float glowSize;

      vec3 hash33(vec3 p3) {
        p3 = fract(p3 * vec3(.1031, .11369, .13787));
        p3 += dot(p3, p3.yxz + 19.19);
        return -1.0 + 2.0 * fract(vec3(p3.x + p3.y, p3.x + p3.z, p3.y + p3.z) * p3.zyx);
      }

      float snoise3(vec3 p) {
        const float K1 = 0.333333333;
        const float K2 = 0.166666667;

        vec3 i = floor(p + (p.x + p.y + p.z) * K1);
        vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);

        vec3 e = step(vec3(0.0), d0 - d0.yzx);
        vec3 i1 = e * (1.0 - e.zxy);
        vec3 i2 = 1.0 - e.zxy * (1.0 - e);

        vec3 d1 = d0 - (i1 - K2);
        vec3 d2 = d0 - (i2 - K1);
        vec3 d3 = d0 - 0.5;

        vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
        vec4 n = h * h * h * h * vec4(dot(d0, hash33(i)), dot(d1, hash33(i + i1)), dot(d2, hash33(i + i2)), dot(d3, hash33(i + 1.0)));

        return dot(vec4(31.316), n);
      }

      float sdfCircle(vec2 p, float r) {
        return length(p) - r;
      }

      vec3 vignette(vec3 color, vec2 uv, float strength) {
        float d = distance(uv, vec2(0.5));
        return mix(color, vec3(0.0), smoothstep(0.5, 1.0, d * strength));
      }

      vec3 dynamicBackground(vec2 uv) {
        float gradient = uv.y + sin(iTime) * 0.2;
        return mix(color3, color2, gradient);
      }

      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        vec2 uv = fragCoord.xy / iResolution.xy;
        vec2 p = (uv * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
        
        // Noise for shape movement
        float noise = snoise3(vec3(p * noiseScale, iTime * 0.5)) * noiseStrength;

        // Main shape without morphing for glow
        float baseShape = sdfCircle(p, shapeRadius);

        // Glow effect (separate from morphing)
        float glowShape = sdfCircle(p, shapeRadius + glowSize);
        float glowMask = smoothstep(0.01, -0.01, glowShape);
        vec3 glowColor = color1 * glowMask * glowIntensity;

        // Main shape with morphing and interaction
        float mainShape = sdfCircle(p, shapeRadius + noise);
        vec2 cursorP = (cursorPosition * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
        float cursorShape = sdfCircle(p - cursorP, cursorSize + noise * 0.5);
        float distToCursor = distance(p, cursorP);
        float interactionFactor = smoothstep(interactionProximity, 0.0, distToCursor);
        float combinedShape = mix(mainShape, min(mainShape, cursorShape), interactionFactor);
        combinedShape += interactionFactor * morphStrength * sin(distToCursor * 10.0 - iTime * 5.0) * 0.05;
        float shapeMask = smoothstep(0.01, -0.01, combinedShape);

        vec3 shapeColor = mix(color1, color2, interactionFactor);
        vec3 finalColor = mix(dynamicBackground(uv), shapeColor, shapeMask);
        finalColor = vignette(finalColor, uv, 1.5);

        // Add the glow color on top of the main shape
        finalColor += glowColor;

        // Add cursor color
        float cursorMask = smoothstep(0.01, -0.01, cursorShape);
        finalColor = mix(finalColor, cursorColor, cursorMask * 0.7);

        fragColor = vec4(finalColor, 1.0);
      }

      void main() {
        mainImage(gl_FragColor, gl_FragCoord.xy);
      }
    `,
  });

  const mainShapeGeometry = new THREE.PlaneBufferGeometry(2, 2);
  mainShape = new THREE.Mesh(mainShapeGeometry, shaderMaterial);
  mainShape.userData.interactive = true; // Mark as interactive
  scene.add(mainShape);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  composer = new EffectComposer(renderer);

  renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  glitchPass = new GlitchPass();
  glitchPass.goWild = false;
  composer.addPass(glitchPass);

  // Optional Bloom effect
  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    settings.bloomIntensity,
    0.4,
    0.85
  );
  composer.addPass(bloomPass);

  // Optional Chromatic Aberration Effect
  chromaticAberrationPass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      amount: { value: settings.chromaticAberration },
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
      uniform float amount;
      varying vec2 vUv;
      void main() {
        vec2 offset = amount * vec2(
          cos(2.0 * 3.14159265359 * vUv.y),
          sin(2.0 * 3.14159265359 * vUv.x)
        );
        vec4 color = vec4(
          texture2D(tDiffuse, vUv + offset).r,
          texture2D(tDiffuse, vUv).g,
          texture2D(tDiffuse, vUv - offset).b,
          1.0
        );
        gl_FragColor = color;
      }
    `,
  });
  composer.addPass(chromaticAberrationPass);

  filmPass = new FilmPass(
    settings.noiseIntensity,
    settings.scanlineIntensity,
    648,
    settings.grayscale
  );
  composer.addPass(filmPass);

  gui = new GUI();
  gui.add(settings, "shapeRadius", 0.1, 1.0).name("Shape Radius").onChange(updateShaderUniforms);
  gui.add(settings, "noiseScale", 0.1, 3.0).name("Noise Scale").onChange(updateShaderUniforms);
  gui.add(settings, "noiseStrength", 0.0, 0.5).name("Noise Strength").onChange(updateShaderUniforms);
  gui.add(settings, "morphStrength", 0.0, 10.0).name("Morph Strength").onChange(updateShaderUniforms);
  gui.add(settings, "cursorSize", 0.01, 0.1).name("Cursor Size").onChange(updateShaderUniforms);
  gui.add(settings, "interactionProximity", 0.1, 1.0).name("Interaction Proximity").onChange(updateShaderUniforms);
  gui.addColor(settings, "color1").name("Shape Color").onChange(updateShaderUniforms);
  gui.addColor(settings, "color2").name("Morph Color").onChange(updateShaderUniforms);
  gui.addColor(settings, "color3").name("Background Color").onChange(updateShaderUniforms);
  gui.addColor(settings, "cursorColor").name("Cursor Color").onChange(updateShaderUniforms);
  gui.add(settings, "glitchIntensity", 0, 0.1).name("Glitch Intensity").onChange(updateGlitchEffect);
  gui.add(settings, "noiseIntensity", 0, 0.5).name("Noise Intensity").onChange(updateNoiseEffect);
  gui.add(settings, "scanlineIntensity", 0, 0.1).name("Scanline Intensity").onChange(updateNoiseEffect);
  gui.add(settings, "grayscale").name("Grayscale").onChange(updateNoiseEffect);
  gui.add(settings, "glowIntensity", 0, 1).name("Glow Intensity").onChange(updateShaderUniforms);
  gui.add(settings, "glowSize", 0, 0.5).name("Glow Size").onChange(updateShaderUniforms);
  gui.add(settings, "bloomIntensity", 0, 2).name("Bloom Intensity").onChange(() => bloomPass.strength = settings.bloomIntensity);
  gui.add(settings, "chromaticAberration", 0, 0.01).name("Chromatic Aberration").onChange(() => chromaticAberrationPass.uniforms.amount.value = settings.chromaticAberration);

  window.addEventListener("mousemove", onMouseMove, false);
  window.addEventListener("resize", onWindowResize, false);

  onWindowResize();
}

function updateShaderUniforms() {
  shaderMaterial.uniforms.shapeRadius.value = settings.shapeRadius;
  shaderMaterial.uniforms.noiseScale.value = settings.noiseScale;
  shaderMaterial.uniforms.noiseStrength.value = settings.noiseStrength;
  shaderMaterial.uniforms.morphStrength.value = settings.morphStrength;
  shaderMaterial.uniforms.cursorSize.value = settings.cursorSize;
  shaderMaterial.uniforms.interactionProximity.value = settings.interactionProximity;
  shaderMaterial.uniforms.color1.value.set(settings.color1);
  shaderMaterial.uniforms.color2.value.set(settings.color2);
  shaderMaterial.uniforms.color3.value.set(settings.color3);
  shaderMaterial.uniforms.cursorColor.value.set(settings.cursorColor);
  shaderMaterial.uniforms.glowIntensity.value = settings.glowIntensity;
  shaderMaterial.uniforms.glowSize.value = settings.glowSize;
}

function updateGlitchEffect() {
  glitchPass.curF = 1;
  glitchPass.randX = settings.glitchIntensity * 0.1;
}

function updateNoiseEffect() {
  filmPass.uniforms.nIntensity.value = settings.noiseIntensity;
  filmPass.uniforms.sIntensity.value = settings.scanlineIntensity;
  filmPass.uniforms.grayscale.value = settings.grayscale;
}

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children);

  // Change cursor style when hovering over the interactive shape
  if (intersects.length > 0 && intersects[0].object.userData.interactive) {
    document.body.style.cursor = 'pointer';
  } else {
    document.body.style.cursor = 'default';
  }

  shaderMaterial.uniforms.cursorPosition.value.set(
    (event.clientX / window.innerWidth),
    1 - (event.clientY / window.innerHeight)
  );
}

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.left = -1;
  camera.right = 1;
  camera.top = 1;
  camera.bottom = -1;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  composer.setSize(width, height);

  shaderMaterial.uniforms.iResolution.value.set(width, height, 1);
}

function animate() {
  requestAnimationFrame(animate);
  shaderMaterial.uniforms.iTime.value = clock.getElapsedTime();
  composer.render();
}