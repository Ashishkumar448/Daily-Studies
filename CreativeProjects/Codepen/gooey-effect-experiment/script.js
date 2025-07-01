document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("container");
  const gooContainer = document.getElementById("goo-container");

  // Configuration
  const config = {
    edgeSegments: 12, // Number of fluid segments per edge
    bridgeElements: 35, // Bridge elements for connections
    cursorSize: 22, // Size of cursor element - larger for more visibility
    edgeSizes: [14, 16], // Edge blob sizes
    bridgeSize: 10, // Bridge blob size
    edgeRange: 120, // Distance from edge where effect begins
    edgeIntensity: 2, // How intense the effect is near edges
    maxPullAmount: 40 // Maximum pull amount
  };

  // Create cursor element that is always visible
  const cursorElement = document.createElement("div");
  cursorElement.className = "fluid-element fluid-cursor";
  cursorElement.style.width = config.cursorSize + "px";
  cursorElement.style.height = config.cursorSize + "px";
  gooContainer.appendChild(cursorElement);

  // Create edge fluid elements
  const edgeElements = {
    left: [],
    right: [],
    top: [],
    bottom: []
  };

  // Create edge elements for each side
  Object.keys(edgeElements).forEach((edge) => {
    for (let i = 0; i < config.edgeSegments; i++) {
      const element = document.createElement("div");
      element.className = "fluid-element fluid-edge";

      // Use varied sizes for edge elements
      const sizeIndex = i % config.edgeSizes.length;
      const size = config.edgeSizes[sizeIndex];
      element.style.width = size + "px";
      element.style.height = size + "px";

      // Position at edges
      switch (edge) {
        case "left":
          element.style.left = "0px";
          break;
        case "right":
          element.style.right = "0px";
          break;
        case "top":
          element.style.top = "0px";
          break;
        case "bottom":
          element.style.bottom = "0px";
          break;
      }

      gooContainer.appendChild(element);
      edgeElements[edge].push({
        element: element,
        size: size,
        originalPosition: i / (config.edgeSegments - 1) // 0-1 position along edge
      });
    }
  });

  // Create bridge elements
  const bridgeElements = [];
  for (let i = 0; i < config.bridgeElements; i++) {
    const element = document.createElement("div");
    element.className = "fluid-element fluid-bridge";
    element.style.width = config.bridgeSize + "px";
    element.style.height = config.bridgeSize + "px";
    gooContainer.appendChild(element);
    bridgeElements.push(element);
  }

  // Hide all elements when mouse leaves container
  container.addEventListener("mouseleave", function () {
    cursorElement.style.display = "none";

    // Hide all edge elements
    Object.values(edgeElements).forEach((elementArray) => {
      elementArray.forEach((item) => {
        item.element.style.display = "none";
      });
    });

    // Hide bridge elements
    bridgeElements.forEach((element) => {
      element.style.display = "none";
    });

    // Cancel any pending animation
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  });

  // Show cursor element when mouse enters container
  container.addEventListener("mouseenter", function () {
    cursorElement.style.display = "block";
  });

  // Generate point between two points
  function interpolatePoint(x1, y1, x2, y2, t) {
    return {
      x: x1 * (1 - t) + x2 * t,
      y: y1 * (1 - t) + y2 * t
    };
  }

  // Handle mouse movement
  let lastX = 0;
  let lastY = 0;
  let rafId = null;

  container.addEventListener("mousemove", function (e) {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Store last position
    lastX = x;
    lastY = y;

    // Position cursor element immediately
    const halfCursorSize = config.cursorSize / 2;
    cursorElement.style.left = x - halfCursorSize + "px";
    cursorElement.style.top = y - halfCursorSize + "px";

    // Request animation frame for fluid updates
    if (!rafId) {
      rafId = requestAnimationFrame(updateFluid);
    }
  });

  function updateFluid() {
    rafId = null;

    const x = lastX;
    const y = lastY;
    const rect = {
      width: container.offsetWidth,
      height: container.offsetHeight
    };

    // Calculate distance to each edge
    const distToLeft = x;
    const distToRight = rect.width - x;
    const distToTop = y;
    const distToBottom = rect.height - y;

    // Track which edges are active
    const activeEdges = [];
    let nearEdge = false;

    // Calculate proximity to any edge (0 = far from edge, 1 = at edge)
    const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
    const edgeProximity = Math.max(0, 1 - minDist / config.edgeRange);

    // Process each edge
    [
      {
        name: "left",
        distance: distToLeft,
        maxPos: rect.height,
        posVar: "top",
        trailPos: y
      },
      {
        name: "right",
        distance: distToRight,
        maxPos: rect.height,
        posVar: "top",
        trailPos: y
      },
      {
        name: "top",
        distance: distToTop,
        maxPos: rect.width,
        posVar: "left",
        trailPos: x
      },
      {
        name: "bottom",
        distance: distToBottom,
        maxPos: rect.width,
        posVar: "left",
        trailPos: x
      }
    ].forEach((edge) => {
      // Only activate when close to edge
      if (edge.distance < config.edgeRange) {
        nearEdge = true;
        activeEdges.push(edge);

        // Exponential intensity factor - stronger at the edge
        const intensityFactor = Math.pow(
          1 - edge.distance / config.edgeRange,
          config.edgeIntensity
        );

        // Update each element along this edge
        edgeElements[edge.name].forEach((item) => {
          // Calculate position along edge
          const basePosition = item.originalPosition * edge.maxPos;

          // Distance from mouse position along the edge
          const distAlongEdge = Math.abs(edge.trailPos - basePosition);
          const edgeMaxInfluence = edge.maxPos * 0.3; // Influence radius along edge
          const alongEdgeFactor = Math.max(
            0,
            1 - distAlongEdge / edgeMaxInfluence
          );

          // Only show elements near mouse position
          if (alongEdgeFactor > 0.1) {
            item.element.style.display = "block";

            // Calculate pull amount - stronger near edge
            const pullAmount =
              intensityFactor * config.maxPullAmount * alongEdgeFactor;

            // Position element with appropriate pull (inward from edge)
            if (edge.name === "left" || edge.name === "right") {
              // Vertical edges
              item.element.style.top = basePosition + "px";

              if (edge.name === "left") {
                item.element.style.left = pullAmount + "px";
              } else {
                // right
                item.element.style.left =
                  rect.width - pullAmount - item.size + "px";
              }
            } else {
              // Horizontal edges
              item.element.style.left = basePosition + "px";

              if (edge.name === "top") {
                item.element.style.top = pullAmount + "px";
              } else {
                // bottom
                item.element.style.top =
                  rect.height - pullAmount - item.size + "px";
              }
            }

            // Scale based on proximity to edge
            const scale = 1 + intensityFactor * 0.8;
            item.element.style.transform = `scale(${scale})`;
          } else {
            item.element.style.display = "none";
          }
        });
      } else {
        // Hide elements for inactive edges
        edgeElements[edge.name].forEach((item) => {
          item.element.style.display = "none";
        });
      }
    });

    // Only show bridges when near an edge
    if (nearEdge) {
      // Get all visible edge elements
      const visibleEdgeElements = [];
      activeEdges.forEach((edge) => {
        edgeElements[edge.name].forEach((item) => {
          if (item.element.style.display === "block") {
            // Get element position
            const elemX = parseFloat(item.element.style.left) + item.size / 2;
            const elemY = parseFloat(item.element.style.top) + item.size / 2;

            // Only add if position is valid
            if (!isNaN(elemX) && !isNaN(elemY)) {
              // Calculate distance to cursor
              const dist = Math.hypot(elemX - x, elemY - y);
              visibleEdgeElements.push({
                edge: edge.name,
                x: elemX,
                y: elemY,
                item,
                distance: dist
              });
            }
          }
        });
      });

      // Sort edge elements by distance to cursor
      visibleEdgeElements.sort((a, b) => a.distance - b.distance);

      // Use only closest elements for connections
      const closestElements = visibleEdgeElements.slice(
        0,
        Math.min(6, visibleEdgeElements.length)
      );

      // Calculate max bridge distance - only show bridges when close enough
      let maxBridgeDistance = config.edgeRange * 0.7;
      let shouldShowBridges = closestElements.some(
        (elem) => elem.distance < maxBridgeDistance
      );

      // Show bridge elements
      if (shouldShowBridges && edgeProximity > 0.2) {
        // Create bridge connections
        bridgeElements.forEach((element, i) => {
          if (i < config.bridgeElements && i < closestElements.length * 7) {
            // Choose which edge element to connect to
            const edgeElementIndex = Math.floor(i / 7);
            if (edgeElementIndex >= closestElements.length) {
              element.style.display = "none";
              return;
            }

            const edgeElement = closestElements[edgeElementIndex];

            // Calculate position along path
            const t = ((i % 7) + 1) / 8; // 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875
            const pos = interpolatePoint(x, y, edgeElement.x, edgeElement.y, t);

            // Show bridge element
            element.style.display = "block";
            element.style.left = pos.x - config.bridgeSize / 2 + "px";
            element.style.top = pos.y - config.bridgeSize / 2 + "px";

            // Scale based on position along path
            const pathScale = 0.7 + Math.sin(t * Math.PI) * 0.5;
            element.style.transform = `scale(${pathScale})`;
          } else {
            element.style.display = "none";
          }
        });
      } else {
        // Hide bridge elements
        bridgeElements.forEach((element) => {
          element.style.display = "none";
        });
      }
    } else {
      // Hide bridge elements
      bridgeElements.forEach((element) => {
        element.style.display = "none";
      });
    }

    // Continue animation if near edge
    if (nearEdge) {
      rafId = requestAnimationFrame(updateFluid);
    }
  }
});