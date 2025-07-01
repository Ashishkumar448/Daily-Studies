// TODO
// Add draggable feature for Scroll Indicator

class ScrollIndicator {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      showThumb: true,
      showTooltip: true,
      showPercentages: true,
      ...options
    };
    this.isVertical = container.classList.contains(
      "scroll-indicator--vertical"
    );
    this.sliderThumb = container.querySelector(".scroll-indicator__thumb");
    this.sliderTooltip = container.querySelector(".scroll-indicator__tooltip");
    this.progressBar = container.querySelector(".scroll-indicator__progress");
    this.scale = container.querySelector(".scroll-indicator__scale");

    this.createScale();
    this.updateVisibility();
  }

  createScale() {
    for (let i = 0; i <= 100; i += 2) {
      const marker = document.createElement("div");
      marker.classList.add("scroll-indicator__marker");
      if (i % 10 === 0) {
        marker.classList.add("scroll-indicator__marker--major");
        if (this.options.showPercentages) {
          const percentageMarker = document.createElement("div");
          percentageMarker.classList.add("scroll-indicator__percentage");
          percentageMarker.textContent = `${i}%`;
          if (this.isVertical) {
            percentageMarker.style.top = `${i}%`;
          } else {
            percentageMarker.style.left = `${i}%`;
          }
          this.scale.appendChild(percentageMarker);
        }
      }
      if (this.isVertical) {
        marker.style.top = `${i}%`;
        marker.style.width = i % 10 === 0 ? "14px" : "10px";
      } else {
        marker.style.left = `${i}%`;
        marker.style.height = i % 10 === 0 ? "14px" : "10px";
      }
      this.scale.appendChild(marker);
    }
  }

  updateVisibility() {
    this.sliderThumb.style.display = this.options.showThumb ? "block" : "none";
    this.sliderTooltip.style.display = this.options.showTooltip
      ? "block"
      : "none";
  }

  update(scrollPercentage) {
    scrollPercentage = Math.min(100, Math.max(0, scrollPercentage)); // Clamp between 0 and 100

    if (this.isVertical) {
      this.sliderThumb.style.top = `${scrollPercentage}%`;
      this.sliderTooltip.style.top = `${scrollPercentage}%`;
      this.progressBar.style.height = `${scrollPercentage}%`;
    } else {
      this.sliderThumb.style.left = `${scrollPercentage}%`;
      this.sliderTooltip.style.left = `${scrollPercentage}%`;
      this.progressBar.style.width = `${scrollPercentage}%`;
    }
    this.sliderTooltip.textContent = `${Math.round(scrollPercentage)}%`;

    this.updateMarkers(scrollPercentage);
  }

  updateMarkers(scrollPercentage) {
    const markers = this.scale.querySelectorAll(".scroll-indicator__marker");
    const percentageMarkers = this.scale.querySelectorAll(
      ".scroll-indicator__percentage"
    );

    markers.forEach((marker, index) => {
      const markerPercentage = index * 2;
      if (
        markerPercentage < scrollPercentage ||
        (index === markers.length - 1 && scrollPercentage >= 99)
      ) {
        marker.classList.add("scroll-indicator__marker--filled");
        if (this.isVertical) {
          marker.style.width = marker.classList.contains(
            "scroll-indicator__marker--major"
          )
            ? "40px"
            : "30px";
        } else {
          marker.style.height = marker.classList.contains(
            "scroll-indicator__marker--major"
          )
            ? "40px"
            : "30px";
        }
      } else {
        marker.classList.remove("scroll-indicator__marker--filled");
        if (this.isVertical) {
          marker.style.width = marker.classList.contains(
            "scroll-indicator__marker--major"
          )
            ? "14px"
            : "10px";
        } else {
          marker.style.height = marker.classList.contains(
            "scroll-indicator__marker--major"
          )
            ? "14px"
            : "10px";
        }
      }
    });

    percentageMarkers.forEach((marker) => {
      const markerPercentage = parseInt(marker.textContent);
      if (markerPercentage === 0) {
        marker.classList.toggle(
          "scroll-indicator__percentage--visible",
          scrollPercentage > 0
        );
      } else if (
        markerPercentage < scrollPercentage ||
        (markerPercentage === 100 && scrollPercentage >= 99)
      ) {
        marker.classList.add("scroll-indicator__percentage--visible");
      } else {
        marker.classList.remove("scroll-indicator__percentage--visible");
      }
    });
  }
}

// Function to check if scrolling is possible
function isScrollable() {
  return document.documentElement.scrollHeight > window.innerHeight;
}

// Initialize indicators only if scrolling is possible
let horizontalIndicator = null;
let verticalIndicator = null;

function initializeIndicators() {
  // Check for scrollability on initialization and window resize
  if (isScrollable()) {
    if (!horizontalIndicator) {
      horizontalIndicator = new ScrollIndicator(
        document.getElementById("horizontalIndicator")
      );
    }
    if (!verticalIndicator) {
      verticalIndicator = new ScrollIndicator(
        document.getElementById("verticalIndicator")
      );
    }
  } else {
    // Hide indicators if no scrolling is needed
    if (horizontalIndicator) {
      horizontalIndicator.container.style.display = "none";
    }
    if (verticalIndicator) {
      verticalIndicator.container.style.display = "none";
    }
  }
}

function updateScrollIndicators(scrollPos) {
  if (!isScrollable()) {
    // Hide indicators if there's nothing to scroll
    if (horizontalIndicator) {
      horizontalIndicator.container.style.display = "none";
    }
    if (verticalIndicator) {
      verticalIndicator.container.style.display = "none";
    }
    return;
  }

  const scrollPercentage =
    (scrollPos / (document.documentElement.scrollHeight - window.innerHeight)) *
    100;

  if (horizontalIndicator) {
    horizontalIndicator.update(scrollPercentage);
  }
  if (verticalIndicator) {
    verticalIndicator.update(scrollPercentage);
  }
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function using requestAnimationFrame
function throttle(callback) {
  let ticking = false;
  return function (...args) {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        callback(...args);
        ticking = false;
      });
      ticking = true;
    }
  };
}

// Debounced and throttled scroll handler
const handleScroll = throttle(() => {
  updateScrollIndicators(window.scrollY);
});

window.addEventListener("scroll", handleScroll);
window.addEventListener(
  "resize",
  debounce(() => {
    initializeIndicators(); // Reinitialize indicators on window resize
    updateScrollIndicators(window.scrollY); // Update the scroll position after resize
  }, 250)
);

// Initial initialization and update
initializeIndicators();
updateScrollIndicators(window.scrollY);