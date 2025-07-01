// Register GSAP plugins
gsap.registerPlugin(CustomEase);

// Create custom easing functions
CustomEase.create("customEase", "0.6, 0.01, 0.05, 1");
CustomEase.create("blurEase", "0.25, 0.1, 0.25, 1");
CustomEase.create("counterEase", "0.35, 0.0, 0.15, 1");
CustomEase.create("gentleIn", "0.38, 0.005, 0.215, 1");

let mainTl;

// Function to initialize the animation
function initAnimation() {
  if (mainTl) mainTl.kill();

  // Ensure restart button and header are hidden initially
  gsap.set(".restart-btn", { opacity: 0, pointerEvents: "none" });
  gsap.set(".header", { opacity: 1 }); // Set header to visible but children to invisible
  gsap.set(".logo-left", { opacity: 0, y: 10 });
  gsap.set(".nav-center li", { opacity: 0, y: 10 });
  gsap.set(".nav-right", { opacity: 0, y: 10 });
  gsap.set(".text-container-final", { opacity: 0 });
  gsap.set(".text-line-final", { opacity: 0 });
  gsap.set(".big-title", { opacity: 0 });
  gsap.set(".big-title .title-line span", { y: "100%", opacity: 0 });

  const percentages = [0, 20, 60, 80, 99];
  const wrappers = [
    document.getElementById("image-0"),
    document.getElementById("image-20"),
    document.getElementById("image-60"),
    document.getElementById("image-80"),
    document.getElementById("image-100")
  ];

  const percentageElement = document.querySelector(".preloader-percentage");
  const imageContainer = document.querySelector(".image-container");
  const finalWrapper = document.getElementById("image-100");
  const finalImage = finalWrapper.querySelector("img");

  // Reset wrappers and container dimensions
  gsap.set(wrappers, { visibility: "hidden", clipPath: "inset(100% 0 0 0)" });
  gsap.set(wrappers[0], { visibility: "visible" });
  gsap.set(imageContainer, { width: "400px", height: "500px" });
  gsap.set(".image-wrapper img", {
    scale: 1.2,
    transformOrigin: "center center"
  });

  // Set preloader overlay to start with solid black background
  gsap.set(".preloader", { display: "flex", opacity: 1, y: 0 });
  document.querySelector(".preloader").style.backgroundColor = "#000";

  mainTl = gsap.timeline();

  // Animate text lines in
  mainTl.to(
    ".text-line",
    {
      opacity: 1,
      duration: 0.15,
      stagger: 0.075,
      ease: "gentleIn"
    },
    0.5
  );

  // Change color of text lines
  mainTl.to(
    ".text-line",
    {
      color: "#fff",
      duration: 0.15,
      stagger: 0.075,
      ease: "blurEase"
    },
    "+=0.5"
  );

  // Improved synchronization for image changes and percentage updates
  percentages.forEach((percentage, index) => {
    const windowWidth = window.innerWidth;
    const fontSizeRem = 14;
    const fontSizePx =
      fontSizeRem *
      parseFloat(getComputedStyle(document.documentElement).fontSize);
    const textWidth = String(percentage).length * (fontSizePx * 0.6);
    const padding = 32;
    let leftPosition;
    if (percentage === 0) {
      leftPosition = padding + "px";
    } else if (percentage === 99) {
      leftPosition = windowWidth - textWidth - padding + "px";
    } else {
      const availableWidth = windowWidth - 2 * padding - textWidth;
      leftPosition = padding + (availableWidth * percentage) / 100 + "px";
    }

    // Create a synchronized label for this step
    mainTl.add(`step${percentage}`, index * 1.5);

    // Set image wrapper to visible
    mainTl.set(wrappers[index], { visibility: "visible" }, `step${percentage}`);

    // Animate image reveal and percentage change simultaneously
    mainTl.to(
      wrappers[index],
      {
        clipPath: "inset(0% 0 0 0)",
        duration: 0.65,
        ease: "customEase"
      },
      `step${percentage}`
    );

    // Synchronize percentage update with image reveal
    mainTl.to(
      percentageElement,
      {
        innerText: `${percentage}`,
        left: leftPosition,
        duration: 0.65, // Match duration with image reveal
        ease: "counterEase",
        snap: { innerText: 1 },
        onStart: function () {
          gsap.fromTo(
            percentageElement,
            { filter: "blur(8px)" },
            { filter: "blur(0px)", duration: 0.5, ease: "power2.inOut" }
          );
        }
      },
      `step${percentage}`
    ); // Start at the same time as image reveal

    // Hide previous image after current one is revealed
    if (index > 0) {
      mainTl.to(
        wrappers[index - 1],
        {
          clipPath: "inset(100% 0 0 0)",
          duration: 0.5,
          ease: "customEase",
          onComplete: function () {
            gsap.set(wrappers[index - 1], { visibility: "hidden" });
          }
        },
        `step${percentage}+=0.15`
      ); // Slight delay after current image starts revealing
    }
  });

  // Animate text lines out before final phase
  mainTl.to(
    ".text-line",
    {
      opacity: 0,
      duration: 0.15,
      stagger: 0.075,
      ease: "counterEase"
    },
    "step99+=1"
  );

  // Final phase: expand final image and animate overlay to a semi-transparent dark tone
  mainTl.add("expandFinal", ">");
  mainTl.to({}, { duration: 0.5 }, "expandFinal");

  // Expand image container to full screen
  mainTl.to(
    imageContainer,
    {
      width: "100vw",
      height: "100vh",
      duration: 1.2,
      ease: "gentleIn"
    },
    "expandFinal+=0.5"
  );

  // Scale final image
  mainTl.to(
    finalImage,
    {
      scale: 1.0,
      duration: 1.2,
      ease: "gentleIn"
    },
    "expandFinal+=0.5"
  );

  // Fade out percentage
  mainTl.to(
    percentageElement,
    {
      opacity: 0,
      filter: "blur(10px)",
      duration: 0.5,
      ease: "power2.out"
    },
    "expandFinal+=0.5"
  );

  // Show header with staggered animation
  mainTl.to(
    ".logo-left",
    {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "customEase"
    },
    "expandFinal+=1.2"
  );

  // Staggered animation for nav center items
  mainTl.to(
    ".nav-center li",
    {
      opacity: 1,
      y: 0,
      duration: 0.4,
      stagger: 0.1,
      ease: "customEase"
    },
    "expandFinal+=1.3"
  );

  // Animation for nav right
  mainTl.to(
    ".nav-right",
    {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "customEase"
    },
    "expandFinal+=1.7"
  );

  // Animate in the final text lines
  mainTl.to(
    ".text-container-final",
    {
      opacity: 1,
      duration: 0.1
    },
    "expandFinal+=1.5"
  );

  mainTl.to(
    ".text-line-final",
    {
      opacity: 1,
      color: "#fff",
      duration: 0.15,
      stagger: 0.075,
      ease: "gentleIn"
    },
    "expandFinal+=1.6"
  );

  // Show restart button
  mainTl.to(
    ".restart-btn",
    {
      opacity: 1,
      pointerEvents: "auto",
      duration: 0.3,
      ease: "hop"
    },
    "expandFinal+=1.2"
  );

  // Fix: Only change preloader background opacity during transition to full screen
  mainTl.to(
    ".preloader",
    {
      backgroundColor: "rgba(0,0,0,0.5)",
      duration: 0.5,
      ease: "customEase"
    },
    "expandFinal+=0.7"
  ); // Timing adjusted to happen during the expansion

  // Animate hero text (big title) appearance
  mainTl.to(".big-title", { opacity: 1, duration: 0.1 }, "expandFinal+=1.8");
  mainTl.to(
    ".big-title .title-line span",
    {
      y: "0%",
      opacity: 1,
      duration: 0.8,
      stagger: 0.2,
      ease: "power4.out"
    },
    "expandFinal+=1.8"
  );

  return mainTl;
}

