// Main canvas setup
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false; // Ensure pixel-perfect scaling

// Create an offscreen canvas for the low-resolution simulation
const offCanvas = document.createElement("canvas");
const offCtx = offCanvas.getContext("2d");
offCtx.imageSmoothingEnabled = false; // Disable smoothing for retro look

// Simulation parameters (grid size)
const columns = 100;
const rows = 100;
offCanvas.width = columns;
offCanvas.height = rows;

// Simulation configuration
let damping = 0.97;
let waveSpeedMultiplier = 0.02;
let neighborInfluence = 0.01;

// 8-bit color palette (from dark/background to brighter colors)
const palette = [
  { threshold: 0.0, color: "#111" }, // Background/dark
  { threshold: 0.2, color: "#45c6ff" }, // Blue
  { threshold: 0.4, color: "#8a4df8" }, // Purple
  { threshold: 0.6, color: "#ff3ca5" }, // Pink
  { threshold: 0.8, color: "#ff7e4f" } // Orange
];

// Typed arrays for simulation buffers
let current = new Float32Array(columns * rows);
let previous = new Float32Array(columns * rows);

// Mouse/touch tracking variables
let mouseX = 0,
  mouseY = 0,
  lastMouseX = 0,
  lastMouseY = 0;
let isMouseDown = false;

// Utility: map a value (0 to 1) to an 8-bit color
function get8bitColor(value) {
  value = Math.min(Math.max(value, 0), 1);
  for (let i = palette.length - 1; i >= 0; i--) {
    if (value >= palette[i].threshold) {
      return palette[i].color;
    }
  }
  return palette[0].color;
}

// Resize main canvas to fill the window
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Map main canvas mouse coordinates to simulation grid coordinates
function getSimCoords(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const simX = Math.floor((x / canvas.width) * columns);
  const simY = Math.floor((y / canvas.height) * rows);
  return { simX, simY };
}

// Event listeners for mouse interactions
canvas.addEventListener("mousemove", (e) => {
  lastMouseX = mouseX;
  lastMouseY = mouseY;

  mouseX = e.clientX;
  mouseY = e.clientY;

  const { simX, simY } = getSimCoords(e.clientX, e.clientY);
  if (simX >= 0 && simX < columns && simY >= 0 && simY < rows) {
    const index = simY * columns + simX;
    // Calculate disturbance strength based on mouse speed
    const speed = Math.sqrt(
      (mouseX - lastMouseX) ** 2 + (mouseY - lastMouseY) ** 2
    );
    if (speed > 0) {
      current[index] = Math.min(
        1,
        current[index] + speed * waveSpeedMultiplier
      );
      // Affect neighboring cells for a smoother disturbance
      if (simX > 0)
        current[index - 1] = Math.min(
          1,
          current[index - 1] + speed * neighborInfluence
        );
      if (simX < columns - 1)
        current[index + 1] = Math.min(
          1,
          current[index + 1] + speed * neighborInfluence
        );
      if (simY > 0)
        current[index - columns] = Math.min(
          1,
          current[index - columns] + speed * neighborInfluence
        );
      if (simY < rows - 1)
        current[index + columns] = Math.min(
          1,
          current[index + columns] + speed * neighborInfluence
        );
    }
  }
});

canvas.addEventListener("mousedown", () => (isMouseDown = true));
canvas.addEventListener("mouseup", () => (isMouseDown = false));
canvas.addEventListener("mouseout", () => (isMouseDown = false));

// Touch support events (mapping to simulation grid)
canvas.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      lastMouseX = mouseX;
      lastMouseY = mouseY;
      mouseX = touch.clientX;
      mouseY = touch.clientY;
      isMouseDown = true;
    }
  },
  { passive: false }
);
canvas.addEventListener("touchstart", (e) => {
  if (e.touches.length > 0) {
    const touch = e.touches[0];
    mouseX = touch.clientX;
    mouseY = touch.clientY;
    isMouseDown = true;
  }
});
canvas.addEventListener("touchend", () => (isMouseDown = false));

// Wave simulation update using the discrete wave equation
function updateWaves() {
  for (let i = 1; i < rows - 1; i++) {
    for (let j = 1; j < columns - 1; j++) {
      const index = i * columns + j;
      const north = current[index - columns];
      const south = current[index + columns];
      const east = current[index + 1];
      const west = current[index - 1];

      // Compute next wave state
      let nextVal =
        ((north + south + east + west) / 2 - previous[index]) * damping;
      previous[index] = nextVal;
    }
  }

  // Dampen boundaries to prevent artifacts
  for (let i = 0; i < rows; i++) {
    const leftIndex = i * columns;
    const rightIndex = i * columns + (columns - 1);
    current[leftIndex] *= damping;
    current[rightIndex] *= damping;
  }
  for (let j = 0; j < columns; j++) {
    current[j] *= damping;
    current[(rows - 1) * columns + j] *= damping;
  }

  // Swap buffers so the new state becomes current
  [current, previous] = [previous, current];
}

// Render simulation onto the offscreen canvas (each cell is one pixel)
function renderSimulation() {
  // Clear offscreen canvas
  offCtx.fillStyle = palette[0].color;
  offCtx.fillRect(0, 0, columns, rows);

  // Render each simulation cell
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      const index = i * columns + j;
      let value = Math.abs(current[index]);
      if (value > 0.01) {
        offCtx.fillStyle = get8bitColor(Math.min(value, 1));
        offCtx.fillRect(j, i, 1, 1);
      }
    }
  }

  // Retro-style cursor effect on offscreen simulation when interacting
  if (isMouseDown) {
    const { simX, simY } = getSimCoords(mouseX, mouseY);
    if (simX >= 0 && simX < columns && simY >= 0 && simY < rows) {
      offCtx.strokeStyle = "white";
      offCtx.lineWidth = 1;
      offCtx.strokeRect(simX, simY, 1, 1);
      const index = simY * columns + simX;
      current[index] = 1.0; // Maximum disturbance
    }
  }
}

// Draw the offscreen canvas onto the main canvas with retro effects
function drawScreen() {
  // Scale the offscreen simulation to the main canvas
  ctx.drawImage(offCanvas, 0, 0, canvas.width, canvas.height);

  // Add scanlines for a CRT effect
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  for (let y = 0; y < canvas.height; y += 4) {
    ctx.fillRect(0, y, canvas.width, 1);
  }

  // Optionally: add a retro border around the screen
  ctx.strokeStyle = "black";
  ctx.lineWidth = 10;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

// Main animation loop
function animate() {
  updateWaves();
  renderSimulation();

  // Clear the main canvas and draw the scaled simulation with effects
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawScreen();

  requestAnimationFrame(animate);
}

animate();