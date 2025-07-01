const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const mouse = { x: 0, y: 0, prevX: 0, prevY: 0, isDrawing: false };
const lines = [];
const particles = [];

class Line {
  constructor(x1, y1, x2, y2, color) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.color = color;
    this.life = 1;
  }

  draw() {
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = settings.brushSize * this.life;
    ctx.lineCap = "round";
    ctx.stroke();

    // Outer glow
    ctx.strokeStyle = `rgba(${parseInt(this.color.slice(1, 3), 16)}, ${parseInt(
      this.color.slice(3, 5),
      16
    )}, ${parseInt(this.color.slice(5, 7), 16)}, 0.5)`;
    ctx.lineWidth = (settings.brushSize + 4) * this.life;
    ctx.stroke();
  }

  update() {
    this.life -= 0.01;
  }
}

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 3 + 1;
    this.speedX = Math.random() * 2 - 1;
    this.speedY = Math.random() * 2 - 1;
    this.color = color;
    this.life = 1;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life -= 0.02;
    if (this.size > 0.1) this.size -= 0.1;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

const settings = {
  brushSize: 5,
  brushColor: "#00ff00",
  fadeSpeed: 0.01,
  particleEmission: true,
  backgroundColor: "#000000",
  clear: () => {
    lines.length = 0;
    particles.length = 0;
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
};

const gui = new dat.GUI();
gui.add(settings, "brushSize", 1, 20);
gui.addColor(settings, "brushColor");
gui.add(settings, "fadeSpeed", 0, 0.05);
gui.add(settings, "particleEmission");
gui.addColor(settings, "backgroundColor").onChange(settings.clear);
gui.add(settings, "clear");

function draw() {
  ctx.fillStyle = `rgba(${parseInt(
    settings.backgroundColor.slice(1, 3),
    16
  )}, ${parseInt(settings.backgroundColor.slice(3, 5), 16)}, ${parseInt(
    settings.backgroundColor.slice(5, 7),
    16
  )}, ${settings.fadeSpeed})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = lines.length - 1; i >= 0; i--) {
    lines[i].draw();
    lines[i].update();
    if (lines[i].life <= 0) {
      lines.splice(i, 1);
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();
    if (particles[i].life <= 0) {
      particles.splice(i, 1);
    }
  }

  if (mouse.isDrawing) {
    const newLine = new Line(
      mouse.prevX,
      mouse.prevY,
      mouse.x,
      mouse.y,
      settings.brushColor
    );
    lines.push(newLine);

    if (settings.particleEmission) {
      for (let i = 0; i < 3; i++) {
        particles.push(new Particle(mouse.x, mouse.y, settings.brushColor));
      }
    }
  }

  mouse.prevX = mouse.x;
  mouse.prevY = mouse.y;

  requestAnimationFrame(draw);
}

canvas.addEventListener("mousedown", (e) => {
  mouse.isDrawing = true;
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.prevX = mouse.x;
  mouse.prevY = mouse.y;
});

canvas.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

canvas.addEventListener("mouseup", () => {
  mouse.isDrawing = false;
});

canvas.addEventListener("mouseout", () => {
  mouse.isDrawing = false;
});

// Touch events for mobile support
canvas.addEventListener("touchstart", (e) => {
  mouse.isDrawing = true;
  mouse.x = e.touches[0].clientX;
  mouse.y = e.touches[0].clientY;
  mouse.prevX = mouse.x;
  mouse.prevY = mouse.y;
});

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  mouse.x = e.touches[0].clientX;
  mouse.y = e.touches[0].clientY;
});

canvas.addEventListener("touchend", () => {
  mouse.isDrawing = false;
});

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  settings.clear();
});

settings.clear();
draw();