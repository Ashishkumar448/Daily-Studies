// Register GSAP plugins
gsap.registerPlugin(CustomEase);

// Custom ease animations
CustomEase.create("customEase", "0.6, 0.01, 0.05, 1");
CustomEase.create("directionalEase", "0.16, 1, 0.3, 1");
CustomEase.create("smoothBlur", "0.25, 0.1, 0.25, 1");
CustomEase.create("gentleIn", "0.38, 0.005, 0.215, 1");

// Prevent any layout shifts during animation
gsap.config({
  force3D: true
});

// Initial zoom level for all images
const INITIAL_ZOOM = 1.2;

// Timeline for the sequence
let mainTl;

// Function to get grid column positions
function getGridPositions() {
  const gridOverlay = document.querySelector(".grid-overlay-inner");
  const columns = gridOverlay.querySelectorAll(".grid-column");

  // Make grid temporarily visible to get accurate measurements
  gsap.set(".grid-overlay", { opacity: 1 });

  // Get all column positions
  const columnPositions = Array.from(columns).map((col) => {
    const rect = col.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      width: rect.width,
      center: rect.left + rect.width / 2
    };
  });

  // Hide grid again
  gsap.set(".grid-overlay", { opacity: 0 });

  return {
    firstColumnLeft: columnPositions[0].left,
    lastColumnRight: columnPositions[columnPositions.length - 1].right,
    column7Left: columnPositions[6].left,
    columnPositions: columnPositions,
    padding: parseInt(window.getComputedStyle(gridOverlay).paddingLeft)
  };
}

// Function to position text elements based on container position
function positionTextElements() {
  const container = document.querySelector(".preloader-container");
  const containerRect = container.getBoundingClientRect();
  const textVE = document.querySelector("#text-ve");
  const textLA = document.querySelector("#text-la");

  // Position VE to the left of the container
  gsap.set(textVE, {
    left: containerRect.left - 80 + "px"
  });

  // Position LA to the right of the container
  gsap.set(textLA, {
    left: containerRect.right + 20 + "px"
  });
}

// Function to align header elements to grid
function alignHeaderToGrid(gridPositions) {
  const headerLeft = document.querySelector(".header-left");
  const headerMiddle = document.querySelector(".header-middle");
  const headerRight = document.querySelector(".header-right");

  // Align logo to first column
  gsap.set(headerLeft, {
    position: "absolute",
    left: gridPositions.firstColumnLeft + "px"
  });

  // Align middle section to column 7
  gsap.set(headerMiddle, {
    position: "absolute",
    left: gridPositions.column7Left + "px"
  });

  // Align social links to right edge
  gsap.set(headerRight, {
    position: "absolute",
    right: window.innerWidth - gridPositions.lastColumnRight + "px"
  });
}

// Function to reset everything to initial state
function resetToInitialState() {
  // Reset container
  gsap.set(".preloader-container", {
    width: "400px",
    height: "300px",
    position: "relative",
    overflow: "hidden"
  });

  // Reset text elements (initial position will be set after container is positioned)
  gsap.set(".text-element", {
    fontSize: "5rem",
    top: "50%",
    transform: "translateY(-50%)"
  });

  // Reset big title
  gsap.set(".big-title", { opacity: 0 });
  gsap.set(".title-line span", { y: "100%" });

  // Reset grid overlay
  gsap.set(".grid-overlay", {
    opacity: 0
  });

  gsap.set(".grid-column", {
    borderLeftColor: "rgba(255, 255, 255, 0)",
    borderRightColor: "rgba(255, 255, 255, 0)"
  });

  // Reset header and footer
  gsap.set(".header-left", { opacity: 0, transform: "translateY(-20px)" });
  gsap.set(".header-middle", { opacity: 0, transform: "translateY(-20px)" });
  gsap.set(".social-links", { opacity: 0, transform: "translateY(-20px)" });
  gsap.set(".footer", { transform: "translateY(100%)" });

  // Get all wrappers and images
  const wrappers = document.querySelectorAll(".image-wrapper");
  const images = document.querySelectorAll(".image-wrapper img");

  // Reset all wrappers to initial state
  gsap.set(wrappers, {
    visibility: "visible",
    clipPath: "inset(100% 0 0 0)",
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    xPercent: 0,
    yPercent: 0,
    clearProps: "transform,transformOrigin"
  });

  // Reset all images with initial zoom
  gsap.set(images, {
    scale: INITIAL_ZOOM,
    transformOrigin: "center center",
    clearProps: "width,height"
  });

  // Position text elements based on container position
  positionTextElements();
}

