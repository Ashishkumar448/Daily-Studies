const tl = gsap.timeline();

tl.from(".reveal", 1.2, {
  y: 100,
  ease: "power2.out",
  delay: 0.2,
  skewY: 0,
  stagger: {
    amount: 0.6
  }
});

// Set up the canvas
const canvas = document.getElementById("trailCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Variables to track mouse movement
let aimX = window.innerWidth / 2,
  aimY = window.innerHeight / 2;

// Variables for morphing effect
let isHoveringLink = false;
let hoveredLink = null;
let morphProgress = 0;
const morphDuration = 700; // milliseconds
let morphStartTime = 0;

// Variables for controlling trail visibility
let isMouseMoving = false;
let mouseMoveTimeout;
let trailReturning = false; // Tracks if the trail is still returning to the mouse

// GUI settings
const settings = {
  baseLineWidth: 2,
  followSpeed: 1,
  trailSegments: 6,
  lineColor: "#ff0000",
  wiggleStrength: 5,
  numberOfLines: 3,
  offsetAmount: 0, // Base offset amount between lines
  offsetRandomness: 3 // Randomness factor for line offset, finer control
};

// Create an array to hold multiple lines of trails
let lines = [];
const maxLines = 5;

// Initialize the number of lines
let numberOfLines = settings.numberOfLines;

// Utility functions for performance and smoothing
function lerp(a, b, alpha) {
  return a + alpha * (b - a);
}

function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// Function to create a single line with trail points and a random wiggle strength
function createLine(index) {
  let trailSegments = settings.trailSegments;
  const points = [];
  for (let i = 0; i < trailSegments; i++) {
    points.push({ x: aimX, y: aimY }); // Initialize points at current mouse position
  }
  return {
    points,
    wiggleStrength: Math.random() * settings.wiggleStrength, // Assign a random wiggle strength to each line
    offsetX:
      (index + 1) * settings.offsetAmount +
      (Math.random() - 0.5) * settings.offsetAmount * settings.offsetRandomness, // Scaled randomness for better control
    offsetY:
      (index + 1) * settings.offsetAmount +
      (Math.random() - 0.5) * settings.offsetAmount * settings.offsetRandomness // Scaled randomness for better control
  };
}

// Function to create lines based on the number specified
function createLines() {
  lines = [];
  for (let i = 0; i < numberOfLines; i++) {
    lines.push(createLine(i));
  }
}

createLines();

// Function to update the wiggle strengths when the setting changes
function updateWiggleStrengths() {
  lines.forEach((line) => {
    line.wiggleStrength = Math.random() * settings.wiggleStrength; // Update each line's wiggle strength
  });
}

// Create dat.GUI interface
const gui = new dat.GUI();
gui
  .add(settings, "baseLineWidth", 1, 10)
  .name("Line Width")
  .onChange(() => {
    ctx.lineWidth = settings.baseLineWidth;
  });
gui.add(settings, "followSpeed", 0.1, 1).name("Follow Speed");
gui
  .add(settings, "trailSegments", 2, 15, 1)
  .name("Trail Segments")
  .onChange((value) => {
    settings.trailSegments = value;
    createLines(); // Adjust trail points for each line
  });
gui
  .addColor(settings, "lineColor")
  .name("Line Color")
  .onChange(() => {
    ctx.strokeStyle = settings.lineColor;
  });
gui
  .add(settings, "wiggleStrength", 0, 20)
  .name("Wiggle Strength")
  .onChange(updateWiggleStrengths); // Update wiggle strengths for each line
gui
  .add(settings, "numberOfLines", 1, maxLines, 1)
  .name("Number of Lines")
  .onChange((value) => {
    numberOfLines = value;
    createLines(); // Recreate lines when the count changes
  });
gui
  .add(settings, "offsetAmount", 0, 20)
  .name("Offset Amount")
  .onChange(createLines); // Adjust base offset
gui
  .add(settings, "offsetRandomness", 0, 5)
  .name("Offset Randomness")
  .onChange(createLines); // Finer control over randomness

// Function to draw all lines
function drawTrail() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Only draw trails if the mouse is moving, hovering over a link, or the trail is returning
  if (isMouseMoving || isHoveringLink || trailReturning) {
    // Handle morph progress based on hovering state
    const now = Date.now();
    morphProgress = isHoveringLink
      ? Math.min(1, (now - morphStartTime) / morphDuration)
      : Math.max(0, 1 - (now - morphStartTime) / morphDuration);

    lines.forEach((line, lineIndex) => {
      const { points, wiggleStrength, offsetX, offsetY } = line;
      ctx.beginPath();
      ctx.strokeStyle = settings.lineColor;
      ctx.lineWidth = settings.baseLineWidth;

      // Draw each point in the line with its wiggle effect and offset
      points.forEach((point, index) => {
        const jitterX =
          index === 0 ? 0 : (Math.random() - 0.5) * wiggleStrength;
        const jitterY =
          index === 0 ? 0 : (Math.random() - 0.5) * wiggleStrength;

        // Apply the offset to each line to distinguish them visually
        const x = point.x + jitterX + offsetX;
        const y = point.y + jitterY + offsetY;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Update point positions based on morphing and following
      for (let i = points.length - 1; i > 0; i--) {
        points[i].x += (points[i - 1].x - points[i].x) * 0.5;
        points[i].y += (points[i - 1].y - points[i].y) * 0.5;
      }

      // Check if the trail is still moving towards the mouse position
      const distanceToMouse = distance(points[0].x, points[0].y, aimX, aimY);
      trailReturning = distanceToMouse > 1;

      // Reset the trail visibility logic only when it has fully returned
      if (!trailReturning && !isMouseMoving && !isHoveringLink) {
        isMouseMoving = false;
      }

      if (isHoveringLink && hoveredLink) {
        // Morph the trail to align precisely under the hovered link
        const linkRect = hoveredLink.getBoundingClientRect();
        const startX = linkRect.left;
        const endX = linkRect.right;
        const underlineY = linkRect.bottom + 5;

        points[0].x = lerp(points[0].x, startX, morphProgress);
        points[0].y = lerp(points[0].y, underlineY, morphProgress);
        points[points.length - 1].x = lerp(
          points[points.length - 1].x,
          endX,
          morphProgress
        );
        points[points.length - 1].y = lerp(
          points[points.length - 1].y,
          underlineY,
          morphProgress
        );

        for (let i = 1; i < points.length - 1; i++) {
          const t = i / (points.length - 1);
          points[i].x = lerp(
            points[i].x,
            startX + t * (endX - startX),
            morphProgress
          );
          points[i].y = lerp(points[i].y, underlineY, morphProgress);
        }
      } else {
        points[0].x += (aimX - points[0].x) * settings.followSpeed;
        points[0].y += (aimY - points[0].y) * settings.followSpeed;
      }
    });
  }

  requestAnimationFrame(drawTrail);
}

// Start drawing the trail
drawTrail();

document.addEventListener("mousemove", (event) => {
  aimX = event.pageX;
  aimY = event.pageY;

  // Show trails on mouse movement
  isMouseMoving = true;
  clearTimeout(mouseMoveTimeout);

  // Set trailReturning to true to ensure it doesn't hide until fully back
  trailReturning = true;

  // Hide trails if no movement is detected after 500 milliseconds and the trail is fully returned
  mouseMoveTimeout = setTimeout(() => {
    if (!isHoveringLink && !trailReturning) {
      isMouseMoving = false;
    }
  }, 500);
});

// Hover effect for links
document.querySelectorAll("a").forEach((link) => {
  link.addEventListener("mouseenter", (e) => {
    isHoveringLink = true;
    hoveredLink = e.target;
    morphStartTime = Date.now();
    isMouseMoving = true; // Ensure trails are visible when hovering
    clearTimeout(mouseMoveTimeout); // Cancel any hiding of the trail
  });

  link.addEventListener("mouseleave", () => {
    isHoveringLink = false;
    morphStartTime = Date.now();
    // Set the visibility logic to rely solely on mouse movement after leaving the link
    mouseMoveTimeout = setTimeout(() => {
      if (!trailReturning) {
        isMouseMoving = false;
      }
    }, 500);
  });
});