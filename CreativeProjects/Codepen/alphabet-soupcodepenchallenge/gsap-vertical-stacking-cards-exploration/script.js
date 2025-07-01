console.clear();
gsap.registerPlugin(ScrollTrigger);

// *** ADJUSTABLE VARIABLES ***
const cardVisibleAmount = 120; // How much of each card remains visible (in pixels)
const initialOffset = 500; // Initial spacing between cards (card height)

// Get all cards and create animation timeline
const cards = gsap.utils.toArray(".card");
const animation = gsap.timeline();

// Set initial scale for all images
gsap.set(".card-image", { scale: 1.15 });

// USING THE APPROACH FROM THE EXAMPLE:
// Set initial positions with increasing offsets
cards.forEach((card, index) => {
  if (index > 0) {
    // Set initial position with increasing offset (exactly like the example)
    gsap.set(card, { y: index * initialOffset });

    // Animate each card to its final stacked position
    // Instead of y:0, we use y:index*cardVisibleAmount to keep cards partially visible
    animation.to(
      card,
      {
        y: index * cardVisibleAmount,
        duration: index * 0.5,
        ease: "none"
      },
      0
    );

    // Zoom out image
    animation.to(
      card.querySelector(".card-image"),
      {
        scale: 1,
        duration: 0.5,
        ease: "none"
      },
      0
    );
  } else {
    // First card stays at top
    gsap.set(card, { y: 0 });

    // Zoom out first card's image
    animation.to(
      card.querySelector(".card-image"),
      {
        scale: 1,
        duration: 0.5,
        ease: "none"
      },
      0
    );
  }
});

// Create the scroll trigger (similar to the example)
ScrollTrigger.create({
  trigger: ".cards-container",
  start: "top top",
  pin: true,
  end: `+=${cards.length * initialOffset}`, // End based on number of cards and initial offset
  scrub: true,
  animation: animation
});