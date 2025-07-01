import * as THREE from "https://esm.sh/three@0.175.0";
import { GUI } from "https://esm.sh/dat.gui@0.7.9";
import Stats from "https://esm.sh/stats.js@0.17.0";

// Main App class
class App {
  constructor() {
    // Initialize stats
    this.stats = new Stats();
    this.stats.showPanel(0);
    document.body.appendChild(this.stats.dom);
    this.stats.dom.style.position = "absolute";
    this.stats.dom.style.top = "0";
    this.stats.dom.style.left = "0";

    // Mouse activity tracking
    this.mouseActive = false;
    this.mouseIdleTime = 0;
    this.mouseFadeStrength = 1.0;

    // Define color presets with realistic cloud colors
    this.colorPresets = {
      "White Clouds": {
        baseColor: [0.1, 0.1, 0.15],
        smokeColor1: [0.9, 0.9, 0.95],
        smokeColor2: [0.85, 0.85, 0.9],
        smokeColor3: [0.95, 0.95, 1.0],
        lightColor: [1.0, 1.0, 1.0]
      },
      "Storm Clouds": {
        baseColor: [0.12, 0.12, 0.18],
        smokeColor1: [0.45, 0.45, 0.5],
        smokeColor2: [0.35, 0.35, 0.4],
        smokeColor3: [0.5, 0.5, 0.55],
        lightColor: [0.6, 0.6, 0.65]
      },
      "Sunset Clouds": {
        baseColor: [0.18, 0.1, 0.12],
        smokeColor1: [0.95, 0.8, 0.7],
        smokeColor2: [0.9, 0.7, 0.6],
        smokeColor3: [1.0, 0.85, 0.75],
        lightColor: [1.0, 0.9, 0.8]
      },
      "Dawn Clouds": {
        baseColor: [0.12, 0.12, 0.2],
        smokeColor1: [0.9, 0.8, 0.9],
        smokeColor2: [0.8, 0.7, 0.85],
        smokeColor3: [0.95, 0.85, 0.95],
        lightColor: [0.95, 0.9, 1.0]
      }
    };

    // Initialize settings based on screenshot values
    this.settings = {
      colorPreset: "White Clouds",
      // Layer 1 (foreground)
      layer1: {
        opacity: 0.8,
        scale: 3.0,
        speed: 0.05,
        offset: { x: 0.0, y: 0.0 },
        mouseInfluence: 0.5
      },
      // Layer 2 (middle)
      layer2: {
        opacity: 0.6,
        scale: 2.0,
        speed: 0.03,
        offset: { x: 0.1, y: -0.05 },
        mouseInfluence: 0.3
      },
      // Layer 3 (background)
      layer3: {
        opacity: 0.4,
        scale: 1.5,
        speed: 0.02,
        offset: { x: -0.15, y: 0.1 },
        mouseInfluence: 0.15
      },
      // Global settings
      noiseScale: 2.0,
      mouseRadius: 0.1,
      fadeSpeed: 0.951,
      performanceMode: true,
      depthEffect: 0.7,

      // Realistic settings based on screenshot
      windDirection: { x: 0.8, y: 0.2 },
      windStrength: 0.35,
      turbulence: 0.05,
      lightDirection: { x: 0.5, y: 0.8, z: 0.2 },
      lightIntensity: 0.6,
      scattering: 0.4,
      cloudDetail: 0.5,
      buoyancy: 1.0,
      atmosphericFog: 1.0,
      useWorleyNoise: true
    };

    // Store mouse position
    this.mouse = {
      x: 0.5,
      y: 0.5,
      prevX: 0.5,
      prevY: 0.5,
      velocity: { x: 0, y: 0 }
    };

    // Initialize renderer with performance settings
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(1);
    document.body.appendChild(this.renderer.domElement);

    // Initialize scene and camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    this.camera.position.z = 1;

    // Initialize clock
    this.clock = new THREE.Clock();

    // Initialize GUI
    this.initGUI();

    // Bind methods
    this.tick = this.tick.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onResize = this.onResize.bind(this);

    // Initialize everything
    this.init();
  }

