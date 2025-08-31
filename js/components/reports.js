/**
 * Reports Component - Clean Version
 */
const Reports = {
  // DOM Elements
  latestCards: null,
  reportsList: null,
  reportForm: null,
  filePreview: null,
  statsElements: {},
  filterElements: {},
  formElements: {},

  /**
   * Initialize reports component
   */
  init() {
    this.cacheDOMElements();
    this.bindEvents();
    this.updateStats();
    this.addPriorityFeature();
    this.addPDFExportFeature();
  },

  /**
   * Cache DOM elements
   */
  cacheDOMElements() {
    this.latestCards = document.getElementById("latestCards");
    this.reportsList = document.getElementById("reportsList");
    this.reportForm = document.getElementById("reportForm");
    this.filePreview = document.getElementById("filePreview");

    // Statistics elements
    this.statsElements = {
      total: document.getElementById("statTotal"),
      open: document.getElementById("statOpen"),
      resolved: document.getElementById("statResolved"),
    };

    // Filter elements
    this.filterElements = {
      status: document.getElementById("filterStatus"),
      sortBy: document.getElementById("sortBy"),
    };

    // Form elements
    this.formElements = {
      name: document.getElementById("inpName"),
      location: document.getElementById("inpLocation"),
      title: document.getElementById("inpTitle"),
      desc: document.getElementById("inpDesc"),
      files: document.getElementById("inpFiles"),
      clearBtn: document.getElementById("clearForm"),
    };
  },

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Report form submission
    if (this.reportForm) {
      this.reportForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleReportSubmit();
      });
    }

    // Clear form button
    if (this.formElements.clearBtn) {
      this.formElements.clearBtn.addEventListener("click", () => {
        this.clearForm();
      });
    }

    // File input change
    if (this.formElements.files) {
      this.formElements.files.addEventListener("change", (e) => {
        this.handleFileChange(e);
      });
    }

    // Filter changes
    if (this.filterElements.status) {
      this.filterElements.status.addEventListener("change", () => {
        this.applyFilters();
      });
    }

    if (this.filterElements.sortBy) {
      this.filterElements.sortBy.addEventListener("change", () => {
        this.applyFilters();
      });
    }
  },

  /**
   * Handle report form submission
   */
  async handleReportSubmit() {
    try {
      const formData = await this.getReportFormData();

      // Add priority to form data
      const priorityEl = document.getElementById("inpPriority");
      if (priorityEl) {
        formData.priority = priorityEl.value;
      }

      const validation = this.validateReportData(formData);
      if (!validation.isValid) {
        const errorMsg = Object.values(validation.errors).join("\n");
        Utils.showNotification(errorMsg, "error");
        return;
      }

      Storage.addReport(formData);
      this.clearForm();
      this.updateStats();
      this.renderLatest();

      Utils.showNotification("Laporan berhasil dikirim", "success");
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
   * Get report form data
   */
  async getReportFormData() {
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
    const gpsLat = document.getElementById("inpLocation")?.dataset?.gpsLat;
    const gpsLng = document.getElementById("inpLocation")?.dataset?.gpsLng;
    let gpsCoordinates = null;

    if (gpsLat && gpsLng) {
      gpsCoordinates = {
        lat: parseFloat(gpsLat),
        lng: parseFloat(gpsLng),
      };
    }

    return {
      title: this.formElements.title?.value?.trim() || "",
      name: this.formElements.name?.value?.trim() || profile.name,
      location: this.formElements.location?.value?.trim() || "",
      description: this.formElements.desc?.value?.trim() || "",
      files: fileDatas,
      gpsCoordinates: gpsCoordinates,
    };
  },

  /**
   * Validate report data
   */
  validateReportData(data) {
    const rules = {
      title: {
        required: true,
        minLength: 5,
        maxLength: 100,
        label: "Judul",
      },
      location: {
        required: true,
        minLength: 5,
        maxLength: 100,
        label: "Lokasi",
      },
      description: {
        required: true,
        minLength: 10,
        maxLength: 1000,
        label: "Deskripsi",
      },
      name: {
        required: true,
        minLength: 2,
        maxLength: 50,
        label: "Nama",
      },
    };

    return Utils.validateForm(data, rules);
  },

  /**
   * Handle file input change
   */
  async handleFileChange(event) {
    if (!this.filePreview) return;

    this.filePreview.innerHTML = "";
    const files = Array.from(event.target.files);

    for (const file of files) {
      try {
        if (!this.validateFile(file)) continue;

        const dataURL = await Utils.fileToDataURL(file);
        const img = document.createElement("img");
        img.className = "thumb-preview";
        img.src = dataURL;
        img.title = file.name;
        this.filePreview.appendChild(img);
      } catch (error) {
        console.error("Error processing file:", error);
      }
    }
  },

  /**
   * Validate file
   */
  validateFile(file) {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      Utils.showNotification(
        `File ${file.name} bukan gambar atau video`,
        "error"
      );
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      Utils.showNotification(
        `File ${file.name} terlalu besar (maksimal 5MB)`,
        "error"
      );
      return false;
    }

    return true;
  },

  /**
   * Clear form
   */
  clearForm() {
    if (this.reportForm) {
      this.reportForm.reset();
    }
    if (this.filePreview) {
      this.filePreview.innerHTML = "";
    }

    // Clear GPS data
    const locationInput = document.getElementById("inpLocation");
    if (locationInput) {
      delete locationInput.dataset.gpsLat;
      delete locationInput.dataset.gpsLng;
    }
  },

  /**
   * Render latest reports
   */
  renderLatest() {
    if (!this.latestCards) return;

    this.latestCards.innerHTML = "";
    const latestReports = Storage.getReports({
      limit: CONFIG.UI.MAX_LATEST_REPORTS,
    });

    if (latestReports.length === 0) {
      this.latestCards.innerHTML = '<div class="muted">Belum ada laporan</div>';
      return;
    }

    latestReports.forEach((report) => {
      const cardElement = this.createReportCard(report, "latest");
      this.latestCards.appendChild(cardElement);
    });
  },

  /**
   * Render reports with filters
   */
  renderReports() {
    if (!this.reportsList) return;

    this.reportsList.innerHTML = "";
    const filteredReports = this.getFilteredReports();

    if (filteredReports.length === 0) {
      this.reportsList.innerHTML =
        '<div class="muted">Tidak ada laporan sesuai filter.</div>';
      return;
    }

    filteredReports.forEach((report) => {
      const cardElement = this.createReportCard(report, "full");
      this.reportsList.appendChild(cardElement);
    });
  },

  /**
   * Get filtered reports with priority support
   */
  getFilteredReports() {
    const status = this.filterElements.status?.value || "all";
    const sortBy = this.filterElements.sortBy?.value || "newest";
    const searchQuery = window.Navigation?.getSearchQuery() || "";

    // Get priority filter
    const priorityFilter = document.getElementById("filterPriority");
    const priority = priorityFilter?.value || "all";

    let reports = Storage.getReports({
      status: status,
      sortBy: sortBy,
      search: searchQuery,
    });

    // Apply priority filter
    if (priority !== "all") {
      reports = reports.filter((r) => (r.priority || "normal") === priority);
    }

    return reports;
  },

  /**
   * Create report card with priority badge
   */
  createReportCard(report, type = "full") {
    const card = document.createElement("div");
    card.className = "card";

    const isLatest = type === "latest";
    const description = isLatest
      ? Utils.truncateText(report.description, 60)
      : Utils.truncateText(report.description);

    // Priority badge
    const priority = report.priority || "normal";
    const priorityColors = {
      urgent: "#ff4444",
      normal: "#ffaa00",
      rendah: "#44aa44",
    };
    const priorityLabels = {
      urgent: "URGENT",
      normal: "NORMAL",
      rendah: "RENDAH",
    };

    const priorityBadge = `
      <span style="
        background: ${priorityColors[priority]};
        color: white;
        font-size: 0.7rem;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
        margin-bottom: 4px;
        display: inline-block;
      ">${priorityLabels[priority]}</span>
    `;

    // GPS indicator
    const gpsIndicator = report.gpsCoordinates
      ? '<span style="color: #4caf50; margin-left: 4px;" title="Lokasi GPS tersedia">📍</span>'
      : "";

    card.innerHTML = `
      <div class="thumb">${this.renderThumb(report.files)}</div>
      ${priorityBadge}${gpsIndicator}
      <h3>${Utils.escapeHtml(report.title)}</h3>
      <p>${Utils.escapeHtml(description)}</p>
      <div class="meta-row" style="margin-top: 8px;">
        <div class="muted">
          ${Utils.escapeHtml(report.location)} • 
          <small>${new Date(report.createdAt).toLocaleString()}</small>
        </div>
        <div class="badge ${report.status}">${Utils.getStatusLabel(report.status)}</div>
      </div>
      ${!isLatest ? this.renderActions(report.id) : ""}
    `;

    card.addEventListener("click", (e) => {
      if (!e.target.closest(".actions")) {
        this.openDetailModal(report.id);
      }
    });

    return card;
  },

  /**
   * Render thumbnail
   */
  renderThumb(files) {
    if (files && files.length > 0) {
      return `<img src="${files[0]}" style="width:100%;height:140px;object-fit:cover;border-radius:8px;" alt="Preview">`;
    }
    return '<div style="padding:20px;color:#777;">No photo</div>';
  },

  /**
   * Render action buttons
   */
  renderActions(reportId) {
    return `
      <div class="actions">
        <button class="btn ghost" onclick="Reports.openDetailModal('${reportId}')">
          <i class="fa fa-eye"></i> Detail
        </button>
        <button class="btn primary" onclick="Reports.setStatus('${reportId}', 'proses')">
          Tandai Proses
        </button>
        <button class="btn ghost" onclick="Reports.setStatus('${reportId}', 'selesai')">
          Tandai Selesai
        </button>
      </div>
    `;
  },

  /**
   * Apply current filters
   */
  applyFilters() {
    this.renderReports();
  },

  /**
   * Update statistics
   */
  updateStats() {
    const stats = Storage.getReportsStats();

    if (this.statsElements.total) {
      this.statsElements.total.textContent = stats.total;
    }
    if (this.statsElements.open) {
      this.statsElements.open.textContent = stats.pending;
    }
    if (this.statsElements.resolved) {
      this.statsElements.resolved.textContent = stats.resolved;
    }
  },

  /**
   * Set report status
   */
  setStatus(reportId, newStatus) {
    try {
      Storage.updateReport(reportId, { status: newStatus });
      this.updateStats();
      this.renderReports();
      this.renderLatest();

      Utils.showNotification(
        `Status laporan diubah ke ${Utils.getStatusLabel(newStatus)}`,
        "success"
      );
    } catch (error) {
      console.error("Error updating report status:", error);
      Utils.showNotification("Terjadi kesalahan saat mengubah status", "error");
    }
  },

  /**
   * Open detail modal
   */
  openDetailModal(reportId) {
    if (window.Modal) {
      Modal.openReportDetail(reportId);
    }
  },

  /**
   * Add priority feature to form and filters
   */
  addPriorityFeature() {
    // Add priority selector to form
    const descField = document.getElementById("inpDesc");
    if (descField && !document.getElementById("inpPriority")) {
      const priorityHTML = `
        <div style="margin-top: 10px">
          <label>Prioritas</label>
          <select id="inpPriority" required>
            <option value="normal">Normal - Permasalahan umum</option>
            <option value="urgent">Urgent - Perlu tindakan segera</option>
            <option value="rendah">Rendah - Tidak mendesak</option>
          </select>
          <small class="muted">Urgent: ditindaklanjuti dalam 24 jam</small>
        </div>
      `;
      descField.parentNode.insertAdjacentHTML("afterend", priorityHTML);
    }

    // Add priority filter to reports page
    const statusFilter = document.getElementById("filterStatus");
    if (statusFilter && !document.getElementById("filterPriority")) {
      const priorityFilter = document.createElement("select");
      priorityFilter.id = "filterPriority";
      priorityFilter.innerHTML = `
        <option value="all">Semua Prioritas</option>
        <option value="urgent">Urgent</option>
        <option value="normal">Normal</option>
        <option value="rendah">Rendah</option>
      `;
      priorityFilter.addEventListener("change", () => this.applyFilters());
      statusFilter.parentNode.insertBefore(
        priorityFilter,
        statusFilter.nextSibling
      );
    }
  },

  /**
   * Add PDF export feature - only one button
   */
  addPDFExportFeature() {
    // Remove any existing export buttons first
    const existingBtns = document.querySelectorAll(
      "#exportBtn, #simpleExportBtn, #exportReportsBtn, #pdfExportBtn"
    );
    existingBtns.forEach((btn) => btn.remove());

    const reportsHeader = document.querySelector("#page-reports h2");
    if (reportsHeader) {
      const exportBtn = document.createElement("button");
      exportBtn.id = "pdfExportBtn";
      exportBtn.className = "btn ghost";
      exportBtn.innerHTML = '<i class="fa fa-file-pdf"></i> Export PDF';
      exportBtn.style.cssText =
        "float: right; margin-top: -4px; background: rgba(255,77,77,0.1); color: #ff4d4d;";
      exportBtn.onclick = () => this.exportToPDF();
      reportsHeader.appendChild(exportBtn);
    }
  },

  /**
   * Export reports to PDF
   */
  exportToPDF() {
    const reports = Storage.reports;
    const stats = Storage.getReportsStats();
    const exportDate = new Date();

    // Count by priority
    const urgentReports = reports.filter(
      (r) => (r.priority || "normal") === "urgent"
    );
    const normalReports = reports.filter(
      (r) => (r.priority || "normal") === "normal"
    );
    const rendahReports = reports.filter(
      (r) => (r.priority || "normal") === "rendah"
    );

    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Laporan Pengaduan - ${exportDate.toLocaleDateString("id-ID")}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Arial', sans-serif; margin: 20px; color: #333; line-height: 1.4; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #b71c1c; padding-bottom: 15px; }
          .header h1 { color: #b71c1c; margin-bottom: 8px; font-size: 28px; }
          .header p { color: #666; margin: 4px 0; }
          .stats-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #b71c1c; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; text-align: center; }
          .stat-item h3 { font-size: 32px; color: #b71c1c; margin-bottom: 5px; }
          .stat-item p { color: #666; font-weight: 500; }
          .priority-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 15px 0; }
          .priority-item { text-align: center; padding: 10px; border-radius: 5px; }
          .priority-urgent { background: #ffebee; border: 1px solid #f44336; }
          .priority-normal { background: #fff3e0; border: 1px solid #ff9800; }
          .priority-rendah { background: #e8f5e8; border: 1px solid #4caf50; }
          .report-item { border: 1px solid #e0e0e0; margin: 15px 0; padding: 20px; border-radius: 8px; page-break-inside: avoid; }
          .report-title { font-weight: bold; color: #b71c1c; font-size: 16px; margin-bottom: 8px; }
          .report-meta { color: #666; font-size: 14px; margin-bottom: 12px; }
          .priority-badge { padding: 4px 8px; border-radius: 4px; color: white; font-size: 12px; font-weight: bold; }
          .priority-badge.urgent { background: #f44336; }
          .priority-badge.normal { background: #ff9800; }
          .priority-badge.rendah { background: #4caf50; }
          .status-badge { padding: 4px 8px; border-radius: 4px; color: white; font-size: 12px; font-weight: bold; }
          .status-badge.baru { background: #2196f3; }
          .status-badge.proses { background: #ff9800; }
          .status-badge.selesai { background: #4caf50; }
          .description { background: #f9f9f9; padding: 12px; border-radius: 4px; margin: 10px 0; border-left: 3px solid #b71c1c; }
          .footer { margin-top: 40px; text-align: center; color: #666; border-top: 1px solid #ddd; padding-top: 20px; font-size: 14px; }
          @media print { body { margin: 15px; } .report-item { page-break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>LAPORAN PENGADUAN MASYARAKAT</h1>
          <p><strong>Pemerintah Desa/Kelurahan</strong></p>
          <p>Periode Laporan: ${exportDate.toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</p>
          <p>Digenerate pada: ${exportDate.toLocaleString("id-ID")}</p>
        </div>
        
        <div class="stats-section">
          <h2 style="color: #b71c1c; margin-bottom: 15px;">RINGKASAN STATISTIK</h2>
          <div class="stats-grid">
            <div class="stat-item"><h3>${stats.total}</h3><p>Total Laporan</p></div>
            <div class="stat-item"><h3>${stats.pending}</h3><p>Menunggu Tindakan</p></div>
            <div class="stat-item"><h3>${stats.inProgress}</h3><p>Sedang Diproses</p></div>
            <div class="stat-item"><h3>${stats.resolved}</h3><p>Telah Selesai</p></div>
          </div>
          
          <h3 style="color: #b71c1c; margin: 20px 0 10px 0;">Breakdown Prioritas</h3>
          <div class="priority-stats">
            <div class="priority-item priority-urgent"><h4 style="color: #f44336;">${urgentReports.length}</h4><p>Urgent</p></div>
            <div class="priority-item priority-normal"><h4 style="color: #ff9800;">${normalReports.length}</h4><p>Normal</p></div>
            <div class="priority-item priority-rendah"><h4 style="color: #4caf50;">${rendahReports.length}</h4><p>Rendah</p></div>
          </div>
        </div>

        <div class="reports-section">
          <h2 style="color: #b71c1c; margin-bottom: 20px;">DAFTAR LENGKAP LAPORAN</h2>
          ${reports
            .map(
              (report, index) => `
            <div class="report-item">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <div class="report-title">${index + 1}. ${report.title}</div>
                <div>
                  <span class="priority-badge ${report.priority || "normal"}">${(report.priority || "normal").toUpperCase()}</span>
                  <span class="status-badge ${report.status}">${report.status.toUpperCase()}</span>
                </div>
              </div>
              <div class="report-meta">
                <strong>Pelapor:</strong> ${report.name} | <strong>Lokasi:</strong> ${report.location}<br>
                <strong>Tanggal:</strong> ${new Date(report.createdAt).toLocaleDateString("id-ID")} pukul ${new Date(report.createdAt).toLocaleTimeString("id-ID")}
              </div>
              <div class="description">
                <strong>Deskripsi:</strong> ${report.description}
              </div>
              ${report.gpsCoordinates ? `<div style="margin-top: 8px; color: #666;"><strong>GPS:</strong> ${report.gpsCoordinates.lat.toFixed(6)}, ${report.gpsCoordinates.lng.toFixed(6)}</div>` : ""}
              ${report.files?.length > 0 ? `<div style="margin-top: 8px; color: #666;"><strong>Bukti:</strong> ${report.files.length} file dilampirkan</div>` : ""}
            </div>
          `
            )
            .join("")}
        </div>
        
        <div class="footer">
          <p><strong>LAPORAN PENGADUAN MASYARAKAT</strong></p>
          <p>Total: ${reports.length} | Selesai: ${stats.resolved} (${((stats.resolved / stats.total) * 100).toFixed(1)}%) | Pending: ${stats.pending}</p>
          <p>Digenerate oleh PengaduanApp v2.0 pada ${exportDate.toLocaleString("id-ID")}</p>
        </div>
      </body>
      </html>
    `;

    // Open print window
    const printWindow = window.open("", "_blank");
    printWindow.document.write(pdfContent);
    printWindow.document.close();

    printWindow.onload = function () {
      setTimeout(() => {
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
      }, 500);
    };

    Utils.showNotification(
      'PDF export dibuka. Pilih "Save as PDF" di print dialog.',
      "success"
    );
  },
};
