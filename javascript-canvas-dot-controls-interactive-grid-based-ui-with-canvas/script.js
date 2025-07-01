document.addEventListener("DOMContentLoaded", () => {
  // Font sizes
  const FONT_SIZES = [10, 12, 14, 16, 18, 20, 22];
  // Control values - start at 0 for animation
  let brightnessValue = 0;
  let volumeValue = 0;
  let fontSizeIndex = 0; // 10px
  // Target values - where the animation will end
  const targetBrightnessValue = 68;
  const targetVolumeValue = 45;
  const targetFontSizeIndex = 2; // 14px
  // Get canvas elements
  const brightnessCanvas = document.getElementById("brightness-canvas");
  const volumeCanvas = document.getElementById("volume-canvas");
  const fontSizeCanvas = document.getElementById("font-size-canvas");
  // Get display elements
  const brightnessDisplay = document.getElementById("brightness-display");
  const volumeDisplay = document.getElementById("volume-display");
  const fontSizeDisplay = document.getElementById("font-size-display");
  // Get control elements
  const brightnessControl = document.getElementById("brightness-control");
  const volumeControl = document.getElementById("volume-control");
  const fontSizeControl = document.getElementById("font-size-control");
  // Get audio element
  const audio = document.getElementById("audio-player");
  // Set canvas dimensions with higher resolution for better rendering
  function setupCanvas(canvas) {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    return ctx;
  }
  // Get contexts
  let brightnessCtx = setupCanvas(brightnessCanvas);
  let volumeCtx = setupCanvas(volumeCanvas);
  let fontSizeCtx = setupCanvas(fontSizeCanvas);
  // Define grid dimensions - more dots for better detail
  const COLS = 15;
  const ROWS = 30;
  // Define icon patterns - improved based on examples
  // New brightness icon with 21x21 grid
  const sunIcon = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ];
  // Volume icon with 21x21 grid
  const volumeIcon = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ];
  // New font size icon with 15x15 grid (using the provided pattern)
  const fontIconSmall = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ];
  // Scale factor to make the font icon visually match the others
  const scaleFactor = 0.8;
  // Create a scaled version of the font icon
  const scaledFontIcon = Array(15)
    .fill()
    .map(() => Array(15).fill(0));
  // Calculate the center of the original icon
  const centerX = Math.floor(fontIconSmall[0].length / 2);
  const centerY = Math.floor(fontIconSmall.length / 2);
  // Scale the icon around its center
  for (let y = 0; y < fontIconSmall.length; y++) {
    for (let x = 0; x < fontIconSmall[0].length; x++) {
      // Skip if the original pixel is empty
      if (fontIconSmall[y][x] === 0) continue;
      // Calculate the position relative to center
      const relX = x - centerX;
      const relY = y - centerY;
      // Scale the position
      const scaledX = Math.round(relX * scaleFactor) + centerX;
      const scaledY = Math.round(relY * scaleFactor) + centerY;
      // Check if the scaled position is within bounds
      if (scaledX >= 0 && scaledX < 15 && scaledY >= 0 && scaledY < 15) {
        scaledFontIcon[scaledY][scaledX] = 1;
      }
    }
  }
  // Convert to 21x21 by centering
  const fontIcon = Array(21)
    .fill()
    .map(() => Array(21).fill(0));
  const offsetX = Math.floor((21 - 15) / 2);
  const offsetY = Math.floor((21 - 15) / 2);
  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < 15; x++) {
      fontIcon[y + offsetY][x + offsetX] = scaledFontIcon[y][x];
    }
  }
  // Draw a control
  function drawControl(ctx, value, maxValue, icon) {
    const width = ctx.canvas.width / window.devicePixelRatio;
    const height = ctx.canvas.height / window.devicePixelRatio;
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    // Calculate cell dimensions
    const cellWidth = width / COLS;
    const cellHeight = height / ROWS;
    // Calculate dot radius - smaller for more detail
    const dotRadius = Math.min(cellWidth, cellHeight) * 0.3;
    // Calculate fill height based on value
    const fillPercentage = value / maxValue;
    const fillHeight = height * fillPercentage;
    // Get theme colors from CSS variables
    const theme = document.documentElement.getAttribute("data-theme");
    const bgColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--dot-bg-color")
      .trim();
    const fgColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--dot-fg-color")
      .trim();
    // Draw dots
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const x = col * cellWidth + cellWidth / 2;
        const y = row * cellHeight + cellHeight / 2;
        // Check if this position is part of the icon
        let isIcon = false;
        if (icon) {
          // Position icon at the same vertical position for all controls
          const iconRows = icon.length;
          const iconCols = icon[0].length;
          // Use a fixed position for all icons to ensure alignment
          const iconStartRow =
            Math.floor(ROWS * 0.6) - Math.floor(iconRows / 2);
          const iconStartCol = Math.floor((COLS - iconCols) / 2); // Center horizontally
          if (
            row >= iconStartRow &&
            row < iconStartRow + iconRows &&
            col >= iconStartCol &&
            col < iconStartCol + iconCols
          ) {
            const iconRow = row - iconStartRow;
            const iconCol = col - iconStartCol;
            if (
              iconRow < iconRows &&
              iconCol < iconCols &&
              icon[iconRow][iconCol] === 1
            ) {
              isIcon = true;
            }
          }
        }
        // Determine if dot should be filled
        const dotBottom = height - y;
        const isFilled = dotBottom <= fillHeight;
        // Draw dot
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        if (isIcon) {
          // Icon dots use mix-blend-mode effect by using inverted colors
          ctx.fillStyle = isFilled ? bgColor : fgColor;
          // Make icon dots slightly larger for emphasis
          ctx.arc(x, y, dotRadius * 1.1, 0, Math.PI * 2);
        } else {
          // Regular dots change based on fill level
          ctx.fillStyle = isFilled ? fgColor : bgColor;
        }
        ctx.fill();
      }
    }
  }
  // Update all controls
  function updateControls() {
    drawControl(brightnessCtx, brightnessValue, 100, sunIcon);
    drawControl(volumeCtx, volumeValue, 100, volumeIcon);
    drawControl(fontSizeCtx, fontSizeIndex, FONT_SIZES.length - 1, fontIcon);
    // Update display values
    brightnessDisplay.textContent = `${Math.round(brightnessValue)}%`;
    volumeDisplay.textContent = `${Math.round(volumeValue)}%`;
    fontSizeDisplay.textContent = `${FONT_SIZES[Math.round(fontSizeIndex)]}px`;
    // Update theme based on brightness
    updateTheme();
    // Update volume
    if (audio) {
      audio.volume = volumeValue / 100;
    }
    // Update font size
    updateFontSize();
  }
  // Update theme based on brightness
  function updateTheme() {
    const html = document.documentElement;
    const p = brightnessValue / 100;
    if (p > 0.5) {
      html.setAttribute("data-theme", "light");
      document.getElementById("mode-text").textContent = "LIGHT MODE";
      html.style.setProperty(
        "--bg",
        `hsl(var(--hue),var(--sat),${95 - (1 - p) * 20}%)`
      );
    } else {
      html.setAttribute("data-theme", "dark");
      document.getElementById("mode-text").textContent = "DARK MODE";
      // Pure black background for dark mode
      html.style.setProperty("--bg", "#000000");
    }
  }
  // Update font size - ONLY affects text, not layout
  function updateFontSize() {
    const root = document.getElementById("root");
    const currentIndex = Math.round(fontSizeIndex);
    // Remove all font size classes
    for (let size of FONT_SIZES) {
      root.classList.remove(`font-size-${size}`);
    }
    // Add the current font size class
    root.classList.add(`font-size-${FONT_SIZES[currentIndex]}`);
  }
  // Handle drag interaction
  function setupDragHandling(controlElement, updateFunction) {
    let isDragging = false;
    controlElement.addEventListener("mousedown", startDrag);
    controlElement.addEventListener("touchstart", startDrag, {
      passive: false
    });

    function startDrag(e) {
      e.preventDefault();
      isDragging = true;
      // Add event listeners for drag and end events
      document.addEventListener("mousemove", drag);
      document.addEventListener("touchmove", drag, {
        passive: false
      });
      document.addEventListener("mouseup", endDrag);
      document.addEventListener("touchend", endDrag);
      // Initial update based on click/touch position
      updateFromPosition(e);
    }

    function drag(e) {
      if (!isDragging) return;
      e.preventDefault();
      updateFromPosition(e);
    }

    function endDrag() {
      isDragging = false;
      document.removeEventListener("mousemove", drag);
      document.removeEventListener("touchmove", drag);
      document.removeEventListener("mouseup", endDrag);
      document.removeEventListener("touchend", endDrag);
    }

    function updateFromPosition(e) {
      const rect = controlElement.getBoundingClientRect();
      // Get Y position
      let clientY;
      if (e.type.includes("touch")) {
        clientY = e.touches[0].clientY;
      } else {
        clientY = e.clientY;
      }
      // Calculate percentage from bottom (0%) to top (100%)
      const posY = rect.bottom - clientY;
      const percentage = Math.max(0, Math.min(1, posY / rect.height));
      // Update value through callback
      updateFunction(percentage);
      // Update all controls
      updateControls();
    }
  }
  // Set up drag handling for each control
  setupDragHandling(brightnessControl, (percentage) => {
    brightnessValue = Math.round(percentage * 100);
  });
  setupDragHandling(volumeControl, (percentage) => {
    volumeValue = Math.round(percentage * 100);
  });
  setupDragHandling(fontSizeControl, (percentage) => {
    fontSizeIndex = Math.min(
      FONT_SIZES.length - 1,
      Math.round(percentage * (FONT_SIZES.length - 1))
    );
  });
  // Handle window resize
  window.addEventListener("resize", () => {
    brightnessCtx = setupCanvas(brightnessCanvas);
    volumeCtx = setupCanvas(volumeCanvas);
    fontSizeCtx = setupCanvas(fontSizeCanvas);
    updateControls();
  });
  // Play audio on first interaction
  document.addEventListener(
    "click",
    () => {
      audio.play().catch(() => {});
    },
    {
      once: true
    }
  );
  // Initial update with zero values
  updateControls();
  // Easing function for smoother animations
  function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }
  // Staggered animation function with faster timing and easing
  function animateControls() {
    const duration = 800; // Faster animation (was 2000ms)
    const staggerDelay = 150; // Shorter delay between controls (was 400ms)
    const startTime = performance.now();

    function animate(currentTime) {
      const elapsedTime = currentTime - startTime;
      // Animate brightness (starts immediately)
      if (elapsedTime <= duration) {
        const progress = Math.min(1, elapsedTime / duration);
        const easedProgress = easeOutCubic(progress);
        brightnessValue = easedProgress * targetBrightnessValue;
      } else {
        brightnessValue = targetBrightnessValue;
      }
      // Animate volume (starts after staggerDelay)
      if (
        elapsedTime >= staggerDelay &&
        elapsedTime <= duration + staggerDelay
      ) {
        const progress = Math.min(1, (elapsedTime - staggerDelay) / duration);
        const easedProgress = easeOutCubic(progress);
        volumeValue = easedProgress * targetVolumeValue;
      } else if (elapsedTime > duration + staggerDelay) {
        volumeValue = targetVolumeValue;
      }
      // Animate font size (starts after 2*staggerDelay)
      if (
        elapsedTime >= 2 * staggerDelay &&
        elapsedTime <= duration + 2 * staggerDelay
      ) {
        const progress = Math.min(
          1,
          (elapsedTime - 2 * staggerDelay) / duration
        );
        const easedProgress = easeOutCubic(progress);
        fontSizeIndex = easedProgress * targetFontSizeIndex;
      } else if (elapsedTime > duration + 2 * staggerDelay) {
        fontSizeIndex = targetFontSizeIndex;
      }
      // Update controls
      updateControls();
      // Continue animation if not complete
      if (elapsedTime < duration + 2 * staggerDelay) {
        requestAnimationFrame(animate);
      }
    }
    // Start animation
    requestAnimationFrame(animate);
  }
  // Start the staggered animation after a short delay
  setTimeout(animateControls, 300);
});