  initGUI() {
    const gui = new GUI();

    // Color preset selector
    gui
      .add(this.settings, "colorPreset", Object.keys(this.colorPresets))
      .name("Color Theme")
      .onChange(() => {
        this.updateColors();
      });

    // Layer 1 controls (foreground)
    const layer1Folder = gui.addFolder("Foreground Layer");
    layer1Folder
      .add(this.settings.layer1, "opacity", 0.1, 1.0, 0.05)
      .name("Opacity");
    layer1Folder
      .add(this.settings.layer1, "scale", 1.0, 5.0, 0.1)
      .name("Scale");
    layer1Folder
      .add(this.settings.layer1, "speed", 0.0, 1.0, 0.05)
      .name("Speed");
    layer1Folder
      .add(this.settings.layer1, "mouseInfluence", 0.1, 1.0, 0.05)
      .name("Mouse Effect");
    layer1Folder
      .add(this.settings.layer1.offset, "x", -0.5, 0.5, 0.01)
      .name("X Offset");
    layer1Folder
      .add(this.settings.layer1.offset, "y", -0.5, 0.5, 0.01)
      .name("Y Offset");
    layer1Folder.open();

    // Layer 2 controls (middle)
    const layer2Folder = gui.addFolder("Middle Layer");
    layer2Folder
      .add(this.settings.layer2, "opacity", 0.1, 1.0, 0.05)
      .name("Opacity");
    layer2Folder
      .add(this.settings.layer2, "scale", 1.0, 5.0, 0.1)
      .name("Scale");
    layer2Folder
      .add(this.settings.layer2, "speed", 0.0, 1.0, 0.05)
      .name("Speed");
    layer2Folder
      .add(this.settings.layer2, "mouseInfluence", 0.1, 1.0, 0.05)
      .name("Mouse Effect");
    layer2Folder
      .add(this.settings.layer2.offset, "x", -0.5, 0.5, 0.01)
      .name("X Offset");
    layer2Folder
      .add(this.settings.layer2.offset, "y", -0.5, 0.5, 0.01)
      .name("Y Offset");

    // Layer 3 controls (background)
    const layer3Folder = gui.addFolder("Background Layer");
    layer3Folder
      .add(this.settings.layer3, "opacity", 0.1, 1.0, 0.05)
      .name("Opacity");
    layer3Folder
      .add(this.settings.layer3, "scale", 1.0, 5.0, 0.1)
      .name("Scale");
    layer3Folder
      .add(this.settings.layer3, "speed", 0.0, 1.0, 0.05)
      .name("Speed");
    layer3Folder
      .add(this.settings.layer3, "mouseInfluence", 0.1, 1.0, 0.05)
      .name("Mouse Effect");
    layer3Folder
      .add(this.settings.layer3.offset, "x", -0.5, 0.5, 0.01)
      .name("X Offset");
    layer3Folder
      .add(this.settings.layer3.offset, "y", -0.5, 0.5, 0.01)
      .name("Y Offset");

    // Global controls
    const globalFolder = gui.addFolder("Global Settings");
    globalFolder.add(this.settings, "noiseScale", 0.5, 5.0, 0.1).name("Detail");
    globalFolder
      .add(this.settings, "mouseRadius", 0.05, 0.3, 0.01)
      .name("Mouse Radius");
    globalFolder
      .add(this.settings, "fadeSpeed", 0.9, 0.999, 0.001)
      .name("Fade Speed");
    globalFolder
      .add(this.settings, "depthEffect", 0.0, 1.0, 0.05)
      .name("Depth Effect");
    globalFolder.open();

    // Realistic controls
    const realisticFolder = gui.addFolder("Realistic Effects");
    realisticFolder
      .add(this.settings, "windStrength", 0.0, 1.0, 0.05)
      .name("Wind Strength");
    realisticFolder
      .add(this.settings.windDirection, "x", -1.0, 1.0, 0.1)
      .name("Wind Dir X");
    realisticFolder
      .add(this.settings.windDirection, "y", -1.0, 1.0, 0.1)
      .name("Wind Dir Y");
    realisticFolder
      .add(this.settings, "turbulence", 0.0, 1.0, 0.05)
      .name("Turbulence");
    realisticFolder
      .add(this.settings, "lightIntensity", 0.0, 1.0, 0.05)
      .name("Light Intensity");
    realisticFolder
      .add(this.settings, "scattering", 0.0, 1.0, 0.05)
      .name("Light Scattering");
    realisticFolder
      .add(this.settings, "cloudDetail", 0.0, 1.0, 0.05)
      .name("Edge Detail");
    realisticFolder
      .add(this.settings, "buoyancy", 0.0, 1.0, 0.05)
      .name("Buoyancy");
    realisticFolder
      .add(this.settings, "atmosphericFog", 0.0, 1.0, 0.05)
      .name("Atmos. Haze");
    realisticFolder
      .add(this.settings, "useWorleyNoise")
      .name("Use Worley Noise");
    realisticFolder.open();

    // Performance controls
    const perfFolder = gui.addFolder("Performance");
    perfFolder
      .add(this.settings, "performanceMode")
      .name("Performance Mode")
      .onChange(this.updatePerformanceMode.bind(this));
  }

  updatePerformanceMode() {
    if (this.cloudMaterials) {
      // Always use optimized settings for better performance
      const qualityLevel = 0;
      this.cloudMaterials.forEach((material) => {
        material.uniforms.qualityLevel.value = qualityLevel;
      });
    }
  }

  updateColors() {
    if (!this.cloudMaterials) return;

    const preset = this.colorPresets[this.settings.colorPreset];

    // Update base color for all layers
    this.cloudMaterials.forEach((material) => {
      material.uniforms.baseColor.value.set(
        preset.baseColor[0],
        preset.baseColor[1],
        preset.baseColor[2]
      );
    });

    // Update specific colors for each layer
    this.cloudMaterials[0].uniforms.smokeColor.value.set(
      preset.smokeColor1[0],
      preset.smokeColor1[1],
      preset.smokeColor1[2]
    );

    this.cloudMaterials[1].uniforms.smokeColor.value.set(
      preset.smokeColor2[0],
      preset.smokeColor2[1],
      preset.smokeColor2[2]
    );

    this.cloudMaterials[2].uniforms.smokeColor.value.set(
      preset.smokeColor3[0],
      preset.smokeColor3[1],
      preset.smokeColor3[2]
    );

    // Update light color
    this.cloudMaterials.forEach((material) => {
      material.uniforms.lightColor.value.set(
        preset.lightColor[0],
        preset.lightColor[1],
        preset.lightColor[2]
      );
    });
  }

  init() {
    // Create noise texture
    this.createNoiseTexture();

    // Create mouse trail textures (one for each layer)
    this.createMouseTrailTextures();

    // Create cloud layers
    this.createCloudLayers();

    // Set performance mode to match the settings in the UI
    this.settings.performanceMode = true;

    // Add event listeners
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("touchmove", this.onTouchMove, { passive: false });
    window.addEventListener("resize", this.onResize);

    // Start animation loop
    this.tick();
  }

