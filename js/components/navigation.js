/**
 * Navigation Component
 */
const Navigation = {
  // DOM Elements
  pages: {},
  menuButtons: null,
  navButtons: {},
  searchInput: null,
  fab: null,

  /**
   * Initialize navigation
   */
  init() {
    this.cacheDOMElements();
    this.bindEvents();
    this.showPage("dashboard");
  },

  /**
   * Cache DOM elements
   */
  cacheDOMElements() {
    // Pages
    this.pages = {
      dashboard: document.getElementById("page-dashboard"),
      form: document.getElementById("page-form"),
      reports: document.getElementById("page-reports"),
      ratingPage: document.getElementById("page-ratingPage"),
      profile: document.getElementById("page-profile"),
    };

    // Menu buttons
    this.menuButtons = document.querySelectorAll(".menu button");

    // Top navigation buttons
    this.navButtons = {
      btnDashboard: document.getElementById("btnDashboard"),
      btnReports: document.getElementById("btnReports"),
      btnRating: document.getElementById("btnRating"),
      btnProfile: document.getElementById("btnProfile"),
    };

    // Other elements
    this.searchInput = document.getElementById("searchInput");
    this.fab = document.getElementById("fab");
  },

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Menu buttons
    this.menuButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const page = btn.dataset.page;
        this.showPage(page);
      });
    });

    // Top navigation buttons
    this.navButtons.btnDashboard.addEventListener("click", (e) => {
      e.preventDefault();
      this.showPage("dashboard");
    });

    this.navButtons.btnReports.addEventListener("click", (e) => {
      e.preventDefault();
      this.showPage("reports");
    });

    this.navButtons.btnRating.addEventListener("click", (e) => {
      e.preventDefault();
      this.showPage("ratingPage");
    });

    this.navButtons.btnProfile.addEventListener("click", (e) => {
      e.preventDefault();
      this.showPage("profile");
    });

    // Floating action button
    this.fab.addEventListener("click", (e) => {
      e.preventDefault();
      this.showPage("form");
    });

    // Search with debouncing
    this.searchInput.addEventListener(
      "input",
      Utils.debounce((e) => {
        const query = e.target.value.trim();
        this.onSearch(query);
      }, 300)
    );
  },

  /**
   * Show specific page
   * @param {string} pageName - Page to show
   */
  showPage(pageName) {
    // Hide all pages
    Object.keys(this.pages).forEach((pageKey) => {
      const page = this.pages[pageKey];
      if (page) {
        page.style.display = pageKey === pageName ? "block" : "none";
      }
    });

    // Update menu button states
    this.updateMenuButtons(pageName);

    // Update top navigation states
    this.updateNavButtons(pageName);

    // Trigger page-specific actions
    this.onPageShow(pageName);
  },

  /**
   * Update menu button active states
   * @param {string} activePage - Active page name
   */
  updateMenuButtons(activePage) {
    this.menuButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.page === activePage);
    });
  },

  /**
   * Update top navigation button states
   * @param {string} activePage - Active page name
   */
  updateNavButtons(activePage) {
    Object.keys(this.navButtons).forEach((buttonKey) => {
      const btn = this.navButtons[buttonKey];
      if (btn) {
        // Simple mapping based on button names
        const isActive =
          (buttonKey.includes("Dashboard") && activePage === "dashboard") ||
          (buttonKey.includes("Reports") && activePage === "reports") ||
          (buttonKey.includes("Rating") && activePage === "ratingPage") ||
          (buttonKey.includes("Profile") && activePage === "profile");

        btn.style.opacity = isActive ? "1" : "0.7";
      }
    });
  },

  /**
   * Handle page show events
   * @param {string} pageName - Page name that was shown
   */
  onPageShow(pageName) {
    switch (pageName) {
      case "dashboard":
        if (window.Reports) {
          Reports.renderLatest();
        }
        break;

      case "reports":
        if (window.Reports) {
          Reports.renderReports();
        }
        break;

      case "ratingPage":
        if (window.Rating) {
          Rating.renderRatingOverview();
        }
        break;

      case "profile":
        if (window.Profile) {
          Profile.fillProfileForm();
        }
        break;

      case "form":
        if (window.Reports) {
          Reports.clearForm();
        }
        break;
    }
  },

  /**
   * Handle search input
   * @param {string} query - Search query
   */
  onSearch(query) {
    // Only trigger search if we're on the reports page
    const currentPage = this.getCurrentPage();
    if (currentPage === "reports" && window.Reports) {
      Reports.applyFilters();
    }
  },

  /**
   * Get currently active page
   * @returns {string} Current page name
   */
  getCurrentPage() {
    for (const [pageName, pageElement] of Object.entries(this.pages)) {
      if (pageElement && pageElement.style.display !== "none") {
        return pageName;
      }
    }
    return "dashboard"; // fallback
  },

  /**
   * Navigate to specific page programmatically
   * @param {string} pageName - Page to navigate to
   */
  navigateTo(pageName) {
    if (this.pages[pageName]) {
      this.showPage(pageName);
    } else {
      console.warn(`Page "${pageName}" not found`);
    }
  },

  /**
   * Get search query
   * @returns {string} Current search query
   */
  getSearchQuery() {
    return this.searchInput ? this.searchInput.value.trim() : "";
  },

  /**
   * Clear search query
   */
  clearSearch() {
    if (this.searchInput) {
      this.searchInput.value = "";
    }
  },
};
