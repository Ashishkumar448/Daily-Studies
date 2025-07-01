// Direction constants
const NEXT = 1;
const PREV = -1;

// Slide titles array (global)
const slideTitles = [
  "Cosmic Harmony",
  "Astral Journey",
  "Ethereal Vision",
  "Quantum Field",
  "Celestial Path",
  "Cosmic Whisper"
];

// Global variable to track currently hovered thumbnail
let currentHoveredThumb = null;

// Global variable to track mouse position over thumbnails
let mouseOverThumbnails = false;
let lastHoveredThumbIndex = null;

// Global animation state management
let isAnimating = false;
let pendingNavigation = null;

// Function to visually update navigation elements based on animation state
function updateNavigationUI(disabled) {
  // Update navigation arrows
  const navButtons = document.querySelectorAll(".counter-nav");
  navButtons.forEach((btn) => {
    btn.style.opacity = disabled ? "0.3" : "";
    btn.style.pointerEvents = disabled ? "none" : "";
  });

  // Update thumbnails
  const thumbs = document.querySelectorAll(".slide-thumb");
  thumbs.forEach((thumb) => {
    thumb.style.pointerEvents = disabled ? "none" : "";
  });
}

// Global functions for slide management
function updateSlideCounter(index) {
  const currentSlideEl = document.querySelector(".current-slide");
  if (currentSlideEl) {
    currentSlideEl.textContent = String(index + 1).padStart(2, "0");
  }
}

function updateSlideTitle(index) {
  const titleContainer = document.querySelector(".slide-title-container");
  const currentTitle = document.querySelector(".slide-title");
  if (!titleContainer || !currentTitle) return;

  // Create a new title element
  const newTitle = document.createElement("div");
  newTitle.className = "slide-title enter-up";
  newTitle.textContent = slideTitles[index];

  // Add it to the container
  titleContainer.appendChild(newTitle);

  // Add exit animation class to old title
  currentTitle.classList.add("exit-up");

  // Force reflow
  void newTitle.offsetWidth;

  // Start entrance animation
  setTimeout(() => {
    newTitle.classList.remove("enter-up");
  }, 10);

  // Remove old title after animation completes
  setTimeout(() => {
    currentTitle.remove();
  }, 500);
}

// Updated updateDragLines function for continuous lines
function updateDragLines(activeIndex, forceUpdate = false) {
  const lines = document.querySelectorAll(".drag-line");
  if (!lines.length) return;

  // Reset all lines immediately
  lines.forEach((line) => {
    line.style.height = "var(--line-base-height)";
    line.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
  });

  // If no active index is provided, return
  if (activeIndex === null) {
    return;
  }

  const slideCount = document.querySelectorAll(".slide").length;
  const lineCount = lines.length;

  // Calculate the center position of the active thumbnail
  const thumbWidth = 720 / slideCount; // Total width divided by number of slides
  const centerPosition = (activeIndex + 0.5) * thumbWidth;

  // Calculate the width of one line section
  const lineWidth = 720 / lineCount;

  // Apply the wave pattern to all lines based on distance from center
  for (let i = 0; i < lineCount; i++) {
    // Calculate the center position of this line
    const linePosition = (i + 0.5) * lineWidth;

    // Calculate distance from the center of the active thumbnail
    const distFromCenter = Math.abs(linePosition - centerPosition);

    // Calculate the maximum distance for influence (half a thumbnail width plus a bit)
    const maxDistance = thumbWidth * 0.7;

    // Only affect lines within the influence range
    if (distFromCenter <= maxDistance) {
      // Calculate normalized distance (0 at center, 1 at edge of influence)
      const normalizedDist = distFromCenter / maxDistance;

      // Create a cosine wave pattern (1 at center, 0 at edge)
      const waveHeight = Math.cos((normalizedDist * Math.PI) / 2);

      // Scale the height based on the wave pattern (taller in center)
      const height =
        parseInt(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--line-base-height"
          )
        ) +
        waveHeight * 35;

      // Calculate opacity based on distance (more opaque at center)
      const opacity = 0.3 + waveHeight * 0.4;

      // Stagger the animations slightly based on distance from center
      const delay = normalizedDist * 100;

      // If forceUpdate is true, apply immediately without checking hover state
      if (forceUpdate) {
        lines[i].style.height = `${height}px`;
        lines[i].style.backgroundColor = `rgba(255, 255, 255, ${opacity})`;
      } else {
        setTimeout(() => {
          // Only apply if this is still the current hovered thumbnail
          // or if we're forcing an update
          if (
            currentHoveredThumb === activeIndex ||
            (mouseOverThumbnails && lastHoveredThumbIndex === activeIndex)
          ) {
            lines[i].style.height = `${height}px`;
            lines[i].style.backgroundColor = `rgba(255, 255, 255, ${opacity})`;
          }
        }, delay);
      }
    }
  }
}

