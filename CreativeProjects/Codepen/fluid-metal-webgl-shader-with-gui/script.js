import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.139.1/build/three.module.js';
import * as dat from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.7/build/dat.gui.module.js';

class Sketch {
  constructor(options) {
    this.element = options.dom;
    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight };

    this.clock = new THREE.Clock();
    this.init();
  }

  init() {
    this.addCanvas();
    this.addScene();
    this.addCamera();
    this.addMesh();
    this.addGUI();
    this.addEventListeners();
    this.onResize();
    this.update();
  }

  addCanvas() {
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true });

    this.renderer.setSize(this.viewport.width, this.viewport.height);
    this.canvas = this.renderer.domElement;
    this.element.appendChild(this.canvas);
  }

  addScene() {
    this.scene = new THREE.Scene();
  }

  addCamera() {
    this.camera = new THREE.PerspectiveCamera(
    75,
    this.viewport.width / this.viewport.height,
    0.1,
    100);

    this.camera.position.set(0, 0, 5);
    this.scene.add(this.camera);
  }

  addMesh() {
    const vertexShader = document.getElementById('vertexShader').textContent;
    const fragmentShader = document.getElementById('fragmentShader').textContent;

    this.geometry = new THREE.SphereGeometry(1.1, 32, 32);
    this.material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        u_resolution: { value: new THREE.Vector2(this.viewport.width, this.viewport.height) },
        u_time: { value: 0.0 },
        u_noiseIntensity: { value: 1.0 },
        u_metallic: { value: 0.7 },
        u_specularHighlight: { value: 32.0 },
        u_lightIntensity: { value: 0.5 },
        u_fresnelStrength: { value: 3.0 },
        u_reflectionIntensity: { value: 0.5 },
        u_lightPosition: { value: new THREE.Vector3(5.0, 5.0, 5.0) },
        u_cameraPosition: { value: this.camera.position } } });



    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  addGUI() {
    this.gui = new dat.GUI();
    const settings = {
      noiseIntensity: 1.0,
      metallic: 0.7,
      specularHighlight: 32.0,
      lightIntensity: 0.5,
      fresnelStrength: 3.0,
      reflectionIntensity: 0.5 };


    this.gui.add(settings, 'noiseIntensity', 0, 2, 0.01).name('Noise Intensity').onChange(value => {
      this.material.uniforms.u_noiseIntensity.value = value;
    });

    this.gui.add(settings, 'metallic', 0, 1, 0.01).name('Metallic').onChange(value => {
      this.material.uniforms.u_metallic.value = value;
    });

    this.gui.add(settings, 'specularHighlight', 1, 64, 1).name('Specular Highlight').onChange(value => {
      this.material.uniforms.u_specularHighlight.value = value;
    });

    this.gui.add(settings, 'lightIntensity', 0, 1, 0.01).name('Light Intensity').onChange(value => {
      this.material.uniforms.u_lightIntensity.value = value;
    });

    this.gui.add(settings, 'fresnelStrength', 0, 5, 0.1).name('Fresnel Strength').onChange(value => {
      this.material.uniforms.u_fresnelStrength.value = value;
    });

    this.gui.add(settings, 'reflectionIntensity', 0, 1, 0.05).name('Reflection Intensity').onChange(value => {
      this.material.uniforms.u_reflectionIntensity.value = value;
    });

    this.settings = settings;
  }

  addEventListeners() {
    window.addEventListener('resize', this.onResize.bind(this));
  }

  onResize() {
    this.viewport = { width: window.innerWidth, height: window.innerHeight };
    this.camera.aspect = this.viewport.width / this.viewport.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.viewport.width, this.viewport.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  }

  update() {
    this.render();
    this.material.uniforms.u_time.value = this.clock.getElapsedTime();
    requestAnimationFrame(this.update.bind(this));
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }}


window.onload = () => {
  const sketch = new Sketch({ dom: document.getElementById('container') });
};