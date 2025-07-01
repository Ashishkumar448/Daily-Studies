let slider = document.querySelector(".slider");
let nextBtn = document.getElementById("next");
let prevBtn = document.getElementById("prev");

nextBtn.onclick = () => {
  slider.append(slider.querySelector(".slide:first-child"));
};

prevBtn.onclick = () => {
  slider.prepend(slider.querySelector(".slide:last-child"));
};