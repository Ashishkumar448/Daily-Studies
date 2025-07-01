import { Pane } from "https://cdn.skypack.dev/tweakpane@4.0.4";

// Configuration object for the spiral
const config = {
  points: 600,
  dotRadius: 2,
  duration: 3,
  colorPreset: "white",
  gradientPreset: "none",
  backgroundColor: "#000000",
  pulseEffect: true,
  opacityMin: 0.3,
  opacityMax: 1.0,
  sizeMin: 0.5,
  sizeMax: 1.5
};

// Color presets
const colorPresets = {
  white: "#ffffff",
  gold: "#ffd700",
  cyan: "#00ffff",
  magenta: "#ff00ff",
  green: "#00ff00",
  orange: "#ff8800",
  red: "#ff0000",
  blue: "#0066ff",
  purple: "#9900ff",
  yellow: "#ffff00"
};

// Gradient presets
const gradientPresets = {
  none: null,
  rainbow: ["#ff0000", "#ff9900", "#ffff00", "#00ff00", "#0099ff", "#6633ff"],
  sunset: ["#ff0000", "#ff9900", "#ffcc00"],
  ocean: ["#0066ff", "#00ccff", "#00ffcc"],
  fire: ["#ff0000", "#ff6600", "#ffcc00"],
  neon: ["#ff00ff", "#00ffff", "#ffff00"],
  pastel: ["#ffcccc", "#ccffcc", "#ccccff"],
  grayscale: ["#ffffff", "#999999", "#333333"]
};

// Light color presets (for dark backgrounds)
const lightColorPresets = [
  "white",
  "gold",
  "cyan",
  "magenta",
  "green",
  "yellow"
];

// Dark color presets (for light backgrounds)
const darkColorPresets = ["blue", "purple", "red"];

// Light gradient presets (for dark backgrounds)
const lightGradientPresets = ["rainbow", "sunset", "ocean", "fire", "neon"];

// Dark gradient presets (for light backgrounds)
const darkGradientPresets = ["ocean", "grayscale"];

// Create Tweakpane instance
const pane = new Pane({
  container: document.getElementById("tweakpane-container")
});

// Add controls
pane
  .addBinding(config, "points", { min: 100, max: 2000, step: 50 })
  .on("change", regenerateSpiral);
pane
  .addBinding(config, "dotRadius", { min: 0.5, max: 5, step: 0.1 })
  .on("change", regenerateSpiral);
pane
  .addBinding(config, "duration", { min: 1, max: 10, step: 0.5 })
  .on("change", regenerateSpiral);

// Color controls
pane
  .addBinding(config, "colorPreset", {
    options: Object.keys(colorPresets).reduce((acc, key) => {
      acc[key] = key;
      return acc;
    }, {})
  })
  .on("change", regenerateSpiral);

pane
  .addBinding(config, "gradientPreset", {
    options: Object.keys(gradientPresets).reduce((acc, key) => {
      acc[key] = key;
      return acc;
    }, {})
  })
  .on("change", regenerateSpiral);

pane.addBinding(config, "backgroundColor").on("change", (ev) => {
  document.body.style.backgroundColor = ev.value;
});

// Animation controls
const animFolder = pane.addFolder({ title: "Animation" });
animFolder.addBinding(config, "pulseEffect").on("change", regenerateSpiral);
animFolder
  .addBinding(config, "opacityMin", { min: 0, max: 1, step: 0.05 })
  .on("change", regenerateSpiral);
animFolder
  .addBinding(config, "opacityMax", { min: 0, max: 1, step: 0.05 })
  .on("change", regenerateSpiral);
animFolder
  .addBinding(config, "sizeMin", { min: 0.1, max: 2, step: 0.1 })
  .on("change", regenerateSpiral);
animFolder
  .addBinding(config, "sizeMax", { min: 0.1, max: 3, step: 0.1 })
  .on("change", regenerateSpiral);

// Initialize with current background color
document.body.style.backgroundColor = config.backgroundColor;