class Slideshow {
  DOM = {
    el: null,
    slides: null,
    slidesInner: null
  };
  current = 0;
  slidesTotal = 0;

  constructor(DOM_el) {
    this.DOM.el = DOM_el;
    this.DOM.slides = [...this.DOM.el.querySelectorAll(".slide")];
    this.DOM.slidesInner = this.DOM.slides.map((item) =>
      item.querySelector(".slide__img")
    );
    this.DOM.slides[this.current].classList.add("slide--current");
    this.slidesTotal = this.DOM.slides.length;
  }

  next() {
    this.navigate(NEXT);
  }

  prev() {
    this.navigate(PREV);
  }

  // Method to navigate to a specific slide index
  goTo(index) {
    // If already animating, store this as pending navigation
    if (isAnimating) {
      pendingNavigation = { type: "goto", index };
      return false;
    }

    // Don't navigate if it's the current slide
    if (index === this.current) return false;

    // Set animation state
    isAnimating = true;
    updateNavigationUI(true);

    const previous = this.current;
    this.current = index;

    // Update active thumbnail
    const thumbs = document.querySelectorAll(".slide-thumb");
    thumbs.forEach((thumb, i) => {
      thumb.classList.toggle("active", i === index);
    });

    // Update counter and title
    updateSlideCounter(index);
    updateSlideTitle(index);

    // Show drag lines for active thumbnail
    updateDragLines(index, true);

    // Determine direction for the animation
    const direction = index > previous ? 1 : -1;

    // Get slides and perform animation
    const currentSlide = this.DOM.slides[previous];
    const currentInner = this.DOM.slidesInner[previous];
    const upcomingSlide = this.DOM.slides[index];
    const upcomingInner = this.DOM.slidesInner[index];

    gsap
      .timeline({
        onStart: () => {
          this.DOM.slides[index].classList.add("slide--current");
          gsap.set(upcomingSlide, { zIndex: 99 });
        },
        onComplete: () => {
          this.DOM.slides[previous].classList.remove("slide--current");
          gsap.set(upcomingSlide, { zIndex: 1 });

          // Reset animation state
          isAnimating = false;
          updateNavigationUI(false);

          // Check if there's a pending navigation
          if (pendingNavigation) {
            const { type, index, direction } = pendingNavigation;
            pendingNavigation = null;

            // Execute the pending navigation after a small delay
            setTimeout(() => {
              if (type === "goto") {
                this.goTo(index);
              } else if (type === "navigate") {
                this.navigate(direction);
              }
            }, 50);
          }

          // Re-apply hover effect if mouse is still over thumbnails
          if (mouseOverThumbnails && lastHoveredThumbIndex !== null) {
            currentHoveredThumb = lastHoveredThumbIndex;
            updateDragLines(lastHoveredThumbIndex, true);
          }
        }
      })
      .addLabel("start", 0)
      .fromTo(
        upcomingSlide,
        {
          autoAlpha: 1,
          scale: 0.1,
          yPercent: direction === 1 ? 100 : -100 // Bottom for next, top for prev
        },
        {
          duration: 0.7,
          ease: "expo",
          scale: 0.4,
          yPercent: 0
        },
        "start"
      )
      .fromTo(
        upcomingInner,
        {
          filter: "contrast(100%) saturate(100%)",
          transformOrigin: "100% 50%",
          scaleY: 4
        },
        {
          duration: 0.7,
          ease: "expo",
          scaleY: 1
        },
        "start"
      )
      .fromTo(
        currentInner,
        {
          filter: "contrast(100%) saturate(100%)"
        },
        {
          duration: 0.7,
          ease: "expo",
          filter: "contrast(120%) saturate(140%)"
        },
        "start"
      )
      .addLabel("middle", "start+=0.6")
      .to(
        upcomingSlide,
        {
          duration: 1,
          ease: "power4.inOut",
          scale: 1
        },
        "middle"
      )
      .to(
        currentSlide,
        {
          duration: 1,
          ease: "power4.inOut",
          scale: 0.98,
          autoAlpha: 0
        },
        "middle"
      );
  }

