document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.querySelector(".overlay-menu__btn");
  const overlayMenu = document.querySelector(".overlay-menu");
  const menuContent = document.querySelector(".overlay-menu__layout");
  const menuLinks = document.querySelectorAll(".overlay-menu__link");
  const scrollIndicator = document.querySelector(".scroll-indicator");

  // Define the custom ease
  CustomEase.create("mysteriousEase", "M0,0 C0.3,0 0.2,1 1,1");

  // Fade-in effect for scroll indicator
  gsap.to(scrollIndicator, {
    opacity: 1,
    y: 0,
    duration: 0.5,
    ease: "power2.out",
    delay: 1
  });

  // Apply double hover effect immediately
  createDoubleHoverEffect();

  const openMenu = () => {
    gsap.set(overlayMenu, { clipPath: "inset(100% 0 0 0)", opacity: 1 });
    gsap.set(menuLinks, { clipPath: "inset(0 100% 0 0)", opacity: 0 });

    document.body.classList.add("menu-open");

    const tl = gsap.timeline();

    tl.to(overlayMenu, {
      clipPath: "inset(0% 0 0 0)",
      duration: 0.4,
      ease: "mysteriousEase",
      pointerEvents: "auto"
    })
      .to(
        menuContent,
        {
          opacity: 1,
          duration: 0.3,
          ease: "power2.out"
        },
        "-=0.1"
      )
      .to(
        menuLinks,
        {
          clipPath: "inset(0 0% 0 0)",
          opacity: 1,
          duration: 1,
          stagger: 0.2,
          ease: "cubic-bezier(.41,.01,.52,.92)"
        },
        "-=0.3"
      );
  };

  const closeMenu = () => {
    const tl = gsap.timeline();

    tl.to(menuLinks, {
      clipPath: "inset(0 100% 0 0)",
      opacity: 0,
      duration: 0.4,
      stagger: 0.1,
      ease: "cubic-bezier(.41,.01,.52,.92)"
    })
      .to(
        menuContent,
        {
          opacity: 0,
          duration: 0.3,
          ease: "power2.in"
        },
        "-=0.1"
      )
      .to(
        overlayMenu,
        {
          clipPath: "inset(0% 0 100% 0)",
          duration: 0.4,
          ease: "mysteriousEase",
          onComplete: () => {
            document.body.classList.remove("menu-open");
            overlayMenu.style.pointerEvents = "none";
          }
        },
        "-=0.2"
      );
  };

  // Toggle menu open/close on button click
  menuBtn.addEventListener("click", () => {
    if (document.body.classList.contains("menu-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  function createDoubleHoverEffect() {
    const animatedLinks = document.querySelectorAll(".animated-link");
    animatedLinks.forEach((link) => {
      const hoverTexts = link.querySelectorAll(".hover-text");
      const [originalText, hoverText] = hoverTexts;

      let splitOriginal = new SplitType(originalText, { types: "chars" });
      let splitHover = new SplitType(hoverText, { types: "chars" });

      gsap.set(splitHover.chars, { yPercent: 100 });

      link.addEventListener("mouseenter", () => {
        gsap.to(splitOriginal.chars, {
          yPercent: -100,
          duration: 0.4,
          stagger: 0.02,
          ease: "power2.inOut"
        });
        gsap.to(splitHover.chars, {
          yPercent: 0,
          duration: 0.4,
          stagger: 0.02,
          ease: "power2.inOut"
        });
      });

      link.addEventListener("mouseleave", () => {
        gsap.to(splitOriginal.chars, {
          yPercent: 0,
          duration: 0.4,
          stagger: 0.02,
          ease: "power2.inOut"
        });
        gsap.to(splitHover.chars, {
          yPercent: 100,
          duration: 0.4,
          stagger: 0.02,
          ease: "power2.inOut"
        });
      });
    });
  }
});