/**
 * Mobile menu toggle script
 * Handles the functionality of the mobile menu button
 */
document.addEventListener("astro:page-load", () => {
  const menuToggle = document.getElementById("mobile-menu-toggle");
  const mobileNav = document.querySelector(".mobile-nav");
  const menuBars = menuToggle?.querySelectorAll("span");

  if (!menuToggle || !mobileNav) return;

  const toggleMenu = () => {
    // Toggle the mobile navigation
    mobileNav.classList.toggle("hidden");
    mobileNav.classList.toggle("flex");

    // Transform the hamburger icon to an X
    if (menuBars && menuBars.length === 3) {
      if (mobileNav.classList.contains("flex")) {
        // Transform to X
        menuBars[0].style.transform = "rotate(45deg) translate(5px, 5px)";
        menuBars[1].style.opacity = "0";
        menuBars[2].style.transform = "rotate(-45deg) translate(5px, -5px)";
      } else {
        // Reset to hamburger
        menuBars[0].style.transform = "rotate(0) translate(0)";
        menuBars[1].style.opacity = "1";
        menuBars[2].style.transform = "rotate(0) translate(0)";
      }
    }
  };

  // Add click event listener to the menu toggle button
  menuToggle.addEventListener("click", toggleMenu);

  // Close the mobile menu when clicking outside
  document.addEventListener("click", (event) => {
    if (
      !menuToggle.contains(event.target) &&
      !mobileNav.contains(event.target) &&
      mobileNav.classList.contains("flex")
    ) {
      toggleMenu();
    }
  });

  // Close the mobile menu when window is resized to desktop size
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 640 && mobileNav.classList.contains("flex")) {
      toggleMenu();
    }
  });
});