// Toggle panel visibility with 'h' key
let panelVisible = false; // Changed from true to false
const tweakpaneContainer = document.getElementById("tweakpane-container");

// Initialize panel as hidden
tweakpaneContainer.style.opacity = "0";
tweakpaneContainer.style.pointerEvents = "none";

document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "h") {
    panelVisible = !panelVisible;
    tweakpaneContainer.style.opacity = panelVisible ? "1" : "0";
    tweakpaneContainer.style.pointerEvents = panelVisible ? "auto" : "none";
  } else if (event.key.toLowerCase() === "r") {
    randomizeSettings();
  }
});

// Helper function to determine if a color is light or dark
function isLightColor(hexColor) {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Calculate perceived brightness (using YIQ formula)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // Return true if the color is light
  return brightness > 128;
}

// Function to generate a random dark or light gray
function randomGrayColor(isLight) {
  if (isLight) {
    // Light gray (from #AAAAAA to #EEEEEE)
    const value = Math.floor(Math.random() * (238 - 170) + 170).toString(16);
    return `#${value}${value}${value}`;
  } else {
    // Dark gray (from #111111 to #555555)
    const value = Math.floor(Math.random() * (85 - 17) + 17).toString(16);
    return `#${value}${value}${value}`;
  }
}

// Function to randomize settings with contrast awareness
function randomizeSettings() {
  // Helper function to get random item from array
  const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Helper function to get random number in range
  const randomRange = (min, max) => Math.random() * (max - min) + min;

  // Randomize basic settings
  config.points = Math.floor(randomRange(100, 2000));
  config.dotRadius = randomRange(0.5, 5);
  config.duration = randomRange(1, 10);
  config.pulseEffect = Math.random() > 0.3; // 70% chance of being true
  config.opacityMin = randomRange(0, 0.5);
  config.opacityMax = randomRange(0.5, 1);
  config.sizeMin = randomRange(0.1, 1);
  config.sizeMax = randomRange(1, 3);

  // Randomly decide if we want light or dark background
  const useLightBackground = Math.random() > 0.5;

  // Generate appropriate background color (light or dark gray)
  config.backgroundColor = randomGrayColor(useLightBackground);

  // Choose color preset with good contrast to background
  if (useLightBackground) {
    // For light backgrounds, use dark colors
    config.colorPreset = randomItem(darkColorPresets);
    config.gradientPreset =
      Math.random() > 0.5 ? randomItem(darkGradientPresets) : "none";
  } else {
    // For dark backgrounds, use light colors
    config.colorPreset = randomItem(lightColorPresets);
    config.gradientPreset =
      Math.random() > 0.5 ? randomItem(lightGradientPresets) : "none";
  }

  // Update background
  document.body.style.backgroundColor = config.backgroundColor;

  // Update UI text colors based on background
  updateUIColors(useLightBackground);

  // Update pane to reflect new values
  pane.refresh();

  // Regenerate spiral
  regenerateSpiral();
}

// Update UI colors based on background brightness
function updateUIColors(isLightBackground) {
  const layoutContainer = document.querySelector(".layout-container");
  const textElements = document.querySelectorAll(
    ".layout-title, .layout-progress, .service-item h3, .service-item p, .shortcut-info"
  );
  const borderElements = document.querySelectorAll(
    ".layout-container, .layout-header, .layout-progress, .service-item"
  );

  if (isLightBackground) {
    // For light backgrounds, use dark text
    textElements.forEach((el) => (el.style.color = "#111111"));
    borderElements.forEach((el) => (el.style.borderColor = "#333333"));
  } else {
    // For dark backgrounds, use light text
    textElements.forEach((el) => (el.style.color = "#f0f0f0"));
    borderElements.forEach((el) => (el.style.borderColor = "#ffffff"));
  }
}

