// Make sure this runs after page is fully loaded
window.addEventListener('load', function() {
  if (typeof gsap === 'undefined') {
    console.error("GSAP is not loaded");
    return;
  }
  
  gsap.registerPlugin(ScrollTrigger);
  
  // First clear any existing wipe effects
  document.querySelectorAll('.wipe-effect').forEach(el => el.remove());
  
  // Add wipe effect elements to each section manually
  const sections = document.querySelectorAll('.wipe-section');
  sections.forEach((section, index) => {
    // Create wipe effect element
    const wipeEffect = document.createElement('div');
    wipeEffect.classList.add('wipe-effect');
    section.appendChild(wipeEffect);
    
    // Set initial position (off-screen left)
    gsap.set(wipeEffect, { x: '-100%' });
    
    // Create separate animation for each wipe effect
    gsap.to(wipeEffect, {
      x: '100%',  // Final position (off-screen right)
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
        onEnter: () => console.log(`Section ${index} entered`),
        onLeave: () => console.log(`Section ${index} left`),
        markers: true
      }
    });
  });
});