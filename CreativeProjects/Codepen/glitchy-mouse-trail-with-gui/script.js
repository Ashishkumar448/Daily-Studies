// Set up the canvas
const canvas = document.getElementById("trailCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Variables to track mouse movement
let aimX = window.innerWidth / 2,
  aimY = window.innerHeight / 2;

// GUI controls
const settings = {
  baseLineWidth: 3,
  numberOfLines: 5,
  wiggleStrength: 12,
  lineWiggleStrengths: [5, 15, 10, 20, 0], // Example strengths for each line, can be adjusted
  lineColor: "#000000",
  followSpeed: 0.5, // Increased for faster following
  followBackSpeed: 0.5, // Increased for faster return
  maxSpeed: 0.30301439458086366,
  glitchEffect: 0,
  disappearChance: 0.17138018628281118,
  trailSegments: 9,
  lineOpacity: 0.5468755292125318,
  trailLength: 1,
  randomness: 0.8322607959356478,
  colorShiftChance: 0.1,
  fragmentChance: 0,
  opacityFlickerChance: 0.1,
  directionalShiftChance: 1,
  enableGlitch: false,
  enableDisappear: false,
  enableColorShift: false,
  enableFragment: true,
  enableOpacityFlicker: true,
  enableDirectionalShift: true,
  randomize: () => randomizeSettings(),
  saveSettings: () => copySettingsToClipboard()
};

// Function to format and copy settings for easy pasting
function copySettingsToClipboard() {
  const formattedSettings = Object.entries(settings)
    .filter(([key]) => typeof settings[key] !== "function")
    .map(([key, value]) => {
      if (typeof value === "string") return `${key}: "${value}"`;
      if (typeof value === "number" || typeof value === "boolean")
        return `${key}: ${value}`;
      return `${key}: ${JSON.stringify(value)}`;
    })
    .join(",\n  ");

  const formattedOutput = `// GUI controls\nconst settings = {\n  ${formattedSettings},\n  randomize: () => randomizeSettings(),\n  saveSettings: () => copySettingsToClipboard()\n};`;

  navigator.clipboard
    .writeText(formattedOutput)
    .then(() => {
      alert("Settings copied to clipboard. Paste into your code!");
    })
    .catch((err) => {
      alert("Failed to copy settings. Please try again.");
      console.error(err);
    });
}

// Create multiple trails
let trails = [];

// Function to create trails based on the number of lines
function createTrails() {
  trails = Array.from({ length: settings.numberOfLines }).map((_, index) => ({
    color: `${settings.lineColor}`,
    points: Array.from({ length: settings.trailSegments }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height
    })),
    visible: true,
    wiggleStrength:
      settings.lineWiggleStrengths[index] || settings.wiggleStrength, // Assign specific wiggle strength or default
    originalColor: `${settings.lineColor}`
  }));
}

createTrails();

// Variables to manage scrolling state and delay
let isScrolling = false;
let scrollTimeout;

// Event listener for scroll to control the glitch effect delay
window.addEventListener("scroll", () => {
  isScrolling = true;
  clearTimeout(scrollTimeout);

  // Set a timeout to stop the wiggle effect after 500ms of no scroll
  scrollTimeout = setTimeout(() => {
    isScrolling = false;
  }, 500);
});

// Function to draw the trails
function drawTrails() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the trails
  trails.forEach((trail, trailIndex) => {
    const { points, color, visible, originalColor, wiggleStrength } = trail;

    if (settings.enableDisappear && Math.random() < settings.disappearChance) {
      trail.visible = !trail.visible;
    }

    if (!visible) return;

    ctx.globalAlpha = settings.lineOpacity;
    ctx.strokeStyle = trail.color;
    ctx.lineWidth = settings.baseLineWidth;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      const jitterX = isScrolling
        ? (Math.random() - 0.5) * wiggleStrength * settings.randomness
        : 0;
      const jitterY = isScrolling
        ? (Math.random() - 0.5) * wiggleStrength * settings.randomness
        : 0;
      ctx.lineTo(points[i].x + jitterX, points[i].y + jitterY);
    }

    ctx.stroke();

    for (let i = points.length - 1; i > 0; i--) {
      if (
        settings.enableDirectionalShift &&
        Math.random() < settings.directionalShiftChance
      ) {
        points[i].x += (Math.random() - 0.5) * 20;
        points[i].y += (Math.random() - 0.5) * 20;
      }

      points[i].x +=
        (points[i - 1].x - points[i].x) *
        settings.trailLength *
        (Math.random() * settings.maxSpeed + 0.5);
      points[i].y +=
        (points[i - 1].y - points[i].y) *
        settings.trailLength *
        (Math.random() * settings.maxSpeed + 0.5);
    }

    const glitchX = settings.enableGlitch
      ? Math.random() * settings.glitchEffect * 10 - settings.glitchEffect * 5
      : 0;
    const glitchY = settings.enableGlitch
      ? Math.random() * settings.glitchEffect * 10 - settings.glitchEffect * 5
      : 0;

    points[0].x +=
      (aimX - points[0].x) * (settings.followSpeed + trailIndex * 0.05) +
      (Math.random() * settings.randomness * 2 - settings.randomness) +
      glitchX;
    points[0].y +=
      (aimY - points[0].y) * (settings.followSpeed + trailIndex * 0.05) +
      (Math.random() * settings.randomness * 2 - settings.randomness) +
      glitchY;
  });

  requestAnimationFrame(drawTrails);
}

