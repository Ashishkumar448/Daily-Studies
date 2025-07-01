function footerBehindContent() {
  var footer = document.querySelector(".footer");
  var main = document.querySelector(".main-wrapper");
  if (footer && main) {
    var footerHeight = footer.offsetHeight;
    main.style.marginBottom = footerHeight + "px";
  }
}

document.addEventListener("DOMContentLoaded", footerBehindContent);
window.addEventListener("resize", footerBehindContent);

document.addEventListener("DOMContentLoaded", function () {
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);

    // GSAP animation for SVG paths
    const paths = document.querySelectorAll(".svg-animation path");

    if (paths.length === 0) {
      console.error("No paths found. Ensure the SVG has the correct class.");
      return;
    }

    const svgTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: ".main-wrapper",
        start: "bottom 80%",
        end: "bottom top",
        scrub: true,
        toggleActions: "play none none reverse",
        markers: false
      }
    });

    paths.forEach((path, i) => {
      svgTimeline.fromTo(
        path,
        { opacity: 0, y: 75 },
        { opacity: 1, y: 0, ease: "power3.out" },
        i * 0.25
      );
    });

    // Horizontal loop for marquee text
    const scrollingText = gsap.utils.toArray(".footer__marquee-content span");

    // Create the horizontal loop timeline
    const loopTimeline = horizontalLoop(scrollingText, {
      repeat: -1,
      speed: 1 // Adjust speed if needed
    });

    let speedTween;

    // ScrollTrigger to adjust marquee speed and direction based on scroll
    ScrollTrigger.create({
      trigger: ".main-wrapper",
      start: "bottom 80%",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => {
        if (speedTween) speedTween.kill();
        speedTween = gsap
          .timeline()
          .to(loopTimeline, {
            timeScale: 3 * self.direction,
            duration: 0.25
          })
          .to(
            loopTimeline,
            {
              timeScale: 1 * self.direction,
              duration: 1.5
            },
            "+=0.5"
          );
      },
      markers: false
    });

    ScrollTrigger.refresh();
  } else {
    console.error("GSAP or ScrollTrigger is not loaded.");
  }
});

// Horizontal Loop Function
function horizontalLoop(items, config) {
  items = gsap.utils.toArray(items);
  config = config || {};
  let tl = gsap.timeline({
      repeat: config.repeat,
      paused: config.paused,
      defaults: { ease: "none" },
      onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100)
    }),
    length = items.length,
    startX = items[0].offsetLeft,
    times = [],
    widths = [],
    xPercents = [],
    curIndex = 0,
    pixelsPerSecond = (config.speed || 1) * 100,
    snap = config.snap === false ? (v) => v : gsap.utils.snap(config.snap || 1),
    totalWidth,
    curX,
    distanceToStart,
    distanceToLoop,
    item,
    i;

  gsap.set(items, {
    xPercent: (i, el) => {
      let w = (widths[i] = parseFloat(gsap.getProperty(el, "width", "px")));
      xPercents[i] = snap(
        (parseFloat(gsap.getProperty(el, "x", "px")) / w) * 100 +
          gsap.getProperty(el, "xPercent")
      );
      return xPercents[i];
    }
  });

  gsap.set(items, { x: 0 });

  totalWidth =
    items[length - 1].offsetLeft +
    (xPercents[length - 1] / 100) * widths[length - 1] -
    startX +
    items[length - 1].offsetWidth *
      gsap.getProperty(items[length - 1], "scaleX") +
    (parseFloat(config.paddingRight) || 0);

  for (i = 0; i < length; i++) {
    item = items[i];
    curX = (xPercents[i] / 100) * widths[i];
    distanceToStart = item.offsetLeft + curX - startX;
    distanceToLoop =
      distanceToStart + widths[i] * gsap.getProperty(item, "scaleX");
    tl.to(
      item,
      {
        xPercent: snap(((curX - distanceToLoop) / widths[i]) * 100),
        duration: distanceToLoop / pixelsPerSecond
      },
      0
    )
      .fromTo(
        item,
        {
          xPercent: snap(
            ((curX - distanceToLoop + totalWidth) / widths[i]) * 100
          )
        },
        {
          xPercent: xPercents[i],
          duration:
            (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
          immediateRender: false
        },
        distanceToLoop / pixelsPerSecond
      )
      .add("label" + i, distanceToStart / pixelsPerSecond);
    times[i] = distanceToStart / pixelsPerSecond;
  }

  function toIndex(index, vars) {
    vars = vars || {};
    Math.abs(index - curIndex) > length / 2 &&
      (index += index > curIndex ? -length : length);
    let newIndex = gsap.utils.wrap(0, length, index),
      time = times[newIndex];
    if (time > tl.time() !== index > curIndex) {
      vars.modifiers = { time: gsap.utils.wrap(0, tl.duration()) };
      time += tl.duration() * (index > curIndex ? 1 : -1);
    }
    curIndex = newIndex;
    vars.overwrite = true;
    return tl.tweenTo(time, vars);
  }

  tl.next = (vars) => toIndex(curIndex + 1, vars);
  tl.previous = (vars) => toIndex(curIndex - 1, vars);
  tl.current = () => curIndex;
  tl.toIndex = (index, vars) => toIndex(index, vars);
  tl.times = times;
  tl.progress(1, true).progress(0, true);

  if (config.reversed) {
    tl.vars.onReverseComplete();
    tl.reverse();
  }

  return tl;
}