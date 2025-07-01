(function () {
  const CANVAS_WIDTH = 180;
  const CANVAS_HEIGHT = 180;
  const MONOCHROME_FILL = (opacity) =>
    `rgba(255, 255, 255, ${Math.max(0, Math.min(1, opacity))})`;

  function createCanvasInContainer(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    container.innerHTML = "";
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.style.position = "absolute";
    canvas.style.left = "0";
    canvas.style.top = "0";
    container.appendChild(canvas);
    return canvas.getContext("2d");
  }

  function addCornerDecorations() {
    document.querySelectorAll(".animation-container").forEach((container) => {
      const corners = ["top-left", "top-right", "bottom-left", "bottom-right"];
      corners.forEach((position) => {
        const corner = document.createElement("div");
        corner.className = `corner ${position}`;
        const svg = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg"
        );
        svg.setAttribute("width", "16");
        svg.setAttribute("height", "16");
        svg.setAttribute("viewBox", "0 0 512 512");
        svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        const polygon = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "polygon"
        );
        polygon.setAttribute(
          "points",
          "448,224 288,224 288,64 224,64 224,224 64,224 64,288 224,288 224,448 288,448 288,288 448,288"
        );
        polygon.setAttribute("fill", "currentColor");
        svg.appendChild(polygon);
        corner.appendChild(svg);
        container.appendChild(corner);
      });
    });
  }

  function setupPulseWave() {
    const ctx = createCanvasInContainer("pulse-wave");
    if (!ctx) return;
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    let time = 0;
    let lastTime = 0;
    const dotRings = [
      { radius: 15, count: 6 },
      { radius: 30, count: 12 },
      { radius: 45, count: 18 },
      { radius: 60, count: 24 },
      { radius: 75, count: 30 }
    ];

    function animate(timestamp) {
      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      time += deltaTime * 0.001;

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw center
      ctx.beginPath();
      ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
      ctx.fillStyle = MONOCHROME_FILL(0.9);
      ctx.fill();

      dotRings.forEach((ring, ringIndex) => {
        for (let i = 0; i < ring.count; i++) {
          const angle = (i / ring.count) * Math.PI * 2;
          const radiusPulse = Math.sin(time * 2 - ringIndex * 0.4) * 3;
          const x = centerX + Math.cos(angle) * (ring.radius + radiusPulse);
          const y = centerY + Math.sin(angle) * (ring.radius + radiusPulse);
          const opacityWave =
            0.4 +
            ((Math.sin(time * 2 - ringIndex * 0.4 + i * 0.2) + 1) / 2) * 0.6;

          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fillStyle = MONOCHROME_FILL(opacityWave);
          ctx.fill();
        }
      });

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }

  function setupPulseWaveShockwave() {
    const ctx = createCanvasInContainer("pulse-wave-shockwave");
    if (!ctx) return;
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    let time = 0;
    let lastTime = 0;
    const dotRings = [
      { radius: 15, count: 6 },
      { radius: 30, count: 12 },
      { radius: 45, count: 18 },
      { radius: 60, count: 24 },
      { radius: 75, count: 30 }
    ];
    const waveSpeed = 30;
    const waveThickness = 40;
    const maxDotRadius = dotRings[dotRings.length - 1].radius;
    const maxAnimatedRadius = maxDotRadius + waveThickness;
    const rotationMagnitude = 0.15;
    const rotationSpeedFactor = 3;

    function animate(timestamp) {
      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      time += deltaTime * 0.001;

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Center dot
      ctx.beginPath();
      ctx.arc(centerX, centerY, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = MONOCHROME_FILL(0.8);
      ctx.fill();

      const currentWaveFront = (time * waveSpeed) % maxAnimatedRadius;

      dotRings.forEach((ring) => {
        for (let i = 0; i < ring.count; i++) {
          const baseAngle = (i / ring.count) * Math.PI * 2;
          const baseRadius = ring.radius;
          const distToWaveFront = baseRadius - currentWaveFront;
          let pulseFactor = 0;

          if (Math.abs(distToWaveFront) < waveThickness / 2) {
            pulseFactor = Math.cos(
              (distToWaveFront / (waveThickness / 2)) * (Math.PI / 2)
            );
            pulseFactor = Math.max(0, pulseFactor);
          }

          let currentAngle = baseAngle;
          if (pulseFactor > 0.01) {
            const angleOffset =
              pulseFactor *
              Math.sin(time * rotationSpeedFactor + i * 0.5) *
              rotationMagnitude;
            currentAngle += angleOffset;
          }

          const dotSize = 1.5 + pulseFactor * 1.8;
          const x = centerX + Math.cos(currentAngle) * baseRadius;
          const y = centerY + Math.sin(currentAngle) * baseRadius;
          const opacity = 0.2 + pulseFactor * 0.7;

          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = MONOCHROME_FILL(opacity);
          ctx.fill();
        }
      });

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }

  function setupPulseWaveSpiral() {
    const ctx = createCanvasInContainer("pulse-wave-spiral");
    if (!ctx) return;
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    let time = 0;
    let lastTime = 0;
    const dotRings = [
      { radius: 15, count: 6 },
      { radius: 30, count: 12 },
      { radius: 45, count: 18 },
      { radius: 60, count: 24 },
      { radius: 75, count: 30 }
    ];

    function animate(timestamp) {
      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      time += deltaTime * 0.001;

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Center dot
      ctx.beginPath();
      ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
      ctx.fillStyle = MONOCHROME_FILL(0.9);
      ctx.fill();

      dotRings.forEach((ring, ringIndex) => {
        const ringRotationSpeed = 0.2 + ringIndex * 0.03;
        for (let i = 0; i < ring.count; i++) {
          const baseAngle = (i / ring.count) * Math.PI * 2;
          const spiralArmOffset = (ring.radius / 15) * 0.4;
          const angle = baseAngle + time * ringRotationSpeed + spiralArmOffset;
          const pulseAmplitude = 3;
          const pulseSpeed = 1.5;
          const pulsePhase =
            time * pulseSpeed - ring.radius / 20 + (i / ring.count) * Math.PI;
          const radiusPulse = Math.sin(pulsePhase) * pulseAmplitude;
          const currentRadius = ring.radius + radiusPulse;
          const x = centerX + Math.cos(angle) * currentRadius;
          const y = centerY + Math.sin(angle) * currentRadius;
          const opacityWave =
            0.3 + ((Math.sin(pulsePhase - Math.PI / 4) + 1) / 2) * 0.7;

          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fillStyle = MONOCHROME_FILL(opacityWave);
          ctx.fill();
        }
      });

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }

  function setupPulseWaveBreathingGrid() {
    const ctx = createCanvasInContainer("pulse-wave-grid");
    if (!ctx) return;
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    let time = 0;
    let lastTime = 0;
    const gridSize = 9;
    const spacing = 18;
    const dots = [];
    const gridOffsetX = centerX - ((gridSize - 1) * spacing) / 2;
    const gridOffsetY = centerY - ((gridSize - 1) * spacing) / 2;

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        dots.push({
          x: gridOffsetX + c * spacing,
          y: gridOffsetY + r * spacing
        });
      }
    }

    const waveSpeed = 60;
    const waveThickness = 40;
    const maxDist =
      Math.sqrt(centerX * centerX + centerY * centerY) + waveThickness;

    function animate(timestamp) {
      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      time += deltaTime * 0.001;

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const currentWaveCenterDist = (time * waveSpeed) % maxDist;

      dots.forEach((dot) => {
        const distFromCanvasCenter = Math.hypot(
          dot.x - centerX,
          dot.y - centerY
        );
        const distToWave = Math.abs(
          distFromCanvasCenter - currentWaveCenterDist
        );
        let pulseFactor = 0;

        if (distToWave < waveThickness / 2) {
          pulseFactor = 1 - distToWave / (waveThickness / 2);
          pulseFactor = Math.sin((pulseFactor * Math.PI) / 2);
        }

        const dotSize = 1.5 + pulseFactor * 2.5;
        const opacity = 0.2 + pulseFactor * 0.8;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = MONOCHROME_FILL(opacity);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }

  function setupFlowingEnergyBands() {
    const ctx = createCanvasInContainer("flowing-energy-bands");
    if (!ctx) return;
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    let time = 0;
    let lastTime = 0;
    const dotRings = [
      { radius: 15, count: 8 },
      { radius: 30, count: 12 },
      { radius: 45, count: 16 },
      { radius: 60, count: 20 },
      { radius: 75, count: 24 }
    ];
    const numBands = 3;
    const bandWidth = CANVAS_WIDTH / 2.5;
    const bandSpeed = 25;
    const totalPath = CANVAS_WIDTH + bandWidth;

    function animate(timestamp) {
      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      time += deltaTime * 0.001;

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Center dot
      ctx.beginPath();
      ctx.arc(centerX, centerY, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = MONOCHROME_FILL(0.7);
      ctx.fill();

      dotRings.forEach((ring, ringIndex) => {
        for (let i = 0; i < ring.count; i++) {
          const angle =
            (i / ring.count) * Math.PI * 2 +
            time * 0.03 * (ringIndex % 2 === 0 ? 1 : -1);
          const x = centerX + Math.cos(angle) * ring.radius;
          const y = centerY + Math.sin(angle) * ring.radius;
          let maxInfluence = 0;

          for (let b = 0; b < numBands; b++) {
            const bandCenterY =
              ((time * bandSpeed + b * (totalPath / numBands)) % totalPath) -
              bandWidth / 2;
            const distToBandCenter = Math.abs(y - bandCenterY);
            let influence = 0;
            if (distToBandCenter < bandWidth / 2) {
              influence = Math.cos(
                (distToBandCenter / (bandWidth / 2)) * (Math.PI / 2)
              );
              influence = Math.max(0, influence);
            }
            maxInfluence = Math.max(maxInfluence, influence);
          }

          const dotSize = 1.5 + maxInfluence * 2.0;
          const opacity = 0.2 + maxInfluence * 0.7;

          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = MONOCHROME_FILL(opacity);
          ctx.fill();
        }
      });

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }

  function setupPulseWaveStretchedRings() {
    const ctx = createCanvasInContainer("pulse-wave-stretched");
    if (!ctx) return;
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    let time = 0;
    let lastTime = 0;
    const dotRings = [
      { radius: 15, count: 6 },
      { radius: 30, count: 12 },
      { radius: 45, count: 18 },
      { radius: 60, count: 24 },
      { radius: 75, count: 30 }
    ];

    function animate(timestamp) {
      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      time += deltaTime * 0.001;

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Center dot
      ctx.beginPath();
      ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
      ctx.fillStyle = MONOCHROME_FILL(0.9);
      ctx.fill();

      dotRings.forEach((ring, ringIndex) => {
        for (let i = 0; i < ring.count; i++) {
          const angle = (i / ring.count) * Math.PI * 2;
          const waveProgress = time * 1.5 - ringIndex * 0.5;
          const pulseFactor = Math.sin(waveProgress);
          const positivePulse = (pulseFactor + 1) / 2;
          const baseDotRadius = 2;
          const stretchAmount = pulseFactor * 2;
          const radiusX = baseDotRadius + Math.abs(stretchAmount);
          const radiusY = baseDotRadius;
          const x = centerX + Math.cos(angle) * ring.radius;
          const y = centerY + Math.sin(angle) * ring.radius;
          const opacity = 0.3 + positivePulse * 0.7;

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
          ctx.fillStyle = MONOCHROME_FILL(opacity);
          ctx.fill();
          ctx.restore();
        }
      });

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }

  function setupInterwovenRingPulses() {
    const ctx = createCanvasInContainer("interwoven-ring-pulses");
    if (!ctx) return;
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    let time = 0;
    let lastTime = 0;
    const ringData = [];
    const numRings = 5;
    const baseRadiusStep = 15;
    const baseDotCount = 8;

    for (let i = 0; i < numRings; i++) {
      ringData.push({
        radius: (i + 1) * baseRadiusStep,
        count: baseDotCount + i * 4,
        pulseSpeed: 0.8 + i * 0.1,
        phaseOffset: (i * Math.PI) / 3,
        maxAmplitude: 2 + i * 0.5,
        rotationSpeed: (i % 2 === 0 ? 0.02 : -0.02) * (1 + i * 0.1)
      });
    }

    function animate(timestamp) {
      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      time += deltaTime * 0.001;

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Center dot
      ctx.beginPath();
      ctx.arc(centerX, centerY, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = MONOCHROME_FILL(0.8);
      ctx.fill();

      ringData.forEach((ring) => {
        const pulseSignal = Math.sin(time * ring.pulseSpeed + ring.phaseOffset);
        const normalizedPulse = (pulseSignal + 1) / 2;
        const currentDotSize = 1.5 + normalizedPulse * ring.maxAmplitude * 0.5;
        const currentOpacity = 0.2 + normalizedPulse * 0.6;

        for (let i = 0; i < ring.count; i++) {
          const angle =
            (i / ring.count) * Math.PI * 2 + time * ring.rotationSpeed;
          const x = centerX + Math.cos(angle) * ring.radius;
          const y = centerY + Math.sin(angle) * ring.radius;

          ctx.beginPath();
          ctx.arc(x, y, currentDotSize, 0, Math.PI * 2);
          ctx.fillStyle = MONOCHROME_FILL(currentOpacity);
          ctx.fill();
        }
      });

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }

  function setupSpiralRadiatingPulse() {
    const ctx = createCanvasInContainer("spiral-radiating-pulse");
    if (!ctx) return;
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    let time = 0;
    let lastTime = 0;
    const numArms = 8;
    const dotsPerArm = 15;
    const minRadius = 10;
    const maxRadius = (CANVAS_WIDTH / 2) * 0.85;
    const radiusStep = (maxRadius - minRadius) / (dotsPerArm - 1);
    const twistFactor = 0.025;
    const armRotationSpeed = 0.03;
    const pulseWaveSpeed = 25;
    const pulseWaveLength = maxRadius / 2;
    const arms = [];

    for (let i = 0; i < numArms; i++) {
      const arm = { baseAngle: (i / numArms) * Math.PI * 2, dots: [] };
      for (let j = 0; j < dotsPerArm; j++) {
        arm.dots.push({ baseRadius: minRadius + j * radiusStep, size: 1.0 });
      }
      arms.push(arm);
    }

    function animate(timestamp) {
      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      time += deltaTime * 0.001;

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Center dot
      ctx.beginPath();
      ctx.arc(centerX, centerY, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = MONOCHROME_FILL(0.7);
      ctx.fill();

      const globalArmRotation = time * armRotationSpeed;
      const currentPulsePeakPos =
        ((time * pulseWaveSpeed) % (maxRadius + pulseWaveLength)) -
        pulseWaveLength / 2;

      arms.forEach((arm) => {
        arm.dots.forEach((dot) => {
          const armActualBaseAngle = arm.baseAngle + globalArmRotation;
          const spiralAngleOffset = dot.baseRadius * twistFactor;
          const finalAngle = armActualBaseAngle + spiralAngleOffset;
          const x = centerX + Math.cos(finalAngle) * dot.baseRadius;
          const y = centerY + Math.sin(finalAngle) * dot.baseRadius;

          let pulseInfluence = 0;
          const distToPulsePeak = Math.abs(
            dot.baseRadius - currentPulsePeakPos
          );
          if (distToPulsePeak < pulseWaveLength / 2) {
            pulseInfluence = Math.cos(
              (distToPulsePeak / (pulseWaveLength / 2)) * (Math.PI / 2)
            );
            pulseInfluence = Math.max(0, pulseInfluence);
          }

          const finalSize = dot.size + pulseInfluence * 1.2;
          const finalOpacity = 0.15 + pulseInfluence * 0.6;

          ctx.beginPath();
          ctx.arc(x, y, finalSize, 0, Math.PI * 2);
          ctx.fillStyle = MONOCHROME_FILL(finalOpacity);
          ctx.fill();
        });
      });

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }

  function setupRadiatingLineScan() {
    const ctx = createCanvasInContainer("radiating-line-scan");
    if (!ctx) return;
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    let time = 0;
    let lastTime = 0;
    const numLines = 16;
    const maxLineLength = (CANVAS_WIDTH / 2) * 0.9;
    const scanWidth = 25;
    const scanSpeed = 35;
    const lineRotationSpeed = 0.05;
    const baseLineWidth = 0.5;
    const scanLineWidth = 1.5;

    function animate(timestamp) {
      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      time += deltaTime * 0.001;

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Center dot
      ctx.beginPath();
      ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
      ctx.fillStyle = MONOCHROME_FILL(0.7);
      ctx.fill();

      const currentScanPosition =
        ((time * scanSpeed) % (maxLineLength + scanWidth * 1.5)) -
        scanWidth * 0.75;

      for (let i = 0; i < numLines; i++) {
        const angle = (i / numLines) * Math.PI * 2 + time * lineRotationSpeed;
        const endX = centerX + Math.cos(angle) * maxLineLength;
        const endY = centerY + Math.sin(angle) * maxLineLength;

        // Base line
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = MONOCHROME_FILL(0.1);
        ctx.lineWidth = baseLineWidth;
        ctx.stroke();

        // Scanning segment
        const scanStartDist = Math.max(0, currentScanPosition - scanWidth / 2);
        const scanEndDist = Math.min(
          maxLineLength,
          currentScanPosition + scanWidth / 2
        );

        if (scanStartDist < scanEndDist) {
          const scanStartX = centerX + Math.cos(angle) * scanStartDist;
          const scanStartY = centerY + Math.sin(angle) * scanStartDist;
          const scanEndX = centerX + Math.cos(angle) * scanEndDist;
          const scanEndY = centerY + Math.sin(angle) * scanEndDist;
          const grad = ctx.createLinearGradient(
            scanStartX,
            scanStartY,
            scanEndX,
            scanEndY
          );
          const overallScanPulse =
            0.6 + ((Math.sin(time * 1.5 + i * 0.4) + 1) / 2) * 0.4;

          grad.addColorStop(0, MONOCHROME_FILL(0));
          grad.addColorStop(0.5, MONOCHROME_FILL(0.85 * overallScanPulse));
          grad.addColorStop(1, MONOCHROME_FILL(0));

          ctx.beginPath();
          ctx.moveTo(scanStartX, scanStartY);
          ctx.lineTo(scanEndX, scanEndY);
          ctx.strokeStyle = grad;
          ctx.lineWidth = scanLineWidth;
          ctx.stroke();
        }
      }

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }

  window.addEventListener("load", function () {
    addCornerDecorations();
    setupPulseWave();
    setupPulseWaveShockwave();
    setupPulseWaveSpiral();
    setupPulseWaveBreathingGrid();
    setupFlowingEnergyBands();
    setupPulseWaveStretchedRings();
    setupInterwovenRingPulses();
    setupSpiralRadiatingPulse();
    setupRadiatingLineScan();
  });
})();