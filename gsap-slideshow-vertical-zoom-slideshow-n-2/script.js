document.addEventListener("DOMContentLoaded", function () {
  // Basic variables
  const slides = document.querySelectorAll(".slide");
  const slideImages = document.querySelectorAll(".slide__img");
  const counterStrip = document.querySelector(".counter-strip");
  const cursor = document.querySelector(".cursor");
  let currentIndex = 0;
  let isAnimating = false;
  let mouseX = 0;

  // Constants
  const NEXT = 1;
  const PREV = -1;
  const SLIDE_DURATION = 1.5; // Duration of slide transition

  // Custom eases for more refined animations
  gsap.registerPlugin(CustomEase);

  // Create custom eases for different animation components
  CustomEase.create("textReveal", "0.77, 0, 0.175, 1");
  CustomEase.create("counterSlide", "0.25, 1, 0.5, 1");
  CustomEase.create("zoomIn", "0.16, 1, 0.3, 1");
  CustomEase.create("zoomOut", "0.7, 0, 0.3, 1");
  CustomEase.create("bounceOut", "0.22, 1.2, 0.36, 1");

  // Format number with leading zero
  function formatNumber(num) {
    return num < 10 ? `0${num}` : `${num}`;
  }

  // Initialize counter strip with all numbers
  function initCounterStrip() {
    // Clear existing content
    counterStrip.innerHTML = "";

    // Add all slide numbers to the strip
    for (let i = 0; i < slides.length; i++) {
      const numberDiv = document.createElement("div");
      numberDiv.className = "counter-number";
      numberDiv.textContent = formatNumber(i + 1);
      counterStrip.appendChild(numberDiv);
    }

    // Position the strip to show the first number
    gsap.set(counterStrip, { y: 0 });
  }

  // Call initialization functions
  initCounterStrip();

  // Animate in the text for the first slide
  const firstSlideTextLines = slides[0].querySelectorAll(".slide__text-line");
  gsap.to(firstSlideTextLines, {
    y: 0,
    opacity: 1,
    duration: 1.2,
    stagger: 0.1,
    delay: 0.5,
    ease: "textReveal"
  });

  // Animate counter to show the target index
  function animateCounter(targetIndex, direction, timeline) {
    // Calculate the target position
    const targetY = -targetIndex * 1.2; // 1.2rem is the height of each number

    // Add to the timeline instead of creating a separate animation
    timeline.to(
      counterStrip,
      {
        y: `${targetY}rem`,
        duration: SLIDE_DURATION,
        ease: "counterSlide"
      },
      0.2
    ); // Start at the same time as slide transition
  }

  // Navigation function
  function navigate(direction) {
    if (isAnimating) return;

    // Calculate previous and next indices
    const prevIndex = currentIndex;
    currentIndex =
      direction === NEXT
        ? currentIndex < slides.length - 1
          ? currentIndex + 1
          : 0
        : currentIndex > 0
        ? currentIndex - 1
        : slides.length - 1;

    // Perform the navigation
    performNavigation(prevIndex, currentIndex, direction);
  }

  // Perform the navigation animation with enhanced zoom transition
  function performNavigation(prevIndex, nextIndex, direction) {
    isAnimating = true;

    // Get current and next elements
    const currentSlide = slides[prevIndex];
    const currentImage = slideImages[prevIndex];
    const currentTextLines = currentSlide.querySelectorAll(".slide__text-line");

    const nextSlide = slides[nextIndex];
    const nextImage = slideImages[nextIndex];
    const nextTextLines = nextSlide.querySelectorAll(".slide__text-line");

    // Create animation timeline
    const tl = gsap.timeline({
      defaults: { duration: SLIDE_DURATION, ease: "power2.inOut" },
      onComplete: () => {
        // Reset current slide
        gsap.set(currentSlide, { visibility: "hidden" });
        currentSlide.classList.remove("active");
        nextSlide.classList.add("active");
        isAnimating = false;
      }
    });

    // Add counter animation to the timeline
    animateCounter(nextIndex, direction, tl);

    // Animate out current text
    tl.to(
      currentTextLines,
      {
        y: -80 + "%",
        opacity: 0,
        duration: 0.7,
        stagger: 0.05,
        ease: "power2.in"
      },
      0
    );

    // Determine zoom direction based on navigation direction
    const zoomDirection = direction === NEXT ? 1 : -1;

    // Make sure next slide is ready with enhanced zoom setup
    gsap.set(nextSlide, {
      visibility: "visible",
      scale: zoomDirection === 1 ? 0.7 : 1.3,
      opacity: 0,
      y: "0%",
      x: "0%",
      transformOrigin: "center center"
    });

    // Image setup for zoom effect
    gsap.set(nextImage, {
      scale: zoomDirection === 1 ? 1.3 : 0.8,
      opacity: 0.5,
      transformOrigin: "center center"
    });

    // Animate current slide out with zoom
    tl.to(
      currentSlide,
      {
        scale: zoomDirection === 1 ? 1.3 : 0.7,
        opacity: 0,
        ease: "zoomOut"
      },
      0.2
    );

    // Animate current image for enhanced effect
    tl.to(
      currentImage,
      {
        scale: zoomDirection === 1 ? 0.8 : 1.3,
        ease: "zoomOut"
      },
      0.2
    );

    // Animate in next slide with zoom
    tl.to(
      nextSlide,
      {
        scale: 1,
        opacity: 1,
        ease: "bounceOut"
      },
      0.4
    );

    // Image animation for next slide
    tl.to(
      nextImage,
      {
        scale: 1,
        opacity: 1,
        ease: "zoomIn"
      },
      0.4
    );

    // Reset next text lines
    gsap.set(nextTextLines, {
      y: 100 + "%",
      opacity: 0
    });

    // Animate in next text with delay and custom ease
    tl.to(
      nextTextLines,
      {
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.1,
        ease: "textReveal",
        delay: 0.3
      },
      0.7
    );
  }

  // Custom cursor functionality
  document.addEventListener("mousemove", (e) => {
    // Update cursor position
    gsap.to(cursor, {
      left: e.clientX,
      top: e.clientY,
      duration: 0.1
    });

    // Store mouse X position for direction detection
    mouseX = e.clientX;

    // Show cursor when moving
    cursor.classList.add("active");

    // Determine cursor direction based on position on screen
    const windowWidth = window.innerWidth;
    if (e.clientX < windowWidth / 2) {
      cursor.classList.remove("next");
      cursor.classList.add("prev");
    } else {
      cursor.classList.remove("prev");
      cursor.classList.add("next");
    }

    // Hide cursor after 2 seconds of inactivity
    clearTimeout(window.cursorTimeout);
    window.cursorTimeout = setTimeout(() => {
      cursor.classList.remove("active");
    }, 2000);
  });

  // Hide cursor when leaving window
  document.addEventListener("mouseleave", () => {
    cursor.classList.remove("active");
  });

  // Wheel navigation
  window.addEventListener("wheel", (e) => {
    if (e.deltaY > 0) {
      navigate(NEXT);
    } else {
      navigate(PREV);
    }
  });

  // Touch navigation
  let touchStartY = 0;
  document.addEventListener("touchstart", (e) => {
    touchStartY = e.changedTouches[0].screenY;
  });

  document.addEventListener("touchend", (e) => {
    const touchEndY = e.changedTouches[0].screenY;
    if (touchStartY > touchEndY + 5) {
      navigate(NEXT);
    } else if (touchStartY < touchEndY - 5) {
      navigate(PREV);
    }
  });

  // Click navigation
  document.addEventListener("click", (e) => {
    // Navigate based on click position
    if (mouseX < window.innerWidth / 2) {
      navigate(PREV);
    } else {
      navigate(NEXT);
    }
  });

  // Key navigation
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      navigate(NEXT);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      navigate(PREV);
    }
  });
});