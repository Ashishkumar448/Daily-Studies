// Initialize splits
const loadingText = new SplitType(".loading-text.initial", { types: "chars" });
const completeText = new SplitType(".loading-text.complete", {
  types: "chars"
});
const titleText = new SplitType(".content h1", { types: "chars" });
const paragraphText = new SplitType(".content p", { types: "chars" });

// Initial states
gsap.set(".loading-text.complete", { y: "100%" });
gsap.set(loadingText.chars, { opacity: 0, y: 100 });
gsap.set(completeText.chars, { opacity: 0, y: 100 });

// Calculate final position
const getXPosition = () => {
  const wrap = document.querySelector(".percentage-wrap");
  const percentage = document.querySelector(".percentage");
  return wrap.offsetWidth - percentage.offsetWidth;
};

const colorStages = [
  { bg: "rgb(60, 66, 55)", text: "rgb(230, 225, 215)" },
  { bg: "rgb(200, 180, 160)", text: "rgb(60, 66, 55)" },
  { bg: "rgb(230, 225, 215)", text: "rgb(60, 66, 55)" },
  { bg: "rgb(100, 110, 90)", text: "rgb(230, 225, 215)" }
];

function updateColors(progress) {
  const stage = Math.floor(progress / 25);
  if (stage < colorStages.length) {
    document.querySelector(".progress-bar").style.backgroundColor =
      colorStages[stage].text;
    document.querySelector(".preloader").style.backgroundColor =
      colorStages[stage].bg;
  }
}

// Animate in loading text
gsap.to(loadingText.chars, {
  opacity: 1,
  y: 0,
  duration: 0.5,
  stagger: 0.05,
  ease: "power2.out"
});

const tl = gsap.timeline();

tl.to(".progress-bar", {
  width: "100%",
  duration: 5,
  ease: "power1.inOut",
  onUpdate: function () {
    const progress = Math.round(this.progress() * 100);
    document.querySelector(".percentage").textContent = progress;
    updateColors(progress);
  },
  onStart: () => {
    gsap.set(".percentage", { x: 0 });
  }
})
  .to(
    ".percentage",
    {
      x: getXPosition,
      duration: 5,
      ease: "power1.inOut"
    },
    "<0.1"
  )
  .to(
    ".loading-text.initial",
    {
      y: "-100%",
      duration: 0.5,
      ease: "power2.inOut"
    },
    "-=0.8"
  )
  .to(
    ".loading-text.complete",
    {
      y: "0%",
      duration: 0.5,
      ease: "power2.inOut"
    },
    "<"
  )
  .to(
    completeText.chars,
    {
      opacity: 1,
      y: 0,
      duration: 0.3,
      stagger: 0.03,
      ease: "power2.out"
    },
    "<0.2"
  )
  .to([".percentage", ".text-container"], {
    y: -50,
    opacity: 0,
    duration: 0.8,
    stagger: 0.1,
    ease: "power2.inOut"
  })
  .to(
    ".preloader",
    {
      y: "-100vh",
      duration: 1,
      ease: "power2.inOut"
    },
    "<0.3"
  )
  .set(
    ".content",
    {
      visibility: "visible"
    },
    "-=1"
  )
  .to(
    [titleText.chars, paragraphText.chars],
    {
      opacity: 1,
      y: 0,
      duration: 1,
      stagger: 0.02,
      ease: "power4.out"
    },
    "-=0.5"
  )
  .set(".preloader", {
    display: "none"
  });

// Update positions on window resize
window.addEventListener("resize", () => {
  const progress = gsap.getProperty(".progress-bar", "width", "%") / 100;
  const newX = getXPosition() * progress;
  gsap.set(".percentage", { x: newX });
});