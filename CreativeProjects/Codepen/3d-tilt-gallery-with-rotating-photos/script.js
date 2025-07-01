document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".container");
  const imagesContainer = document.querySelector(".images-container");
  const images = document.querySelectorAll(".floating-image");

  // Initial fixed transforms for each image position
  const initialTransforms = [
    { x: -10, y: -10, rotateY: 25, rotateX: -5 }, // Top Left
    { x: 0, y: -15, rotateX: -10, rotateY: 0 }, // Top Center
    { x: 10, y: -10, rotateY: -25, rotateX: -5 }, // Top Right
    { x: -15, y: 0, rotateY: 30, rotateX: 0 }, // Middle Left
    { x: 15, y: 0, rotateY: -30, rotateX: 0 }, // Middle Right
    { x: -10, y: 10, rotateY: 25, rotateX: 5 }, // Bottom Left
    { x: 0, y: 15, rotateX: 10, rotateY: 0 }, // Bottom Center
    { x: 10, y: 10, rotateY: -25, rotateX: 5 } // Bottom Right
  ];

  // Apply initial transforms
  images.forEach((image, index) => {
    const transform = initialTransforms[index];
    image.style.transform = `
      translate3d(${transform.x}%, ${transform.y}%, 50px)
      rotateY(${transform.rotateY}deg)
      rotateX(${transform.rotateX}deg)
    `;
  });

  container.addEventListener("mousemove", (e) => {
    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const moveX = (clientX - centerX) / centerX;
    const moveY = (clientY - centerY) / centerY;

    // Move the entire container as one unit
    gsap.to(imagesContainer, {
      duration: 1,
      ease: "power2.out",
      transform: `
        perspective(1000px)
        rotateX(${-moveY * 10}deg)
        rotateY(${moveX * 10}deg)
        translateZ(${-Math.abs(moveX * moveY) * 100}px)
      `
    });
  });

  // Reset position
  container.addEventListener("mouseleave", () => {
    gsap.to(imagesContainer, {
      duration: 1,
      ease: "power2.out",
      transform:
        "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)"
    });
  });
});