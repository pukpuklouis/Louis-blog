// Apply theme immediately to prevent flashing
(function () {
    const theme = localStorage.getItem("theme");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initialTheme = theme || systemTheme;
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  })();
  
  // Theme management object
  const themeManager = {
    getTheme: () => localStorage.getItem("theme"),
  
    setTheme: (theme) => {
      document.documentElement.classList.toggle("dark", theme === "dark");
      localStorage.setItem("theme", theme);
      window.dispatchEvent(new CustomEvent("themeChange", { detail: { theme }, bubbles: true }));
    },
  
    toggleTheme: () => {
      const currentTheme = themeManager.getTheme();
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      themeManager.setTheme(newTheme);
    },
  
    handleSystemThemeChange: (e) => {
      if (!localStorage.getItem("theme")) {
        const systemTheme = e.matches ? "dark" : "light";
        document.documentElement.classList.toggle("dark", systemTheme === "dark");
      }
    },
  };
  
  // Setup theme toggle button
  const setupThemeToggle = () => {
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle && !themeToggle.hasAttribute("data-theme-initialized")) {
      themeToggle.setAttribute("data-theme-initialized", "true");
      themeToggle.addEventListener("click", themeManager.toggleTheme);
  
      // Listen for system theme changes
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", themeManager.handleSystemThemeChange);
    }
  };
  
  // Run setup when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupThemeToggle);
  } else {
    setupThemeToggle();
  }
  
  // Handle Astro page transitions
  document.addEventListener("astro:before-swap", () => {
    document.documentElement.style.visibility = "visible";
    const theme = localStorage.getItem("theme") || 
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
  });