const cursor = document.getElementById("cursor");
const cursorPt = document.getElementById("cursorPt");
const target = document.getElementById("target");

const CURSOR_WIDTH = cursor.getBoundingClientRect().width;
const CURSOR_PT_WIDTH = cursorPt.getBoundingClientRect().width;

let isOverTarget = false;
let rotationTween;
let exitTween = null;
let enterTween = null;

// Initial rotation loop using GSAP
function startRotation() {
  gsap.set(cursor, { rotation: 0 });
  rotationTween = gsap.to(cursor, {
    rotation: 180,
    duration: 1.2,
    repeat: -1,
    ease: "linear",
    transformOrigin: "center center"
  });
}

function stopRotation() {
  if (rotationTween) rotationTween.kill();
}

document.addEventListener("mousemove", (e) => {
  gsap.to(cursor, {autoAlpha: 1});
    gsap.to(cursorPt, {autoAlpha: 1});
  if (!isOverTarget) {
    gsap.to(cursor, {
      x: e.clientX - CURSOR_WIDTH / 2,
      y: e.clientY - CURSOR_WIDTH / 2,
      duration: 0.1,
      ease: "expo.out"
    });
  }
  gsap.to(cursorPt, {
    x: e.clientX - CURSOR_PT_WIDTH/2,
    y: e.clientY- CURSOR_PT_WIDTH/2,
    duration: 0.1,
    ease: "expo.out"
  });
});

target.addEventListener("mouseenter", () => {
  isOverTarget = true;
  stopRotation();

  const rect = target.getBoundingClientRect();
  
  if (exitTween) exitTween.kill();
  enterTween = gsap.to(cursor, {
    width: rect.width,
    height: rect.height,
    borderColor: "red",
    rotation: 360,
    duration: 0.2,
    ease: "easeOut"
  });
});

// Move within target
target.addEventListener("mousemove", (e) => {
  const rect = target.getBoundingClientRect();

  const targetWidth = rect.width;
  const targetHeight = rect.height;

  // center
  const cx = rect.left + targetWidth / 2;
  const cy = rect.top + targetHeight / 2;

  // distance from center
  const dx = e.clientX - cx;
  const dy = e.clientY - cy;

  gsap.to(cursor, {
    x: rect.left + dx * 0.09,
    y: rect.top + dy * 0.09,
    scale: 1.1,
    duration: 0.1,
    ease: "power2.out"
  });
});

// Leave target
target.addEventListener("mouseleave", () => {
  isOverTarget = false;
  
  exitTween = gsap.to(cursor, {
    width: 30,
    height: 30,
    duration: 0.5,
    ease: "elastic.out(1, .9)"
  });

  startRotation();
});

startRotation();