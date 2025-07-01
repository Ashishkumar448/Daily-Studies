// Variations of the path data
const pathVariations = [
  "M108 3C80 -4 5 8 12 38c6 40 92 38 155 42 28 3 192 16 170 -36C318 2 137 7 118 8S-2 4 2 33c4 29 125 50 175 52s155 8 155 -34",
  "M124 2C76 -6 8 12 14 36c4 39 88 41 152 46 33 3 199 13 177 -40C323 7 136 4 121 4S-1 6 6 32c7 35 122 51 173 53s160 6 160 -43",
  "M121 4C79 -3 7 11 10 37c5 42 89 39 153 44 31 2 193 15 174 -37C321 6 134 9 119 9S-4 3 3 34c7 32 123 53 174 55s158 7 158 -32",
  "M119 1C82 -5 6 9 11 39c3 37 87 40 154 45 29 4 190 10 169 -38C316 5 133 5 117 5S-5 1 4 31c9 33 127 54 176 56s157 9 157 -51"
];

// Select the path element
const pathElement = document.querySelector(".animated-path");
const container = document.querySelector(".marker");

// Function to get a random path variation
function getRandomPath() {
  const randomIndex = Math.floor(Math.random() * pathVariations.length);
  return pathVariations[randomIndex];
}

// Event listener for hover effect
container.addEventListener("mouseenter", () => {
  pathElement.setAttribute("d", getRandomPath());
  pathElement.style.animation = "none"; // Reset animation
  setTimeout(() => {
    pathElement.style.animation = ""; // Reapply animation
  }, 10);
});