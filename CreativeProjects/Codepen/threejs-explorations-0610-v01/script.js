import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { EffectComposer } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/ShaderPass.js";
import { GUI } from "https://cdn.skypack.dev/dat.gui";

let scene, camera, renderer, composer, lookingGlassPass, backgroundTexture;

const PARAMS = {
  lookingGlass: {
    radius: 0.15,
    magnification: 1.5,
    edgeThickness: 0.01,
    ior: 1.5,
    chromaticAberration: 0.02,
    distortion: 0.1,
    reflectionStrength: 0.3,
    refractionStrength: 0.8,
    highlightIntensity: 0.3,
    highlightSharpness: 5.0,
    grainStrength: 0.15,
    bevelWidth: 0.0,
    bevelStrength: 0.0
  }
};

function init() {
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 1;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  loadBackgroundTexture();
  setupPostProcessing();
  setupGUI();

  window.addEventListener("resize", onWindowResize, false);
  document.addEventListener("mousemove", onMouseMove, false);

  animate();
}

function loadBackgroundTexture() {
  const loader = new THREE.TextureLoader();
  loader.load(
    "https://images.unsplash.com/photo-1591871107448-22bc32cc37b8?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    (texture) => {
      backgroundTexture = texture;
      updateBackgroundSize();
    }
  );
}

function updateBackgroundSize() {
  if (backgroundTexture) {
    backgroundTexture.matrixAutoUpdate = false;
    const aspect = window.innerWidth / window.innerHeight;
    const imageAspect =
      backgroundTexture.image.width / backgroundTexture.image.height;
    if (aspect < imageAspect) {
      backgroundTexture.matrix.setUvTransform(
        0,
        0,
        aspect / imageAspect,
        1,
        0,
        0.5,
        0.5
      );
    } else {
      backgroundTexture.matrix.setUvTransform(
        0,
        0,
        1,
        imageAspect / aspect,
        0,
        0.5,
        0.5
      );
    }
    scene.background = backgroundTexture;
  }
}

function setupPostProcessing() {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const vertexShader = `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `;

  const fragmentShader = `
                uniform sampler2D tDiffuse;
                uniform vec2 uMouse;
                uniform vec2 uResolution;
                uniform float uRadius;
                uniform float uMagnification;
                uniform float uEdgeThickness;
                uniform float uIOR;
                uniform float uChromaticAberration;
                uniform float uDistortion;
                uniform float uReflectionStrength;
                uniform float uRefractionStrength;
                uniform float uHighlightIntensity;
                uniform float uHighlightSharpness;
                uniform float uGrainStrength;
                uniform float uBevelWidth;
                uniform float uBevelStrength;
                uniform float uTime;
                varying vec2 vUv;

                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }

                vec2 distort(vec2 uv, vec2 center, float radius, float strength) {
                    vec2 dir = uv - center;
                    float dist = length(dir);
                    float factor = pow(smoothstep(0.0, radius, dist), 0.5 + strength);
                    return center + dir * factor;
                }

                void main() {
                    vec2 uv = vUv;
                    vec2 mouseUV = uMouse;
                    vec2 centerUV = uv - mouseUV;
                    float aspect = uResolution.x / uResolution.y;
                    centerUV.x *= aspect;

                    float dist = length(centerUV);
                    float radius = uRadius;

                    if (dist < radius) {
                        // Refraction
                        float refractionFactor = 1.0 - smoothstep(0.0, radius, dist);
                        vec2 refractionOffset = centerUV * (1.0 - 1.0 / uIOR) * uRefractionStrength * refractionFactor;
                        
                        // Magnification and distortion
                        vec2 magnifiedUV = mouseUV + centerUV / uMagnification;
                        vec2 distortedUV = distort(magnifiedUV, mouseUV, radius, uDistortion);

                        // Chromatic aberration
                        float aberrationStrength = uChromaticAberration * (1.0 - dist / radius);
                        vec4 colorR = texture2D(tDiffuse, distortedUV + refractionOffset + aberrationStrength * centerUV);
                        vec4 colorG = texture2D(tDiffuse, distortedUV + refractionOffset);
                        vec4 colorB = texture2D(tDiffuse, distortedUV + refractionOffset - aberrationStrength * centerUV);
                        
                        vec4 refractedColor = vec4(colorR.r, colorG.g, colorB.b, 1.0);

                        // Reflection
                        vec2 reflectionUV = uv + centerUV * 2.0;
                        vec4 reflectionColor = texture2D(tDiffuse, reflectionUV);

                        // Combine refraction and reflection
                        float reflectionFactor = smoothstep(0.0, radius, dist) * uReflectionStrength;
                        vec4 glassColor = mix(refractedColor, reflectionColor, reflectionFactor);

                        // Edge highlight
                        float edgeFactor = smoothstep(radius - uEdgeThickness, radius, dist);
                        float highlightFactor = pow(1.0 - abs(dot(normalize(centerUV), vec2(0.0, 1.0))), uHighlightSharpness) * uHighlightIntensity;
                        vec3 highlight = vec3(1.0) * edgeFactor * highlightFactor;

                        // Bevel effect
                        float bevelFactor = smoothstep(radius - uBevelWidth, radius, dist) * uBevelStrength;
                        glassColor.rgb = mix(glassColor.rgb, vec3(1.0), bevelFactor);

                        // Grain effect
                        float grain = random(uv + sin(uTime)) * uGrainStrength;
                        glassColor.rgb += vec3(grain);

                        gl_FragColor = vec4(glassColor.rgb + highlight, 1.0);
                    } else {
                        gl_FragColor = texture2D(tDiffuse, uv);
                    }
                }
            `;

  lookingGlassPass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight)
      },
      uRadius: { value: PARAMS.lookingGlass.radius },
      uMagnification: { value: PARAMS.lookingGlass.magnification },
      uEdgeThickness: { value: PARAMS.lookingGlass.edgeThickness },
      uIOR: { value: PARAMS.lookingGlass.ior },
      uChromaticAberration: { value: PARAMS.lookingGlass.chromaticAberration },
      uDistortion: { value: PARAMS.lookingGlass.distortion },
      uReflectionStrength: { value: PARAMS.lookingGlass.reflectionStrength },
      uRefractionStrength: { value: PARAMS.lookingGlass.refractionStrength },
      uHighlightIntensity: { value: PARAMS.lookingGlass.highlightIntensity },
      uHighlightSharpness: { value: PARAMS.lookingGlass.highlightSharpness },
      uGrainStrength: { value: PARAMS.lookingGlass.grainStrength },
      uBevelWidth: { value: PARAMS.lookingGlass.bevelWidth },
      uBevelStrength: { value: PARAMS.lookingGlass.bevelStrength },
      uTime: { value: 0 }
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
  });
  composer.addPass(lookingGlassPass);
}

