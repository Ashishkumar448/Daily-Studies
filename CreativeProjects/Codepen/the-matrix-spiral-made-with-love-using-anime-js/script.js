// --- SVG Setup ---
const svg = document.getElementById("hud-svg");
let spiralSpeed = 0.5; // always 0.5x for master version

// --- Constants for container fitting ---
const SIZE = 400;
const CX = SIZE / 2;
const CY = SIZE / 2;
const SAFE_MARGIN = 24; // px, from edge

// --- Gradients ---
function addGradients(svg) {
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `
    <linearGradient id="spiral-gradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#39ff14"/>
      <stop offset="100%" stop-color="#baffc9"/>
    </linearGradient>
    <radialGradient id="core-gradient" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#39ff14" stop-opacity="1"/>
      <stop offset="100%" stop-color="#101510" stop-opacity="0.1"/>
    </radialGradient>
  `;
  svg.appendChild(defs);
  return defs;
}

// --- HUD Rings, Arcs, Ticks, Core ---
function drawHUD(svg, spiralOuterRadius) {
  // Outer HUD ring just inside the SVG edge
  const ringRadii = [
  spiralOuterRadius + 12,
  spiralOuterRadius - 8,
  spiralOuterRadius - 28];

  const ringConfigs = [
  { r: ringRadii[0], color: "#183218", width: 8, class: "hud-ring" },
  { r: ringRadii[1], color: "#183218", width: 6, class: "hud-ring" },
  { r: ringRadii[2], color: "#39ff14", width: 2, class: "hud-tick" }];

  ringConfigs.forEach(cfg => {
    const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    ring.setAttribute("cx", CX);
    ring.setAttribute("cy", CY);
    ring.setAttribute("r", cfg.r);
    ring.setAttribute("stroke", cfg.color);
    ring.setAttribute("stroke-width", cfg.width);
    ring.setAttribute("fill", "none");
    ring.setAttribute("class", cfg.class);
    svg.appendChild(ring);
  });

  // Arcs
  function arcPath(cx, cy, r, startAngle, endAngle) {
    const rad = Math.PI / 180;
    const x1 = cx + r * Math.cos(startAngle * rad);
    const y1 = cy + r * Math.sin(startAngle * rad);
    const x2 = cx + r * Math.cos(endAngle * rad);
    const y2 = cy + r * Math.sin(endAngle * rad);
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
    return `M${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2}`;
  }
  const arcColors = ["#39ff14", "#baffc9", "#39ff14", "#baffc9"];
  const arcAngles = [
  [12, 92],
  [110, 168],
  [200, 238],
  [260, 350]];

  arcAngles.forEach((ang, i) => {
    const arc = document.createElementNS("http://www.w3.org/2000/svg", "path");
    arc.setAttribute("d", arcPath(CX, CY, spiralOuterRadius + 8, ang[0], ang[1]));
    arc.setAttribute("stroke", arcColors[i]);
    arc.setAttribute("class", "hud-arc");
    svg.appendChild(arc);
  });

  // Ticks
  const tickRadiusInner = spiralOuterRadius - 8;
  const tickRadiusOuter = spiralOuterRadius + 4;
  for (let i = 0; i < 72; i++) {
    const angle = i / 72 * 360;
    const rad = Math.PI / 180 * angle;
    const x1 = CX + tickRadiusInner * Math.cos(rad);
    const y1 = CY + tickRadiusInner * Math.sin(rad);
    const x2 = CX + tickRadiusOuter * Math.cos(rad);
    const y2 = CY + tickRadiusOuter * Math.sin(rad);
    const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
    tick.setAttribute("x1", x1);
    tick.setAttribute("y1", y1);
    tick.setAttribute("x2", x2);
    tick.setAttribute("y2", y2);
    tick.setAttribute("class", "hud-tick");
    tick.setAttribute("opacity", 0.13 + 0.15 * Math.random());
    svg.appendChild(tick);
  }

  // Energy Core
  const core = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  core.setAttribute("cx", CX);
  core.setAttribute("cy", CY);
  core.setAttribute("r", 20);
  core.setAttribute("class", "energy-core");
  svg.appendChild(core);

  return core;
}

// --- Spiral Globe (randomized, always fits) ---
function spiralPath(cx, cy, r0, r1, turns, waviness, freq, points = 180) {
  let path = [];
  for (let t = 0; t <= 1; t += 1 / points) {
    let angle = 2 * Math.PI * turns * t + Math.sin(t * freq) * waviness;
    let r = r0 + (r1 - r0) * t + Math.sin(t * freq * 0.7) * (waviness * 2);
    let x = cx + r * Math.cos(angle);
    let y = cy + r * Math.sin(angle);
    path.push(`${t === 0 ? "M" : "L"}${x},${y}`);
  }
  return path.join(" ");
}

