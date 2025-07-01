import * as THREE from "https://cdn.skypack.dev/three@0.136.0";

let scene, camera, renderer, shaderMaterial, clock;

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  clock = new THREE.Clock();

  const vertexShader = `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `;

  const fragmentShader = `
                uniform float iTime;
                uniform vec2 iResolution;
                uniform vec2 iMouse;
                varying vec2 vUv;

                #define MAX_STEPS 200
                #define MAX_DIST 100.0
                #define SURF_DIST 0.001
                #define PI 3.14159265359

                float hash(float n) { return fract(sin(n) * 1e4); }
                float noise(vec3 x) {
                    vec3 p = floor(x);
                    vec3 f = fract(x);
                    f = f * f * (3.0 - 2.0 * f);
                    float n = p.x + p.y * 157.0 + 113.0 * p.z;
                    return mix(mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                                   mix(hash(n + 157.0), hash(n + 158.0), f.x), f.y),
                               mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                                   mix(hash(n + 270.0), hash(n + 271.0), f.x), f.y), f.z);
                }

                float fbm(vec3 x) {
                    float v = 0.0;
                    float a = 0.5;
                    vec3 shift = vec3(100);
                    for (int i = 0; i < 5; ++i) {
                        v += a * noise(x);
                        x = x * 2.0 + shift;
                        a *= 0.5;
                    }
                    return v;
                }

                float sdSphere(vec3 p, float r) {
                    return length(p) - r;
                }

                float sdBox(vec3 p, vec3 b) {
                    vec3 q = abs(p) - b;
                    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
                }

                float sdTorus(vec3 p, vec2 t) {
                    vec2 q = vec2(length(p.xz) - t.x, p.y);
                    return length(q) - t.y;
                }

                float sdPlane(vec3 p, vec3 n, float h) {
                    return dot(p, n) + h;
                }

                vec2 smin(float a, float b, float k) {
                    float h = max(k - abs(a - b), 0.0) / k;
                    float m = h * h * 0.5;
                    float s = m * k * (1.0 / 2.0);
                    return (a < b) ? vec2(a - s, m) : vec2(b - s, 1.0 - m);
                }

                struct Material {
                    vec3 color;
                    float metallic;
                    float roughness;
                    float ior;
                    float transparency;
                    float emissive;
                };

                struct SDFResult {
                    float dist;
                    Material mat;
                };

                SDFResult sdf(vec3 p) {
                    vec3 ballCenter = vec3(sin(iTime) * 8.0, cos(iTime * 0.5) * 2.0 + 3.5, cos(iTime) * 8.0);
                    float sphere = sdSphere(p - ballCenter, 2.0);
                    Material sphereMat = Material(vec3(0.8, 0.2, 0.1), 0.0, 0.1, 1.5, 0.8, 0.0);
                    
                    float displacement = exp(-length(p.xz - ballCenter.xz) * 0.3) * 0.5 * (1.0 - ballCenter.y / 5.0);
                    float plane = sdPlane(p, vec3(0, 1, 0), 1.0) - displacement * 0.5 - fbm(p * 0.1 + iTime * 0.1) * 0.5;
                    Material planeMat = Material(vec3(0.02, 0.02, 0.02), 0.5, 0.9, 1.0, 0.0, 0.0);
                    
                    vec3 boxPos = vec3(-8.0, 2.0 + sin(iTime) * 1.0, 8.0);
                    float box = sdBox(p - boxPos, vec3(1.5, 1.5, 1.5));
                    Material boxMat = Material(vec3(0.1, 0.8, 0.2), 1.0, 0.2, 1.0, 0.0, 0.0);

                    vec3 torusPos = vec3(8.0, 3.0 + cos(iTime * 0.7) * 1.0, -8.0);
                    float torus = sdTorus(p - torusPos, vec2(2.0, 0.5));
                    Material torusMat = Material(vec3(0.2, 0.2, 1.0), 0.8, 0.2, 1.0, 0.0, 5.0);

                    vec2 res = smin(sphere, plane, 1.0);
                    res = smin(res.x, box, 1.0);
                    res = smin(res.x, torus, 1.0);

                    Material resultMat;
                    if (res.x == sphere) resultMat = sphereMat;
                    else if (res.x == box) resultMat = boxMat;
                    else if (res.x == torus) resultMat = torusMat;
                    else resultMat = planeMat;

                    // Add glow effect to objects near the dark ground
                    float glowIntensity = smoothstep(0.0, 3.0, -p.y) * 0.5;
                    resultMat.emissive += glowIntensity;

                    return SDFResult(res.x, resultMat);
                }

                vec3 getNormal(vec3 p) {
                    vec2 e = vec2(0.001, 0);
                    vec3 n = vec3(
                        sdf(p + e.xyy).dist - sdf(p - e.xyy).dist,
                        sdf(p + e.yxy).dist - sdf(p - e.yxy).dist,
                        sdf(p + e.yyx).dist - sdf(p - e.yyx).dist
                    );
                    return normalize(n);
                }

                float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
                    float res = 1.0;
                    float t = mint;
                    for(int i = 0; i < 64; i++) {
                        float h = sdf(ro + rd * t).dist;
                        if(h < 0.001) return 0.0;
                        res = min(res, k * h / t);
                        t += clamp(h, 0.01, 0.2);
                        if(t > maxt) break;
                    }
                    return res;
                }

                vec3 getEnvironmentColor(vec3 dir) {
                    float t = 0.5 * (dir.y + 1.0);
                    vec3 skyColor = mix(vec3(0.5, 0.7, 1.0), vec3(0.1, 0.2, 0.3), t);
                    
                    vec3 sunDir = normalize(vec3(0.8, 0.6, 0.0));
                    float sunIntensity = pow(max(dot(dir, sunDir), 0.0), 32.0);
                    vec3 sunColor = vec3(1.0, 0.7, 0.4) * sunIntensity;

                    return skyColor + sunColor;
                }

                vec3 render(vec3 ro, vec3 rd) {
                    vec3 col = vec3(0);
                    float depth = 0.0;
                    vec3 rayPos = ro;
                    vec3 rayDir = rd;
                    float ior = 1.0;
                    float reflectionStrength = 1.0;
                    
                    for(int bounce = 0; bounce < 3; bounce++) {
                        float d = 0.0;
                        SDFResult res;
                        
                        for(int i = 0; i < MAX_STEPS; i++) {
                            res = sdf(rayPos);
                            if(res.dist < SURF_DIST || d > MAX_DIST) break;
                            d += res.dist;
                            rayPos += rayDir * res.dist;
                        }
                        
                        if(d > MAX_DIST) {
                            col += getEnvironmentColor(rayDir) * reflectionStrength;
                            break;
                        }
                        
                        vec3 p = rayPos;
                        vec3 normal = getNormal(p);
                        vec3 lightPos = vec3(20.0 * sin(iTime * 0.5), 25.0, 20.0 * cos(iTime * 0.5));
                        vec3 lightDir = normalize(lightPos - p);
                        
                        Material mat = res.mat;

                        float diff = max(dot(normal, lightDir), 0.0);
                        vec3 halfVector = normalize(lightDir - rayDir);
                        float spec = pow(max(dot(normal, halfVector), 0.0), 32.0);
                        float fresnel = pow(1.0 - max(dot(normal, -rayDir), 0.0), 5.0);

                        float shadow = softShadow(p + normal * 0.01, lightDir, 0.02, 2.5, 32.0);
                        
                        vec3 ambient = vec3(0.03);
                        vec3 diffuse = mat.color * diff;
                        vec3 specular = mix(vec3(0.04), mat.color, mat.metallic) * spec;
                        
                        vec3 localColor = (ambient + diffuse * shadow) * (1.0 - mat.metallic);
                        localColor += specular * shadow * (1.0 - mat.roughness);
                        localColor += mat.color * fresnel * mat.metallic;
                        localColor += mat.color * mat.emissive; // Add emissive lighting

                        // Add subtle volumetric lighting effect
                        float fogDensity = 0.05;
                        float fogAmount = 1.0 - exp(-d * fogDensity);
                        vec3 fogColor = vec3(0.1, 0.1, 0.1); // Dark fog color
                        localColor = mix(localColor, fogColor, fogAmount);

                        col += localColor * reflectionStrength * (1.0 - mat.transparency);

                        if(mat.transparency > 0.0) {
                            vec3 refractionDir = refract(rayDir, normal, ior / mat.ior);
                            rayPos = p - normal * 0.01;
                            rayDir = refractionDir;
                            ior = mat.ior;
                            reflectionStrength *= mat.transparency;
                        } else {
                            vec3 reflectionDir = reflect(rayDir, normal);
                            rayPos = p + normal * 0.01;
                            rayDir = reflectionDir;
                            reflectionStrength *= fresnel * mat.metallic;
                        }

                        if(reflectionStrength < 0.01) break;
                    }
                    
                    return col;
                }

                mat3 getCam(vec3 ro, vec3 lookAt) {
                    vec3 camF = normalize(vec3(lookAt - ro));
                    vec3 camR = normalize(cross(vec3(0, 1, 0), camF));
                    vec3 camU = cross(camF, camR);
                    return mat3(camR, camU, camF);
                }

                void main() {
                    vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
                    
                    vec2 m = iMouse.xy / iResolution.xy;
                    
                    vec3 ro = vec3(30.0 * sin(m.x * 6.28), 10.0 + m.y * 10.0, 30.0 * cos(m.x * 6.28));
                    vec3 lookAt = vec3(0, 3, 0);
                    
                    mat3 cam = getCam(ro, lookAt);
                    vec3 rd = cam * normalize(vec3(uv, 1.5));
                    
                    vec3 col = render(ro, rd);
                    
                    // Improved tone mapping (ACES approximation)
                    col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);
                    col = pow(col, vec3(0.4545)); // gamma correction
                    
                    gl_FragColor = vec4(col, 1.0);
                }
            `;

  shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      iTime: { value: 0 },
      iResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight)
      },
      iMouse: { value: new THREE.Vector2(0, 0) }
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
  });

  const plane = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(plane, shaderMaterial);
  scene.add(mesh);

  camera.position.z = 1;

  window.addEventListener("resize", onWindowResize, false);
  window.addEventListener("mousemove", onMouseMove, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  shaderMaterial.uniforms.iResolution.value.set(
    window.innerWidth,
    window.innerHeight
  );
}

function onMouseMove(event) {
  shaderMaterial.uniforms.iMouse.value.set(
    event.clientX / window.innerWidth,
    1 - event.clientY / window.innerHeight
  );
}

function animate() {
  requestAnimationFrame(animate);
  shaderMaterial.uniforms.iTime.value = clock.getElapsedTime();
  renderer.render(scene, camera);
}

init();
animate();