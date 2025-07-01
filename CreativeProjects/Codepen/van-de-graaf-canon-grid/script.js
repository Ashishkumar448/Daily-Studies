// Define the set of characters and symbols used in the animation
const lettersAndSymbols = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "!",
  "@",
  "#",
  "$",
  "%",
  "^",
  "&",
  "*",
  "-",
  "_",
  "+",
  "=",
  ";",
  ":",
  "<",
  ">",
  ","
];

// Class to handle text animations on hover using SplitType and GSAP
class TextAnimator {
  constructor(textElement) {
    if (!textElement || !(textElement instanceof HTMLElement)) {
      throw new Error("Invalid text element provided.");
    }

    this.textElement = textElement;
    this.originalChars = [];
    this.splitText();
  }

  splitText() {
    this.splitter = new SplitType(this.textElement, {
      types: "words, chars"
    });
    this.originalChars = this.splitter.chars.map((char) => char.innerHTML);
  }

  animate() {
    this.reset();
    const chars = this.splitter.chars;

    chars.forEach((char, position) => {
      let initialHTML = char.innerHTML;

      gsap.fromTo(
        char,
        { opacity: 0 },
        {
          duration: 0.03,
          onComplete: () =>
            gsap.set(char, { innerHTML: initialHTML, delay: 0.1 }),
          repeat: 2,
          repeatRefresh: true,
          repeatDelay: 0.05,
          delay: (position + 1) * 0.06,
          innerHTML: () =>
            lettersAndSymbols[
              Math.floor(Math.random() * lettersAndSymbols.length)
            ],
          opacity: 1
        }
      );
    });

    gsap.fromTo(
      this.textElement,
      { "--anim": 0 },
      { duration: 1, ease: "expo", "--anim": 1 }
    );
  }

  animateBack() {
    gsap.killTweensOf(this.textElement);
    gsap.to(this.textElement, { duration: 0.6, ease: "power4", "--anim": 0 });
  }

  reset() {
    const chars = this.splitter.chars;
    chars.forEach((char, index) => {
      gsap.killTweensOf(char);
      char.innerHTML = this.originalChars[index];
    });

    gsap.killTweensOf(this.textElement);
    gsap.set(this.textElement, { "--anim": 0 });
  }
}

// Initialize hover effects for .list__item elements
const init = () => {
  document.querySelectorAll(".list__item").forEach((item) => {
    const animators = Array.from(item.querySelectorAll(".hover-effect")).map(
      (col) => new TextAnimator(col)
    );

    // Trigger all hover effects inside the .list__item on hover
    item.addEventListener("mouseenter", () => {
      animators.forEach((animator) => animator.animate());
    });
    item.addEventListener("mouseleave", () => {
      animators.forEach((animator) => animator.animateBack());
    });
  });
};

init();