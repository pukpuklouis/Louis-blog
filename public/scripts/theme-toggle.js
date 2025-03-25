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

// Theme management functions - defined once in global scope
const themeManager = {
  getTheme: () => localStorage.getItem("theme"),
  
  setTheme: (theme) => {
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
  },
  
  getSystemTheme: () => window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  
  toggleTheme: () => {
    const currentTheme = themeManager.getTheme();
    if (currentTheme === "system" || !currentTheme) {
      themeManager.setTheme(themeManager.getSystemTheme() === "light" ? "dark" : "light");
    } else {
      themeManager.setTheme(currentTheme === "light" ? "dark" : "light");
    }
  },
  
  // System theme change handler - defined once
  handleSystemThemeChange: (e) => {
    if (themeManager.getTheme() === "system" || !themeManager.getTheme()) {
      themeManager.setTheme(e.matches ? "dark" : "light");
    }
  }
};

// Setup function that runs once
const setupThemeToggle = () => {
  const themeToggle = document.getElementById("themeToggle");
  
  // Only add event listener if element exists and doesn't already have one
  if (themeToggle && !themeToggle.hasAttribute('data-theme-initialized')) {
    // Mark as initialized to avoid duplicate listeners
    themeToggle.setAttribute('data-theme-initialized', 'true');
    themeToggle.addEventListener("click", themeManager.toggleTheme);
    
    // Initialize theme
    const savedTheme = themeManager.getTheme();
    if (savedTheme) {
      themeManager.setTheme(savedTheme);
    } else {
      themeManager.setTheme(themeManager.getSystemTheme());
    }
    
    // Listen for system theme changes - only add once
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", themeManager.handleSystemThemeChange);
  }
};

// Run setup once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupThemeToggle);
} else {
  setupThemeToggle();
}

// Handle Astro page transitions
document.addEventListener("astro:before-swap", () => {
  document.documentElement.style.visibility = 'visible';
  
  const theme = localStorage.getItem("theme") || 
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.classList.toggle("dark", theme === "dark");
});

// Special handling for Partytown - only needed when Partytown is present
if (typeof partytown !== 'undefined') {
  window.addEventListener('themeChange', (e) => {
    localStorage.setItem("theme", e.detail.theme);
  });
}
