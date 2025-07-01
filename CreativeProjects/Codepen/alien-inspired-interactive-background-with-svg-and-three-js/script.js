import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js";

// Create the Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);

// Set the canvas style to allow click-through
renderer.domElement.style.pointerEvents = "none";

// Mouse position
const mouse = new THREE.Vector2(0, 0);

// Uniforms for color adjustment and mouse position
const uniforms = {
  time: { value: 0.0 },
  resolution: {
    value: new THREE.Vector2(window.innerWidth, window.innerHeight)
  },
  colorOffset: { value: new THREE.Vector3(0.5, 0.2, 0.4) },
  mousePosition: { value: new THREE.Vector2(0, 0) }
};

// Customizable settings
const settings = {
  FLARE_BASE_INTENSITY: 1.4,
  FLARE_MOUSE_INFLUENCE: 0.05,
  FLARE_MIN_SIZE: 1.0,
  FLARE_MAX_SIZE: 3.6,
  SHAPE_PARALLAX_STRENGTH: 0.02,
  PARTICLE_MOUSE_INFLUENCE: 0.0002,
  PARTICLE_REPULSION_RADIUS: 0.9,
  PARTICLE_REPULSION_STRENGTH: 0.0001
};

function getRandomColor() {
  return new THREE.Vector3(Math.random(), Math.random(), Math.random());
}

// Shader Material Setup
const shaderMaterial = new THREE.ShaderMaterial({
  uniforms: uniforms,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  fragmentShader: `
    #ifdef GL_ES
    precision highp float;
    #endif

    uniform float time;
    uniform vec2 resolution;
    uniform vec3 colorOffset;
    uniform vec2 mousePosition;

    #define PI 3.1415926535

    mat2 rotate2d(float angle) {
        return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    }

    float random(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    // CUSTOMIZATION: These values are now set dynamically from JavaScript
    uniform float FLARE_BASE_INTENSITY;
    uniform float FLARE_MOUSE_INFLUENCE;
    uniform float FLARE_MIN_SIZE;
    uniform float FLARE_MAX_SIZE;
    uniform float SHAPE_PARALLAX_STRENGTH;

    float anamorphicFlare(vec2 p, vec2 mouseOffset) {
        vec2 adjustedP = p - mouseOffset * FLARE_MOUSE_INFLUENCE;
        
        float mouseDistance = length(mouseOffset);
        float flareSizeMultiplier = mix(FLARE_MAX_SIZE, FLARE_MIN_SIZE, mouseDistance);
        
        float streak = exp(-pow(adjustedP.y * 50.0 / flareSizeMultiplier, 2.0)) * exp(-pow(adjustedP.x * 1.5 / flareSizeMultiplier, 2.0));
        float glow = exp(-pow(adjustedP.y * 10.0 / flareSizeMultiplier, 2.0)) * 0.3;
        
        return (streak + glow) * FLARE_BASE_INTENSITY;
    }

    void main() {
        vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
        vec2 originalP = p;
        
        // Apply parallax effect to the main shape
        p += mousePosition * SHAPE_PARALLAX_STRENGTH;
        
        p = rotate2d(time * PI * 0.1) * p;

        float t = 0.075 / abs(0.4 - length(p));

        vec3 retroColor = vec3(
            colorOffset.x + 0.4 * sin(time + p.x * 6.0), 
            colorOffset.y + 0.5 * cos(time + p.y * 2.0), 
            colorOffset.z + 0.4 * sin(time + p.x * p.y * 3.0)
        );

        vec3 color = retroColor * vec3(1.0, 0.8, 1.2) - exp(-vec3(t) * vec3(0.15 * (sin(time) + 12.0), p.y * 0.9, 3.5));

        color *= 0.9 + 0.1 * sin(gl_FragCoord.y * 5.0);

        float noise = random(gl_FragCoord.xy + time) * 0.05;
        color += noise;

        float flare = anamorphicFlare(originalP - vec2(0.1, 0.0), mousePosition);
        color += vec3(0.3, 0.5, 1.2) * flare;

        float alpha = max(max(color.r, color.g), color.b) * 0.7;
        gl_FragColor = vec4(color, alpha);
    }
  `
});

