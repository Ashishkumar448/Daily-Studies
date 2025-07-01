console.clear();
gsap.registerPlugin(ScrollTrigger);

const cardsWrappers = gsap.utils.toArray(".card-wrapper");
const cards = gsap.utils.toArray(".card");
const cardImages = gsap.utils.toArray(".card-image");
const cardTitles = gsap.utils.toArray(".card-title");

cardsWrappers.forEach((wrapper, i) => {
  const card = cards[i];
  const image = cardImages[i];
  const title = cardTitles[i];

  // ALL cards get the same stacking effect
  let scale = 0.97;
  let rotation = -6;

  // Subtle entrance animation for each card
  gsap.from(card, {
    y: 30,
    opacity: 0,
    duration: 0.6,
    delay: i * 0.1,
    ease: "power2.out"
  });

  // Card animation
  gsap.to(card, {
    scale: scale,
    rotationX: rotation,
    transformOrigin: "top center",
    ease: "none",
    scrollTrigger: {
      trigger: wrapper,
      start: "top " + (60 + 8 * i),
      end: "bottom 550",
      endTrigger: ".wrapper",
      scrub: 0.5,
      pin: wrapper,
      pinSpacing: false,
      id: i + 1,
      onUpdate: (self) => {
        // Direct zoom of image with no easing to follow scroll directly
        if (self.isActive) {
          const zoomAmount = 1 + self.progress * 0.15;
          gsap.set(image, {
            scale: zoomAmount,
            y: self.progress * -15
          });

          // Subtle title movement
          gsap.set(title, {
            y: self.progress * -8
          });
        }
      }
    }
  });
});