import * as THREE from "https://esm.sh/three@0.175.0";
import { GUI } from "https://esm.sh/dat.gui@0.7.9";
// Ensure scripts are loaded
console.log("Script loading...");
// Animate grid overlay with GSAP - only left and right borders with staggered effect
const gridColumns = document.querySelectorAll(".grid-column");
// Set initial state - fully transparent
gsap.set(gridColumns, {
  opacity: 0,
  scaleY: 0
});
// Animate left and right borders with staggered effect
gsap.to(gridColumns, {
  opacity: 1,
  scaleY: 1,
  duration: 1.2,
  stagger: 0.08,
  ease: "power2.out",
  transformOrigin: "top"
});
// Optimized vertex shader
const vertexShader = `
    varying vec2 v_uv;
    
    void main() {
      v_uv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;
// Optimized fragment shader with improved ink marbling effect
const fragmentShader = `
  precision highp float;

  uniform sampler2D u_texture;
  uniform vec2 u_mouse;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform float u_radius;
  uniform float u_speed;
  uniform float u_imageAspect;
  uniform float u_turbulenceIntensity;
  uniform int u_effectType;
  uniform vec3 u_effectColor1;
  uniform vec3 u_effectColor2;
  uniform float u_effectIntensity;
  uniform bool u_invertMask;

  varying vec2 v_uv;

  // Improved hash function for better randomness
  vec3 hash33(vec3 p) {
    p = fract(p * vec3(443.8975, 397.2973, 491.1871));
    p += dot(p.zxy, p.yxz + 19.27);
    return fract(vec3(p.x * p.y, p.z * p.x, p.y * p.z));
  }

  // 2D hash function
  vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(443.897, 441.423, 437.195));
    p3 += dot(p3, p3.yzx + 19.19);
    return fract(vec2((p3.x + p3.y) * p3.z, (p3.x + p3.z) * p3.y));
  }

  // Simplex noise - smoother than Perlin, better for organic patterns
  float simplex_noise(vec3 p) {
    const float K1 = 0.333333333;
    const float K2 = 0.166666667;
    
    vec3 i = floor(p + (p.x + p.y + p.z) * K1);
    vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
    
    // Determine which simplex we're in and the coordinates
    vec3 e = step(vec3(0.0), d0 - d0.yzx);
    vec3 i1 = e * (1.0 - e.zxy);
    vec3 i2 = 1.0 - e.zxy * (1.0 - e);
    
    vec3 d1 = d0 - (i1 - K2);
    vec3 d2 = d0 - (i2 - K2 * 2.0);
    vec3 d3 = d0 - (1.0 - 3.0 * K2);
    
    // Calculate gradients and dot products
    vec3 x0 = d0;
    vec3 x1 = d1;
    vec3 x2 = d2;
    vec3 x3 = d3;
    
    vec4 h = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    vec4 n = h * h * h * h * vec4(
      dot(x0, hash33(i) * 2.0 - 1.0),
      dot(x1, hash33(i + i1) * 2.0 - 1.0),
      dot(x2, hash33(i + i2) * 2.0 - 1.0),
      dot(x3, hash33(i + 1.0) * 2.0 - 1.0)
    );
    
    // Sum the contributions
    return 0.5 + 0.5 * 31.0 * dot(n, vec4(1.0));
  }

  // Curl noise for more fluid motion
  vec2 curl(vec2 p, float time) {
    const float epsilon = 0.001;
    
    float n1 = simplex_noise(vec3(p.x, p.y + epsilon, time));
    float n2 = simplex_noise(vec3(p.x, p.y - epsilon, time));
    float n3 = simplex_noise(vec3(p.x + epsilon, p.y, time));
    float n4 = simplex_noise(vec3(p.x - epsilon, p.y, time));
    
    float x = (n2 - n1) / (2.0 * epsilon);
    float y = (n4 - n3) / (2.0 * epsilon);
    
    return vec2(x, y);
  }

  // Improved ink marbling function for more organic and fluid patterns
  float inkMarbling(vec2 p, float time, float intensity) {
    // Create multiple layers of fluid motion
    float result = 0.0;
    
    // Base layer - large fluid movements
    vec2 flow = curl(p * 1.5, time * 0.1) * intensity * 2.0;
    vec2 p1 = p + flow * 0.3;
    result += simplex_noise(vec3(p1 * 2.0, time * 0.15)) * 0.5;
    
    // Medium details - swirls and eddies
    vec2 flow2 = curl(p * 3.0 + vec2(sin(time * 0.2), cos(time * 0.15)), time * 0.2) * intensity;
    vec2 p2 = p + flow2 * 0.2;
    result += simplex_noise(vec3(p2 * 4.0, time * 0.25)) * 0.3;
    
    // Fine details - small ripples and textures
    vec2 flow3 = curl(p * 6.0 + vec2(cos(time * 0.3), sin(time * 0.25)), time * 0.3) * intensity * 0.5;
    vec2 p3 = p + flow3 * 0.1;
    result += simplex_noise(vec3(p3 * 8.0, time * 0.4)) * 0.2;
    
    // Add some spiral patterns for more interesting visuals
    float dist = length(p - vec2(0.5));
    float angle = atan(p.y - 0.5, p.x - 0.5);
    float spiral = sin(dist * 15.0 - angle * 2.0 + time * 0.3) * 0.5 + 0.5;
    
    // Blend everything together
    result = mix(result, spiral, 0.3);
    
    // Normalize to 0-1 range
    result = result * 0.5 + 0.5;
    
    return result;
  }

  // Apply sepia effect
  vec3 applySepia(vec3 color) {
    float r = color.r * 0.393 + color.g * 0.769 + color.b * 0.189;
    float g = color.r * 0.349 + color.g * 0.686 + color.b * 0.168;
    float b = color.r * 0.272 + color.g * 0.534 + color.b * 0.131;
    return vec3(r, g, b);
  }

  // Apply duotone effect
  vec3 applyDuotone(vec3 color, vec3 color1, vec3 color2) {
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    return mix(color1, color2, gray);
  }

  // Apply pixelate effect
  vec3 applyPixelate(sampler2D tex, vec2 uv, float pixelSize) {
    float dx = pixelSize * (1.0 / u_resolution.x);
    float dy = pixelSize * (1.0 / u_resolution.y);
    vec2 pixelatedUV = vec2(dx * floor(uv.x / dx), dy * floor(uv.y / dy));
    return texture2D(tex, pixelatedUV).rgb;
  }

  // Apply blur effect
  vec3 applyBlur(sampler2D tex, vec2 uv, float blurAmount) {
    float dx = blurAmount * (1.0 / u_resolution.x);
    float dy = blurAmount * (1.0 / u_resolution.y);
    
    vec3 sum = vec3(0.0);
    sum += texture2D(tex, uv + vec2(-dx, -dy)).rgb * 0.0625;
    sum += texture2D(tex, uv + vec2(0.0, -dy)).rgb * 0.125;
    sum += texture2D(tex, uv + vec2(dx, -dy)).rgb * 0.0625;
    sum += texture2D(tex, uv + vec2(-dx, 0.0)).rgb * 0.125;
    sum += texture2D(tex, uv).rgb * 0.25;
    sum += texture2D(tex, uv + vec2(dx, 0.0)).rgb * 0.125;
    sum += texture2D(tex, uv + vec2(-dx, dy)).rgb * 0.0625;
    sum += texture2D(tex, uv + vec2(0.0, dy)).rgb * 0.125;
    sum += texture2D(tex, uv + vec2(dx, dy)).rgb * 0.0625;
    
    return sum;
  }

  void main() {
    vec2 uv = v_uv;
    float screenAspect = u_resolution.x / u_resolution.y;
    float ratio = u_imageAspect / screenAspect;

    vec2 texCoord = vec2(
      mix(0.5 - 0.5 / ratio, 0.5 + 0.5 / ratio, uv.x),
      uv.y
    );

    vec4 tex = texture2D(u_texture, texCoord);
    vec3 originalColor = tex.rgb;
    vec3 effectColor = originalColor;
    
    // Apply base effect based on effect type
    if (u_effectType == 1) {
      // Black and white
      float gray = dot(originalColor, vec3(0.299, 0.587, 0.114));
      effectColor = vec3(gray);
    } 
    else if (u_effectType == 2) {
      // Sepia
      effectColor = applySepia(originalColor);
    }
    else if (u_effectType == 3) {
      // Duotone
      effectColor = applyDuotone(originalColor, u_effectColor1, u_effectColor2);
    }
    else if (u_effectType == 4) {
      // Pixelate
      effectColor = applyPixelate(u_texture, texCoord, u_effectIntensity * 20.0);
    }
    else if (u_effectType == 5) {
      // Blur
      effectColor = applyBlur(u_texture, texCoord, u_effectIntensity * 5.0);
    }
    
    // Calculate ink marbling effect
    vec2 correctedUV = uv;
    correctedUV.x *= screenAspect;
    vec2 correctedMouse = u_mouse;
    correctedMouse.x *= screenAspect;

    float dist = distance(correctedUV, correctedMouse);
    
    // Use improved ink marbling
    float marbleEffect = inkMarbling(uv * 2.0 + u_time * u_speed * 0.1, u_time, u_turbulenceIntensity * 2.0);
    float jaggedDist = dist + (marbleEffect - 0.5) * u_turbulenceIntensity * 2.0;
    
    float mask = u_radius > 0.001 ? step(jaggedDist, u_radius) : 0.0;

    // For the default effect (0), we invert the colors
    vec3 invertedColor = vec3(0.0);
    if (u_effectType == 0) {
      float gray = dot(originalColor, vec3(0.299, 0.587, 0.114));
      invertedColor = vec3(1.0 - gray);
    } else {
      // For other effects, we show the original image
      invertedColor = originalColor;
    }

    // Apply the mask to blend between effect and inverted/original
    // If invertMask is true, we swap which color is inside vs outside the mask
    vec3 finalColor;
    if (u_invertMask) {
      finalColor = mix(invertedColor, effectColor, mask);
    } else {
      finalColor = mix(effectColor, invertedColor, mask);
    }
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
// Enhanced configuration with animation durations
const config = {
  maskRadius: 0.35,
  maskSpeed: 0.75,
  animationSpeed: 1.0,
  appearDuration: 0.4, // Duration for effect to appear (seconds)
  disappearDuration: 0.3, // Duration for effect to disappear (seconds)
  turbulenceIntensity: 0.225,
  frameSkip: 0, // Skip frames for performance (0 = no skip)
  effectType: 0, // 0: Inversion (default), 1: B&W, 2: Sepia, 3: Duotone, 4: Pixelate, 5: Blur
  effectIntensity: 0.5,
  invertMask: false, // Option to invert what's revealed
  duotoneColor1: [51, 102, 204], // Blue (RGB format for dat.gui)
  duotoneColor2: [230, 51, 51] // Red (RGB format for dat.gui)
};
// Setup dat.gui with folders for better organization
try {
  const gui = new GUI();
  gui.domElement.style.position = "fixed";
  gui.domElement.style.top = "10px";
  gui.domElement.style.right = "10px";
  // Effect type selector
  const effectFolder = gui.addFolder("Effect Type");
  effectFolder
    .add(config, "effectType", {
      "Inversion (Default)": 0,
      "Black & White": 1,
      Sepia: 2,
      Duotone: 3,
      Pixelate: 4,
      Blur: 5
    })
    .name("Effect")
    .onChange((value) => {
      document.querySelectorAll(".inversion-lens").forEach((container) => {
        if (container.uniforms) {
          container.uniforms.u_effectType.value = value;
        }
      });
    });
  effectFolder.open();
  // Effect settings
  const effectSettingsFolder = gui.addFolder("Effect Settings");
  effectSettingsFolder
    .add(config, "effectIntensity", 0, 1, 0.01)
    .name("Effect Intensity")
    .onChange((value) => {
      document.querySelectorAll(".inversion-lens").forEach((container) => {
        if (container.uniforms) {
          container.uniforms.u_effectIntensity.value = value;
        }
      });
    });
  // Add invert mask option
  effectSettingsFolder
    .add(config, "invertMask")
    .name("Invert Mask")
    .onChange((value) => {
      document.querySelectorAll(".inversion-lens").forEach((container) => {
        if (container.uniforms) {
          container.uniforms.u_invertMask.value = value;
        }
      });
    });
  // Duotone color pickers
  const color1Controller = effectSettingsFolder
    .addColor(config, "duotoneColor1")
    .name("Duotone Color 1")
    .onChange((value) => {
      document.querySelectorAll(".inversion-lens").forEach((container) => {
        if (container.uniforms) {
          container.uniforms.u_effectColor1.value.set(
            value[0] / 255,
            value[1] / 255,
            value[2] / 255
          );
        }
      });
    });
  const color2Controller = effectSettingsFolder
    .addColor(config, "duotoneColor2")
    .name("Duotone Color 2")
    .onChange((value) => {
      document.querySelectorAll(".inversion-lens").forEach((container) => {
        if (container.uniforms) {
          container.uniforms.u_effectColor2.value.set(
            value[0] / 255,
            value[1] / 255,
            value[2] / 255
          );
        }
      });
    });
  // Mask settings
  const maskFolder = gui.addFolder("Marbling Settings");
  maskFolder.add(config, "maskRadius", 0.05, 0.5, 0.01).name("Mask Radius");
  maskFolder
    .add(config, "turbulenceIntensity", 0, 0.5, 0.001)
    .name("Marbling Intensity")
    .onChange((value) => {
      document.querySelectorAll(".inversion-lens").forEach((container) => {
        if (container.uniforms) {
          container.uniforms.u_turbulenceIntensity.value = value;
        }
      });
    });
  // Animation folder
  const animationFolder = gui.addFolder("Animation Settings");
  animationFolder
    .add(config, "animationSpeed", 0.1, 3.0, 0.1)
    .name("Animation Speed");
  animationFolder
    .add(config, "appearDuration", 0.1, 1.0, 0.1)
    .name("Appear Duration");
  animationFolder
    .add(config, "disappearDuration", 0.1, 1.0, 0.1)
    .name("Disappear Duration");
  // Performance folder
  const performanceFolder = gui.addFolder("Performance");
  performanceFolder.add(config, "frameSkip", 0, 3, 1).name("Frame Skip");
  console.log("GUI initialized successfully");
} catch (e) {
  console.error("Error initializing GUI:", e);
}
// Shared animation frame for better performance
let frameCount = 0;
let lastTime = 0;
const activeContainers = new Set();

function globalAnimate(timestamp) {
  requestAnimationFrame(globalAnimate);
  // Calculate delta time for smoother animations
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;
  // Skip frames if needed for performance
  frameCount++;
  if (config.frameSkip > 0 && frameCount % (config.frameSkip + 1) !== 0) return;
  // Only update visible containers
  activeContainers.forEach((container) => {
    if (container.isInView) {
      updateContainer(container, deltaTime);
    }
  });
}
// Start global animation
requestAnimationFrame(globalAnimate);

function updateContainer(container, deltaTime) {
  if (!container.uniforms) return;
  // Smooth mouse movement
  container.lerpedMouse.lerp(container.targetMouse, 0.1);
  container.uniforms.u_mouse.value.copy(container.lerpedMouse);
  // Only update time if container is hovered
  if (container.isMouseInsideContainer) {
    container.uniforms.u_time.value +=
      0.01 * config.animationSpeed * (deltaTime / 16.67); // Normalize to ~60fps
  }
  // Render only if needed
  if (container.renderer && container.scene && container.camera) {
    container.renderer.render(container.scene, container.camera);
  }
}
// Initialize effect on all images with optimizations
document.querySelectorAll(".inversion-lens").forEach((container) => {
  initHoverEffect(container);
});

function initHoverEffect(container) {
  // Store state on container
  container.scene = null;
  container.camera = null;
  container.renderer = null;
  container.uniforms = null;
  container.isInView = false;
  container.isMouseInsideContainer = false;
  container.targetMouse = new THREE.Vector2(0.5, 0.5);
  container.lerpedMouse = new THREE.Vector2(0.5, 0.5);
  container.radiusTween = null;
  // Add to active containers
  activeContainers.add(container);
  const img = container.querySelector("img");
  const loader = new THREE.TextureLoader();
  loader.load(img.src, (texture) => {
    setupScene(texture);
    setupEventListeners();
  });

  function setupScene(texture) {
    const imageAspect = texture.image.width / texture.image.height;
    // Optimize texture settings
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 8; // Good balance between quality and performance
    texture.generateMipmaps = false; // Disable mipmaps for performance
    container.scene = new THREE.Scene();
    const width = container.clientWidth;
    const height = container.clientHeight;
    container.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    container.uniforms = {
      u_texture: {
        value: texture
      },
      u_mouse: {
        value: new THREE.Vector2(0.5, 0.5)
      },
      u_time: {
        value: 0.0
      },
      u_resolution: {
        value: new THREE.Vector2(width, height)
      },
      u_radius: {
        value: 0.0
      },
      u_speed: {
        value: config.maskSpeed
      },
      u_imageAspect: {
        value: imageAspect
      },
      u_turbulenceIntensity: {
        value: config.turbulenceIntensity
      },
      u_effectType: {
        value: config.effectType
      },
      u_effectIntensity: {
        value: config.effectIntensity
      },
      u_invertMask: {
        value: config.invertMask
      }, // Add the new uniform
      u_effectColor1: {
        value: new THREE.Color(
          config.duotoneColor1[0] / 255,
          config.duotoneColor1[1] / 255,
          config.duotoneColor1[2] / 255
        )
      },
      u_effectColor2: {
        value: new THREE.Color(
          config.duotoneColor2[0] / 255,
          config.duotoneColor2[1] / 255,
          config.duotoneColor2[2] / 255
        )
      }
    };
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms: container.uniforms,
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geometry, material);
    container.scene.add(mesh);
    container.renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: "high-performance",
      alpha: true
    });
    container.renderer.setPixelRatio(1);
    container.renderer.setSize(width, height);
    container.appendChild(container.renderer.domElement);
    // Efficient resize handler with debouncing
    let resizeTimeout;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimeout) return;
      resizeTimeout = setTimeout(() => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (container.renderer) {
          container.renderer.setSize(width, height);
        }
        if (container.uniforms) {
          container.uniforms.u_resolution.value.set(width, height);
        }
        resizeTimeout = null;
      }, 200);
    });
    resizeObserver.observe(container);
    // Initial render
    container.renderer.render(container.scene, container.camera);
  }

  function setupEventListeners() {
    // Use passive event listeners for better performance
    document.addEventListener("mousemove", handleMouseMove, {
      passive: true
    });
    // Intersection observer for visibility
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          container.isInView = entry.isIntersecting;
          if (!container.isInView && container.radiusTween) {
            container.radiusTween.kill();
            container.uniforms.u_radius.value = 0.0;
          }
        });
      },
      {
        threshold: 0.1
      }
    );
    observer.observe(container);
    // Throttled mouse move handler
    let lastMouseX = 0;
    let lastMouseY = 0;
    let mouseMoveTimeout = null;

    function handleMouseMove(e) {
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      if (!mouseMoveTimeout) {
        mouseMoveTimeout = setTimeout(() => {
          updateCursorState(lastMouseX, lastMouseY);
          mouseMoveTimeout = null;
        }, 16); // ~60fps
      }
    }
  }

  function updateCursorState(x, y) {
    const rect = container.getBoundingClientRect();
    const inside =
      x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    // Only update if state changed
    if (container.isMouseInsideContainer !== inside) {
      container.isMouseInsideContainer = inside;
      // Kill any existing tween
      if (container.radiusTween) {
        container.radiusTween.kill();
      }
      if (inside) {
        // Mouse entered - animate radius to target value
        container.targetMouse.x = (x - rect.left) / rect.width;
        container.targetMouse.y = 1.0 - (y - rect.top) / rect.height;
        container.radiusTween = gsap.to(container.uniforms.u_radius, {
          value: config.maskRadius,
          duration: config.appearDuration,
          ease: "power2.out"
        });
      } else {
        // Mouse left - animate radius to zero
        container.radiusTween = gsap.to(container.uniforms.u_radius, {
          value: 0,
          duration: config.disappearDuration,
          ease: "power2.in"
        });
      }
    }
    // Update mouse position if inside
    if (inside) {
      container.targetMouse.x = (x - rect.left) / rect.width;
      container.targetMouse.y = 1.0 - (y - rect.top) / rect.height;
    }
  }
}
// Log when everything is initialized
console.log("All initialization complete");