import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/ShaderPass.js";
import { GUI } from "https://cdn.skypack.dev/dat.gui";

gsap.registerPlugin(ScrollTrigger);

let scene, camera, renderer, controls;
let composer, customPass;
let outerTorus, middleTorus, innerTorus, mouseSphere;
let cubeRenderTarget, cubeCamera;
let backgroundTexture;
let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();
let shards = [];

const PARAMS = {
  material: {
    color: "#FFFFFF",
    metalness: 0.2,
    roughness: 0.1,
    transmission: 0.9,
    thickness: 0.5,
    ior: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.1
  },
  rotationSpeed: 0.5,
  distortion: {
    strength: 0.1,
    radius: 0.2,
    edgeWidth: 0.03,
    edgeOpacity: 0.1,
    chromaticAberration: 0.02,
    reflectionIntensity: 0.2,
    waveDistortion: 0.05,
    waveSpeed: 0.8,
    lensBlur: 0.1,
    clearCenterSize: 0.5,
    magnification: 1.5
  },
  shatter: {
    pieces: 50,
    force: 5,
    duration: 2
  }
};

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 5);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  setupLights();
  createBackground();
  createShapes();
  setupPostProcessing();
  setupGUI();
  setupScrollTrigger();

  window.addEventListener("resize", onWindowResize, false);
  document.addEventListener("mousemove", onMouseMove, false);

  animate();
}

function setupLights() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0xffffff, 1, 100);
  pointLight.position.set(0, 0, 10);
  scene.add(pointLight);
}

function createBackground() {
  const loader = new THREE.TextureLoader();
  loader.load(
    "https://images.unsplash.com/photo-1504805572947-34fad45aed93?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    (texture) => {
      backgroundTexture = texture;
      updateBackgroundSize();
    }
  );
}

function updateBackgroundSize() {
  if (backgroundTexture) {
    const aspect = window.innerWidth / window.innerHeight;
    const imageAspect =
      backgroundTexture.image.width / backgroundTexture.image.height;

    let scale;
    if (aspect > imageAspect) {
      scale = new THREE.Vector2(1, imageAspect / aspect);
    } else {
      scale = new THREE.Vector2(aspect / imageAspect, 1);
    }

    backgroundTexture.offset.set((1 - scale.x) / 2, (1 - scale.y) / 2);
    backgroundTexture.repeat.set(scale.x, scale.y);

    scene.background = backgroundTexture;
  }
}

function createGlassMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(PARAMS.material.color),
    metalness: PARAMS.material.metalness,
    roughness: PARAMS.material.roughness,
    transmission: PARAMS.material.transmission,
    thickness: PARAMS.material.thickness,
    ior: PARAMS.material.ior,
    clearcoat: PARAMS.material.clearcoat,
    clearcoatRoughness: PARAMS.material.clearcoatRoughness,
    side: THREE.DoubleSide,
    transparent: true,
    envMapIntensity: 1,
    refractionRatio: 0.98
  });
}

