document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("container");
  const bgCards = document.querySelectorAll(".bg-card");
  const fgCards = document.querySelectorAll(".fg-card");
  const numCards = bgCards.length;
  const timeElement = document.getElementById("current-time");
  const dateElement = document.getElementById("current-date");
  const bgGrid = document.getElementById("bgGrid");

  let activeIndex = 0;
  let rotationTimelines = [];
  let sequenceInterval;
  let riddleSolution = [];

  // Initialize secure riddle data
  function initializeRiddleData() {
    const seed = Date.now() % 1000;
    for (let i = 0; i < 9; i++) {
      riddleSolution.push((seed * (i + 1)) % 360);
    }
  }

  // Generate the background grid
  function generateGrid() {
    // Riddle content (numerical sequence and patterns)
    const riddleItems = [
      {
        content: "0, 1, 1, 2, 3, 5, 8, 13, 21, 34...",
        class: "riddleHint",
        gridColumn: "1 / span 4",
        gridRow: "1 / span 1"
      },
      {
        content: "1.618033988749895...",
        class: "riddleHint",
        gridColumn: "9 / span 4",
        gridRow: "2 / span 1"
      },
      {
        content: "∞ = ∞ + 1",
        class: "",
        gridColumn: "6 / span 2",
        gridRow: "4 / span 1"
      },
      {
        content: "SEARCH FOR THE PATTERN",
        class: "",
        gridColumn: "3 / span 4",
        gridRow: "6 / span 1"
      },
      {
        content: "ROTATE 9 TIMES TO RETURN",
        class: "",
        gridColumn: "8 / span 3",
        gridRow: "8 / span 1"
      },
      {
        content: "13 GATES TO NOWHERE",
        class: "riddleHint",
        gridColumn: "2 / span 3",
        gridRow: "10 / span 1"
      },
      {
        content: "LOOK BEYOND THE SPIRAL",
        class: "",
        gridColumn: "8 / span 4",
        gridRow: "11 / span 1"
      }
    ];

    // Generate random numbers and text
    for (let row = 1; row <= 12; row++) {
      for (let col = 1; col <= 12; col++) {
        // Skip cells that are part of riddle items
        if (
          riddleItems.some((item) => {
            const colStart = parseInt(item.gridColumn.split("/")[0]);
            const colSpan = parseInt(item.gridColumn.split("span ")[1]);
            const rowStart = parseInt(item.gridRow.split("/")[0]);
            const rowSpan = parseInt(item.gridRow.split("span ")[1]);

            return (
              col >= colStart &&
              col < colStart + colSpan &&
              row >= rowStart &&
              row < rowStart + rowSpan
            );
          })
        ) {
          continue;
        }

        // Create grid item with random content
        const gridItem = document.createElement("div");
        gridItem.className = "grid-item";

        // 80% chance for content, 20% for empty space
        if (Math.random() < 0.8) {
          // Different types of content
          const contentType = Math.floor(Math.random() * 4);
          switch (contentType) {
            case 0: // Binary
              gridItem.textContent = Array.from({ length: 8 }, () =>
                Math.round(Math.random())
              ).join("");
              break;
            case 1: // Hex
              gridItem.textContent = Array.from({ length: 4 }, () =>
                Math.floor(Math.random() * 16).toString(16)
              )
                .join("")
                .toUpperCase();
              break;
            case 2: // Decimal
              gridItem.textContent = Math.floor(
                Math.random() * 1000
              ).toString();
              break;
            case 3: // Symbols
              const symbols = [
                "/",
                "\\",
                "|",
                "-",
                "+",
                "*",
                ".",
                ":",
                ";",
                "?",
                "!",
                "@",
                "#",
                "$",
                "%",
                "^",
                "&"
              ];
              gridItem.textContent = Array.from(
                { length: 5 },
                () => symbols[Math.floor(Math.random() * symbols.length)]
              ).join("");
              break;
          }
        }

        gridItem.style.gridColumn = col;
        gridItem.style.gridRow = row;
        bgGrid.appendChild(gridItem);
      }
    }

    // Add the predefined riddle items
    riddleItems.forEach((item) => {
      const gridItem = document.createElement("div");
      gridItem.className = `grid-item ${item.class}`;
      gridItem.textContent = item.content;
      gridItem.style.gridColumn = item.gridColumn;
      gridItem.style.gridRow = item.gridRow;
      bgGrid.appendChild(gridItem);
    });
  }

  // Update clock and check for special patterns
  function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    timeElement.textContent = `${hours}:${minutes}:${seconds}`;

    // Update date
    const months = [
      "JANUARY",
      "FEBRUARY",
      "MARCH",
      "APRIL",
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER",
      "NOVEMBER",
      "DECEMBER"
    ];
    const month = months[now.getMonth()];
    const day = now.getDate();
    const year = now.getFullYear();

    dateElement.textContent = `${month} ${day}, ${year}`;

    // Check for special times (pattern matching)
    const timeValue = parseInt(hours) + parseInt(minutes);
    if (isFibonacciNumber(timeValue)) {
      handleSpecialTime();
    }
  }

  // Check if a number is in the Fibonacci sequence
  function isFibonacciNumber(num) {
    // Perfect squares for 5n²+4 or 5n²-4
    function isPerfectSquare(x) {
      const s = Math.sqrt(x);
      return s === Math.floor(s);
    }

    return (
      isPerfectSquare(5 * num * num + 4) || isPerfectSquare(5 * num * num - 4)
    );
  }

  // Handle special time events
  function handleSpecialTime() {
    // Temporarily show a specific image
    const originalIndex = activeIndex;

    // Show the golden ratio image (5th image)
    pauseAnimation();
    activeIndex = 4;

    // Update cards
    fgCards.forEach((card, index) => {
      gsap.set(card, {
        opacity: index === activeIndex ? 1 : 0
      });
      card.classList.toggle("active", index === activeIndex);
    });

    // Resume normal sequence after 1.618 seconds (golden ratio)
    setTimeout(() => {
      activeIndex = originalIndex;
      resumeAnimation();
    }, 1618);
  }

  // Update time every second
  setInterval(updateTime, 1000);
  updateTime(); // Initial update

  // Initialize the gallery
  function initializeGallery() {
    // Initialize secure riddle data
    initializeRiddleData();

    // Generate background grid
    generateGrid();

    // Setup background cards with random rotations
    setupBackgroundCards();

    // Setup foreground cards sequence
    setupForegroundCards();

    // Start the sequence
    startSequence();
  }

  // Setup background cards with random rotations
  function setupBackgroundCards() {
    bgCards.forEach((card, index) => {
      // Random initial angle
      const initialAngle = Math.random() * 360;
      const initialScale = 0.75 + Math.random() * 0.25;

      gsap.set(card, {
        rotate: initialAngle,
        scale: initialScale
      });

      // Create random rotation animation for each background card (faster)
      const rotationSpeed = 5 + Math.random() * 10; // Between 5 and 15 seconds for a full rotation
      const rotationDirection = Math.random() > 0.5 ? 1 : -1;

      const timeline = gsap.timeline({ repeat: -1 });
      timeline.to(card, {
        rotate: `+=${360 * rotationDirection}`,
        duration: rotationSpeed,
        ease: "none"
      });

      rotationTimelines.push(timeline);
    });
  }

  // Setup foreground cards sequence
  function setupForegroundCards() {
    fgCards.forEach((card, index) => {
      // All cards start invisible except the first one
      gsap.set(card, {
        opacity: index === 0 ? 1 : 0
      });

      // Add active class to the first card
      if (index === 0) {
        card.classList.add("active");
      }
    });
  }

  // Switch to the next foreground card
  function nextCard() {
    // Remove active class from current card
    fgCards[activeIndex].classList.remove("active");

    // Hide current card immediately
    gsap.set(fgCards[activeIndex], {
      opacity: 0
    });

    // Update active index
    activeIndex = (activeIndex + 1) % numCards;

    // Add active class to new card
    fgCards[activeIndex].classList.add("active");

    // Show new card immediately
    gsap.set(fgCards[activeIndex], {
      opacity: 1
    });

    // Secret pattern detection (for the riddle)
    if (activeIndex === 4) {
      checkPatternProgress();
    }
  }

  // Track progress in the pattern for the riddle
  function checkPatternProgress() {
    // This function runs when specific conditions are met
    // but doesn't expose the solution directly
    const currentAngle = gsap.getProperty(bgCards[4], "rotate") % 360;

    // Check against riddleSolution without exposing it
    if (Math.abs(currentAngle - riddleSolution[4]) < 5) {
      // Subtle visual indicator when alignment happens
      gsap.to(bgCards, {
        duration: 0.2,
        opacity: 0.9,
        yoyo: true,
        repeat: 1
      });
    }
  }

  // Start the sequence
  function startSequence() {
    // Change foreground card every 0.5 seconds (faster)
    sequenceInterval = setInterval(nextCard, 500);
  }

  // Pause animation on hover
  function pauseAnimation() {
    // Pause background rotations
    rotationTimelines.forEach((timeline) => {
      timeline.pause();
    });

    // Pause foreground sequence
    clearInterval(sequenceInterval);
  }

  // Resume animation on mouse leave
  function resumeAnimation() {
    // Resume background rotations
    rotationTimelines.forEach((timeline) => {
      timeline.play();
    });

    // Resume foreground sequence
    startSequence();
  }

  // Add hover event listeners
  container.addEventListener("mouseenter", pauseAnimation);
  container.addEventListener("mouseleave", resumeAnimation);

  // Initialize the gallery
  initializeGallery();
});