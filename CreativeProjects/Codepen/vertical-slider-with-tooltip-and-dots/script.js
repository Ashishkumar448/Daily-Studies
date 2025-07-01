const hoverIndicator = document.getElementById("hoverIndicator");
const containers = Array.from(
  hoverIndicator.querySelectorAll(".dot-container")
);

function findActiveIndex(mouseY) {
  let activeIndex = -1;
  let minDistance = Infinity;

  containers.forEach((container, index) => {
    const dot = container.querySelector(".dot");
    const dotRect = dot.getBoundingClientRect();
    const dotCenter = dotRect.top + dotRect.height / 2;

    // Consider the extended hover area
    const hoverAreaTop = dotCenter - 15; // top of hover area
    const hoverAreaBottom = dotCenter + 21; // bottom of hover area

    // If mouse is within the hover area of this dot
    if (mouseY >= hoverAreaTop && mouseY <= hoverAreaBottom) {
      const distance = Math.abs(mouseY - dotCenter);
      if (distance < minDistance) {
        minDistance = distance;
        activeIndex = index;
      }
    }
  });

  return activeIndex;
}

function updateDotStyles(activeIndex, mouseY) {
  const maxScaleDistance = 2;

  containers.forEach((container, index) => {
    const dot = container.querySelector(".dot");
    const tooltip = container.querySelector(".tooltip");
    const dotRect = dot.getBoundingClientRect();
    const dotCenter = dotRect.top + dotRect.height / 2;
    const distanceFromActive = Math.abs(index - activeIndex);

    // Calculate scale
    let scale = 1;
    if (distanceFromActive === 0) {
      scale = 1.25;
    } else if (distanceFromActive <= maxScaleDistance) {
      scale = 1 + (maxScaleDistance - distanceFromActive) * 0.2;
    }

    // Calculate opacity based on distance from mouse
    const distance = Math.abs(mouseY - dotCenter);
    const maxDistance = hoverIndicator.getBoundingClientRect().height / 2;
    const opacity = Math.max(0.3, 1 - distance / maxDistance);

    // Apply styles
    dot.style.transform = `scale(${scale})`;
    dot.style.opacity = opacity;

    // Handle tooltip
    if (index === activeIndex) {
      tooltip.style.opacity = "1";
      tooltip.style.visibility = "visible";
    } else {
      tooltip.style.opacity = "0";
      tooltip.style.visibility = "hidden";
    }
  });
}

// Throttle function
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Mouse move handler
hoverIndicator.addEventListener(
  "mousemove",
  throttle((event) => {
    const activeIndex = findActiveIndex(event.clientY);
    if (activeIndex !== -1) {
      updateDotStyles(activeIndex, event.clientY);
    }
  }, 16)
);

// Mouse leave handler
hoverIndicator.addEventListener("mouseleave", () => {
  containers.forEach((container) => {
    const dot = container.querySelector(".dot");
    const tooltip = container.querySelector(".tooltip");
    dot.style.transform = "";
    dot.style.opacity = "";
    tooltip.style.opacity = "0";
    tooltip.style.visibility = "hidden";
  });
});