// Start the drawing loop
drawTrails();

// Update mouse target positions
document.addEventListener("mousemove", function (event) {
  aimX = event.pageX;
  aimY = event.pageY;
});

// Function to randomize settings
function randomizeSettings() {
  settings.baseLineWidth = Math.random() * 9 + 1;
  settings.numberOfLines = Math.floor(Math.random() * 15) + 1;
  settings.wiggleStrength = Math.random() * 20;
  settings.lineWiggleStrengths = Array.from(
    { length: settings.numberOfLines },
    () => Math.random() * 20
  ); // Randomize each line's wiggle
  settings.lineColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  settings.followSpeed = Math.random() * 0.45 + 0.05;
  settings.followBackSpeed = Math.random() * 0.5 + 0.2;
  settings.maxSpeed = Math.random() * 1.5 + 0.5;
  settings.glitchEffect = Math.random() * 5;
  settings.disappearChance = Math.random();
  settings.trailSegments = Math.floor(Math.random() * 40) + 10;
  settings.lineOpacity = Math.random();
  settings.trailLength = Math.random();
  settings.randomness = Math.random() * 10;
  settings.colorShiftChance = Math.random();
  settings.fragmentChance = Math.random();
  settings.opacityFlickerChance = Math.random();
  settings.directionalShiftChance = Math.random();
  createTrails();
}

// GUI setup
const gui = new dat.GUI();
gui
  .add(settings, "baseLineWidth", 1, 10)
  .onChange(createTrails)
  .name("Base Line Width");
gui
  .add(settings, "numberOfLines", 1, 15, 1)
  .onChange(createTrails)
  .name("Number of Lines");
gui.add(settings, "wiggleStrength", 0, 20).name("Wiggle Strength");
gui
  .add(settings, "lineWiggleStrengths", settings.lineWiggleStrengths)
  .name("Line Wiggle Strengths"); // To dynamically adjust wiggle per line
gui.addColor(settings, "lineColor").name("Color").onChange(createTrails);
gui.add(settings, "followSpeed", 0.1, 1).name("Speed to Follow");
gui.add(settings, "followBackSpeed", 0.1, 1).name("Follow Back Speed");
gui.add(settings, "maxSpeed", 0.1, 1).name("Max Speed");
gui.add(settings, "glitchEffect", 0, 5).name("Glitch Effect");
gui.add(settings, "disappearChance", 0, 1).name("Disappear Chance");
gui
  .add(settings, "trailSegments", 1, 20, 1)
  .onChange(createTrails)
  .name("Trail Segments");
gui.add(settings, "lineOpacity", 0.1, 1).name("Opacity");
gui.add(settings, "trailLength", 0.1, 1).name("Trail Length");
gui.add(settings, "randomness", 0.5, 5).name("Randomness");
gui.add(settings, "colorShiftChance", 0, 1).name("Color Shift Chance");
gui.add(settings, "fragmentChance", 0, 1).name("Fragment Chance");
gui.add(settings, "opacityFlickerChance", 0, 1).name("Opacity Flicker Chance");
gui
  .add(settings, "directionalShiftChance", 0, 1)
  .name("Directional Shift Chance");
gui.add(settings, "enableGlitch").name("Enable Glitch");
gui.add(settings, "enableDisappear").name("Enable Disappear");
gui.add(settings, "enableColorShift").name("Enable Color Shift");
gui.add(settings, "enableFragment").name("Enable Fragment");
gui.add(settings, "enableOpacityFlicker").name("Enable Opacity Flicker");
gui.add(settings, "enableDirectionalShift").name("Enable Directional Shift");
gui.add(settings, "randomize").name("Randomize Effect");
gui.add(settings, "saveSettings").name("Save Settings");

// Initialize the effect
createTrails();