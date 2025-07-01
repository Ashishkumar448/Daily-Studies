// Select Elements
const menuButton = document.querySelector(".menu-button");
const menuOverlay = document.querySelector(".menu-overlay");
const overlayLinks = document.querySelectorAll(".overlay-content li a");
const container = document.querySelector(".container");
const body = document.body;

// Initialize GSAP
gsap.registerPlugin(ScrollTrigger, CustomEase);

// Custom easing functions
CustomEase.create("easeOutFast", "M0,0 C0.25,0.1 0.25,1 1,1");
CustomEase.create("easeInFast", "M0,0 C0.5,0 0.75,0.2 1,1");

// Function to toggle the menu state
function toggleMenu() {
  const isMenuOpen = menuButton.classList.contains("is-active");

  if (isMenuOpen) {
    closeMenu();
  } else {
    openMenu();
  }
}

// Function to open the overlay menu
function openMenu() {
  // Add active class to menu button for X animation
  menuButton.classList.add("is-active");

  // Add menu-open class to body
  body.classList.add("menu-open");

  // Create a GSAP timeline for content push
  const tlOpen = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "easeOutFast"
    }
  });

  // Push the content to the right
  tlOpen.to(
    container,
    {
      x: "100px",
      duration: 0.8,
      ease: "easeOutFast"
    },
    0
  );
}

// Function to close the overlay menu
function closeMenu() {
  // Create a GSAP timeline for closing animation
  const tlClose = gsap.timeline({
    defaults: {
      duration: 0.6,
      ease: "easeInFast"
    },
    onComplete: () => {
      // Remove active class from menu button
      menuButton.classList.remove("is-active");
    }
  });

  // Return the content to original position
  tlClose.to(
    container,
    {
      x: "0px",
      duration: 0.6,
      ease: "easeInFast"
    },
    0.3
  );

  // Set delay for link animation completion before removing menu-open class
  setTimeout(() => {
    body.classList.remove("menu-open");
  }, 300);
}

// Event listeners to toggle the menu
menuButton.addEventListener("click", toggleMenu);

// Add "Esc" key listener to close the overlay menu
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuButton.classList.contains("is-active")) {
    closeMenu();
  }
});

// Page load animation
window.addEventListener("DOMContentLoaded", () => {
  gsap.fromTo(
    ".fixed-menu",
    { x: -120, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.6, ease: "power2.out", delay: 0.1 }
  );
});