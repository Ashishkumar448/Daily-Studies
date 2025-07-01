function init() {
  // Generate checkpoints
  function generateCheckpoints() {
    const checkpoints = [0];
    for (let i = 0; i < 2; i++) {
      let newCheckpoint;
      do {
        newCheckpoint = Math.floor(
          Math.random() * (99 - checkpoints[checkpoints.length - 1]) +
            checkpoints[checkpoints.length - 1] +
            1
        );
      } while (newCheckpoint - checkpoints[checkpoints.length - 1] < 10);
      checkpoints.push(newCheckpoint);
    }
    checkpoints.push(100);
    return checkpoints;
  }

  const checkpoints = generateCheckpoints();
  const numberGrid = document.querySelector(".number-grid");
  const cursor = document.querySelector(".cursor");

  // Cursor variables
  let mouseX = 0;
  let mouseY = 0;
  let currentX = 0;
  let currentY = 0;
  let lastX = 0;
  let lastY = 0;
  let velocityX = 0;
  let velocityY = 0;
  const speed = 0.2;

  // Cursor styling setup for accurate positioning
  cursor.style.position = "absolute";
  cursor.style.pointerEvents = "none";

  // Create and add number elements
  checkpoints.forEach((number) => {
    const div = document.createElement("div");
    div.className = "grid-number magnetic-area";
    div.textContent = number;
    div.dataset.value = number;
    numberGrid.appendChild(div);
  });

  // Initialize SplitType for animation
  document.querySelectorAll(".grid-number").forEach((number) => {
    const splitText = new SplitType(number, {
      types: "chars",
      tagName: "span"
    });

    gsap.set(splitText.chars, {
      y: "100%",
      opacity: 0
    });
  });

  // Magnetic effect setup
  const magneticAreas = document.querySelectorAll(".magnetic-area");
  const strength = 0.25;

  magneticAreas.forEach((area) => {
    area.addEventListener("mousemove", (e) => {
      const rect = area.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distance = Math.sqrt(
        Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2)
      );

      if (distance < rect.width * 0.8) {
        const moveX = (e.clientX - centerX) * strength;
        const moveY = (e.clientY - centerY) * strength;

        gsap.to(area, {
          x: moveX,
          y: moveY,
          duration: 0.3,
          ease: "power2.out"
        });
      }
    });

    area.addEventListener("mouseleave", () => {
      gsap.to(area, {
        x: 0,
        y: 0,
        duration: 0.3,
        ease: "power2.out"
      });
    });
  });

  // Cursor movement and distortion
  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    gsap.to(cursor, {
      opacity: 1,
      duration: 0.2
    });
  });

  gsap.ticker.add(() => {
    // Update velocity for distortion effect
    velocityX = Math.abs(currentX - lastX);
    velocityY = Math.abs(currentY - lastY);

    lastX = currentX;
    lastY = currentY;

    // Smooth cursor position update
    currentX += (mouseX - currentX) * speed;
    currentY += (mouseY - currentY) * speed;

    // Distortion effect based on velocity
    const totalVelocity = (velocityX + velocityY) * 0.5;
    const scaleX = gsap.utils.clamp(0.9, 1.3, 1 + velocityX * 0.1);
    const scaleY = gsap.utils.clamp(0.9, 1.3, 1 + velocityY * 0.1);

    gsap.set(cursor, {
      x: currentX,
      y: currentY,
      scaleX: scaleX,
      scaleY: scaleY,
      rotation: totalVelocity * 0.4
    });
  });

  document.addEventListener("mouseleave", () => {
    gsap.to(cursor, {
      opacity: 0,
      duration: 0.2
    });
  });

  // Track active number and update visuals
  let currentActive = null;

  function getActiveNumber(progress) {
    const targetValue = progress * 100;
    let activeNumber = null;

    for (let i = 0; i < checkpoints.length; i++) {
      if (targetValue >= checkpoints[i]) {
        activeNumber = checkpoints[i];
      }
    }
    return activeNumber;
  }

  function updateNumbers(progress) {
    const activeValue = getActiveNumber(progress);

    // Return early if the active value hasn't changed
    if (currentActive === activeValue) return;

    // Animate the previous active number out of view
    if (currentActive !== null) {
      const prevNumber = document.querySelector(
        `[data-value="${currentActive}"]`
      );
      if (prevNumber) {
        gsap.to(prevNumber.querySelectorAll(".char"), {
          y: "-100%",
          opacity: 0,
          duration: 0.4,
          stagger: 0.03,
          ease: "power2.in"
        });
      }
    }

    // Animate the new active number into view
    if (activeValue !== null) {
      const activeNumber = document.querySelector(
        `[data-value="${activeValue}"]`
      );
      if (activeNumber) {
        gsap.to(activeNumber.querySelectorAll(".char"), {
          y: "0%",
          opacity: 1,
          duration: 0.5,
          stagger: 0.03,
          ease: "power2.out"
        });
      }
    }

    // Update the current active value
    currentActive = activeValue;
  }

  // Loading animation for numbers
  gsap.to(
    {},
    {
      duration: 3,
      onUpdate: function () {
        updateNumbers(this.progress());
      },
      onComplete: () => {
        setTimeout(() => {
          const lastNumber = document.querySelector(`[data-value="100"]`);
          if (lastNumber) {
            gsap.to(lastNumber.querySelectorAll(".char"), {
              y: "-100%",
              opacity: 0,
              duration: 0.5,
              stagger: 0.03,
              ease: "power2.in",
              onComplete: () => {
                gsap.set(".content", { visibility: "visible" });
                gsap.to(".content", {
                  opacity: 1,
                  duration: 0.5
                });
              }
            });
          }
        }, 1000);
      }
    }
  );
}

document.addEventListener("DOMContentLoaded", init);