document.addEventListener("DOMContentLoaded", () => {
  // Image paths
  const imagePaths = [
    "https://cdn.cosmos.so/7f1c4fd4-f8b1-437b-b484-0cdb44baa083.jpeg",
    "https://cdn.cosmos.so/c83887ee-d31e-474c-ba72-bccedb2edc90.jpeg",
    "https://cdn.cosmos.so/d0efc5e4-3fe7-4e3e-af41-2c854ac10fd5.jpeg",
    "https://cdn.cosmos.so/2df114df-c7b0-4e9f-bbb7-42c4bba6b14a.jpeg",
    "https://cdn.cosmos.so/63667b31-c5c5-47ad-8f2f-ec10ffb1ad06.jpeg",
    "https://cdn.cosmos.so/56fb73a1-a0c3-4570-b0c5-1bf2f9d45389.jpeg",
    "https://cdn.cosmos.so/9051426a-3a29-4470-a2db-96cce0fa555f.jpeg",
    "https://cdn.cosmos.so/9adbafa0-79b1-4414-b82e-f0ea7589f5cb.jpeg"
  ];

  // Elements
  const container = document.querySelector(".container");
  const gallery = document.querySelector(".gallery");
  const centeredText = document.querySelector(".centered-text");

  // Add glow element if it doesn't exist
  let glow = document.querySelector(".glow");
  if (!glow) {
    glow = document.createElement("div");
    glow.className = "glow";
    container.appendChild(glow);
  }

  // Create gallery items
  imagePaths.forEach((path, index) => {
    const item = document.createElement("div");
    item.className = "item";

    const img = document.createElement("img");
    img.src = path;
    img.alt = `Nature Image ${index + 1}`;

    item.appendChild(img);
    gallery.appendChild(item);
  });

  // Animation setup
  const items = document.querySelectorAll(".item");
  const numberOfItems = items.length;
  const angleIncrement = (2 * Math.PI) / numberOfItems;

  // Calculate responsive radius based on viewport - ensure proper centering
  const calculateRadius = () => {
    // Adjust radius based on viewport size
    const viewportSize = Math.min(window.innerWidth, window.innerHeight);
    if (viewportSize < 768) {
      return viewportSize * 0.38; // Slightly smaller for mobile
    }
    return viewportSize * 0.42; // Larger for desktop to match image
  };

  let radius = calculateRadius();

  // Get center position - ensure exact center of viewport
  const getCenter = () => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  });

  let center = getCenter();

  // Position items initially at center (hidden)
  items.forEach((item) => {
    gsap.set(item, {
      left: center.x,
      top: center.y,
      scale: 0,
      opacity: 0
    });
  });

  // Create timeline for animations
  const tl = gsap.timeline();

  // Add initial text animation
  tl.from(centeredText, {
    y: 50,
    opacity: 0,
    duration: 1.2,
    ease: "power3.out"
  });

  // Animate items to their circle positions one by one with precise centering
  items.forEach((item, index) => {
    const angle = index * angleIncrement;
    // Adjust starting angle by offsetting to match the image
    const adjustedAngle = angle + Math.PI / 8; // Offset by a small amount to match image positioning
    const initialRotation = adjustedAngle * (180 / Math.PI) + 90; // Face center
    const x = center.x + radius * Math.cos(adjustedAngle);
    const y = center.y + radius * Math.sin(adjustedAngle);

    // Sequence animation - each item flies to its position one after another
    tl.to(
      item,
      {
        left: x,
        top: y,
        scale: 1,
        opacity: 1,
        rotate: initialRotation,
        duration: 1.2,
        ease: "back.out(1.2)"
      },
      `>-0.8` // Slight overlap with previous animation
    );
  });

  // Add rotation animation after all items have arrived
  tl.to(
    gallery,
    {
      rotation: 360,
      transformOrigin: "center center",
      duration: 90, // Slower rotation
      repeat: -1,
      ease: "none"
    },
    ">" // After previous animations
  );

  // Add subtle pulse animation to glow
  gsap.to(glow, {
    scale: 1.1,
    opacity: 0.4,
    duration: 4,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
  });

  // Handle mouse interaction - softened parallax effect
  container.addEventListener("mousemove", (e) => {
    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Reduced movement strength for softer parallax
    const moveX = (clientX - centerX) / (centerX * 2.5);
    const moveY = (clientY - centerY) / (centerY * 2.5);

    // Slow down gallery rotation on hover, but not too much
    gsap.to(gallery, {
      timeScale: 0.4,
      duration: 0.8
    });

    // Move glow effect with reduced movement
    gsap.to(glow, {
      duration: 1.8,
      ease: "power2.out",
      x: `calc(-50% + ${moveX * 60}px)`,
      y: `calc(-50% + ${moveY * 60}px)`,
      opacity: 0.6 + Math.abs(moveX * moveY) * 0.2
    });

    // Subtle text movement - reduced for softer effect
    gsap.to(centeredText, {
      duration: 1.8,
      ease: "power2.out",
      x: moveX * 15,
      y: moveY * 10
    });
  });

  // Reset when mouse leaves
  container.addEventListener("mouseleave", () => {
    // Resume normal rotation speed
    gsap.to(gallery, {
      timeScale: 1,
      duration: 1.5
    });

    // Reset text position with smoother animation
    gsap.to(centeredText, {
      duration: 2,
      ease: "power2.out",
      x: 0,
      y: 0
    });

    // Reset glow
    gsap.to(glow, {
      duration: 2,
      ease: "power2.out",
      x: "-50%",
      y: "-50%",
      opacity: 0.7
    });
  });

  // Handle responsive resize with improved centering
  window.addEventListener("resize", () => {
    // Update center based on viewport, not container
    center = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };

    radius = calculateRadius();

    // Reposition all items
    items.forEach((item, index) => {
      const angle = index * angleIncrement;
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);

      gsap.to(item, {
        left: x,
        top: y,
        duration: 0.8,
        ease: "power2.out"
      });
    });
  });

  // Remove click handlers as requested - images are now just background elements
});