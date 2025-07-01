document.addEventListener("DOMContentLoaded", () => {
  // Initialize smooth scrolling
  const lenis = new Lenis({
    duration: 1.8,
    easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    direction: "vertical",
    smooth: true,
    mouseMultiplier: 1.2,
    touchMultiplier: 2
  });
  // Register ScrollTrigger
  gsap.registerPlugin(ScrollTrigger);
  // Sync scrolling
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  // Get columns
  const col1 = document.getElementById("col1");
  const col2 = document.getElementById("col2");
  const col3 = document.getElementById("col3");
  // Get navigation items
  const navItems = document.querySelectorAll(".nav-item");
  const sections = navItems.length;
  // Set up animations with reversed direction for col2
  function setupAnimations() {
    // Calculate total distance to scroll
    const distance = (sections - 1) * window.innerHeight;
    // Animation for col1 - Standard downward movement
    gsap.to(col1, {
      y: -distance,
      ease: "none",
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: true
      }
    });
    // Animation for col2 - Upward movement (reversed)
    gsap.to(col2, {
      y: distance,
      ease: "none",
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: true
      }
    });
    // Animation for col3 - Standard downward movement
    gsap.to(col3, {
      y: -distance,
      ease: "none",
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: true
      }
    });
  }
  // Update navigation with improved accuracy
  function updateNav() {
    const scrollPos = window.scrollY;
    const viewportHeight = window.innerHeight;
    // Calculate section with threshold for better alignment
    // Using 0.4 as threshold means the section will change when 40% of the next section is visible
    const threshold = 0.4;
    const section = Math.min(
      Math.floor((scrollPos + viewportHeight * threshold) / viewportHeight),
      sections - 1
    );
    navItems.forEach((item, i) => {
      if (i === section) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }
  // Add navigation click events
  navItems.forEach((item, i) => {
    item.addEventListener("click", () => {
      lenis.scrollTo(i * window.innerHeight, {
        duration: 1.2
      });
    });
  });
  // Update navigation on scroll
  window.addEventListener("scroll", updateNav);
  // Initialize
  setupAnimations();
  updateNav();
  // Add resize handler to ensure proper alignment
  window.addEventListener("resize", () => {
    // Refresh ScrollTrigger
    ScrollTrigger.refresh();
    // Update navigation
    updateNav();
  });
});