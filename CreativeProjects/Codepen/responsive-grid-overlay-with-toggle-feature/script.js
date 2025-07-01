const gridOverlay = document.getElementById("grid-overlay");
const gridContainer = document.getElementById("grid-container");
let isVisible = true; // Initial visibility of the grid

// Adjust viewport height on mobile to ensure 100vh works as expected
function setFullHeight() {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

window.addEventListener("resize", setFullHeight);
window.addEventListener("load", setFullHeight);

// Get the number of columns based on CSS variable
function getColumns() {
  return parseInt(
    getComputedStyle(document.documentElement).getPropertyValue(
      "--grid-columns"
    )
  );
}

// Create grid columns with lines
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

// Initialize grid visibility based on the current state
function initializeGridVisibility() {
  if (isVisible) {
    gridOverlay.classList.add("is--visible"); // Show the grid initially
  } else {
    gridOverlay.classList.remove("is--visible"); // Hide the grid if not visible
  }
}

// Toggle the grid visibility
function toggleGrid() {
  isVisible = !isVisible; // Toggle the visibility state
  if (isVisible) {
    gridOverlay.classList.add("is--visible");
  } else {
    gridOverlay.classList.remove("is--visible");
  }
}

// Handle key press events to toggle the grid with the "G" key
function handleKeyPress(event) {
  if (event.key.toLowerCase() === "g") {
    toggleGrid();
  }
}

// Recreate grid columns on resize to match new grid column settings
function handleResize() {
  createGridColumns();
}

// Initial setup
createGridColumns(); // Generate grid lines
initializeGridVisibility(); // Set initial grid visibility
document.addEventListener("keydown", handleKeyPress); // Listen for "G" key to toggle grid
window.addEventListener("resize", handleResize); // Recreate grid on resize

document.addEventListener("DOMContentLoaded", () => {
  const items = document.querySelectorAll(".num-grid__item");
  items.forEach((item, index) => {
    item.style.setProperty("--animation-order", index);
  });
});