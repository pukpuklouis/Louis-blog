function setupMenu() {
  const menuToggle = document.getElementById("mobile-menu-toggle");
  const mobileNav = document.querySelector(".mobile-nav");
  const menuBars = menuToggle?.querySelectorAll("span");

  if (!menuToggle || !mobileNav) return;

  const toggleMenu = () => {
    mobileNav.classList.toggle("hidden");
    mobileNav.classList.toggle("flex");

    if (menuBars && menuBars.length === 3) {
      if (mobileNav.classList.contains("flex")) {
        menuBars[0].style.transform = "rotate(45deg) translate(5px, 5px)";
        menuBars[1].style.opacity = "0";
        menuBars[2].style.transform = "rotate(-45deg) translate(5px, -5px)";
      } else {
        menuBars[0].style.transform = "none";
        menuBars[1].style.opacity = "1";
        menuBars[2].style.transform = "none";
      }
    }
  };

  menuToggle.addEventListener("click", toggleMenu);

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (
      target instanceof Node &&
      !menuToggle.contains(target) &&
      !mobileNav.contains(target) &&
      mobileNav.classList.contains("flex")
    ) {
      toggleMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 640 && mobileNav.classList.contains("flex")) {
      toggleMenu();
    }
  });
}

// Run setup on initial load
setupMenu();

// Run setup again after each page transition
document.addEventListener("astro:page-load", setupMenu);
