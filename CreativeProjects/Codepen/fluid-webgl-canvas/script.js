const canvas = document.getElementById("fluidCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

let particles = [];
const particleCount = 1000;
const rippleStrength = 1;
const rippleSize = 50;

function Particle(x, y) {
  this.x = x;
  this.y = y;
  this.baseX = x;
  this.baseY = y;
  this.density = Math.random() * 30 + 1;
}

Particle.prototype.draw = function () {
  ctx.fillStyle = "blue";
  ctx.beginPath();
  ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
};

Particle.prototype.update = function () {
  let dx = mouse.x - this.x;
  let dy = mouse.y - this.y;
  let distance = Math.sqrt(dx * dx + dy * dy);
  let forceDirectionX = dx / distance;
  let forceDirectionY = dy / distance;
  let maxDistance = rippleSize;
  let force = (maxDistance - distance) / maxDistance;
  let directionX = forceDirectionX * force * this.density * rippleStrength;
  let directionY = forceDirectionY * force * this.density * rippleStrength;

  if (distance < rippleSize) {
    this.x -= directionX;
    this.y -= directionY;
  } else {
    if (this.x !== this.baseX) {
      let dx = this.x - this.baseX;
      this.x -= dx / 10;
    }
    if (this.y !== this.baseY) {
      let dy = this.y - this.baseY;
      this.y -= dy / 10;
    }
  }
};

function init() {
  particles = [];
  for (let i = 0; i < particleCount; i++) {
    let x = Math.random() * canvas.width;
    let y = Math.random() * canvas.height;
    particles.push(new Particle(x, y));
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].draw();
  }
  requestAnimationFrame(animate);
}

const mouse = {
  x: undefined,
  y: undefined
};

canvas.addEventListener("mousemove", function (event) {
  mouse.x = event.x - canvas.offsetLeft;
  mouse.y = event.y - canvas.offsetTop;
});

init();
animate();