// Function to initialize the animation
function initAnimation() {
  // Kill any existing timeline
  if (mainTl) mainTl.kill();

  // Reset button
  gsap.set(".restart-btn", { opacity: 0, pointerEvents: "none" });

  // Reset body to center the container
  gsap.set("body", {
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  });

  // Reset everything to initial state
  resetToInitialState();

  // Get references to elements
  const wrappers = document.querySelectorAll(".image-wrapper");
  const finalWrapper = document.querySelector("#final-image");
  const finalImage = finalWrapper.querySelector("img");
  const textVE = document.querySelector("#text-ve");
  const textLA = document.querySelector("#text-la");
  const gridColumns = document.querySelectorAll(".grid-column");
  const headerLeft = document.querySelector(".header-left");
  const headerMiddle = document.querySelector(".header-middle");
  const socialLinks = document.querySelector(".social-links");
  const titleLines = document.querySelectorAll(".title-line span");

  // Create a new timeline
  mainTl = gsap.timeline();

  // PHASE 1: Fast image loading sequence
  // Add each image to the timeline with faster animations
  wrappers.forEach((wrapper, index) => {
    // Add a smaller delay between animations
    if (index > 0) {
      mainTl.add("image" + index, "<0.15");
    }

    // Animate the clip path faster with smoother ease
    mainTl.to(
      wrapper,
      {
        clipPath: "inset(0% 0 0 0)",
        duration: 0.65, // Keep fast for intro
        ease: "smoothBlur"
      },
      index > 0 ? "image" + index : 0
    );
  });

  // Add a slight pause before the zoom animation
  mainTl.add("pauseBeforeZoom", ">0.2");

  // PHASE 2: Slower zoom and text animation
  // After the last image is revealed, prepare for the final animation
  mainTl.add("finalAnimation", "pauseBeforeZoom");

  // Get grid positions for text alignment
  const gridPositions = getGridPositions();

  // Align header elements to grid
  alignHeaderToGrid(gridPositions);

  // Get the padding value (2rem converted to pixels)
  const padding = gridPositions.padding;

  // Store the initial position of LA for FLIP animation
  const laElement = document.querySelector("#text-la");
  const laInitialState = Flip.getState(laElement);

  // Animate the final image - SLOWER
  mainTl.add(() => {
    // Get the state before we change anything
    const state = Flip.getState(finalWrapper);

    // Remove overflow hidden to allow expansion
    gsap.set(".preloader-container", { overflow: "visible" });

    // Position the final wrapper to cover the viewport
    gsap.set(finalWrapper, {
      position: "fixed",
      top: "50%",
      left: "50%",
      xPercent: -50,
      yPercent: -50,
      width: "100dvw",
      height: "100dvh"
    });

    // Use FLIP to animate the container expansion - SLOWER
    Flip.from(state, {
      duration: 1.2, // Slower for emphasis
      ease: "customEase",
      absolute: true
    });

    // Simultaneously animate the image scale from 1.2 to 1.0 - SLOWER
    gsap.to(finalImage, {
      scale: 1.0,
      duration: 1.2, // Slower for emphasis
      ease: "customEase"
    });
  }, "finalAnimation");

  // Animate VE to the padding position - SLOWER
  mainTl.to(
    "#text-ve",
    {
      left: padding + "px",
      fontSize: "3rem",
      duration: 1.2, // Slower for emphasis
      ease: "directionalEase"
    },
    "finalAnimation"
  );

  // For LA, we'll use FLIP to ensure smooth animation - SLOWER
  mainTl.add(() => {
    // Set LA's final position - right aligned with padding
    gsap.set(laElement, {
      left: "auto",
      right: padding + "px",
      fontSize: "3rem"
    });

    // Use FLIP to animate from initial to final position - SLOWER
    Flip.from(laInitialState, {
      duration: 1.2, // Slower for emphasis
      ease: "directionalEase",
      absolute: true
    });
  }, "finalAnimation");

  // Add a slight pause after the zoom animation
  mainTl.add("pauseAfterZoom", ">0.3");

  // PHASE 3: Faster grid, header, footer, and title animations
  // Add grid animation after the zoom completes
  mainTl.add("gridReveal", "pauseAfterZoom");

  // Show the grid overlay
  mainTl.to(
    ".grid-overlay",
    {
      opacity: 1,
      duration: 0.4, // Keep fast
      ease: "gentleIn"
    },
    "gridReveal"
  );

  // Stagger animate the grid columns with faster stagger
  mainTl.to(
    ".grid-column",
    {
      borderLeftColor: "rgba(255, 255, 255, 0.2)",
      borderRightColor: "rgba(255, 255, 255, 0.2)",
      duration: 0.6, // Keep fast
      stagger: 0.08, // Keep fast stagger
      ease: "gentleIn"
    },
    "gridReveal"
  );

  // Add header and footer animation with staggered elements
  mainTl.add("headerFooter", ">-0.3"); // Slight overlap for smooth transition

  // Stagger animate header elements
  mainTl.to(
    headerLeft,
    {
      opacity: 1,
      transform: "translateY(0)",
      duration: 0.6, // Keep fast
      ease: "directionalEase"
    },
    "headerFooter"
  );

  mainTl.to(
    headerMiddle,
    {
      opacity: 1,
      transform: "translateY(0)",
      duration: 0.6, // Keep fast
      ease: "directionalEase",
      delay: 0.15 // Small delay for stagger effect
    },
    "headerFooter"
  );

  mainTl.to(
    socialLinks,
    {
      opacity: 1,
      transform: "translateY(0)",
      duration: 0.6, // Keep fast
      ease: "directionalEase",
      delay: 0.3 // Small delay for stagger effect
    },
    "headerFooter"
  );

  // Animate footer
  mainTl.to(
    ".footer",
    {
      transform: "translateY(0)",
      duration: 0.7, // Keep fast
      ease: "directionalEase"
    },
    "headerFooter+=0.4"
  );

  // Add big title animation
  mainTl.add("titleReveal", ">-0.2"); // Slight overlap for smooth transition

  // Make title visible
  mainTl.to(
    ".big-title",
    {
      opacity: 1,
      duration: 0.3 // Keep fast
    },
    "titleReveal"
  );

  // Animate each line of the title
  mainTl.to(
    titleLines,
    {
      y: "0%",
      duration: 0.9, // Keep fast
      stagger: 0.15, // Keep fast stagger
      ease: "customEase",
      onComplete: () => {
        // Show the restart button
        gsap.to(".restart-btn", {
          opacity: 1,
          duration: 0.4, // Keep fast
          pointerEvents: "auto"
        });
      }
    },
    "titleReveal+=0.1"
  );

  return mainTl;
}

// Initialize animation on page load
window.addEventListener("DOMContentLoaded", () => {
  // Delay initialization slightly to ensure all elements are properly rendered
  setTimeout(initAnimation, 100);
});

// Restart button functionality
document.querySelector(".restart-btn").addEventListener("click", () => {
  initAnimation();
});

// Handle window resize
window.addEventListener("resize", () => {
  if (!mainTl || mainTl.progress() === 0) {
    positionTextElements();

    // Re-align header to grid on resize
    const gridPositions = getGridPositions();
    alignHeaderToGrid(gridPositions);
  }
});