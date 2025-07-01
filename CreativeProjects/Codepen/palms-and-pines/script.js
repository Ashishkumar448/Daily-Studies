// Include GSAP and Plugins
gsap.registerPlugin(CustomEase);

// Create CustomEase for smooth swaying motion
CustomEase.create("windEase", "M0,0 C0.42,0 0.58,1 1,1");

// Variables to control wind effect
let windStrength = 1; // Adjust this value between 0.5 (light wind) to 3 (strong wind)
let windDirection = 1; // Use 1 for rightward wind and -1 for leftward wind

// Function to animate leaves with adjustable wind effect
function animateLeaf(leaf, originX = "50%", originY = "90%") {
  // Set the transform origin to the base of each leaf
  gsap.set(leaf, {
    transformOrigin: `${originX} ${originY}`
  });

  // Random parameters for varied movement based on wind strength
  const duration = gsap.utils.random(2, 4) / windStrength;
  const rotateAmount = gsap.utils.random(-8, 8) * windStrength * windDirection;
  const skewAmount = gsap.utils.random(-2, 2) * windStrength;
  const scaleAmount = gsap.utils.random(0.98, 1.02);

  // Create a timeline for layered animations
  const leafTl = gsap.timeline({
    repeat: -1,
    yoyo: true,
    repeatDelay: gsap.utils.random(0, 0.5)
  });

  leafTl
    .to(leaf, {
      duration: duration,
      rotate: rotateAmount,
      skewX: skewAmount,
      ease: "windEase"
    })
    .to(
      leaf,
      {
        duration: duration / 2,
        scaleY: scaleAmount,
        transformOrigin: "center top",
        ease: "sine.inOut"
      },
      0
    );
}

// Select all palm leaves
const leaves = document.querySelectorAll(
  ".palm-leaf-01, .palm-leaf-02, .palm-leaf-03, .palm-leaf-04, .palm-leaf-05, .palm-leaf-06, .palm-leaf-07, .palm-leaf-08"
);

// Animate each leaf with staggered and refined effects
leaves.forEach((leaf, index) => {
  setTimeout(() => animateLeaf(leaf, "50%", "90%"), index * 150);
});

// Optional: Animate the main path (palm tree trunk) subtly to enhance the overall effect
gsap.to(".main-path", {
  duration: 5 / windStrength,
  rotate: 0.5 * windStrength * windDirection,
  ease: "windEase",
  yoyo: true,
  repeat: -1
});