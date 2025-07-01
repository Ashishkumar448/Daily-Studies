document.addEventListener("DOMContentLoaded", () => {
  // Register GSAP plugins
  gsap.registerPlugin(CustomEase);
  // Create custom eases
  CustomEase.create("projectExpand", "0.25, 0.1, 0.25, 1.05");
  CustomEase.create("projectCollapse", "0.36, 0.07, 0.19, 0.97");
  CustomEase.create("textReveal", "0.25, 1, 0.5, 1");
  CustomEase.create("squareStretch", "0.22, 1, 0.36, 1");
  const projectItems = document.querySelectorAll(".project-item");
  let activeProject = null;
  let isClickAllowed = true;
  // Initialize text splitting
  projectItems.forEach((project) => {
    const detailElements = project.querySelectorAll(".project-details p");
    detailElements.forEach((element) => {
      // Create a simple text splitting approach that works without SplitType
      const originalText = element.innerText;
      element.innerHTML = "";
      const lineWrapper = document.createElement("div");
      lineWrapper.className = "line-wrapper";
      const lineElement = document.createElement("div");
      lineElement.className = "line";
      lineElement.innerText = originalText;
      lineWrapper.appendChild(lineElement);
      element.appendChild(lineWrapper);
      // Set initial GSAP position
      gsap.set(lineElement, {
        y: "100%",
        opacity: 0
      });
    });
    // Set initial state for project items - hide them
    projectItems.forEach((item) => {
      gsap.set(item, {
        opacity: 0,
        y: 15
      });
    });
    // Create staggered reveal animation on page load
    gsap.to(projectItems, {
      opacity: 1,
      y: 0,
      duration: 0.4,
      stagger: 0.06,
      ease: "none", // Linear easing as requested
      onComplete: () => {
        // Ensure all items are fully visible after animation
        gsap.set(projectItems, {
          clearProps: "opacity,y"
        });
      }
    });
    // Set up hover indicators
    const titleContainer = project.querySelector(".project-title-container");
    const leftIndicator = project.querySelector(".hover-indicator.left");
    const rightIndicator = project.querySelector(".hover-indicator.right");
    // Set proper initial state
    gsap.set(titleContainer, {
      transformPerspective: 1000,
      transformStyle: "preserve-3d"
    });
    // Set initial sizes for indicators
    gsap.set([leftIndicator, rightIndicator], {
      width: "0px", // Start with 0 width
      height: "8px",
      opacity: 1, // Always visible when animating
      transformOrigin: "center center",
      zIndex: 200 // Ensure indicators are always on top
    });
    // Add hover event listeners with fixed positioning
    titleContainer.addEventListener("mouseenter", () => {
      // Only show hover effect when NO project is active (no 3D perspective)
      if (!activeProject) {
        gsap.killTweensOf([leftIndicator, rightIndicator]);
        // Left square animation - start with 0 width, expand to 12px, then back to 8px
        gsap
          .timeline()
          .set(leftIndicator, {
            opacity: 1, // Always visible
            x: -20,
            width: "0px", // Start with 0 width
            height: "8px"
          })
          .to(leftIndicator, {
            x: -10,
            width: "12px", // Expand to 12px
            duration: 0.15,
            ease: "power2.in" // Ease in
          })
          .to(leftIndicator, {
            x: 0,
            width: "8px", // Back to 8px
            duration: 0.15,
            ease: "none" // Linear
          });
        // Right square animation (staggered)
        gsap
          .timeline({
            delay: 0.05
          })
          .set(rightIndicator, {
            opacity: 1, // Always visible
            x: 20,
            width: "0px", // Start with 0 width
            height: "8px"
          })
          .to(rightIndicator, {
            x: 10,
            width: "12px", // Expand to 12px
            duration: 0.15,
            ease: "power2.in" // Ease in
          })
          .to(rightIndicator, {
            x: 0,
            width: "8px", // Back to 8px
            duration: 0.15,
            ease: "none" // Linear
          });
      }
    });
    titleContainer.addEventListener("mouseleave", () => {
      // Only animate out when NO project is active
      if (!activeProject) {
        gsap.killTweensOf([leftIndicator, rightIndicator]);
        // Left square animation - start at 8px, expand to 12px, then shrink to 0px
        gsap
          .timeline()
          .to(leftIndicator, {
            x: -10,
            width: "12px", // Expand to 12px
            duration: 0.15,
            ease: "none" // Linear
          })
          .to(leftIndicator, {
            x: -20,
            width: "0px", // Shrink to 0px
            duration: 0.15,
            ease: "power2.out" // Ease out
          });
        // Right square animation - start at 8px, expand to 12px, then shrink to 0px
        gsap
          .timeline()
          .to(rightIndicator, {
            x: 10,
            width: "12px", // Expand to 12px
            duration: 0.15,
            ease: "none" // Linear
          })
          .to(rightIndicator, {
            x: 20,
            width: "0px", // Shrink to 0px
            duration: 0.15,
            ease: "power2.out" // Ease out
          });
      }
    });
  });
  // Function to apply 3D transforms with opposite directions
  const applyStarWarsEffect = (activeIndex) => {
    projectItems.forEach((item, index) => {
      const titleContainer = item.querySelector(".project-title-container");
      // Skip the active project
      if (index === activeIndex) {
        gsap.to(titleContainer, {
          rotateX: 0,
          rotateY: 0,
          translateZ: 0,
          translateY: 0,
          scale: 1,
          duration: 0.6,
          ease: "power2.out",
          zIndex: 50 // Active item should be on top
        });
        return;
      }
      // Calculate distance from active project
      const distance = Math.abs(index - activeIndex);
      // Determine if item is above or below active
      const isAbove = index < activeIndex;
      // Calculate transform values based on distance and position
      // Items above rotate opposite to items below
      let rotateX, translateZ, translateY;
      if (distance === 1) {
        rotateX = isAbove ? 12 : -12; // Opposite directions
        translateZ = -80;
        translateY = isAbove ? -15 : 15;
      } else if (distance === 2) {
        rotateX = isAbove ? 20 : -20; // Opposite directions
        translateZ = -160;
        translateY = isAbove ? -30 : 30;
      } else {
        rotateX = isAbove ? 30 : -30; // Opposite directions
        translateZ = -240;
        translateY = isAbove ? -45 : 45;
      }
      // Apply transform with GSAP
      gsap.to(titleContainer, {
        rotateX: rotateX,
        translateZ: translateZ,
        translateY: translateY,
        scale: 1 - distance * 0.05, // Subtle scaling based on distance
        duration: 0.6,
        ease: "power2.out",
        zIndex: 40 - distance * 5 // Ensure proper stacking
      });
      // Make sure hover indicators stay on top
      const leftIndicator = item.querySelector(".hover-indicator.left");
      const rightIndicator = item.querySelector(".hover-indicator.right");
      gsap.set([leftIndicator, rightIndicator], {
        zIndex: 200 // Always keep indicators on top
      });
    });
  };
  // Function to reset all transforms
  const resetTransforms = () => {
    projectItems.forEach((item) => {
      const titleContainer = item.querySelector(".project-title-container");
      gsap.to(titleContainer, {
        rotateX: 0,
        rotateY: 0,
        translateZ: 0,
        translateY: 0,
        scale: 1,
        duration: 0.6,
        ease: "power2.out",
        zIndex: 1
      });
      // Reset hover indicators to initial state
      const leftIndicator = item.querySelector(".hover-indicator.left");
      const rightIndicator = item.querySelector(".hover-indicator.right");
      gsap.set([leftIndicator, rightIndicator], {
        width: "0px",
        x: function (i) {
          return i === 0 ? -20 : 20;
        }
      });
    });
  };
  // Function to close all projects
  const closeAllProjects = () => {
    projectItems.forEach((item) => {
      item.classList.remove("active");
    });
    activeProject = null;
    resetTransforms();
  };
  // Set initial states for images
  gsap.set(".image-wrapper img", {
    clipPath: "inset(100% 0 0 0)"
  });
  // Function to toggle project with debounce
  const toggleProject = (project) => {
    // If clicking is not allowed (debounce), return
    if (!isClickAllowed) return;
    // Set clicking to not allowed
    isClickAllowed = false;
    // Allow clicking again after delay
    setTimeout(() => {
      isClickAllowed = true;
    }, 500); // 500ms debounce
    // If clicking the active project, close it
    if (activeProject === project) {
      // Hide content first
      const image = project.querySelector(".image-wrapper img");
      const leftDetails = project.querySelectorAll(".project-details .line");
      const rightDetails = project.querySelectorAll(".project-details .line");
      const title = project.querySelector(".project-title");
      const content = project.querySelector(".project-content");
      // Animate letter spacing back to normal
      gsap.to(title, {
        letterSpacing: "-0.02em",
        duration: 0.3,
        ease: "projectCollapse"
      });
      // Animate image out with clip-path - faster with linear easing
      gsap.to(image, {
        clipPath: "inset(100% 0 0 0)",
        duration: 0.2, // Faster animation
        ease: "none" // Linear easing
      });
      gsap.to([...leftDetails, ...rightDetails], {
        y: "100%",
        opacity: 0,
        duration: 0.3,
        stagger: 0.03, // Faster stagger
        ease: "projectCollapse"
      });
      gsap.to(content, {
        maxHeight: 0,
        opacity: 0,
        margin: 0,
        duration: 0.3,
        ease: "projectCollapse"
      });
      // After animation, remove active class
      setTimeout(() => {
        project.classList.remove("active");
        activeProject = null;
        resetTransforms();
        // Reset spacing when no project is active
        gsap.to(".project-item", {
          marginBottom: "1.5rem",
          duration: 0.4,
          ease: "projectExpand",
          stagger: 0.02
        });
      }, 300);
    } else {
      // Close all projects first
      if (activeProject) {
        // Hide content of previously active project
        const prevImage = activeProject.querySelector(".image-wrapper img");
        const prevLeftDetails = activeProject.querySelectorAll(
          ".project-details .line"
        );
        const prevRightDetails = activeProject.querySelectorAll(
          ".project-details .line"
        );
        const prevTitle = activeProject.querySelector(".project-title");
        const prevContent = activeProject.querySelector(".project-content");
        // Animate letter spacing back to normal
        gsap.to(prevTitle, {
          letterSpacing: "-0.02em",
          duration: 0.25,
          ease: "projectCollapse"
        });
        // Animate image out with clip-path - faster with linear easing
        gsap.to(prevImage, {
          clipPath: "inset(100% 0 0 0)",
          duration: 0.2, // Faster animation
          ease: "none" // Linear easing
        });
        gsap.to([...prevLeftDetails, ...prevRightDetails], {
          y: "100%",
          opacity: 0,
          duration: 0.25,
          stagger: 0.02,
          ease: "projectCollapse"
        });
        gsap.to(prevContent, {
          maxHeight: 0,
          opacity: 0,
          margin: 0,
          duration: 0.25,
          ease: "projectCollapse"
        });
        // After animation, remove active class
        setTimeout(() => {
          closeAllProjects();
          openProject();
        }, 250);
      } else {
        openProject();
      }

      function openProject() {
        // Hide any visible hover indicators
        document.querySelectorAll(".hover-indicator").forEach((indicator) => {
          gsap.killTweensOf(indicator);
          gsap.set(indicator, {
            width: "0px",
            x: indicator.classList.contains("left") ? -20 : 20
          });
        });
        // Open the clicked project
        project.classList.add("active");
        activeProject = project;
        // Apply Star Wars effect with opposite directions
        const activeIndex = Array.from(projectItems).indexOf(project);
        applyStarWarsEffect(activeIndex);
        // Get elements to animate
        const image = project.querySelector(".image-wrapper img");
        const leftDetails = project.querySelectorAll(
          ".project-details.left .line"
        );
        const rightDetails = project.querySelectorAll(
          ".project-details.right .line"
        );
        const title = project.querySelector(".project-title");
        const content = project.querySelector(".project-content");
        // Reset positions before animating
        gsap.set(image, {
          clipPath: "inset(100% 0 0 0)"
        });
        gsap.set([...leftDetails, ...rightDetails], {
          y: "100%",
          opacity: 0
        });
        gsap.set(content, {
          display: "flex",
          maxHeight: 0,
          opacity: 0,
          margin: 0
        });
        // Create timeline for staggered animations
        const tl = gsap.timeline({
          defaults: {
            ease: "textReveal"
          }
        });
        // Animate letter spacing expansion
        tl.to(
          title,
          {
            letterSpacing: "0.01em",
            duration: 0.4,
            ease: "projectExpand"
          },
          0
        );
        // Expand content
        tl.to(
          content,
          {
            maxHeight: 500, // Large enough for most content
            opacity: 1,
            margin: "2rem 0",
            duration: 0.4,
            ease: "projectExpand"
          },
          0
        );
        // Add animations to timeline - faster image reveal with linear easing
        tl.to(
          image,
          {
            clipPath: "inset(0% 0 0 0)",
            duration: 0.3, // Faster animation
            ease: "none" // Linear easing
          },
          0
        );
        // Staggered text reveals
        tl.to(
          leftDetails,
          {
            y: "0%",
            opacity: 1,
            duration: 0.45,
            stagger: 0.05,
            ease: "textReveal"
          },
          "-=0.2"
        );
        tl.to(
          rightDetails,
          {
            y: "0%",
            opacity: 1,
            duration: 0.45,
            stagger: 0.05,
            ease: "textReveal"
          },
          "-=0.4"
        );
        // Adjust spacing for better visibility
        const projectIndex = Array.from(projectItems).indexOf(project);
        // Compress projects above the active one
        if (projectIndex > 0) {
          gsap.to(Array.from(projectItems).slice(0, projectIndex), {
            marginBottom: "0.5rem",
            duration: 0.4,
            ease: "projectCollapse",
            stagger: 0.02
          });
        }
        // Compress projects below the active one
        if (projectIndex < projectItems.length - 1) {
          gsap.to(Array.from(projectItems).slice(projectIndex + 1), {
            marginBottom: "0.5rem",
            duration: 0.4,
            ease: "projectCollapse",
            stagger: 0.02
          });
        }
        // Ensure the active project is visible within the container
        setTimeout(() => {
          const projectsList = document.querySelector(".projects-list");
          const rect = project.getBoundingClientRect();
          const containerRect = projectsList.getBoundingClientRect();
          if (
            rect.top < containerRect.top ||
            rect.bottom > containerRect.bottom
          ) {
            const scrollOffset =
              rect.top -
              containerRect.top -
              containerRect.height / 2 +
              rect.height / 2;
            projectsList.scrollBy({
              top: scrollOffset,
              behavior: "smooth"
            });
          }
        }, 100);
      }
    }
  };
  // Add click event listeners to all project items
  projectItems.forEach((item) => {
    item.addEventListener("click", () => {
      toggleProject(item);
    });
  });
  // Handle window resize
  window.addEventListener("resize", () => {
    // If a project is active, make sure it's still visible
    if (activeProject) {
      const projectsList = document.querySelector(".projects-list");
      const rect = activeProject.getBoundingClientRect();
      const containerRect = projectsList.getBoundingClientRect();
      if (rect.top < containerRect.top || rect.bottom > containerRect.bottom) {
        const scrollOffset =
          rect.top -
          containerRect.top -
          containerRect.height / 2 +
          rect.height / 2;
        projectsList.scrollBy({
          top: scrollOffset,
          behavior: "smooth"
        });
      }
    }
  });
  // Clean up any lingering animations when user tabs away
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      // Reset all hover indicators when page is not visible
      document.querySelectorAll(".hover-indicator").forEach((indicator) => {
        gsap.killTweensOf(indicator);
        gsap.set(indicator, {
          width: "0px",
          x: indicator.classList.contains("left") ? -20 : 20
        });
      });
    }
  });
});