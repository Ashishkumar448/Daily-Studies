// Fix the Start positon of the button
// Fix the End position of the button
// Overall optimize the code for performance

const progressValue = document.querySelector(".progress-value");
const currentSection = document.querySelector(".current-section");
const sections = document.querySelectorAll(".section");
const navItems = document.querySelectorAll(".nav-item");
const progressTrack = document.querySelector(".progress-track");

let currentSectionName = "";

// 3D hover effect
progressTrack.addEventListener("mousemove", (e) => {
  const rect = progressTrack.getBoundingClientRect();
  const x = e.clientX - rect.left - rect.width / 2;
  const y = e.clientY - rect.top - rect.height / 2;

  gsap.to(progressTrack, {
    rotateY: 30 + x * 0.02,
    rotateX: 10 + y * -0.02,
    duration: 0.5,
    ease: "power2.out"
  });
});

progressTrack.addEventListener("mouseleave", () => {
  gsap.to(progressTrack, {
    rotateY: 30,
    rotateX: 10,
    duration: 0.5,
    ease: "power2.out"
  });
});

// Nav item interactions
navItems.forEach((item) => {
  item.addEventListener("mouseenter", () => {
    gsap.to(item, {
      z: 40,
      duration: 0.3,
      ease: "power2.out"
    });
  });

  item.addEventListener("mouseleave", () => {
    gsap.to(item, {
      z: item.classList.contains("active") ? 30 : 0,
      duration: 0.3,
      ease: "power2.out"
    });
  });

  item.addEventListener("click", () => {
    const section = document.querySelector(
      `[data-section="${item.dataset.section}"]`
    );
    gsap.to(window, {
      duration: 1,
      scrollTo: section,
      ease: "power2.inOut"
    });
  });
});

function calculateProgress(element, scrollPos) {
  const rect = element.getBoundingClientRect();
  const scrollStart = scrollPos + rect.top - window.innerHeight;
  const scrollEnd = scrollStart + rect.height + window.innerHeight;
  const currentScroll = scrollPos;

  const progress =
    ((currentScroll - scrollStart) / (scrollEnd - scrollStart)) * 100;
  return Math.max(0, Math.min(100, progress));
}

function updateProgress() {
  const scrollPos = window.scrollY;
  const windowHeight = window.innerHeight;
  const docHeight = document.documentElement.scrollHeight;
  const maxScroll = docHeight - windowHeight;
  const totalProgress = Math.min(100, (scrollPos / maxScroll) * 100);

  progressValue.textContent = `${Math.round(totalProgress)}%`;

  sections.forEach((section, index) => {
    const rect = section.getBoundingClientRect();
    const centerVisible =
      rect.top <= windowHeight / 2 && rect.bottom >= windowHeight / 2;

    if (centerVisible) {
      const progress = calculateProgress(section, scrollPos);

      navItems.forEach((item, i) => {
        const navFill = item.querySelector(".nav-fill");

        if (i === index) {
          item.classList.add("active");
          navFill.style.width = `${progress}%`;

          const newSectionName = section.dataset.section;
          if (currentSectionName !== newSectionName) {
            currentSectionName = newSectionName;
            gsap.to(currentSection, {
              opacity: 0,
              y: 10,
              duration: 0.2,
              onComplete: () => {
                currentSection.textContent = newSectionName;
                gsap.to(currentSection, {
                  opacity: 1,
                  y: 0,
                  duration: 0.2
                });
              }
            });
          }
        } else {
          item.classList.remove("active");
          navFill.style.width = i < index ? "100%" : "0%";
          gsap.to(item, { z: 0, duration: 0.3 });
        }
      });
    }
  });
}

window.addEventListener("scroll", updateProgress);
updateProgress();

gsap.from(".progress-container", {
  opacity: 0,
  x: -50,
  rotateY: 60,
  duration: 1,
  ease: "power3.out",
  delay: 0.5
});