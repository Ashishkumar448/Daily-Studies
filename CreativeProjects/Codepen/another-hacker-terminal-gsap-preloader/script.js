// Create matrix grid
const grid = document.querySelector(".matrix-grid");
for (let i = 0; i < 512; i++) {
  const cell = document.createElement("div");
  cell.className = "matrix-cell";
  cell.textContent = Math.floor(Math.random() * 2);
  grid.appendChild(cell);
}

function updateMatrix() {
  document.querySelectorAll(".matrix-cell").forEach((cell) => {
    if (Math.random() < 0.1) {
      cell.textContent = Math.floor(Math.random() * 2);
    }
  });
}

setInterval(updateMatrix, 100);

const tl = gsap.timeline();

// Initial setup
gsap.set(".scanning-text", { opacity: 0 });
gsap.set(".data-line", { opacity: 0, x: -20 });

// Main animation sequence
tl.to(".scanning-text", {
  opacity: 1,
  duration: 1,
  ease: "power2.out"
})
  .to(
    ".data-line",
    {
      opacity: 1,
      x: 0,
      stagger: 0.5,
      duration: 0.5,
      ease: "power2.out"
    },
    "-=0.5"
  )
  .to(
    ".scan-line",
    {
      top: "100%",
      duration: 5,
      ease: "none",
      onUpdate: function () {
        const progress = Math.round(this.progress() * 100);
        document.querySelector(
          ".percentage-display"
        ).textContent = `${progress}%`;
      }
    },
    0
  );

// Completion animation
tl.to(".scanner", {
  opacity: 0,
  scale: 0.9,
  duration: 0.5,
  ease: "power2.in"
})
  .set(".preloader", { display: "none" })
  .set(".content", { visibility: "visible" })
  .to(".content", {
    opacity: 1,
    duration: 0.5,
    ease: "power2.out"
  });

// Random glitch effect for scanning text
const glitchText = () => {
  if (Math.random() < 0.1) {
    document.querySelector(".scanning-text").style.opacity = Math.random();
    setTimeout(() => {
      document.querySelector(".scanning-text").style.opacity = 1;
    }, 50);
  }
};

setInterval(glitchText, 100);