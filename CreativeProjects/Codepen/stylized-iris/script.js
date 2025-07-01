// Create and append the canvas to the body
const canvas = document.createElement("canvas");
canvas.id = "shaderCanvas";
document.body.appendChild(canvas);

// Basic Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10); // Orthographic camera to map directly to screen
camera.position.z = 1;

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  canvas: canvas
}); // Enable alpha for transparency
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); // Set pixel ratio for high-DPI screens
renderer.setClearColor(0x000000, 0); // Set clear color to fully transparent

// Resize canvas on window resize
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  material.uniforms.iResolution.value.set(
    window.innerWidth,
    window.innerHeight
  );
});

// Variables for mouse interaction and color
let mouseX = 0.0;
let mouseY = 0.0;
let irisColor = new THREE.Vector3(0.941, 0.549, 0.392); // Initial iris color

// Full-screen quad geometry
const geometry = new THREE.PlaneGeometry(2, 2);

// Fragment Shader with Pupil Following Mouse and Iris Centered
const fragmentShader = `
precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
uniform vec3 irisColor;

const vec3 PUPIL_COL = vec3(0.0, 0.0, 0.0);
const float BASE_SIZE = 0.7; // Base size of the eye
const float BASE_PUPIL = BASE_SIZE * 0.3; // Base size of the pupil
const float NOISE = 20.5;

vec3 hue(vec3 col, float hue) {
    return mix(vec3(dot(vec3(0.333), col)), col, cos(hue)) + cross(vec3(0.577), col) * sin(hue);
}

float hash12(vec2 p) {
    vec3 p3 = fract(p.xyx * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f *= f * f * (f * (6.0 * f - 15.0) + 10.0);
    float res = mix(
        mix(hash12(i), hash12(i + vec2(1, 0)), f.x),
        mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1)), f.x), f.y);
    return res;    
}

void main() {
    vec4 fragColor = vec4(0, 0, 0, 0); // Set alpha to 0 for full transparency
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);
    
    // Adjust sizes based on screen resolution
    float aspectRatio = iResolution.x / iResolution.y;
    float size = BASE_SIZE * (0.6 + 0.4 * aspectRatio); // Dynamically adjust size based on aspect ratio
    float pupilSize = BASE_PUPIL * (0.1 * sin(iTime * 2.0) + 0.9) * size / BASE_SIZE; // Scale pupil size based on screen size

    float l = length(uv);
    float f = length(fwidth(uv)) * 5.0; // Adjust this for a nice effect
    if (l > size + f) {
        gl_FragColor = fragColor;
        return;
    }
    
    // Pupil movement following the mouse, centered within the iris
    vec2 pupilOffset = (iMouse - 0.5) * 0.2 * size; // Adjust to control how much the pupil moves with the mouse
    uv -= pupilOffset;

    float nl = max(0.0, l - pupilSize) / (size - pupilSize);
    float bump = (nl * (1.0 - nl));
    float a = atan(uv.y, uv.x) + bump * 0.3;
    float sl = 0.5 + 0.5 * sqrt(l);
    vec2 nv = vec2(cos(a), sin(a)) * sl;
    float rl = (1.0 - nl * nl * nl);
    
    float iris_exposure = rl * (noise(nv * NOISE + iTime * 0.5) - 0.5);
    nv = vec2(cos(a + 0.1), sin(a + 0.1)) * sl;
    float iris_brightness = rl * (noise(nv * NOISE - iTime * 0.5) - 0.5);
    nl = max(0.0, l - pupilSize) / (size - pupilSize);
    
    float iris = smoothstep(size + f, size - f, l);
    float m = 0.1;
    float pupil = smoothstep(pupilSize + m * (0.5 + iris_exposure), pupilSize - m * (0.5 + iris_brightness), l);
    
    vec3 iris_col = (iris_exposure + 1.0) * irisColor; // Use dynamic iris color
    vec3 pupil_col = PUPIL_COL;
    
    iris_brightness = smoothstep(0.0, 1.0, abs(iris_brightness));
    iris_col = mix(iris_col, iris_exposure + vec3(1), iris_brightness * 2.0);
    iris_col += 2.0 * abs(iris_exposure - iris_brightness) * (1.0 - nl) * nl;
    iris_col *= smoothstep(1.3, 0.7, nl);
    
    float hn = noise(uv * 2.5) - 0.5;
    iris_col = hue(iris_col, 0.4 * hn + sin(iTime) * 0.1);
    
    float gloss = noise(uv * (1.0 - nl) * 12.5);
    gloss *= gloss;
    gloss = smoothstep(0.2, 0.8, gloss);
    gloss *= gloss * rl;
    gloss *= (smoothstep(3.1, 1.1, a) * smoothstep(-0.5, 0.9, a) * 0.9 +
              smoothstep(-3.1, -2.1, a) * smoothstep(0.4, -1.4, a) * 0.5);
    iris_col += gloss * 1.5;
    
    iris_col += rl * iris_exposure * (1.0 - rl);
    
    float he = noise(hn * 3.0 - uv * 6.0) + noise(hn * 4.0 + uv * 12.0) * 0.5;
    he = sqrt(he);
    iris_col = hue(iris_col, he - 0.5);
  
    vec3 col = mix(iris_col, pupil_col, pupil);
    col *= iris;  

    gl_FragColor = vec4(col, iris); // Apply iris transparency based on the alpha value
}
`;

