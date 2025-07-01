// Initialize SplitType for lines
const text = new SplitType("h1", { types: "lines" });

// Create wrappers for each line
text.lines.forEach((line) => {
  const wrapper = document.createElement("div");
  wrapper.className = "line-wrapper";
  line.parentNode.insertBefore(wrapper, line);
  wrapper.appendChild(line);
});

// Register custom ease
CustomEase.create("textReveal", "0.25, 1, 0.5, 1");

// Create the slide up animation with blur effect
function animateSlideUp() {
  // Create timeline with repeat
  const tl = gsap.timeline({
    repeat: -1,
    repeatDelay: 0.7
  });

  // Add slide up animation with blur effect
  tl.from(".line", {
    duration: 0.9,
    yPercent: 100,
    opacity: 0.2,
    filter: "blur(8px)", // Add blur effect
    stagger: 0.08,
    ease: "textReveal",
    yoyo: true,
    repeat: 1,
    repeatDelay: 0.7
  });

  return tl;
}

// Start the animation
animateSlideUp();