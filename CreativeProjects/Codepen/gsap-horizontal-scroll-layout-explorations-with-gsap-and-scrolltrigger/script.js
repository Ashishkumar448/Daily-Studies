document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const pageContainer = document.querySelector(".page-container");
  const horizontalContainer = document.querySelector(".horizontal-container");
  const panelsContainer = document.querySelector(".panels-container");
  const panels = document.querySelectorAll(".panel");
  const progressFill = document.querySelector(".nav-progress-fill");
  const navText = document.querySelectorAll(".nav-text")[1];
  const parallaxElements = document.querySelectorAll(".parallax");
  const leftMenu = document.querySelector(".left-menu");
  const menuBtn = document.querySelector(".menu-btn");
  const sectionNavItems = document.querySelectorAll(".section-nav-item");
  const videoBackground = document.querySelector(".video-background");
  const copyEmailBtn = document.querySelector(".copy-email");
  const copyTooltip = document.querySelector(".copy-tooltip");

  // Constants
  const SMOOTH_FACTOR = 0.065;
  const WHEEL_SENSITIVITY = 1.0;
  const PANEL_COUNT = panels.length;
  const MENU_WIDTH = 250;
  const MENU_COLLAPSED_WIDTH = 60;
  const PARALLAX_INTENSITY = 0.5; // Controls strength of parallax effect

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
  let menuExpanded = false;

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

  // Copy email functionality
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener("click", () => {
      const email = document.querySelector(".email").textContent;
      navigator.clipboard.writeText(email).then(() => {
        copyTooltip.classList.add("active");
        setTimeout(() => {
          copyTooltip.classList.remove("active");
        }, 2000);
      });
    });
  }

  // Menu animation - add entrance animation for menu items
  const animateMenuItems = (show) => {
    sectionNavItems.forEach((item, index) => {
      if (show) {
        setTimeout(() => {
          item.classList.add("animate-in");
        }, 50 + index * 30);
      } else {
        item.classList.remove("animate-in");
      }
    });
  };

  // Toggle menu expansion with animation
  menuBtn.addEventListener("click", () => {
    menuExpanded = !menuExpanded;

    leftMenu.classList.toggle("expanded");
    document.body.classList.toggle("menu-expanded");

    if (menuExpanded) {
      setTimeout(() => {
        animateMenuItems(true);
      }, 150);
    } else {
      animateMenuItems(false);
    }

    // Update dimensions after menu animation
    setTimeout(() => {
      updateDimensions(false);
    }, 400);
  });

  // Improved parallax effect with more subtle movement
  const updateParallax = () => {
    parallaxElements.forEach((element) => {
      if (!element) return;

      const speed = Number.parseFloat(element.dataset.speed) || 0.2;

      // Make parallax much more subtle (reduced from 0.5 to 0.2)
      const PARALLAX_INTENSITY = 0.2;

      // Calculate the horizontal movement based on scroll position
      // Use negative values for the parallax effect
      const moveX = -currentX * speed * PARALLAX_INTENSITY;

      // Apply translation to create parallax effect
      element.style.transform = `translateX(${moveX}px)`;
    });
  };

  // Update dimensions on resize
  const updateDimensions = (animate = true) => {
    // Calculate panel width based on current window width
    panelWidth = window.innerWidth;
    maxScroll = (PANEL_COUNT - 1) * panelWidth;

    // Keep the current panel centered
    targetX = currentPanel * panelWidth;
    currentX = targetX;

    // Update panel widths
    panels.forEach((panel) => {
      panel.style.width = `${panelWidth}px`;
    });

    // Apply transform with or without transition
    if (animate) {
      panelsContainer.classList.add("transitioning");
      setTimeout(() => {
        panelsContainer.classList.remove("transitioning");
      }, 400);
    }

    panelsContainer.style.transform = `translateX(-${currentX}px)`;

    // Force parallax update
    updateParallax();
  };

  // Navigate to section when clicking nav item
  sectionNavItems.forEach((item) => {
    item.addEventListener("click", () => {
      const index = Number.parseInt(item.getAttribute("data-index"));

      // Set target position to that panel
      targetX = index * panelWidth;

      // Update active class
      sectionNavItems.forEach((navItem) => {
        navItem.classList.remove("active");
      });
      item.classList.add("active");

      // Start animation
      startAnimation();

      // Close menu on mobile or after navigation
      if (window.innerWidth < 768 && menuExpanded) {
        menuExpanded = false;
        leftMenu.classList.remove("expanded");
        document.body.classList.remove("menu-expanded");
        animateMenuItems(false);

        // Update dimensions after menu closes
        setTimeout(() => {
          updateDimensions(false);
        }, 400);
      }
    });
  });

  // Split text elements with staggered animation
  const splitTexts = document.querySelectorAll(".split-text");
  splitTexts.forEach((text) => {
    const words = text.textContent.split(" ");
    text.innerHTML = words
      .map((word) => `<span class="word">${word}</span>`)
      .join(" ");

    // Add delay to each word
    const wordElements = text.querySelectorAll(".word");
    wordElements.forEach((word, index) => {
      word.style.transitionDelay = `${index * 0.02}s`;
    });
  });

  // Update page counter
  const updatePageCount = () => {
    const currentPanelIndex = Math.round(currentX / panelWidth) + 1;
    const formattedIndex = currentPanelIndex.toString().padStart(2, "0");
    const totalPanels = PANEL_COUNT.toString().padStart(2, "0");
    navText.textContent = `${formattedIndex} / ${totalPanels}`;

    // Update active section in navigation
    sectionNavItems.forEach((item, index) => {
      if (index === currentPanelIndex - 1) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  };

  // Update progress bar
  const updateProgress = () => {
    targetProgress = currentX / maxScroll;
    currentProgress = lerp(
      currentProgress,
      targetProgress,
      SMOOTH_FACTOR * 1.5
    );
    progressFill.style.transform = `scaleX(${currentProgress})`;
  };

  // Update active panel with fixed visibility for backwards navigation
  const updateActivePanel = () => {
    currentPanel = Math.round(currentX / panelWidth);
    if (currentPanel !== lastPanel) {
      // First remove was-active class from all panels
      panels.forEach((panel) => {
        panel.classList.remove("was-active");
      });

      // Mark previously active panel
      if (lastPanel >= 0 && panels[lastPanel]) {
        panels[lastPanel].classList.remove("active");
      }

      // Set new active panel
      if (panels[currentPanel]) {
        panels[currentPanel].classList.add("active");
      }

      // Ensure all previous panels remain visible when scrolling back
      for (let i = 0; i < panels.length; i++) {
        if (i < currentPanel) {
          panels[i].classList.add("visited");
        } else {
          panels[i].classList.remove("visited");
        }
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
    if (e.target.closest(".left-menu") || e.target.closest(".copy-email"))
      return; // Don't drag when clicking menu or copy button

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
      velocityX = (touchDelta / timeDelta) * 15;
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
      targetX = clamp(targetX + velocityX * 8, 0, maxScroll);
    }

    const nearestPanel = Math.round(targetX / panelWidth);
    targetX = nearestPanel * panelWidth;
    startAnimation();
  };

  const handleTouchStart = (e) => {
    if (e.target.closest(".left-menu") || e.target.closest(".copy-email"))
      return; // Don't drag when touching menu

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
      velocityX = (touchDelta / timeDelta) * 12;
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
      targetX = clamp(targetX + velocityX * 6, 0, maxScroll);
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
  });

  // Make sure parallax elements are loaded
  parallaxElements.forEach((img) => {
    if (img.tagName === "IMG") {
      if (img.complete) {
        // Image already loaded
        img.classList.add("loaded");
      } else {
        // Wait for image to load
        img.addEventListener("load", () => {
          img.classList.add("loaded");
        });
      }
    }
  });

  // Video background
  if (videoBackground) {
    videoBackground.playbackRate = 0.6;
  }

  // Initialize
  updateDimensions();
  updateActivePanel();
  updatePageCount();
  startAnimation();

  // Initial animation for first panel
  setTimeout(() => {
    panels[0].classList.add("active");
    sectionNavItems[0].classList.add("active");
  }, 100);

  // Force parallax update on load
  setTimeout(() => {
    updateParallax();
  }, 200);
});