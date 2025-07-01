gsap.registerPlugin(ScrollTrigger);

// Create a div for the wipe effect
const wipeEffect = document.createElement("div");
wipeEffect.classList.add("wipe-effect");
document.body.appendChild(wipeEffect);

gsap.to(wipeEffect, {
  x: 0, // Move it into view from the left
  scrollTrigger: {
    trigger: ".content",
    start: "top top",
    end: "bottom top",
    scrub: true,
    opacity: 0,
    markers: {
      // Custom markers
      startColor: "red",
      endColor: "blue",
      fontSize: "16px", 
      indent: 20
    }
  }
});