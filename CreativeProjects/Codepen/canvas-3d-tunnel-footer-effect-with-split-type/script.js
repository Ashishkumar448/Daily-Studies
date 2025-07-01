document.addEventListener("DOMContentLoaded", () => {
  // Text reveal animation for nav
  const textRevealElements = document.querySelectorAll(
    '[data-animation="text-reveal"] > *'
  );
  textRevealElements.forEach((element) => {
    element.style.transform = "translateY(0)";
    element.style.transition = "transform 1s ease-out";
  });

  // SplitType for the title and footer text
  const titleText = new SplitType("#splitTitle", { types: "chars" });
  const footerText = new SplitType("#footerText", { types: "chars" });

  // Add more subtle animation styles to title characters
  titleText.chars.forEach((char) => {
    char.style.transform = "translateY(20%)"; // Reduced from 100% to 20%
    char.style.transition = "opacity 0.4s ease, transform 0.4s ease"; // Shorter duration
    char.style.opacity = "0";
  });

  // Initialize footer text animation
  footerText.chars.forEach((char, index) => {
    char.style.transitionDelay = `${index * 0.02}s`; // Reduced delay
    setTimeout(() => {
      char.classList.add("visible");
    }, 500 + index * 20); // Reduced delay
  });

  // Simplified scroll-based animation for title
  function animateOnScroll() {
    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;
    const triggerPoint = windowHeight * 0.2; // Trigger earlier

    if (scrollPosition > triggerPoint) {
      titleText.chars.forEach((char, index) => {
        // Shorter staggered delay
        setTimeout(() => {
          char.style.opacity = "1";
          char.style.transform = "translateY(0)";
        }, index * 15); // Reduced from 30ms to 15ms
      });
    }
  }

  // Initial animation on page load - more subtle
  setTimeout(() => {
    titleText.chars.forEach((char, index) => {
      char.style.transitionDelay = `${index * 0.015}s`; // Reduced delay
      setTimeout(() => {
        char.style.opacity = "1";
        char.style.transform = "translateY(0)";
      }, 300 + index * 15); // Reduced delay
    });
  }, 300); // Start sooner

  // Listen for scroll events
  window.addEventListener("scroll", animateOnScroll);

  // Tunnel effect code
  const footer = document.getElementById("footer");
  const canvas = document.getElementById("tunnelCanvas");
  const ctx = canvas.getContext("2d");

  // Canvas dimensions
  let width, height;

  // Mouse position with easing
  let mouseX = 0;
  let mouseY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;
  let isInFooter = false;

  // Tunnel parameters - optimized
  const numRectangles = 25; // Reduced for better performance
  const minSize = 0.02; // Smaller for better depth
  const maxSize = 0.95; // Slightly reduced
  const baseDepth = 0.9; // Adjusted for better depth perception

  // Movement sensitivity - adjusted
  const movementFactor = 0.7; // Increased for more movement
  const verticalReductionFactor = 0.4; // Reduce vertical movement (0.4 = 40% of horizontal)

  // Easing factor for mouse movement
  const easingFactor = 0.08; // Lower = smoother transition

  // Performance optimization - throttle rendering
  let lastRenderTime = 0;
  const minRenderInterval = 16; // ~60fps max

  // Pre-calculate some values for optimization
  const rectangles = [];

  // Function to draw a rectangle with parallax effect
  function drawRectangle(rect, bendX, bendY) {
    const { size, depth, depthFactor } = rect;

    const rectWidth = width * size;
    const rectHeight = height * size;

    // Calculate bending with increased movement - more bend
    const bendFactor = depthFactor * 0.4 * movementFactor; // Increased from 0.25 to 0.4
    const offsetX = -bendX * bendFactor * width;
    const offsetY = -bendY * bendFactor * height;

    // Calculate center point
    const centerX = width / 2 + offsetX;
    const centerY = height / 2 + offsetY;

    // Draw the rectangle with straight corners
    ctx.save();
    ctx.translate(centerX, centerY);

    const halfWidth = rectWidth / 2;
    const halfHeight = rectHeight / 2;

    ctx.beginPath();
    ctx.rect(-halfWidth, -halfHeight, halfWidth * 2, halfHeight * 2);
    ctx.restore();
    ctx.stroke();

    // Add subtle glow effect for closer rectangles
    if (depth < 0.2) {
      const glowAlpha = (1 - depth / 0.2) * 0.15;
      ctx.save();
      ctx.strokeStyle = `rgba(240, 18, 18, ${glowAlpha})`;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
  }

  // Function to draw the entire tunnel
  function drawTunnel() {
    // Throttle rendering for performance
    const now = performance.now();
    if (now - lastRenderTime < minRenderInterval) return;
    lastRenderTime = now;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set line style
    ctx.strokeStyle = "#f01212";
    ctx.lineWidth = 1.5;

    // Draw rectangles from back to front
    for (let i = 0; i < rectangles.length; i++) {
      drawRectangle(rectangles[i], mouseX, mouseY);
    }
  }

  // Animation loop with easing
  function animate() {
    // Apply easing to mouse movement
    mouseX += (targetMouseX - mouseX) * easingFactor;
    mouseY += (targetMouseY - mouseY) * easingFactor;

    drawTunnel();
    requestAnimationFrame(animate);
  }

  // Initialize rectangle data
  function initRectangles() {
    rectangles.length = 0;

    for (let i = 0; i < numRectangles; i++) {
      // Calculate depth (0 = closest, 1 = farthest)
      const depth = i / numRectangles;

      // Enhanced depth perception with more dramatic scaling
      const depthFactor = baseDepth ** (numRectangles - i);
      const size = minSize + (maxSize - minSize) * depthFactor;

      // Pre-calculate and store values
      rectangles.push({
        size,
        depth,
        depthFactor: (1 - depth) ** 2 // More dramatic depth effect
      });
    }
  }

  // Resize handler - optimized
  function resizeCanvas() {
    width = footer.offsetWidth;
    height = footer.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    // Reinitialize rectangles
    initRectangles();
  }

  // Mouse movement handler with easing
  function handleMouseMove(e) {
    // Get mouse position relative to viewport
    const viewportX = e.clientX;
    const viewportY = e.clientY;

    // Get footer position
    const footerRect = footer.getBoundingClientRect();

    // Check if footer is visible in viewport
    const isFooterVisible =
      viewportY >= footerRect.top - window.innerHeight * 0.3 &&
      viewportY <= footerRect.bottom + window.innerHeight * 0.3;

    if (isFooterVisible) {
      isInFooter = true;

      // Calculate position relative to footer center
      const relX = viewportX - (footerRect.left + footerRect.width / 2);
      const relY = viewportY - (footerRect.top + footerRect.height / 2);

      // Normalize to -1 to 1 range with adjusted sensitivity
      // Keep horizontal (X) movement the same
      targetMouseX = (relX / (footerRect.width / 2)) * movementFactor;
      // Reduce vertical (Y) movement by applying reduction factor
      targetMouseY =
        (relY / (footerRect.height / 2)) *
        movementFactor *
        verticalReductionFactor;

      // Clamp values to reasonable range
      targetMouseX = Math.max(-2, Math.min(2, targetMouseX));
      targetMouseY = Math.max(-2, Math.min(2, targetMouseY));
    } else {
      // When outside, don't reset immediately - let easing handle it
      if (isInFooter) {
        // Gradually reduce target values instead of setting to 0 immediately
        targetMouseX *= 0.95;
        targetMouseY *= 0.95;

        // Only reset completely when very close to zero
        if (Math.abs(targetMouseX) < 0.01 && Math.abs(targetMouseY) < 0.01) {
          isInFooter = false;
          targetMouseX = 0;
          targetMouseY = 0;
        }
      }
    }
  }

  // Initialize
  function init() {
    resizeCanvas();

    // Event listeners
    window.addEventListener("resize", resizeCanvas);
    document.addEventListener("mousemove", handleMouseMove);

    // Start animation
    animate();
  }

  init();
});