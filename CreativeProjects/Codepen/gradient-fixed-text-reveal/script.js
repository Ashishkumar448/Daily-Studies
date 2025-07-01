class GradientReveal {
  constructor(element) {
    this.element = element;
    this.child = this.element.querySelector(".fixed-content");
    this.gradientElement = this.element.querySelector(".gradient-text");
    this.revealValue = 0;
    this.opacityValue = 0;
    this.handleScroll = this.handleScroll.bind(this);
    this.init();
  }

  getRects() {
    return {
      rect: this.element.getBoundingClientRect(),
      childRect: this.child.getBoundingClientRect()
    };
  }

  calculateRevealValue() {
    const { rect } = this.getRects();
    const scrollProgress = window.scrollY / (rect.height - window.innerHeight);
    return Math.max(0, Math.min(1, scrollProgress));
  }

  handleScroll() {
    this.revealValue = this.calculateRevealValue();
    this.gradientElement.style.backgroundPosition = `50% ${
      100 * this.revealValue
    }%`;

    if (this.revealValue >= 0.3 && this.revealValue <= 0.7) {
      this.opacityValue = 1;
    } else if (this.revealValue >= 0.2 && this.revealValue < 0.3) {
      this.opacityValue = 10 * (this.revealValue - 0.2);
    } else if (this.revealValue > 0.7 && this.revealValue <= 0.8) {
      this.opacityValue = 1 - 10 * (this.revealValue - 0.7);
    } else {
      this.opacityValue = 0;
    }
    this.child.style.opacity = this.opacityValue;
  }

  init() {
    window.addEventListener("scroll", this.handleScroll);
    this.handleScroll(); // Initial call to set initial state
  }
}

// Init GradientReveal
const els = document.querySelectorAll("[data-gradient-reveal]");
els.forEach((el) => {
  new GradientReveal(el);
});