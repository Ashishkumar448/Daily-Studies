window.onload = function () {
  const preloader = document.getElementById("preloader");
  const circle = document.getElementById("circle");
  const counter = document.getElementById("counter");
  const dot = document.getElementById("dot");
  const main = document.getElementById("main");
  const mainCircle = document.getElementById("main-circle");

  let count = 0;
  let loading = setInterval(function () {
    count += Math.floor(Math.random() * 5) + 1;
    if (count > 100) count = 100;
    counter.innerText = count;

    if (count === 100) {
      clearInterval(loading);

      setTimeout(function () {
        counter.style.opacity = "0";

        setTimeout(function () {
          preloader.style.backgroundColor = "transparent";
          circle.style.transform = "translate(-50%, -50%) scale(1.05)";

          setTimeout(function () {
            // Prepare main circle to look exactly like preloader circle
            mainCircle.style.width = `${circle.offsetWidth}px`;
            mainCircle.style.height = `${circle.offsetHeight}px`;
            mainCircle.style.backgroundColor = circle.style.backgroundColor;

            // Show main content
            main.style.opacity = "1";
            mainCircle.style.opacity = "1";

            // Transition preloader circle to final state
            circle.style.backgroundColor = "#0f1a0f";
            circle.style.transform = "translate(-50%, -50%)";

            dot.style.opacity = "1";
            dot.style.backgroundColor = "#a0a89e";

            setTimeout(function () {
              // Hide preloader
              preloader.style.opacity = "0";
              setTimeout(function () {
                preloader.style.display = "none";
              }, 500);
            }, 600);
          }, 400);
        }, 300);
      }, 300);
    }
  }, 100);
};