document.addEventListener("DOMContentLoaded", () => {
  // Register GSAP plugins
  gsap.registerPlugin(CustomEase);

  // Create custom eases
  CustomEase.create("projectExpand", "0.42, 0, 1, 1"); // ease-in then linear
  CustomEase.create("projectCollapse", "0, 0, 0.58, 1"); // ease-out then linear
  CustomEase.create("textReveal", "0.25, 1, 0.5, 1");
  CustomEase.create("squareStretch", "0.22, 1, 0.36, 1");

  const projectItems = document.querySelectorAll(".project-item");
  let activeProject = null;
  let isClickAllowed = true;

  // Set initial invisibility of all project items for staggered reveal
  gsap.set(projectItems, {
    opacity: 0,
    y: 20,
    scale: 0.97
  });

  // Add staggered entrance animation on page load
  const entranceTl = gsap.timeline({
    defaults: {
      ease: "power1.out"
    }
  });

  entranceTl.to(projectItems, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.35,
    stagger: 0.04,
    clearProps: "opacity,y,scale",
    onComplete: function () {
      // Ensure all items are fully visible after animation completes
      gsap.set(projectItems, {
        clearProps: "all"
      });
    }
  });

  // Initialize text splitting
  projectItems.forEach((project) => {
    const detailElements = project.querySelectorAll(".project-details p");
    detailElements.forEach((element) => {
      // Create a simple text splitting approach that works without SplitType
      const originalText = element.innerText;
      element.innerHTML = "";
      const lineWrapper = document.createElement("div");
      lineWrapper.className = "line-wrapper";
      lineWrapper.style.overflow = "hidden"; // Added overflow hidden for cleaner text animations
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

    // Set up hover indicators
    const titleContainer = project.querySelector(".project-title-container");
    const leftIndicator = project.querySelector(".hover-indicator.left");
    const rightIndicator = project.querySelector(".hover-indicator.right");

    // Set initial sizes
    gsap.set(leftIndicator, {
      width: "0px",
      height: "8px",
      opacity: 0,
      x: -10,
      zIndex: 20,
      background: "#f0ede8"
    });

    gsap.set(rightIndicator, {
      width: "0px",
      height: "8px",
      opacity: 0,
      x: 10,
      zIndex: 20,
      background: "#f0ede8"
    });

    // Add hover event listeners
    titleContainer.addEventListener("mouseenter", () => {
      // Only show hover effect on non-active projects
      if (project !== activeProject) {
        gsap.killTweensOf([leftIndicator, rightIndicator]);

        // Reset any previous animations
        gsap.set([leftIndicator, rightIndicator], {
          clearProps: "all",
          opacity: 0,
          width: "0px",
          height: "8px",
          x: function (i) {
            return i === 0 ? -10 : 10;
          }
        });

        // Left square animation - stretch then contract
        const leftTl = gsap.timeline();
        leftTl
          .set(leftIndicator, {
            opacity: 1,
            width: "0px"
          })
          .to(leftIndicator, {
            x: 0,
            width: "12px",
            duration: 0.15,
            ease: "power2.out"
          })
          .to(leftIndicator, {
            width: "8px",
            duration: 0.1,
            ease: "squareStretch"
          });

        // Right square animation - delayed, stretch then contract
        const rightTl = gsap.timeline({
          delay: 0.06
        });
        rightTl
          .set(rightIndicator, {
            opacity: 1,
            width: "0px"
          })
          .to(rightIndicator, {
            x: 0,
            width: "12px",
            duration: 0.15,
            ease: "power2.out"
          })
          .to(rightIndicator, {
            width: "8px",
            duration: 0.1,
            ease: "squareStretch"
          });
      }
    });

    titleContainer.addEventListener("mouseleave", () => {
      // Only animate out for non-active projects
      if (project !== activeProject) {
        gsap.killTweensOf([leftIndicator, rightIndicator]);

        // Reverse animation for left square
        const leftTl = gsap.timeline();
        leftTl
          .to(leftIndicator, {
            width: "12px",
            duration: 0.1,
            ease: "power1.in"
          })
          .to(leftIndicator, {
            width: "0px",
            x: -10,
            opacity: 0,
            duration: 0.15,
            ease: "power2.in"
          });

        // Reverse animation for right square (delayed)
        const rightTl = gsap.timeline({
          delay: 0.03
        });
        rightTl
          .to(rightIndicator, {
            width: "12px",
            duration: 0.1,
            ease: "power1.in"
          })
          .to(rightIndicator, {
            width: "0px",
            x: 10,
            opacity: 0,
            duration: 0.15,
            ease: "power2.in"
          });
      }
    });
  });

  // Function to apply scaling to projects with gradual opacity and blur
  const applyScaling = (activeIndex) => {
    projectItems.forEach((item, index) => {
      const titleContainer = item.querySelector(".project-title-container");
      const distance = Math.abs(index - activeIndex);

      if (index === activeIndex) {
        // Active project
        gsap.to(titleContainer, {
          scale: 1,
          opacity: 1,
          filter: "blur(0px)",
          y: 0,
          duration: 0.3,
          ease: "projectExpand"
        });
      } else if (distance === 1) {
        // Distance 1 projects
        gsap.to(titleContainer, {
          scale: 0.95,
          opacity: 0.7,
          filter: "blur(1px)",
          y: 0,
          duration: 0.3,
          ease: "projectExpand"
        });
      } else if (distance === 2) {
        // Distance 2 projects
        gsap.to(titleContainer, {
          scale: 0.9,
          opacity: 0.5,
          filter: "blur(2px)",
          y: 0,
          duration: 0.3,
          ease: "projectExpand"
        });
      } else {
        // Distance 3+ projects
        gsap.to(titleContainer, {
          scale: 0.85,
          opacity: 0.3,
          filter: "blur(4px)",
          y: 0,
          duration: 0.3,
          ease: "projectExpand"
        });
      }
    });
  };

  // Function to reset all scaling
  const resetScaling = () => {
    projectItems.forEach((item) => {
      const titleContainer = item.querySelector(".project-title-container");
      gsap.to(titleContainer, {
        scale: 1,
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        duration: 0.3,
        ease: "projectCollapse"
      });
    });
  };

  // Set initial states for images
  gsap.set(".image-wrapper img", {
    clipPath: "inset(100% 0 0 0)"
  });

  // Function to toggle project expansion
  const toggleProject = (project) => {
    // Debounce clicks
    if (!isClickAllowed) return;
    isClickAllowed = false;
    setTimeout(() => {
      isClickAllowed = true;
    }, 300);

    // If clicking the active project, close it
    if (activeProject === project) {
      const content = project.querySelector(".project-content");
      const image = project.querySelector(".image-wrapper img");
      const details = project.querySelectorAll(".project-details .line");
      const title = project.querySelector(".project-title");

      // Close animation with ease-out then linear for letter spacing
      gsap.to(title, {
        fontSize: "3rem",
        letterSpacing: "-0.02em",
        duration: 0.2,
        ease: "projectCollapse"
      });

      gsap.to(image, {
        clipPath: "inset(100% 0 0 0)",
        duration: 0.15,
        ease: "none"
      });

      // SLOWER ANIMATION for project details when closing
      gsap.to(details, {
        y: "100%",
        opacity: 0,
        duration: 0.5, // Increased from 0.15 to 0.5 for slower animation
        stagger: 0.05, // Increased from 0.015 to 0.05 for slower staggered effect
        ease: "projectCollapse"
      });

      gsap.to(content, {
        maxHeight: 0,
        opacity: 0,
        margin: 0,
        duration: 0.2,
        ease: "projectCollapse",
        onComplete: () => {
          // After animation completes
          activeProject = null;
          resetScaling();
          // Reset spacing
          gsap.to(projectItems, {
            marginBottom: "1.5rem",
            duration: 0.3,
            ease: "projectExpand",
            stagger: 0.02
          });
        }
      });
    } else {
      // Close active project if exists
      if (activeProject) {
        const oldContent = activeProject.querySelector(".project-content");
        const oldImage = activeProject.querySelector(".image-wrapper img");
        const oldDetails = activeProject.querySelectorAll(
          ".project-details .line"
        );
        const oldTitle = activeProject.querySelector(".project-title");

        // Close previous project
        gsap.to(oldTitle, {
          fontSize: "3rem",
          letterSpacing: "-0.02em",
          duration: 0.2,
          ease: "projectCollapse"
        });

        gsap.to(oldImage, {
          clipPath: "inset(100% 0 0 0)",
          duration: 0.15,
          ease: "none"
        });

        // SLOWER ANIMATION for project details when closing previous project
        gsap.to(oldDetails, {
          y: "100%",
          opacity: 0,
          duration: 0.5, // Increased from 0.15 to 0.5 for slower animation
          stagger: 0.05, // Increased from 0.015 to 0.05 for slower staggered effect
          ease: "projectCollapse"
        });

        gsap.to(oldContent, {
          maxHeight: 0,
          opacity: 0,
          margin: 0,
          duration: 0.2,
          ease: "projectCollapse",
          onComplete: () => openNewProject()
        });
      } else {
        openNewProject();
      }

      function openNewProject() {
        // Open new project
        activeProject = project;

        // Apply scaling with blur
        const activeIndex = Array.from(projectItems).indexOf(project);
        applyScaling(activeIndex);

        // Get elements to animate
        const content = project.querySelector(".project-content");
        const image = project.querySelector(".image-wrapper img");
        const details = project.querySelectorAll(".project-details .line");
        const title = project.querySelector(".project-title");

        // Pre-render content to get accurate height
        gsap.set(content, {
          display: "flex",
          autoAlpha: 0,
          height: "auto",
          maxHeight: "none",
          overflow: "hidden"
        });

        // Get accurate measurement
        const contentHeight = content.offsetHeight;

        // Reset for animation
        gsap.set(content, {
          maxHeight: 0,
          height: "auto",
          autoAlpha: 0,
          overflow: "hidden"
        });

        // Create a timeline for synchronized animations
        const tl = gsap.timeline({
          defaults: {
            ease: "projectExpand"
          }
        });

        // Animate opening with ease-in then linear for letter spacing
        tl.to(
          title,
          {
            fontSize: window.innerWidth > 768 ? "3.5rem" : "2.5rem",
            letterSpacing: "0.01em",
            duration: 0.35,
            ease: "projectExpand"
          },
          0
        );

        tl.to(
          content,
          {
            maxHeight: contentHeight,
            autoAlpha: 1,
            margin: "2rem 0",
            duration: 0.4,
            pointerEvents: "auto"
          },
          0
        );

        tl.to(
          image,
          {
            clipPath: "inset(0% 0 0 0)",
            duration: 0.35,
            ease: "power2.out"
          },
          0.05
        );

        // SLOWER ANIMATION for project details when opening
        tl.to(
          details,
          {
            y: "0%",
            opacity: 1,
            duration: 0.8, // Increased from 0.3 to 0.8 for slower animation
            stagger: 0.08, // Increased from 0.025 to 0.08 for slower staggered effect
            ease: "textReveal"
          },
          0.2 // Slightly delayed start for better sequencing
        );

        // Adjust spacing for better visibility
        if (activeIndex > 0) {
          gsap.to(Array.from(projectItems).slice(0, activeIndex), {
            marginBottom: "0.5rem",
            duration: 0.3,
            ease: "projectCollapse",
            stagger: 0.02
          });
        }

        if (activeIndex < projectItems.length - 1) {
          gsap.to(Array.from(projectItems).slice(activeIndex + 1), {
            marginBottom: "0.5rem",
            duration: 0.3,
            ease: "projectCollapse",
            stagger: 0.02
          });
        }

        // Ensure visible in viewport
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
        }, 50);
      }
    }
  };

  // Add click event listeners
  projectItems.forEach((item) => {
    item.addEventListener("click", () => {
      toggleProject(item);
    });
  });

  // Handle window resize
  window.addEventListener("resize", () => {
    if (activeProject) {
      // Update content height on resize
      const content = activeProject.querySelector(".project-content");

      // Update title font size
      const title = activeProject.querySelector(".project-title");
      gsap.to(title, {
        fontSize: window.innerWidth > 768 ? "3.5rem" : "2.5rem",
        duration: 0.2
      });

      // Re-measure content height
      const currentHeight = parseFloat(getComputedStyle(content).height);
      gsap.set(content, {
        maxHeight: "none"
      });
      const autoHeight = content.offsetHeight;

      // If height changed, animate to new height
      if (Math.abs(currentHeight - autoHeight) > 1) {
        gsap.set(content, {
          maxHeight: currentHeight
        });
        gsap.to(content, {
          maxHeight: autoHeight,
          duration: 0.2
        });
      } else {
        gsap.set(content, {
          maxHeight: currentHeight
        });
      }
    }
  });
});