function drawSpiral(svg, defs, spiralParams) {
  // Remove any previous spiral paths
  Array.from(svg.querySelectorAll('.spiral-path')).forEach(el => el.remove());

  const {
    lines,
    offsetStep,
    r0Base,
    r1Base,
    turnsBase,
    waviness,
    freq,
    spiralMaxOffset } =
  spiralParams;

  const spiralPaths = [];
  for (let i = 0; i < lines; i++) {
    const offset = (i - (lines - 1) / 2) * offsetStep;
    const r0 = r0Base + Math.abs(offset) * 0.7;
    const r1 = r1Base - Math.abs(offset) * 0.3;
    const turns = turnsBase + Math.sin(i) * 0.7;
    const pathStr = spiralPath(
    CX,
    CY + offset,
    r0,
    r1,
    turns,
    waviness,
    freq);

    const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathEl.setAttribute("d", pathStr);
    pathEl.setAttribute("class", "spiral-path");
    pathEl.setAttribute("stroke-width", 1.6 + 1.5 * Math.abs(Math.sin(i + Math.random())));
    svg.appendChild(pathEl);
    spiralPaths.push(pathEl);
  }
  return spiralPaths;
}

// --- Animate Spiral Lines ---
function animateSpiral(spiralPaths) {
  spiralPaths.forEach((path, i) => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
    anime({
      targets: path,
      strokeDashoffset: [length, 0],
      duration: (1400 + 90 * Math.abs(Math.sin(i))) / spiralSpeed,
      delay: i * 30 + 500,
      easing: "easeInOutCubic" });

  });
}

// --- Animate HUD Arcs ---
function animateHUDArcs() {
  anime({
    targets: ".hud-arc",
    strokeDashoffset: [anime.setDashoffset, 0],
    duration: 1800 / spiralSpeed,
    delay: anime.stagger(220, { from: "center" }),
    easing: "easeInOutCubic" });

}

// --- Animate Core Pulse ---
function animateCore(core) {
  anime({
    targets: core,
    r: [
    { value: 26, duration: 700 / spiralSpeed },
    { value: 20, duration: 700 / spiralSpeed }],

    easing: "easeInOutSine",
    direction: "alternate",
    loop: true });

}

// --- Animate Spiral Color Cycling ---
function cycleGradient(defs) {
  let stop1 = defs.querySelector('linearGradient stop[offset="0%"]');
  let stop2 = defs.querySelector('linearGradient stop[offset="100%"]');
  let t = 0;
  function animateGradient() {
    t += 0.015;
    stop1.setAttribute("stop-color", `hsl(${120 + Math.sin(t) * 30},100%,60%)`);
    stop2.setAttribute("stop-color", `hsl(${140 + Math.cos(t) * 30},100%,70%)`);
    requestAnimationFrame(animateGradient);
  }
  animateGradient();
}

// --- Random Spiral Parameters (always fits) ---
function randomSpiralParams() {
  // The spiral must fit inside the HUD, so max outer radius is:
  const spiralMaxRadius = CX - SAFE_MARGIN - 30; // 30px margin for HUD rings/arcs
  const lines = Math.floor(15 + Math.random() * 8); // 15-22 lines
  const offsetStep = Math.min(9 + Math.random() * 10, (spiralMaxRadius - 30) / (lines / 2)); // fit all offsets
  const spiralMaxOffset = (lines - 1) / 2 * offsetStep;
  const r0Base = 42 + Math.random() * 10; // starting radius
  const r1Base = spiralMaxRadius - spiralMaxOffset; // max spiral radius, minus offset
  const turnsBase = 2.6 + Math.random() * 1.1;
  const waviness = 0.18 + Math.random() * 0.38;
  const freq = 6 + Math.random() * 5;
  return {
    lines,
    offsetStep,
    r0Base,
    r1Base,
    turnsBase,
    waviness,
    freq,
    spiralMaxOffset };

}

// --- Main Render Function ---
function renderHUD() {
  svg.innerHTML = '';
  const spiralParams = randomSpiralParams();
  const spiralOuterRadius = spiralParams.r1Base + spiralParams.spiralMaxOffset + 8;
  const defs = addGradients(svg);
  drawHUD(svg, spiralOuterRadius);
  const spiralPaths = drawSpiral(svg, defs, spiralParams);
  animateSpiral(spiralPaths);
  animateHUDArcs();
  const core = svg.querySelector('.energy-core');
  animateCore(core);
  cycleGradient(defs);
}

// --- Button Handler ---
document.getElementById('randomize-btn').addEventListener('click', renderHUD);

// --- Initial Render ---
renderHUD();