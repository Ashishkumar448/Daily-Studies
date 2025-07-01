class Intro {
  constructor() {
    this.centerImage = document.querySelector(".intro__center-image img");
    this.centerImageWrapper = document.querySelector(".intro__center-image");
    this.titleLines = 'h1 [data-animation="text-reveal"] > *';
    this.navText = '.header [data-animation="text-reveal"] > *';
    this.bottomText = ".bottom-text";
    // Start the sequence
    this._setInitialState();
    this._animateImage();
  }
  _setInitialState() {
    // Set initial states for center image
    gsap.set(this.centerImageWrapper, {
      scale: 0.15,
      filter: "blur(15px)"
    });
    // Set center image content scale
    gsap.set(this.centerImage, {
      scale: 1.5
    });
  }
  _animateImage() {
    // First animation: reveal the center image using clip-path instead of opacity
    // Following the directional animation principle (vertical motion)
    return gsap.to(this.centerImageWrapper, {
      clipPath: "inset(0% 0 0% 0)",
      opacity: 1,
      filter: "blur(0px)",
      duration: 1.5,
      ease: "power2.out",
      onComplete: () => this._scaleCenterImage()
    });
  }
  _scaleCenterImage() {
    // Second animation: scale center image to full size
    const tl = gsap.timeline({
      onComplete: () => this._revealContent()
    });
    tl.to(this.centerImageWrapper, {
      scale: 1,
      duration: 2,
      ease: "expo.inOut"
    }).to(
      this.centerImage,
      {
        scale: 1,
        duration: 2,
        ease: "expo.inOut"
      },
      0
    );
    return tl;
  }
  _revealContent() {
    // Final animation: reveal text content using directional animation
    const tl = gsap.timeline({
      defaults: {
        y: 0,
        duration: 0.8,
        ease: "expo.out"
      }
    });
    // Staggered vertical reveal of text elements
    tl.to(this.titleLines, {
      stagger: 0.1
    })
      .to(
        this.navText,
        {
          stagger: 0.2
        },
        0
      )
      .to(
        this.bottomText,
        {
          stagger: 0.3,
          opacity: 1,
          duration: 1
        },
        0
      );
    return tl;
  }
}
// Initialize animation when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("Document ready, starting animation");
  new Intro();
});