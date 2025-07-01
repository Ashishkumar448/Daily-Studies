// Configuration
const config = {
  rows: 20,
  cols: 20,
  maxDistance: 120, // Max distance for effect in pixels
  maxScale: 3.5, // Maximum dot scale
  minScale: 1, // Minimum dot scale
  inactivityDelay: 1000, // Time before returning to normal state (ms)
  transitionSpeed: 0.6, // Speed of transition when inactive (seconds)
  activeTransition: 0.3 // Speed of transition when active (seconds)
};

const container = document.getElementById("grid-container");
const width = container.offsetWidth;
const height = container.offsetHeight;
const dots = [];

let isActive = false;
let lastActiveTime = 0;
let inactivityTimer = null;
let mouseX = 0,
  mouseY = 0;

// Create grid of dots
function createGrid() {
  const cellWidth = width / config.cols;
  const cellHeight = height / config.rows;

  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.cols; col++) {
      const dot = document.createElement("div");
      dot.className = "dot";

      // Position each dot
      const x = col * cellWidth + cellWidth / 2;
      const y = row * cellHeight + cellHeight / 2;
      dot.style.left = x + "px";
      dot.style.top = y + "px";

      // Store original position for calculations
      dot.dataset.x = x;
      dot.dataset.y = y;

      container.appendChild(dot);
      dots.push(dot);
    }
  }
}

// Handle mouse movement
function handleMouseMove(e) {
  // Update activity state
  isActive = true;
  lastActiveTime = Date.now();
  clearTimeout(inactivityTimer);

  // Set transition to faster for responsive feel during activity
  dots.forEach((dot) => {
    dot.style.transition = `transform ${config.activeTransition}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
  });

  // Get mouse position relative to container
  const rect = container.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;

  // Schedule inactivity check
  inactivityTimer = setTimeout(checkActivity, config.inactivityDelay);

  // Update dots based on current mouse position
  updateDots();
}

// Update dot positions and scales
function updateDots() {
  // Skip if not active
  if (!isActive) return;

  // Update each dot based on distance from mouse
  dots.forEach((dot) => {
    const dotX = parseFloat(dot.dataset.x);
    const dotY = parseFloat(dot.dataset.y);

    // Calculate distance
    const dx = mouseX - dotX;
    const dy = mouseY - dotY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < config.maxDistance) {
      // Calculate scale based on distance (closer = larger)
      const scale =
        config.minScale +
        (config.maxScale - config.minScale) *
          (1 - distance / config.maxDistance);

      // Calculate slight attraction toward cursor for more organic feel
      const attraction = 10 * (1 - distance / config.maxDistance);
      const moveX = (dx / distance) * attraction;
      const moveY = (dy / distance) * attraction;

      // Apply transformations
      dot.style.transform = `translate(${moveX}px, ${moveY}px) scale(${scale})`;
    } else {
      // Reset to default scale
      dot.style.transform = `scale(${config.minScale})`;
    }
  });
}

// Check if mouse has been inactive
function checkActivity() {
  const currentTime = Date.now();
  const timeSinceActive = currentTime - lastActiveTime;

  if (timeSinceActive >= config.inactivityDelay) {
    // Set to inactive and transition back to normal
    isActive = false;

    // Set slower transition for nice return to default state
    dots.forEach((dot) => {
      dot.style.transition = `transform ${config.transitionSpeed}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
      dot.style.transform = `scale(${config.minScale})`;
    });
  } else {
    // Check again later
    inactivityTimer = setTimeout(checkActivity, 100);
  }
}

// Initialize
createGrid();
container.addEventListener("mousemove", handleMouseMove);

// Reset all dots when mouse leaves container
container.addEventListener("mouseleave", () => {
  isActive = false;
  dots.forEach((dot) => {
    dot.style.transition = `transform ${config.transitionSpeed}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
    dot.style.transform = `scale(${config.minScale})`;
  });
});