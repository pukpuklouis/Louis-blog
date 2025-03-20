// Apply theme immediately before any rendering to prevent flashing
(function() {
  const theme = localStorage.getItem("theme") || 
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.classList.toggle("dark", theme === "dark");
  
  // Ensure body class is also set for components that rely on it
  if (document.body) {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme === "dark" ? "dark" : "light");
  }
})();

const setupThemeToggle = () => {
  const themeToggle = document.getElementById("themeToggle");
  
  // Theme management functions
  const getTheme = () => localStorage.getItem("theme");
  const setTheme = (theme) => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
    
    // Also set body class for components that rely on it
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme === "dark" ? "dark" : "light");
    
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
  // Ensure content visibility during transition
  document.documentElement.style.visibility = 'visible';
  
  const theme = localStorage.getItem("theme") || 
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  // Apply theme to the incoming page before it's visible
  document.documentElement.classList.toggle("dark", theme === "dark");
});

// Special handling for Partytown to ensure state is maintained
if (typeof partytown !== 'undefined') {
  // Listen for theme changes from main thread
  window.addEventListener('themeChange', (e) => {
    // This helps Partytown maintain theme state
    localStorage.setItem("theme", e.detail.theme);
  });
}
