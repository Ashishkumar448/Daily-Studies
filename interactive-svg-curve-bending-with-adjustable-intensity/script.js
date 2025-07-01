document.addEventListener("DOMContentLoaded", function () {
  const path = document.getElementById("curve");
  const container = document.querySelector(".divider__body"); // Reference to the container
  let progress = 0;
  let x = 0.5;
  let time = Math.PI / 2;
  let reqId = null;

  // Customizable bend intensity (Default value)
  let maxBendIntensity = 100;

  // Function to set the SVG path based on progress
  const setPath = (progress) => {
    const width = container.clientWidth; // Use container width
    path.setAttribute(
      "d",
      `M0 250 Q${width * x} ${250 + progress}, ${width} 250`
    );
  };

  // Linear interpolation function to smooth transitions
  const lerp = (x, y, a) => x * (1 - a) + y * a;

  // Handle mouse enter: cancel any ongoing animations
  const manageMouseEnter = () => {
    if (reqId) {
      cancelAnimationFrame(reqId);
      resetAnimation();
    }
  };

  // Handle mouse movement: adjust the path based on movement
  const manageMouseMove = (e) => {
    const { movementY, clientX } = e;
    const pathBound = path.getBoundingClientRect();
    x = (clientX - pathBound.left) / pathBound.width;
    progress += (movementY * maxBendIntensity) / 100; // Apply bend intensity
    setPath(progress);
  };

  // Handle mouse leave: start the animation to reset the path
  const manageMouseLeave = () => {
    animateOut();
  };

  // Animation to smoothly reset the path to its original position
  const animateOut = () => {
    const newProgress = progress * Math.sin(time);
    progress = lerp(progress, 0, 0.025);
    time += 0.2;
    setPath(newProgress);
    if (Math.abs(progress) > 0.75) {
      reqId = requestAnimationFrame(animateOut);
    } else {
      resetAnimation();
    }
  };

  // Reset the path to its original state
  const resetAnimation = () => {
    time = Math.PI / 2;
    progress = 0;
    setPath(progress);
  };

  // Event listener for mouse enter
  document
    .querySelector(".divider__box")
    .addEventListener("mouseenter", manageMouseEnter);

  // Event listener for mouse movement
  document
    .querySelector(".divider__box")
    .addEventListener("mousemove", manageMouseMove);

  // Event listener for mouse leave
  document
    .querySelector(".divider__box")
    .addEventListener("mouseleave", manageMouseLeave);

  // Initial path setup
  setPath(progress);

  // Adding GUI using dat.GUI
  const gui = new dat.GUI();
  const controls = {
    bendIntensity: maxBendIntensity
  };

  gui
    .add(controls, "bendIntensity", 0, 200)
    .name("Bend Intensity")
    .onChange(function (value) {
      maxBendIntensity = value;
    });
});