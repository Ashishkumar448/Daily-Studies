document.addEventListener("DOMContentLoaded", function () {
  // Animation sequence
  const intro = {
    scatteredImages: document.querySelectorAll(".scattered-image"),
    centerImage: document.querySelector(".intro__center-image"),
    centerImageImg: document.querySelector(".intro__center-image img"),
    titleLines: document.querySelectorAll('[data-animation="text-reveal"] > *'),

    init: function () {
      // Set initial positions completely off screen
      gsap.set(this.scatteredImages, {
        x: () => gsap.utils.random(-500, 500),
        y: () => gsap.utils.random(-500, 500),
        rotation: () => gsap.utils.random(-45, 45),
        opacity: 0,
        scale: () => gsap.utils.random(0.8, 1.2)
      });

      // Make center image exactly match the size of a scattered image
      gsap.set(this.centerImage, {
        width: "200px",
        height: "150px",
        opacity: 0,
        top: "50%",
        left: "50%",
        xPercent: -50,
        yPercent: -50
      });

      // Set image inside to be at normal scale initially
      gsap.set(this.centerImageImg, {
        scale: 1,
        transformOrigin: "center center"
      });

      // Start with initial animation
      this.initialAnimation();
    },

    initialAnimation: function () {
      // 1. Animate scattered images FROM random positions TO their intended scattered positions
      gsap.to(this.scatteredImages, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        opacity: 0.7, // Make partially visible during movement
        duration: 2,
        ease: "power3.out",
        stagger: 0.1,
        onComplete: () => this.fadeInImages()
      });
    },

    fadeInImages: function () {
      // 2. Fade in scattered images completely
      gsap.to(this.scatteredImages, {
        opacity: 1,
        duration: 1.5,
        stagger: 0.1,
        ease: "power3.out",
        onComplete: () => this.moveToCenter()
      });
    },

    moveToCenter: function () {
      // 3. Move all scattered images to center
      // Save their scattered state first
      const state = Flip.getState(this.scatteredImages);

      // Move them all to center
      gsap.to(this.scatteredImages, {
        top: "50%",
        left: "50%",
        xPercent: -50,
        yPercent: -50,
        duration: 0, // Instant change for Flip
        onComplete: () => {
          // Animate from scattered to center
          Flip.from(state, {
            duration: 1.5,
            ease: "expo.inOut",
            stagger: 0.08,
            absolute: true,
            onComplete: () => this.zoomMainImage()
          });
        }
      });
    },

    zoomMainImage: function () {
      // 4. Fade in the center image (at the same size as scattered images)
      gsap.to(this.centerImage, {
        opacity: 1,
        duration: 0.3,
        onComplete: () => {
          // Create a timeline for synchronized animations - dolly zoom effect
          const tl = gsap.timeline();

          // 5. Expand container to fill screen while dramatically scaling down the image inside
          // This creates the "dolly zoom" effect where we move forward while zooming out
          tl.to(
            this.centerImage,
            {
              width: "100vw",
              height: "100vh",
              duration: 2.5,
              ease: "expo.inOut"
            },
            0
          ).to(
            this.centerImageImg,
            {
              scale: 1.2, //e down significantly as container grows
              duration: 2.5,
              ease: "expo.inOut",
              onComplete: () => this.revealTitle()
            },
            0
          );

          // Fade out scattered images as main image zooms in
          gsap.to(this.scatteredImages, {
            opacity: 0,
            duration: 0.5
          });
        }
      });
    },

    revealTitle: function () {
      // 6. Reveal title text and immediately start nav animation
      const titleTl = gsap.timeline();

      titleTl.to(this.titleLines, {
        y: 0,
        duration: 1.5,
        stagger: 0.25,
        ease: "expo.out",
        onStart: () => {
          // Start nav animation as title begins
          setTimeout(() => this.revealNav(), 400);
        }
      });
    },

    // Improved method to reveal navigation with smoother spread
    revealNav: function () {
      // Timeline for nav animations
      const navTl = gsap.timeline();

      // 1. First make the nav container visible
      navTl.set(".top-nav", {
        opacity: 1
      });

      // 2. Stagger in each nav item
      navTl.to(".nav-links a", {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: "power2.out"
      });

      // 3. Explicitly position each item for smooth spreading
      navTl.to(
        ".nav-links",
        {
          duration: 0.8,
          ease: "power2.inOut",
          onStart: () => {
            // Get the nav container width
            const navWidth = document.querySelector(".nav-links").offsetWidth;
            const items = document.querySelectorAll(".nav-links a");
            const count = items.length;

            // Calculate positions
            gsap.to(items[0], {
              paddingRight: 0,
              marginRight: 0,
              duration: 0.8,
              ease: "power2.inOut"
            });

            // Position middle items with calculated spacing
            for (let i = 1; i < count - 1; i++) {
              const position = (i / (count - 1)) * 100;
              gsap.to(items[i], {
                paddingRight: 0,
                marginLeft: "auto",
                marginRight: "auto",
                duration: 0.8,
                ease: "power2.inOut"
              });
            }

            // Position last item at the end
            gsap.to(items[count - 1], {
              paddingRight: 0,
              marginLeft: "auto",
              marginRight: 0,
              duration: 0.8,
              ease: "power2.inOut"
            });
          }
        },
        "+=0.1"
      );
    }
  };

  // Start the animation
  intro.init();
});