  createNoiseTexture() {
    // Create a noise texture for the cloud effect - reduced size for performance
    const size = 128;
    const data = new Uint8Array(size * size * 4);

    for (let i = 0; i < size * size * 4; i += 4) {
      const x = (i / 4) % size;
      const y = Math.floor(i / 4 / size);

      // Create fractal noise
      let value = this.fractalNoise((x / size) * 8, (y / size) * 8);
      value = Math.floor(((value + 1) / 2) * 255);

      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = 255;
    }

    this.noiseTexture = new THREE.DataTexture(
      data,
      size,
      size,
      THREE.RGBAFormat
    );
    this.noiseTexture.wrapS = THREE.RepeatWrapping;
    this.noiseTexture.wrapT = THREE.RepeatWrapping;
    this.noiseTexture.needsUpdate = true;
  }

  fractalNoise(x, y) {
    // Improved implementation of fractal noise
    let noise = 0;
    let amplitude = 1.0;
    let frequency = 1.0;
    let maxAmplitude = 0;
    const octaves = 4; // Reduced for performance

    for (let i = 0; i < octaves; i++) {
      noise += this.noise(x * frequency, y * frequency) * amplitude;
      maxAmplitude += amplitude;
      amplitude *= 0.5;
      frequency *= 2.0;
    }

    // Normalize to [-1, 1]
    return noise / maxAmplitude;
  }

  noise(x, y) {
    // Simple 2D noise function
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);

    const u = this.fade(x);
    const v = this.fade(y);

    const A = this.perm[X] + Y;
    const B = this.perm[(X + 1) & 255] + Y;

    return this.lerp(
      this.lerp(
        this.grad(this.perm[A & 255], x, y),
        this.grad(this.perm[B & 255], x - 1, y),
        u
      ),
      this.lerp(
        this.grad(this.perm[(A + 1) & 255], x, y - 1),
        this.grad(this.perm[(B + 1) & 255], x - 1, y - 1),
        u
      ),
      v
    );
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(a, b, t) {
    return a + t * (b - a);
  }

  grad(hash, x, y) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  // Permutation table for Perlin noise
  perm = [
    151,
    160,
    137,
    91,
    90,
    15,
    131,
    13,
    201,
    95,
    96,
    53,
    194,
    233,
    7,
    225,
    140,
    36,
    103,
    30,
    69,
    142,
    8,
    99,
    37,
    240,
    21,
    10,
    23,
    190,
    6,
    148,
    247,
    120,
    234,
    75,
    0,
    26,
    197,
    62,
    94,
    252,
    219,
    203,
    117,
    35,
    11,
    32,
    57,
    177,
    33,
    88,
    237,
    149,
    56,
    87,
    174,
    20,
    125,
    136,
    171,
    168,
    68,
    175,
    74,
    165,
    71,
    134,
    139,
    48,
    27,
    166,
    77,
    146,
    158,
    231,
    83,
    111,
    229,
    122,
    60,
    211,
    133,
    230,
    220,
    105,
    92,
    41,
    55,
    46,
    245,
    40,
    244,
    102,
    143,
    54,
    65,
    25,
    63,
    161,
    1,
    216,
    80,
    73,
    209,
    76,
    132,
    187,
    208,
    89,
    18,
    169,
    200,
    196,
    135,
    130,
    116,
    188,
    159,
    86,
    164,
    100,
    109,
    198,
    173,
    186,
    3,
    64,
    52,
    217,
    226,
    250,
    124,
    123,
    5,
    202,
    38,
    147,
    118,
    126,
    255,
    82,
    85,
    212,
    207,
    206,
    59,
    227,
    47,
    16,
    58,
    17,
    182,
    189,
    28,
    42,
    223,
    183,
    170,
    213,
    119,
    248,
    152,
    2,
    44,
    154,
    163,
    70,
    221,
    153,
    101,
    155,
    167,
    43,
    172,
    9,
    129,
    22,
    39,
    253,
    19,
    98,
    108,
    110,
    79,
    113,
    224,
    232,
    178,
    185,
    112,
    104,
    218,
    246,
    97,
    228,
    251,
    34,
    242,
    193,
    238,
    210,
    144,
    12,
    191,
    179,
    162,
    241,
    81,
    51,
    145,
    235,
    249,
    14,
    239,
    107,
    49,
    192,
    214,
    31,
    181,
    199,
    106,
    157,
    184,
    84,
    204,
    176,
    115,
    121,
    50,
    45,
    127,
    4,
    150,
    254,
    138,
    236,
    205,
    93,
    222,
    114,
    67,
    29,
    24,
    72,
    243,
    141,
    128,
    195,
    78,
    66,
    215,
    61,
    156,
    180,
    151,
    160,
    137,
    91,
    90,
    15,
    131,
    13,
    201,
    95,
    96,
    53,
    194,
    233,
    7,
    225,
    140,
    36,
    103,
    30,
    69,
    142,
    8,
    99,
    37,
    240,
    21,
    10,
    23,
    190,
    6,
    148,
    247,
    120,
    234,
    75,
    0,
    26,
    197,
    62,
    94,
    252,
    219,
    203,
    117,
    35,
    11,
    32,
    57,
    177,
    33,
    88,
    237,
    149,
    56,
    87,
    174,
    20,
    125,
    136,
    171,
    168,
    68,
    175,
    74,
    165,
    71,
    134,
    139,
    48,
    27,
    166,
    77,
    146,
    158,
    231,
    83,
    111,
    229,
    122,
    60,
    211,
    133,
    230,
    220,
    105,
    92,
    41,
    55,
    46,
    245,
    40,
    244,
    102,
    143,
    54,
    65,
    25,
    63,
    161,
    1,
    216,
    80,
    73,
    209,
    76,
    132,
    187,
    208,
    89,
    18,
    169,
    200,
    196,
    135,
    130,
    116,
    188,
    159,
    86,
    164,
    100,
    109,
    198,
    173,
    186,
    3,
    64,
    52,
    217,
    226,
    250,
    124,
    123,
    5,
    202,
    38,
    147,
    118,
    126,
    255,
    82,
    85,
    212
  ];

