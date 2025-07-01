document.addEventListener("DOMContentLoaded", function () {
  // Core elements
  const scrollWrapper = document.querySelector(".scroll-wrapper");
  const sections = document.querySelectorAll("section");
  const progressBar = document.querySelector(".progress-bar");
  const footerLinks = document.querySelectorAll(".footer-link");

  // Cursor elements
  const cursor = document.querySelector(".cursor-dot");
  const cursorOuter = document.querySelector(".cursor-outer");

  // Basic variables
  let currentPosition = 0;
  const maxScroll = scrollWrapper.scrollWidth - window.innerWidth;
  let mouseX = 0;
  let mouseY = 0;
  let cursorX = 0;
  let cursorY = 0;
  let cursorOuterX = 0;
  let cursorOuterY = 0;

  // Horizontal scroll function
  function scrollHorizontal(e) {
    e.preventDefault();

    currentPosition += e.deltaY;

    // Boundaries
    if (currentPosition < 0) currentPosition = 0;
    if (currentPosition > maxScroll) currentPosition = maxScroll;

    // Apply directly
    scrollWrapper.style.transform = "translateX(-" + currentPosition + "px)";
    progressBar.style.width = (currentPosition / maxScroll) * 100 + "%";

    // Check active section
    const middle = window.innerWidth / 2;
    sections.forEach((section, i) => {
      const rect = section.getBoundingClientRect();
      if (rect.left <= middle && rect.right >= middle) {
        sections.forEach((s) => s.classList.remove("active"));
        section.classList.add("active");

        footerLinks.forEach((link, j) => {
          link.classList.toggle("active", i === j);
        });
      }
    });

    updateParallax();

    return false;
  }

  // Direct wheel event
  document.addEventListener("wheel", scrollHorizontal, { passive: false });

  // Update parallax effects
  function updateParallax() {
    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const shapes = section.querySelectorAll(".parallax-shape");
      const particles = section.querySelectorAll(".particle");

      const distanceFromCenter =
        rect.left - (window.innerWidth / 2 - rect.width / 2);
      const ratio = distanceFromCenter / window.innerWidth;

      if (shapes.length) {
        shapes[0].style.transform = `translateX(${ratio * -100}px)`;
        shapes[1].style.transform = `translateX(${ratio * 150}px)`;
      }

      particles.forEach((particle) => {
        const depth = parseFloat(particle.dataset.depth || 2);
        particle.style.transform = `translateX(${
          -distanceFromCenter / depth
        }px)`;
      });
    });
  }

  // Footer navigation
  footerLinks.forEach((link, index) => {
    link.addEventListener("click", function () {
      let pos = 0;
      for (let i = 0; i < index; i++) {
        pos += sections[i].offsetWidth;
      }

      currentPosition = pos;
      scrollWrapper.style.transform = "translateX(-" + currentPosition + "px)";
      progressBar.style.width = (currentPosition / maxScroll) * 100 + "%";

      sections.forEach((s, i) => s.classList.toggle("active", i === index));
      footerLinks.forEach((l, i) => l.classList.toggle("active", i === index));

      updateParallax();
    });
  });

  // Custom cursor
  document.addEventListener("mousemove", function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function updateCursor() {
    cursorX += (mouseX - cursorX) * 0.2;
    cursorY += (mouseY - cursorY) * 0.2;
    cursorOuterX += (mouseX - cursorOuterX) * 0.1;
    cursorOuterY += (mouseY - cursorOuterY) * 0.1;

    cursor.style.left = cursorX + "px";
    cursor.style.top = cursorY + "px";
    cursorOuter.style.left = cursorOuterX + "px";
    cursorOuter.style.top = cursorOuterY + "px";

    requestAnimationFrame(updateCursor);
  }

  updateCursor();

  // Initialize particles for parallax effect
  function createParticles() {
    const containers = document.querySelectorAll(".particles-container");

    containers.forEach((container) => {
      for (let i = 0; i < 10; i++) {
        const particle = document.createElement("div");
        particle.classList.add("particle");

        const size = Math.random() * 4 + 2;
        particle.style.width = size + "px";
        particle.style.height = size + "px";

        particle.style.left = Math.random() * 100 + "%";
        particle.style.top = Math.random() * 100 + "%";
        particle.style.opacity = Math.random() * 0.4 + 0.1;

        // Store parallax depth
        particle.dataset.depth = (Math.random() * 3 + 1).toString();

        container.appendChild(particle);
      }
    });
  }

  // Initialize
  setTimeout(function () {
    document.querySelector(".overlay").classList.add("hidden");
    document.getElementById("section1").classList.add("active");
    footerLinks[0].classList.add("active");
    createParticles();
    updateParallax();
  }, 1200);
});