class MaskedSlider {
  constructor() {
    this.container = document.querySelector(".slider-container");
    this.slides = [...document.querySelectorAll(".slide")];
    this.slideNumber = document.querySelector(".slide-number");
    this.headline = document.querySelector(".headline");
    this.progressBar = document.querySelector(".progress-bar");
    this.currentIndex = 0;
    this.isAnimating = false;
    this.autoplayDuration = 5000;
    this.isPlaying = true;
    this.lastTime = null;
    this.accumulatedTime = 0;

    this.headlines = ["Architecture", "Innovation", "Future"];

    // Animation properties
    this.rotationAngle = 15; // Degrees of rotation for inactive slides
    this.initialDelay = 500; // Delay before starting initial animation

    this.init();
  }

  init() {
    // Set initial states with opacity 0
    this.slides.forEach((slide) => {
      slide.style.opacity = "0";
      slide.style.transform =
        "translateX(-50%) translateZ(-200px) rotateY(30deg)";
    });

    // Trigger initial animation after a brief delay
    setTimeout(() => {
      this.slides.forEach((slide, index) => {
        slide.style.transition = "all 1.5s cubic-bezier(0.16, 1, 0.3, 1)";
        slide.className = "slide " + this.getPosition(index);
        slide.style.opacity = index === this.currentIndex ? "1" : "0.5";
      });
    }, this.initialDelay);

    this.setupListeners();
    this.startProgress();
  }

  setupListeners() {
    document
      .querySelector(".prev")
      .addEventListener("click", () => this.prev());
    document
      .querySelector(".next")
      .addEventListener("click", () => this.next());

    this.container.addEventListener("mouseenter", () => this.pause());
    this.container.addEventListener("mouseleave", () => this.resume());

    // Touch events with improved handling
    let touchStartX = 0;
    let touchStartTime = 0;

    this.container.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartTime = Date.now();
        this.pause();
      },
      { passive: true }
    );

    this.container.addEventListener(
      "touchend",
      (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndTime = Date.now();
        const diff = touchStartX - touchEndX;
        const duration = touchEndTime - touchStartTime;

        // Add velocity-based threshold for better swipe detection
        if (Math.abs(diff) > 50 && duration < 300) {
          if (diff > 0) this.next();
          else this.prev();
        }

        this.resume();
      },
      { passive: true }
    );
  }

  updateProgress(timestamp) {
    if (!this.isPlaying) return;

    if (!this.lastTime) {
      this.lastTime = timestamp;
    }

    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    this.accumulatedTime += deltaTime;
    const progress = Math.min(this.accumulatedTime / this.autoplayDuration, 1);

    this.progressBar.style.transform = `scaleX(${progress})`;

    if (progress >= 1) {
      this.next();
      return;
    }

    requestAnimationFrame(this.updateProgress.bind(this));
  }

  startProgress() {
    this.accumulatedTime = 0;
    this.lastTime = null;
    this.isPlaying = true;
    this.progressBar.style.transition = "transform 0.1s linear";
    requestAnimationFrame(this.updateProgress.bind(this));
  }

  pause() {
    this.isPlaying = false;
    this.lastTime = null;
    this.progressBar.style.transition = "none";
  }

  resume() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.progressBar.style.transition = "transform 0.1s linear";
      requestAnimationFrame(this.updateProgress.bind(this));
    }
  }

  updateSlides() {
    // Update slide positions with rotation
    this.slides.forEach((slide, index) => {
      const position = this.getPosition(index);
      slide.className = "slide " + position;

      // Add rotation transform based on position
      let transform = "";
      let opacity = "0.5";

      if (position === "active") {
        transform = "translateX(-50%) translateZ(0) rotateY(0)";
        opacity = "1";
      } else if (position === "prev") {
        transform = `translateX(calc(-50% - var(--slide-width) - var(--slide-gap))) translateZ(-100px) rotateY(${this.rotationAngle}deg)`;
      } else if (position === "next") {
        transform = `translateX(calc(-50% + var(--slide-width) + var(--slide-gap))) translateZ(-100px) rotateY(-${this.rotationAngle}deg)`;
      } else {
        transform = "translateX(-50%) translateZ(-200px) rotateY(30deg)";
        opacity = "0";
      }

      slide.style.transform = transform;
      slide.style.opacity = opacity;
    });

    // Update text elements
    this.slideNumber.textContent = `0${this.currentIndex + 1}`;

    // Animate headline
    this.headline.style.opacity = "0";
    setTimeout(() => {
      this.headline.textContent = this.headlines[this.currentIndex];
      this.headline.style.opacity = "1";
    }, 300);
  }

  getPosition(index) {
    if (index === this.currentIndex) return "active";
    if (
      index === this.currentIndex - 1 ||
      (this.currentIndex === 0 && index === this.slides.length - 1)
    )
      return "prev";
    if (
      index === this.currentIndex + 1 ||
      (this.currentIndex === this.slides.length - 1 && index === 0)
    )
      return "next";
    return "";
  }

  async next() {
    if (this.isAnimating) return;
    this.isAnimating = true;

    this.currentIndex = (this.currentIndex + 1) % this.slides.length;
    this.updateSlides();
    this.startProgress();

    await new Promise((resolve) => setTimeout(resolve, 1500));
    this.isAnimating = false;
  }

  async prev() {
    if (this.isAnimating) return;
    this.isAnimating = true;

    this.currentIndex =
      (this.currentIndex - 1 + this.slides.length) % this.slides.length;
    this.updateSlides();
    this.startProgress();

    await new Promise((resolve) => setTimeout(resolve, 1500));
    this.isAnimating = false;
  }
}

// Initialize slider
document.addEventListener("DOMContentLoaded", () => {
  new MaskedSlider();
});