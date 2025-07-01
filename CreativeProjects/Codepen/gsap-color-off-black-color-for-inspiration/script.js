// Custom ease animations
CustomEase.create("customEase", "0.6, 0.01, 0.05, 1");
CustomEase.create("blurEase", "0.25, 0.1, 0.25, 1");
CustomEase.create("counterEase", "0.16, 1, 0.3, 1");
CustomEase.create("gentleIn", "0.38, 0.005, 0.215, 1");

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // First animate the rows themselves
  const colorRows = document.querySelectorAll(".color-row");

  gsap.to(colorRows, {
    opacity: 1,
    y: 0,
    duration: 0.5,
    stagger: 0.08,
    ease: "customEase"
  });

  // Animate text elements as whole lines with blur
  colorRows.forEach((row, rowIndex) => {
    // Get text elements
    const hexElement = row.querySelector(".color-hex");
    const numberElement = row.querySelector(".color-number");
    const nameElement = row.querySelector(".color-name");

    // Animate hex
    gsap.to(hexElement, {
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.4,
      delay: 0.1 + rowIndex * 0.08,
      ease: "gentleIn"
    });

    // Animate number
    gsap.to(numberElement, {
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.4,
      delay: 0.2 + rowIndex * 0.08,
      ease: "gentleIn"
    });

    // Animate name
    gsap.to(nameElement, {
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.4,
      delay: 0.3 + rowIndex * 0.08,
      ease: "gentleIn",
      onComplete: rowIndex === colorRows.length - 1 ? setupInteractions : null
    });

    // Split only the expanded color name for character animation
    const expandedName = row.querySelector(".expanded-color-name");
    new SplitType(expandedName, { types: "chars" });
  });
});

function setupInteractions() {
  let activeRow = null;

  document.querySelectorAll(".color-row").forEach((row) => {
    // Click to expand
    row.addEventListener("click", function () {
      // If this row is already active, close it
      if (activeRow === this) {
        hideExpanded(this);
        activeRow = null;
        return;
      }

      // If another row is active, close it first
      if (activeRow) {
        // Hide previous expanded content
        hideExpanded(activeRow);
      }

      // Show expanded content for this row
      showExpanded(this);
      activeRow = this;
    });

    // Hover effect
    row.addEventListener("mouseenter", function () {
      if (this !== activeRow) {
        gsap.to(this, {
          flex: 1.2,
          duration: 0.2,
          ease: "counterEase"
        });
      }
    });

    row.addEventListener("mouseleave", function () {
      if (this !== activeRow) {
        gsap.to(this, {
          flex: 1,
          duration: 0.2,
          ease: "blurEase"
        });
      }
    });

    // Click to copy hex in normal view
    const colorHex = row.querySelector(".color-hex");
    colorHex.addEventListener("click", function (e) {
      e.stopPropagation();
      const hexCode = this.textContent.split(" ")[1];
      navigator.clipboard.writeText("#" + hexCode);
      showCopyNotification("#" + hexCode);
    });
  });

  // Setup click to copy in expanded view - only for HEX and OKLCH
  document.querySelectorAll(".detail-hex, .detail-oklch").forEach((item) => {
    item.addEventListener("click", function (e) {
      e.stopPropagation();
      let copyText = "";

      if (this.classList.contains("detail-hex")) {
        copyText = "#" + this.textContent.split(" ")[1];
      } else if (this.classList.contains("detail-oklch")) {
        copyText = this.textContent;
      }

      navigator.clipboard.writeText(copyText);
      showCopyNotification(copyText + " copied");
    });
  });
}

function showExpanded(row) {
  const expandedContent = row.querySelector(".expanded-content");
  const colorContent = row.querySelector(".color-content");
  const allRows = document.querySelectorAll(".color-row");

  // Prepare expanded content
  expandedContent.style.display = "flex";

  // Hide regular content
  colorContent.style.display = "none";

  // Expand the row
  gsap.to(row, {
    flex: 8,
    duration: 0.4,
    ease: "counterEase"
  });

  // Animate the color name characters with split-type
  const expandedName = expandedContent.querySelector(".expanded-color-name");
  const nameChars = expandedName.querySelectorAll(".char");

  gsap.fromTo(
    nameChars,
    { opacity: 0, filter: "blur(15px)" },
    {
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.5,
      stagger: 0.02,
      ease: "customEase"
    }
  );

  // Animate the details with staggered blur (whole lines)
  const detailItems = expandedContent.querySelectorAll(".expanded-details div");

  gsap.to(detailItems, {
    opacity: 1,
    filter: "blur(0px)",
    duration: 0.4,
    stagger: 0.1,
    ease: "blurEase"
  });

  // Scale down other rows
  allRows.forEach((otherRow) => {
    if (otherRow !== row) {
      gsap.to(otherRow, {
        flex: 0.5,
        duration: 0.4,
        ease: "counterEase"
      });
    }
  });
}

function hideExpanded(row) {
  const expandedContent = row.querySelector(".expanded-content");
  const colorContent = row.querySelector(".color-content");
  const allRows = document.querySelectorAll(".color-row");

  // Reset all rows
  allRows.forEach((otherRow) => {
    gsap.to(otherRow, {
      flex: 1,
      duration: 0.4,
      ease: "counterEase"
    });
  });

  // Hide expanded content
  expandedContent.style.display = "none";
  colorContent.style.display = "flex";

  // Reset detail items
  const detailItems = expandedContent.querySelectorAll(".expanded-details div");
  gsap.set(detailItems, {
    opacity: 0,
    filter: "blur(10px)"
  });
}

function showCopyNotification(text) {
  const notification = document.querySelector(".copy-notification");
  notification.textContent = text;

  gsap.to(notification, {
    opacity: 1,
    duration: 0.2,
    ease: "gentleIn",
    onComplete: () => {
      gsap.to(notification, {
        opacity: 0,
        delay: 0.8,
        duration: 0.2,
        ease: "blurEase"
      });
    }
  });
}