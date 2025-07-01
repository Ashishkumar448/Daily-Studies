/*
  JavaScript for Toggling Grid Visibility and Shortcut Modal
  ----------------------------------------------------------
  - Creates a 12-column grid with lines and numbers that can be toggled on/off by pressing the "G" key.
  - Initializes grid visibility based on the 'isVisible' variable:
    - If 'isVisible = true', the grid overlay is visible initially; otherwise, it starts hidden.
  - Toggling the grid updates the 'is--visible' class on the grid overlay.
  - Displays a modal showing available shortcuts when holding the '/' key.
  - Responsive to window resizing and click events outside the modal to close it.
  
  Note: Remove all console.log statements in production to avoid exposing internal logic and improve performance.
*/

const gridOverlay = document.getElementById("grid-overlay");
const gridContainer = document.getElementById("grid-container");
const shortcutModal = document.getElementById("shortcut-modal");
let isVisible = true; // Change this to true or false based on your initial requirement
let isModalVisible = false;

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
  console.log(`Creating ${columns} grid columns...`); // Debugging statement
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
    gridOverlay.classList.add('is--visible'); // Add class if isVisible is true
  } else {
    gridOverlay.classList.remove('is--visible'); // Ensure class is removed if isVisible is false
  }
}

function toggleGrid() {
  isVisible = !isVisible; // Toggle the state
  console.log(`Grid visibility toggled: ${isVisible}`); // Debugging statement
  
  if (isVisible) {
    gridOverlay.classList.add('is--visible'); // Add class if toggled to true
  } else {
    gridOverlay.classList.remove('is--visible'); // Remove class if toggled to false
  }

  // Check if elements exist and are updated
  const columnLines = document.querySelectorAll('.column-line');
  console.log(`Number of column lines: ${columnLines.length}`); // Debugging statement
}

function handleKeyPress(event) {
  if (event.key.toLowerCase() === "g") {
    console.log('G key pressed'); // Debugging statement
    toggleGrid();
  }

  // Show modal while holding the '/' key
  if (event.key === "/") {
    showModal();
  }
}

function handleKeyUp(event) {
  if (event.key === "/") {
    hideModal();
  }
}

function showModal() {
  if (!isModalVisible) {
    shortcutModal.classList.add("visible");
    isModalVisible = true;
    console.log('Shortcut modal shown'); // Debugging statement
  }
}

function hideModal() {
  if (isModalVisible) {
    shortcutModal.classList.remove("visible");
    isModalVisible = false;
    console.log('Shortcut modal hidden'); // Debugging statement
  }
}

function handleClickOutside(event) {
  if (!shortcutModal.contains(event.target)) {
    hideModal();
  }
}

function handleResize() {
  createGridColumns(); // Recreate columns on resize to match new grid column settings
  console.log('Window resized, grid columns recreated'); // Debugging statement
}

// Initial setup
createGridColumns(); // Ensure grid lines are generated
initializeGridVisibility(); // Initialize grid visibility based on isVisible
document.addEventListener("keydown", handleKeyPress);
document.addEventListener("keyup", handleKeyUp);
document.addEventListener("click", handleClickOutside);
window.addEventListener("resize", handleResize);