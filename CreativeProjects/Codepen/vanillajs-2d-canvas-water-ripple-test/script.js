// Get canvas and context
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Simulation parameters
const columns = 100;
const rows = 100;
let damping = 0.97;
let waveSpeedMultiplier = 0.02;
let neighborInfluence = 0.01;

// Cell sizes and gradient cache
let cellWidth, cellHeight;
let gradient;

// Set canvas size and update gradient on resize
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  cellWidth = canvas.width / columns;
  cellHeight = canvas.height / rows;

  // Precompute the gradient for performance
  gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#8a4df8"); // Purple
  gradient.addColorStop(0.33, "#ff3ca5"); // Pink
  gradient.addColorStop(0.66, "#ff7e4f"); // Orange
  gradient.addColorStop(1, "#45c6ff"); // Blue
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Use typed arrays for improved performance
let current = new Float32Array(columns * rows);
let previous = new Float32Array(columns * rows);

// Mouse and touch tracking
let mouseX = 0,
  mouseY = 0,
  lastMouseX = 0,
  lastMouseY = 0;
let isMouseDown = false;

// Event listeners for mouse interactions
canvas.addEventListener("mousemove", (e) => {
  lastMouseX = mouseX;
  lastMouseY = mouseY;

  mouseX = e.clientX;
  mouseY = e.clientY;

  const colIndex = Math.floor(mouseX / cellWidth);
  const rowIndex = Math.floor(mouseY / cellHeight);

  if (colIndex >= 0 && colIndex < columns && rowIndex >= 0 && rowIndex < rows) {
    const index = rowIndex * columns + colIndex;
    // Calculate mouse speed for a proportional disturbance
    const speed = Math.sqrt(
      (mouseX - lastMouseX) ** 2 + (mouseY - lastMouseY) ** 2
    );

    if (speed > 0) {
      current[index] = Math.min(
        1,
        current[index] + speed * waveSpeedMultiplier
      );

      // Disturb neighboring cells for a smoother effect
      if (colIndex > 0)
        current[index - 1] = Math.min(
          1,
          current[index - 1] + speed * neighborInfluence
        );
      if (colIndex < columns - 1)
        current[index + 1] = Math.min(
          1,
          current[index + 1] + speed * neighborInfluence
        );
      if (rowIndex > 0)
        current[index - columns] = Math.min(
          1,
          current[index - columns] + speed * neighborInfluence
        );
      if (rowIndex < rows - 1)
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

// Touch support events
canvas.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      lastMouseX = mouseX;
      lastMouseY = mouseY;

      mouseX = e.touches[0].clientX;
      mouseY = e.touches[0].clientY;
      isMouseDown = true;
    }
  },
  { passive: false }
);

canvas.addEventListener("touchstart", (e) => {
  if (e.touches.length > 0) {
    mouseX = e.touches[0].clientX;
    mouseY = e.touches[0].clientY;
    isMouseDown = true;
  }
});
canvas.addEventListener("touchend", () => (isMouseDown = false));

// Wave simulation update function using the discrete wave equation
function updateWaves() {
  // Process inner grid cells (skipping boundaries for simplicity)
  for (let i = 1; i < rows - 1; i++) {
    for (let j = 1; j < columns - 1; j++) {
      const index = i * columns + j;

      // Get values from neighboring cells
      const north = current[index - columns];
      const south = current[index + columns];
      const east = current[index + 1];
      const west = current[index - 1];

      // Calculate next wave state based on the wave equation
      let nextVal =
        ((north + south + east + west) / 2 - previous[index]) * damping;
      previous[index] = nextVal;
    }
  }

  // Dampen the boundaries to prevent artifacts
  for (let i = 0; i < rows; i++) {
    const indexLeft = i * columns;
    const indexRight = i * columns + (columns - 1);
    current[indexLeft] *= damping;
    current[indexRight] *= damping;
  }
  for (let j = 0; j < columns; j++) {
    current[j] *= damping;
    current[(rows - 1) * columns + j] *= damping;
  }

  // Swap the buffers to use the new state as current
  [current, previous] = [previous, current];
}

// Render the wave simulation on the canvas
function renderWaves() {
  // Clear canvas with a solid background color
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw each cell with significant wave height
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      const index = i * columns + j;
      const value = Math.abs(current[index]);

      if (value > 0.01) {
        const x = j * cellWidth;
        const y = i * cellHeight;
        const radius = Math.max(cellWidth, cellHeight) * value * 2.5;
        ctx.globalAlpha = value * 0.7;
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.arc(x + cellWidth / 2, y + cellHeight / 2, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Add a click (or touch) effect: draw a ring and create a strong disturbance
  if (isMouseDown) {
    const colIndex = Math.floor(mouseX / cellWidth);
    const rowIndex = Math.floor(mouseY / cellHeight);
    if (
      colIndex >= 0 &&
      colIndex < columns &&
      rowIndex >= 0 &&
      rowIndex < rows
    ) {
      const x = colIndex * cellWidth + cellWidth / 2;
      const y = rowIndex * cellHeight + cellHeight / 2;

      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 40, 0, Math.PI * 2);
      ctx.stroke();

      const index = rowIndex * columns + colIndex;
      current[index] = 1.0; // Create a maximum disturbance
    }
  }

  // Reset transparency
  ctx.globalAlpha = 1.0;
}

// Main animation loop using requestAnimationFrame
function animate() {
  updateWaves();
  renderWaves();
  requestAnimationFrame(animate);
}

animate();