// Initialize animation on page load
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(initAnimation, 100);

  // Set up restart button hover animations
  const restartBtn = document.querySelector(".restart-btn");
  const additionalDots = document.querySelectorAll(".dot:nth-child(n+5)");
  const centerDot = document.querySelector(".center-dot");

  // Restart button hover animations
  restartBtn.addEventListener("mouseenter", () => {
    // Show additional 4 dots
    gsap.to(additionalDots, {
      opacity: 1,
      duration: 0.3,
      stagger: 0.05,
      ease: "customEase"
    });

    // Show and scale up center dot
    gsap.to(centerDot, {
      opacity: 1,
      scale: 1,
      duration: 0.4,
      ease: "gentleIn"
    });
  });

  restartBtn.addEventListener("mouseleave", () => {
    // Hide additional 4 dots
    gsap.to(additionalDots, {
      opacity: 0,
      duration: 0.3,
      stagger: 0.05,
      ease: "customEase"
    });

    // Hide and scale down center dot
    gsap.to(centerDot, {
      opacity: 0,
      scale: 0,
      duration: 0.4,
      ease: "gentleIn"
    });
  });

  // Restart button functionality
  restartBtn.addEventListener("click", () => {
    gsap.killTweensOf("*");
    // Reset preloader overlay to initial state
    gsap.set(".preloader", { display: "flex", opacity: 1, y: 0 });
    document.querySelector(".preloader").style.backgroundColor = "#000";

    const imageContainer = document.querySelector(".image-container");
    gsap.set(imageContainer, { width: "400px", height: "500px" });

    const percentageElement = document.querySelector(".preloader-percentage");
    gsap.set(percentageElement, {
      filter: "blur(0px)",
      opacity: 1,
      innerText: "0",
      left: "2rem"
    });

    const wrappers = document.querySelectorAll(".image-wrapper");
    gsap.set(wrappers, {
      clipPath: "inset(100% 0 0 0)",
      visibility: "hidden",
      position: "absolute",
      top: 0,
      left: 0
    });
    gsap.set(wrappers[0], { visibility: "visible" });

    gsap.set(".image-wrapper img", {
      scale: 1.2,
      transformOrigin: "center center"
    });
    gsap.set(".restart-btn", { opacity: 0, pointerEvents: "none" });
    gsap.set(".header", { opacity: 1 });
    gsap.set(".logo-left", { opacity: 0, y: 10 });
    gsap.set(".nav-center li", { opacity: 0, y: 10 });
    gsap.set(".nav-right", { opacity: 0, y: 10 });
    gsap.set(".big-title", { opacity: 0 });
    gsap.set(".big-title .title-line span", { y: "100%", opacity: 0 });
    gsap.set(".text-line", { opacity: 0, color: "#4f4f4f" });
    gsap.set(".text-line-final", { opacity: 0 });
    gsap.set(".text-container-final", { opacity: 0 });

    document.querySelector(".preloader").style.display = "flex";
    setTimeout(initAnimation, 100);
  });
});