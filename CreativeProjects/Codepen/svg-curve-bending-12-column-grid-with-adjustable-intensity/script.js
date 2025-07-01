const grid = document.getElementById("grid");
const intensitySlider = document.getElementById("bendIntensity");
const intensityValue = document.getElementById("intensityValue");
let bendIntensity = 150;
const pathRefs = [];
const progresses = new Array(13).fill(0);
const yPositions = new Array(13).fill(0.5);
const times = new Array(13).fill(Math.PI / 2);
let animationFrame = null;
let isMouseInside = false;

function createGrid() {
  const gridWidth = grid.clientWidth - 64; // Accounting for padding
  const columnWidth = gridWidth / 12;
  for (let i = 0; i <= 12; i++) {
    const divider = document.createElement("div");
    divider.className = "divider";
    divider.style.left = `${32 + i * columnWidth}px`;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    svg.appendChild(path);
    divider.appendChild(svg);
    grid.appendChild(divider);
    pathRefs.push(path);
  }
}

function setPath(path, progress, y) {
  const height = grid.clientHeight;
  const width = path.closest("svg").clientWidth;
  const centerX = width / 2;
  path.setAttribute(
    "d",
    `M${centerX} 0 Q${centerX + progress} ${height * y}, ${centerX} ${height}`
  );
}

const lerp = (x, y, a) => x * (1 - a) + y * a;

function handleMouseMove(e) {
  cancelAnimationFrame(animationFrame);
  const gridRect = grid.getBoundingClientRect();
  const mouseX = e.clientX - gridRect.left;
  const mouseY = e.clientY - gridRect.top;

  pathRefs.forEach((path, index) => {
    const pathRect = path.closest(".divider").getBoundingClientRect();
    const pathCenterX = pathRect.left + pathRect.width / 2 - gridRect.left;
    const distanceX = mouseX - pathCenterX;
    const distanceY = mouseY - gridRect.height / 2;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    const maxDistance = gridRect.width / 3;
    const proximityFactor = Math.max(0, 1 - distance / maxDistance);

    yPositions[index] = (mouseY - gridRect.top) / gridRect.height;
    let movementX = e.movementX * (bendIntensity / 150);

    if (isMouseInside) {
      // Bend towards the mouse when inside
      movementX *= proximityFactor * Math.sign(distanceX);
    } else {
      // Bend outwards when mouse is outside
      movementX *= (1 - proximityFactor) * Math.sign(distanceX);
    }

    progresses[index] += movementX;

    setPath(path, progresses[index], yPositions[index]);
  });

  animationFrame = requestAnimationFrame(() => handleMouseMove(e));
}

function handleMouseEnter() {
  isMouseInside = true;
}

function handleMouseLeave() {
  isMouseInside = false;
  cancelAnimationFrame(animationFrame);
  animateOut();
}

function animateOut() {
  let allStraight = true;

  pathRefs.forEach((path, index) => {
    const newProgress = progresses[index] * Math.sin(times[index]);
    progresses[index] = lerp(progresses[index], 0, 0.025);
    times[index] += 0.2;

    setPath(path, newProgress, yPositions[index]);

    if (Math.abs(progresses[index]) > 0.75) {
      allStraight = false;
    }
  });

  if (!allStraight) {
    animationFrame = requestAnimationFrame(animateOut);
  } else {
    resetAnimation();
  }
}

function resetAnimation() {
  progresses.fill(0);
  times.fill(Math.PI / 2);
  yPositions.fill(0.5);
  pathRefs.forEach((path, index) => setPath(path, 0, 0.5));
}

intensitySlider.addEventListener("input", (e) => {
  bendIntensity = parseInt(e.target.value);
  intensityValue.textContent = `Bend Intensity: ${bendIntensity}`;
});

createGrid();
grid.addEventListener("mousemove", handleMouseMove);
grid.addEventListener("mouseenter", handleMouseEnter);
grid.addEventListener("mouseleave", handleMouseLeave);
resetAnimation(); // Initial setup