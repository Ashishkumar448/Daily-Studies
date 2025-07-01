document.addEventListener("DOMContentLoaded", () => {
  const restartBtn = document.querySelector(".restart-btn");
  const additionalDots = document.querySelectorAll(".dot:nth-child(n+5)");
  const centerDot = document.querySelector(".center-dot");

  // Register GSAP plugins
  gsap.registerPlugin(CustomEase);

  // Create custom easing functions
  CustomEase.create("customEase", "0.6, 0.01, 0.05, 1");
  CustomEase.create("blurEase", "0.25, 0.1, 0.25, 1");
  CustomEase.create("counterEase", "0.35, 0.0, 0.15, 1");
  CustomEase.create("gentleIn", "0.38, 0.005, 0.215, 1");
  CustomEase.create("hop", "0.9, 0, 0.1, 1");

  function animateLines() {
    const timeline = gsap.timeline();

    // Fade in header and items with stagger - keeping original timing
    timeline.to(".projects-header", {
      opacity: 1,
      duration: 0.15,
      ease: "customEase"
    });

    timeline.to(".project-item", {
      opacity: 1,
      duration: 0.15,
      stagger: 0.075,
      ease: "gentleIn"
    });

    // Change color of items - keeping original timing
    timeline.to(".project-item", {
      color: "#fff",
      duration: 0.15,
      stagger: 0.075,
      ease: "blurEase"
    });

    // Fade out items with stagger - keeping original timing
    timeline.to(".project-item", {
      opacity: 0,
      duration: 0.15,
      stagger: 0.075,
      delay: 1.5,
      ease: "counterEase"
    });

    timeline.to(".projects-header", {
      opacity: 0,
      duration: 0.15,
      ease: "customEase"
    });

    // Show restart button
    timeline.to(restartBtn, {
      opacity: 1,
      duration: 0.3,
      ease: "hop"
    });
  }

  // Start animation
  animateLines();

  // Restart button functionality
  restartBtn.addEventListener("click", () => {
    gsap.to(restartBtn, {
      opacity: 0,
      duration: 0.3,
      ease: "hop",
      onComplete: animateLines
    });
  });

  // Restart button hover animations
  restartBtn.addEventListener("mouseenter", () => {
    // Show additional 4 dots
    gsap.to(additionalDots, {
      opacity: 1,
      duration: 0.3,
      stagger: 0.05,
      ease: "customEase"
    });

    // Show and scale up center dot
    gsap.to(centerDot, {
      opacity: 1,
      scale: 1,
      duration: 0.4,
      ease: "gentleIn"
    });
  });

  restartBtn.addEventListener("mouseleave", () => {
    // Hide additional 4 dots
    gsap.to(additionalDots, {
      opacity: 0,
      duration: 0.3,
      stagger: 0.05,
      ease: "customEase"
    });

    // Hide and scale down center dot
    gsap.to(centerDot, {
      opacity: 0,
      scale: 0,
      duration: 0.4,
      ease: "gentleIn"
    });
  });
});