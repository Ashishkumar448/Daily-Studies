document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const horizontalContainer = document.querySelector(".horizontal-container");
  const panelsContainer = document.querySelector(".panels-container");
  const panels = document.querySelectorAll(".panel");
  const progressFill = document.querySelector(".nav-progress-fill");
  const navText = document.querySelectorAll(".nav-text")[1];
  const parallaxElements = document.querySelectorAll(".parallax");
  // Initialize SplitType for text animations
  const splitTexts = document.querySelectorAll(".split-text");
  splitTexts.forEach((text) => {
    // Using only words for subtler effect
    new SplitType(text, {
      types: "words"
    });
    // Add smaller staggered delay
    const words = text.querySelectorAll(".word");
    words.forEach((word, index) => {
      word.style.transitionDelay = `${index * 0.04}s`;
      // Wrap each word's content in a span for parallax effect
      const content = word.innerHTML;
      word.innerHTML = `<span class="word-parallax" data-speed="${
        0.02 + Math.random() * 0.03
      }">${content}</span>`;
    });
  });
  // Constants
  const SMOOTH_FACTOR = 0.075;
  const TOUCH_SENSITIVITY = 1.5;
  const WHEEL_SENSITIVITY = 1.2;
  const PANEL_COUNT = panels.length;
  // State variables
  let targetX = 0;
  let currentX = 0;
  let currentProgress = 0;
  let targetProgress = 0;
  let panelWidth = window.innerWidth;
  let maxScroll = (PANEL_COUNT - 1) * panelWidth;
  let isAnimating = false;
  let currentPanel = 0;
  let lastPanel = -1;
  let scrollPercentage = 0;
  // Touch variables
  let isDragging = false;
  let startX = 0;
  let startScrollX = 0;
  let velocityX = 0;
  let lastTouchX = 0;
  let lastTouchTime = 0;
  // Helper functions
  const lerp = (start, end, factor) => start + (end - start) * factor;
  const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
  // Update parallax elements
  const updateParallax = () => {
    scrollPercentage = currentX / maxScroll;
    // Update image parallax
    parallaxElements.forEach((element) => {
      const speed = parseFloat(element.dataset.speed) || 0.1;
      const xOffset = scrollPercentage * 100 * speed;
      if (element.classList.contains("panel-full-background")) {
        element.style.transform = `translate(${-xOffset * 0.5}px, ${
          -xOffset * 0.2
        }px)`;
      } else if (
        element.tagName === "IMG" &&
        element.parentNode.classList.contains("image-container")
      ) {
        element.style.transform = `translate(${-xOffset}px, ${
          -xOffset * 0.5
        }px)`;
      }
    });
    // Update word parallax
    const wordParallaxElements = document.querySelectorAll(".word-parallax");
    wordParallaxElements.forEach((element) => {
      const speed = parseFloat(element.dataset.speed) || 0.02;
      const yOffset = (scrollPercentage - 0.5) * 30 * speed;
      element.style.transform = `translateY(${yOffset}px)`;
    });
  };
  // Update dimensions on resize
  const updateDimensions = () => {
    panelWidth = window.innerWidth;
    maxScroll = (PANEL_COUNT - 1) * panelWidth;
    targetX = currentPanel * panelWidth;
    currentX = targetX;
    panelsContainer.style.transform = `translateX(-${currentX}px)`;
  };
  // Update page counter
  const updatePageCount = () => {
    const currentPanelIndex = Math.round(currentX / panelWidth) + 1;
    const formattedIndex = currentPanelIndex.toString().padStart(2, "0");
    const totalPanels = PANEL_COUNT.toString().padStart(2, "0");
    navText.textContent = `${formattedIndex} / ${totalPanels}`;
  };
  // Update progress bar
  const updateProgress = () => {
    targetProgress = currentX / maxScroll;
    currentProgress = lerp(currentProgress, targetProgress, SMOOTH_FACTOR * 2);
    progressFill.style.transform = `scaleX(${currentProgress})`;
  };
  // Update active panel
  const updateActivePanel = () => {
    currentPanel = Math.round(currentX / panelWidth);
    if (currentPanel !== lastPanel) {
      // Mark previously active panel
      if (lastPanel >= 0 && panels[lastPanel]) {
        panels[lastPanel].classList.remove("active");
        panels[lastPanel].classList.add("was-active");
      }
      if (panels[currentPanel]) {
        panels[currentPanel].classList.add("active");
      }
      lastPanel = currentPanel;
    }
  };
  // Animation loop
  const animate = () => {
    // Smooth scrolling with lerp
    currentX = lerp(currentX, targetX, SMOOTH_FACTOR);
    panelsContainer.style.transform = `translateX(-${currentX}px)`;
    // Update progress and navigation
    updateProgress();
    updatePageCount();
    updateActivePanel();
    updateParallax();
    if (Math.abs(targetX - currentX) > 0.1 || isAnimating) {
      requestAnimationFrame(animate);
    } else {
      isAnimating = false;
    }
  };
  // Start animation
  const startAnimation = () => {
    if (!isAnimating) {
      isAnimating = true;
      requestAnimationFrame(animate);
    }
  };
  // Event handlers
  const handleWheel = (e) => {
    e.preventDefault();
    targetX = clamp(targetX + e.deltaY * WHEEL_SENSITIVITY, 0, maxScroll);
    startAnimation();
  };
  const handleMouseDown = (e) => {
    isDragging = true;
    startX = e.clientX;
    startScrollX = currentX;
    lastTouchX = e.clientX;
    lastTouchTime = Date.now();
    document.body.style.cursor = "grabbing";
    e.preventDefault();
  };
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    targetX = clamp(startScrollX - dx, 0, maxScroll);
    const currentTime = Date.now();
    const timeDelta = currentTime - lastTouchTime;
    if (timeDelta > 0) {
      const touchDelta = lastTouchX - e.clientX;
      velocityX = (touchDelta / timeDelta) * 20;
    }
    lastTouchX = e.clientX;
    lastTouchTime = currentTime;
    startAnimation();
  };
  const handleMouseUp = () => {
    if (!isDragging) return;
    isDragging = false;
    document.body.style.cursor = "grab";
    if (Math.abs(velocityX) > 0.5) {
      targetX = clamp(targetX + velocityX * 10, 0, maxScroll);
    }
    const nearestPanel = Math.round(targetX / panelWidth);
    targetX = nearestPanel * panelWidth;
    startAnimation();
  };
  const handleTouchStart = (e) => {
    isDragging = true;
    startX = e.touches[0].clientX;
    startScrollX = currentX;
    lastTouchX = e.touches[0].clientX;
    lastTouchTime = Date.now();
  };
  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - startX;
    targetX = clamp(startScrollX - dx, 0, maxScroll);
    const currentTime = Date.now();
    const timeDelta = currentTime - lastTouchTime;
    if (timeDelta > 0) {
      const touchDelta = lastTouchX - e.touches[0].clientX;
      velocityX = (touchDelta / timeDelta) * 15;
    }
    lastTouchX = e.touches[0].clientX;
    lastTouchTime = currentTime;
    e.preventDefault();
    startAnimation();
  };
  const handleTouchEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    if (Math.abs(velocityX) > 0.5) {
      targetX = clamp(targetX + velocityX * 8, 0, maxScroll);
    }
    const nearestPanel = Math.round(targetX / panelWidth);
    targetX = nearestPanel * panelWidth;
    startAnimation();
  };
  // Event listeners
  horizontalContainer.addEventListener("wheel", handleWheel, {
    passive: false
  });
  horizontalContainer.addEventListener("mousedown", handleMouseDown);
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);
  horizontalContainer.addEventListener("touchstart", handleTouchStart, {
    passive: true
  });
  horizontalContainer.addEventListener("touchmove", handleTouchMove, {
    passive: false
  });
  horizontalContainer.addEventListener("touchend", handleTouchEnd, {
    passive: true
  });
  window.addEventListener("resize", () => {
    updateDimensions();
    startAnimation();
  });
  // Initialize
  updateDimensions();
  updateActivePanel();
  updatePageCount();
  startAnimation();
  // Initial animation for first panel
  setTimeout(() => {
    panels[0].classList.add("active");
  }, 100);
});