document.addEventListener("DOMContentLoaded", function () {
  const items = document.querySelectorAll(".text-reveal__item");
  const cube = document.querySelector(".text-reveal__cube");
  const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

  items.forEach((item, index) => {
    const textWidth = item.offsetWidth;
    const extraDistance = 20;
    const totalDistance = textWidth + extraDistance;
    const revealDuration = 1;
    const extendedMoveDuration = 1.5;
    const hideDuration = 1;
    const stopDuration = 0.5;

    tl.set(item, { visibility: "visible" })
      // Start rotation clockwise
      .to(
        cube,
        {
          duration: revealDuration + extendedMoveDuration,
          rotation: "+=720", // Two full rotations during reveal
          ease: "power1.inOut"
        },
        "<"
      )
      // Reveal text and move cube
      .to(
        cube,
        {
          duration: revealDuration,
          x: textWidth,
          ease: "cubic-bezier(.41,.01,.52,.92)"
        },
        "<"
      )
      .to(
        item,
        {
          duration: revealDuration,
          clipPath: "inset(0 0% 0 0)",
          opacity: 1,
          ease: "cubic-bezier(.41,.01,.52,.92)"
        },
        "<"
      )
      // Move cube a bit further
      .to(
        cube,
        {
          duration: extendedMoveDuration,
          x: totalDistance,
          ease: "cubic-bezier(.41,.01,.52,.92)"
        },
        ">"
      )
      .to(cube, {
        duration: hideDuration,
        rotation: "-=360",
        ease: "power1.inOut" // Gradual speed-up
      })
      // Move cube back and hide text
      .to(
        cube,
        {
          duration: hideDuration,
          x: 0,
          ease: "cubic-bezier(.41,.01,.52,.92)"
        },
        "<"
      )
      .to(
        item,
        {
          duration: hideDuration,
          clipPath: "inset(0 100% 0 0)",
          opacity: 0,
          ease: "cubic-bezier(.41,.01,.52,.92)",
          onComplete: () => {
            gsap.set(item, { visibility: "hidden" });
          }
        },
        "<"
      );
  });
});