function setupGUI() {
  const gui = new GUI();
  const folder = gui.addFolder("Looking Glass");
  folder
    .add(PARAMS.lookingGlass, "radius", 0.05, 0.5)
    .onChange((value) => (lookingGlassPass.uniforms.uRadius.value = value));
  folder
    .add(PARAMS.lookingGlass, "magnification", 1, 3)
    .onChange(
      (value) => (lookingGlassPass.uniforms.uMagnification.value = value)
    );
  folder
    .add(PARAMS.lookingGlass, "edgeThickness", 0, 0.05)
    .onChange(
      (value) => (lookingGlassPass.uniforms.uEdgeThickness.value = value)
    );
  folder
    .add(PARAMS.lookingGlass, "ior", 1, 2)
    .onChange((value) => (lookingGlassPass.uniforms.uIOR.value = value));
  folder
    .add(PARAMS.lookingGlass, "chromaticAberration", 0, 0.05)
    .onChange(
      (value) => (lookingGlassPass.uniforms.uChromaticAberration.value = value)
    );
  folder
    .add(PARAMS.lookingGlass, "distortion", 0, 1)
    .onChange((value) => (lookingGlassPass.uniforms.uDistortion.value = value));
  folder
    .add(PARAMS.lookingGlass, "reflectionStrength", 0, 1)
    .onChange(
      (value) => (lookingGlassPass.uniforms.uReflectionStrength.value = value)
    );
  folder
    .add(PARAMS.lookingGlass, "refractionStrength", 0, 1)
    .onChange(
      (value) => (lookingGlassPass.uniforms.uRefractionStrength.value = value)
    );
  folder
    .add(PARAMS.lookingGlass, "highlightIntensity", 0, 1)
    .onChange(
      (value) => (lookingGlassPass.uniforms.uHighlightIntensity.value = value)
    );
  folder
    .add(PARAMS.lookingGlass, "highlightSharpness", 0, 20)
    .onChange(
      (value) => (lookingGlassPass.uniforms.uHighlightSharpness.value = value)
    );
  folder
    .add(PARAMS.lookingGlass, "grainStrength", 0, 0.2)
    .onChange(
      (value) => (lookingGlassPass.uniforms.uGrainStrength.value = value)
    );
  folder
    .add(PARAMS.lookingGlass, "bevelWidth", 0, 0.02)
    .onChange((value) => (lookingGlassPass.uniforms.uBevelWidth.value = value));
  folder
    .add(PARAMS.lookingGlass, "bevelStrength", 0, 1)
    .onChange(
      (value) => (lookingGlassPass.uniforms.uBevelStrength.value = value)
    );
  folder.open();
}

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  composer.setSize(width, height);
  lookingGlassPass.uniforms.uResolution.value.set(width, height);
  updateBackgroundSize();
}

function onMouseMove(event) {
  lookingGlassPass.uniforms.uMouse.value.set(
    event.clientX / window.innerWidth,
    1 - event.clientY / window.innerHeight
  );
}

function animate(time) {
  requestAnimationFrame(animate);
  lookingGlassPass.uniforms.uTime.value = time * 0.001;
  composer.render();
}

init();