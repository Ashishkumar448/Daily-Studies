document.addEventListener("DOMContentLoaded", function () {
  const tooltip = document.getElementById("tooltip");
  const draggablePaths = document.querySelectorAll(".draggable-path");

  // Initially hide tooltip
  tooltip.style.visibility = "hidden";
  tooltip.style.opacity = "0";

  // Track if we're dragging (to prevent tooltip flicker during drag)
  let isDragging = false;

  // Create draggable instances for each letter path
  draggablePaths.forEach((path, index) => {
    // Make each path draggable
    Draggable.create(path, {
      type: "x,y",
      inertia: true,
      onDragStart: function () {
        isDragging = true;
        gsap.to(this.target, { opacity: 0.7, duration: 0.2 });
        hideTooltip();
      },
      onDragEnd: function () {
        isDragging = false;
        gsap.to(this.target, { opacity: 1, duration: 0.2 });
      },
      onPress: function () {
        // Bring to front by appending to parent
        const parent = this.target.parentNode;
        parent.appendChild(this.target);
      }
    });

    // Mouse events for tooltip
    path.addEventListener("mouseenter", function (e) {
      if (!isDragging) {
        showTooltip(e);
      }
    });

    path.addEventListener("mouseleave", function () {
      if (!isDragging) {
        hideTooltip();
      }
    });

    path.addEventListener("mousemove", function (e) {
      if (!isDragging) {
        moveTooltip(e);
      }
    });
  });

  function showTooltip(e) {
    tooltip.style.visibility = "visible";
    tooltip.style.opacity = "1";
    moveTooltip(e);
  }

  function hideTooltip() {
    tooltip.style.visibility = "hidden";
    tooltip.style.opacity = "0";
  }

  function moveTooltip(e) {
    // Position tooltip to the right of the cursor
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    tooltip.style.left = mouseX + 15 + "px";
    tooltip.style.top = mouseY + "px";

    // Keep tooltip on screen
    const tooltipRect = tooltip.getBoundingClientRect();
    const windowWidth = window.innerWidth;

    if (tooltipRect.right > windowWidth) {
      tooltip.style.left = mouseX - tooltipRect.width - 10 + "px";
    }
  }

  // Debug log to verify script is running
  console.log(
    "Draggable functionality initialized for",
    draggablePaths.length,
    "SVG paths"
  );
});