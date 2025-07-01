// Enable debug mode
const DEBUG = true;

// Function to add a debug message to the on-screen debug box
function debug(...args) {
  if (DEBUG) {
    const debugContent = document.getElementById("debug-content");
    const message = args.join(" ");
    const timestamp = new Date().toISOString().substr(11, 8); // HH:mm:ss
    const debugEntry = document.createElement("p");
    debugEntry.textContent = `[${timestamp}] ${message}`;
    debugContent.appendChild(debugEntry);
    debugContent.scrollTop = debugContent.scrollHeight;

    // Limit the number of messages to prevent overflow
    while (debugContent.children.length > 20) {
      debugContent.removeChild(debugContent.firstChild);
    }
  }
}

// Global array to cache info about indicators for easy access
let indicators = [];

window.addEventListener("load", function () {
  debug("Page loaded. Initializing indicators...");

  // Create and add indicators to the page
  function createIndicators() {
    const articles = document.querySelectorAll("article");
    let rawIndicators = "";

    articles.forEach((article, index) => {
      const inverseIndex = articles.length - index - 1;
      const topMargin = index * 1.5 + 0.5;
      const bottomMargin = inverseIndex * 1.5 + 0.5;
      const margins = `margin: ${topMargin}em 0 ${bottomMargin}em 0;`;
      const sectionName = article.querySelector("h1").textContent;

      rawIndicators += `
                <a class="indicator indicator--upcoming" style="${margins}" href="#${article.id}">
                    <span class="indicator-label">${sectionName}</span>
                </a>
            `;
    });

    document.body.insertAdjacentHTML("beforeend", rawIndicators);
    debug(`Created ${articles.length} indicators`);
  }

  // Calculate the top position for an indicator
  function getIndicatorTopPosition(indicator, target) {
    const indicatorMarginTop = parseInt(
      window.getComputedStyle(indicator).marginTop
    );
    const targetCenter = target.offsetHeight / 2;
    const indicatorCenter = indicator.offsetHeight / 2;
    return (
      target.offsetTop - indicatorMarginTop + targetCenter - indicatorCenter
    );
  }

  // Initialize indicator objects with necessary information
  function initializeIndicators() {
    indicators = [];
    document.querySelectorAll(".indicator").forEach((indicator) => {
      const target = document.querySelector(indicator.getAttribute("href"));
      const targetTitle = target.querySelector("h1");
      const absPos = getIndicatorTopPosition(indicator, targetTitle);

      indicators.push({
        indicator: indicator,
        target: target,
        targetTitle: targetTitle,
        absPos: absPos,
        absBottomStop: window.innerHeight - (absPos + indicator.offsetHeight),
        viewableTopStop: target.offsetTop - window.innerHeight,
        viewableBottomStop: target.offsetTop + target.offsetHeight
      });
    });
    debug(`Initialized ${indicators.length} indicator objects`);
  }

  // Update indicator positions and classes based on scroll position
  function updateIndicators() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const scrollPercent = (scrollTop / (docHeight - winHeight)) * 100;
    document.getElementById("progress-line").style.height = `${scrollPercent}%`;

    debug(`Scroll position: ${scrollTop}px (${scrollPercent.toFixed(2)}%)`);

    indicators.forEach((ind) => {
      if (scrollTop <= ind.absPos && scrollTop >= -1 * ind.absBottomStop) {
        ind.indicator.className = "indicator indicator--active";
        ind.indicator.style.top = `${ind.absPos}px`;
        debug(
          `Indicator ${ind.targetTitle.textContent} active at ${ind.absPos}px`
        );
      } else if (scrollTop >= -1 * ind.absBottomStop) {
        ind.indicator.className = "indicator indicator--passed";
        ind.indicator.style.top = "";
        debug(`Indicator ${ind.targetTitle.textContent} passed`);
      } else {
        ind.indicator.className = "indicator indicator--upcoming";
        ind.indicator.style.top = "";
        debug(`Indicator ${ind.targetTitle.textContent} upcoming`);
      }

      if (
        scrollTop >= ind.viewableTopStop &&
        scrollTop <= ind.viewableBottomStop
      ) {
        ind.indicator.classList.add("indicator--viewing");
        debug(`Section ${ind.targetTitle.textContent} in view`);
      } else {
        ind.indicator.classList.remove("indicator--viewing");
      }
    });
  }

  // Initialize the page
  function init() {
    createIndicators();
    initializeIndicators();
    updateIndicators();

    // Bind events
    window.addEventListener("scroll", updateIndicators);
    window.addEventListener("resize", () => {
      debug("Window resized. Recalculating indicator positions...");
      initializeIndicators();
      updateIndicators();
    });

    // Add click event listeners to indicators
    document.querySelectorAll(".indicator").forEach((indicator) => {
      indicator.addEventListener("click", function (e) {
        e.preventDefault();
        const targetId = this.getAttribute("href");
        const targetElement = document.querySelector(targetId);
        debug(`Scrolling to section: ${targetId}`);

        // Calculate the target scroll position
        const targetPosition =
          targetElement.getBoundingClientRect().top + window.pageYOffset;

        // Scroll to the target position
        window.scrollTo({
          top: targetPosition,
          behavior: "smooth"
        });
      });
    });

    debug("Initialization complete");
  }

  // Start the application
  init();
});