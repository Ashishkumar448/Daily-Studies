// Register GSAP plugins
gsap.registerPlugin(Flip, ScrollTrigger, CustomEase);

// Create custom eases with the provided values
CustomEase.create("customEase", "0.6, 0.01, 0.05, 1");
CustomEase.create("directionalEase", "0.16, 1, 0.3, 1");
CustomEase.create("smoothBlur", "0.25, 0.1, 0.25, 1");
CustomEase.create("gentleIn", "0.38, 0.005, 0.215, 1");
CustomEase.create("blurEase", "0.25, 0.1, 0.25, 1");
CustomEase.create("verticalMotion", "0.22, 1, 0.36, 1");

// Prevent any layout shifts during animation
gsap.config({
  force3D: true
});

class PreloaderAnimation {
  constructor() {
    // Original preloader elements
    this.centerImage = document.querySelector(".preloader__center-image img");
    this.centerImageWrapper = document.querySelector(
      ".preloader__center-image"
    );
    this.preloader = document.querySelector(".preloader");
    this.preloaderText = document.querySelector(".preloader__text");
    this.textLines = this.preloaderText.querySelectorAll("p");
    this.textWrappers = this.preloaderText.querySelectorAll(
      ".text-line-wrapper"
    );

    // Added elements from the attached code
    this.gridContainer = document.querySelector(".grid-container");
    this.contentContainer = document.querySelector(".content-container");
    this.textBlocks = document.querySelectorAll(".text-block");
    this.gridColumns = document.querySelectorAll(".grid-column");

    // Disable scrolling during animation
    document.body.style.overflow = "hidden";

    // Start the sequence
    this._getFinalState();
    this._setInitialState();
    this._startAnimation();
  }

  _getFinalState() {
    // Set final positions for FLIP animation
    gsap.set(this.centerImageWrapper, {
      xPercent: -50,
      yPercent: -50
    });
    this.state = Flip.getState(this.centerImageWrapper);
  }

  _setInitialState() {
    // Set initial states for all elements
    this.centerImageWrapper.classList.add("initial");

    // Set center image initial scale and position
    gsap.set(this.centerImageWrapper, {
      y: 0,
      scale: 0.3
    });

    // Set center image content scale
    gsap.set(this.centerImage, {
      scale: 1.5
    });

    // Set text container initial position - below the image
    gsap.set(this.preloaderText, {
      y: -10
    });

    // Set different initial positions for each text wrapper for staggered movement
    this.textWrappers.forEach((wrapper, index) => {
      gsap.set(wrapper, {
        y: 0 + index * 40 // Increasing offset for each wrapper
      });
    });

    // Hide grid and content initially
    gsap.set([this.gridContainer, this.contentContainer], {
      opacity: 0
    });

    // Set initial height for grid columns
    gsap.set(this.gridColumns, {
      height: 0
    });
  }

  _startAnimation() {
    // First animation: fade in image and text container
    const tl = gsap.timeline();

    // Move up the image and reduce blur - using smoothBlur for the blur transition
    tl.to(this.centerImageWrapper, {
      y: 0,
      filter: "blur(0px)",
      duration: 2,
      ease: "smoothBlur"
    });

    // First reveal the text lines with staggered effect - using directionalEase for crisp movement
    tl.to(
      this.textLines,
      {
        y: 0,
        clipPath: "inset(0 0 0% 0)",
        duration: 1.4,
        stagger: 0.15,
        ease: "directionalEase"
      },
      0
    );

    // Then move each text wrapper to center with staggered effect - using gentleIn for subtle movement
    tl.to(
      this.textWrappers,
      {
        y: 0,
        duration: 1,
        ease: "gentleIn"
      },
      0
    );

    // Move the entire text container to center position - using customEase for the main movement
    tl.to(
      this.preloaderText,
      {
        y: 0,
        duration: 1.5,
        ease: "customEase",
        onComplete: () => this._moveToCenter()
      },
      0
    ); // Overlap with the wrapper animations
  }

  _moveToCenter() {
    // Move to center using FLIP - using customEase for the main transition
    Flip.to(this.state, {
      duration: 1.25,
      ease: "customEase",
      onComplete: () => this._scaleCenterImage()
    });
  }

  _scaleCenterImage() {
    // Scale center image to full size - using directionalEase for the scaling
    const tl = gsap.timeline();
    tl.to(this.centerImageWrapper, {
      scale: 1,
      duration: 1.5,
      ease: "directionalEase",
      onComplete: () => this._revealContent()
    });

    tl.to(
      this.centerImage,
      {
        scale: 1,
        duration: 2,
        ease: "directionalEase"
      },
      0
    );
  }

  _revealContent() {
    // Simply show the grid and content on top
    gsap.to([this.gridContainer, this.contentContainer], {
      opacity: 1,
      duration: 0.5,
      ease: "customEase",
      onComplete: () => this._animateGridColumns()
    });
  }

  _animateGridColumns() {
    // Animate the grid columns
    gsap.fromTo(
      this.gridColumns,
      { height: 0 },
      {
        height: "100%",
        duration: 1.2,
        stagger: 0.05,
        ease: "power2.inOut",
        onComplete: () => this._animateTextBlocks()
      }
    );
  }

  _animateTextBlocks() {
    // Animate the text blocks
    gsap.fromTo(
      this.textBlocks,
      {
        opacity: 0,
        y: 30,
        filter: "blur(50px)"
      },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.8,
        stagger: 0.1,
        ease: "verticalMotion",
        onComplete: () => this._addScrollEffects()
      }
    );
  }

  _addScrollEffects() {
    // Enable scrolling on the body
    document.body.style.overflow = "auto";

    // Add scroll effects to text blocks
    gsap.utils.toArray(".text-block").forEach((block) => {
      ScrollTrigger.create({
        trigger: block,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          gsap.to(block, {
            y: self.progress * 20,
            duration: 0.5,
            ease: "none"
          });
        }
      });
    });

    console.log("Animation sequence complete");
  }
}

// Initialize animation when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("Document ready, starting animation");
  new PreloaderAnimation();
});