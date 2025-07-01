const {
  Engine,
  Render,
  Runner,
  World,
  Bodies,
  Body,
  Composite,
  Mouse,
  MouseConstraint,
  Vertices
} = Matter;

// Setup
const engine = Engine.create({
  gravity: {
    y: 1 // Reduced gravity for more floaty feel
  }
});
const runner = Runner.create();
const canvas = document.querySelector("#canvas");
const currentNumber = document.querySelector(".current-number");

const render = Render.create({
  canvas: canvas,
  engine: engine,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    wireframes: false,
    background: "transparent"
  }
});

// Add mouse control with refined settings
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: {
    stiffness: 0.05,
    damping: 0.1,
    render: {
      visible: false
    }
  }
});

// Adjust mouse scale based on pixel ratio
const pixelRatio = window.devicePixelRatio || 1;
mouse.pixelRatio = pixelRatio;

World.add(engine.world, mouseConstraint);
render.mouse = mouse;

// Create number texture generator with improved quality
const numberRenderer = document.querySelector("#number-renderer");
const nctx = numberRenderer.getContext("2d");

function createNumberTexture(num) {
  const size = 100 * pixelRatio;
  numberRenderer.width = size;
  numberRenderer.height = size;
  nctx.scale(pixelRatio, pixelRatio);

  nctx.clearRect(0, 0, size, size);
  nctx.fillStyle = "#f5f5f5";
  nctx.font = "bold 60px Outfit";
  nctx.textAlign = "center";
  nctx.textBaseline = "middle";
  nctx.fillText(num, size / 2 / pixelRatio, size / 2 / pixelRatio);

  return numberRenderer.toDataURL();
}

// Create collision bounds for the background number
function createCollisionBounds() {
  const bounds = [
    // Top bound
    Bodies.rectangle(
      window.innerWidth / 2,
      window.innerHeight / 2 - 100,
      400,
      20,
      {
        isStatic: true,
        render: { visible: false }
      }
    ),
    // Bottom bound
    Bodies.rectangle(
      window.innerWidth / 2,
      window.innerHeight / 2 + 100,
      400,
      20,
      {
        isStatic: true,
        render: { visible: false }
      }
    )
  ];
  World.add(engine.world, bounds);
}

createCollisionBounds();

// Create boundaries with better physics properties
const boundaries = [
  Bodies.rectangle(
    window.innerWidth / 2,
    window.innerHeight + 30,
    window.innerWidth,
    60,
    {
      isStatic: true,
      render: { fillStyle: "#0a0a0a" },
      friction: 0.2,
      restitution: 0.4
    }
  ),
  Bodies.rectangle(-30, window.innerHeight / 2, 60, window.innerHeight, {
    isStatic: true,
    render: { fillStyle: "#0a0a0a" },
    friction: 0.2,
    restitution: 0.4
  }),
  Bodies.rectangle(
    window.innerWidth + 30,
    window.innerHeight / 2,
    60,
    window.innerHeight,
    {
      isStatic: true,
      render: { fillStyle: "#0a0a0a" },
      friction: 0.2,
      restitution: 0.4
    }
  )
];

World.add(engine.world, boundaries);

Runner.run(runner, engine);
Render.run(render);

let currentProgress = 0;
const numbers = [];
let isComplete = false;

function createNumber(num) {
  const size = 50; // Slightly smaller numbers
  const texture = createNumberTexture(num);

  const number = Bodies.circle(
    window.innerWidth / 2 + (Math.random() - 0.5) * 200, // Random start position
    -50,
    size / 2,
    {
      render: {
        sprite: {
          texture: texture,
          xScale: 1,
          yScale: 1
        }
      },
      restitution: 0.3, // Less bouncy
      friction: 0.2, // More friction
      density: 0.001, // Lighter weight
      frictionAir: 0.02, // More air resistance
      torque: (Math.random() - 0.5) * 0.002 // Gentle spin
    }
  );

  numbers.push(number);
  World.add(engine.world, number);

  // Gentler initial velocity
  Body.setVelocity(number, {
    x: (Math.random() - 0.5) * 2,
    y: 2
  });
}

function updateProgress(progress) {
  if (isComplete) return;

  const newProgress = Math.floor(progress * 100);

  if (newProgress > currentProgress) {
    createNumber(newProgress);
    currentProgress = newProgress;
    currentNumber.textContent = newProgress;

    if (newProgress >= 100) {
      setTimeout(completeLoader, 2000);
    }
  }
}

function completeLoader() {
  isComplete = true;

  // Explosion effect
  numbers.forEach((number) => {
    Body.setVelocity(number, {
      x: (Math.random() - 0.5) * 150,
      y: -Math.random() * 50
    });
  });

  gsap.to(".current-number", {
    opacity: 0,
    duration: 1,
    delay: 1
  });

  setTimeout(() => {
    gsap.to(render.canvas, {
      opacity: 0,
      duration: 0.8,
      onComplete: () => {
        World.clear(engine.world);
        Engine.clear(engine);
        Render.stop(render);
        Runner.stop(runner);
        Mouse.clearSourceEvents(mouse);
      }
    });

    gsap.set(".content", { visibility: "visible" });
    gsap.to(".content", {
      opacity: 1,
      duration: 0.8
    });
  }, 2000);
}

// Longer loading simulation
gsap.to(
  {},
  {
    duration: 10,
    onUpdate: function () {
      updateProgress(this.progress());
    },
    ease: "power1.inOut"
  }
);

// Improved window resize handler
window.addEventListener("resize", () => {
  render.canvas.width = window.innerWidth;
  render.canvas.height = window.innerHeight;

  boundaries.forEach((boundary) => {
    World.remove(engine.world, boundary);
  });

  boundaries.length = 0;

  boundaries.push(
    Bodies.rectangle(
      window.innerWidth / 2,
      window.innerHeight + 30,
      window.innerWidth,
      60,
      {
        isStatic: true,
        render: { fillStyle: "#0a0a0a" }
      }
    ),
    Bodies.rectangle(-30, window.innerHeight / 2, 60, window.innerHeight, {
      isStatic: true,
      render: { fillStyle: "#0a0a0a" }
    }),
    Bodies.rectangle(
      window.innerWidth + 30,
      window.innerHeight / 2,
      60,
      window.innerHeight,
      {
        isStatic: true,
        render: { fillStyle: "#0a0a0a" }
      }
    )
  );

  World.add(engine.world, boundaries);
  createCollisionBounds();
});