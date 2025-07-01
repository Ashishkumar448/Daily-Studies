const progressNav = document.querySelector(".progress-nav");
const progressCircle = document.querySelector(".circle-progress");
const percentageEl = document.querySelector(".percentage");
const sections = document.querySelectorAll(".section");
const dropdownItems = document.querySelectorAll(".dropdown-item");
const currentSectionEl = document.querySelector(".current-section");

// Calculate circle circumference
const radius = 10;
const circumference = 2 * Math.PI * radius;
progressCircle.style.strokeDasharray = circumference;
progressCircle.style.strokeDashoffset = circumference;

// Toggle dropdown
progressNav.addEventListener("click", (e) => {
  if (!e.target.closest(".dropdown-item")) {
    progressNav.classList.toggle("open");
  }
});

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (!progressNav.contains(e.target)) {
    progressNav.classList.remove("open");
  }
});

// Handle section navigation
dropdownItems.forEach((item) => {
  item.addEventListener("click", () => {
    const section = document.querySelector(
      `[data-section="${item.dataset.section}"]`
    );
    section.scrollIntoView({ behavior: "smooth" });
    progressNav.classList.remove("open");
  });
});

// Update progress based on scroll
function updateProgress() {
  const scrollTop = window.scrollY;
  const windowHeight = window.innerHeight;
  const docHeight = document.documentElement.scrollHeight;
  const scrollPercent = (scrollTop / (docHeight - windowHeight)) * 100;

  // Update circular progress
  const offset = circumference - (scrollPercent / 100) * circumference;
  progressCircle.style.strokeDashoffset = offset;

  // Update percentage
  percentageEl.textContent = `${Math.round(scrollPercent)}%`;

  // Update active section
  const currentScrollPos = scrollTop + windowHeight / 2;
  sections.forEach((section, index) => {
    const sectionTop = section.offsetTop;
    const sectionBottom = sectionTop + section.offsetHeight;

    if (currentScrollPos >= sectionTop && currentScrollPos < sectionBottom) {
      dropdownItems.forEach((item) => item.classList.remove("active"));
      dropdownItems[index].classList.add("active");
      currentSectionEl.textContent = section.dataset.section;
    }
  });
}

window.addEventListener("scroll", updateProgress);
updateProgress(); // Initial update

// Initial animation
gsap.from(progressNav, {
  opacity: 0,
  x: 50,
  duration: 1,
  ease: "power3.out",
  delay: 0.5
});