// Shader Material with Fragment Shader
const material = new THREE.ShaderMaterial({
  vertexShader: `
    void main() {
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: fragmentShader,
  uniforms: {
    iResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight)
    },
    iTime: { value: 0.0 },
    iMouse: { value: new THREE.Vector2(0.0, 0.0) },
    irisColor: { value: irisColor }
  },
  transparent: true // Ensure that the material itself is transparent
});

// Mesh and Scene Setup
const quad = new THREE.Mesh(geometry, material);
scene.add(quad);

// Mouse movement handler to update shader with current mouse position
window.addEventListener("mousemove", (event) => {
  mouseX = event.clientX / window.innerWidth;
  mouseY = 1.0 - event.clientY / window.innerHeight; // Invert Y axis
  material.uniforms.iMouse.value.set(mouseX, mouseY);
});

// Click handler to change iris color randomly
window.addEventListener("click", () => {
  irisColor = new THREE.Vector3(Math.random(), Math.random(), Math.random()); // Random color
  material.uniforms.irisColor.value = irisColor;
});

// Animation Loop
const animate = () => {
  requestAnimationFrame(animate);
  material.uniforms.iTime.value += 0.01; // Update time uniform for animations
  renderer.render(scene, camera);
};

// Start the animation
animate();

// Grid and stuff

const gridOverlay = document.getElementById("grid-overlay");
const gridContainer = document.getElementById("grid-container");
const shortcutModal = document.getElementById("shortcut-modal");
let isVisible = true; // Change this to true or false based on your initial requirement
let isModalVisible = false;
let currentTheme = "light"; // Default theme
let randomThemeIndex = 0; // Initialize the index for cycling through random themes

// Themes list in order for cycling
const themes = {
  light: "theme--light",
  dark: "theme--dark",
  sequential: [
    "theme--01",
    "theme--02",
    "theme--03",
    "theme--04",
    "theme--05",
    "theme--06"
  ]
};

function getColumns() {
  return parseInt(
    getComputedStyle(document.documentElement).getPropertyValue(
      "--grid-columns"
    )
  );
}

function createGridColumns() {
  gridContainer.innerHTML = ""; // Clear existing columns
  const columns = getColumns();
  for (let i = 1; i <= columns; i++) {
    const column = document.createElement("div");
    column.className = "grid-column";
    column.innerHTML = `
      <div class="column-number">${i} <span>↴</span></div>
      <div class="column-line"></div>
    `;
    gridContainer.appendChild(column);
  }
}

function initializeGridVisibility() {
  if (isVisible) {
    gridOverlay.classList.add("is--visible"); // Add class if isVisible is true
  } else {
    gridOverlay.classList.remove("is--visible"); // Ensure class is removed if isVisible is false
  }
}

function toggleGrid() {
  isVisible = !isVisible; // Toggle the state

  if (isVisible) {
    gridOverlay.classList.add("is--visible"); // Add class if toggled to true
  } else {
    gridOverlay.classList.remove("is--visible"); // Remove class if toggled to false
  }
}

function handleKeyPress(event) {
  if (event.key.toLowerCase() === "g") {
    toggleGrid();
  }

  // Show modal while holding the '/' key
  if (event.key === "/") {
    showModal();
  }

  // Theme switching keys
  if (event.key.toLowerCase() === "w") {
    toggleLightDarkTheme();
  } else if (event.key.toLowerCase() === "b") {
    toggleLightDarkTheme();
  } else if (event.key.toLowerCase() === "r") {
    switchSequentialTheme(); // Cycle through themes in order
  }
}

function handleKeyUp(event) {
  if (event.key === "/") {
    hideModal();
  }
}

function toggleLightDarkTheme() {
  if (currentTheme === "dark") {
    switchToLightTheme();
  } else {
    switchToDarkTheme();
  }
}

function switchToLightTheme() {
  currentTheme = "light";
  document.body.className = themes.light; // Set light theme
}

function switchToDarkTheme() {
  currentTheme = "dark";
  document.body.className = themes.dark; // Set dark theme
}

function switchSequentialTheme() {
  // Get the next theme in the list
  const nextTheme = themes.sequential[randomThemeIndex];
  document.body.className = nextTheme;

  // Update the index to the next theme, wrapping back to 0 if at the end
  randomThemeIndex = (randomThemeIndex + 1) % themes.sequential.length;
}

function showModal() {
  if (!isModalVisible) {
    shortcutModal.classList.add("visible");
    isModalVisible = true;
  }
}

function hideModal() {
  if (isModalVisible) {
    shortcutModal.classList.remove("visible");
    isModalVisible = false;
  }
}

function handleClickOutside(event) {
  if (!shortcutModal.contains(event.target)) {
    hideModal();
  }
}

function handleResize() {
  createGridColumns(); // Recreate columns on resize to match new grid column settings
}

// Initial setup
createGridColumns(); // Ensure grid lines are generated
initializeGridVisibility(); // Initialize grid visibility based on isVisible
document.addEventListener("keydown", handleKeyPress);
document.addEventListener("keyup", handleKeyUp);
document.addEventListener("click", handleClickOutside);
window.addEventListener("resize", handleResize);