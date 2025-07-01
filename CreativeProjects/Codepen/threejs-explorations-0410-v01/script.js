import * as THREE from "https://cdn.skypack.dev/three@0.136.0";

let scene, camera, renderer, uniforms, clock;

init();
animate();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 1;

  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); // Set clear color to transparent
  document.body.appendChild(renderer.domElement);

  clock = new THREE.Clock();

  // Create noise texture
  const noiseSize = 256;
  const noiseData = new Uint8Array(noiseSize * noiseSize * 4);
  for (let i = 0; i < noiseSize * noiseSize * 4; i++) {
    noiseData[i] = Math.random() * 255;
  }
  const noiseTexture = new THREE.DataTexture(
    noiseData,
    noiseSize,
    noiseSize,
    THREE.RGBAFormat
  );
  noiseTexture.needsUpdate = true;

  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector3() },
      iMouse: { value: new THREE.Vector4() },
      iChannel0: { value: noiseTexture }
    },
    vertexShader: `
      void main() {
          gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float iTime;
      uniform vec3 iResolution;
      uniform vec4 iMouse;
      uniform sampler2D iChannel0;

      float noise(float t) {
          return texture(iChannel0, vec2(t, 0.0)).x;
      }
      float noise(vec2 t) {
          return texture(iChannel0, (t + vec2(iTime)) / 256.0).x;
      }

      vec3 lensflare(vec2 uv, vec2 pos) {
          vec2 main = uv - pos;
          vec2 uvd = uv * (length(uv));
          
          float ang = atan(main.y, main.x);
          float dist = length(main); dist = pow(dist, .1);
          float n = noise(vec2((ang-iTime/9.0)*16.0, dist*32.0));
          
          float f0 = 1.0/(length(uv-pos)*16.0+1.0);
          float f2 = max(1.0/(1.0+32.0*pow(length(uvd+0.8*pos),2.0)),.0)*00.25;
          float f22 = max(1.0/(1.0+32.0*pow(length(uvd+0.85*pos),2.0)),.0)*00.23;
          float f23 = max(1.0/(1.0+32.0*pow(length(uvd+0.9*pos),2.0)),.0)*00.21;
          
          vec2 uvx = mix(uv, uvd, -0.5);
          
          float f4 = max(0.01-pow(length(uvx+0.4*pos),2.4),.0)*6.0;
          float f42 = max(0.01-pow(length(uvx+0.45*pos),2.4),.0)*5.0;
          float f43 = max(0.01-pow(length(uvx+0.5*pos),2.4),.0)*3.0;
          
          uvx = mix(uv, uvd, -0.4);
          
          float f5 = max(0.01-pow(length(uvx+0.2*pos),5.5),.0)*2.0;
          float f52 = max(0.01-pow(length(uvx+0.4*pos),5.5),.0)*2.0;
          float f53 = max(0.01-pow(length(uvx+0.6*pos),5.5),.0)*2.0;
          
          uvx = mix(uv, uvd, -0.5);
          
          float f6 = max(0.01-pow(length(uvx-0.3*pos),1.6),.0)*6.0;
          float f62 = max(0.01-pow(length(uvx-0.325*pos),1.6),.0)*3.0;
          float f63 = max(0.01-pow(length(uvx-0.35*pos),1.6),.0)*5.0;
          
          vec3 c = vec3(.0);
          
          c.r+=f2+f4+f5+f6; c.g+=f22+f42+f52+f62; c.b+=f23+f43+f53+f63;
          c = c*1.3 - vec3(length(uvd)*.05);
          c+=vec3(f0);

          // Anamorphic streak
          float anamorphicStreak = max(0.0, 1.0 - abs(uv.y - pos.y) * 150.0) * max(0.0, 0.35 - abs(uv.x - pos.x) * 0.05);
          c += vec3(1.0, 0.8, 0.14) * anamorphicStreak * 0.15;
          
          return c;
      }

      vec3 cc(vec3 color, float factor, float factor2) {
          float w = color.x + color.y + color.z;
          return mix(color, vec3(w)*factor, w*factor2);
      }

      float smoothEdgeFade(vec2 uv, float innerEdge, float outerEdge) {
          vec2 resolution = iResolution.xy;
          vec2 pixelDistance = vec2(
              min(uv.x, 1.0 - uv.x) * resolution.x,
              min(uv.y, 1.0 - uv.y) * resolution.y
          );
          float minDist = min(pixelDistance.x, pixelDistance.y);
          return smoothstep(innerEdge, outerEdge, minDist);
      }

      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
          vec2 uv = fragCoord.xy / iResolution.xy - 0.5;
          uv.x *= iResolution.x / iResolution.y;
          vec2 mouse = iMouse.xy / iResolution.xy - 0.5;
          mouse.x *= iResolution.x / iResolution.y;

          vec3 color = vec3(0.0);
          float alpha = 0.0;
          
          if (iMouse.z > 0.0) {
              vec3 flare = vec3(1.4, 1.2, 1.0) * lensflare(uv, mouse);
              flare = cc(flare, 0.25, 0.1);
              
              float fade = smoothEdgeFade(iMouse.xy / iResolution.xy, 0.0, 75.0);
              
              color += flare * fade;
              alpha = length(color) * fade; // Set alpha based on flare intensity
          }
          
          fragColor = vec4(color, alpha);
      }

      void main() {
          mainImage(gl_FragColor, gl_FragCoord.xy);
      }
    `,
    transparent: true
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  uniforms = material.uniforms;

  // Mouse move event listener
  document.addEventListener("mousemove", (event) => {
    uniforms.iMouse.value.x = event.clientX;
    uniforms.iMouse.value.y = window.innerHeight - event.clientY;
    uniforms.iMouse.value.z = 1; // Indicate mouse is active
  });

  document.addEventListener("mouseout", () => {
    uniforms.iMouse.value.z = 0; // Indicate mouse is inactive
  });

  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);

  uniforms.iResolution.value.set(width, height, 1);
}

function animate() {
  requestAnimationFrame(animate);

  uniforms.iTime.value = clock.getElapsedTime();
  uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, 1);

  renderer.render(scene, camera);
}