// Update shader uniforms with settings
function updateShaderUniforms() {
  shaderMaterial.uniforms.FLARE_BASE_INTENSITY = {
    value: settings.FLARE_BASE_INTENSITY
  };
  shaderMaterial.uniforms.FLARE_MOUSE_INFLUENCE = {
    value: settings.FLARE_MOUSE_INFLUENCE
  };
  shaderMaterial.uniforms.FLARE_MIN_SIZE = { value: settings.FLARE_MIN_SIZE };
  shaderMaterial.uniforms.FLARE_MAX_SIZE = { value: settings.FLARE_MAX_SIZE };
  shaderMaterial.uniforms.SHAPE_PARALLAX_STRENGTH = {
    value: settings.SHAPE_PARALLAX_STRENGTH
  };
}

updateShaderUniforms();

// Full-screen quad setup
const geometry = new THREE.PlaneGeometry(2, 2);
const quad = new THREE.Mesh(geometry, shaderMaterial);
scene.add(quad);

// Create a particle system
const particles = new THREE.BufferGeometry();
const particleCount = 750;
const positions = new Float32Array(particleCount * 3);
const velocities = new Float32Array(particleCount * 3);
const sizes = new Float32Array(particleCount);

for (let i = 0; i < particleCount; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 2;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
  positions[i * 3 + 2] = Math.random() * 0.1 - 0.05;

  velocities[i * 3] = (Math.random() - 0.5) * 0.001;
  velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.001;
  velocities[i * 3 + 2] = 0;

  sizes[i] = Math.random() * 0.01 + 0.005;
}

particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));
particles.setAttribute("velocity", new THREE.BufferAttribute(velocities, 3));
particles.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

const particleMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0.35,
  blending: THREE.AdditiveBlending,
  depthTest: false
});

const particleSystem = new THREE.Points(particles, particleMaterial);
scene.add(particleSystem);

// Update mouse position
document.addEventListener("mousemove", (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  uniforms.mousePosition.value.set(mouse.x, mouse.y);
});

// Animation Loop
function animate() {
  uniforms.time.value += 0.01;

  const positions = particleSystem.geometry.attributes.position.array;
  const velocities = particleSystem.geometry.attributes.velocity.array;
  const sizes = particleSystem.geometry.attributes.size.array;

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;

    // Random movement
    positions[i3] += velocities[i3];
    positions[i3 + 1] += velocities[i3 + 1];

    // Global subtle movement based on mouse position
    positions[i3] +=
      (mouse.x - positions[i3]) * settings.PARTICLE_MOUSE_INFLUENCE;
    positions[i3 + 1] +=
      (mouse.y - positions[i3 + 1]) * settings.PARTICLE_MOUSE_INFLUENCE;

    // Mouse interaction for nearby particles
    const dx = positions[i3] - mouse.x;
    const dy = positions[i3 + 1] - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < settings.PARTICLE_REPULSION_RADIUS) {
      const repelFactor =
        settings.PARTICLE_REPULSION_STRENGTH / (dist * dist + 0.00001);
      positions[i3] += dx * repelFactor;
      positions[i3 + 1] += dy * repelFactor;
    }

    // Wrap around edges
    if (positions[i3] > 1) positions[i3] = -1;
    if (positions[i3] < -1) positions[i3] = 1;
    if (positions[i3 + 1] > 1) positions[i3 + 1] = -1;
    if (positions[i3 + 1] < -1) positions[i3 + 1] = 1;

    // Slightly vary particle size over time for a more dynamic look
    sizes[i] =
      (Math.sin(uniforms.time.value * 2 + i) * 0.5 + 0.5) * 0.01 + 0.005;
  }

  particleSystem.geometry.attributes.position.needsUpdate = true;
  particleSystem.geometry.attributes.size.needsUpdate = true;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