// Function to generate the spiral
function generateSpiral() {
  const N = config.points;
  const SIZE = 400;
  const DOT_RADIUS = config.dotRadius;
  const MARGIN = 2;
  const DURATION = config.duration;
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
  const CENTER = SIZE / 2;
  const MAX_RADIUS = CENTER - MARGIN - DOT_RADIUS;
  const svgNS = "http://www.w3.org/2000/svg";

  // Create SVG root
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", SIZE);
  svg.setAttribute("height", SIZE);
  svg.setAttribute("viewBox", `0 0 ${SIZE} ${SIZE}`);

  // Add gradient definitions if needed
  if (config.gradientPreset !== "none") {
    const defs = document.createElementNS(svgNS, "defs");
    const gradient = document.createElementNS(svgNS, "linearGradient");
    gradient.setAttribute("id", "spiralGradient");
    gradient.setAttribute("gradientUnits", "userSpaceOnUse");
    gradient.setAttribute("x1", "0%");
    gradient.setAttribute("y1", "0%");
    gradient.setAttribute("x2", "100%");
    gradient.setAttribute("y2", "100%");

    const colors = gradientPresets[config.gradientPreset];
    colors.forEach((color, index) => {
      const stop = document.createElementNS(svgNS, "stop");
      stop.setAttribute("offset", `${index * (100 / (colors.length - 1))}%`);
      stop.setAttribute("stop-color", color);
      gradient.appendChild(stop);
    });

    defs.appendChild(gradient);
    svg.appendChild(defs);
  }

  // Generate & animate dots
  for (let i = 0; i < N; i++) {
    const idx = i + 0.5;
    const frac = idx / N;
    const r = Math.sqrt(frac) * MAX_RADIUS;
    const theta = idx * GOLDEN_ANGLE;
    const x = CENTER + r * Math.cos(theta);
    const y = CENTER + r * Math.sin(theta);

    // Perfect SVG circle
    const c = document.createElementNS(svgNS, "circle");
    c.setAttribute("cx", x);
    c.setAttribute("cy", y);
    c.setAttribute("r", DOT_RADIUS);

    // Set color based on preset or gradient
    if (config.gradientPreset !== "none") {
      c.setAttribute("fill", "url(#spiralGradient)");
    } else {
      c.setAttribute("fill", colorPresets[config.colorPreset]);
    }

    // Set initial opacity
    c.setAttribute("opacity", "0.6");

    svg.appendChild(c);

    if (config.pulseEffect) {
      // Radius pulse
      const animR = document.createElementNS(svgNS, "animate");
      animR.setAttribute("attributeName", "r");
      animR.setAttribute(
        "values",
        `${DOT_RADIUS * config.sizeMin};${DOT_RADIUS * config.sizeMax};${
          DOT_RADIUS * config.sizeMin
        }`
      );
      animR.setAttribute("dur", `${DURATION}s`);
      animR.setAttribute("begin", `${frac * DURATION}s`);
      animR.setAttribute("repeatCount", "indefinite");
      animR.setAttribute("calcMode", "spline");
      animR.setAttribute("keySplines", "0.4 0 0.6 1;0.4 0 0.6 1");
      c.appendChild(animR);

      // Opacity pulse
      const animO = document.createElementNS(svgNS, "animate");
      animO.setAttribute("attributeName", "opacity");
      animO.setAttribute(
        "values",
        `${config.opacityMin};${config.opacityMax};${config.opacityMin}`
      );
      animO.setAttribute("dur", `${DURATION}s`);
      animO.setAttribute("begin", `${frac * DURATION}s`);
      animO.setAttribute("repeatCount", "indefinite");
      animO.setAttribute("calcMode", "spline");
      animO.setAttribute("keySplines", "0.4 0 0.6 1;0.4 0 0.6 1");
      c.appendChild(animO);
    }
  }

  return svg;
}

// Function to regenerate the spiral
function regenerateSpiral() {
  const spiralContainer = document.getElementById("spiral");
  spiralContainer.innerHTML = "";
  spiralContainer.appendChild(generateSpiral());
}

// Initial generation
regenerateSpiral();