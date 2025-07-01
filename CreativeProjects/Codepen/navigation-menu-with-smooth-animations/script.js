document.addEventListener("DOMContentLoaded", function () {
  gsap.registerPlugin(ScrollTrigger);

  // Select the menu elements
  const menuOverlay = document.querySelector(".menu-overlay");
  const menuToggle = document.getElementById("menuToggle");
  const menuColumns = document.querySelectorAll(".menu-column");
  const backgroundOverlay = document.getElementById("menuBackgroundOverlay"); // New overlay element

  if (menuToggle && menuOverlay && menuColumns && backgroundOverlay) {
    // Function to handle opening and closing of the menu
    menuToggle.addEventListener("click", () => {
      if (!menuOverlay.classList.contains("active")) {
        // Open Menu
        menuOverlay.classList.add("active");
        backgroundOverlay.classList.add("active"); // Show the overlay

        // Animate the overlay to become visible
        gsap.to(menuOverlay, {
          duration: 0.5,
          opacity: 1,
          ease: "power2.out"
        });

        // Set the initial state of columns off-screen with opacity 0
        gsap.set(menuColumns, { y: -150, opacity: 0 });

        // Animate the columns into view with staggered timing
        gsap.to(menuColumns, {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1, // Stagger each column's animation
          ease: "power2.out"
        });
      } else {
        // Close Menu
        gsap.to(menuColumns, {
          y: -150, // Move up when closing
          opacity: 0,
          duration: 0.3,
          stagger: {
            each: 0.1,
            from: "end" // Close in reverse order
          },
          ease: "power2.in",
          onComplete: () => {
            menuOverlay.classList.remove("active");
            backgroundOverlay.classList.remove("active"); // Hide the overlay
            gsap.set(menuColumns, { y: -150, opacity: 0 });
            gsap.to(menuOverlay, {
              duration: 0.1,
              opacity: 0,
              ease: "power2.in"
            });
          }
        });
      }
    });
  } else {
    console.error("Menu elements are not found in the DOM.");
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const gridOverlay = document.getElementById("grid-overlay");
  const gridContainer = document.getElementById("grid-container");
  const shortcutModal = document.getElementById("shortcut-modal");
  let isVisible = true; // Change this to true or false based on your initial requirement
  let isModalVisible = false;
  let currentTheme = "light"; // Default theme
  let randomThemeIndex = 0; // Initialize the index for cycling through random themes

  // Themes list in order for cycling
  const themes = {
    light: "theme--light",
    dark: "theme--dark",
    sequential: [
      "theme--01",
      "theme--02",
      "theme--03",
      "theme--04",
      "theme--05",
      "theme--06"
    ]
  };

  function getColumns() {
    return parseInt(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--grid-columns"
      )
    );
  }

  function createGridColumns() {
    gridContainer.innerHTML = ""; // Clear existing columns
    const columns = getColumns();
    for (let i = 1; i <= columns; i++) {
      const column = document.createElement("div");
      column.className = "grid-column";
      column.innerHTML = `
      <div class="column-number">${i} <span>↴</span></div>
      <div class="column-line"></div>
    `;
      gridContainer.appendChild(column);
    }
  }

  function initializeGridVisibility() {
    if (isVisible) {
      gridOverlay.classList.add("is--visible"); // Add class if isVisible is true
    } else {
      gridOverlay.classList.remove("is--visible"); // Ensure class is removed if isVisible is false
    }
  }

  function toggleGrid() {
    isVisible = !isVisible; // Toggle the state

    if (isVisible) {
      gridOverlay.classList.add("is--visible"); // Add class if toggled to true
    } else {
      gridOverlay.classList.remove("is--visible"); // Remove class if toggled to false
    }
  }

  function handleKeyPress(event) {
    if (event.key.toLowerCase() === "g") {
      toggleGrid();
    }

    // Show modal while holding the '/' key
    if (event.key === "/") {
      showModal();
    }

    // Theme switching keys
    if (event.key.toLowerCase() === "w") {
      toggleLightDarkTheme();
    } else if (event.key.toLowerCase() === "b") {
      toggleLightDarkTheme();
    } else if (event.key.toLowerCase() === "r") {
      switchSequentialTheme(); // Cycle through themes in order
    }
  }

  function handleKeyUp(event) {
    if (event.key === "/") {
      hideModal();
    }
  }

  function toggleLightDarkTheme() {
    if (currentTheme === "dark") {
      switchToLightTheme();
    } else {
      switchToDarkTheme();
    }
  }

  function switchToLightTheme() {
    currentTheme = "light";
    document.body.className = themes.light; // Set light theme
  }

  function switchToDarkTheme() {
    currentTheme = "dark";
    document.body.className = themes.dark; // Set dark theme
  }

  function switchSequentialTheme() {
    // Get the next theme in the list
    const nextTheme = themes.sequential[randomThemeIndex];
    document.body.className = nextTheme;

    // Update the index to the next theme, wrapping back to 0 if at the end
    randomThemeIndex = (randomThemeIndex + 1) % themes.sequential.length;
  }

  function showModal() {
    if (!isModalVisible) {
      shortcutModal.classList.add("visible");
      isModalVisible = true;
    }
  }

  function hideModal() {
    if (isModalVisible) {
      shortcutModal.classList.remove("visible");
      isModalVisible = false;
    }
  }

  function handleClickOutside(event) {
    if (!shortcutModal.contains(event.target)) {
      hideModal();
    }
  }

  function handleResize() {
    createGridColumns(); // Recreate columns on resize to match new grid column settings
  }

  // Initial setup
  createGridColumns(); // Ensure grid lines are generated
  initializeGridVisibility(); // Initialize grid visibility based on isVisible
  document.addEventListener("keydown", handleKeyPress);
  document.addEventListener("keyup", handleKeyUp);
  document.addEventListener("click", handleClickOutside);
  window.addEventListener("resize", handleResize);
});