// Handle resize
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
});

// Change colors randomly on click (now applied to document)
document.addEventListener("click", (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  if (
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom
  ) {
    uniforms.colorOffset.value = getRandomColor();
  }
});

// Initial color set
uniforms.colorOffset.value = getRandomColor();

/* CUSTOMIZATION GUIDE:
 * To adjust the effect, modify the values in the 'settings' object:
 *
 * 1. Lens Flare:
 *    - FLARE_BASE_INTENSITY: Overall brightness of the flare
 *    - FLARE_MOUSE_INFLUENCE: How much mouse position affects flare movement
 *    - FLARE_MIN_SIZE and FLARE_MAX_SIZE: Size range of the flare
 *
 * 2. Shape Parallax:
 *    - SHAPE_PARALLAX_STRENGTH: How much the main shape moves with the mouse
 *
 * 3. Particle Behavior:
 *    - PARTICLE_MOUSE_INFLUENCE: How much all particles are affected by mouse position
 *    - PARTICLE_REPULSION_RADIUS: Radius of strong particle interaction around the cursor
 *    - PARTICLE_REPULSION_STRENGTH: Strength of repulsion for particles near the cursor
 *
 * After changing these values, call updateShaderUniforms() to apply the changes.
 *
 * Other customizations:
 * - Adjust particleCount for more or fewer particles
 * - Modify getRandomColor() to change the range of random colors generated
 * - Change uniforms.time.value += 0.01 in the animate function to adjust animation speed
 */

// Config for random character animations with mystic alien-style symbols
const CONFIG = {
  lettersAndSymbols: ["⟒", "⟐", "⟡", "⟓", "⟔", "⍾", "⨯"]
};

// TextAnimator class handles the hover animation for each link
class TextAnimator {
  #originalChars;
  #splitter;

  constructor(textElement) {
    if (!textElement || !(textElement instanceof HTMLElement)) {
      throw new Error("Invalid text element provided.");
    }
    this.textElement = textElement;
    this.#originalChars = [];
    this.#splitText();
  }

  #splitText() {
    this.#splitter = new SplitType(this.textElement, { types: "words, chars" });
    this.#originalChars = this.#splitter.chars.map((char) => char.innerHTML);
  }

  animate() {
    this.reset();
    this.#animateChars();
    this.#animateTextElement();
  }

  #animateChars() {
    this.#splitter.chars.forEach((char, position) => {
      let initialHTML = char.innerHTML;
      gsap.fromTo(
        char,
        { opacity: 0 },
        {
          duration: 0.03,
          onComplete: () =>
            gsap.set(char, { innerHTML: initialHTML, delay: 0.1 }),
          repeat: 2,
          repeatRefresh: true,
          repeatDelay: 0.05,
          delay: (position + 1) * 0.06,
          innerHTML: () => this.#getRandomChar(),
          opacity: 1
        }
      );
    });
  }

  #animateTextElement() {
    gsap.fromTo(
      this.textElement,
      { "--anim": 0 },
      { duration: 1, ease: "expo", "--anim": 1 }
    );
  }

  #getRandomChar() {
    return CONFIG.lettersAndSymbols[
      Math.floor(Math.random() * CONFIG.lettersAndSymbols.length)
    ];
  }

  animateBack() {
    gsap.killTweensOf(this.textElement);
    gsap.to(this.textElement, { duration: 0.6, ease: "power4", "--anim": 0 });
  }

  reset() {
    this.#splitter.chars.forEach((char, index) => {
      gsap.killTweensOf(char);
      char.innerHTML = this.#originalChars[index];
    });
    gsap.killTweensOf(this.textElement);
    gsap.set(this.textElement, { "--anim": 0 });
  }
}

// Initialize the animation for each element with the hover-effect class
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".hover-effect").forEach((link) => {
    const animator = new TextAnimator(link);

    link.addEventListener("mouseenter", () => {
      animator.animate();
    });

    link.addEventListener("mouseleave", () => {
      animator.animateBack();
    });
  });
});