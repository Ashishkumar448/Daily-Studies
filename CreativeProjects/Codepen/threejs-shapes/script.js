import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { EffectComposer } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js";
import { GUI } from "https://cdn.skypack.dev/dat.gui";

let scene, camera, renderer, plane, uniforms;

function init() {
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const geometry = new THREE.PlaneGeometry(2, 2);

  uniforms = {
    iTime: { value: 0 },
    iResolution: {
      value: new THREE.Vector3(window.innerWidth, window.innerHeight, 1)
    }
  };

  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: `
                    void main() {
                        gl_Position = vec4(position, 1.0);
                    }
                `,
    fragmentShader: `
                    uniform float iTime;
                    uniform vec3 iResolution;

                    ${shaderCode}

                    void main() {
                        vec4 fragColor;
                        mainImage(fragColor, gl_FragCoord.xy);
                        gl_FragColor = fragColor;
                    }
                `
  });

  plane = new THREE.Mesh(geometry, material);
  scene.add(plane);
}

function animate() {
  requestAnimationFrame(animate);
  uniforms.iTime.value += 0.01;
  renderer.render(scene, camera);
}

function onWindowResize() {
  uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", onWindowResize, false);

const shaderCode = `
        // Rotation matrix around the X axis.
        mat3 rotateX(float theta) {
            float c = cos(theta);
            float s = sin(theta);
            return mat3(
                vec3(1, 0, 0),
                vec3(0, c, -s),
                vec3(0, s, c)
            );
        }

        // Rotation matrix around the Y axis.
        mat3 rotateY(float theta) {
            float c = cos(theta);
            float s = sin(theta);
            return mat3(
                vec3(c, 0, s),
                vec3(0, 1, 0),
                vec3(-s, 0, c)
            );
        }

        // Rotation matrix around the Z axis.
        mat3 rotateZ(float theta) {
            float c = cos(theta);
            float s = sin(theta);
            return mat3(
                vec3(c, -s, 0),
                vec3(s, c, 0),
                vec3(0, 0, 1)
            );
        }

        // Identity matrix.
        mat3 identity() {
            return mat3(
                vec3(1, 0, 0),
                vec3(0, 1, 0),
                vec3(0, 0, 1)
            );
        }

        float sdTorus(vec3 p, vec2 t, vec3 offset, mat3 transform) {
            p = (p - offset) * transform;
            vec2 q = vec2(length(p.xz)-t.x,p.y);
            return length(q)-t.y;
        }

        float sdSphere(vec3 p, vec3 c, float r, vec3 offset, mat3 transform) {
            p = (p - offset) * transform;
            return length(p - c) - r;
        }

        float sdBox(vec3 p, vec3 c, float r, vec3 offset, mat3 transform) {
            p = (p - offset) * transform;
            vec3 q = abs(p) - c;
            return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
        }

        float sdPyramid(vec3 p, float h, vec3 offset, mat3 transform) {
            p = (p - offset) * transform;
            float m2 = h*h + 0.25;
            
            p.xz = abs(p.xz);
            p.xz = (p.z>p.x) ? p.zx : p.xz;
            p.xz -= 0.07;

            vec3 q = vec3(p.z, h*p.y - 0.5*p.x, h*p.x + 0.5*p.y);
            
            float s = max(-q.x,0.0);
            float t = clamp((q.y-0.5*p.z)/(m2+0.25), 0.0, 1.0);
            
            float a = m2*(q.x+s)*(q.x+s) + q.y*q.y;
            float b = m2*(q.x+0.5*t)*(q.x+0.5*t) + (q.y-m2*t)*(q.y-m2*t);
            
            float d2 = min(q.y,-q.x*m2-q.y*0.5) > 0.0 ? 0.0 : min(a,b);
            
            return sqrt((d2+q.z*q.z)/m2) * sign(max(q.z,-p.y));
        }

        float sdCone(vec3 p, vec2 c, float h, vec3 offset, mat3 transform) {
            p = (p - offset) * transform;
            vec2 q = h*vec2(c.x/c.y,-1.0);
            
            vec2 w = vec2(length(p.xz), p.y);
            vec2 a = w - q*clamp(dot(w,q)/dot(q,q), 0.0, 1.0);
            vec2 b = w - q*vec2(clamp(w.x/q.x, 0.0, 1.0), 1.0);
            float k = sign(q.y);
            float d = min(dot(a, a), dot(b, b));
            float s = max(k*(w.x*q.y-w.y*q.x), k*(w.y-q.y));
            return sqrt(d)*sign(s);
        }

        float sdCappedTorus(vec3 p, vec2 sc, float ra, float rb, vec3 offset, mat3 transform) {
            p = (p - offset) * transform;
            p.x = abs(p.x);
            float k = (sc.y*p.x>sc.x*p.y) ? dot(p.xy,sc) : length(p.xy);
            return sqrt(dot(p,p) + ra*ra - 2.0*ra*k) - rb;
        }

        float map(vec3 p) {
            float t = sdTorus(p, vec2(0.28,0.035), vec3(0.2,0.1,0.4), rotateX(2.14)*rotateZ(6.45));
            t = min(t, sdBox(p, vec3(0.04,0.04,0.039), 0.001, vec3(0.1,0.28,0.35), rotateZ(0.4) * rotateX(1.24))); 
            t = min(t, sdBox(p, vec3(0.2,0.4,0.3), 0.05, vec3(-0.5,3.5,-0.1), identity()));
            t = min(t, sdSphere(p, vec3(0.14,0.08,0.24), 0.09, vec3(0.0,-0.1,0.2), identity()));
            t = min(t, sdSphere(p, vec3(0.14,0.1,0.24), 0.03, vec3(-0.01,0.23,0.14), identity()));
            t = min(t, sdSphere(p, vec3(0.45,0.08,0.24), 0.02, vec3(-0.01,0.23,0.14), identity()));
            t = min(t, sdSphere(p, vec3(0.45,0.08,0.24), 0.03, vec3(-0.04,-0.1,0.37), identity()));
            t = min(t, sdSphere(p, vec3(0.55,-0.05,0.31), 0.02, vec3(-0.01,0.23,0.14), identity()));
            t = min(t, sdSphere(p, vec3(0.55,-0.4,0.1), 0.035, vec3(-0.01,0.3,0.14), identity()));
            t = min(t, sdTorus(p, vec2(0.14,0.01), vec3(0.49,0.17,0.4), rotateX(-0.2)*rotateZ(6.35)));
            t = min(t, sdSphere(p, vec3(0.4,0.4,-0.2), 0.1, vec3(0.0,-0.1,0.2), identity()));
            t = min(t, sdTorus(p, vec2(0.16,0.01), vec3(0.4,0.31,0.02), rotateX(0.5)*rotateZ(6.35)));
            t = min(t, sdSphere(p, vec3(0.4,0.4,-0.2), 0.03, vec3(0.08,0.01,0.1), identity()));
            t = min(t, sdBox(p, vec3(0.04,0.04,0.039), 0.002, vec3(0.43,-0.16,0.32), rotateZ(1.0) * rotateX(1.24)));
            t = min(t, sdPyramid(p, 1.0, vec3(0.5,-0.18,0.08), rotateZ(-0.5)));
            t = min(t, sdPyramid(p, 1.0, vec3(0.1,0.18,0.56), rotateX(0.5) * rotateZ(0.5)));
            t = min(t, sdCone(p, vec2(sin(0.2),cos(0.3)), 0.3, vec3(0.4,-0.1,-0.01), rotateY(0.3) * rotateX(1.8) * rotateZ(0.3)));
            t = min(t, sdCone(p, vec2(sin(0.2),cos(0.3)), 0.2, vec3(0.3,-0.04,0.66), rotateZ(3.3)));
            t = min(t, sdCappedTorus(p, vec2(0.19,0.01), 0.09, 0.016, vec3(0.5,0.02,0.08), rotateZ(3.7)));
            t = min(t, sdCappedTorus(p, vec2(0.1,0.02), 0.06, 0.011, vec3(0.5,0.03,0.56), rotateZ(1.7)));
            return t;
        }

        vec3 calcNormal(vec3 pos) {
            vec2 e = vec2(1.0,-1.0)*0.5773*0.0005;
            return normalize(
                e.xyy*map(pos + e.xyy) + 
                e.yyx*map(pos + e.yyx) + 
                e.yxy*map(pos + e.yxy) + 
                e.xxx*map(pos + e.xxx)
            );
        }

        float calcSoftshadow(vec3 ro, vec3 rd, float mint, float tmax) {
            float res = 1.0;
            float t = mint;
            for(int i=0; i<16; i++) {
                float h = map(ro + rd*t);
                res = min(res, 8.0*h/t);
                t += clamp(h, 0.02, 0.10);
                if(res<0.005 || t>tmax) break;
            }
            return clamp(res, 0.0, 1.0);
        }

        float calcOcclusion(vec3 pos, vec3 nor) {
            float occ = 0.0;
            float sca = 1.0;
            for(int i=0; i<5; i++) {
                float hr = 0.01 + 0.15*float(i)/4.0;
                vec3 aopos = nor * hr + pos;
                float dd = map(aopos);
                occ += -(dd-hr)*sca;
                sca *= 0.95;
            }
            return clamp(1.0 - occ*1.5, 0.0, 1.0);
        }

        void mainImage(out vec4 fragColor, in vec2 fragCoord) {
            vec2 p = (-iResolution.xy + 2.0*fragCoord)/iResolution.y;

            // camera movement    
            float an = 0.7*iTime;
            vec3 ro = vec3(1.0*cos(an), 0.2, 1.0*sin(an));
            vec3 ta = vec3(0.0, 0.0, 0.0);
            // camera matrix
            vec3 ww = normalize(ta - ro);
            vec3 uu = normalize(cross(ww,vec3(0.0,1.0,0.0)));
            vec3 vv = normalize(cross(uu,ww));
            // create view ray
            vec3 rd = normalize(p.x*uu + p.y*vv + 1.5*ww);

            // raymarch
            const float tmax = 5.0;
            float t = 0.0;
            for(int i=0; i<256; i++) {
                vec3 pos = ro + t*rd;
                float h = map(pos);
                if(h<0.0001 || t>tmax) break;
                t += h;
            }
            
            // shading/lighting    
            vec3 col = vec3(0.0);
            if(t<tmax) {
                vec3 pos = ro + t*rd;
                vec3 nor = calcNormal(pos);
                vec3 lig = normalize(vec3(0.6,0.2,0.4));
                vec3 hal = normalize(lig-rd);
                float dif = clamp(dot(nor,lig), 0.0,1.0);
                float occ = calcOcclusion(pos, nor);
                if(dif>0.001) 
                    dif *= calcSoftshadow(pos, lig, 0.01, 1.0);
                float spe = pow(clamp(dot(nor,hal),0.0,1.0),16.0)*
                            dif*
                            (0.04 + 0.96*pow(clamp(1.0-dot(hal,-rd),0.0,1.0),5.0));
                float amb = 0.5 + 0.5*dot(nor,vec3(0.0,1.0,0.0));
                col = vec3(0.5,1.0,1.2)*amb*occ;
                col += vec3(2.8,2.2,1.8)*dif;
                
                col *= 0.2;
                
                col += vec3(2.8,2.2,1.8)*spe*3.0;
            }

            // gamma        
            col = sqrt(col);
            fragColor = vec4(col, 1.0);
        }
        `;

init();
animate();