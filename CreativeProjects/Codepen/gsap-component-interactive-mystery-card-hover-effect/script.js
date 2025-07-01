document.addEventListener("DOMContentLoaded", function () {
  // Define elements
  const gridContainer = document.getElementById("gridContainer");
  const centerCard = document.getElementById("centerCard");
  const centerImage = document.getElementById("centerImage");
  const categoriesMenu = document.getElementById("categoriesMenu");
  const interactiveArea = document.getElementById("interactiveArea");
  const allCards = document.querySelectorAll(".card:not(.card-5)");
  const allCategories = document.querySelectorAll(".category");
  const mysteriousMessage = document.getElementById("mysteriousMessage");

  // Logo elements
  const logoContainer = document.getElementById("logoContainer");
  const logoWrapper = document.querySelector(".logo-wrapper");
  const logoChars = document.querySelectorAll(".logo .char");
  const vChar = document.querySelector(".logo .v-char");
  const sChar = document.querySelector(".logo .s-char");
  const spacer = document.querySelector(".logo .spacer");

  // Flip card elements
  const flipCard = document.getElementById("flipCard");
  const cardInner = document.getElementById("cardInner");

  // Define the custom ease for all animations
  CustomEase.create("customEase", "0.86,0,0.07,1");

  // Animation durations
  const duration = 0.64;
  const menuInDuration = 0.64;
  const menuOutDuration = 0.48;
  const charDuration = 0.15;
  const finalMergeDuration = 0.5;
  const flipDuration = 0.8; // Faster flip animation

  // Create timelines
  const expandTimeline = gsap.timeline({ paused: true });

  // Create a separate timeline for center image zoom
  const centerImageZoom = gsap.timeline({ paused: true });
  centerImageZoom.to(centerImage, {
    scale: 1.08,
    duration: duration,
    ease: "customEase"
  });

  // Create a timeline for logo animation
  const logoTimeline = gsap.timeline({ paused: true });

  // Create a timeline for the flip animation
  const flipTimeline = gsap.timeline({
    paused: true,
    onComplete: () => {
      isFlipping = false;
      isFlipped = true;
    }
  });

  // Add the flip animation to the timeline with blur effect
  flipTimeline
    .to(cardInner, {
      rotationY: 900, // 720 + 180 degrees (2.5 turns)
      duration: flipDuration,
      ease: "power2.inOut",
      onStart: () => {
        // Start with no blur
        gsap.set(flipCard, { filter: "blur(0px)" });
      }
    })
    .to(
      flipCard,
      {
        filter: "blur(8px)",
        duration: 0.2, // Faster blur
        ease: "power1.in"
      },
      0
    )
    .to(
      flipCard,
      {
        filter: "blur(0px)",
        duration: 0.2, // Faster blur
        ease: "power1.out"
      },
      flipDuration - 0.2
    ); // Adjust timing to end with the rotation

  // Create a timeline for flipping back
  const flipBackTimeline = gsap.timeline({
    paused: true,
    onComplete: () => {
      isFlipping = false;
      isFlipped = false;
    }
  });

  // Add the flip back animation with blur effect
  flipBackTimeline
    .to(cardInner, {
      rotationY: 0,
      duration: flipDuration,
      ease: "power2.inOut",
      onStart: () => {
        gsap.set(flipCard, { filter: "blur(0px)" });
      }
    })
    .to(
      flipCard,
      {
        filter: "blur(8px)",
        duration: 0.2, // Faster blur
        ease: "power1.in"
      },
      0
    )
    .to(
      flipCard,
      {
        filter: "blur(0px)",
        duration: 0.2, // Faster blur
        ease: "power1.out"
      },
      flipDuration - 0.2
    ); // Adjust timing to end with the rotation

  // Define the sequence of characters to hide
  const hideSequence = [13, 5, 12, 4, 11, 3, 10, 2, 9, 1, 8];

  // Add each character to the timeline with a staggered delay
  hideSequence.forEach((index, i) => {
    const char = document.querySelector(`.logo .char[data-index="${index}"]`);

    logoTimeline.to(
      char,
      {
        opacity: 0,
        filter: "blur(8px)",
        duration: charDuration,
        ease: "customEase"
      },
      i * 0.05
    );
  });

  // Hide the spacer with blur effect
  logoTimeline.to(
    spacer,
    {
      opacity: 0,
      filter: "blur(8px)",
      duration: charDuration,
      ease: "customEase"
    },
    hideSequence.length * 0.05
  );

  // Move S next to V by adjusting the position of S
  logoTimeline.to(
    sChar,
    {
      x: function () {
        const vRect = vChar.getBoundingClientRect();
        const sRect = sChar.getBoundingClientRect();
        return -(sRect.left - vRect.right);
      },
      duration: finalMergeDuration,
      ease: "customEase"
    },
    hideSequence.length * 0.05 + 0.05
  );

  // Set up card positions for the grid
  // Row 1
  expandTimeline.to(
    ".card-1",
    {
      top: 0,
      left: 0,
      xPercent: 0,
      yPercent: 0,
      opacity: 1,
      scale: 1,
      visibility: "visible",
      ease: "customEase",
      duration: duration,
      delay: 0.05
    },
    0
  );

  expandTimeline.to(
    ".card-2",
    {
      top: 0,
      left: "50%",
      xPercent: -50,
      yPercent: 0,
      opacity: 1,
      scale: 1,
      visibility: "visible",
      ease: "customEase",
      duration: duration,
      delay: 0.1
    },
    0
  );

  expandTimeline.to(
    ".card-3",
    {
      top: 0,
      left: "100%",
      xPercent: -100,
      yPercent: 0,
      opacity: 1,
      scale: 1,
      visibility: "visible",
      ease: "customEase",
      duration: duration,
      delay: 0.15
    },
    0
  );

  // Row 2
  expandTimeline.to(
    ".card-4",
    {
      top: "50%",
      left: 0,
      xPercent: 0,
      yPercent: -50,
      opacity: 1,
      scale: 1,
      visibility: "visible",
      ease: "customEase",
      duration: duration,
      delay: 0.2
    },
    0
  );

  expandTimeline.to(
    ".card-6",
    {
      top: "50%",
      left: "100%",
      xPercent: -100,
      yPercent: -50,
      opacity: 1,
      scale: 1,
      visibility: "visible",
      ease: "customEase",
      duration: duration,
      delay: 0.25
    },
    0
  );

  // Row 3
  expandTimeline.to(
    ".card-7",
    {
      top: "100%",
      left: 0,
      xPercent: 0,
      yPercent: -100,
      opacity: 1,
      scale: 1,
      visibility: "visible",
      ease: "customEase",
      duration: duration,
      delay: 0.3
    },
    0
  );

  expandTimeline.to(
    ".card-8",
    {
      top: "100%",
      left: "50%",
      xPercent: -50,
      yPercent: -100,
      opacity: 1,
      scale: 1,
      visibility: "visible",
      ease: "customEase",
      duration: duration,
      delay: 0.35
    },
    0
  );

  expandTimeline.to(
    ".card-9",
    {
      top: "100%",
      left: "100%",
      xPercent: -100,
      yPercent: -100,
      opacity: 1,
      scale: 1,
      visibility: "visible",
      ease: "customEase",
      duration: duration,
      delay: 0.4
    },
    0
  );

  // Show mysterious message when grid expands
  expandTimeline.to(
    mysteriousMessage,
    {
      opacity: 1,
      duration: 0.5,
      ease: "power2.out",
      delay: 0.6
    },
    0
  );

  // Initialize GSAP settings for menu items
  gsap.set(allCategories, {
    opacity: 0,
    y: 20,
    visibility: "hidden"
  });

  // Initialize logo characters
  gsap.set(logoChars, {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: "blur(0px)"
  });

  // Initialize mysterious message
  gsap.set(mysteriousMessage, {
    opacity: 0
  });

  // Add hover effect for category items
  gsap.utils.toArray(".category").forEach((category) => {
    category.addEventListener("mouseenter", () => {
      gsap.to(category, { opacity: 1, duration: 0.3, ease: "power2.out" });
    });

    category.addEventListener("mouseleave", () => {
      if (isExpanded) {
        gsap.to(category, { opacity: 1, duration: 0.3, ease: "power2.out" });
      }
    });
  });

  // State tracking
  let isExpanded = false;
  let isHoveringGrid = false;
  let isHoveringMenu = false;
  let isHoveringFlipCard = false;
  let menuAnimation = null;
  let isFlipping = false;
  let isFlipped = false;

  // Check if device supports hover
  const supportsHover = window.matchMedia("(hover: hover)").matches;

  // Only enable the animation on devices that support hover
  if (supportsHover) {
    // Function to animate menu appearance
    function showMenu() {
      if (menuAnimation) {
        menuAnimation.kill();
      }

      menuAnimation = gsap.timeline();

      menuAnimation.staggerTo(
        Array.from(allCategories).reverse(),
        menuInDuration,
        {
          opacity: 1,
          y: 0,
          visibility: "visible",
          ease: "customEase",
          stagger: 0.08
        }
      );

      menuAnimation.play();
    }

    // Function to animate menu disappearance
    function hideMenu() {
      if (menuAnimation) {
        menuAnimation.kill();
      }
      {
        menuAnimation.kill();
      }

      menuAnimation = gsap.timeline();

      menuAnimation.staggerTo(allCategories, menuOutDuration, {
        opacity: 0,
        y: 20,
        visibility: "hidden",
        ease: "customEase",
        stagger: 0.05
      });

      menuAnimation.play();
    }

    // Function to expand the grid and zoom center image
    function expandGrid() {
      if (!isExpanded) {
        isExpanded = true;
        expandTimeline.play();
        showMenu();
        centerImageZoom.play();
        logoTimeline.play();
      }
    }

    // Function to collapse the grid and unzoom center image
    function collapseGrid() {
      if (!isHoveringGrid && !isHoveringMenu && isExpanded) {
        isExpanded = false;
        expandTimeline.reverse();
        hideMenu();
        centerImageZoom.reverse();
        logoTimeline.reverse();

        // Reset the flip card if it's flipped when grid collapses
        if (isFlipped || isFlipping) {
          flipTimeline.kill();
          flipBackTimeline.kill();
          gsap.to(cardInner, {
            rotationY: 0,
            duration: 0.3,
            ease: "power2.out",
            onComplete: () => {
              isFlipped = false;
              isFlipping = false;
            }
          });
          gsap.to(flipCard, { filter: "blur(0px)", duration: 0.1 });
        }
      }
    }

    // Center card triggers expansion
    centerCard.addEventListener("mouseenter", () => {
      isHoveringGrid = true;
      expandGrid();
    });

    // Grid hover tracking
    gridContainer.addEventListener("mouseenter", () => {
      isHoveringGrid = true;
    });

    gridContainer.addEventListener("mouseleave", () => {
      isHoveringGrid = false;
      setTimeout(() => {
        collapseGrid();
      }, 50);
    });

    // Menu hover tracking
    categoriesMenu.addEventListener("mouseenter", () => {
      isHoveringMenu = true;
    });

    categoriesMenu.addEventListener("mouseleave", () => {
      isHoveringMenu = false;
      setTimeout(() => {
        collapseGrid();
      }, 50);
    });

    // Add event listener for the flip card
    flipCard.addEventListener("mouseenter", () => {
      if (isExpanded && !isFlipping && !isFlipped) {
        isHoveringFlipCard = true;
        isFlipping = true;
        flipTimeline.restart();
      }
    });

    flipCard.addEventListener("mouseleave", () => {
      isHoveringFlipCard = false;
      if (isExpanded && (isFlipping || isFlipped)) {
        flipTimeline.kill();
        isFlipping = true;
        flipBackTimeline.restart();
      }
    });

    // Global mouse tracking for robustness
    interactiveArea.addEventListener("mousemove", (e) => {
      const gridRect = gridContainer.getBoundingClientRect();
      const menuRect = categoriesMenu.getBoundingClientRect();
      const flipCardRect = flipCard.getBoundingClientRect();

      const isOverGrid =
        e.clientX >= gridRect.left &&
        e.clientX <= gridRect.right &&
        e.clientY >= gridRect.top &&
        e.clientY <= gridRect.bottom;

      const isOverMenu =
        e.clientX >= menuRect.left &&
        e.clientX <= menuRect.right &&
        e.clientY >= menuRect.top &&
        e.clientY <= menuRect.bottom;

      const isOverFlipCard =
        isExpanded &&
        e.clientX >= flipCardRect.left &&
        e.clientX <= flipCardRect.right &&
        e.clientY >= flipCardRect.top &&
        e.clientY <= flipCardRect.bottom;

      isHoveringGrid = isOverGrid;
      isHoveringMenu = isOverMenu;

      // Handle flip card hover state
      if (isOverFlipCard && !isHoveringFlipCard) {
        isHoveringFlipCard = true;
        if (!isFlipped && !isFlipping) {
          isFlipping = true;
          flipTimeline.restart();
        }
      } else if (!isOverFlipCard && isHoveringFlipCard) {
        isHoveringFlipCard = false;
        if (isFlipped || isFlipping) {
          flipTimeline.kill();
          isFlipping = true;
          flipBackTimeline.restart();
        }
      }

      if (isHoveringGrid || isHoveringMenu) {
        expandGrid();
      } else {
        collapseGrid();
      }
    });

    // Calculate initial positions after the page has fully loaded
    window.addEventListener("load", () => {
      updateLogoAnimation();
    });
  } else {
    // For touch devices, implement a click-based interaction
    centerCard.addEventListener("click", () => {
      if (!isExpanded) {
        isExpanded = true;
        expandTimeline.play();
        showMenu();
        centerImageZoom.play();
        logoTimeline.play();
      } else {
        isExpanded = false;
        expandTimeline.reverse();
        hideMenu();
        centerImageZoom.reverse();
        logoTimeline.reverse();
      }
    });

    // Add touch interaction for flip card
    flipCard.addEventListener("click", () => {
      if (isExpanded && !isFlipping) {
        if (!isFlipped) {
          isFlipping = true;
          flipTimeline.restart();
        } else {
          isFlipping = true;
          flipBackTimeline.restart();
        }
      }
    });

    // Make the center card visible
    centerCard.style.opacity = 1;
    centerCard.style.visibility = "visible";
  }

  // Function to update the logo animation with current positions
  function updateLogoAnimation() {
    const vRect = vChar.getBoundingClientRect();
    const sRect = sChar.getBoundingClientRect();

    logoTimeline.clear();

    hideSequence.forEach((index, i) => {
      const char = document.querySelector(`.logo .char[data-index="${index}"]`);

      logoTimeline.to(
        char,
        {
          opacity: 0,
          filter: "blur(8px)",
          duration: charDuration,
          ease: "customEase"
        },
        i * 0.05
      );
    });

    logoTimeline.to(
      spacer,
      {
        opacity: 0,
        filter: "blur(8px)",
        duration: charDuration,
        ease: "customEase"
      },
      hideSequence.length * 0.05
    );

    logoTimeline.to(
      sChar,
      {
        x: -(sRect.left - vRect.right),
        duration: finalMergeDuration,
        ease: "customEase"
      },
      hideSequence.length * 0.05 + 0.05
    );
  }

  // Handle window resize to ensure proper positioning
  window.addEventListener("resize", () => {
    if (isExpanded) {
      expandTimeline.pause();
      gridContainer.offsetWidth;
      expandTimeline.resume();
    }

    if (!isExpanded) {
      updateLogoAnimation();
    }
  });
});