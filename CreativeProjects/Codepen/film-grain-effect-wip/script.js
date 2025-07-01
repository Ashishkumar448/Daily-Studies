// Initialize Canvas and Context
const canvas = document.getElementById('grainCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Initialize Simplex Noise
const simplex = new SimplexNoise();

// Parameters for Film Grain
const params = {
    grainAmount: 20,  // Adjusted for more noticeable grain
    grainSize: 0.1,   // Smaller grain size for finer noise
    vignette: 0.6,    // Stronger vignette effect
    lightLeak: 0.15,  // Slightly subtler light leak intensity
    blurAmount: 0.1,  // Reduced blur for sharper grain
    colorNoise: 0.05  // New parameter for subtle color noise
};

// FPS Counter Variables
let lastTime = 0;
let fps = 0;

// Create an offscreen canvas for generating grain at a lower resolution
const offscreenCanvas = document.createElement('canvas');
offscreenCanvas.width = canvas.width;  // Full resolution for finer grain
offscreenCanvas.height = canvas.height;
const offscreenCtx = offscreenCanvas.getContext('2d');

// Function to Generate Finer Grain Effect
function generateGrain() {
    const imageData = offscreenCtx.createImageData(offscreenCanvas.width, offscreenCanvas.height);
    const data = imageData.data;

    for (let y = 0; y < offscreenCanvas.height; y++) {
        for (let x = 0; x < offscreenCanvas.width; x++) {
            // Increase frequency for finer, more detailed noise
            const noiseScale = params.grainSize * 0.1; // Finer noise scale
            const noiseValue = (simplex.noise3D(x * noiseScale, y * noiseScale, Math.random()) + 1) / 2;

            // Add subtle color variations to the grain
            const r = noiseValue * 255 * params.grainAmount / 100 * (0.9 + Math.random() * params.colorNoise);
            const g = noiseValue * 255 * params.grainAmount / 100 * (0.9 + Math.random() * params.colorNoise);
            const b = noiseValue * 255 * params.grainAmount / 100 * (0.9 + Math.random() * params.colorNoise);
            const index = (x + y * offscreenCanvas.width) * 4;
            data[index] = r;   // Red channel
            data[index + 1] = g; // Green channel
            data[index + 2] = b; // Blue channel
            data[index + 3] = 255; // Full opacity
        }
    }

    offscreenCtx.putImageData(imageData, 0, 0);

    // Apply a subtle blur to soften sharp edges
    if (params.blurAmount > 0) {
        offscreenCtx.filter = `blur(${params.blurAmount}px)`;
        offscreenCtx.drawImage(offscreenCanvas, 0, 0);
        offscreenCtx.filter = 'none'; // Reset filter after use
    }

    // Draw the offscreen canvas onto the main canvas
    ctx.drawImage(offscreenCanvas, 0, 0, canvas.width, canvas.height);

    applyVignette();
    applyLightLeak();
}

// Apply Enhanced Vignette Effect
function applyVignette() {
    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.width / 2,
        canvas.width / 2, canvas.height / 2, canvas.width
    );

    gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
    gradient.addColorStop(0.8, `rgba(0, 0, 0, ${params.vignette * 0.3})`);
    gradient.addColorStop(1, `rgba(0, 0, 0, ${params.vignette})`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Apply Subtler, Randomized Light Leak Effect
function applyLightLeak() {
    const leakGradient = ctx.createRadialGradient(
        Math.random() * canvas.width, Math.random() * canvas.height, 0,
        Math.random() * canvas.width, Math.random() * canvas.height, canvas.width / 3
    );

    leakGradient.addColorStop(0, `rgba(255, 150, 50, ${params.lightLeak})`);
    leakGradient.addColorStop(1, `rgba(255, 150, 50, 0)`);

    ctx.fillStyle = leakGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// FPS Update Function
function updateFPS(now) {
    if (!lastTime) {
        lastTime = now;
        fps = 0;
        return;
    }

    const deltaTime = now - lastTime;
    lastTime = now;

    fps = 1000 / deltaTime;
}

// Main Update Loop
function update(now) {
    updateFPS(now);

    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Generate Grain
    generateGrain();

    // Display FPS
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText(`FPS: ${Math.round(fps)}`, 10, 20);

    requestAnimationFrame(update);
}

// Set up dat.GUI
const gui = new dat.GUI({ autoPlace: true });
gui.domElement.style.position = 'absolute';
gui.domElement.style.top = '10px';
gui.domElement.style.right = '10px';
gui.add(params, 'grainAmount', 0, 100).name('Grain Amount');
gui.add(params, 'grainSize', 0.05, 0.2).name('Grain Size'); // Finer control range
gui.add(params, 'vignette', 0, 1).name('Vignette');
gui.add(params, 'lightLeak', 0, 1).name('Light Leak');
gui.add(params, 'blurAmount', 0, 1).name('Blur Amount'); // Minimal blur control
gui.add(params, 'colorNoise', 0, 0.2).name('Color Noise'); // Control color noise

// Start the animation loop
update();