  createMouseTrailTextures() {
    // Create render targets for the mouse trails (one for each layer)
    // Use smaller textures for better performance
    const size = 256;

    this.mouseTrailTextures = [];
    this.mouseTrailTextures2 = [];
    this.mouseTrailScenes = [];
    this.mouseTrailMeshes = [];

    // Create a camera for all mouse trail scenes
    this.mouseTrailCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Create three layers of mouse trails
    for (let i = 0; i < 3; i++) {
      // Create render targets
      this.mouseTrailTextures.push(
        new THREE.WebGLRenderTarget(size, size, {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat,
          type: THREE.FloatType
        })
      );

      this.mouseTrailTextures2.push(
        new THREE.WebGLRenderTarget(size, size, {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat,
          type: THREE.FloatType
        })
      );

      // Create a scene for the mouse trail
      const mouseTrailScene = new THREE.Scene();
      this.mouseTrailScenes.push(mouseTrailScene);

      // Get the layer settings
      const layerSettings =
        i === 0
          ? this.settings.layer1
          : i === 1
          ? this.settings.layer2
          : this.settings.layer3;

      // Create a material for the mouse trail with synchronized cursor position and fade out when inactive
      const mouseTrailMaterial = new THREE.ShaderMaterial({
        uniforms: {
          trailTexture: { value: this.mouseTrailTextures[i].texture },
          mousePos: { value: new THREE.Vector2(0.5, 0.5) },
          prevMousePos: { value: new THREE.Vector2(0.5, 0.5) },
          mouseRadius: { value: this.settings.mouseRadius },
          mouseInfluence: { value: layerSettings.mouseInfluence },
          fadeSpeed: { value: this.settings.fadeSpeed },
          resolution: { value: new THREE.Vector2(size, size) },
          offset: {
            value: new THREE.Vector2(
              layerSettings.offset.x,
              layerSettings.offset.y
            )
          },
          time: { value: 0 },
          buoyancy: { value: this.settings.buoyancy },
          mouseFadeStrength: { value: 1.0 }
        },
        vertexShader: `
          varying vec2 vUv;
          
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D trailTexture;
          uniform vec2 mousePos;
          uniform vec2 prevMousePos;
          uniform float mouseRadius;
          uniform float mouseInfluence;
          uniform float fadeSpeed;
          uniform vec2 resolution;
          uniform vec2 offset;
          uniform float time;
          uniform float buoyancy;
          uniform float mouseFadeStrength;
          
          varying vec2 vUv;
          
          void main() {
            // Get current trail value
            vec4 trail = texture2D(trailTexture, vUv);
            
            // Calculate distance from mouse WITHOUT applying offset
            // This ensures cursor effect appears where the actual cursor is
            float dist = distance(vUv, mousePos);
            
            // Get mouse velocity
            vec2 mouseVelocity = (mousePos - prevMousePos) * 10.0;
            
            // Add mouse influence with fluid-like behavior, adjusted by fade strength
            // Will fade to 0 when mouse is inactive
            float influence = smoothstep(mouseRadius, 0.0, dist) * mouseInfluence * mouseFadeStrength;
            
            // Update velocity in rg channels
            trail.rg = mix(trail.rg, mouseVelocity * influence, 0.3);
            
            // Fade the trail over time with non-uniform fading
            // Different parts of the trail fade at different rates
            float localFadeSpeed = fadeSpeed - 0.03 * texture2D(trailTexture, vUv + vec2(0.1, 0.2)).b;
            localFadeSpeed = clamp(localFadeSpeed, 0.85, fadeSpeed);
            trail.rgba *= localFadeSpeed;
            
            // Simulate diffusion for more realistic fluid behavior
            vec2 texelSize = 1.0 / resolution;
            vec4 sum = texture2D(trailTexture, vUv + vec2(-1.0, 0.0) * texelSize) +
                      texture2D(trailTexture, vUv + vec2(1.0, 0.0) * texelSize) +
                      texture2D(trailTexture, vUv + vec2(0.0, -1.0) * texelSize) +
                      texture2D(trailTexture, vUv + vec2(0.0, 1.0) * texelSize);
                       
            vec4 diffusion = sum / 4.0 - trail;
            trail += diffusion * 0.2;
            
            // Add buoyancy effect (rising motion for "hot" regions)
            vec2 buoyancyDir = vec2(0.0, 0.05 * buoyancy * max(0.0, trail.b - 0.5));
            trail.rg += buoyancyDir;
            
            // Add new mouse position intensity to blue channel
            trail.b += influence;
            
            // Output
            gl_FragColor = trail;
          }
        `
      });

      // Create a quad for the mouse trail
      const mouseTrailGeometry = new THREE.PlaneGeometry(2, 2);
      const mouseTrailMesh = new THREE.Mesh(
        mouseTrailGeometry,
        mouseTrailMaterial
      );
      mouseTrailScene.add(mouseTrailMesh);
      this.mouseTrailMeshes.push(mouseTrailMesh);
    }
  }

