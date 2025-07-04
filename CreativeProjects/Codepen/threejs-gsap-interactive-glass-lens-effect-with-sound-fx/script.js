import * as THREE from "https://esm.sh/three@0.177.0";
import { EffectComposer } from "https://esm.sh/three@0.177.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://esm.sh/three@0.177.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://esm.sh/three@0.177.0/examples/jsm/postprocessing/ShaderPass.js";
import { Pane } from "https://cdn.skypack.dev/tweakpane@4.0.4";

(function () {
  "use strict";

  const supportsWebGL = () => {
    try {
      const c = document.createElement("canvas");
      return !!(
        window.WebGLRenderingContext &&
        (c.getContext("webgl") || c.getContext("experimental-webgl"))
      );
    } catch {
      return false;
    }
  };

  if (!Array.prototype.forEach) {
    Array.prototype.forEach = function (cb, ctx) {
      for (let i = 0; i < this.length; i++) cb.call(ctx, this[i], i, this);
    };
  }

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (cb) => setTimeout(cb, 16.67);
  }

  const App = {
    PARAMS: {
      distortion: {
        strength: 0.15,
        radius: 0.2,
        size: 1,
        edgeWidth: 0.05,
        edgeOpacity: 0.2,
        rimLightIntensity: 0.3,
        rimLightWidth: 0.08,
        chromaticAberration: 0.03,
        reflectionIntensity: 0.3,
        waveDistortion: 0.08,
        waveSpeed: 1.2,
        lensBlur: 0.15,
        clearCenterSize: 0.3,
        followMouse: true,
        animationSpeed: 1,
        overallIntensity: 1,
        preset: "Classic Glass"
      },
      presets: {
        Minimal: {
          strength: 0.05,
          radius: 0.12,
          size: 0.8,
          edgeWidth: 0.02,
          edgeOpacity: 0.1,
          rimLightIntensity: 0.1,
          rimLightWidth: 0.04,
          chromaticAberration: 0.01,
          reflectionIntensity: 0.15,
          waveDistortion: 0.02,
          waveSpeed: 0.8,
          lensBlur: 0.05,
          clearCenterSize: 0.5
        },
        Subtle: {
          strength: 0.08,
          radius: 0.16,
          size: 0.9,
          edgeWidth: 0.03,
          edgeOpacity: 0.15,
          rimLightIntensity: 0.2,
          rimLightWidth: 0.06,
          chromaticAberration: 0.02,
          reflectionIntensity: 0.2,
          waveDistortion: 0.04,
          waveSpeed: 1,
          lensBlur: 0.08,
          clearCenterSize: 0.4
        },
        "Classic Glass": {
          strength: 0.12,
          radius: 0.18,
          size: 1,
          edgeWidth: 0.04,
          edgeOpacity: 0.25,
          rimLightIntensity: 0.3,
          rimLightWidth: 0.08,
          chromaticAberration: 0.025,
          reflectionIntensity: 0.35,
          waveDistortion: 0.03,
          waveSpeed: 0.5,
          lensBlur: 0.12,
          clearCenterSize: 0.2
        },
        Dramatic: {
          strength: 0.25,
          radius: 0.35,
          size: 1.2,
          edgeWidth: 0.08,
          edgeOpacity: 0.4,
          rimLightIntensity: 0.5,
          rimLightWidth: 0.1,
          chromaticAberration: 0.06,
          reflectionIntensity: 0.5,
          waveDistortion: 0.15,
          waveSpeed: 1.8,
          lensBlur: 0.25,
          clearCenterSize: 0.15
        },
        "Chromatic Focus": {
          strength: 0.1,
          radius: 0.22,
          size: 1,
          edgeWidth: 0.06,
          edgeOpacity: 0.3,
          rimLightIntensity: 0.25,
          rimLightWidth: 0.07,
          chromaticAberration: 0.08,
          reflectionIntensity: 0.2,
          waveDistortion: 0.05,
          waveSpeed: 0.8,
          lensBlur: 0.1,
          clearCenterSize: 0.25
        },
        "Liquid Wave": {
          strength: 0.18,
          radius: 0.28,
          size: 1.1,
          edgeWidth: 0.05,
          edgeOpacity: 0.2,
          rimLightIntensity: 0.4,
          rimLightWidth: 0.09,
          chromaticAberration: 0.04,
          reflectionIntensity: 0.4,
          waveDistortion: 0.2,
          waveSpeed: 2.5,
          lensBlur: 0.15,
          clearCenterSize: 0.1
        },
        Gigantic: {
          strength: 0.4,
          radius: 0.65,
          size: 1.8,
          edgeWidth: 0.12,
          edgeOpacity: 0.6,
          rimLightIntensity: 0.8,
          rimLightWidth: 0.15,
          chromaticAberration: 0.1,
          reflectionIntensity: 0.7,
          waveDistortion: 0.25,
          waveSpeed: 1.5,
          lensBlur: 0.35,
          clearCenterSize: 0.05
        }
      }
    },

    scene: null,
    camera: null,
    renderer: null,
    composer: null,
    customPass: null,
    backgroundTexture: null,
    backgroundMesh: null,
    aspect: 1,
    backgroundScene: null,
    backgroundCamera: null,
    mousePosition: { x: 0.5, y: 0.5 },
    targetMousePosition: { x: 0.5, y: 0.5 },
    staticMousePosition: { x: 0.5, y: 0.5 },
    performanceMonitor: { frameCount: 0, lastTime: 0, fps: 60 },
    pane: null,
    isBackgroundPlaying: false,
    paneVisible: false,
    paneInitialized: false,
    isSceneReady: false,
    isTextureLoaded: false,
    webglSupported: supportsWebGL(),

    init() {
      this.setupAudio();
      this.setupKeyboardControls();
      this.bindEvents();
      if (!this.webglSupported) {
        this.showFallback();
        return;
      }
      this.waitForDependencies();
    },

    waitForDependencies() {
      const chk = setInterval(() => {
        if (window.gsap && window.SplitText) {
          clearInterval(chk);
          this.onDependenciesReady();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(chk);
        this.onDependenciesReady();
      }, 10000);
    },

    onDependenciesReady() {},

    showError(m) {
      const el = document.getElementById("errorMessage");
      if (!el) return;
      el.textContent = m;
      el.style.display = "block";
      setTimeout(() => (el.style.display = "none"), 5000);
    },

    showFallback() {
      document.getElementById("fallbackBg").classList.add("active");
      this.finishPreloader();
    },

    setupAudio() {
      this.startClickSound = document.getElementById("startClickSound");
      this.preloaderSound = document.getElementById("preloaderSound");
      this.hoverSound = document.getElementById("hoverSound");
      this.backgroundMusic = document.getElementById("backgroundMusic");
    },

    bindEvents() {
      document.getElementById("enableBtn").onclick = () => this.onStartClick();
    },

    onStartClick() {
      document.body.classList.add("loading-active");
      this.startClickSound?.play().catch(() => {});
      document.querySelector(".audio-enable").style.display = "none";
      document.getElementById("preloader").style.display = "flex";
      this.preloaderSound?.play().catch(() => {});
      setTimeout(() => {
        if (this.backgroundMusic) {
          this.backgroundMusic.volume = 0.3;
          this.backgroundMusic.play().catch(() => {});
          this.isBackgroundPlaying = true;
        }
      }, 500);
      this.webglSupported ? this.initializeScene() : this.showFallback();
      this.startPreloader();
    },

    startPreloader() {
      let c = 0;
      const timer = setInterval(() => {
        const el = document.getElementById("counter");
        if (el)
          el.textContent =
            "[" + (c < 10 ? "00" : c < 100 ? "0" : "") + ++c + "]";
        if (c >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            this.preloaderSound?.pause();
            if (this.preloaderSound) this.preloaderSound.currentTime = 0;
            this.finishPreloader();
          }, 200);
        }
      }, 30);
    },

    finishPreloader() {
      const wait = () => {
        if (
          (this.isSceneReady && this.isTextureLoaded) ||
          !this.webglSupported
        ) {
          const pre = document.getElementById("preloader");
          pre.classList.add("fade-out");
          if (this.webglSupported)
            document.getElementById("canvas").classList.add("ready");
          setTimeout(() => {
            document.body.classList.remove("loading-active");
            pre.style.display = "none";
            pre.classList.remove("fade-out");
            this.animateTextElements();
          }, 800);
        } else setTimeout(wait, 50);
      };
      wait();
    },

    animateTextElements() {
      if (!window.gsap || !window.SplitText) {
        this.fallbackTextAnimation();
        return;
      }

      const ease = window.CustomEase
        ? (CustomEase.create("customOut", "0.65,0.05,0.36,1"), "customOut")
        : "power2.out";
      const containers = [
        ".description",
        ".division",
        ".signal",
        ".central-text",
        ".footer"
      ];

      gsap.set(containers.concat(".nav-links"), { opacity: 0 });

      const splits = containers.map(
        (sel) =>
          SplitText.create(sel, { type: "lines", linesClass: "line" }).lines
      );
      const [descLines, divLines, sigLines, centralLines, footerLines] = splits;

      gsap.set(containers, { opacity: 1 });
      gsap.set(splits.flat().concat(".nav-links a"), { opacity: 0, y: 30 });

      const tl = gsap.timeline();
      tl.to(descLines, { opacity: 1, y: 0, duration: 0.8, ease, stagger: 0.18 })
        .to(".nav-links", { opacity: 1, duration: 0.2 }, 0.12)
        .to(
          ".nav-links a",
          { opacity: 1, y: 0, duration: 0.8, ease, stagger: 0.15 },
          0.12
        )
        .to(
          centralLines,
          { opacity: 1, y: 0, duration: 0.8, ease, stagger: 0.22 },
          0.25
        )
        .to(
          footerLines,
          { opacity: 1, y: 0, duration: 0.8, ease, stagger: 0.18 },
          0.4
        )
        .to(
          divLines,
          { opacity: 1, y: 0, duration: 0.8, ease, stagger: 0.18 },
          0.55
        )
        .to(
          sigLines,
          { opacity: 1, y: 0, duration: 0.8, ease, stagger: 0.18 },
          0.55
        );
    },

    fallbackTextAnimation() {
      let d = 0;
      document.querySelectorAll(".text-element").forEach((el) => {
        setTimeout(() => {
          el.style.opacity = "1";
          el.style.transform = el.classList.contains("central-text")
            ? "translateX(-50%) translateY(0)"
            : "translateY(0)";
        }, d);
        d += 250;
      });
    },

    initializeScene() {
      if (!this.webglSupported) {
        this.isSceneReady = this.isTextureLoaded = true;
        return;
      }

      const canvas = document.getElementById("canvas");
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        premultipliedAlpha: false
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.autoClear = false;

      this.aspect = window.innerWidth / window.innerHeight;

      this.backgroundScene = new THREE.Scene();
      this.backgroundCamera = new THREE.OrthographicCamera(
        -this.aspect,
        this.aspect,
        1,
        -1,
        0.1,
        10
      );
      this.backgroundCamera.position.z = 1;

      this.scene = new THREE.Scene();
      this.camera = new THREE.OrthographicCamera(
        -this.aspect,
        this.aspect,
        1,
        -1,
        0.1,
        10
      );
      this.camera.position.z = 1;

      this.loadBackgroundTexture();
      this.setupPostProcessing();
      this.setupPane();
      this.setupNavHoverSounds();

      const onResize = this.onWindowResize.bind(this);
      const onMouseMove = this.onMouseMove.bind(this);
      const onTouchMove = this.onTouchMove.bind(this);
      const onTouchStart = this.onTouchStart.bind(this);

      window.addEventListener("resize", onResize);
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("touchmove", onTouchMove);
      document.addEventListener("touchstart", onTouchStart);

      this.animate();
      this.isSceneReady = true;
    },

    onMouseMove(e) {
      if (this.PARAMS.distortion.followMouse) {
        this.targetMousePosition.x = e.clientX / window.innerWidth;
        this.targetMousePosition.y = 1 - e.clientY / window.innerHeight;
      }
    },

    onTouchStart(e) {
      e.preventDefault();
      if (e.touches.length) this.onTouchMove(e);
    },

    onTouchMove(e) {
      e.preventDefault();
      if (this.PARAMS.distortion.followMouse && e.touches.length) {
        const t = e.touches[0];
        this.targetMousePosition.x = t.clientX / window.innerWidth;
        this.targetMousePosition.y = 1 - t.clientY / window.innerHeight;
      }
    },

    loadBackgroundTexture() {
      new THREE.TextureLoader().load(
        "https://assets.codepen.io/7558/red-protocol-poster-03-bg.jpg",
        (tex) => {
          this.backgroundTexture = tex;
          this.createBackgroundMesh();
          this.isTextureLoaded = true;
        },
        undefined,
        () => (this.isTextureLoaded = true)
      );
    },

    createBackgroundMesh() {
      if (this.backgroundMesh) this.backgroundScene.remove(this.backgroundMesh);

      const imgAspect =
        this.backgroundTexture.image.width /
        this.backgroundTexture.image.height;
      const scAspect = window.innerWidth / window.innerHeight;
      let sx, sy;

      if (scAspect > imgAspect) {
        sx = scAspect * 2;
        sy = sx / imgAspect;
      } else {
        sy = 2;
        sx = sy * imgAspect;
      }

      const g = new THREE.PlaneGeometry(sx, sy);
      const m = new THREE.MeshBasicMaterial({ map: this.backgroundTexture });
      this.backgroundMesh = new THREE.Mesh(g, m);
      this.backgroundScene.add(this.backgroundMesh);
    },

    setupPostProcessing() {
      this.composer = new EffectComposer(this.renderer);
      const rp = new RenderPass(this.backgroundScene, this.backgroundCamera);
      this.composer.addPass(rp);
      this.setupDistortionPass();
    },

    setupDistortionPass() {
      const v = `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
      const f = `uniform sampler2D tDiffuse;uniform vec2 uMouse;uniform float uRadius;uniform float uSize;uniform float uStrength;uniform float uEdgeWidth;uniform float uEdgeOpacity;uniform float uRimLightIntensity;uniform float uRimLightWidth;uniform float uChromaticAberration;uniform float uReflectionIntensity;uniform float uWaveDistortion;uniform float uWaveSpeed;uniform float uLensBlur;uniform float uClearCenterSize;uniform float uOverallIntensity;uniform float uAspect;uniform float uTime;varying vec2 vUv;

vec4 blur(sampler2D i,vec2 uv,vec2 r,vec2 d,float it){vec4 c=vec4(0.);vec2 o=1.3333333*d*it;c+=texture2D(i,uv)*.2941176;c+=texture2D(i,uv+(o/r))*.3529412;c+=texture2D(i,uv-(o/r))*.3529412;return c;}

void main(){
  vec2 c=uMouse;
  vec2 a=vUv;
  a.x*=uAspect;
  c.x*=uAspect;
  float dist=distance(a,c);
  float rad=uRadius*uSize;
  vec4 orig=texture2D(tDiffuse,vUv);
  
  // Calculate the effect for all pixels
  float nd=dist/rad;
  vec2 dir=normalize(a-c);
  float cl=uClearCenterSize*rad;
  float df=smoothstep(cl,rad,dist);
  float powd=1.+nd*2.;
  vec2 dUv=a-dir*uStrength*pow(df,powd);
  float w1=sin(nd*8.-uTime*uWaveSpeed)*uWaveDistortion;
  float w2=cos(nd*12.-uTime*uWaveSpeed*.7)*uWaveDistortion*.5;
  dUv+=dir*(w1+w2)*df;
  dUv.x/=uAspect;
  float ab=uChromaticAberration*df*(1.+nd);
  vec2 rO=dir*ab*1.2/vec2(uAspect,1.);
  vec2 bO=dir*ab*0.8/vec2(uAspect,1.);
  vec4 colR=texture2D(tDiffuse,dUv+rO);
  vec4 colG=texture2D(tDiffuse,dUv);
  vec4 colB=texture2D(tDiffuse,dUv-bO);
  vec4 ref1=texture2D(tDiffuse,vUv+dir*0.08*df);
  vec4 ref2=texture2D(tDiffuse,vUv+dir*0.15*df);
  vec4 ref=mix(ref1,ref2,.6);
  vec4 col=vec4(colR.r,colG.g,colB.b,1.);
  col=mix(col,ref,uReflectionIntensity*df);
  float bl=uLensBlur*df*(1.+nd*.5);
  vec4 blr=blur(tDiffuse,dUv,vec2(1./uAspect,1.),vec2(1.),bl);
  col=mix(col,blr,df*.7);
  float edge=smoothstep(rad-uEdgeWidth,rad,dist);
  vec3 eCol=mix(vec3(1.),vec3(.8,.9,1.),nd);
  col=mix(col,vec4(eCol,1.),edge*uEdgeOpacity);
  float rimD=rad-uRimLightWidth;
  float rim=smoothstep(rimD-0.02,rimD+0.02,dist);
  rim*=(1.-smoothstep(rad-0.01,rad,dist));
  col=mix(col,vec4(1.),rim*uRimLightIntensity);
  float br=1.+sin(nd*6.-uTime*2.)*.1*df;
  col.rgb*=br;
  
  // Replace hard cutoff with ultra-tight smoothstep to fix jagged edges
  float effectMask = 1.0 - smoothstep(rad - 0.001, rad + 0.001, dist);
  
  gl_FragColor=mix(orig, mix(orig,col,uOverallIntensity), effectMask);
}`;

      this.customPass = new ShaderPass({
        uniforms: {
          tDiffuse: { value: null },
          uMouse: { value: new THREE.Vector2(0.5, 0.5) },
          uRadius: { value: this.PARAMS.distortion.radius },
          uSize: { value: this.PARAMS.distortion.size },
          uStrength: { value: this.PARAMS.distortion.strength },
          uEdgeWidth: { value: this.PARAMS.distortion.edgeWidth },
          uEdgeOpacity: { value: this.PARAMS.distortion.edgeOpacity },
          uRimLightIntensity: {
            value: this.PARAMS.distortion.rimLightIntensity
          },
          uRimLightWidth: { value: this.PARAMS.distortion.rimLightWidth },
          uChromaticAberration: {
            value: this.PARAMS.distortion.chromaticAberration
          },
          uReflectionIntensity: {
            value: this.PARAMS.distortion.reflectionIntensity
          },
          uWaveDistortion: { value: this.PARAMS.distortion.waveDistortion },
          uWaveSpeed: { value: this.PARAMS.distortion.waveSpeed },
          uLensBlur: { value: this.PARAMS.distortion.lensBlur },
          uClearCenterSize: { value: this.PARAMS.distortion.clearCenterSize },
          uOverallIntensity: { value: this.PARAMS.distortion.overallIntensity },
          uAspect: { value: this.aspect },
          uTime: { value: 0 }
        },
        vertexShader: v,
        fragmentShader: f
      });

      this.customPass.renderToScreen = true;
      this.composer.addPass(this.customPass);
    },

    setupNavHoverSounds() {
      document.querySelectorAll(".nav-links a").forEach((a) => {
        a.addEventListener("mouseenter", () => {
          if (this.hoverSound && this.isBackgroundPlaying) {
            this.hoverSound.currentTime = 0;
            this.hoverSound.volume = 0.4;
            this.hoverSound.play().catch(() => {});
          }
        });
      });
    },

    setupKeyboardControls() {
      document.addEventListener("keydown", (e) => {
        if (e.key.toLowerCase() === "h") {
          e.preventDefault();
          this.togglePane();
        }
      });
    },

    togglePane() {
      if (!this.paneInitialized) this.setupPane();
      if (this.pane) {
        this.paneVisible = !this.paneVisible;
        this.pane.hidden = !this.paneVisible;
      }
    },

    setupPane() {
      if (this.paneInitialized) return;

      const p = (this.pane = new Pane({
        title: "Glass Refraction Controls",
        expanded: true
      }));

      p.addBinding(this.PARAMS.distortion, "preset", {
        label: "Presets",
        options: {
          Minimal: "Minimal",
          Subtle: "Subtle",
          "Classic Glass": "Classic Glass",
          Dramatic: "Dramatic",
          "Chromatic Focus": "Chromatic Focus",
          "Liquid Wave": "Liquid Wave",
          Gigantic: "Gigantic"
        }
      }).on("change", (ev) => this.loadPreset(ev.value));

      p.addButton({ title: "Reload Preset" }).on("click", () =>
        this.loadPreset(this.PARAMS.distortion.preset)
      );

      const addBinding = (prop, opts) =>
        p.addBinding(this.PARAMS.distortion, prop, opts).on("change", (ev) => {
          const uniformName =
            "u" + prop.charAt(0).toUpperCase() + prop.slice(1);
          if (this.customPass?.uniforms[uniformName])
            this.customPass.uniforms[uniformName].value = ev.value;
        });

      addBinding("overallIntensity", {
        min: 0,
        max: 2,
        step: 0.01,
        label: "Overall Intensity"
      });
      p.addBinding(this.PARAMS.distortion, "followMouse", {
        label: "Follow Mouse"
      }).on("change", (ev) => {
        if (!ev.value) this.staticMousePosition = { x: 0.5, y: 0.5 };
      });
      addBinding("animationSpeed", {
        min: 0,
        max: 3,
        step: 0.1,
        label: "Animation Speed"
      });

      const f1 = p.addFolder({ title: "Size Controls" });
      f1.addBinding(this.PARAMS.distortion, "size", {
        min: 0.2,
        max: 3,
        step: 0.1,
        label: "Effect Size"
      }).on(
        "change",
        (ev) => (this.customPass.uniforms.uSize.value = ev.value)
      );
      f1.addBinding(this.PARAMS.distortion, "radius", {
        min: 0.05,
        max: 0.8,
        step: 0.01,
        label: "Base Radius"
      }).on(
        "change",
        (ev) => (this.customPass.uniforms.uRadius.value = ev.value)
      );

      const f2 = p.addFolder({ title: "Refraction Properties" });
      f2.addBinding(this.PARAMS.distortion, "strength", {
        min: 0,
        max: 0.5,
        step: 0.01,
        label: "Refraction Strength"
      }).on(
        "change",
        (ev) => (this.customPass.uniforms.uStrength.value = ev.value)
      );
      f2.addBinding(this.PARAMS.distortion, "clearCenterSize", {
        min: 0,
        max: 1,
        step: 0.01,
        label: "Clear Center"
      }).on(
        "change",
        (ev) => (this.customPass.uniforms.uClearCenterSize.value = ev.value)
      );

      const f3 = p.addFolder({ title: "Visual Effects" });
      f3.addBinding(this.PARAMS.distortion, "chromaticAberration", {
        min: 0,
        max: 0.15,
        step: 0.001,
        label: "Chromatic Aberration"
      }).on(
        "change",
        (ev) => (this.customPass.uniforms.uChromaticAberration.value = ev.value)
      );
      f3.addBinding(this.PARAMS.distortion, "reflectionIntensity", {
        min: 0,
        max: 1,
        step: 0.01,
        label: "Reflections"
      }).on(
        "change",
        (ev) => (this.customPass.uniforms.uReflectionIntensity.value = ev.value)
      );
      f3.addBinding(this.PARAMS.distortion, "lensBlur", {
        min: 0,
        max: 0.5,
        step: 0.01,
        label: "Lens Blur"
      }).on(
        "change",
        (ev) => (this.customPass.uniforms.uLensBlur.value = ev.value)
      );

      const f4 = p.addFolder({ title: "Wave Animation" });
      f4.addBinding(this.PARAMS.distortion, "waveDistortion", {
        min: 0,
        max: 0.3,
        step: 0.01,
        label: "Wave Strength"
      }).on(
        "change",
        (ev) => (this.customPass.uniforms.uWaveDistortion.value = ev.value)
      );
      f4.addBinding(this.PARAMS.distortion, "waveSpeed", {
        min: 0,
        max: 5,
        step: 0.1,
        label: "Wave Speed"
      }).on(
        "change",
        (ev) => (this.customPass.uniforms.uWaveSpeed.value = ev.value)
      );

      const f5 = p.addFolder({ title: "Edge Effects" });
      f5.addBinding(this.PARAMS.distortion, "edgeWidth", {
        min: 0,
        max: 0.2,
        step: 0.01,
        label: "Edge Width"
      }).on(
        "change",
        (ev) => (this.customPass.uniforms.uEdgeWidth.value = ev.value)
      );
      f5.addBinding(this.PARAMS.distortion, "edgeOpacity", {
        min: 0,
        max: 1,
        step: 0.01,
        label: "Edge Opacity"
      }).on(
        "change",
        (ev) => (this.customPass.uniforms.uEdgeOpacity.value = ev.value)
      );

      const f6 = p.addFolder({ title: "Rim Lighting" });
      f6.addBinding(this.PARAMS.distortion, "rimLightIntensity", {
        min: 0,
        max: 1,
        step: 0.01,
        label: "Rim Light Intensity"
      }).on(
        "change",
        (ev) => (this.customPass.uniforms.uRimLightIntensity.value = ev.value)
      );
      f6.addBinding(this.PARAMS.distortion, "rimLightWidth", {
        min: 0,
        max: 0.3,
        step: 0.01,
        label: "Rim Light Width"
      }).on(
        "change",
        (ev) => (this.customPass.uniforms.uRimLightWidth.value = ev.value)
      );

      Object.assign(p.element.style, {
        position: "fixed",
        top: "10px",
        right: "10px",
        zIndex: "3000"
      });
      p.hidden = true;
      this.paneVisible = false;
      this.paneInitialized = true;
      this.loadPreset("Classic Glass");
    },

    loadPreset(name) {
      const preset = this.PARAMS.presets[name];
      if (!preset) return;

      Object.entries(preset).forEach(([k, v]) => {
        if (k in this.PARAMS.distortion) {
          this.PARAMS.distortion[k] = v;
          const uniformName = "u" + k.charAt(0).toUpperCase() + k.slice(1);
          if (this.customPass?.uniforms[uniformName])
            this.customPass.uniforms[uniformName].value = v;
        }
      });

      this.PARAMS.distortion.preset = name;
      this.pane?.refresh();
    },

    onWindowResize() {
      this.aspect = window.innerWidth / window.innerHeight;

      if (this.camera) {
        this.camera.left = this.camera.right = this.backgroundCamera.left = this.backgroundCamera.right = null;
        [this.camera, this.backgroundCamera].forEach((cam) => {
          cam.left = -this.aspect;
          cam.right = this.aspect;
          cam.updateProjectionMatrix();
        });
      }

      this.renderer?.setSize(window.innerWidth, window.innerHeight);
      this.composer?.setSize(window.innerWidth, window.innerHeight);

      if (this.customPass) this.customPass.uniforms.uAspect.value = this.aspect;
      if (this.backgroundTexture) this.createBackgroundMesh();
    },

    animate(time = 0) {
      requestAnimationFrame((t) => this.animate(t));
      if (!this.webglSupported || !this.renderer) return;

      this.performanceMonitor.frameCount++;
      if (time - this.performanceMonitor.lastTime >= 1000) {
        this.performanceMonitor.fps = this.performanceMonitor.frameCount;
        this.performanceMonitor.frameCount = 0;
        this.performanceMonitor.lastTime = time;

        const fpsElement = document.getElementById("fpsCounter");
        if (fpsElement)
          fpsElement.textContent = String(this.performanceMonitor.fps);
      }

      const tgt = this.PARAMS.distortion.followMouse
        ? this.targetMousePosition
        : this.staticMousePosition;
      this.mousePosition.x += (tgt.x - this.mousePosition.x) * 0.1;
      this.mousePosition.y += (tgt.y - this.mousePosition.y) * 0.1;

      if (this.customPass) {
        this.customPass.uniforms.uMouse.value.set(
          this.mousePosition.x,
          this.mousePosition.y
        );
        this.customPass.uniforms.uTime.value =
          time * 0.001 * this.PARAMS.distortion.animationSpeed;
      }

      this.composer
        ? this.composer.render()
        : (this.renderer.clear(),
          this.renderer.render(this.backgroundScene, this.backgroundCamera));
    }
  };

  window.addEventListener("error", (e) => {
    let m = "An error occurred";
    if (e.error?.message) m += ": " + e.error.message;
    if (e.filename) m += " in " + e.filename;
    App.showError(m + ". Some features may not work properly.");
  });

  window.addEventListener("unhandledrejection", (e) => {
    App.showError(
      "Loading failed: " + (e.reason || "Unknown error") + ". Retrying..."
    );
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => App.init());
  } else {
    App.init();
  }

  window.App = App;
})();