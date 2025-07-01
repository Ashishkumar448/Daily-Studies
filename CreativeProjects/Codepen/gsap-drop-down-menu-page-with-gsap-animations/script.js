// Custom easing functions
CustomEase.create("easeOutFast", "M0,0 C0.25,0.1 0.25,1 1,1"); // Opening ease
CustomEase.create("easeInFast", "M0,0 C0.5,0 0.75,0.2 1,1"); // Closing ease

const menuBtn = document.getElementById("menu-btn");
const dropdown = document.getElementById("dropdown");
const dropdownContent = document.querySelector(".dropdown__content");
const dropdownImage = document.querySelector(".dropdown__image"); // Added reference to the image
const allContent = document.getElementById("all-content");
const navigation = document.getElementById("navigation");
const navLogo = document.querySelector(".navigation__logo");
const navRight = document.querySelector(".navigation__right");
const menuButtons = document.querySelectorAll(".dropdown__button");
let isOpen = false;

menuBtn.addEventListener("click", () => {
  if (!isOpen) {
    openMenu();
  } else {
    closeMenu();
  }
  isOpen = !isOpen;
});

function openMenu() {
  // Show the dropdown but keep content invisible initially
  dropdown.classList.add("open");

  // Add menu-open class to all-content for border radius
  allContent.classList.add("menu-open");

  // Reset the visibility and position of menu buttons
  gsap.set(menuButtons, {
    opacity: 0,
    y: 20,
    filter: "blur(10px)" // Start with heavy blur
  });

  // Reset the image opacity and position
  gsap.set(dropdownImage, {
    opacity: 0,
    y: 20 // Start slightly below final position
  });

  // Create timeline for animations
  const openTimeline = gsap.timeline();

  openTimeline
    // Add padding to body to reveal background
    .to(document.body, {
      paddingTop: "20px",
      paddingLeft: "20px",
      paddingRight: "20px",
      duration: 0.2, // Faster
      ease: "easeOutFast"
    })

    // Push all navigation elements equally
    .to(
      [navLogo, navRight],
      {
        x: function (i) {
          return i === 0 ? 20 : -20; // Push logo right, contact left
        },
        duration: 0.2, // Faster
        ease: "easeOutFast",
        force3D: true // Force 3D transforms for better performance
      },
      "<"
    ) // Start at the same time as the content animation

    // Also push the dropdown down to match the content padding
    .to(
      dropdown,
      {
        marginTop: "20px",
        duration: 0.2, // Faster
        ease: "easeOutFast"
      },
      "<"
    )

    // Animate the dropdown expanding from the top
    .fromTo(
      dropdown,
      {
        opacity: 0,
        scaleY: 0,
        maxHeight: 0
      },
      {
        opacity: 1,
        scaleY: 1,
        maxHeight: "50vh", // Changed to 50vh as requested
        duration: 0.25, // Faster
        ease: "easeOutFast",
        force3D: true // Force 3D transforms for better performance
      },
      "-=0.15" // Adjusted timing
    )

    // Change the + to x for close button
    .to(
      menuBtn,
      {
        rotation: 45,
        duration: 0.2, // Faster
        ease: "easeOutFast",
        force3D: true
      },
      "<"
    )

    // Staggered animation for menu buttons with blur effect (top to bottom)
    .to(
      menuButtons,
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)", // Animate to no blur
        stagger: 0.03, // Faster stagger
        duration: 0.2, // Faster
        ease: "easeOutFast",
        force3D: true
      },
      "-=0.1"
    )

    // Fade in the image after the menu buttons
    .to(
      dropdownImage,
      {
        opacity: 1,
        y: 0,
        duration: 0.2, // Faster
        ease: "easeOutFast",
        force3D: true
      },
      "-=0.1"
    );
}

function closeMenu() {
  // Create an array of menu buttons in reverse order for bottom-to-top animation
  const reversedButtons = Array.from(menuButtons).reverse();

  // Create timeline for animations
  const closeTimeline = gsap.timeline({
    onComplete: () => {
      // Hide the dropdown when animations complete
      dropdown.classList.remove("open");

      // Remove menu-open class from all-content
      allContent.classList.remove("menu-open");
    }
  });

  closeTimeline
    // 1. First fade out the image completely
    .to(dropdownImage, {
      opacity: 0,
      y: 10, // Slight movement down as it fades
      duration: 0.15, // Quick fade out
      ease: "easeInFast",
      force3D: true
    })

    // 2. After a small delay, animate out the menu buttons with staggered effect
    .to(
      reversedButtons,
      {
        opacity: 0,
        y: 20,
        filter: "blur(10px)", // Animate back to blur
        stagger: 0.02, // Faster stagger
        duration: 0.15, // Quick fade out
        ease: "easeInFast",
        force3D: true
      },
      "+=0.05"
    ) // Small delay after image fades out

    // 3. Change the x back to + for menu button alongside the button animations
    .to(
      menuBtn,
      {
        rotation: 0,
        duration: 0.2,
        ease: "easeInFast",
        force3D: true
      },
      "<"
    )

    // 4. After a small delay, start collapsing the dropdown (slower than the content)
    .to(
      dropdown,
      {
        opacity: 0,
        scaleY: 0,
        maxHeight: 0,
        duration: 0.3, // Slower collapse for the background
        ease: "easeInFast",
        force3D: true
      },
      "+=0.05"
    ) // Small delay after buttons fade out

    // 5. Reset dropdown margin alongside the dropdown collapse
    .to(
      dropdown,
      {
        marginTop: "0",
        duration: 0.3, // Match the dropdown collapse duration
        ease: "easeInFast"
      },
      "<"
    )

    // 6. Remove padding from body after dropdown starts collapsing
    .to(
      document.body,
      {
        paddingTop: "0",
        paddingLeft: "0",
        paddingRight: "0",
        duration: 0.25,
        ease: "easeInFast"
      },
      "-=0.2" // Start slightly before dropdown finishes collapsing
    )

    // 7. Reset navigation elements position alongside body padding
    .to(
      [navLogo, navRight],
      {
        x: 0,
        duration: 0.25,
        ease: "easeInFast",
        force3D: true
      },
      "<"
    );
}