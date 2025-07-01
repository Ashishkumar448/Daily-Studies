// Fragment Shader
const fragmentShader = `
varying vec2 v_texcoord;
uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_pixelRatio;

#ifndef PI
#define PI 3.1415926535897932384626433832795
#endif
#ifndef TWO_PI
#define TWO_PI 6.2831853071795864769252867665590
#endif

vec2 coord(in vec2 p) {
    p = p / u_resolution.xy;
    if (u_resolution.x > u_resolution.y) {
        p.x *= u_resolution.x / u_resolution.y;
        p.x += (u_resolution.y - u_resolution.x) / u_resolution.y / 2.0;
    } else {
        p.y *= u_resolution.y / u_resolution.x;
        p.y += (u_resolution.x - u_resolution.y) / u_resolution.x / 2.0;
    }
    p -= 0.5;
    p *= vec2(-1.0, 1.0);
    return p;
}

#define st0 coord(gl_FragCoord.xy)
#define mx coord(u_mouse * u_pixelRatio)

float sdCircle(in vec2 st, in vec2 center) {
    return length(st - center) * 2.0;
}

float aastep(float threshold, float value) {
    float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678118654757;
    return smoothstep(threshold - afwidth, threshold + afwidth, value);
}

float fill(in float x) { return 1.0 - aastep(0.0, x); }
float fill(float x, float size, float edge) {
    return 1.0 - smoothstep(size - edge, size + edge, x);
}

void main() {
    vec2 pixel = 1.0 / u_resolution.xy;
    vec2 st = st0 + 0.5;
    vec2 posMouse = mx * vec2(1., -1.) + 0.5;
    
    float circleSize = 0.3;
    float circleEdge = 0.5;
    
    float sdfCircle = fill(
        sdCircle(st, posMouse),
        circleSize,
        circleEdge
    );
    
    float sdf = sdCircle(st, vec2(0.5));
    sdf = fill(sdf, 0.6, sdfCircle) * 1.2;
    
    vec3 color = vec3(sdf);
    gl_FragColor = vec4(color.rgb, 1.0);
}
`;

// Scene setup
const scene = new THREE.Scene();
const vMouse = new THREE.Vector2();
const vMouseDamp = new THREE.Vector2();
const vResolution = new THREE.Vector2();

// Viewport setup (updated on resize)
let w, h = 1;

// Orthographic camera setup
const aspect = w / h;
const camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
document.body.appendChild(renderer.domElement);

const onPointerMove = (e) => { vMouse.set(e.pageX, e.pageY) }
document.addEventListener('mousemove', onPointerMove);
document.addEventListener('pointermove', onPointerMove);
document.body.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });

// Plane geometry covering the full viewport
const geo = new THREE.PlaneGeometry(1, 1);  // Scaled to cover full viewport

// Shader material creation
const mat = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec2 v_texcoord;
    void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        v_texcoord = uv;
    }`,
  fragmentShader,
  uniforms: {
    u_mouse: { value: vMouseDamp },
    u_resolution: { value: vResolution },
    u_pixelRatio: { value: 2 }
  }
});

// Mesh creation
const quad = new THREE.Mesh(geo, mat);
scene.add(quad);

// Camera position and orientation
camera.position.z = 1;  // Set appropriately for orthographic

// FPS counter setup
const fpsElement = document.createElement('div');
fpsElement.style.position = 'absolute';
fpsElement.style.top = '10px';
fpsElement.style.left = '10px';
fpsElement.style.color = 'white';
fpsElement.style.fontFamily = 'Arial, sans-serif';
fpsElement.style.fontSize = '16px';
document.body.appendChild(fpsElement);

let frameCount = 0;
let lastFpsUpdateTime = 0;

// Animation loop to render
let time, lastTime = 0;
const update = () => {
  // calculate delta time
  time = performance.now() * 0.001;
  const dt = time - lastTime;
  lastTime = time;

  // ease mouse motion with damping
  for (const k in vMouse) {
    if (k == 'x' || k == 'y') vMouseDamp[k] = THREE.MathUtils.damp(vMouseDamp[k], vMouse[k], 8, dt);
  }

  // Update FPS counter
  frameCount++;
  if (time - lastFpsUpdateTime >= 1.0) {  // Update every second
    const fps = Math.round(frameCount / (time - lastFpsUpdateTime));
    fpsElement.textContent = `FPS: ${fps}`;
    frameCount = 0;
    lastFpsUpdateTime = time;
  }

  // render scene
  requestAnimationFrame(update);
  renderer.render(scene, camera);
};
update();

const resize = () => {
  w = window.innerWidth;
  h = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio, 2);
  renderer.setSize(w, h);
  renderer.setPixelRatio(dpr);
  camera.left = -w / 2;
  camera.right = w / 2;
  camera.top = h / 2;
  camera.bottom = -h / 2;
  camera.updateProjectionMatrix();
  quad.scale.set(w, h, 1);
  vResolution.set(w, h).multiplyScalar(dpr);
  mat.uniforms.u_pixelRatio.value = dpr;
};
resize();
window.addEventListener('resize', resize);