/**
 * Priority & Escalation System
 * Handle report priority assignment and automatic escalation
 */
const Escalation = {
  // Escalation timers
  checkInterval: null,

  /**
   * Initialize escalation system
   */
  init() {
    this.bindEvents();
    this.startAutoCheck();
  },

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Priority selector in form
    const prioritySelect = document.getElementById("inpPriority");
    if (prioritySelect) {
      prioritySelect.addEventListener("change", (e) => {
        this.updatePriorityInfo(e.target.value);
      });
    }

    // Manual escalation button
    const escalateBtn = document.getElementById("escalateBtn");
    if (escalateBtn) {
      escalateBtn.addEventListener("click", () => {
        this.showEscalationDialog();
      });
    }
  },

  /**
   * Add priority selector to report form
   */
  addPrioritySelector() {
    const form = document.getElementById("reportForm");
    if (!form) return;

    // Check if priority selector already exists
    if (document.getElementById("inpPriority")) return;

    const priorityDiv = document.createElement("div");
    priorityDiv.style.marginTop = "10px";
    priorityDiv.innerHTML = `
      <label>Prioritas</label>
      <select id="inpPriority" required>
        <option value="normal">Normal - Permasalahan umum</option>
        <option value="urgent">Urgent - Perlu tindakan segera</option>
        <option value="rendah">Rendah - Tidak mendesak</option>
      </select>
      <div class="priority-info" id="priorityInfo">
        <small class="muted">Prioritas Normal: Ditindaklanjuti dalam 7 hari</small>
      </div>
    `;

    // Insert after description field
    const descField = document.getElementById("inpDesc").parentNode;
    descField.parentNode.insertBefore(priorityDiv, descField.nextSibling);

    // Bind events for new element
    this.bindEvents();
  },

  /**
   * Update priority information display
   */
  updatePriorityInfo(priority) {
    const infoEl = document.getElementById("priorityInfo");
    if (!infoEl) return;

    const priorityInfo = {
      urgent: {
        text: "Prioritas Urgent: Ditindaklanjuti dalam 24 jam",
        color: "#ff4444",
        icon: "🚨",
      },
      normal: {
        text: "Prioritas Normal: Ditindaklanjuti dalam 7 hari",
        color: "#ffaa00",
        icon: "⚠️",
      },
      rendah: {
        text: "Prioritas Rendah: Ditindaklanjuti dalam 14 hari",
        color: "#44aa44",
        icon: "📋",
      },
    };

    const info = priorityInfo[priority];
    if (info) {
      infoEl.innerHTML = `
        <small class="muted" style="color: ${info.color}">
          ${info.icon} ${info.text}
        </small>
      `;
    }
  },

  /**
   * Determine priority automatically based on keywords
   */
  autoDetectPriority(title, description) {
    const text = (title + " " + description).toLowerCase();

    // Urgent keywords
    const urgentKeywords = [
      "darurat",
      "bahaya",
      "mengancam",
      "kecelakaan",
      "kebakaran",
      "banjir",
      "longsor",
      "roboh",
      "pecah",
      "bocor gas",
      "listrik mati",
      "air mati",
      "jalan putus",
      "jembatan rusak",
    ];

    // Low priority keywords
    const lowKeywords = [
      "cat mengelupas",
      "rumput liar",
      "papan nama",
      "pagar rusak",
      "lampu taman",
      "bangku taman",
      "pot bunga",
    ];

    // Check for urgent keywords
    if (urgentKeywords.some((keyword) => text.includes(keyword))) {
      return "urgent";
    }

    // Check for low priority keywords
    if (lowKeywords.some((keyword) => text.includes(keyword))) {
      return "rendah";
    }

    // Default to normal
    return "normal";
  },

  /**
   * Set priority in form based on auto-detection
   */
  autoSetPriority() {
    const titleEl = document.getElementById("inpTitle");
    const descEl = document.getElementById("inpDesc");
    const priorityEl = document.getElementById("inpPriority");

    if (!titleEl || !descEl || !priorityEl) return;

    const title = titleEl.value.trim();
    const description = descEl.value.trim();

    if (title || description) {
      const suggestedPriority = this.autoDetectPriority(title, description);
      priorityEl.value = suggestedPriority;
      this.updatePriorityInfo(suggestedPriority);

      // Show suggestion to user
      if (suggestedPriority === "urgent") {
        Utils.showNotification(
          "Prioritas diatur ke Urgent berdasarkan kata kunci",
          "info"
        );
      }
    }
  },

  /**
   * Check for reports needing escalation
   */
  checkEscalationNeeded() {
    const now = Date.now();
    let escalatedCount = 0;

    Storage.reports.forEach((report) => {
      if (this.needsEscalation(report, now)) {
        this.escalateReport(report, "auto");
        escalatedCount++;
      }
    });

    if (escalatedCount > 0) {
      console.log(`Auto-escalated ${escalatedCount} reports`);

      // Update UI if on dashboard
      if (window.Dashboard && typeof Dashboard.renderDashboard === "function") {
        Dashboard.renderDashboard();
      }
    }

    return escalatedCount;
  },

  /**
   * Check if a report needs escalation
   */
  needsEscalation(report, currentTime = Date.now()) {
    // Skip if already escalated or resolved
    if (report.escalatedAt || report.status === "selesai") {
      return false;
    }

    const daysSinceCreated =
      (currentTime - report.createdAt) / (24 * 60 * 60 * 1000);

    // Different thresholds based on priority
    const thresholds = {
      urgent: CONFIG.ESCALATION.URGENT_PRIORITY_DAYS,
      normal: CONFIG.ESCALATION.AUTO_ESCALATE_DAYS,
      rendah: CONFIG.ESCALATION.AUTO_ESCALATE_DAYS * 2, // 14 days for low priority
    };

    const threshold = thresholds[report.priority] || thresholds.normal;
    return daysSinceCreated > threshold;
  },

  /**
   * Escalate a report
   */
  escalateReport(report, escalationType = "manual") {
    const escalationData = {
      reportId: report.id,
      type: escalationType,
      reason: this.getEscalationReason(report, escalationType),
      escalatedTo: "supervisor",
      escalatedBy: escalationType === "auto" ? "system" : "user",
      escalatedAt: Date.now(),
    };

    // Add escalation record
    Storage.addEscalation(escalationData);

    // Add system message to chat
    if (window.Chat && typeof Chat.addSystemMessage === "function") {
      Chat.addSystemMessage(
        report.id,
        `Laporan telah dieskalasi: ${escalationData.reason}`
      );
    }

    // Add chat message for escalation
    Storage.addChatMessage({
      reportId: report.id,
      sender: "System",
      senderRole: "system",
      message: `🔺 ESKALASI: ${escalationData.reason}`,
      timestamp: Date.now(),
    });

    return escalationData;
  },

  /**
   * Get escalation reason based on report and type
   */
  getEscalationReason(report, escalationType) {
    const daysSinceCreated = Math.floor(
      (Date.now() - report.createdAt) / (24 * 60 * 60 * 1000)
    );

    if (escalationType === "auto") {
      const priorityText = CONFIG.PRIORITY_LABELS[report.priority];
      return `Laporan ${priorityText} tidak ditanggapi selama ${daysSinceCreated} hari`;
    }

    return `Eskalasi manual oleh pengguna setelah ${daysSinceCreated} hari`;
  },

  /**
   * Show escalation dialog
   */
  showEscalationDialog(reportId = null) {
    if (!reportId && !window.Modal?.currentReportId) {
      Utils.showNotification("Pilih laporan yang akan dieskalasi", "error");
      return;
    }

    const targetReportId = reportId || window.Modal.currentReportId;
    const report = Storage.getReport(targetReportId);

    if (!report) {
      Utils.showNotification("Laporan tidak ditemukan", "error");
      return;
    }

    const dialogHTML = `
      <div class="escalation-dialog">
        <h3>🔺 Eskalasi Laporan</h3>
        <div class="report-summary">
          <strong>${report.title}</strong>
          <div class="muted">Status: ${Utils.getStatusLabel(report.status)} | 
                          Prioritas: ${CONFIG.PRIORITY_LABELS[report.priority]}</div>
          <div class="muted">Dibuat: ${new Date(report.createdAt).toLocaleString()}</div>
        </div>

        <div style="margin: 16px 0;">
          <label>Alasan Eskalasi:</label>
          <textarea id="escalationReason" placeholder="Jelaskan mengapa laporan ini perlu dieskalasi..." 
                    rows="3" style="width: 100%; margin-top: 4px;"></textarea>
        </div>

        <div style="margin: 16px 0;">
          <label>Eskalasi ke:</label>
          <select id="escalationTarget">
            <option value="supervisor">Supervisor</option>
            <option value="manager">Manager</option>
            <option value="head_office">Kantor Pusat</option>
          </select>
        </div>

        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px;">
          <button class="btn ghost" onclick="Modal.close()">Batal</button>
          <button class="btn primary" onclick="Escalation.confirmEscalation('${targetReportId}')">
            Eskalasi Laporan
          </button>
        </div>
      </div>
    `;

    if (window.Modal) {
      Modal.modalContent.innerHTML = dialogHTML;
      Modal.open();
    }
  },

  /**
   * Confirm and execute escalation
   */
  confirmEscalation(reportId) {
    const reasonEl = document.getElementById("escalationReason");
    const targetEl = document.getElementById("escalationTarget");

    const reason = reasonEl?.value?.trim();
    const target = targetEl?.value || "supervisor";

    if (!reason) {
      Utils.showNotification("Mohon isi alasan eskalasi", "error");
      return;
    }

    const report = Storage.getReport(reportId);
    if (!report) {
      Utils.showNotification("Laporan tidak ditemukan", "error");
      return;
    }

    // Create custom escalation
    const escalationData = {
      reportId: reportId,
      type: "manual",
      reason: reason,
      escalatedTo: target,
      escalatedBy: Storage.getProfile().name,
      escalatedAt: Date.now(),
    };

    Storage.addEscalation(escalationData);

    // Add chat message
    Storage.addChatMessage({
      reportId: reportId,
      sender: "System",
      senderRole: "system",
      message: `🔺 ESKALASI MANUAL: ${reason}`,
      timestamp: Date.now(),
    });

    Utils.showNotification("Laporan berhasil dieskalasi", "success");

    if (window.Modal) {
      Modal.close();
    }

    // Update UI
    if (window.Reports) {
      Reports.renderReports();
      Reports.updateStats();
    }
  },

  /**
   * Get escalation history for report
   */
  getEscalationHistory(reportId) {
    return Storage.getEscalations(reportId);
  },

  /**
   * Start automatic escalation check
   */
  startAutoCheck() {
    if (!CONFIG.FEATURES.AUTO_ESCALATION) return;

    // Check every hour
    this.checkInterval = setInterval(
      () => {
        this.checkEscalationNeeded();
      },
      60 * 60 * 1000
    );

    // Initial check after 5 seconds
    setTimeout(() => {
      this.checkEscalationNeeded();
    }, 5000);
  },

  /**
   * Stop automatic escalation check
   */
  stopAutoCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  },

  /**
   * Get reports requiring attention
   */
  getReportsNeedingAttention() {
    const now = Date.now();
    const reports = Storage.reports;

    return {
      overdue: reports.filter((r) => this.needsEscalation(r, now)),
      warning: reports.filter((r) => this.isNearEscalation(r, now)),
      urgent: reports.filter(
        (r) => r.priority === "urgent" && r.status !== "selesai"
      ),
    };
  },

  /**
   * Check if report is near escalation threshold
   */
  isNearEscalation(report, currentTime = Date.now()) {
    if (report.escalatedAt || report.status === "selesai") {
      return false;
    }

    const daysSinceCreated =
      (currentTime - report.createdAt) / (24 * 60 * 60 * 1000);
    const warningThreshold = CONFIG.ESCALATION.WARNING_DAYS;

    return (
      daysSinceCreated >= warningThreshold &&
      !this.needsEscalation(report, currentTime)
    );
  },

  /**
   * Generate escalation report
   */
  generateEscalationReport() {
    const escalations = Storage.getEscalations();
    const reportsNeedingAttention = this.getReportsNeedingAttention();

    const reportData = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalEscalations: escalations.length,
        overdueReports: reportsNeedingAttention.overdue.length,
        warningReports: reportsNeedingAttention.warning.length,
        urgentReports: reportsNeedingAttention.urgent.length,
      },
      escalationHistory: escalations.map((esc) => ({
        reportTitle: Storage.getReport(esc.reportId)?.title || "Unknown",
        escalationType: esc.type,
        reason: esc.reason,
        escalatedTo: esc.escalatedTo,
        escalatedAt: new Date(esc.createdAt).toISOString(),
      })),
      overdueReports: reportsNeedingAttention.overdue.map((r) => ({
        id: r.id,
        title: r.title,
        priority: r.priority,
        daysSinceCreated: Math.floor(
          (Date.now() - r.createdAt) / (24 * 60 * 60 * 1000)
        ),
        status: r.status,
      })),
    };

    Storage.downloadData(
      reportData,
      `escalation-report-${new Date().toISOString().split("T")[0]}`,
      "json"
    );
  },

  /**
   * Add system message to chat (helper function)
   */
  addSystemMessage(reportId, message) {
    Storage.addChatMessage({
      reportId: reportId,
      sender: "System",
      senderRole: "system",
      message: message,
      timestamp: Date.now(),
      isRead: false,
    });
  },
};