function createShapes() {
  cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
    format: THREE.RGBAFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter
  });
  cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);

  const glassMaterial = createGlassMaterial();
  glassMaterial.envMap = cubeRenderTarget.texture;
  glassMaterial.envMap.mapping = THREE.CubeRefractionMapping;

  const outerTorusGeometry = new THREE.TorusGeometry(1.2, 0.3, 64, 64);
  const middleTorusGeometry = new THREE.TorusGeometry(0.9, 0.25, 64, 64);
  const innerTorusGeometry = new THREE.TorusGeometry(0.6, 0.2, 64, 64);
  const sphereGeometry = new THREE.SphereGeometry(0.3, 32, 32);

  outerTorus = new THREE.Mesh(outerTorusGeometry, glassMaterial.clone());
  middleTorus = new THREE.Mesh(middleTorusGeometry, glassMaterial.clone());
  innerTorus = new THREE.Mesh(innerTorusGeometry, glassMaterial.clone());
  mouseSphere = new THREE.Mesh(sphereGeometry, glassMaterial.clone());

  outerTorus.position.set(-1.5, 0, 0);
  middleTorus.position.set(0, 0, 0);
  innerTorus.position.set(1.5, 0, 0);

  scene.add(outerTorus);
  scene.add(middleTorus);
  scene.add(innerTorus);
  scene.add(mouseSphere);
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
                uniform float uRadius;
                uniform float uStrength;
                uniform float uEdgeWidth;
                uniform float uEdgeOpacity;
                uniform float uChromaticAberration;
                uniform float uReflectionIntensity;
                uniform float uWaveDistortion;
                uniform float uWaveSpeed;
                uniform float uLensBlur;
                uniform float uClearCenterSize;
                uniform float uAspect;
                uniform float uTime;
                varying vec2 vUv;

                vec4 blur(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
                    vec4 color = vec4(0.0);
                    vec2 off1 = vec2(1.3333333333333333) * direction;
                    color += texture2D(image, uv) * 0.29411764705882354;
                    color += texture2D(image, uv + (off1 / resolution)) * 0.35294117647058826;
                    color += texture2D(image, uv - (off1 / resolution)) * 0.35294117647058826;
                    return color;
                }

                void main() {
                    vec2 center = uMouse;
                    vec2 adjustedUv = vUv;
                    adjustedUv.x *= uAspect;
                    center.x *= uAspect;
                    float dist = distance(adjustedUv, center);
                    
                    if (dist < uRadius) {
                        float normalizedDist = dist / uRadius;
                        vec2 direction = normalize(adjustedUv - center);
                        
                        float clearArea = uClearCenterSize * uRadius;
                        float distortionFactor = smoothstep(clearArea, uRadius, dist);
                        
                        vec2 distortedUv = adjustedUv - direction * uStrength * distortionFactor * distortionFactor;
                        
                        float wave = sin(normalizedDist * 10.0 - uTime * uWaveSpeed) * uWaveDistortion * distortionFactor;
                        distortedUv += direction * wave;
                        
                        distortedUv.x /= uAspect;

                        float aberrationStrength = uChromaticAberration * distortionFactor;
                        vec2 redUv = distortedUv + direction * aberrationStrength / vec2(uAspect, 1.0);
                        vec2 blueUv = distortedUv - direction * aberrationStrength / vec2(uAspect, 1.0);

                        vec4 colorR = texture2D(tDiffuse, redUv);
                        vec4 colorG = texture2D(tDiffuse, distortedUv);
                        vec4 colorB = texture2D(tDiffuse, blueUv);

                        vec4 reflection = texture2D(tDiffuse, vUv + direction * 0.1 * distortionFactor);
                        
                        gl_FragColor = vec4(colorR.r, colorG.g, colorB.b, 1.0);
                        gl_FragColor = mix(gl_FragColor, reflection, uReflectionIntensity * distortionFactor);

                        float blurAmount = uLensBlur * distortionFactor;
                        gl_FragColor = mix(gl_FragColor, blur(tDiffuse, distortedUv, vec2(1.0 / uAspect, 1.0), vec2(blurAmount)), distortionFactor);

                        float edgeHighlight = smoothstep(uRadius - uEdgeWidth, uRadius, dist);
                        gl_FragColor = mix(gl_FragColor, vec4(1.0, 1.0, 1.0, 1.0), edgeHighlight * uEdgeOpacity);
                    } else {
                        gl_FragColor = texture2D(tDiffuse, vUv);
                    }
                }
            `;

  customPass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uRadius: { value: PARAMS.distortion.radius },
      uStrength: { value: PARAMS.distortion.strength },
      uEdgeWidth: { value: PARAMS.distortion.edgeWidth },
      uEdgeOpacity: { value: PARAMS.distortion.edgeOpacity },
      uChromaticAberration: { value: PARAMS.distortion.chromaticAberration },
      uReflectionIntensity: { value: PARAMS.distortion.reflectionIntensity },
      uWaveDistortion: { value: PARAMS.distortion.waveDistortion },
      uWaveSpeed: { value: PARAMS.distortion.waveSpeed },
      uLensBlur: { value: PARAMS.distortion.lensBlur },
      uClearCenterSize: { value: PARAMS.distortion.clearCenterSize },
      uAspect: { value: window.innerWidth / window.innerHeight },
      uTime: { value: 0 }
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
  });
  composer.addPass(customPass);
}

function setupGUI() {
  const gui = new GUI();
  const matFolder = gui.addFolder("Material");
  matFolder.addColor(PARAMS.material, "color").onChange(updateMaterials);
  matFolder.add(PARAMS.material, "metalness", 0, 1).onChange(updateMaterials);
  matFolder.add(PARAMS.material, "roughness", 0, 1).onChange(updateMaterials);
  matFolder
    .add(PARAMS.material, "transmission", 0, 1)
    .onChange(updateMaterials);
  matFolder.add(PARAMS.material, "thickness", 0, 5).onChange(updateMaterials);
  matFolder.add(PARAMS.material, "ior", 1, 2.333).onChange(updateMaterials);
  matFolder.add(PARAMS.material, "clearcoat", 0, 1).onChange(updateMaterials);
  matFolder
    .add(PARAMS.material, "clearcoatRoughness", 0, 1)
    .onChange(updateMaterials);
  gui.add(PARAMS, "rotationSpeed", 0, 2);

  const distFolder = gui.addFolder("Distortion");
  distFolder
    .add(PARAMS.distortion, "strength", 0, 1)
    .onChange((value) => (customPass.uniforms.uStrength.value = value));
  distFolder
    .add(PARAMS.distortion, "radius", 0.1, 0.5)
    .onChange((value) => (customPass.uniforms.uRadius.value = value));
  distFolder
    .add(PARAMS.distortion, "edgeWidth", 0, 0.05)
    .onChange((value) => (customPass.uniforms.uEdgeWidth.value = value));
  distFolder
    .add(PARAMS.distortion, "edgeOpacity", 0, 1)
    .onChange((value) => (customPass.uniforms.uEdgeOpacity.value = value));
  distFolder
    .add(PARAMS.distortion, "chromaticAberration", 0, 0.1)
    .onChange(
      (value) => (customPass.uniforms.uChromaticAberration.value = value)
    );
  distFolder
    .add(PARAMS.distortion, "reflectionIntensity", 0, 1)
    .onChange(
      (value) => (customPass.uniforms.uReflectionIntensity.value = value)
    );
  distFolder
    .add(PARAMS.distortion, "waveDistortion", 0, 0.1)
    .onChange((value) => (customPass.uniforms.uWaveDistortion.value = value));
  distFolder
    .add(PARAMS.distortion, "waveSpeed", 0, 5)
    .onChange((value) => (customPass.uniforms.uWaveSpeed.value = value));
  distFolder
    .add(PARAMS.distortion, "lensBlur", 0, 0.1)
    .onChange((value) => (customPass.uniforms.uLensBlur.value = value));
  distFolder
    .add(PARAMS.distortion, "clearCenterSize", 0, 1)
    .onChange((value) => (customPass.uniforms.uClearCenterSize.value = value));
  distFolder
    .add(PARAMS.distortion, "magnification", 0, 3)
    .onChange(updateMaterials);

  const shatterFolder = gui.addFolder("Shatter");
  shatterFolder.add(PARAMS.shatter, "pieces", 10, 100, 1);
  shatterFolder.add(PARAMS.shatter, "force", 1, 10);
  shatterFolder.add(PARAMS.shatter, "duration", 1, 5);
}

function updateMaterials() {
  const newMaterial = createGlassMaterial();
  newMaterial.envMap = cubeRenderTarget.texture;
  newMaterial.envMap.mapping = THREE.CubeRefractionMapping;

  [outerTorus, middleTorus, innerTorus, mouseSphere].forEach((obj) => {
    if (obj) {
      obj.material.dispose();
      obj.material = newMaterial.clone();
    }
  });
}

function setupScrollTrigger() {
  ScrollTrigger.create({
    trigger: "#scroll-container",
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      const progress = self.progress;
      if (progress > 0 && !shards.length) {
        shatterObjects();
      } else if (progress === 0 && shards.length) {
        restoreObjects();
      }
      updateShardPositions(progress);
    }
  });
}

function shatterObjects() {
  [outerTorus, middleTorus, innerTorus, mouseSphere].forEach((object) => {
    if (object && object.parent) {
      const newShards = createShards(object);
      shards.push(...newShards);
      scene.remove(object);
    }
  });
}

function createShards(object) {
  const { pieces } = PARAMS.shatter;
  const geometry = object.geometry;
  const positions = geometry.attributes.position.array;
  const newShards = [];

  for (let i = 0; i < pieces; i++) {
    const shardGeometry = new THREE.BufferGeometry();
    const shardPositions = [];
    const shardNormals = [];
    const shardUvs = [];

    for (let j = 0; j < positions.length; j += 9) {
      if (Math.random() < 0.1) {
        for (let k = 0; k < 9; k++) {
          shardPositions.push(positions[j + k]);
        }
        for (let k = 0; k < 3; k++) {
          shardNormals.push(0, 1, 0);
          shardUvs.push(0, 0);
        }
      }
    }

    shardGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(shardPositions, 3)
    );
    shardGeometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(shardNormals, 3)
    );
    shardGeometry.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute(shardUvs, 2)
    );

    const shard = new THREE.Mesh(shardGeometry, object.material.clone());
    shard.position.copy(object.position);
    shard.originalPosition = object.position.clone();
    shard.targetPosition = object.position
      .clone()
      .add(
        new THREE.Vector3(
          (Math.random() - 0.5) * PARAMS.shatter.force,
          (Math.random() - 0.5) * PARAMS.shatter.force,
          (Math.random() - 0.5) * PARAMS.shatter.force
        )
      );
    scene.add(shard);
    newShards.push(shard);
  }

  return newShards;
}

function updateShardPositions(progress) {
  shards.forEach((shard) => {
    shard.position.lerpVectors(
      shard.originalPosition,
      shard.targetPosition,
      progress
    );
    shard.rotation.x = progress * Math.PI * 2 * Math.random();
    shard.rotation.y = progress * Math.PI * 2 * Math.random();
    shard.rotation.z = progress * Math.PI * 2 * Math.random();
    shard.scale.setScalar(1 - progress * 0.5);
  });
}

function restoreObjects() {
  shards.forEach((shard) => {
    scene.remove(shard);
    shard.geometry.dispose();
    shard.material.dispose();
  });
  shards = [];

  [outerTorus, middleTorus, innerTorus, mouseSphere].forEach((object) => {
    if (object && !object.parent) {
      scene.add(object);
    }
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  customPass.uniforms.uAspect.value = window.innerWidth / window.innerHeight;
  updateBackgroundSize();
}

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  customPass.uniforms.uMouse.value.set(
    event.clientX / window.innerWidth,
    1 - event.clientY / window.innerHeight
  );
}

function animate(time) {
  requestAnimationFrame(animate);

  if (outerTorus.parent) {
    outerTorus.rotation.x += PARAMS.rotationSpeed * 0.01;
    outerTorus.rotation.y += PARAMS.rotationSpeed * 0.01;
    middleTorus.rotation.y -= PARAMS.rotationSpeed * 0.015;
    middleTorus.rotation.z += PARAMS.rotationSpeed * 0.015;
    innerTorus.rotation.x -= PARAMS.rotationSpeed * 0.02;
    innerTorus.rotation.z -= PARAMS.rotationSpeed * 0.02;
  }

  if (mouseSphere.parent) {
    const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z;
    const pos = camera.position.clone().add(dir.multiplyScalar(distance));
    mouseSphere.position.copy(pos);
  }

  cubeCamera.update(renderer, scene);

  customPass.uniforms.uTime.value = time * 0.001;
  controls.update();
  composer.render();
}

init();