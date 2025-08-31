/**
 * Enhanced Reports Component
 * Updated dengan fitur chat, priority, GPS, dan export
 */
const EnhancedReports = {
  // Extend dari Reports component yang sudah ada
  ...Reports,

  /**
   * Initialize enhanced reports component
   */
  init() {
    // Call parent init
    Reports.init.call(this);

    // Add enhanced features
    this.initEnhancedFeatures();
  },

  /**
   * Initialize enhanced features
   */
  initEnhancedFeatures() {
    this.addPriorityFilter();
    this.addExportButton();
    this.addBulkActions();
    this.addAdvancedSearch();

    // Initialize GPS component
    if (CONFIG.FEATURES.GPS_LOCATION && window.GPS) {
      GPS.init();
    }

    // Initialize Escalation system
    if (CONFIG.FEATURES.AUTO_ESCALATION && window.Escalation) {
      Escalation.init();
      Escalation.addPrioritySelector();
    }
  },

  /**
   * Add priority filter to reports page
   */
  addPriorityFilter() {
    const filtersContainer =
      document.querySelector("#page-reports .filters") ||
      document.querySelector("#page-reports > div:first-child");

    if (!filtersContainer) return;

    // Check if priority filter already exists
    if (document.getElementById("filterPriority")) return;

    const priorityFilter = document.createElement("select");
    priorityFilter.id = "filterPriority";
    priorityFilter.innerHTML = `
      <option value="all">Semua Prioritas</option>
      <option value="urgent">Urgent</option>
      <option value="normal">Normal</option>
      <option value="rendah">Rendah</option>
    `;

    priorityFilter.addEventListener("change", () => {
      this.applyFilters();
    });

    // Insert after status filter
    const statusFilter = document.getElementById("filterStatus");
    if (statusFilter) {
      statusFilter.parentNode.insertBefore(
        priorityFilter,
        statusFilter.nextSibling
      );
    }
  },

  /**
   * Add export button to reports page
   */
  addExportButton() {
    const reportsHeader = document.querySelector("#page-reports h2");
    if (!reportsHeader || document.getElementById("exportReportsBtn")) return;

    const exportBtn = document.createElement("button");
    exportBtn.id = "exportReportsBtn";
    exportBtn.className = "btn ghost";
    exportBtn.innerHTML = '<i class="fa fa-download"></i> Export';
    exportBtn.style.float = "right";
    exportBtn.style.marginTop = "-4px";

    exportBtn.addEventListener("click", () => {
      this.showExportDialog();
    });

    reportsHeader.appendChild(exportBtn);
  },

  /**
   * Add bulk actions for reports
   */
  addBulkActions() {
    const reportsSection = document.getElementById("page-reports");
    if (!reportsSection || document.getElementById("bulkActions")) return;

    const bulkActionsDiv = document.createElement("div");
    bulkActionsDiv.id = "bulkActions";
    bulkActionsDiv.style.display = "none";
    bulkActionsDiv.className = "bulk-actions";
    bulkActionsDiv.innerHTML = `
      <div style="display: flex; gap: 8px; align-items: center; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 12px;">
        <span id="selectedCount">0 dipilih</span>
        <button class="btn ghost" onclick="EnhancedReports.bulkUpdateStatus('proses')">
          Tandai Proses
        </button>
        <button class="btn ghost" onclick="EnhancedReports.bulkUpdateStatus('selesai')">
          Tandai Selesai
        </button>
        <button class="btn ghost" onclick="EnhancedReports.bulkExport()">
          Export Terpilih
        </button>
        <button class="btn ghost" onclick="EnhancedReports.clearSelection()" style="margin-left: auto;">
          Batal
        </button>
      </div>
    `;

    const reportsList = document.getElementById("reportsList");
    if (reportsList) {
      reportsList.parentNode.insertBefore(bulkActionsDiv, reportsList);
    }
  },

  /**
   * Add advanced search features
   */
  addAdvancedSearch() {
    const searchInput = document.getElementById("searchInput");
    if (!searchInput) return;

    // Add search suggestions
    const suggestions = document.createElement("div");
    suggestions.id = "searchSuggestions";
    suggestions.className = "search-suggestions";
    suggestions.style.display = "none";
    searchInput.parentNode.appendChild(suggestions);

    // Enhanced search with debounce
    searchInput.addEventListener(
      "input",
      Utils.debounce((e) => {
        this.handleAdvancedSearch(e.target.value);
      }, 300)
    );
  },

  /**
   * Enhanced report form submission with new features
   */
  async handleReportSubmit() {
    try {
      const formData = await this.getEnhancedReportFormData();
      const validation = this.validateReportData(formData);

      if (!validation.isValid) {
        const errorMsg = Object.values(validation.errors).join("\n");
        Utils.showNotification(errorMsg, "error");
        return;
      }

      // Add report to storage
      const newReport = Storage.addReport(formData);

      // Add initial system message if auto-priority was used
      if (formData.autoDetectedPriority) {
        Storage.addChatMessage({
          reportId: newReport.id,
          sender: "System",
          senderRole: "system",
          message: `Prioritas otomatis diatur ke ${CONFIG.PRIORITY_LABELS[formData.priority]} berdasarkan analisis konten.`,
          timestamp: Date.now(),
        });
      }

      // Clear form and update UI
      this.clearForm();
      this.updateStats();
      this.renderLatest();

      Utils.showNotification("Laporan berhasil dikirim", "success");

      // Navigate to dashboard
      if (window.Navigation) {
        Navigation.navigateTo("dashboard");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      Utils.showNotification(
        "Terjadi kesalahan saat mengirim laporan",
        "error"
      );
    }
  },

  /**
   * Get enhanced report form data with GPS and priority
   */
  async getEnhancedReportFormData() {
    const profile = Storage.getProfile();
    const files = Array.from(this.formElements.files?.files || []);
    const fileDatas = [];

    // Process files
    for (const file of files) {
      try {
        const dataURL = await Utils.fileToDataURL(file);
        fileDatas.push(dataURL);
      } catch (error) {
        console.error("Error processing file:", error);
      }
    }

    // Get GPS coordinates if available
    const gpsCoords = window.GPS ? GPS.getGPSFromForm() : null;

    // Get priority from form or auto-detect
    const priorityEl = document.getElementById("inpPriority");
    let priority = priorityEl?.value || "normal";
    let autoDetectedPriority = false;

    // Auto-detect priority if not manually set
    if (!priorityEl?.value || priority === "normal") {
      const title = this.formElements.title?.value?.trim() || "";
      const description = this.formElements.desc?.value?.trim() || "";

      if (window.Escalation) {
        const detectedPriority = Escalation.autoDetectPriority(
          title,
          description
        );
        if (detectedPriority !== "normal") {
          priority = detectedPriority;
          autoDetectedPriority = true;
        }
      }
    }

    return {
      title: this.formElements.title?.value?.trim() || "",
      name: this.formElements.name?.value?.trim() || profile.name,
      location: this.formElements.location?.value?.trim() || "",
      description: this.formElements.desc?.value?.trim() || "",
      files: fileDatas,
      priority: priority,
      gpsCoordinates: gpsCoords,
      autoDetectedPriority: autoDetectedPriority,
    };
  },

  /**
   * Enhanced report card creation with new features
   */
  createReportCard(report, type = "full") {
    const card = document.createElement("div");
    card.className = "card";

    const isLatest = type === "latest";
    const description = isLatest
      ? Utils.truncateText(report.description, 60)
      : Utils.truncateText(report.description);

    // Priority badge
    const priorityBadge = report.priority
      ? `<span class="priority-badge ${report.priority}" style="background: ${CONFIG.PRIORITY_COLORS[report.priority]}">
        ${CONFIG.PRIORITY_LABELS[report.priority]}
      </span>`
      : "";

    // GPS indicator
    const gpsIndicator = report.gpsCoordinates
      ? '<span class="gps-indicator" title="Lokasi GPS tersedia">📍</span>'
      : "";

    // Unread chat indicator
    const unreadCount = window.Chat ? Chat.getUnreadCount(report.id) : 0;
    const chatIndicator =
      unreadCount > 0
        ? `<span class="chat-indicator" title="${unreadCount} pesan belum dibaca">💬 ${unreadCount}</span>`
        : "";

    card.innerHTML = `
      <div class="card-header">
        <input type="checkbox" class="report-checkbox" data-report-id="${report.id}" 
               onchange="EnhancedReports.handleCheckboxChange()" style="margin-right: 8px;">
        <div class="thumb">${this.renderThumb(report.files)}</div>
        <div class="card-indicators">
          ${priorityBadge}
          ${gpsIndicator}
          ${chatIndicator}
        </div>
      </div>
      <h3>${Utils.escapeHtml(report.title)}</h3>
      <p>${Utils.escapeHtml(description)}</p>
      <div class="meta-row" style="margin-top: 8px;">
        <div class="muted">
          ${Utils.escapeHtml(report.location)} • 
          <small>${new Date(report.createdAt).toLocaleString()}</small>
        </div>
        <div class="badge ${report.status}">${Utils.getStatusLabel(report.status)}</div>
      </div>
      ${!isLatest ? this.renderEnhancedActions(report.id) : ""}
    `;

    // Add click handler for detail view
    card.addEventListener("click", (e) => {
      // Don't open detail if clicking on checkbox or action buttons
      if (
        !e.target.closest(".actions") &&
        !e.target.closest(".report-checkbox")
      ) {
        this.openDetailModal(report.id);
      }
    });

    return card;
  },

  /**
   * Render enhanced action buttons with chat
   */
  renderEnhancedActions(reportId) {
    const unreadCount = window.Chat ? Chat.getUnreadCount(reportId) : 0;
    const chatBadge = unreadCount > 0 ? ` (${unreadCount})` : "";

    return `
      <div class="actions">
        <button class="btn ghost" onclick="EnhancedReports.openDetailModal('${reportId}')">
          <i class="fa fa-eye"></i> Detail
        </button>
        ${
          window.Chat
            ? `
        <button class="btn ghost" onclick="Chat.openChat('${reportId}')">
          <i class="fa fa-comments"></i> Chat${chatBadge}
        </button>
        `
            : ""
        }
        <button class="btn primary" onclick="EnhancedReports.setStatus('${reportId}', 'proses')">
          Proses
        </button>
        <button class="btn ghost" onclick="EnhancedReports.setStatus('${reportId}', 'selesai')">
          Selesai
        </button>
      </div>
    `;
  },

  /**
   * Enhanced filtering with priority and GPS
   */
  getFilteredReports() {
    const status = this.filterElements.status?.value || "all";
    const priority = document.getElementById("filterPriority")?.value || "all";
    const sortBy = this.filterElements.sortBy?.value || "newest";
    const searchQuery = window.Navigation?.getSearchQuery() || "";

    let reports = Storage.getReports({
      status: status,
      sortBy: sortBy,
      search: searchQuery,
    });

    // Apply priority filter
    if (priority !== "all") {
      reports = reports.filter((r) => r.priority === priority);
    }

    return reports;
  },

  /**
   * Handle advanced search with suggestions
   */
  handleAdvancedSearch(query) {
    // Apply regular search first
    this.applyFilters();

    // Show search suggestions
    if (query.length >= 2) {
      this.showSearchSuggestions(query);
    } else {
      this.hideSearchSuggestions();
    }
  },

  /**
   * Show search suggestions
   */
  showSearchSuggestions(query) {
    const suggestions = document.getElementById("searchSuggestions");
    if (!suggestions) return;

    const allReports = Storage.reports;
    const matches = new Set();

    // Find matching locations and titles
    allReports.forEach((report) => {
      if (report.location.toLowerCase().includes(query.toLowerCase())) {
        matches.add(`📍 ${report.location}`);
      }
      if (report.title.toLowerCase().includes(query.toLowerCase())) {
        matches.add(`📝 ${report.title}`);
      }
    });

    const suggestionItems = Array.from(matches)
      .slice(0, 5)
      .map(
        (item) =>
          `<div class="suggestion-item" onclick="EnhancedReports.applySuggestion('${item.substring(2)}')">${item}</div>`
      )
      .join("");

    if (suggestionItems) {
      suggestions.innerHTML = suggestionItems;
      suggestions.style.display = "block";
    } else {
      this.hideSearchSuggestions();
    }
  },

  /**
   * Hide search suggestions
   */
  hideSearchSuggestions() {
    const suggestions = document.getElementById("searchSuggestions");
    if (suggestions) {
      suggestions.style.display = "none";
    }
  },

  /**
   * Apply search suggestion
   */
  applySuggestion(suggestion) {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.value = suggestion;
      this.applyFilters();
      this.hideSearchSuggestions();
    }
  },

  /**
   * Handle checkbox selection changes
   */
  handleCheckboxChange() {
    const checkboxes = document.querySelectorAll(".report-checkbox:checked");
    const count = checkboxes.length;

    const bulkActions = document.getElementById("bulkActions");
    const selectedCount = document.getElementById("selectedCount");

    if (bulkActions && selectedCount) {
      if (count > 0) {
        bulkActions.style.display = "block";
        selectedCount.textContent = `${count} dipilih`;
      } else {
        bulkActions.style.display = "none";
      }
    }
  },

  /**
   * Bulk update status for selected reports
   */
  bulkUpdateStatus(newStatus) {
    const checkboxes = document.querySelectorAll(".report-checkbox:checked");
    const reportIds = Array.from(checkboxes).map((cb) => cb.dataset.reportId);

    if (reportIds.length === 0) {
      Utils.showNotification("Tidak ada laporan yang dipilih", "error");
      return;
    }

    const confirmed = confirm(
      `Ubah status ${reportIds.length} laporan ke ${Utils.getStatusLabel(newStatus)}?`
    );

    if (confirmed) {
      let successCount = 0;
      reportIds.forEach((id) => {
        if (Storage.updateReport(id, { status: newStatus })) {
          successCount++;
        }
      });

      Utils.showNotification(
        `${successCount} laporan berhasil diupdate`,
        "success"
      );
      this.clearSelection();
      this.renderReports();
      this.updateStats();
    }
  },

  /**
   * Bulk export selected reports
   */
  bulkExport() {
    const checkboxes = document.querySelectorAll(".report-checkbox:checked");
    const reportIds = Array.from(checkboxes).map((cb) => cb.dataset.reportId);

    if (reportIds.length === 0) {
      Utils.showNotification("Tidak ada laporan yang dipilih", "error");
      return;
    }

    const selectedReports = reportIds
      .map((id) => Storage.getReport(id))
      .filter((r) => r);

    const exportData = {
      exportDate: new Date().toISOString(),
      exportType: "selected_reports",
      totalReports: selectedReports.length,
      reports: selectedReports.map((report) => ({
        id: report.id,
        title: report.title,
        location: report.location,
        description: report.description,
        status: report.status,
        priority: report.priority,
        gpsCoordinates: report.gpsCoordinates,
        createdAt: new Date(report.createdAt).toISOString(),
        lastUpdatedAt: new Date(report.lastUpdatedAt).toISOString(),
      })),
    };

    Storage.downloadData(
      exportData,
      `selected-reports-${new Date().toISOString().split("T")[0]}`,
      "json"
    );
    Utils.showNotification(
      `${selectedReports.length} laporan berhasil diexport`,
      "success"
    );
  },

  /**
   * Clear selection
   */
  clearSelection() {
    const checkboxes = document.querySelectorAll(".report-checkbox");
    checkboxes.forEach((cb) => (cb.checked = false));
    this.handleCheckboxChange();
  },

  /**
   * Show export dialog
   */
  showExportDialog() {
    const dialogHTML = `
      <div class="export-dialog">
        <h3>📄 Export Laporan</h3>
        
        <div style="margin: 16px 0;">
          <label>Format Export:</label>
          <select id="exportFormat">
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
        </div>

        <div style="margin: 16px 0;">
          <label>Rentang Tanggal:</label>
          <select id="exportDateRange">
            <option value="all">Semua Waktu</option>
            <option value="today">Hari Ini</option>
            <option value="week">7 Hari Terakhir</option>
            <option value="month">30 Hari Terakhir</option>
            <option value="custom">Kustom</option>
          </select>
        </div>

        <div id="customDateRange" style="margin: 16px 0; display: none;">
          <input type="date" id="exportStartDate" style="margin-right: 8px;">
          <input type="date" id="exportEndDate">
        </div>

        <div style="margin: 16px 0;">
          <label>
            <input type="checkbox" id="includeChats" checked>
            Sertakan riwayat chat
          </label>
        </div>

        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px;">
          <button class="btn ghost" onclick="Modal.close()">Batal</button>
          <button class="btn primary" onclick="EnhancedReports.executeExport()">
            Export Data
          </button>
        </div>
      </div>
    `;

    if (window.Modal) {
      Modal.modalContent.innerHTML = dialogHTML;
      Modal.open();

      // Handle date range change
      document
        .getElementById("exportDateRange")
        .addEventListener("change", (e) => {
          const customRange = document.getElementById("customDateRange");
          customRange.style.display =
            e.target.value === "custom" ? "block" : "none";
        });
    }
  },

  /**
   * Execute export based on dialog selections
   */
  executeExport() {
    const format = document.getElementById("exportFormat").value;
    const dateRange = document.getElementById("exportDateRange").value;
    const includeChats = document.getElementById("includeChats").checked;

    let dateFilter = null;
    const now = Date.now();

    switch (dateRange) {
      case "today":
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dateFilter = { start: today.getTime(), end: now };
        break;
      case "week":
        dateFilter = { start: now - 7 * 24 * 60 * 60 * 1000, end: now };
        break;
      case "month":
        dateFilter = { start: now - 30 * 24 * 60 * 60 * 1000, end: now };
        break;
      case "custom":
        const startDate = document.getElementById("exportStartDate").value;
        const endDate = document.getElementById("exportEndDate").value;
        if (startDate && endDate) {
          dateFilter = {
            start: new Date(startDate).getTime(),
            end: new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1,
          };
        }
        break;
    }

    Storage.exportReports(format, dateFilter);

    if (window.Modal) {
      Modal.close();
    }

    Utils.showNotification("Export berhasil diunduh", "success");
  },
};
