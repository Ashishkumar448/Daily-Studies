// Custom easing functions already added
CustomEase.create("easeOutFast", "M0,0 C0.25,0.1 0.25,1 1,1"); // Opening ease
CustomEase.create("easeInFast", "M0,0 C0.5,0 0.75,0.2 1,1"); // Closing ease

const menuBtn = document.getElementById("menu-btn");
const dropdown = document.getElementById("dropdown");
const content = document.getElementById("content");
const navigation = document.getElementById("navigation");
let isOpen = false;

menuBtn.addEventListener("click", () => {
  if (!isOpen) {
    // Opening the menu: Immediate and synchronized animations
    const openTimeline = gsap.timeline();

    // Reset the visibility and position of the h1, p, and links before animating
    gsap.set(
      ".dropdown__section--one h1, .dropdown__section--one p, .dropdown__button",
      {
        opacity: 1,
        y: 0
      }
    );

    openTimeline
      .to([dropdown, navigation, content], {
        y: "50vh",
        duration: 0.4,
        ease: "easeOutFast"
      })

      .from(
        ".dropdown__section--one h1",
        {
          opacity: 0,
          y: 20,
          duration: 0.4,
          ease: "easeOutFast",
          delay: 0.2 // Start soon after dropdown starts
        },
        "-=0.3"
      ) // Start 0.3 seconds BEFORE the dropdown finishes

      .from(
        ".dropdown__section--one p",
        {
          opacity: 0,
          y: 20,
          duration: 0.4,
          delay: 0.1, // Start immediately after h1
          ease: "easeOutFast"
        },
        "-=0.2"
      ) // Start 0.2 seconds before dropdown finishes

      // Stagger buttons slightly
      .from(
        ".dropdown__button",
        {
          opacity: 0,
          y: 20,
          duration: 0.3,
          stagger: 0.1, // Stagger the buttons slightly
          ease: "easeOutFast"
        },
        "-=0.2"
      )

      .to(
        ".divider",
        { width: "100%", duration: 0.2, ease: "easeOutFast" },
        "-=0.4"
      ); // Sync with other elements

    dropdown.classList.add("open"); // Add "open" class for CSS
    menuBtn.textContent = "CLOSE";
  } else {
    // Closing the menu (reverse animations smoothly)
    const closeTimeline = gsap.timeline();

    closeTimeline
      // Reverse animations
      .to(".dropdown__button", {
        opacity: 0,
        y: 20,
        duration: 0.3,
        stagger: 0.05,
        ease: "easeInFast"
      })
      .to(
        ".dropdown__section--one p",
        { opacity: 0, y: 20, duration: 0.3, ease: "easeInFast" },
        "-=0.1"
      )
      .to(
        ".dropdown__section--one h1",
        { opacity: 0, y: 20, duration: 0.3, ease: "easeInFast" },
        "-=0.1"
      )
      .to(".divider", { width: "0%", duration: 0.4, ease: "easeInFast" })

      // Slide dropdown, navigation, and content back up smoothly
      .add(() => {
        gsap.to([dropdown, navigation, content], {
          y: "0",
          duration: 0.4,
          ease: "easeInFast"
        });
      })

      // Update menu button text after animations finish
      .add(() => {
        dropdown.classList.remove("open");
        menuBtn.textContent = "MENU";
      });
  }

  isOpen = !isOpen;
});