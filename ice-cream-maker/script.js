const scoopsDisplay = document.getElementById("scoops");
const flavours = document.getElementsByName("flavour");
const generateBtn = document.getElementById("generate");
let colorsArray = [];

function resetScoops() {
  colorsArray.length = 0;
  scoopsDisplay.innerHTML = "";
}

function serveScoops() {
  let zIndex = 0;
  resetScoops();

  flavours.forEach((flavour) => {
    if (flavour.checked) {
      colorsArray.push(flavour.value);
    }
  });

  if (colorsArray.length === 0) {
    alert("Please select at least one flavour!");
    return;
  }

  colorsArray.forEach((color) => {
    const scoop = document.createElement("div");
    scoop.classList.add("scoop");
    scoop.style.backgroundColor = color;
    scoop.style.zIndex = zIndex;
    scoop.classList.add("scoop-other");
    scoopsDisplay.append(scoop);
    zIndex--;
  });

  if (scoopsDisplay.lastChild) {
    scoopsDisplay.lastChild.classList.add("scoop1");
  }
}

generateBtn.addEventListener("click", serveScoops);