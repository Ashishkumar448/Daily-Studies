const navItems = document.querySelectorAll(".card-list_item");

function createPath(left, right, curveStrength = 0) {
  const controlPoint = right + Math.min(curveStrength, (right - left) / 2);
  return `M ${left} 4 H ${right} Q ${controlPoint} 54 ${right} 104 H ${left} V 4 Z`;
}

function animateHover(item) {
  const svg = item.querySelector(".card-list_bg-path");
  gsap.killTweensOf(svg); // Kill any ongoing animations

  const initialPath = createPath(4, 4);
  const midPath = createPath(4, 104, 15);
  const finalPath = createPath(4, 104);

  gsap
    .timeline()
    .set(svg, { attr: { d: initialPath } })
    .to(svg, {
      attr: { d: midPath },
      duration: 0.3,
      ease: "power2.out"
    })
    .to(svg, {
      attr: { d: finalPath },
      duration: 0.5,
      ease: "elastic.out(1, 0.3)"
    });
}

function animateHoverOut(item) {
  const svg = item.querySelector(".card-list_bg-path");
  gsap.killTweensOf(svg); // Kill any ongoing animations

  const initialPath = createPath(4, 104);
  const midPath = createPath(4, 104, 5);
  const finalPath = createPath(4, 4);

  gsap
    .timeline()
    .to(svg, {
      attr: { d: midPath },
      duration: 0.2,
      ease: "power2.in"
    })
    .to(svg, {
      attr: { d: finalPath },
      duration: 0.4,
      ease: "power2.inOut"
    });
}

navItems.forEach((item) => {
  item.addEventListener("mouseenter", () => animateHover(item));
  item.addEventListener("mouseleave", () => animateHoverOut(item));
});