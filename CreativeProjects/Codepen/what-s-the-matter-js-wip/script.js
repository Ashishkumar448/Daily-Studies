gsap.registerPlugin(ScrollTrigger);

var Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite,
  Composites = Matter.Composites,
  Constraint = Matter.Constraint,
  Body = Matter.Body,
  Events = Matter.Events;

// Create the Matter.js engine and world
var engine = Engine.create(),
  world = engine.world;

// Set natural gravity (default is 1, you can adjust this)
engine.gravity.y = 1;

var render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    width: 800,
    height: 600,
    wireframes: true,
    showAngleIndicator: true,
    visible: false
  }
});
Render.run(render);

var runner = Runner.create();
Runner.run(runner, engine);

// Set up the SVG elements
var svgPath = document.getElementById("svg-path");
var svgBall = document.getElementById("svg-ball");

// Create the ball using Matter.js
var ball = Bodies.circle(400, 50, 20, {
  density: 0.01,
  restitution: 0.8, // Restitution ensures the ball bounces, but not indefinitely
  friction: 0.05, // Lower friction for smoother interaction
  frictionAir: 0.01 // Slight air friction to slow down the ball over time
});

// Create the left and right static points for the line
var leftPoint = Bodies.circle(200, 300, 5, { isStatic: true });
var rightPoint = Bodies.circle(600, 300, 5, { isStatic: true });

// Create a flexible line using multiple segments
var group = Body.nextGroup(true);
var line = Composites.stack(200, 300, 15, 1, 0, 0, function (x, y) {
  return Bodies.circle(x, y, 5, {
    collisionFilter: { group: group },
    density: 0.01,
    restitution: 0.8
  });
});

Composites.chain(line, 0.3, 0, -0.3, 0, {
  stiffness: 0.4, // Lower stiffness for more flexible line
  length: 20, // Shorter length for more bending
  damping: 0.05 // Slight damping for spring-like behavior
});

// Connect the first and last segments of the line to the static left and right points
Composite.add(world, [
  line,
  leftPoint,
  rightPoint,
  Constraint.create({
    bodyA: leftPoint,
    bodyB: line.bodies[0],
    length: 0,
    stiffness: 0.8
  }),
  Constraint.create({
    bodyA: rightPoint,
    bodyB: line.bodies[line.bodies.length - 1],
    length: 0,
    stiffness: 0.8
  })
]);

// Add the ball to the world
Composite.add(world, ball);

// Function to update the SVG path and circle position
function updateSVG() {
  // Update the SVG path (line)
  var pathData = "M " + leftPoint.position.x + " " + leftPoint.position.y;
  for (var i = 0; i < line.bodies.length; i++) {
    pathData +=
      " L " + line.bodies[i].position.x + " " + line.bodies[i].position.y;
  }
  pathData += " L " + rightPoint.position.x + " " + rightPoint.position.y;
  svgPath.setAttribute("d", pathData);

  // Update the SVG ball position
  svgBall.setAttribute("cx", ball.position.x);
  svgBall.setAttribute("cy", ball.position.y);
}

// Function to sync GSAP scaling with Matter.js ball radius
function scaleBall(radius) {
  Body.scale(ball, radius / ball.circleRadius, radius / ball.circleRadius);
  svgBall.setAttribute("r", radius);
}

// GSAP ScrollTrigger setup for scaling the ball
gsap
  .timeline({
    scrollTrigger: {
      trigger: ".scroll-container",
      start: "top top",
      end: "300%",
      scrub: true,
      pin: true // Keeps the scene in place while scrolling
    }
  })
  .to(svgBall, {
    duration: 1,
    attr: { r: 200 }, // Ball grows bigger to fill the screen
    onUpdate: function () {
      scaleBall(svgBall.getAttribute("r")); // Sync size in Matter.js
    }
  })
  .to(svgBall, {
    duration: 1,
    attr: { r: 20 }, // Ball shrinks back to normal size
    onUpdate: function () {
      scaleBall(svgBall.getAttribute("r")); // Sync size in Matter.js
    }
  })
  .add(() => {
    // At this point, the ball should fall down and interact with the line
    Body.setPosition(ball, { x: 400, y: 50 }); // Reset ball's position
    Body.setVelocity(ball, { x: 0, y: 5 }); // Set downward velocity
  });

// Function to reset the ball position when it falls below the line
function resetBall() {
  if (ball.position.y > 600) {
    Body.setPosition(ball, { x: 400, y: 50 });
    Body.setVelocity(ball, { x: 0, y: 0 });
  }
}

// Continuously update the SVG positions based on Matter.js bodies and reset the ball
(function animate() {
  updateSVG();
  resetBall();
  requestAnimationFrame(animate);
})();