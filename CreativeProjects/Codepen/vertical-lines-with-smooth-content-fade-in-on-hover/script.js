document.querySelectorAll(".biography__button").forEach((button) => {
  button.addEventListener("mouseenter", () => {
    const contentId = button.getAttribute("data-content");
    const currentText = document.querySelector(".biography__text.active");
    const newText = document.querySelector(`.biography__text--${contentId}`);

    // Prevent actions if the current text is the same as the new one
    if (currentText !== newText) {
      // Kill all tweens on both current and new text to prevent overlap issues
      gsap.killTweensOf([currentText, newText]);

      // Immediately hide and reset styles of current text
      gsap.set(currentText, { opacity: 0, visibility: "hidden" });
      currentText.classList.remove("active");

      // Immediately reset styles of new text before showing
      gsap.set(newText, { opacity: 0, visibility: "visible" });

      // Start the new fade-in animation
      gsap.to(newText, {
        duration: 0.2,
        opacity: 1,
        ease: "power2.in",
        onStart: () => {
          newText.classList.add("active");
        }
      });
    }
  });
});