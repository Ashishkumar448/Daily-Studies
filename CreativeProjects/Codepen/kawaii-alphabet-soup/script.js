document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const broth = document.getElementById('broth');
  const stirBtn = document.getElementById('stir-btn');
  const addLettersBtn = document.getElementById('add-letters-btn');
  const changeColorBtn = document.getElementById('change-color-btn');
  const customLetterInput = document.getElementById('custom-letter');
  const addCustomBtn = document.getElementById('add-custom-btn');
  const tempSlider = document.getElementById('temp-slider');
  const tempDisplay = document.getElementById('temp-display');
  const letterCounter = document.getElementById('letter-counter');
  const soupBowl = document.getElementById('soup-bowl');
  const spoon = document.getElementById('spoon');
  const themePastel = document.getElementById('theme-pastel');
  const themeGalaxy = document.getElementById('theme-galaxy');
  const themeCandy = document.getElementById('theme-candy');
  const popSound = document.getElementById('pop-sound');
  const stirSound = document.getElementById('stir-sound');
  
  // Variables
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let letterCount = 0;
  let currentTheme = 'pastel';
  let isHappy = true;
  let animationSpeed = 10; // Default animation speed (medium)
  let brothColors = [
    '#ffb347', // Default orange
    '#f39c12', // Orange
    '#ff6b6b', // Red
    '#4ecdc4', // Teal
    '#8b5cf6', // Purple
    '#2ecc71', // Green
    '#f368e0', // Pink
    '#0abde3'  // Blue
  ];
  let currentBrothColor = 0;
  
  // Initialize
  createLetters(20);
  updateLetterCount();
  setupBowlFace();
  
  // Create floating letters
  function createLetters(count) {
    for (let i = 0; i < count; i++) {
      const letter = document.createElement('div');
      letter.className = 'letter';
      letter.textContent = alphabet[Math.floor(Math.random() * alphabet.length)];
      
      // Random position within broth
      const posX = Math.random() * 80 + 10;
      const posY = Math.random() * 80 + 10;
      
      letter.style.position = 'absolute';
      letter.style.left = `${posX}%`;
      letter.style.top = `${posY}%`;
      
      // Random rotation
      const rotation = Math.random() * 360;
      letter.style.transform = `rotate(${rotation}deg)`;
      
      // Random size
      const size = Math.random() * 0.8 + 0.7;
      letter.style.fontSize = `${size}rem`;
      
      // Random color variation
      const hue = Math.random() * 60 + 10; // Orange-yellow range
      letter.style.color = `hsl(${hue}, 100%, 70%)`;
      
      // Click event
      letter.addEventListener('click', handleLetterClick);
      
      // Add animation
      animateLetter(letter);
      
      broth.appendChild(letter);
      letterCount++;
    }
    updateLetterCount();
  }
  
  // Handle letter click
  function handleLetterClick(e) {
    try {
      playSound(popSound);
    } catch (err) {
      console.log("Sound couldn't play:", err);
    }
    
    // Create a splash effect
    const splash = document.createElement('div');
    splash.className = 'letter';
    splash.textContent = e.target.textContent;
    splash.style.position = 'absolute';
    splash.style.left = e.target.style.left;
    splash.style.top = e.target.style.top;
    splash.style.fontSize = e.target.style.fontSize;
    splash.style.color = e.target.style.color;
    broth.appendChild(splash);
    
    gsap.to(splash, {
      y: -50,
      opacity: 0,
      duration: 0.8,
      onComplete: () => splash.remove()
    });
    
    // Letter pickup animation
    e.target.classList.add('pick-up');
    setTimeout(() => {
      e.target.remove();
      letterCount--;
      updateLetterCount();
      checkBowlHappiness();
    }, 500);
  }
  
  // Animate individual letters
  function animateLetter(letter) {
    const duration = animationSpeed + Math.random() * 5;
    const delay = Math.random() * 5;
    
    gsap.to(letter, {
      x: () => Math.random() * 40 - 20,
      y: () => Math.random() * 40 - 20,
      rotation: () => Math.random() * 360 - 180,
      duration: duration,
      delay: delay,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true
    });
  }
  
  // Stir the soup button
  stirBtn.addEventListener('click', function() {
    try {
      playSound(stirSound);
    } catch (err) {
      console.log("Sound couldn't play:", err);
    }
    
    // Rotate the spoon
    gsap.to(spoon, {
      rotation: "+=360",
      duration: 2,
      ease: "power2.inOut"
    });
    
    // Animate letters
    gsap.to('.letter', {
      x: () => Math.random() * 150 - 75,
      y: () => Math.random() * 150 - 75,
      rotation: () => Math.random() * 720 - 360,
      duration: 2,
      ease: "power3.out",
      onComplete: function() {
        // After stirring, return to gentle floating
        document.querySelectorAll('.letter').forEach(letter => {
          animateLetter(letter);
        });
      }
    });
    
    // Create bubbles
    createBubbles();
    
    // Add splash effect
    for (let i = 0; i < 10; i++) {
      const splash = document.createElement('div');
      splash.className = 'letter';
      splash.textContent = alphabet[Math.floor(Math.random() * alphabet.length)];
      splash.style.position = 'absolute';
      splash.style.left = '50%';
      splash.style.top = '50%';
      splash.style.fontSize = '1.2rem';
      splash.style.color = 'white';
      
      broth.appendChild(splash);
      
      gsap.to(splash, {
        x: Math.random() * 200 - 100,
        y: Math.random() * -100 - 50,
        opacity: 0,
        rotation: Math.random() * 360,
        duration: 1.5,
        onComplete: () => splash.remove()
      });
    }
  });
  
  // Add more letters button
  addLettersBtn.addEventListener('click', function() {
    createLetters(5);
    createBubbles();
    try {
      playSound(popSound);
    } catch (err) {
      console.log("Sound couldn't play:", err);
    }
  });
  
  // Add custom letter button
  addCustomBtn.addEventListener('click', function() {
    const customLetter = customLetterInput.value.toUpperCase();
    if (customLetter && customLetter.match(/[A-Z]/i)) {
      const letter = document.createElement('div');
      letter.className = 'letter';
      letter.textContent = customLetter;
      
      // Position in center
      letter.style.position = 'absolute';
      letter.style.left = '50%';
      letter.style.top = '50%';
      
      // Special styling for custom letters
      letter.style.fontSize = '1.8rem';
      letter.style.color = 'white';
      letter.style.textShadow = '0 0 5px rgba(255, 255, 255, 0.7)';
      
      // Add animation
      letter.addEventListener('click', handleLetterClick);
      animateLetter(letter);
      
      broth.appendChild(letter);
      letterCount++;
      updateLetterCount();
      customLetterInput.value = '';
      
      // Make a splash when adding
      gsap.from(letter, {
        scale: 2,
        opacity: 0.5,
        duration: 0.8,
        ease: "bounce.out"
      });
      
      try {
        playSound(popSound);
      } catch (err) {
        console.log("Sound couldn't play:", err);
      }
      
      createBubbles();
    }
  });
  
  // Add custom letter with Enter key
  customLetterInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addCustomBtn.click();
    }
  });
  
  // Change broth color button
  changeColorBtn.addEventListener('click', function() {
    currentBrothColor = (currentBrothColor + 1) % brothColors.length;
    broth.style.background = brothColors[currentBrothColor];
    
    // Create color splash effect
    const splash = document.createElement('div');
    splash.style.position = 'absolute';
    splash.style.width = '100%';
    splash.style.height = '100%';
    splash.style.top = '0';
    splash.style.left = '0';
    splash.style.borderRadius = '40%';
    splash.style.background = brothColors[currentBrothColor];
    splash.style.opacity = '0.7';
    splash.style.zIndex = '2';
    broth.appendChild(splash);
    
    gsap.to(splash, {
      opacity: 0,
      scale: 1.2,
      duration: 1,
      onComplete: () => splash.remove()
    });
    
    createBubbles();
  });
  
  // Temperature slider
  tempSlider.addEventListener('input', function() {
    const value = parseInt(tempSlider.value);
    
    // Update animation speed based on temperature
    animationSpeed = 20 - value * 1.5; // Reverse the scale (higher temp = faster)
    
    // Update all letter animations
    document.querySelectorAll('.letter').forEach(letter => {
      gsap.killTweensOf(letter);
      animateLetter(letter);
    });
    
    // Update steam based on temperature
    updateSteam(value);
    
    // Update temperature display
    if (value <= 3) {
      tempDisplay.textContent = 'Cold';
      tempDisplay.style.color = '#87cefa';
    } else if (value <= 6) {
      tempDisplay.textContent = 'Medium';
      tempDisplay.style.color = '#ff6eb4';
    } else {
      tempDisplay.textContent = 'Hot!';
      tempDisplay.style.color = '#ff4500';
    }
  });
  
  // Theme buttons
  themePastel.addEventListener('click', () => changeTheme('pastel'));
  themeGalaxy.addEventListener('click', () => changeTheme('galaxy'));
  themeCandy.addEventListener('click', () => changeTheme('candy'));
  
  // Emoji buttons
  document.querySelectorAll('.emoji').forEach(emoji => {
    emoji.addEventListener('click', function() {
      const emojiChar = this.getAttribute('data-emoji');
      
      const emojiElement = document.createElement('div');
      emojiElement.className = 'letter';
      emojiElement.textContent = emojiChar;
      
      // Position
      emojiElement.style.position = 'absolute';
      emojiElement.style.left = `${Math.random() * 80 + 10}%`;
      emojiElement.style.top = `${Math.random() * 80 + 10}%`;
      
      // Style
      emojiElement.style.fontSize = '1.5rem';
      
      // Click event
      emojiElement.addEventListener('click', handleLetterClick);
      
      // Add animation
      animateLetter(emojiElement);
      
      broth.appendChild(emojiElement);
      letterCount++;
      updateLetterCount();
      
      try {
        playSound(popSound);
      } catch (err) {
        console.log("Sound couldn't play:", err);
      }
    });
  });
  
  // Create bubbles effect
  function createBubbles() {
    const bubbleCount = Math.floor(Math.random() * 5) + 5;
    
    for (let i = 0; i < bubbleCount; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      
      const size = Math.random() * 15 + 5;
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      
      const posX = Math.random() * 80 + 10;
      bubble.style.left = `${posX}%`;
      bubble.style.bottom = '0';
      
      const duration = Math.random() * 2 + 1;
      
      broth.appendChild(bubble);
      
      gsap.to(bubble, {
        y: -100,
        x: Math.random() * 20 - 10,
        opacity: 0,
        duration: duration,
        delay: Math.random() * 0.5,
        ease: "power1.out",
        onComplete: () => bubble.remove()
      });
    }
  }
  
  // Update the letter counter
  function updateLetterCount() {
    letterCounter.textContent = letterCount;
    
    // Update the bowl face
    checkBowlHappiness();
  }
  
  // Setup the bowl face
  function setupBowlFace() {
    const leftEye = document.querySelector('.left-eye');
    const rightEye = document.querySelector('.right-eye');
    const mouth = document.querySelector('.mouth');
    
    // Make eyes blink occasionally
    setInterval(() => {
      gsap.to([leftEye, rightEye], {
        scaleY: 0.1,
        duration: 0.1,
        onComplete: () => {
          gsap.to([leftEye, rightEye], {
            scaleY: 1,
            duration: 0.1
          });
        }
      });
    }, 3000);
  }
  
  // Check if bowl should be happy or sad based on letter count
  function checkBowlHappiness() {
    const mouth = document.querySelector('.mouth');
    
    if (letterCount < 5) {
      // Bowl is sad (not enough letters)
      isHappy = false;
      gsap.to(mouth, {
        borderRadius: '15px 15px 0 0',
        height: '15px',
        width: '30px',
        y: 5,
        duration: 0.5
      });
    } else if (letterCount > 40) {
      // Bowl is overwhelmed (too many letters)
      isHappy = false;
      gsap.to(mouth, {
        borderRadius: '0 0 15px 15px',
        height: '15px',
        width: '20px',
        y: 0,
        duration: 0.5
      });
    } else {
      // Bowl is happy (just right)
      isHappy = true;
      gsap.to(mouth, {
        borderRadius: '0 0 15px 15px',
        height: '15px',
        width: '30px',
        y: 0,
        duration: 0.5
      });
    }
  }
  
  // Update steam based on temperature
  function updateSteam(temperature) {
    const steamElements = document.querySelectorAll('.steam');
    
    if (temperature <= 3) {
      // Low temperature, minimal steam
      steamElements.forEach(steam => {
        steam.style.opacity = '0';
      });
    } else {
      // Higher temperature, show steam
      const opacity = temperature / 20;
      const speed = 5 - (temperature / 3); // Higher temp = faster steam
      
      steamElements.forEach(steam => {
        steam.style.opacity = opacity.toString();
        steam.style.animationDuration = `${speed}s`;
      });
    }
  }
  
  // Change theme
  function changeTheme(theme) {
    document.body.classList.remove(`theme-${currentTheme}`);
    document.body.classList.add(`theme-${theme}`);
    currentTheme = theme;
    
    // Special effect for theme change
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.backgroundColor = 'white';
    flash.style.opacity = '0.5';
    flash.style.zIndex = '999';
    flash.style.pointerEvents = 'none';
    document.body.appendChild(flash);
    
    gsap.to(flash, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => flash.remove()
    });
  }
  
  // Play sound
  function playSound(sound) {
    sound.currentTime = 0;
    sound.play();
  }
  
  // Create a cool startup animation
  function startupAnimation() {
    gsap.from(soupBowl, {
      y: -100,
      opacity: 0,
      duration: 1.5,
      ease: "bounce.out"
    });
    
    gsap.from('.title', {
      scale: 0.5,
      opacity: 0,
      duration: 1,
      delay: 0.5
    });
    
    gsap.from('.recipe-card', {
      x: 100,
      opacity: 0,
      duration: 1,
      delay: 0.8
    });
    
    // Gradually add letters for a nice effect
    setTimeout(() => {
      const interval = setInterval(() => {
        if (document.querySelectorAll('.letter').length < 20) {
          createLetters(1);
        } else {
          clearInterval(interval);
        }
      }, 100);
    }, 1000);
  }
  
  // Run startup animation
  startupAnimation();
  
  // Create initial bubbles
  setTimeout(createBubbles, 1500);
});