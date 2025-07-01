gsap.registerPlugin(ScrollTrigger, CustomEase);

const header = document.querySelector(".header");
const nav = document.querySelector(".header__nav");
const navMenu = document.querySelector(".header__menu");
const logo = document.querySelector(".header__logo");
const customEase = CustomEase.create(
  "custom",
  "M0,0 C0.126,0.382 0.282,0.674 0.44,0.822 0.632,1.002 0.818,1.001 1,1"
);

ScrollTrigger.create({
  trigger: ".hero",
  start: "top top",
  end: "bottom top",
  scrub: true,
  onUpdate: (self) => {
    const progress = self.progress;
    gsap.to(navMenu, {
      justifyContent: progress < 0.5 ? "space-around" : "space-around",
      duration: 0,
      ease: customEase
    });
    gsap.to(logo, {
      fontSize: gsap.utils.interpolate(256, 72, progress),
      duration: 0,
      ease: customEase
    });
  }
});
