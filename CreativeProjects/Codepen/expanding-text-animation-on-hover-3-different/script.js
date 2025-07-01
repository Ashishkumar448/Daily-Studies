document.addEventListener("DOMContentLoaded", function () {
    // Split text for each animation individually
    const fadeText = new SplitType('.fade span', { types: 'chars' });
    const blurText = new SplitType('.blur span', { types: 'chars' });

    // Characters for each animation
    const fadeChars = fadeText.chars;
    const blurChars = blurText.chars;

    // GSAP Timeline for Fade Animation
    const fadeTimeline = gsap.timeline({ paused: true, reversed: true });

    fadeTimeline
      .set(fadeChars, { opacity: 0 }) // Set initial hidden state
      .to(fadeChars, {
        opacity: 1,
        stagger: 0.05,
        duration: 0.5,
        ease: 'power2.out',
        onReverseComplete: () => {
          gsap.set(fadeChars, { opacity: 0, clearProps: "opacity,filter" }); // Reset opacity and filter properties only
        },
      });

    // GSAP Timeline for Blur Animation
    const blurTimeline = gsap.timeline({ paused: true, reversed: true });

    blurTimeline
      .set(blurChars, { opacity: 0, filter: 'blur(4px)' }) // Set initial blur and hidden state
      .to(blurChars, {
        opacity: 1,
        filter: 'blur(0px)',
        stagger: 0.05,
        duration: 0.5,
        ease: 'power2.out',
        onReverseComplete: () => {
          gsap.set(blurChars, { opacity: 0, filter: 'blur(4px)', clearProps: "opacity,filter" }); // Reset opacity and filter properties only
        },
      });

    // Event Listeners for the Fade Animation
    document.querySelector('.fade').addEventListener('mouseenter', () => {
      fadeTimeline.restart().play(); // Restart and play forward on hover in
    });

    document.querySelector('.fade').addEventListener('mouseleave', () => {
      fadeTimeline.reverse(); // Reverse animation on hover out
    });

    // Event Listeners for the Blur Animation
    document.querySelector('.blur').addEventListener('mouseenter', () => {
      blurTimeline.restart().play(); // Restart and play forward on hover in
    });

    document.querySelector('.blur').addEventListener('mouseleave', () => {
      blurTimeline.reverse(); // Reverse animation on hover out
    });
  });