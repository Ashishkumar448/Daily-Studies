"use strict";
// Register only the plugins I actually use (clean setup)
gsap.registerPlugin(SplitText, ScrambleTextPlugin);
// ====== CONFIG ======
// Grab all quote elements to animate
const quotes = gsap.utils.toArray('.quote');
// Get the scramble text container and toggle button
const target = document.getElementById('scrambleText');
const button = document.getElementById('toggleBtn');
// Final decoded message for toggle
const message = 'Creativity takes courage.';
// Character set used in scramble effect
const scrambleChars = 'upperAndLowerCase';
// Boolean flag to track toggle state
let isDecoded = false;
// ====== HELPERS ======
// Returns a random position within the viewport boundaries
const getRandomPosition = () => {
    const x = Math.random() * (window.innerWidth - 200);
    const y = Math.random() * (window.innerHeight - 100);
    return { x, y };
};
// Creates a looping timeline for a single quote element
const scrambleQuote = (quote, text) => {
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
    tl.call(() => {
        // Set a random position each time the quote appears
        const { x, y } = getRandomPosition();
        gsap.set(quote, { x, y });
    })
        // Show quote with scramble in
        .to(quote, {
        delay: Math.random() * 5,
        duration: 1,
        opacity: 1,
        scrambleText: { text, chars: scrambleChars, revealDelay: 0.5, speed: 1 },
        ease: 'power2.out',
    })
        // Hide quote with scramble out
        .to(quote, {
        delay: 0.5,
        duration: 1,
        scrambleText: { text: '', chars: scrambleChars },
        opacity: 0,
        ease: 'power2.in',
    });
};
// ====== INIT QUOTES ======
// Setup and animate each quote individually
quotes.forEach((quote) => {
    var _a;
    // Set initial styles before animation
    gsap.set(quote, {
        position: 'absolute',
        opacity: 0,
        whiteSpace: 'nowrap',
    });
    // Launch the animation loop for each quote
    scrambleQuote(quote, (_a = quote.textContent) !== null && _a !== void 0 ? _a : '');
});
// ====== SCRAMBLE BOX INIT ======
// Start the target box with an encrypted-looking scramble
gsap.set(target, {
    scrambleText: {
        text: '*&@#$#@#$@*&$(@#^)',
        chars: scrambleChars,
        speed: 0.3,
    },
});
// ====== TOGGLE SCRAMBLE BTN ======
// Flip between scrambled and decoded text on button click
function toggleScramble() {
    // Set target text, duration, and speed based on current state
    const text = isDecoded ? '*&@#$#@#$@*&$(@#^)' : message;
    const duration = isDecoded ? 1 : 1.5;
    const speed = isDecoded ? 0.3 : 1;
    // Animate the transition
    gsap.to(target, {
        duration,
        scrambleText: {
            text,
            chars: scrambleChars,
            revealDelay: isDecoded ? 0 : 0.5,
            speed,
        },
    });
    // Update button label and flip state
    button.textContent = isDecoded ? 'Decrypt' : 'Encrypt';
    isDecoded = !isDecoded;
}
// Bind toggle behavior to the button
button === null || button === void 0 ? void 0 : button.addEventListener('click', toggleScramble);
// ====== H1 ANIMATION ======
// Split the H1 text into words and lines (prep for animation)
const split = SplitText.create('h1', { type: 'words, lines' });
// Animate words flying in randomly from all directions
gsap.from(split.words, {
    x: 'random([-1000, 1000])',
    y: 'random([-1000, 1000])',
    opacity: 0,
    ease: 'expo.inOut',
    duration: 1.25,
});