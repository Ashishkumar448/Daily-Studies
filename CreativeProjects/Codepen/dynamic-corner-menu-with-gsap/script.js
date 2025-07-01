document.addEventListener("DOMContentLoaded", () => {
  // Menu elements
  const menuItems = document.querySelectorAll(".menu-item");
  const cornersContainer = document.querySelector(".corners-container");
  const corners = document.querySelectorAll(".corner");
  const gridContainer = document.getElementById("gridContainer");

  // Settings elements
  const columnsInput = document.getElementById("columnsInput");
  const rowsInput = document.getElementById("rowsInput");
  const applyButton = document.getElementById("applySettings");

  // Grid setup function
  function setupGrid(columns, rows) {
    gridContainer.innerHTML = "";

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const columnWidth = Math.floor(windowWidth / columns);
    const rowHeight = Math.floor(windowHeight / rows);

    // Create vertical lines
    for (let i = 1; i < columns; i++) {
      const line = document.createElement("div");
      line.className = "grid-line vertical";
      line.style.left = `${i * columnWidth}px`;
      gridContainer.appendChild(line);
    }

    // Create horizontal lines
    for (let i = 1; i < rows; i++) {
      const line = document.createElement("div");
      line.className = "grid-line horizontal";
      line.style.top = `${i * rowHeight}px`;
      gridContainer.appendChild(line);
    }

    // Create intersection points
    for (let i = 1; i < rows; i++) {
      for (let j = 1; j < columns; j++) {
        const point = document.createElement("div");
        point.className = "intersection-point";
        point.textContent = "+";
        point.style.left = `${j * columnWidth}px`;
        point.style.top = `${i * rowHeight}px`;
        gridContainer.appendChild(point);
      }
    }
  }

  // Menu animation function
  function animateCorners(item) {
    const link = item.querySelector(".menu-link");
    const linkRect = link.getBoundingClientRect();
    const containerRect = document
      .querySelector(".menu-container")
      .getBoundingClientRect();

    gsap.to(cornersContainer, {
      opacity: 1,
      top: linkRect.top - containerRect.top,
      left: linkRect.left - containerRect.left,
      width: linkRect.width,
      height: linkRect.height,
      duration: 0.4,
      ease: "power2.out"
    });

    gsap.to(corners, {
      opacity: 1,
      scale: 1,
      rotation: 0,
      duration: 0.4,
      stagger: {
        each: 0.05,
        from: "random"
      },
      ease: "back.out(1.7)"
    });
  }

  // Menu event listeners
  menuItems.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      gsap.set(corners, { rotation: gsap.utils.random(-90, 90) });
      animateCorners(item);
    });
  });

  document
    .querySelector(".menu-container")
    .addEventListener("mouseleave", () => {
      gsap.to(corners, {
        opacity: 0,
        scale: 0,
        rotation: gsap.utils.random(-90, 90),
        duration: 0.3,
        stagger: {
          each: 0.05,
          from: "random"
        },
        ease: "back.in(1.7)"
      });

      gsap.to(cornersContainer, {
        opacity: 0,
        duration: 0.3
      });
    });

  // Settings event listener
  applyButton.addEventListener("click", () => {
    const columns = Math.min(
      Math.max(parseInt(columnsInput.value) || 12, 2),
      24
    );
    const rows = Math.min(Math.max(parseInt(rowsInput.value) || 4, 2), 12);

    columnsInput.value = columns;
    rowsInput.value = rows;

    setupGrid(columns, rows);
  });

  // Initial setup
  gsap.set(cornersContainer, { opacity: 0 });
  gsap.set(corners, { opacity: 0, scale: 0 });
  setupGrid(12, 4);

  // Handle window resize
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      setupGrid(parseInt(columnsInput.value), parseInt(rowsInput.value));
    }, 100);
  });
});