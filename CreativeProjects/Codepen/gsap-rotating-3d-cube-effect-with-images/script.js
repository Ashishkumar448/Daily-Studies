const cube = document.querySelector(".cube");
let isRotating = true;
let rotationX = 0;
let animationId;

// Animation state variables
let phase = 0; // 0-3: forward phases, 4-7: backward phases
let phaseDuration = 2.5; // seconds per phase (slightly faster transitions)
let phaseTime = 0;
let direction = 1;

function toggleRotation() {
  isRotating = !isRotating;
  if (isRotating) {
    animate();
  } else {
    cancelAnimationFrame(animationId);
  }
}

function changeRotation() {
  // Force a phase change to the opposite direction
  if (phase < 4) {
    phase = 4;
  } else {
    phase = 0;
  }
  phaseTime = 0;
}

// Various easing functions for different phases
function easeInQuad(t) {
  return t * t;
}
function easeOutQuad(t) {
  return t * (2 - t);
}
function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function getSpeedForPhase(phaseNumber, normalizedTime) {
  const slowSpeed = 0.3; // Slightly faster than before
  const mediumSpeed = 1.5; // 50% faster
  const fastSpeed = 5.0; // Significantly faster

  switch (phaseNumber) {
    case 0: // Slow start
      return slowSpeed;
    case 1: // Medium speed
      return slowSpeed + (mediumSpeed - slowSpeed) * easeInQuad(normalizedTime);
    case 2: // Getting really fast
      return (
        mediumSpeed + (fastSpeed - mediumSpeed) * easeInQuad(normalizedTime)
      );
    case 3: // Slowing down with easing
      return fastSpeed * easeOutQuad(1 - normalizedTime);
    case 4: // Reversed direction: Start fast
      return fastSpeed;
    case 5: // Slowing down
      return fastSpeed * easeOutQuad(1 - normalizedTime);
    case 6: // Getting faster again
      return slowSpeed + (fastSpeed - slowSpeed) * easeInQuad(normalizedTime);
    case 7: // Final slow down before repeating
      return fastSpeed * easeOutQuad(1 - normalizedTime);
  }
  return mediumSpeed; // Default fallback
}

let lastTimestamp = 0;
function animate(timestamp = 0) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const deltaTime = (timestamp - lastTimestamp) / 1000; // time in seconds
  lastTimestamp = timestamp;

  // Update phase timing
  phaseTime += deltaTime;
  if (phaseTime >= phaseDuration) {
    phaseTime = 0;
    phase = (phase + 1) % 8;

    // Change direction when transitioning from phase 3 to 4
    if (phase === 4) {
      direction = -1;
    } else if (phase === 0) {
      direction = 1;
    }
  }

  // Get normalized time within current phase (0 to 1)
  const normalizedTime = phaseTime / phaseDuration;

  // Calculate speed based on current phase and time
  const speed = getSpeedForPhase(phase, normalizedTime);

  // Apply rotation
  rotationX += speed * direction;
  cube.style.transform = `rotateX(${rotationX}deg) rotateY(0deg)`;
  cube.style.transformOrigin = "center center";

  animationId = requestAnimationFrame(animate);
}

// Override the CSS animation with JavaScript for control
cube.style.animation = "none";
animate();