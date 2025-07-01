document.addEventListener("DOMContentLoaded", () => {
  // Initialize GSAP ScrollTrigger
  gsap.registerPlugin(ScrollTrigger);

  // Initialize animations
  initializeAnimations();

  // Initialize the dots
  createDots();

  // Handle window resize
  window.addEventListener("resize", () => {
    // Recalculate and recreate dots
    createDots();
  });

  // Function to initialize all animations
  function initializeAnimations() {
    // Split the main text with Split Type
    const mainText = new SplitType(".hero__main-text", {
      types: "words, chars"
    });

    // Create separate animations for each element instead of a timeline
    // This gives more control over each animation's behavior

    // Top caption animation
    gsap.fromTo(
      ".hero__caption--top",
      { opacity: 0 },
      {
        opacity: 1,
        duration: 1.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".hero",
          start: "top 75%",
          end: "center center",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Main text container animation
    gsap.fromTo(
      ".hero__main-text",
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.5,
        ease: "power1.out",
        scrollTrigger: {
          trigger: ".hero__content",
          start: "top 75%",
          end: "center center",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Words animation - using a different approach for better reversal
    const words = mainText.words;

    // Create a separate ScrollTrigger for the words animation
    const wordsTrigger = ScrollTrigger.create({
      trigger: ".hero__content",
      start: "top 75%",
      end: "center center",
      onEnter: () => animateWordsIn(),
      onLeaveBack: () => animateWordsOut()
    });

    // Function to animate words in
    function animateWordsIn() {
      gsap.to(words, {
        opacity: 1,
        y: 0,
        stagger: 0.04,
        duration: 1.2,
        ease: "power3.out",
        overwrite: true
      });
    }

    // Function to animate words out (reverse)
    function animateWordsOut() {
      gsap.to(words, {
        opacity: 0,
        y: 20,
        stagger: 0.02,
        duration: 0.8,
        ease: "power2.in",
        overwrite: true
      });
    }

    // Set initial state of words
    gsap.set(words, { opacity: 0, y: 20 });

    // Bottom caption animation
    gsap.fromTo(
      ".hero__caption--bottom",
      { opacity: 0 },
      {
        opacity: 1,
        duration: 1.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".hero",
          start: "top 65%",
          end: "center center",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Set up the center-out character animation
    setupCenterOutCharAnimation();
  }

  // Function to create dots
  function createDots() {
    const dotsContainer = document.getElementById("dotsContainer");
    if (!dotsContainer) return;

    // Clear existing dots
    while (dotsContainer.firstChild) {
      dotsContainer.removeChild(dotsContainer.firstChild);
    }

    const containerWidth = dotsContainer.offsetWidth;
    const containerHeight = dotsContainer.offsetHeight;

    // Configuration
    const dotSize = 3;
    const spacingX = 40;
    const spacingY = 40;
    const padding = 80;

    // Calculate number of dots based on container size with padding
    const availableWidth = containerWidth - padding * 2;
    const availableHeight = containerHeight - padding * 2;
    const numDotsX = Math.floor(availableWidth / spacingX);
    const numDotsY = Math.floor(availableHeight / spacingY);

    // Starting point to center the grid
    const startX = padding + (availableWidth - numDotsX * spacingX) / 2;
    const startY = padding + (availableHeight - numDotsY * spacingY) / 2;

    // Create dots
    for (let y = 0; y < numDotsY; y++) {
      for (let x = 0; x < numDotsX; x++) {
        const dot = document.createElement("div");
        dot.className = "footer__dot";

        // Set size and position
        dot.style.width = `${dotSize}px`;
        dot.style.height = `${dotSize}px`;
        dot.style.left = `${startX + x * spacingX}px`;
        dot.style.top = `${startY + y * spacingY}px`;

        // Store original position for reference
        dot.dataset.origX = (startX + x * spacingX).toString();
        dot.dataset.origY = (startY + y * spacingY).toString();

        // Set initial opacity
        dot.style.opacity = "0.3";

        dotsContainer.appendChild(dot);
      }
    }

    // Set up dot interactions
    setupDotInteractions();
  }

  // Function to set up dot interactions
  function setupDotInteractions() {
    const dots = document.querySelectorAll(".footer__dot");
    const footer = document.querySelector(".footer");

    // Track mouse position
    let mouseX = 0;
    let mouseY = 0;

    // Update dots on mouse move
    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      requestAnimationFrame(() => {
        updateDots(mouseX, mouseY);
      });
    });

    // Reset dots when mouse leaves footer
    footer.addEventListener("mouseleave", () => {
      dots.forEach((dot) => {
        dot.style.transform = "translate(0, 0)";
        dot.style.opacity = "0.3";
        dot.style.width = `3px`;
        dot.style.height = `3px`;
      });
    });
  }

  // Function to update dots based on mouse position
  function updateDots(mouseX, mouseY) {
    const dots = document.querySelectorAll(".footer__dot");
    const footer = document.querySelector(".footer");
    const footerRect = footer.getBoundingClientRect();

    // Only activate when footer is in view
    if (footerRect.bottom < 0 || footerRect.top > window.innerHeight) {
      return;
    }

    const dotSize = 3;
    const maxDotSize = 10;
    const maxDistance = 200;
    const moveAmount = 20;

    dots.forEach((dot) => {
      const dotRect = dot.getBoundingClientRect();
      const dotCenterX = dotRect.left + dotRect.width / 2;
      const dotCenterY = dotRect.top + dotRect.height / 2;

      // Calculate distance from mouse to dot
      const distX = mouseX - dotCenterX;
      const distY = mouseY - dotCenterY;
      const distance = Math.sqrt(distX * distX + distY * distY);

      // Calculate brightness based on distance from cursor
      const brightnessFactor = Math.max(0, 1 - distance / maxDistance);
      const opacity = 0.3 + brightnessFactor * 0.7;
      dot.style.opacity = opacity.toString();

      if (distance < maxDistance) {
        // Calculate size based on proximity
        const sizeFactor = Math.max(0, 1 - distance / maxDistance);
        const newSize = dotSize + sizeFactor * (maxDotSize - dotSize);
        dot.style.width = `${newSize}px`;
        dot.style.height = `${newSize}px`;

        // Dots move away from the cursor
        const factor = (1 - distance / maxDistance) * moveAmount;

        // Calculate new position
        const angle = Math.atan2(distY, distX);
        const moveX = -Math.cos(angle) * factor * 2;
        const moveY = -Math.sin(angle) * factor * 2;

        // Calculate offset to maintain center point as dot grows
        const sizeChange = newSize - dotSize;
        const offsetX = sizeChange / 2;
        const offsetY = sizeChange / 2;

        // Apply transform
        dot.style.transform = `translate(${moveX - offsetX}px, ${
          moveY - offsetY
        }px)`;
      } else {
        // Reset size and position
        dot.style.width = `${dotSize}px`;
        dot.style.height = `${dotSize}px`;
        dot.style.transform = "translate(0, 0)";
      }
    });
  }

  // Function to set up the center-out character animation
  function setupCenterOutCharAnimation() {
    // Initialize Splitting.js
    const Splitting = function () {
      const elements = document.querySelectorAll("[data-splitting]");

      elements.forEach((element) => {
        // Split text into words and chars
        const text = element.textContent;
        const words = text.split(" ");

        element.innerHTML = words
          .map((word) => {
            return `<span class="word" style="position: relative; display: inline-block; margin-right: 0.25em;">${Array.from(
              word
            )
              .map(
                (char) =>
                  `<span class="char" style="position: relative; display: inline-block;">${char}</span>`
              )
              .join("")}</span>`;
          })
          .join(" ");

        return {
          elements,
          words: document.querySelectorAll(".word"),
          chars: document.querySelectorAll(".char")
        };
      });

      return { results: elements };
    };

    // Execute splitting
    Splitting();

    // Apply center-out animation
    const animatedTitles = [
      ...document.querySelectorAll(
        ".footer__title[data-splitting][data-center-animation]"
      )
    ];

    animatedTitles.forEach((title) => {
      const words = title.querySelectorAll(".word");

      for (const word of words) {
        const chars = word.querySelectorAll(".char");

        // Create a timeline for better control
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: word,
            start: "center bottom+=30%",
            end: "top top+=15%",
            scrub: 0.5,
            invalidateOnRefresh: true,
            toggleActions: "restart pause resume reset" // Restart animation when scrolling back up
          }
        });

        // Add the animation to the timeline
        tl.fromTo(
          chars,
          {
            "will-change": "opacity, transform",
            x: (position, _, arr) => 150 * (position - arr.length / 2),
            opacity: 0.5
          },
          {
            ease: "power1.inOut",
            x: 0,
            opacity: 1,
            stagger: {
              grid: "auto",
              from: "center"
            }
          }
        );
      }
    });
  }
});