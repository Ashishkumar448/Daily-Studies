document.addEventListener("DOMContentLoaded", function () {
  // Initial default words
  const defaultWords = [
    "CREATIVE",
    "AMBITION",
    "FOUNDATION",
    "PASSIONATE",
    "DESIGN"
  ];

  // Constants
  const gridSize = 12;
  const maxWords = 5;
  const maxWordLength = 12;

  // DOM elements
  const commaInput = document.querySelector(".comma-input");
  const generateBtn = document.querySelector(".generate-btn");
  const crosswordEl = document.getElementById("crossword");

  // Set default value in input field
  commaInput.value = defaultWords.join(", ");

  // Generate initial crossword
  generateCrossword(defaultWords);

  // Event listener for generate button
  generateBtn.addEventListener("click", () => {
    // Get words from input
    let newWords = [];

    if (commaInput.value.trim()) {
      newWords = commaInput.value
        .split(",")
        .map((word) => word.trim().toUpperCase())
        .filter((word) => word.length > 0 && word.length <= maxWordLength)
        .slice(0, maxWords);
    } else {
      newWords = [...defaultWords];
    }

    // Verify we have at least one word
    if (newWords.length === 0) {
      alert("Please enter at least one word");
      return;
    }

    // Animate out existing cells
    fadeOutGrid(() => {
      // Generate new crossword when animation completes
      generateCrossword(newWords);
    });
  });

  // Utility function to shuffle an array
  function shuffleArray(array) {
    const newArray = [...array]; // Create a copy to avoid modifying the original
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; // Swap elements
    }
    return newArray;
  }

  // Function to fade out the existing grid
  function fadeOutGrid(callback) {
    const cells = document.querySelectorAll(".cell");

    // No cells to animate out
    if (cells.length === 0) {
      callback();
      return;
    }

    let cellsRemaining = cells.length;

    // Fade out cells with staggered delay
    cells.forEach((cell, index) => {
      const delay = Math.random() * 300; // Random delay up to 300ms

      setTimeout(() => {
        cell.style.opacity = "0";

        // Check if all cells have been processed
        cellsRemaining--;
        if (cellsRemaining === 0) {
          setTimeout(callback, 300); // Wait for fade out to complete
        }
      }, delay);
    });
  }

  // Function to generate a new crossword
  function generateCrossword(words) {
    // Clear the crossword
    crosswordEl.innerHTML = "";

    // Initialize empty grid
    const grid = [];
    for (let i = 0; i < gridSize; i++) {
      grid[i] = [];
      for (let j = 0; j < gridSize; j++) {
        grid[i][j] = { letter: "", words: [], visible: true };
      }
    }

    // Make sure words are uppercase for consistency
    const uppercaseWords = words.map((word) => word.trim().toUpperCase());
    console.log("Attempting to place words:", uppercaseWords);

    // Shuffle the words for random placement order each time
    const shuffledWords = shuffleArray([...uppercaseWords]);

    // Create word objects
    const wordObjects = shuffledWords.map((word, index) => ({
      word,
      // Randomize direction for each word
      direction: Math.random() > 0.5 ? "horizontal" : "vertical",
      id: `word-${index}`
    }));

    // Place words on the grid
    const placedWords = placeWordsOnGrid(wordObjects, grid);
    console.log("Successfully placed words:", placedWords);

    // Check if all words were placed
    if (placedWords.length < uppercaseWords.length) {
      console.log("Not all words were placed. Retrying...");
      // Retry with a new grid if not all words were placed
      return generateCrossword(words);
    }

    // Fill remaining cells with random letters
    fillRemainingCells(grid);

    // Verify that all words are correctly placed on the grid
    const verificationResult = verifyWordPlacement(shuffledWords, grid);
    if (!verificationResult.success) {
      console.error("Word verification failed:", verificationResult.message);
      // Retry if verification fails
      return generateCrossword(words);
    }

    // Render the grid
    renderGrid(grid);

    // Fade in the cells
    fadeInGrid();
  }

  // Function to verify that all words are correctly placed on the grid
  function verifyWordPlacement(words, grid) {
    for (const word of words) {
      let found = false;

      // Check horizontal words
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col <= gridSize - word.length; col++) {
          const candidate = [];
          for (let i = 0; i < word.length; i++) {
            candidate.push(grid[row][col + i].letter);
          }
          if (candidate.join("") === word) {
            found = true;
            break;
          }
        }
        if (found) break;
      }

      // Check vertical words if not found horizontally
      if (!found) {
        for (let col = 0; col < gridSize; col++) {
          for (let row = 0; row <= gridSize - word.length; row++) {
            const candidate = [];
            for (let i = 0; i < word.length; i++) {
              candidate.push(grid[row + i][col].letter);
            }
            if (candidate.join("") === word) {
              found = true;
              break;
            }
          }
          if (found) break;
        }
      }

      if (!found) {
        return { success: false, message: `Word "${word}" not found in grid` };
      }
    }

    return { success: true };
  }

  // Function to fade in the grid
  function fadeInGrid() {
    const cells = document.querySelectorAll(".cell");

    // Set initial state
    cells.forEach((cell) => {
      cell.style.opacity = "0";
    });

    // Fade in cells with staggered delay
    cells.forEach((cell, index) => {
      const delay = Math.random() * 300; // Random delay up to 300ms

      setTimeout(() => {
        cell.style.opacity = "1";
      }, delay);
    });
  }

  // Function to place words on the grid
  function placeWordsOnGrid(wordObjects, grid) {
    if (wordObjects.length === 0) return [];

    const placedWords = [];
    const placementAttempts = 10; // Max attempts per word

    // Place first word in a random position instead of center
    const firstWord = wordObjects[0];
    let firstWordPlaced = false;

    // Try multiple random positions for first word
    for (
      let attempt = 0;
      attempt < placementAttempts && !firstWordPlaced;
      attempt++
    ) {
      // Generate random position
      let row, col;
      if (firstWord.direction === "horizontal") {
        row = Math.floor(Math.random() * gridSize);
        col = Math.floor(
          Math.random() * (gridSize - firstWord.word.length + 1)
        );
      } else {
        row = Math.floor(
          Math.random() * (gridSize - firstWord.word.length + 1)
        );
        col = Math.floor(Math.random() * gridSize);
      }

      if (
        placeWord(
          firstWord.word,
          row,
          col,
          firstWord.direction,
          firstWord.id,
          grid
        )
      ) {
        placedWords.push(firstWord.word);
        firstWordPlaced = true;
      }
    }

    // Fallback to center if random placements failed
    if (!firstWordPlaced) {
      const centerRow = Math.floor(gridSize / 2);
      const centerCol = Math.floor((gridSize - firstWord.word.length) / 2);

      if (
        placeWord(
          firstWord.word,
          centerRow,
          centerCol,
          firstWord.direction,
          firstWord.id,
          grid
        )
      ) {
        placedWords.push(firstWord.word);
      } else {
        console.error("Failed to place first word:", firstWord.word);
        return placedWords;
      }
    }

    // Place remaining words
    for (let i = 1; i < wordObjects.length; i++) {
      const wordObj = wordObjects[i];
      let placed = false;

      // First try to find intersections
      const intersections = findIntersections(
        wordObj.word,
        wordObj.direction,
        grid
      );

      // Try intersection points
      for (
        let j = 0;
        j < Math.min(intersections.length, placementAttempts) && !placed;
        j++
      ) {
        const intersection = intersections[j];
        if (
          placeWord(
            wordObj.word,
            intersection.row,
            intersection.col,
            wordObj.direction,
            wordObj.id,
            grid
          )
        ) {
          placedWords.push(wordObj.word);
          placed = true;
          break;
        }
      }

      // If no intersection works, try alternative direction
      if (!placed) {
        const altDirection =
          wordObj.direction === "horizontal" ? "vertical" : "horizontal";
        const altIntersections = findIntersections(
          wordObj.word,
          altDirection,
          grid
        );

        for (
          let j = 0;
          j < Math.min(altIntersections.length, placementAttempts) && !placed;
          j++
        ) {
          const intersection = altIntersections[j];
          if (
            placeWord(
              wordObj.word,
              intersection.row,
              intersection.col,
              altDirection,
              wordObj.id,
              grid
            )
          ) {
            placedWords.push(wordObj.word);
            placed = true;
            break;
          }
        }
      }

      // Last resort: try completely random positions
      if (!placed) {
        for (
          let attempt = 0;
          attempt < placementAttempts && !placed;
          attempt++
        ) {
          let row, col;
          const tryDirection =
            Math.random() > 0.5
              ? wordObj.direction
              : wordObj.direction === "horizontal"
              ? "vertical"
              : "horizontal";

          if (tryDirection === "horizontal") {
            row = Math.floor(Math.random() * gridSize);
            col = Math.floor(
              Math.random() * (gridSize - wordObj.word.length + 1)
            );
          } else {
            row = Math.floor(
              Math.random() * (gridSize - wordObj.word.length + 1)
            );
            col = Math.floor(Math.random() * gridSize);
          }

          if (
            placeWord(wordObj.word, row, col, tryDirection, wordObj.id, grid)
          ) {
            placedWords.push(wordObj.word);
            placed = true;
            break;
          }
        }
      }

      if (!placed) {
        console.error("Failed to place word:", wordObj.word);
      }
    }

    return placedWords;
  }

  // Function to find potential intersections for a word
  function findIntersections(word, direction, grid) {
    const intersections = [];
    const wordChars = word.split("");

    // Loop through grid to find potential intersections
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // Skip empty cells
        if (grid[row][col].letter === "") continue;

        // Check if this letter appears in our word
        wordChars.forEach((char, index) => {
          if (char === grid[row][col].letter) {
            let startRow, startCol;

            if (direction === "horizontal") {
              startRow = row;
              startCol = col - index;
            } else {
              startRow = row - index;
              startCol = col;
            }

            // Check if word fits on the grid
            if (
              direction === "horizontal" &&
              (startCol < 0 || startCol + word.length > gridSize)
            ) {
              return; // Skip this position - word doesn't fit horizontally
            }

            if (
              direction === "vertical" &&
              (startRow < 0 || startRow + word.length > gridSize)
            ) {
              return; // Skip this position - word doesn't fit vertically
            }

            // Check for conflicts
            let hasConflict = false;
            for (let i = 0; i < word.length; i++) {
              const checkRow =
                direction === "horizontal" ? startRow : startRow + i;
              const checkCol =
                direction === "horizontal" ? startCol + i : startCol;

              // Skip if out of bounds
              if (
                checkRow < 0 ||
                checkRow >= gridSize ||
                checkCol < 0 ||
                checkCol >= gridSize
              ) {
                hasConflict = true;
                break;
              }

              // Skip the intersection point
              if (checkRow === row && checkCol === col) continue;

              // Check if cell has a different letter
              if (
                grid[checkRow][checkCol].letter !== "" &&
                grid[checkRow][checkCol].letter !== word[i]
              ) {
                hasConflict = true;
                break;
              }
            }

            if (!hasConflict) {
              intersections.push({
                row: startRow,
                col: startCol,
                quality: Math.random() // Random quality for varied placements
              });
            }
          }
        });
      }
    }

    // Sort by random quality for varied placements
    return intersections.sort((a, b) => b.quality - a.quality);
  }

  // Function to place a word on the grid
  function placeWord(word, row, col, direction, id, grid) {
    // Validate the input parameters
    if (row < 0 || col < 0 || row >= gridSize || col >= gridSize) {
      return false; // Out of bounds
    }

    // Make sure the word fits on the grid
    if (direction === "horizontal" && col + word.length > gridSize) {
      return false;
    }
    if (direction === "vertical" && row + word.length > gridSize) {
      return false;
    }

    // Check for conflicts - make sure we can place the word here
    for (let i = 0; i < word.length; i++) {
      const currentRow = direction === "horizontal" ? row : row + i;
      const currentCol = direction === "horizontal" ? col + i : col;

      // If cell already has a letter, make sure it matches
      if (
        grid[currentRow][currentCol].letter !== "" &&
        grid[currentRow][currentCol].letter !== word[i]
      ) {
        return false; // Conflict with existing letter
      }
    }

    // At this point, we can safely place the word
    const startCoord = `${row}-${col}`;

    // Place each letter of the word
    for (let i = 0; i < word.length; i++) {
      const letter = word[i];
      const currentRow = direction === "horizontal" ? row : row + i;
      const currentCol = direction === "horizontal" ? col + i : col;

      // Place the letter
      grid[currentRow][currentCol].letter = letter;

      // Initialize word array if needed
      if (!grid[currentRow][currentCol].words) {
        grid[currentRow][currentCol].words = [];
      }

      // Add word info to the cell
      grid[currentRow][currentCol].words.push({
        id: id,
        index: i,
        length: word.length,
        direction: direction,
        word: word,
        startCoord: startCoord
      });

      // Mark first letter of word
      if (i === 0) {
        grid[currentRow][currentCol].isStart = true;
        grid[currentRow][currentCol].startCoord = startCoord;
      }
    }

    return true; // Word successfully placed
  }

  // Function to fill remaining cells with random letters
  function fillRemainingCells(grid) {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (grid[i][j].letter === "") {
          grid[i][j].letter = letters.charAt(
            Math.floor(Math.random() * letters.length)
          );
        }
      }
    }
  }

  // Function to render the grid
  function renderGrid(grid) {
    // First assign numbers to word start positions
    let wordNumber = 1;
    const wordStartPositions = new Map();

    // Find all word start positions
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (grid[i][j].isStart) {
          const startCoord = grid[i][j].startCoord;
          if (!wordStartPositions.has(startCoord)) {
            wordStartPositions.set(startCoord, wordNumber++);
          }
        }
      }
    }

    // Create the cells
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.row = i;
        cell.dataset.col = j;

        // Add word data for highlighting
        if (grid[i][j].words && grid[i][j].words.length > 0) {
          grid[i][j].words.forEach((wordInfo) => {
            cell.dataset[wordInfo.id] = JSON.stringify({
              index: wordInfo.index,
              length: wordInfo.length,
              direction: wordInfo.direction,
              word: wordInfo.word,
              startCoord: wordInfo.startCoord
            });
          });

          cell.dataset.isPartOfWord = "true";
        }

        // Add number indicator for word starts
        if (grid[i][j].isStart) {
          const startCoord = grid[i][j].startCoord;
          if (wordStartPositions.has(startCoord)) {
            const indicator = document.createElement("div");
            indicator.className = "word-indicator";
            indicator.textContent = wordStartPositions.get(startCoord);
            cell.appendChild(indicator);
          }
        }

        // Create the letter span
        const span = document.createElement("span");
        span.textContent = grid[i][j].letter;
        cell.appendChild(span);

        // Add hover functionality
        if (cell.dataset.isPartOfWord === "true") {
          cell.addEventListener("mouseenter", handleCellHover);
        }

        crosswordEl.appendChild(cell);
      }
    }
  }

  // Function to handle cell hover
  function handleCellHover(event) {
    const cell = event.target.closest(".cell");
    if (!cell) return;

    // Get all word IDs this cell belongs to
    const wordIds = Object.keys(cell.dataset).filter((key) =>
      key.startsWith("word-")
    );

    if (wordIds.length === 0) return;

    // Only activate this specific cell if it's part of a word
    if (wordIds.length > 0) {
      cell.classList.add("active");
    }
  }
});