  navigate(direction) {
    // If already animating, store this as pending navigation
    if (isAnimating) {
      pendingNavigation = { type: "navigate", direction };
      return false;
    }

    // Set animation state
    isAnimating = true;
    updateNavigationUI(true);

    const previous = this.current;
    this.current =
      direction === 1
        ? this.current < this.slidesTotal - 1
          ? ++this.current
          : 0
        : this.current > 0
        ? --this.current
        : this.slidesTotal - 1;

    // Update active thumbnail
    const thumbs = document.querySelectorAll(".slide-thumb");
    thumbs.forEach((thumb, index) => {
      if (index === this.current) {
        thumb.classList.add("active");
      } else {
        thumb.classList.remove("active");
      }
    });

    // Update counter and title
    updateSlideCounter(this.current);
    updateSlideTitle(this.current);

    // Highlight active thumbnail in drag line indicator
    updateDragLines(this.current, true);

    // Get slides and perform animation
    const currentSlide = this.DOM.slides[previous];
    const currentInner = this.DOM.slidesInner[previous];
    const upcomingSlide = this.DOM.slides[this.current];
    const upcomingInner = this.DOM.slidesInner[this.current];

    gsap
      .timeline({
        onStart: () => {
          this.DOM.slides[this.current].classList.add("slide--current");
          gsap.set(upcomingSlide, { zIndex: 99 });
        },
        onComplete: () => {
          this.DOM.slides[previous].classList.remove("slide--current");
          gsap.set(upcomingSlide, { zIndex: 1 });

          // Reset animation state
          isAnimating = false;
          updateNavigationUI(false);

          // Check if there's a pending navigation
          if (pendingNavigation) {
            const { type, index, direction } = pendingNavigation;
            pendingNavigation = null;

            // Execute the pending navigation after a small delay
            setTimeout(() => {
              if (type === "goto") {
                this.goTo(index);
              } else if (type === "navigate") {
                this.navigate(direction);
              }
            }, 50);
          }

          // Re-apply hover effect if mouse is still over thumbnails
          if (mouseOverThumbnails && lastHoveredThumbIndex !== null) {
            currentHoveredThumb = lastHoveredThumbIndex;
            updateDragLines(lastHoveredThumbIndex, true);
          }
        }
      })
      .addLabel("start", 0)
      .fromTo(
        upcomingSlide,
        {
          autoAlpha: 1,
          scale: 0.1,
          yPercent: direction === 1 ? 100 : -100 // Bottom for next, top for prev
        },
        {
          duration: 0.7,
          ease: "expo",
          scale: 0.4,
          yPercent: 0
        },
        "start"
      )
      .fromTo(
        upcomingInner,
        {
          filter: "contrast(100%) saturate(100%)",
          transformOrigin: "100% 50%",
          scaleY: 4
        },
        {
          duration: 0.7,
          ease: "expo",
          scaleY: 1
        },
        "start"
      )
      .fromTo(
        currentInner,
        {
          filter: "contrast(100%) saturate(100%)"
        },
        {
          duration: 0.7,
          ease: "expo",
          filter: "contrast(120%) saturate(140%)"
        },
        "start"
      )
      .addLabel("middle", "start+=0.6")
      .to(
        upcomingSlide,
        {
          duration: 1,
          ease: "power4.inOut",
          scale: 1
        },
        "middle"
      )
      .to(
        currentSlide,
        {
          duration: 1,
          ease: "power4.inOut",
          scale: 0.98,
          autoAlpha: 0
        },
        "middle"
      );
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Create slideshow instance
  const slides = document.querySelector(".slides");
  const slideshow = new Slideshow(slides);

  // Create thumbnails
  const thumbsContainer = document.querySelector(".slide-thumbs");
  const slideImgs = document.querySelectorAll(".slide__img");
  const slideCount = slideImgs.length;

  // Clear thumbs container first (in case it had any previous content)
  if (thumbsContainer) {
    thumbsContainer.innerHTML = "";
    slideImgs.forEach((img, index) => {
      const bgImg = img.style.backgroundImage;
      const thumb = document.createElement("div");
      thumb.className = "slide-thumb";
      thumb.style.backgroundImage = bgImg;
      if (index === 0) {
        thumb.classList.add("active");
      }

      // Animation for clicking on thumbnails - use goTo method
      thumb.addEventListener("click", () => {
        // Store the clicked thumbnail index for later
        lastHoveredThumbIndex = index;

        // Use the new goTo method which handles animation state
        slideshow.goTo(index);
      });

      // Add hover effect to thumbnails with global tracking
      thumb.addEventListener("mouseenter", () => {
        // Update the global variable to track which thumbnail is hovered
        currentHoveredThumb = index;
        lastHoveredThumbIndex = index;
        mouseOverThumbnails = true;

        // Only update lines if not animating
        if (!isAnimating) {
          updateDragLines(index, true);
        }
      });

      thumb.addEventListener("mouseleave", () => {
        // Only reset if we're leaving this specific thumbnail
        // This prevents resetting when moving directly to another thumbnail
        if (currentHoveredThumb === index) {
          currentHoveredThumb = null;
          // Don't reset lastHoveredThumbIndex here
        }
      });

      thumbsContainer.appendChild(thumb);
    });
  }

  // Create continuous drag indicator lines
  const dragIndicator = document.querySelector(".drag-indicator");
  if (dragIndicator) {
    dragIndicator.innerHTML = "";

    // Create a container for the lines to ensure consistent positioning
    const linesContainer = document.createElement("div");
    linesContainer.className = "lines-container";
    dragIndicator.appendChild(linesContainer);

    // Create evenly spaced lines across the entire width
    const totalLines = 60; // Increased number of lines for smoother appearance
    for (let i = 0; i < totalLines; i++) {
      const line = document.createElement("div");
      line.className = "drag-line";
      linesContainer.appendChild(line);
    }
  }

  // Set total slides
  const totalSlidesEl = document.querySelector(".total-slides");
  if (totalSlidesEl) {
    totalSlidesEl.textContent = String(slideCount).padStart(2, "0");
  }

  // Add navigation handlers - use direct methods instead of throttled versions
  const prevButton = document.querySelector(".prev-slide");
  const nextButton = document.querySelector(".next-slide");

  if (prevButton) {
    prevButton.addEventListener("click", () => slideshow.prev());
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => slideshow.next());
  }

