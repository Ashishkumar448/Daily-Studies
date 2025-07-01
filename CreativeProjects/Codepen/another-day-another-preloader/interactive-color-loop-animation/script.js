// Select the root element (html)
let rootElement = document.documentElement;

// Create a GSAP timeline
let timeline = gsap.timeline({
  repeat: -1,
  defaults: { duration: 1, ease: "none" }
});

// Helper function to get the value of a CSS variable
const getColorVariable = (variable) =>
  getComputedStyle(rootElement).getPropertyValue(variable).trim();

// GSAP timeline to animate the --highlight variable through other color variables
timeline.to(rootElement, { "--highlight": getColorVariable("--color-2") });
timeline.to(rootElement, { "--highlight": getColorVariable("--color-3") });
timeline.to(rootElement, { "--highlight": getColorVariable("--color-4") });
timeline.to(rootElement, { "--highlight": getColorVariable("--color-5") });
timeline.to(rootElement, { "--highlight": getColorVariable("--color-6") });
timeline.to(rootElement, { "--highlight": getColorVariable("--color-7") });
timeline.to(rootElement, { "--highlight": getColorVariable("--color-8") });
timeline.to(rootElement, { "--highlight": getColorVariable("--color-9") });
timeline.to(rootElement, { "--highlight": getColorVariable("--color-10") });
timeline.to(rootElement, { "--highlight": getColorVariable("--color-1") });