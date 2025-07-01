// Custom ease animations
CustomEase.create("customEase", "0.6, 0.01, 0.05, 1");
CustomEase.create("directionalEase", "0.16, 1, 0.3, 1");
CustomEase.create("smoothBlur", "0.25, 0.1, 0.25, 1");
CustomEase.create("gentleIn", "0.38, 0.005, 0.215, 1");
CustomEase.create("quickSnap", "0.22, 1, 0.36, 1");
CustomEase.create("instantEase", "0.1, 0, 0, 1");

// Color conversion utilities
const colorUtils = {
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null;
  },

  rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  },

  // Generate 6 shades of a color
  generateShades(hex) {
    const rgb = this.hexToRgb(hex);
    const shades = [];

    // Generate 6 shades from darkest to lightest
    for (let i = 0; i < 6; i++) {
      // Calculate percentage from 0% (darkest) to 100% (lightest)
      const percent = i * 20; // 0, 20, 40, 60, 80, 100

      // Calculate shade
      const factor = percent / 100;
      const r = Math.round(rgb.r * factor);
      const g = Math.round(rgb.g * factor);
      const b = Math.round(rgb.b * factor);

      shades.push({
        hex: this.rgbToHex(r, g, b),
        percent: percent
      });
    }

    return shades;
  },

  // Check if a color is light or dark
  isLight(hex) {
    const rgb = this.hexToRgb(hex);
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128;
  }
};

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Faster initial animation
  gsap.to(".color-bar", {
    opacity: 1,
    y: 0,
    duration: 0.4,
    stagger: 0.02,
    ease: "quickSnap",
    onComplete: setupInteractions
  });
});

function setupInteractions() {
  let activeBar = null;

  document.querySelectorAll(".color-bar").forEach((bar) => {
    // Click to show shades
    bar.addEventListener("click", function () {
      const hexCode = this.querySelector(".color-hex").textContent;

      // If this bar is already active, close it
      if (activeBar === this) {
        hideShades(this);
        activeBar = null;
        return;
      }

      // If another bar is active, close it first
      if (activeBar) {
        // Hide previous shades immediately
        const prevShadesContainer = activeBar.querySelector(
          ".shades-container"
        );
        const prevColorContent = activeBar.querySelector(".color-content");

        prevShadesContainer.style.display = "none";
        prevColorContent.style.display = "flex";
        prevColorContent.style.opacity = 1;

        // Reset previous bar size immediately
        gsap.set(activeBar, { flexGrow: 1 });
      }

      // Show shades for this bar immediately
      showShades(this, hexCode);
      activeBar = this;
    });

    // Hover effect
    bar.addEventListener("mouseenter", function () {
      if (this !== activeBar) {
        gsap.to(this, {
          flexGrow: 1.3,
          duration: 0.2,
          ease: "directionalEase"
        });
      }
    });

    bar.addEventListener("mouseleave", function () {
      if (this !== activeBar) {
        gsap.to(this, {
          flexGrow: 1,
          duration: 0.2,
          ease: "quickSnap"
        });
      }
    });
  });
}

function showShades(bar, hexCode) {
  const shadesContainer = bar.querySelector(".shades-container");
  const colorContent = bar.querySelector(".color-content");

  // Prepare shades container
  shadesContainer.innerHTML = "";

  // Generate 6 shades
  const shades = colorUtils.generateShades(hexCode);

  // Create shade items
  shades.forEach((shade, index) => {
    const shadeItem = document.createElement("div");
    shadeItem.className = "shade-item";
    shadeItem.style.backgroundColor = shade.hex;

    // Add dark-shade class for light colors
    if (colorUtils.isLight(shade.hex)) {
      shadeItem.classList.add("dark-shade");
    }

    const shadeInfo = document.createElement("div");
    shadeInfo.className = "shade-info";
    shadeInfo.textContent = shade.hex;

    shadeItem.appendChild(shadeInfo);

    // Click to copy
    shadeItem.addEventListener("click", (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(shade.hex);
      showCopyNotification(shade.hex);
    });

    shadesContainer.appendChild(shadeItem);
  });

  // Hide content and show shades immediately
  colorContent.style.display = "none";
  shadesContainer.style.display = "block";

  // Expand the bar quickly
  gsap.to(bar, {
    flexGrow: 3,
    duration: 0.2,
    ease: "instantEase"
  });

  // Animate shade items in with slower stagger
  gsap.fromTo(
    shadesContainer.querySelectorAll(".shade-item"),
    { opacity: 0, y: 5 },
    {
      opacity: 1,
      y: 0,
      duration: 0.2,
      stagger: 0.06, // Slower stagger
      ease: "instantEase"
    }
  );
}

function hideShades(bar) {
  const shadesContainer = bar.querySelector(".shades-container");
  const colorContent = bar.querySelector(".color-content");

  // Hide shades and show content immediately
  shadesContainer.style.display = "none";
  colorContent.style.display = "flex";

  // Shrink the bar quickly
  gsap.to(bar, {
    flexGrow: 1,
    duration: 0.2,
    ease: "instantEase"
  });
}

function showCopyNotification(hexCode) {
  const notification = document.querySelector(".copy-notification");
  notification.textContent = `${hexCode} copied to clipboard`;

  gsap.fromTo(
    notification,
    { opacity: 0, y: -10 },
    {
      opacity: 1,
      y: 0,
      duration: 0.2,
      ease: "instantEase",
      onComplete: () => {
        gsap.to(notification, {
          opacity: 0,
          y: -10,
          delay: 0.8,
          duration: 0.2,
          ease: "instantEase"
        });
      }
    }
  );
}