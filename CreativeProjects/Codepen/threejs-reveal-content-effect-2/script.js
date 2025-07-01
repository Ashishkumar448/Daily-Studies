document.addEventListener("DOMContentLoaded", function () {
  // Create canvas
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  document.body.appendChild(canvas);

  // Get DOM elements
  const cursor = document.querySelector(".custom-cursor");
  const content = document.querySelector(".content");

  // Variables for the effect
  let width, height;
  let mouseX = 0,
    mouseY = 0;
  let particles = [];
  let isMouseMoving = false;
  let lastMouseX = 0,
    lastMouseY = 0;
  let mouseTimer;
  let fadeOutStarted = false;
  let fadeOutInterval;
  let fadeStartDelay;

  // Settings
  const settings = {
    // Particle settings
    particleCount: 5,
    particleBaseSize: 30,
    particleMaxSpeed: 3,

    // Effect settings
    fadeSpeed: 0.01,
    recoverySpeed: 0.03,
    brushSize: 60,
    smokeOpacity: 0.5,
    sceneOpacity: 1.0, // New setting for overall scene opacity

    // Tail fade settings
    tailFadeDelay: 100,
    tailFadeSpeed: 0.03,
    fadeStartDelay: 300,

    // Cursor settings
    cursorSize: 20,
    cursorGrowFactor: 2,

    // Color settings
    backgroundColor: "#990000", // Red background by default
    canvasColor: "#000000", // Canvas color (separate from background)

    // Reset function
    reset: function () {
      // Clear canvas
      ctx.fillStyle = settings.canvasColor;
      ctx.globalAlpha = 1.0;
      ctx.fillRect(0, 0, width, height);
      particles = [];
      fadeOutStarted = false;
      clearInterval(fadeOutInterval);
      clearTimeout(fadeStartDelay);
    }
  };

  // Update background color
  function updateBackgroundColor(color) {
    document.body.style.backgroundColor = color;
    content.style.backgroundColor = color;
    settings.backgroundColor = color;
  }

  // Update canvas color
  function updateCanvasColor(color) {
    settings.canvasColor = color;
    // Redraw the canvas with the new color
    ctx.fillStyle = color;
    ctx.globalAlpha = 1.0;
    ctx.fillRect(0, 0, width, height);
  }

  // Update scene opacity
  function updateSceneOpacity(opacity) {
    canvas.style.opacity = opacity;
    settings.sceneOpacity = opacity;
  }

  // Resize function
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Create initial mask
    ctx.fillStyle = settings.canvasColor;
    ctx.fillRect(0, 0, width, height);
  }

  // Initialize
  function init() {
    resize();
    window.addEventListener("resize", resize);

    // Set initial colors and opacity
    updateBackgroundColor(settings.backgroundColor);
    updateCanvasColor(settings.canvasColor);
    updateSceneOpacity(settings.sceneOpacity);

    // Mouse events
    document.addEventListener("mousemove", function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Update custom cursor
      cursor.style.left = mouseX + "px";
      cursor.style.top = mouseY + "px";

      // Check if mouse is actually moving
      if (
        Math.abs(mouseX - lastMouseX) > 3 ||
        Math.abs(mouseY - lastMouseY) > 3
      ) {
        // If we were in fade-out mode, cancel it
        if (fadeOutStarted) {
          fadeOutStarted = false;
          clearInterval(fadeOutInterval);
          clearTimeout(fadeStartDelay);
        }

        isMouseMoving = true;

        // Grow cursor on movement
        cursor.style.width =
          settings.cursorSize * settings.cursorGrowFactor + "px";
        cursor.style.height =
          settings.cursorSize * settings.cursorGrowFactor + "px";

        // Create particles on mouse move
        createParticlesAtMouse();

        lastMouseX = mouseX;
        lastMouseY = mouseY;

        // Reset timer
        clearTimeout(mouseTimer);
        mouseTimer = setTimeout(() => {
          isMouseMoving = false;
          // Shrink cursor when not moving
          cursor.style.width = settings.cursorSize + "px";
          cursor.style.height = settings.cursorSize + "px";

          // Start the tail-to-head fade out with a delay
          clearTimeout(fadeStartDelay);
          fadeStartDelay = setTimeout(() => {
            startTailToHeadFadeOut();
          }, settings.fadeStartDelay);
        }, 100);
      }
    });

    // Initialize cursor size
    cursor.style.width = settings.cursorSize + "px";
    cursor.style.height = settings.cursorSize + "px";

    // Setup dat.GUI
    setupGUI();

    // Start animation
    animate();
  }

  // Start the tail-to-head fade out effect
  function startTailToHeadFadeOut() {
    if (particles.length === 0 || fadeOutStarted) return;

    fadeOutStarted = true;
    fadeOutIndex = 0;

    // Sort particles by creation time (oldest first)
    particles.sort((a, b) => a.creationTime - b.creationTime);

    // Mark particles for accelerated fade out, starting from the oldest (tail)
    fadeOutInterval = setInterval(() => {
      if (fadeOutIndex < particles.length) {
        particles[fadeOutIndex].isFadingOut = true;
        fadeOutIndex++;
      } else {
        clearInterval(fadeOutInterval);
      }
    }, settings.tailFadeDelay);
  }

  // Setup dat.GUI
  function setupGUI() {
    const gui = new dat.GUI();

    // Particle folder
    const particleFolder = gui.addFolder("Particles");
    particleFolder.add(settings, "particleCount", 1, 20).step(1).name("Count");
    particleFolder.add(settings, "particleBaseSize", 10, 100).name("Size");
    particleFolder.add(settings, "particleMaxSpeed", 0.5, 10).name("Speed");
    particleFolder.open();

    // Effect folder
    const effectFolder = gui.addFolder("Effect");
    effectFolder.add(settings, "fadeSpeed", 0.001, 0.05).name("Fade Speed");
    effectFolder
      .add(settings, "recoverySpeed", 0.001, 0.1)
      .name("Recovery Speed");
    effectFolder.add(settings, "brushSize", 20, 200).name("Brush Size");
    effectFolder.add(settings, "smokeOpacity", 0.1, 1).name("Smoke Opacity");
    effectFolder
      .add(settings, "sceneOpacity", 0, 1)
      .name("Scene Opacity")
      .onChange(updateSceneOpacity);
    effectFolder.open();

    // Tail fade folder
    const tailFadeFolder = gui.addFolder("Tail Fade");
    tailFadeFolder
      .add(settings, "tailFadeDelay", 10, 300)
      .step(5)
      .name("Fade Delay (ms)");
    tailFadeFolder.add(settings, "tailFadeSpeed", 0.01, 0.2).name("Fade Speed");
    tailFadeFolder
      .add(settings, "fadeStartDelay", 0, 1000)
      .step(50)
      .name("Start Delay (ms)");
    tailFadeFolder.open();

    // Cursor folder
    const cursorFolder = gui.addFolder("Cursor");
    cursorFolder
      .add(settings, "cursorSize", 5, 50)
      .name("Size")
      .onChange((value) => {
        if (!isMouseMoving) {
          cursor.style.width = value + "px";
          cursor.style.height = value + "px";
        }
      });
    cursorFolder.add(settings, "cursorGrowFactor", 1, 5).name("Grow Factor");
    cursorFolder.open();

    // Color folder
    const colorFolder = gui.addFolder("Colors");
    colorFolder
      .addColor(settings, "backgroundColor")
      .name("Background")
      .onChange(updateBackgroundColor);
    colorFolder
      .addColor(settings, "canvasColor")
      .name("Canvas")
      .onChange(updateCanvasColor);
    colorFolder.open();

    // Add reset button
    gui.add(settings, "reset").name("Reset Canvas");

    // Position GUI
    gui.domElement.style.position = "absolute";
    gui.domElement.style.top = "10px";
    gui.domElement.style.right = "10px";
  }

  // Particle class
  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size =
        settings.particleBaseSize +
        Math.random() * settings.particleBaseSize * 0.5;
      this.speedX = (Math.random() - 0.5) * settings.particleMaxSpeed;
      this.speedY = (Math.random() - 0.5) * settings.particleMaxSpeed;
      this.life = 400 + Math.random() * 200;
      this.opacity = settings.smokeOpacity;
      this.isFadingOut = false;
      this.creationTime = Date.now();
      this.fadeMultiplier = 1.0;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.life -= 1;

      // Normal fade or accelerated fade for tail-to-head effect
      if (this.isFadingOut) {
        // Gradually increase the fade multiplier for a smoother transition
        this.fadeMultiplier = Math.min(this.fadeMultiplier + 0.05, 3.0);
        this.opacity -= settings.tailFadeSpeed * this.fadeMultiplier;
      } else {
        this.opacity -= settings.fadeSpeed;
      }

      if (this.opacity < 0) this.opacity = 0;
    }

    draw() {
      ctx.globalCompositeOperation = "destination-out";
      const gradient = ctx.createRadialGradient(
        this.x,
        this.y,
        0,
        this.x,
        this.y,
        this.size
      );

      gradient.addColorStop(0, `rgba(0, 0, 0, ${this.opacity})`);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Create particles at mouse position
  function createParticlesAtMouse() {
    for (let i = 0; i < settings.particleCount; i++) {
      const offsetX = (Math.random() - 0.5) * settings.brushSize;
      const offsetY = (Math.random() - 0.5) * settings.brushSize;
      particles.push(new Particle(mouseX + offsetX, mouseY + offsetY));
    }
  }

  // Helper function to convert hex to rgb
  function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace("#", "");

    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `${r}, ${g}, ${b}`;
  }

  // Animation loop
  function animate() {
    // Slowly fade back to canvas color (recover the mask)
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(${hexToRgb(settings.canvasColor)}, ${
      settings.recoverySpeed
    })`;
    ctx.fillRect(0, 0, width, height);

    // Update and draw particles
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();

      // Remove dead particles
      if (particles[i].life <= 0 || particles[i].opacity <= 0) {
        particles.splice(i, 1);
        i--;
      }
    }

    // Create a hole at the current mouse position if moving
    if (isMouseMoving) {
      ctx.globalCompositeOperation = "destination-out";
      const gradient = ctx.createRadialGradient(
        mouseX,
        mouseY,
        0,
        mouseX,
        mouseY,
        settings.brushSize
      );

      gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, settings.brushSize, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(animate);
  }

  // Start the effect
  init();
});