  // Initialize counters and lines
  updateSlideCounter(0);
  updateDragLines(0, true); // Initialize the first thumbnail's lines

  // Add global mouse leave handler for the entire thumbnails area
  const thumbsArea = document.querySelector(".thumbs-container");
  if (thumbsArea) {
    thumbsArea.addEventListener("mouseenter", () => {
      mouseOverThumbnails = true;
    });

    thumbsArea.addEventListener("mouseleave", () => {
      // Reset all lines when mouse leaves the entire thumbnails area
      mouseOverThumbnails = false;
      currentHoveredThumb = null;
      updateDragLines(null);
    });
  }

  // Initialize GSAP Observer for scroll/drag with animation state check
  try {
    // First try using it directly
    if (typeof Observer !== "undefined") {
      Observer.create({
        type: "wheel,touch,pointer",
        onDown: () => {
          if (!isAnimating) slideshow.prev();
        },
        onUp: () => {
          if (!isAnimating) slideshow.next();
        },
        wheelSpeed: -1,
        tolerance: 10
      });
    }
    // Then try from GSAP
    else if (typeof gsap.Observer !== "undefined") {
      gsap.Observer.create({
        type: "wheel,touch,pointer",
        onDown: () => {
          if (!isAnimating) slideshow.prev();
        },
        onUp: () => {
          if (!isAnimating) slideshow.next();
        },
        wheelSpeed: -1,
        tolerance: 10
      });
    }
    // Fallback
    else {
      console.warn("GSAP Observer plugin not found, using fallback");

      // Add wheel event listener with animation state check
      document.addEventListener("wheel", (e) => {
        if (isAnimating) return;

        if (e.deltaY > 0) {
          slideshow.next();
        } else {
          slideshow.prev();
        }
      });

      // Add touch events with animation state check
      let touchStartY = 0;

      document.addEventListener("touchstart", (e) => {
        touchStartY = e.touches[0].clientY;
      });

      document.addEventListener("touchend", (e) => {
        if (isAnimating) return;

        const touchEndY = e.changedTouches[0].clientY;
        const diff = touchEndY - touchStartY;

        if (Math.abs(diff) > 50) {
          if (diff > 0) {
            slideshow.prev();
          } else {
            slideshow.next();
          }
        }
      });
    }
  } catch (error) {
    console.error("Error initializing Observer:", error);
  }

  // Keyboard navigation with animation state check
  document.addEventListener("keydown", (e) => {
    if (isAnimating) return;

    if (e.key === "ArrowRight") slideshow.next();
    else if (e.key === "ArrowLeft") slideshow.prev();
  });
});