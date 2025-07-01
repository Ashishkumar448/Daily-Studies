import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { GUI } from "https://cdn.skypack.dev/dat.gui";

let camera, scene, renderer, shaderMaterial;
let gui;

const uniforms = {
  iResolution: { value: new THREE.Vector2() },
  iTime: { value: 0 },
  grainIntensity: { value: 0.2 },
  grainScale: { value: 2.0 },
  brightness: { value: 1.0 },
  contrast: { value: 1.0 }
};

init();
animate();

function init() {
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene = new THREE.Scene();

  const geometry = new THREE.PlaneGeometry(2, 2);

  shaderMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: `
            void main() {
                gl_Position = vec4(position, 1.0);
            }
        `,
    fragmentShader: `
            uniform vec2 iResolution;
            uniform float iTime;
            uniform float grainIntensity;
            uniform float grainScale;
            uniform float brightness;
            uniform float contrast;

            const float PI = 3.14159265;

            vec2 intersect(vec2 i0, vec2 i1) {
                return vec2(max(i0.x, i1.x), min(i0.y, i1.y));
            }

            float measure(vec2 i) {
                return max(0., i.y-i.x);
            }

            vec4 split(vec2 i) {
                return vec4(i.x, min(PI, i.y), max(PI, i.x), i.y);
            }

            float measure_intersection(vec2 i0, vec2 i1) {
                vec4 i0_  = split(i0);
                vec4 i1_  = split(i1);
                
                float o = 0.;
                o += measure(intersect(i0_.xy, i1_.xy));
                o += measure(intersect(i0_.zw, i1_.zw));
                
                return o;
            }

            float occlude(vec3 a0, vec3 a1) {
                float o = measure(a0.xy);
                if(a1.z > a0.z)
                    return o;
                    
                o -= measure_intersection(a0.xy, a1.xy);
                o -= measure_intersection(a0.xy+vec2(2.*PI), a1.xy);
                o -= measure_intersection(a0.xy-vec2(2.*PI), a1.xy);
                
                return o;
            }

            vec3 get_angles(vec2 obs_pos, float obs_rad, vec2 pos) {
                vec2 diff = obs_pos-pos;
                float d = length(diff);
                float beta = atan(diff.y, diff.x);
                if(obs_rad > d)
                    return vec3(-PI, PI, 0.);
                float alpha = asin(obs_rad / d);
                return vec3(beta-alpha, beta+alpha, d);
            }

            vec3 applyGrain(vec3 color, vec2 uv) {
                float grain = fract(sin(dot(uv * grainScale, vec2(12.9898, 78.233))) * 43758.5453) * grainIntensity;
                return color + vec3(grain);
            }

            void mainImage(out vec4 fragColor, in vec2 fragCoord) {
                vec2 uv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
                float ps = 2.0 / iResolution.y;
                vec2 sun_pos  = vec2(-1, 0);
                vec2 moon_pos = vec2(0.75 + 0.75 * sin(iTime * 0.75), 0.5 * cos(iTime * 0.5));
                
                float sun_radius = 0.4 + 0.25 * cos(iTime);
                float moon_radius = 0.2;
                
                vec3 i_moon = get_angles(moon_pos, moon_radius, uv);
                vec3 i_sun = get_angles(sun_pos, sun_radius, uv);
                float visible_sun = occlude(i_sun, i_moon);
                visible_sun /= 2.0 * PI;
                vec3 color = vec3(visible_sun);
                
                float moon_alpha = smoothstep(moon_radius + ps, moon_radius - ps, distance(uv, moon_pos));
                color = mix(color, vec3(0.5), moon_alpha);
                float sun_alpha = smoothstep(sun_radius + ps, sun_radius - ps, distance(uv, sun_pos));
                color = max(color, sun_alpha);
                
                color = pow(color, vec3(1.0 / 2.2));
                
                // Apply grain effect
                color = applyGrain(color, fragCoord / iResolution.xy);
                
                // Apply brightness and contrast
                color = (color - 0.5) * contrast + 0.5;
                color *= brightness;
                
                fragColor = vec4(color, 1.0);
            }

            void main() {
                mainImage(gl_FragColor, gl_FragCoord.xy);
            }
        `
  });

  const mesh = new THREE.Mesh(geometry, shaderMaterial);
  scene.add(mesh);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  onWindowResize();
  window.addEventListener("resize", onWindowResize, false);

  setupGUI();
}

function setupGUI() {
  gui = new GUI();
  gui.add(uniforms.grainIntensity, "value", 0, 0.5).name("Grain Intensity");
  gui.add(uniforms.grainScale, "value", 0.5, 5).name("Grain Scale");
  gui.add(uniforms.brightness, "value", 0.5, 2).name("Brightness");
  gui.add(uniforms.contrast, "value", 0.5, 2).name("Contrast");
}

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  uniforms.iResolution.value.set(width, height);

  renderer.setSize(width, height);
}

function animate(time) {
  requestAnimationFrame(animate);

  uniforms.iTime.value = time * 0.001;

  renderer.render(scene, camera);
}