  createCloudLayers() {
    // Get initial colors from the current preset
    const preset = this.colorPresets[this.settings.colorPreset];

    // Create materials for each cloud layer
    this.cloudMaterials = [];

    // Create three layers of clouds
    for (let i = 0; i < 3; i++) {
      // Get the layer settings
      const layerSettings =
        i === 0
          ? this.settings.layer1
          : i === 1
          ? this.settings.layer2
          : this.settings.layer3;

      // Get the layer color
      const smokeColor =
        i === 0
          ? preset.smokeColor1
          : i === 1
          ? preset.smokeColor2
          : preset.smokeColor3;

      // Create a shader for the cloud layer with enhanced realism
      const cloudShader = {
        uniforms: {
          time: { value: 0 },
          noiseTexture: { value: this.noiseTexture },
          mouseTrailTexture: { value: this.mouseTrailTextures[i].texture },
          resolution: {
            value: new THREE.Vector2(window.innerWidth, window.innerHeight)
          },
          opacity: { value: layerSettings.opacity },
          scale: { value: layerSettings.scale },
          noiseScale: { value: this.settings.noiseScale },
          speed: { value: layerSettings.speed },
          offset: {
            value: new THREE.Vector2(
              layerSettings.offset.x,
              layerSettings.offset.y
            )
          },
          baseColor: {
            value: new THREE.Vector3(
              preset.baseColor[0],
              preset.baseColor[1],
              preset.baseColor[2]
            )
          },
          smokeColor: {
            value: new THREE.Vector3(
              smokeColor[0],
              smokeColor[1],
              smokeColor[2]
            )
          },
          lightColor: {
            value: new THREE.Vector3(
              preset.lightColor[0],
              preset.lightColor[1],
              preset.lightColor[2]
            )
          },
          qualityLevel: { value: this.settings.performanceMode ? 0 : 1 },
          layerIndex: { value: i },
          depthEffect: { value: this.settings.depthEffect },

          // Realistic effect parameters
          windDirection: {
            value: new THREE.Vector2(
              this.settings.windDirection.x,
              this.settings.windDirection.y
            )
          },
          windStrength: { value: this.settings.windStrength },
          turbulence: { value: this.settings.turbulence },
          lightDirection: {
            value: new THREE.Vector3(
              this.settings.lightDirection.x,
              this.settings.lightDirection.y,
              this.settings.lightDirection.z
            )
          },
          lightIntensity: { value: this.settings.lightIntensity },
          scattering: { value: this.settings.scattering },
          cloudDetail: { value: this.settings.cloudDetail },
          buoyancy: { value: this.settings.buoyancy },
          atmosphericFog: { value: this.settings.atmosphericFog },
          useWorleyNoise: { value: this.settings.useWorleyNoise ? 1.0 : 0.0 }
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
          uniform sampler2D noiseTexture;
          uniform sampler2D mouseTrailTexture;
          uniform vec2 resolution;
          uniform float opacity;
          uniform float scale;
          uniform float noiseScale;
          uniform float speed;
          uniform vec2 offset;
          uniform vec3 baseColor;
          uniform vec3 smokeColor;
          uniform vec3 lightColor;
          uniform int qualityLevel;
          uniform int layerIndex;
          uniform float depthEffect;
          
          // Realistic effect uniforms
          uniform vec2 windDirection;
          uniform float windStrength;
          uniform float turbulence;
          uniform vec3 lightDirection;
          uniform float lightIntensity;
          uniform float scattering;
          uniform float cloudDetail;
          uniform float buoyancy;
          uniform float atmosphericFog;
          uniform float useWorleyNoise;
          
          varying vec2 vUv;
          
          // Helper functions
          float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
          }
          
          // Simplex-like 2D noise
          vec4 permute(vec4 x) {
            return mod(((x*34.0)+1.0)*x, 289.0);
          }
          
          vec2 fade(vec2 t) {
            return t*t*t*(t*(t*6.0-15.0)+10.0);
          }
          
          float cnoise(vec2 P) {
            vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
            vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
            Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
            vec4 ix = Pi.xzxz;
            vec4 iy = Pi.yyww;
            vec4 fx = Pf.xzxz;
            vec4 fy = Pf.yyww;
            vec4 i = permute(permute(ix) + iy);
            vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
            vec4 gy = abs(gx) - 0.5;
            vec4 tx = floor(gx + 0.5);
            gx = gx - tx;
            vec2 g00 = vec2(gx.x,gy.x);
            vec2 g10 = vec2(gx.y,gy.y);
            vec2 g01 = vec2(gx.z,gy.z);
            vec2 g11 = vec2(gx.w,gy.w);
            vec4 norm = 1.79284291400159 - 0.85373472095314 * vec4(dot(g00, g00), dot(g10, g10), dot(g01, g01), dot(g11, g11));
            g00 *= norm.x;
            g10 *= norm.y;
            g01 *= norm.z;
            g11 *= norm.w;
            float n00 = dot(g00, vec2(fx.x, fy.x));
            float n10 = dot(g10, vec2(fx.y, fy.y));
            float n01 = dot(g01, vec2(fx.z, fy.z));
            float n11 = dot(g11, vec2(fx.w, fy.w));
            vec2 fade_xy = fade(Pf.xy);
            vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
            float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
            return 2.3 * n_xy;
          }
          
          // FBM (Fractal Brownian Motion) - optimized for performance
          float fbm(vec2 p) {
            float sum = 0.0;
            float amp = 1.0;
            float freq = 1.0;
            
            // Reduce octaves for better performance
            int octaves = 4;
            
            for(int i = 0; i < 4; i++) {
              sum += amp * cnoise(p * freq);
              freq *= 2.0;
              amp *= 0.5;
            }
            
            return sum;
          }

          // Worley (cellular) noise
          float worleyNoise(vec2 p) {
            vec2 cellSize = vec2(1.0, 1.0);
            vec2 cell = floor(p / cellSize);
            float minDist = 1.0;
            
            // Check neighboring cells
            for (int y = -1; y <= 1; y++) {
              for (int x = -1; x <= 1; x++) {
                vec2 cellOffset = vec2(x, y);
                vec2 cellPos = cell + cellOffset;
                vec2 cellCenter = cellPos + 0.5 + 0.5 * vec2(
                  sin(cellPos.x * 374.4 + cellPos.y * 3674.1),
                  cos(cellPos.x * 45.5 + cellPos.y * 2536.3)
                );
                float dist = distance(p / cellSize, cellCenter);
                minDist = min(minDist, dist);
              }
            }
            
            return minDist;
          }
          
          void main() {
            // Adjust UV for aspect ratio
            vec2 uv = vUv;
            float aspect = resolution.x / resolution.y;
            uv.x *= aspect;
            
            // Apply layer offset
            uv += offset;
            
            // Get mouse trail influence
            vec4 mouseTrail = texture2D(mouseTrailTexture, vUv);
            
            // Create base noise coordinates
            vec2 noiseCoord = uv * scale;
            
            // Add wind animation based on direction and strength
            vec2 windOffset = windDirection * time * speed * windStrength;
            noiseCoord += windOffset;
            
            // Add turbulence
            vec2 turbulenceOffset = vec2(
              sin(noiseCoord.y * 2.0 + time * 0.5),
              cos(noiseCoord.x * 2.0 + time * 0.7)
            ) * turbulence;
            noiseCoord += turbulenceOffset;
            
            // Apply mouse trail distortion with correct offset compensation 
            // This ensures the mouse influence aligns with actual cursor position
            float mouseStrength = 1.0 - float(layerIndex) * 0.3 * depthEffect;
            noiseCoord += mouseTrail.rg * mouseStrength;
            
            // Add buoyancy effect (rising hot air) - simplified
            vec2 buoyancyOffset = vec2(0.0, mouseTrail.b * 0.05 * buoyancy);
            noiseCoord += buoyancyOffset;
            
            // Enhanced multi-octave noise with variable component speeds
            // Different parts of the noise will move at different speeds
            float noise1 = fbm(noiseCoord);
            float noise2 = fbm(noiseCoord * 2.0 + vec2(8.3, 2.8));
            
            // Add Worley noise for more cellular cloud structures if enabled
            float cellular = 0.0;
            if (useWorleyNoise > 0.5) {
              cellular = worleyNoise(noiseCoord * 3.0);
              cellular = 1.0 - smoothstep(0.0, 0.8, cellular);
            }
            
            // Performance optimized noise computations
            float noise3 = fbm(noiseCoord * 0.7 + vec2(4.1, 7.2) + time * speed * 0.2); 
            float noise4 = fbm(noiseCoord * 3.5 + vec2(2.5, 9.6) + time * speed * 0.5);
            
            // More efficient detail noise calculation
            float detailNoise = 0.0;
            if (cloudDetail > 0.01) {
              // Only compute if actually needed
              detailNoise = fbm(noiseCoord * 4.0 + time * speed * 0.3);
            }
            
            // Combine noise layers with different weights based on layer index
            float combinedNoise;
            if (layerIndex == 0) {
              // Foreground layer - more detailed with faster-moving components
              combinedNoise = noise1 * 0.3 + noise2 * 0.2 + noise3 * 0.2 + noise4 * 0.3;
              // Add non-uniform detail
              combinedNoise += detailNoise * 0.2 * cloudDetail;
              // Add Worley if enabled
              if (useWorleyNoise > 0.5) combinedNoise += cellular * 0.2;
            } else if (layerIndex == 1) {
              // Middle layer - balanced with medium speed components
              combinedNoise = noise1 * 0.4 + noise2 * 0.2 + noise3 * 0.3 + noise4 * 0.1;
              // Add less detail
              combinedNoise += detailNoise * 0.1 * cloudDetail;
              // Add Worley if enabled
              if (useWorleyNoise > 0.5) combinedNoise += cellular * 0.15;
            } else {
              // Background layer - smoother with slower components
              combinedNoise = noise1 * 0.5 + noise2 * 0.2 + noise3 * 0.3;
              // Minimal detail for background
              combinedNoise += detailNoise * 0.05 * cloudDetail;
              // Add Worley if enabled
              if (useWorleyNoise > 0.5) combinedNoise += cellular * 0.1;
            }
            
            // Apply mouse trail to create "holes" in the clouds
            // Stronger effect on foreground layers
            float mouseEffect = 1.5 - float(layerIndex) * 0.5 * depthEffect;
            
            // Create variable reformation speeds based on noise and layer
            // This makes different parts of the cloud reform at different rates
            // Each layer will have its own distinct reformation pattern
            float baseReformRate = fbm(noiseCoord * 1.5 + vec2(6.7, 3.2) + float(layerIndex) * 1.37) * 0.5 + 0.5;
            float layerVariation = float(layerIndex) * 0.2;
            float spatialVariation = fbm(noiseCoord * 2.7 + time * 0.1) * 0.3;
            
            // Combine factors for highly variable reformation rate
            float reformRate = baseReformRate + layerVariation + spatialVariation;
            reformRate = clamp(reformRate, 0.3, 0.9);
            
            // Apply influence weighted by reformation rate
            float adjustedEffect = mouseTrail.b * mouseEffect * (1.0 - reformRate * 0.6);
            combinedNoise -= adjustedEffect;
            
            // Define edge detail first, then use in cloud calculation
            float edgeDetail = 0.0;
            if (cloudDetail > 0.01) {
              edgeDetail = fbm(noiseCoord * 4.0) * 0.2 * cloudDetail;
            }
            
            // Create cloud effect with optimized threshold calculation
            float threshold = -0.2 + float(layerIndex) * 0.1;
            float cloudBase = smoothstep(threshold, 0.6, combinedNoise);
            
            // Only calculate edge detail when needed to improve performance
            float cloud = cloudBase;
            if (cloudDetail > 0.01) {
              float cloudEdge = smoothstep(threshold - 0.1, threshold, combinedNoise) * edgeDetail;
              cloud = cloudBase + cloudEdge * (1.0 - cloudBase);
            }
            
            // Add depth variation for more volumetric appearance
            float depthVariation = fbm(noiseCoord * 0.5) * 0.3;
            cloud *= 0.7 + depthVariation;
            
            // Apply layer opacity
            cloud *= opacity;
            
            // Implement basic volumetric lighting
            vec3 normalizedLightDir = normalize(lightDirection);
            float lightIntensityFactor = max(0.0, dot(vec3(0.0, 0.0, 1.0), normalizedLightDir));
            float lightEffect = 0.6 + 0.4 * lightIntensityFactor * lightIntensity;
            
            // Create color gradient based on noise
            vec3 color = mix(baseColor, smokeColor, cloud);
            
            // Simpler color variations for better performance
            vec3 colorVariation = vec3(fbm(uv * 5.0 + time * 0.1)) * 0.05;
            color += colorVariation;
            
            // Apply lighting effect
            vec3 litColor = color * lightEffect;
            color = mix(color * 0.7, litColor, cloud);
            
            // Add light scattering effect
            float scatteringFactor = pow(cloud, 3.0) * 0.3 * scattering;
            color += scatteringFactor * lightColor;
            
            // Add subtle internal shadowing
            float innerShadow = fbm(noiseCoord * 3.0 + vec2(8.7, 4.2));
            color = mix(color, color * 0.7, innerShadow * cloud * 0.5);
            
            // Apply atmospheric fog to background layers
            if (layerIndex == 2) {
              vec3 fogColor = vec3(0.8, 0.85, 0.9);
              color = mix(color, fogColor, atmosphericFog * 0.4);
            }
            
            // Output final color with transparency
            gl_FragColor = vec4(color, cloud);
          }
        `,
        transparent: true,
        blending: THREE.NormalBlending,
        depthTest: false,
        depthWrite: false
      };

      // Create a material for the cloud layer
      const cloudMaterial = new THREE.ShaderMaterial(cloudShader);
      this.cloudMaterials.push(cloudMaterial);
    }

    // Create meshes for each cloud layer (from back to front)
    for (let i = 2; i >= 0; i--) {
      const geometry = new THREE.PlaneGeometry(2, 2);
      const mesh = new THREE.Mesh(geometry, this.cloudMaterials[i]);
      this.scene.add(mesh);
    }
  }

  updateMouseTrails() {
    // Update mouse trail textures for each layer
    for (let i = 0; i < 3; i++) {
      // Get the layer settings
      const layerSettings =
        i === 0
          ? this.settings.layer1
          : i === 1
          ? this.settings.layer2
          : this.settings.layer3;

      // Update mouse trail material with improved fluid-like behavior
      this.mouseTrailMeshes[
        i
      ].material.uniforms.trailTexture.value = this.mouseTrailTextures[
        i
      ].texture;
      this.mouseTrailMeshes[i].material.uniforms.mousePos.value.set(
        this.mouse.x,
        this.mouse.y
      );
      this.mouseTrailMeshes[i].material.uniforms.prevMousePos.value.set(
        this.mouse.prevX,
        this.mouse.prevY
      );
      this.mouseTrailMeshes[
        i
      ].material.uniforms.mouseRadius.value = this.settings.mouseRadius;
      this.mouseTrailMeshes[i].material.uniforms.mouseInfluence.value =
        layerSettings.mouseInfluence;
      this.mouseTrailMeshes[
        i
      ].material.uniforms.fadeSpeed.value = this.settings.fadeSpeed;
      this.mouseTrailMeshes[i].material.uniforms.offset.value.set(
        layerSettings.offset.x,
        layerSettings.offset.y
      );
      this.mouseTrailMeshes[
        i
      ].material.uniforms.time.value = this.clock.getElapsedTime();
      this.mouseTrailMeshes[
        i
      ].material.uniforms.buoyancy.value = this.settings.buoyancy;
      this.mouseTrailMeshes[
        i
      ].material.uniforms.mouseFadeStrength.value = this.mouseFadeStrength;

      // Render to the second texture
      this.renderer.setRenderTarget(this.mouseTrailTextures2[i]);
      this.renderer.render(this.mouseTrailScenes[i], this.mouseTrailCamera);

      // Swap textures
      const temp = this.mouseTrailTextures[i];
      this.mouseTrailTextures[i] = this.mouseTrailTextures2[i];
      this.mouseTrailTextures2[i] = temp;

      // Update cloud material with new trail texture
      this.cloudMaterials[
        i
      ].uniforms.mouseTrailTexture.value = this.mouseTrailTextures[i].texture;
    }
  }

  onMouseMove(ev) {
    // Get normalized mouse position
    const x = ev.clientX / window.innerWidth;
    const y = 1.0 - ev.clientY / window.innerHeight; // Flip Y for WebGL

    // Update mouse position
    this.mouse.prevX = this.mouse.x;
    this.mouse.prevY = this.mouse.y;
    this.mouse.x = x;
    this.mouse.y = y;

    // Calculate mouse velocity
    this.mouse.velocity.x = this.mouse.x - this.mouse.prevX;
    this.mouse.velocity.y = this.mouse.y - this.mouse.prevY;

    // Set mouse as active and reset idle time
    this.mouseActive = true;
    this.mouseIdleTime = 0;
  }

  // Same update for touch events
  onTouchMove(ev) {
    ev.preventDefault();

    // Get normalized touch position
    const touch = ev.touches[0];
    const x = touch.clientX / window.innerWidth;
    const y = 1.0 - touch.clientY / window.innerHeight; // Flip Y for WebGL

    // Update mouse position
    this.mouse.prevX = this.mouse.x;
    this.mouse.prevY = this.mouse.y;
    this.mouse.x = x;
    this.mouse.y = y;

    // Calculate mouse velocity
    this.mouse.velocity.x = this.mouse.x - this.mouse.prevX;
    this.mouse.velocity.y = this.mouse.y - this.mouse.prevY;

    // Set mouse as active and reset idle time
    this.mouseActive = true;
    this.mouseIdleTime = 0;
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Update renderer
    this.renderer.setSize(width, height);

    // Update cloud materials
    if (this.cloudMaterials) {
      this.cloudMaterials.forEach((material) => {
        material.uniforms.resolution.value.set(width, height);
      });
    }
  }

  render() {
    const dt = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // Always set mouse inactive initially - will be activated only if actual movement is detected
    this.mouseActive = false;

    // Check for actual movement (using a more reliable method)
    const movementMagnitude = Math.sqrt(
      this.mouse.velocity.x * this.mouse.velocity.x +
        this.mouse.velocity.y * this.mouse.velocity.y
    );

    if (movementMagnitude > 0.0005) {
      this.mouseActive = true;
      this.mouseIdleTime = 0;
    } else {
      this.mouseIdleTime += dt;
    }

    // Calculate fade strength based on activity
    if (this.mouseActive) {
      // Fade in quickly when active
      this.mouseFadeStrength = Math.min(1.0, this.mouseFadeStrength + dt * 5.0);
    } else {
      // Fade out very quickly when inactive (time in seconds to fade from 1.0 to 0.0)
      const fadeOutTime = 0.3;
      this.mouseFadeStrength = Math.max(
        0.0,
        this.mouseFadeStrength - dt * (1.0 / fadeOutTime)
      );
    }

    // Set mouse velocity to zero when inactive to prevent lingering effects
    if (!this.mouseActive) {
      this.mouse.velocity.x = 0;
      this.mouse.velocity.y = 0;
    }

    // Update mouse trails with fluid-like behavior
    this.updateMouseTrails();

    // Update cloud materials
    if (this.cloudMaterials) {
      // Update global settings
      for (let i = 0; i < this.cloudMaterials.length; i++) {
        const material = this.cloudMaterials[i];
        const layerSettings =
          i === 0
            ? this.settings.layer1
            : i === 1
            ? this.settings.layer2
            : this.settings.layer3;

        // Update basic parameters
        material.uniforms.time.value = time;
        material.uniforms.noiseScale.value = this.settings.noiseScale;
        material.uniforms.opacity.value = layerSettings.opacity;
        material.uniforms.scale.value = layerSettings.scale;
        material.uniforms.speed.value = layerSettings.speed;
        material.uniforms.offset.value.set(
          layerSettings.offset.x,
          layerSettings.offset.y
        );
        material.uniforms.depthEffect.value = this.settings.depthEffect;

        // Update realistic effect parameters
        material.uniforms.windDirection.value.set(
          this.settings.windDirection.x,
          this.settings.windDirection.y
        );
        material.uniforms.windStrength.value = this.settings.windStrength;
        material.uniforms.turbulence.value = this.settings.turbulence;
        material.uniforms.lightIntensity.value = this.settings.lightIntensity;
        material.uniforms.scattering.value = this.settings.scattering;
        material.uniforms.cloudDetail.value = this.settings.cloudDetail;
        material.uniforms.buoyancy.value = this.settings.buoyancy;
        material.uniforms.atmosphericFog.value = this.settings.atmosphericFog;
        material.uniforms.useWorleyNoise.value = this.settings.useWorleyNoise
          ? 1.0
          : 0.0;
      }
    }

    // Render final scene
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);
  }

  tick() {
    this.stats.begin();

    this.render();

    this.stats.end();
    requestAnimationFrame(this.tick);
  }
}

// Start the application
window.addEventListener("DOMContentLoaded", () => {
  const app = new App();
});