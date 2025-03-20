// Theme toggle functionality for Astro sites with Partytown support

// Apply theme immediately before any rendering to prevent flashing
(function() {
  const theme = localStorage.getItem("theme") || 
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.classList.toggle("dark", theme === "dark");
})();

const setupThemeToggle = () => {
  const themeToggle = document.getElementById("themeToggle");
  
  // Theme management functions
  const getTheme = () => localStorage.getItem("theme");
  const setTheme = (theme) => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
    
    // Dispatch custom event for Partytown to capture theme changes
    window.dispatchEvent(new CustomEvent('themeChange', { 
      detail: { theme },
      bubbles: true 
    }));
  };

  const getSystemTheme = () => window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

  // Set initial theme
  const initTheme = () => {
    const savedTheme = getTheme();
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme(getSystemTheme());
    }
  };

  const toggleTheme = () => {
    const currentTheme = getTheme();
    if (currentTheme === "system" || !currentTheme) {
      setTheme(getSystemTheme() === "light" ? "dark" : "light");
    } else {
      setTheme(currentTheme === "light" ? "dark" : "light");
    }
  };

  // Clean up old event listeners if they exist
  if (themeToggle) {
    const newToggle = themeToggle.cloneNode(true);
    themeToggle.parentNode.replaceChild(newToggle, themeToggle);
    newToggle.addEventListener("click", toggleTheme);
  }

  // Initialize theme
  initTheme();

  // Listen for system theme changes
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  
  // Remove existing listeners to avoid duplicates
  try {
    // Store handler reference in window to maintain reference across page transitions
    if (!window._themeMediaQueryHandler) {
      window._themeMediaQueryHandler = function mediaQueryHandler(e) {
        if (getTheme() === "system" || !getTheme()) {
          setTheme(e.matches ? "dark" : "light");
        }
      };
    }
    
    mediaQuery.removeEventListener("change", window._themeMediaQueryHandler);
    mediaQuery.addEventListener("change", window._themeMediaQueryHandler);
  } catch (e) {
    console.error("Error setting up theme media query:", e);
  }
};

// Run setup immediately
setupThemeToggle();

// Handle Astro page transitions
// Use before-swap to set theme before the new page content is visible
document.addEventListener("astro:before-swap", () => {
  const theme = localStorage.getItem("theme") || 
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  // Apply theme to the incoming page before it's visible
  document.documentElement.classList.toggle("dark", theme === "dark");
});

// Still run the full setup after page load to ensure everything is properly initialized
// document.addEventListener("astro:page-load", setupThemeToggle);
// document.addEventListener("astro:after-swap", setupThemeToggle);

// Special handling for Partytown to ensure state is maintained
if (window.partytown) {
  // Listen for theme changes from main thread
  window.addEventListener('themeChange', (e) => {
    // This helps Partytown maintain theme state
    localStorage.setItem("theme", e.detail.theme);
  });
}
