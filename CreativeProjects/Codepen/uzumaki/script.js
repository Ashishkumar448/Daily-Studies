// Enhanced Uzumaki Spiral Horror Animation
document.addEventListener('DOMContentLoaded', function() {
  // Canvas setup
  const canvas = document.getElementById('spiral-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  // Advanced cursor elements
  const cursorRing = document.getElementById('cursor-ring');
  const cursorDot = document.getElementById('cursor-dot');
  const cursorTrail = document.getElementById('cursor-trail');
  
  // Track mouse position with physics
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;
  let cursorVelX = 0;
  let cursorVelY = 0;
  const cursorSpring = 0.3;
  const cursorFriction = 0.8;
  
  // Trail points for cursor
  const trailPoints = [];
  const maxTrailPoints = 20;
  
  // Click state tracking
  let isMouseDown = false;
  let temporaryDistortion = 0;
  
  // Spiral parameters - preset for best thumbnail appearance
  let spiralDensity = 6;
  let distortionFactor = 0.8;
  let animationSpeed = 0.5;
  let tendrilCount = 3;
  let showFaces = true;
  
  // Animation variables
  let time = 0;
  
  // Face images for hidden faces effect
  const faces = [];
  const faceCount = 5;
  let facesLoaded = 0;
  
  // Load hidden faces
  function loadFaces() {
    for (let i = 0; i < faceCount; i++) {
      const img = new Image();
      img.src = `https://source.unsplash.com/random/100x100/?portrait,face&sig=${i}`;
      img.onload = () => {
        facesLoaded++;
      };
      faces.push(img);
    }
  }
  
  // Audio elements
  let ambientSound;
  
  function setupAudio() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      const osc1 = audioContext.createOscillator();
      const osc2 = audioContext.createOscillator();
      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.value = 55;
      osc2.frequency.value = 57;
      
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.05;
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      ambientSound = {
        context: audioContext,
        osc1: osc1,
        osc2: osc2,
        gain: gainNode,
        playing: false
      };
    } catch (e) {
      console.log('Audio setup failed:', e);
    }
  }
  
  function startAudio() {
    if (ambientSound && !ambientSound.playing) {
      try {
        ambientSound.osc1.start();
        ambientSound.osc2.start();
        ambientSound.playing = true;
      } catch (e) {
        console.log('Audio start failed:', e);
      }
    }
  }
  
  // Enhanced cursor functions
  function updateCursor() {
    // Calculate cursor physics
    const dx = mouseX - cursorX;
    const dy = mouseY - cursorY;
    
    // Apply spring force
    cursorVelX += dx * cursorSpring;
    cursorVelY += dy * cursorSpring;
    
    // Apply friction
    cursorVelX *= cursorFriction;
    cursorVelY *= cursorFriction;
    
    // Update cursor position
    cursorX += cursorVelX;
    cursorY += cursorVelY;
    
    // Position the cursor elements
    cursorRing.style.left = `${cursorX}px`;
    cursorRing.style.top = `${cursorY}px`;
    
    // Position the dot (more responsive than ring)
    cursorDot.style.left = `${mouseX}px`;
    cursorDot.style.top = `${mouseY}px`;
    
    // Add trail effect
    addTrailPoint();
    updateTrailPoints();
    
    // Change cursor when mouse is down
    if (isMouseDown) {
      cursorRing.style.borderColor = 'rgba(255, 100, 100, 0.8)';
      cursorRing.style.transform = 'translate(-50%, -50%) scale(0.7)';
    } else {
      cursorRing.style.borderColor = 'rgba(255, 255, 255, 0.8)';
      cursorRing.style.transform = 'translate(-50%, -50%)';
    }
  }
  
  function addTrailPoint() {
    // Only add points occasionally for performance
    if (Math.random() > 0.3) return;
    
    // Create new trail point
    const point = document.createElement('div');
    point.className = 'cursor-trail-point';
    point.style.left = `${cursorX}px`;
    point.style.top = `${cursorY}px`;
    
    // Random size for variety
    const size = 2 + Math.random() * 6;
    point.style.width = `${size}px`;
    point.style.height = `${size}px`;
    
    // Set opacity and color
    point.style.opacity = 0.3 + Math.random() * 0.5;
    
    // Add special effects when clicked
    if (isMouseDown) {
      const hue = Math.floor(Math.random() * 60);
      point.style.background = `hsla(${hue}, 100%, 50%, 0.8)`;
      point.style.boxShadow = `0 0 10px hsla(${hue}, 100%, 70%, 0.8)`;
    }
    
    // Add to DOM
    cursorTrail.appendChild(point);
    
    // Add to array with animation info
    trailPoints.push({
      element: point,
      x: cursorX,
      y: cursorY,
      size: size,
      life: 1.0,
      decay: 0.01 + Math.random() * 0.02
    });
    
    // Remove oldest points if we have too many
    while (trailPoints.length > maxTrailPoints) {
      const oldest = trailPoints.shift();
      cursorTrail.removeChild(oldest.element);
    }
  }
  
  function updateTrailPoints() {
    // Update all trail points
    for (let i = trailPoints.length - 1; i >= 0; i--) {
      const point = trailPoints[i];
      
      // Decay life
      point.life -= point.decay;
      
      // Apply life to visual properties
      point.element.style.opacity = point.life * 0.6;
      
      // Apply spiral motion to trail points
      const angle = time * 2 + i * 0.2;
      const spiralRadius = (1 - point.life) * 30;
      const offsetX = Math.cos(angle) * spiralRadius;
      const offsetY = Math.sin(angle) * spiralRadius;
      
      point.element.style.left = `${point.x + offsetX}px`;
      point.element.style.top = `${point.y + offsetY}px`;
      
      // Remove dead points
      if (point.life <= 0) {
        cursorTrail.removeChild(point.element);
        trailPoints.splice(i, 1);
      }
    }
  }
  
  // Spiral drawing functions
  function drawSpiral(centerX, centerY, radius, density, distortion, rotation, color, lineWidth) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    
    const maxRadius = radius;
    // Smaller angle step for smoother curves
    const angleStep = 0.05;
    
    // Calculate the actual distortion to use (default + click-based temporary distortion)
    const actualDistortion = distortion + temporaryDistortion;
    
    for (let angle = 0; angle < Math.PI * 2 * density; angle += angleStep) {
      const currentRadius = (angle / (Math.PI * 2 * density)) * maxRadius;
      
      // Distortion effect - changes when clicked
      const distortedAngle = angle + 
        Math.sin(angle * 3 + time * 0.2) * actualDistortion * 0.1 +
        Math.cos(angle * 2 + time * 0.1) * actualDistortion * 0.05;
      
      const distortedRadius = currentRadius * 
        (1 + Math.sin(angle * 5 + time * 0.3) * actualDistortion * 0.03);
      
      const x = centerX + Math.cos(distortedAngle + rotation) * distortedRadius;
      const y = centerY + Math.sin(distortedAngle + rotation) * distortedRadius;
      
      if (angle === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  }
  
  function drawTendrils(centerX, centerY, count, time, maxLength) {
    const angleStep = (Math.PI * 2) / count;
    
    for (let i = 0; i < count; i++) {
      const baseAngle = i * angleStep + time * 0.2;
      const length = maxLength * (0.5 + Math.sin(time * 0.3 + i) * 0.5);
      
      ctx.beginPath();
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + Math.sin(time + i) * 0.1})`;
      ctx.lineWidth = 1 + Math.sin(time * 0.5 + i * 2) * 0.5;
      
      let x = centerX;
      let y = centerY;
      ctx.moveTo(x, y);
      
      // Use the combined distortion factor
      const actualDistortion = distortionFactor + temporaryDistortion;
      
      for (let j = 0; j < length; j += 3) {
        const distortion = j * 0.02 * actualDistortion;
        const angle = baseAngle + 
          Math.sin(j * 0.1 + time * 0.5) * distortion +
          Math.cos(j * 0.05 + time * 0.3) * distortion;
        
        x += Math.cos(angle) * 3;
        y += Math.sin(angle) * 3;
        
        ctx.lineTo(x, y);
      }
      
      ctx.stroke();
    }
  }
  
  function drawHiddenFaces() {
    if (!showFaces || facesLoaded < faceCount) return;
    
    // Show faces more often when mouse is down
    const faceChance = isMouseDown ? 0.03 : 0.01;
    
    // Only show faces occasionally
    if (Math.random() > faceChance) return;
    
    const face = faces[Math.floor(Math.random() * faces.length)];
    const size = 50 + Math.random() * 100;
    
    // Position faces near the cursor when mouse is down
    let x, y;
    if (isMouseDown) {
      x = cursorX + (Math.random() - 0.5) * 300;
      y = cursorY + (Math.random() - 0.5) * 300;
    } else {
      x = Math.random() * canvas.width;
      y = Math.random() * canvas.height;
    }
    
    // Flash the face briefly
    ctx.save();
    ctx.globalAlpha = 0.2 + Math.random() * 0.3;
    ctx.drawImage(face, x, y, size, size);
    ctx.restore();
    
    // Special cursor effect when face appears
    cursorRing.style.borderColor = 'rgba(255, 0, 0, 0.8)';
    cursorRing.style.boxShadow = '0 0 15px rgba(255, 0, 0, 0.5)';
    
    // Reset cursor after a moment
    setTimeout(() => {
      if (!isMouseDown) {
        cursorRing.style.borderColor = 'rgba(255, 255, 255, 0.8)';
        cursorRing.style.boxShadow = '';
      }
    }, 300);
  }
  
  // IMPORTANT: Draw the initial spiral frame immediately for thumbnail
  function drawInitialFrame() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const mainRadius = Math.min(canvas.width, canvas.height) * 0.4;
    
    // Fill background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw initial spiral layers - make sure they're visible and impressive for thumbnail
    for (let i = 0; i < 3; i++) {
      const radius = mainRadius * (0.6 + i * 0.2);
      const density = spiralDensity * (0.8 + i * 0.1);
      const color = `rgba(255, 255, 255, ${0.8 - i * 0.2})`;
      const lineWidth = 2.5 - i * 0.5; // Slightly thicker for better visibility
      
      drawSpiral(centerX, centerY, radius, density, distortionFactor, i * Math.PI/4, color, lineWidth);
    }
  }
  
  // Create spiral burst effect
  function createSpiralBurst(x, y, count = 8, maxDistance = 80) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const distance = maxDistance * (0.8 + Math.random() * 0.4);
      
      const point = document.createElement('div');
      point.className = 'cursor-trail-point';
      
      // Style the point
      const size = 4 + Math.random() * 6;
      point.style.width = `${size}px`;
      point.style.height = `${size}px`;
      point.style.opacity = '0.8';
      
      if (isMouseDown) {
        const hue = Math.floor(Math.random() * 30);
        point.style.background = `hsla(${hue}, 100%, 50%, 0.7)`;
        point.style.boxShadow = `0 0 8px hsla(${hue}, 100%, 60%, 0.6)`;
      }
      
      point.style.left = `${x}px`;
      point.style.top = `${y}px`;
      
      cursorTrail.appendChild(point);
      
      // Animate the point
      const duration = 500 + Math.random() * 500;
      const startTime = Date.now();
      
      function animatePoint() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / duration);
        
        if (progress >= 1) {
          cursorTrail.removeChild(point);
          return;
        }
        
        // Spiral outward
        const spiralAngle = angle + progress * Math.PI * 3;
        const currentDistance = distance * progress;
        
        const posX = x + Math.cos(spiralAngle) * currentDistance;
        const posY = y + Math.sin(spiralAngle) * currentDistance;
        
        point.style.left = `${posX}px`;
        point.style.top = `${posY}px`;
        point.style.opacity = (1 - progress) * 0.8;
        
        // Scale down as it fades
        const scale = 1 - progress * 0.5;
        point.style.transform = `scale(${scale})`;
        
        requestAnimationFrame(animatePoint);
      }
      
      requestAnimationFrame(animatePoint);
    }
  }
  
  // Mouse event handlers
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Start audio on first interaction
    startAudio();
  });
  
  // Mouse down/up event handlers for distortion effect
  document.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    
    // Generate dramatic spiral burst on click
    createSpiralBurst(mouseX, mouseY, 10, 100);
    
    // Start increasing distortion
    temporaryDistortion = 3.5; // More dramatic distortion
  });
  
  document.addEventListener('mouseup', () => {
    isMouseDown = false;
    
    // Reset temporary distortion gradually
    const distortionResetInterval = setInterval(() => {
      temporaryDistortion *= 0.8;
      if (temporaryDistortion < 0.1) {
        temporaryDistortion = 0;
        clearInterval(distortionResetInterval);
      }
    }, 50);
  });
  
  // Touch support for mobile
  document.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Prevent scrolling
    if (e.touches.length > 0) {
      mouseX = e.touches[0].clientX;
      mouseY = e.touches[0].clientY;
    }
  }, { passive: false });
  
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      mouseX = e.touches[0].clientX;
      mouseY = e.touches[0].clientY;
      cursorX = mouseX;
      cursorY = mouseY;
      
      // Start audio on first interaction
      startAudio();
      
      // Set mouse down state
      isMouseDown = true;
      temporaryDistortion = 3.5;
      
      // Generate burst
      createSpiralBurst(mouseX, mouseY, 10, 100);
    }
  });
  
  document.addEventListener('touchend', () => {
    isMouseDown = false;
    
    // Reset temporary distortion gradually
    const distortionResetInterval = setInterval(() => {
      temporaryDistortion *= 0.8;
      if (temporaryDistortion < 0.1) {
        temporaryDistortion = 0;
        clearInterval(distortionResetInterval);
      }
    }, 50);
  });
  
  // Handle window resize
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Redraw the spiral immediately after resize
    drawInitialFrame();
  });
  
  // Animation loop
  function animate() {
    // Request next frame
    requestAnimationFrame(animate);
    
    // Clear with fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update time
    time += 0.01 * animationSpeed;
    
    // Update cursor with spring physics
    updateCursor();
    
    // Center coordinates for main spiral
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Calculate cursor influence
    const cursorDistX = (cursorX - centerX) / (canvas.width / 2);
    const cursorDistY = (cursorY - centerY) / (canvas.height / 2);
    const cursorDist = Math.sqrt(cursorDistX * cursorDistX + cursorDistY * cursorDistY);
    
    // Draw main spiral
    const mainRadius = Math.min(canvas.width, canvas.height) * 0.4;
    const mainDistortion = distortionFactor * (1 + cursorDist * 0.5) + temporaryDistortion;
    const mainRotation = time * 0.1 + Math.atan2(cursorDistY, cursorDistX) * 0.2;
    
    // Draw multiple layered spirals for depth
    for (let i = 0; i < 3; i++) {
      const radius = mainRadius * (0.6 + i * 0.2);
      const density = spiralDensity * (0.8 + i * 0.1);
      const rotation = mainRotation + i * Math.PI / 4;
      const color = `rgba(255, 255, 255, ${0.7 - i * 0.2})`;
      const lineWidth = 2 - i * 0.5;
      
      drawSpiral(centerX, centerY, radius, density, mainDistortion, rotation, color, lineWidth);
    }
    
    // Draw cursor-attached tendrils
    drawTendrils(cursorX, cursorY, tendrilCount, time, 100);
    
    // Draw background tendrils for atmosphere
    for (let i = 0; i < 3; i++) {
      const x = centerX + Math.sin(time * 0.2 + i) * centerX * 0.5;
      const y = centerY + Math.cos(time * 0.3 + i) * centerY * 0.5;
      drawTendrils(x, y, 2, time + i, 50 + Math.random() * 100);
    }
    
    // Draw secondary spiral following cursor when clicked
    if (isMouseDown) {
      drawSpiral(cursorX, cursorY, 50, spiralDensity * 0.5, distortionFactor * 2 + temporaryDistortion, time * 0.2, 'rgba(255, 50, 50, 0.3)', 1);
    }
    
    // Maybe draw hidden faces
    drawHiddenFaces();
    
    // Add screen effects when clicked
    if (isMouseDown && Math.random() > 0.95) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
  
  // Initialize
  function init() {
    // Load assets
    loadFaces();
    setupAudio();
    
    // Set initial cursor position
    cursorX = mouseX = window.innerWidth / 2;
    cursorY = mouseY = window.innerHeight / 2;
    
    // Draw the initial spiral frame immediately for thumbnail
    drawInitialFrame();
    
    // Start animation loop
    animate();
    
    // Add click listener to start audio
    document.addEventListener('click', startAudio, { once: true });
    
    // Add help tooltip
    const helpTooltip = document.createElement('div');
    helpTooltip.style.position = 'absolute';
    helpTooltip.style.bottom = '60px';
    helpTooltip.style.left = '50%';
    helpTooltip.style.transform = 'translateX(-50%)';
    helpTooltip.style.background = 'rgba(0,0,0,0.7)';
    helpTooltip.style.color = '#fff';
    helpTooltip.style.padding = '10px 15px';
    helpTooltip.style.borderRadius = '5px';
    helpTooltip.style.fontSize = '0.8rem';
    helpTooltip.style.zIndex = '1000';
    helpTooltip.style.opacity = '0.8';
    helpTooltip.style.pointerEvents = 'none';
    helpTooltip.textContent = 'Click and hold to distort the spiral';
    
    document.body.appendChild(helpTooltip);
    
    // Hide tooltip after 5 seconds
    setTimeout(() => {
      helpTooltip.style.opacity = '0';
      helpTooltip.style.transition = 'opacity 1s';
      setTimeout(() => {
        helpTooltip.remove();
      }, 1000);
    }, 5000);
  }
  
  // Start everything
  init();
});