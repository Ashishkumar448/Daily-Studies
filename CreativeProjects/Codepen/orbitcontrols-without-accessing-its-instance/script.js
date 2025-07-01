import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/addons/shaders/GammaCorrectionShader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

let scene, camera, renderer, controls, composer;
let cubes = [], envMap;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const params = {
    backgroundColor: '#C2D3E0', // Soft gradient-like blue
    cubeColor: '#87CEEB', // Light blue color matching the image
    cubeSpacing: 0.1,
    cubeSize: 1,
    metalness: 0.1, // Low metalness for a matte effect
    roughness: 0.9, // High roughness to achieve a matte look
    envMapIntensity: 0.1, // Low intensity to keep the matte look
    aoIntensity: 1,
    lightIntensity: 0.8, // Soft lighting
    lightColor: '#FFFFFF',
    subsurfaceScattering: 0.2,
    glowIntensity: 0.3,
    hoverScale: 1.2
};

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(params.backgroundColor);
    
    // Adding fog to create a gradient-like effect
    scene.fog = new THREE.Fog(params.backgroundColor, 10, 30);

    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(10, 7, 10);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    loadEnvironmentMap(pmremGenerator).then(() => {
        setupLighting();
        createCubeStack();
        setupPostProcessing();
        setupGUI();
    });

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('mousemove', onMouseMove, false);
}

function loadEnvironmentMap(pmremGenerator) {
    return new Promise((resolve) => {
        new RGBELoader()
            .setPath('https://threejs.org/examples/textures/equirectangular/')
            .load('quarry_01_1k.hdr', function (texture) {
                envMap = pmremGenerator.fromEquirectangular(texture).texture;
                scene.environment = envMap;
                texture.dispose();
                pmremGenerator.dispose();
                resolve();
            });
    });
}

function setupLighting() {
    const ambientLight = new THREE.AmbientLight(params.lightColor, 0.4); // Adding soft ambient light
    scene.add(ambientLight);

    const light = new THREE.DirectionalLight(params.lightColor, params.lightIntensity);
    light.position.set(5, 10, 5);
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 20;
    scene.add(light);
}

function createCubeStack() {
    const cubeGeometry = new THREE.BoxGeometry(params.cubeSize, params.cubeSize, params.cubeSize);
    const cubeMaterial = new THREE.MeshPhysicalMaterial({
        color: params.cubeColor,
        metalness: params.metalness,
        roughness: params.roughness,
        envMap: envMap,
        envMapIntensity: params.envMapIntensity,
        clearcoat: 0.1,
        clearcoatRoughness: 0.8,
        transmission: 0,
        thickness: 0.5,
        side: THREE.DoubleSide
    });

    for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
            for (let z = 0; z < 3; z++) {
                const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
                cube.position.set(
                    x * (params.cubeSize + params.cubeSpacing) + 3,
                    y * (params.cubeSize + params.cubeSpacing),
                    z * (params.cubeSize + params.cubeSpacing)
                );
                cube.castShadow = true;
                cube.receiveShadow = true;
                scene.add(cube);
                cubes.push(cube);
            }
        }
    }
}

function setupPostProcessing() {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const ssaoPass = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
    ssaoPass.kernelRadius = 16;
    ssaoPass.minDistance = 0.005;
    ssaoPass.maxDistance = 0.1;
    composer.addPass(ssaoPass);

    const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
    composer.addPass(gammaCorrectionPass);
}

function setupGUI() {
    const gui = new GUI();
    gui.addColor(params, 'backgroundColor').onChange(value => {
        scene.background.set(value);
        scene.fog.color.set(value); // Sync fog color with background
    });
    gui.addColor(params, 'cubeColor').onChange(updateCubeColor);
    gui.add(params, 'cubeSpacing', 0, 1).onChange(updateCubePositions);
    gui.add(params, 'cubeSize', 0.5, 2).onChange(updateCubeSize);
    gui.add(params, 'metalness', 0, 1).onChange(updateCubeMaterial);
    gui.add(params, 'roughness', 0, 1).onChange(updateCubeMaterial);
    gui.add(params, 'envMapIntensity', 0, 3).onChange(updateCubeMaterial);
    gui.add(params, 'aoIntensity', 0, 3).name('AO Intensity').onChange(updateSSAO);
    gui.add(params, 'lightIntensity', 0, 3).onChange(updateLighting);
    gui.addColor(params, 'lightColor').onChange(updateLighting);
    gui.add(params, 'subsurfaceScattering', 0, 1).onChange(updateCubeMaterial);
    gui.add(params, 'glowIntensity', 0, 1).name('Hover Glow Intensity');
    gui.add(params, 'hoverScale', 1, 2).name('Hover Scale Intensity');
}

function updateCubeColor(value) {
    cubes.forEach(cube => cube.material.color.set(value));
}

function updateCubePositions() {
    cubes.forEach((cube, index) => {
        const x = index % 3;
        const y = Math.floor((index / 3) % 3);
        const z = Math.floor(index / 9);
        cube.position.set(
            x * (params.cubeSize + params.cubeSpacing) + 3,
            y * (params.cubeSize + params.cubeSpacing),
            z * (params.cubeSize + params.cubeSpacing)
        );
    });
}

function updateCubeSize() {
    cubes.forEach(cube => {
        cube.geometry = new THREE.BoxGeometry(params.cubeSize, params.cubeSize, params.cubeSize);
    });
    updateCubePositions();
}

function updateCubeMaterial() {
    cubes.forEach(cube => {
        cube.material.metalness = params.metalness;
        cube.material.roughness = params.roughness;
        cube.material.envMapIntensity = params.envMapIntensity;
        cube.material.transmission = params.subsurfaceScattering;
    });
}

function updateLighting() {
    scene.children.forEach(child => {
        if (child instanceof THREE.DirectionalLight) {
            child.intensity = params.lightIntensity;
            child.color.set(params.lightColor);
        }
    });
}

function updateSSAO() {
    composer.passes.forEach(pass => {
        if (pass instanceof SSAOPass) {
            pass.output = SSAOPass.OUTPUT.Default;
            pass.kernelRadius = 16 * params.aoIntensity;
        }
    });
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
}

function animate() {
    requestAnimationFrame(animate);

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cubes);

    cubes.forEach(cube => {
        cube.material.emissive.setRGB(0, 0, 0);
        cube.scale.set(1, 1, 1);
    });

    if (intersects.length > 0) {
        const hoveredCube = intersects[0].object;
        hoveredCube.material.emissive.setRGB(params.glowIntensity, params.glowIntensity, params.glowIntensity);
        hoveredCube.scale.set(params.hoverScale, params.hoverScale, params.hoverScale);
    }

    controls.update();
    composer.render();
}

init();
animate();