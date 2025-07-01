const tl = gsap.timeline();
const terminalElement = document.querySelector(".terminal");

// Initial states
gsap.set(".content", { visibility: "hidden", opacity: 0 });
gsap.set(".content h1, .content p", { y: 30, opacity: 0 });
gsap.set(".command-line", { opacity: 0, y: 20 });

// Remove initial opacity setting for cursors
// gsap.set(".cursor", { opacity: 0 }); // This line is no longer needed

// Function to pad number with zeros
const padNumber = (num) => num.toString().padStart(2, "0");

// Function to update cursor visibility
const updateCursor = (activeCommandId) => {
  document.querySelectorAll(".cursor").forEach((cursor) => {
    cursor.classList.remove("active-cursor");
  });
  const activeCursor = document.querySelector(`#${activeCommandId} .cursor`);
  if (activeCursor) {
    activeCursor.classList.add("active-cursor");
  }
};

tl.to("#cmd1", {
  opacity: 1,
  y: 0,
  duration: 0.5,
  ease: "power2.out",
  onComplete: () => updateCursor("cmd1")
})
  .to(".loading-progress", {
    width: "100%",
    duration: 5,
    ease: "none",
    onUpdate: function () {
      const progress = Math.round(this.progress() * 100);
      document.querySelector(".percentage").textContent = `${padNumber(
        progress
      )}%`;

      // Update cursor based on progress
      if (progress < 20) {
        updateCursor("cmd1");
      } else if (progress < 50) {
        updateCursor("cmd2");
      } else if (progress < 80) {
        updateCursor("cmd3");
      } else {
        updateCursor("cmd4");
      }

      // Show lines at specific progress points
      if (progress >= 20 && progress < 21) {
        gsap.to("#cmd2", { opacity: 1, y: 0, duration: 0.5 });
      }
      if (progress >= 50 && progress < 51) {
        gsap.to("#cmd3", { opacity: 1, y: 0, duration: 0.5 });
      }
      if (progress >= 80 && progress < 81) {
        gsap.to("#cmd4", { opacity: 1, y: 0, duration: 0.5 });
      }
    }
  })
  .to(terminalElement, {
    duration: 0.5,
    opacity: 0,
    scale: 0.95,
    ease: "power2.inOut"
  })
  .set(".preloader", {
    display: "none"
  })
  .set(".content", {
    visibility: "visible"
  })
  .to(".content", {
    opacity: 1,
    duration: 0.5
  })
  .to(
    ".content h1",
    {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power2.out"
    },
    "-=0.3"
  )
  .to(
    ".content p",
    {
      opacity: 0.8,
      y: 0,
      duration: 0.8,
      ease: "power2.out"
    },
    "-=0.6"
  );

// Add subtle flicker to terminal
gsap.to(".terminal-content", {
  duration: 0.1,
  opacity: 0.95,
  repeat: -1,
  yoyo: true,
  ease: "none"
});