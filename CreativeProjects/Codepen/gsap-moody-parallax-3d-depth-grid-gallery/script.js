document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".container");
  const imagesContainer = document.querySelector(".images-container");
  const images = document.querySelectorAll(".floating-image");
  const centeredText = document.querySelector(".centered-text");
  const glow = document.querySelector(".glow");

  // Initial fixed transforms for each image position
  const initialTransforms = [
    { x: -10, y: -10, z: 50, rotateY: 25, rotateX: -5 }, // Top Left
    { x: 0, y: -15, z: 70, rotateX: -10, rotateY: 0 }, // Top Center
    { x: 10, y: -10, z: 50, rotateY: -25, rotateX: -5 }, // Top Right
    { x: -15, y: 0, z: 70, rotateY: 30, rotateX: 0 }, // Middle Left
    { x: 15, y: 0, z: 70, rotateY: -30, rotateX: 0 }, // Middle Right
    { x: -10, y: 10, z: 50, rotateY: 25, rotateX: 5 }, // Bottom Left
    { x: 0, y: 15, z: 70, rotateX: 10, rotateY: 0 }, // Bottom Center
    { x: 10, y: 10, z: 50, rotateY: -25, rotateX: 5 } // Bottom Right
  ];

  // Enhanced mouse movement
  container.addEventListener("mousemove", (e) => {
    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const moveX = (clientX - centerX) / centerX;
    const moveY = (clientY - centerY) / centerY;

    // Move glow effect with mouse
    gsap.to(glow, {
      duration: 1.5,
      ease: "power2.out",
      x: `calc(-50% + ${moveX * 100}px)`,
      y: `calc(-50% + ${moveY * 100}px)`,
      opacity: 0.5 + Math.abs(moveX * moveY) * 0.3
    });

    // Move the entire container as one unit
    gsap.to(imagesContainer, {
      duration: 1.2,
      ease: "power2.out",
      transform: `
            perspective(1200px)
            rotateX(${-moveY * 8}deg)
            rotateY(${moveX * 8}deg)
            translateZ(${-Math.abs(moveX * moveY) * 100}px)
          `
    });

    // Subtle text movement - consistent transform to avoid jumps
    gsap.to(centeredText, {
      duration: 1.5,
      ease: "power2.out",
      x: moveX * 40,
      y: moveY * 25,
      onComplete: function () {
        // Store the current transform as a data attribute to prevent jumps
        const currentTransform = centeredText._gsTransform;
        if (currentTransform) {
          centeredText.setAttribute("data-last-x", currentTransform.x);
          centeredText.setAttribute("data-last-y", currentTransform.y);
        }
      }
    });

    // Add individual movement to images based on their data-speed
    images.forEach((image, index) => {
      const speed = parseFloat(image.dataset.speed) || 0.5;
      const transform = initialTransforms[index];

      // Additional movement based on mouse position and speed attribute
      const extraX = moveX * 20 * speed;
      const extraY = moveY * 20 * speed;
      const extraRotateY = moveX * 10 * speed;
      const extraRotateX = -moveY * 10 * speed;

      gsap.to(image, {
        duration: 1.5,
        ease: "power2.out",
        transform: `
              translate3d(${transform.x + extraX}%, ${transform.y + extraY}%, ${
          transform.z
        }px)
              rotateY(${transform.rotateY + extraRotateY}deg)
              rotateX(${transform.rotateX + extraRotateX}deg)
            `
      });
    });
  });

  // Reset position with smooth animation
  container.addEventListener("mouseleave", () => {
    // Get current position
    const currentX = gsap.getProperty(centeredText, "x");
    const currentY = gsap.getProperty(centeredText, "y");

    // Smooth animation back to center
    gsap.to(imagesContainer, {
      duration: 1.5,
      ease: "power2.out",
      transform:
        "perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0px)"
    });

    // Properly animate text from current position to center
    gsap.to(centeredText, {
      duration: 1.5,
      ease: "power2.out",
      x: 0,
      y: 0
    });

    gsap.to(glow, {
      duration: 1.5,
      ease: "power2.out",
      x: "-50%",
      y: "-50%",
      opacity: 0.9
    });

    // Reset individual images
    images.forEach((image, index) => {
      const transform = initialTransforms[index];

      gsap.to(image, {
        duration: 1.2,
        ease: "power2.out",
        transform: `
              translate3d(${transform.x}%, ${transform.y}%, ${transform.z}px)
              rotateY(${transform.rotateY}deg)
              rotateX(${transform.rotateX}deg)
            `
      });
    });
  });

  // Initial animations
  gsap.from(centeredText, {
    y: 30,
    opacity: 0,
    duration: 1.5,
    ease: "power3.out"
  });

  gsap.from(images, {
    scale: 0.8,
    opacity: 0,
    stagger: 0.08,
    duration: 1.2,
    ease: "power2.out"
  });
});