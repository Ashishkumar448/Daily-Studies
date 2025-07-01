// TODO: Fix the behavior of the nav bar background fill when scrolling up.
// When scrolling up, the bar should NOT be filled.
// It should start filling from right (0%) to left (100%) as you scroll up.
// The logic should perfectly mirror the behavior when scrolling down.

gsap.registerPlugin(ScrollTrigger);

// Configuration for trail effect
const settings = {
  trailEffect: true // Enable the trailing effect
};

// Select all sections and corresponding nav links
const sections = document.querySelectorAll(".section[data-section]");
const navLinks = document.querySelectorAll(".nav-menu__link");
let lastActiveIndex = -1;
let scrollingDown = true; // Track scroll direction
let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop; // Initialize lastScrollTop

// Function to set the active navigation link (optimized)
function setActiveLink(activeIndex) {
  console.log(`Setting active link for section ${activeIndex + 1}`);
  if (lastActiveIndex !== activeIndex) {
    navLinks.forEach((link, idx) => {
      if (idx === activeIndex) {
        link.classList.add("nav-menu__link--current");
        link.setAttribute("aria-current", "page");
        console.log(`Active section ${activeIndex + 1}`);
      } else {
        link.classList.remove("nav-menu__link--current");
        link.removeAttribute("aria-current");
      }
    });
    lastActiveIndex = activeIndex; // Update only when active section changes
  }
}

// Function to deactivate all navigation links
function deactivateLinks() {
  console.log("Deactivating all links");
  navLinks.forEach((link) => {
    link.classList.remove("nav-menu__link--current");
    link.removeAttribute("aria-current");
    console.log(`Deactivated link: ${link.textContent.trim()}`);
  });
  lastActiveIndex = -1; // Reset the active index
}

// Deactivate navigation links when you enter the footer
function deactivateLastSectionOnScrollOut() {
  ScrollTrigger.create({
    trigger: document.querySelector(".footer"), // Use the footer or an element after the last section
    start: "top top", // As soon as you hit the footer (or the area after the last section)
    onEnter: () => {
      console.log("Entering footer, deactivating all links");
      deactivateLinks(); // Deactivate all links when entering footer
    },
    markers: false
  });
}

// Function to throttle progress updates and avoid frequent logs
let lastLoggedProgress = {}; // To store the last logged progress for each section

function shouldLogProgress(index, progress) {
  const roundedProgress = Math.round(progress); // Round to the nearest integer
  if (lastLoggedProgress[index] !== roundedProgress) {
    lastLoggedProgress[index] = roundedProgress; // Update the last logged progress
    return true;
  }
  return false;
}

// Create ScrollTriggers for active link highlighting
sections.forEach((section, index) => {
  ScrollTrigger.create({
    trigger: section,
    start: "top+=50% center", // Increased buffer to reduce overlapping
    end: "bottom-=50% center",
    onEnter: () => {
      console.log(`Entering section ${index + 1}`);
      setActiveLink(index);
    },
    onEnterBack: () => {
      console.log(`Entering back into section ${index + 1}`);
      setActiveLink(index);
    },
    onLeave: () => {
      console.log(`Leaving section ${index + 1}`);
    },
    onLeaveBack: () => {
      console.log(`Leaving back section ${index + 1}`);
    },
    markers: false
  });
});

// Create ScrollTriggers for background fill effect with optional trail effect
sections.forEach((section, index) => {
  const navLink = navLinks[index];
  const bg = navLink.querySelector(".nav-menu__bg");
  const prevNavLink = index > 0 ? navLinks[index - 1] : null;
  const prevBg = prevNavLink
    ? prevNavLink.querySelector(".nav-menu__bg")
    : null;

  const isLastSection = index === sections.length - 1;
  const sectionHeight = section.offsetHeight;
  const windowHeight = window.innerHeight;

  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: () =>
      isLastSection ? `+=${sectionHeight - windowHeight}` : "bottom top",
    scrub: true, // Keep scrub to ensure smooth syncing with scroll
    onUpdate: (self) => {
      const progress = Math.max(0, Math.min(1, self.progress)) * 100; // Convert to percentage

      // Only log and update when progress changes by at least 1%
      if (shouldLogProgress(index, progress)) {
        console.log(
          `Updating section ${
            index + 1
          } background: progress = ${progress.toFixed(0)}%`
        );
        gsap.set(bg, {
          clipPath: `inset(0 ${100 - progress}% 0 0)` // Directly setting clipPath for smooth scrolling sync
        });
      }

      // Apply trail effect for all sections, including the last one
      if (settings.trailEffect && prevBg) {
        // Previous section background trailing (immediate animation from 100% to 0%)
        gsap.to(prevBg, {
          clipPath: `inset(0 0 0 100%)`,
          duration: 0.4, // Keep duration smooth for trailing out
          ease: "none" // Make the ease linear to match scroll progression
        });
        console.log(`Trailing effect for section ${index}`);
      }

      // Handle the last section trail effect like other sections
      if (isLastSection && !scrollingDown && progress === 0) {
        gsap.set(bg, {
          clipPath: `inset(0 100% 0 0)` // Make last section follow the same trailing behavior
        });
        console.log(`Trailing effect for last section ${index + 1}`);
      }
    },
    onLeave: () => {
      console.log(`Leaving section ${index + 1} (scrolling down)`);
      if (isLastSection && scrollingDown) {
        deactivateLinks();
      }
    },
    onLeaveBack: () => {
      console.log(`Leaving section ${index + 1} (scrolling up)`);
      if (isLastSection) {
        deactivateLinks();
      }
    },
    markers: false
  });
});

// Detect scroll direction to adjust the trail effect
window.addEventListener("scroll", () => {
  let st = window.pageYOffset || document.documentElement.scrollTop;
  const newScrollDirection = st > lastScrollTop;

  if (newScrollDirection !== scrollingDown) {
    scrollingDown = newScrollDirection;
    console.log(`Scroll direction: ${scrollingDown ? "down" : "up"}`);
  }

  lastScrollTop = st <= 0 ? 0 : st; // Prevent negative scroll
});

// Ensure the footer deactivates all links
deactivateLastSectionOnScrollOut();

// Refresh ScrollTrigger on window resize
window.addEventListener("resize", () => {
  console.log("Window resized, refreshing ScrollTrigger");
  ScrollTrigger.refresh();
});