document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger, CustomEase);

  // Select the SVG path element
  const pathElement = document.querySelector("#treasure-path");

  // Calculate the length of the path
  const pathLength = pathElement.getTotalLength();

  // Set the stroke-dasharray and stroke-dashoffset to match the path length
  pathElement.style.strokeDasharray = pathLength;
  pathElement.style.strokeDashoffset = pathLength;

  // Animate the SVG path drawing with ScrollTrigger
  gsap.to(pathElement, {
    scrollTrigger: {
      trigger: ".page-wrapper", // Main wrapper for triggering scroll events
      start: "top top", // Start drawing the SVG path when the top of the page-wrapper is at the top of the viewport
      end: "bottom bottom", // Finish drawing when the bottom of the page-wrapper reaches the bottom of the viewport
      scrub: true // Synchronizes the animation with the scroll position
    },
    strokeDashoffset: 0, // Animate the dash offset from full path length to 0, revealing the path
    ease: "none" // Keep the drawing speed consistent with scroll speed
  });

  // Create a custom scroll ease function
  CustomEase.create(
    "customScroll",
    "M0,0 C0.126,0.382 0.282,0.674 0.44,0.822 0.632,1.002 0.818,1.001 1,1"
  );

  // Debounce function to prevent excessive recalculations
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Setup dynamic scroll for other content
  function setupDynamicScroll() {
    const descriptionInner = document.querySelector(
      ".container__description-inner"
    );
    const containerSticky = document.querySelector(".container-sticky");
    const descriptionContainer = document.querySelector(
      ".container__description"
    );
    const svgLogo = document.querySelector(".container__svg-icon svg");

    // Kill previous ScrollTrigger instances if they exist
    if (ScrollTrigger.getById("dynamicScroll")) {
      ScrollTrigger.getById("dynamicScroll").kill();
    }
    if (ScrollTrigger.getById("svgWidthScroll")) {
      ScrollTrigger.getById("svgWidthScroll").kill();
    }

    // Calculate the height of the inner content
    const contentHeight = descriptionInner.offsetHeight;
    const visibleHeight = descriptionContainer.offsetHeight;
    const scrollDistance = contentHeight - visibleHeight;

    // Reset the position of the inner content
    gsap.set(descriptionInner, { y: 0 });
    gsap.set(svgLogo, { width: "40%" });

    // Create the scrolling animation for the content description
    ScrollTrigger.create({
      id: "dynamicScroll",
      animation: gsap.to(descriptionInner, {
        y: -scrollDistance,
        ease: "customScroll"
      }),
      trigger: containerSticky,
      start: "top top",
      end: `+=${scrollDistance}`, // Dynamically set the scroll range
      scrub: 1,
      invalidateOnRefresh: true,
      onRefresh: (self) => {
        // Recalculate scroll distance on refresh
        const newContentHeight = descriptionInner.offsetHeight;
        const newScrollDistance = newContentHeight - visibleHeight;
        self.animation.vars.y = -newScrollDistance;
        self.animation.invalidate();
      }
    });

    // Create the animation for changing SVG width
    ScrollTrigger.create({
      id: "svgWidthScroll",
      animation: gsap.to(svgLogo, {
        width: "65%",
        opacity: 0.5,
        ease: "customScroll"
      }),
      trigger: containerSticky,
      start: "top top",
      end: `+=${scrollDistance}`, // Ensure the animation runs over the full scroll range
      scrub: 1
    });
  }

  // Initialize the dynamic scroll setup
  setupDynamicScroll();

  // Recalculate on window resize with debounce
  window.addEventListener("resize", debounce(setupDynamicScroll, 250));

  // Force recalculation on page load and when hidden tabs become visible
  window.addEventListener("load", () => setTimeout(setupDynamicScroll, 100));
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      setupDynamicScroll();
    }
  });
});