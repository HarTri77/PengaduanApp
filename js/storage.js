/**
 * Data Storage Management - Updated with Chat Support
 */
const Storage = {
  // Data state
  reports: [],
  profile: {},
  ratings: [],
  chatMessages: [], // New: Chat messages storage
  escalations: [], // New: Escalation history storage

  /**
   * Initialize storage and load data
   */
  init() {
    this.loadAll();
    this.initializeDefaults();
  },

  /**
   * Load all data from localStorage
   */
  loadAll() {
    try {
      this.reports = JSON.parse(
        localStorage.getItem(CONFIG.STORAGE_KEYS.REPORTS) || "[]"
      );
      this.profile = JSON.parse(
        localStorage.getItem(CONFIG.STORAGE_KEYS.PROFILE) ||
          JSON.stringify(CONFIG.DEFAULT_PROFILE)
      );
      this.ratings = JSON.parse(
        localStorage.getItem(CONFIG.STORAGE_KEYS.RATINGS) || "[]"
      );
      this.chatMessages = JSON.parse(
        localStorage.getItem(CONFIG.STORAGE_KEYS.CHAT_MESSAGES) || "[]"
      );
      this.escalations = JSON.parse(
        localStorage.getItem(CONFIG.STORAGE_KEYS.ESCALATIONS) || "[]"
      );
    } catch (error) {
      console.error("Error loading data from storage:", error);
      this.initializeDefaults();
    }
  },

  /**
   * Initialize default data if empty
   */
  initializeDefaults() {
    if (!this.profile.name) {
      this.profile = { ...CONFIG.DEFAULT_PROFILE };
    }

    // Add demo data if no reports exist
    if (this.reports.length === 0) {
      this.addDemoReports();
    }

    this.saveAll();
  },

  /**
   * Save all data to localStorage
   */
  saveAll() {
    try {
      localStorage.setItem(
        CONFIG.STORAGE_KEYS.REPORTS,
        JSON.stringify(this.reports)
      );
      localStorage.setItem(
        CONFIG.STORAGE_KEYS.PROFILE,
        JSON.stringify(this.profile)
      );
      localStorage.setItem(
        CONFIG.STORAGE_KEYS.RATINGS,
        JSON.stringify(this.ratings)
      );
      localStorage.setItem(
        CONFIG.STORAGE_KEYS.CHAT_MESSAGES,
        JSON.stringify(this.chatMessages)
      );
      localStorage.setItem(
        CONFIG.STORAGE_KEYS.ESCALATIONS,
        JSON.stringify(this.escalations)
      );
    } catch (error) {
      console.error("Error saving data to storage:", error);
      Utils.showNotification("Error saving data", "error");
    }
  },

  // ========== Reports Management ==========
  /**
   * Add new report
   * @param {Object} reportData - Report data
   */
  addReport(reportData) {
    const newReport = {
      id: Utils.generateId(),
      ...reportData,
      status: "baru",
      priority: reportData.priority || "normal", // New: Priority support
      location: reportData.location,
      gpsCoordinates: reportData.gpsCoordinates || null, // New: GPS coordinates
      createdAt: Date.now(),
      lastUpdatedAt: Date.now(),
      escalatedAt: null, // New: Escalation tracking
    };

    this.reports.push(newReport);
    this.saveAll();
    return newReport;
  },

  /**
   * Update report
   * @param {string} id - Report ID
   * @param {Object} updates - Updates to apply
   */
  updateReport(id, updates) {
    const index = this.reports.findIndex((r) => r.id === id);
    if (index !== -1) {
      this.reports[index] = {
        ...this.reports[index],
        ...updates,
        lastUpdatedAt: Date.now(),
      };
      this.saveAll();
      return this.reports[index];
    }
    return null;
  },

  /**
   * Delete report
   * @param {string} id - Report ID
   */
  deleteReport(id) {
    this.reports = this.reports.filter((r) => r.id !== id);
    // Also delete related chat messages
    this.chatMessages = this.chatMessages.filter((m) => m.reportId !== id);
    this.saveAll();
  },

  /**
   * Get report by ID
   * @param {string} id - Report ID
   */
  getReport(id) {
    return this.reports.find((r) => r.id === id);
  },

  /**
   * Get reports with filtering and sorting
   * @param {Object} options - Filter and sort options
   */
  getReports(options = {}) {
    let result = [...this.reports];

    // Apply status filter
    if (options.status && options.status !== "all") {
      result = result.filter((r) => r.status === options.status);
    }

    // Apply priority filter
    if (options.priority && options.priority !== "all") {
      result = result.filter((r) => r.priority === options.priority);
    }

    // Apply search
    if (options.search) {
      result = Utils.searchBy(result, options.search, [
        "title",
        "location",
        "description",
      ]);
    }

    // Apply sorting
    const sortField =
      options.sortBy === "oldest"
        ? "createdAt"
        : options.sortBy === "priority"
          ? "priority"
          : "createdAt";
    const sortOrder = options.sortBy === "oldest" ? "asc" : "desc";

    if (sortField === "priority") {
      // Custom priority sorting
      const priorityOrder = { urgent: 3, normal: 2, rendah: 1 };
      result = result.sort(
        (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]
      );
    } else {
      result = Utils.sortBy(result, sortField, sortOrder);
    }

    // Apply limit
    if (options.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  },

  /**
   * Get reports statistics with detailed breakdown
   */
  getReportsStats() {
    const total = this.reports.length;
    const byStatus = {
      baru: this.reports.filter((r) => r.status === "baru").length,
      proses: this.reports.filter((r) => r.status === "proses").length,
      selesai: this.reports.filter((r) => r.status === "selesai").length,
    };

    const byPriority = {
      urgent: this.reports.filter((r) => r.priority === "urgent").length,
      normal: this.reports.filter((r) => r.priority === "normal").length,
      rendah: this.reports.filter((r) => r.priority === "rendah").length,
    };

    // Reports requiring escalation (older than 7 days and still 'baru')
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const needsEscalation = this.reports.filter(
      (r) => r.status === "baru" && r.createdAt < weekAgo && !r.escalatedAt
    ).length;

    // Average response time (for completed reports)
    const completedReports = this.reports.filter((r) => r.status === "selesai");
    const avgResponseTime =
      completedReports.length > 0
        ? completedReports.reduce(
            (sum, r) => sum + (r.lastUpdatedAt - r.createdAt),
            0
          ) / completedReports.length
        : 0;

    return {
      total,
      byStatus,
      byPriority,
      needsEscalation,
      avgResponseTime: Math.round(avgResponseTime / (1000 * 60 * 60)), // in hours
      pending: byStatus.baru,
      inProgress: byStatus.proses,
      resolved: byStatus.selesai,
    };
  },

  // ========== Chat Messages Management ==========
  /**
   * Add chat message
   * @param {Object} messageData - Message data
   */
  addChatMessage(messageData) {
    const newMessage = {
      id: Utils.generateId(),
      ...messageData,
      timestamp: Date.now(),
      isRead: false,
    };

    this.chatMessages.push(newMessage);
    this.saveAll();
    return newMessage;
  },

  /**
   * Get chat messages for specific report
   * @param {string} reportId - Report ID
   */
  getChatMessages(reportId) {
    return this.chatMessages
      .filter((m) => m.reportId === reportId)
      .sort((a, b) => a.timestamp - b.timestamp);
  },

  /**
   * Get all chat messages
   */
  getAllChatMessages() {
    return [...this.chatMessages];
  },

  /**
   * Mark chat messages as read
   * @param {string} reportId - Report ID
   * @param {string} userRole - User role ('citizen' or 'officer')
   */
  markChatMessagesAsRead(reportId, userRole) {
    this.chatMessages.forEach((message) => {
      if (message.reportId === reportId && message.senderRole !== userRole) {
        message.isRead = true;
      }
    });
    this.saveAll();
  },

  // ========== Escalation Management ==========
  /**
   * Add escalation record
   * @param {Object} escalationData - Escalation data
   */
  addEscalation(escalationData) {
    const newEscalation = {
      id: Utils.generateId(),
      ...escalationData,
      createdAt: Date.now(),
    };

    this.escalations.push(newEscalation);

    // Update report escalation timestamp
    this.updateReport(escalationData.reportId, {
      escalatedAt: Date.now(),
    });

    this.saveAll();
    return newEscalation;
  },

  /**
   * Get escalation history for report
   * @param {string} reportId - Report ID
   */
  getEscalations(reportId = null) {
    if (reportId) {
      return this.escalations.filter((e) => e.reportId === reportId);
    }
    return [...this.escalations];
  },

  /**
   * Check and auto-escalate overdue reports
   */
  checkAutoEscalation() {
    const now = Date.now();
    const escalationThreshold =
      CONFIG.ESCALATION.AUTO_ESCALATE_DAYS * 24 * 60 * 60 * 1000;

    const overdueReports = this.reports.filter(
      (r) =>
        r.status === "baru" &&
        !r.escalatedAt &&
        now - r.createdAt > escalationThreshold
    );

    overdueReports.forEach((report) => {
      this.addEscalation({
        reportId: report.id,
        type: "auto",
        reason: "Laporan tidak ditanggapi dalam waktu yang ditentukan",
        escalatedTo: "supervisor",
      });

      // Add auto notification message
      this.addChatMessage({
        reportId: report.id,
        sender: "System",
        senderRole: "system",
        message:
          "Laporan ini telah dieskalasi otomatis karena belum ditanggapi dalam 7 hari.",
        timestamp: now,
        isRead: false,
      });
    });

    return overdueReports.length;
  },

  // ========== GPS Location Management ==========
  /**
   * Add GPS coordinates to report
   * @param {string} reportId - Report ID
   * @param {Object} coordinates - GPS coordinates {lat, lng}
   */
  addGPSLocation(reportId, coordinates) {
    return this.updateReport(reportId, {
      gpsCoordinates: coordinates,
      hasGPS: true,
    });
  },

  /**
   * Get reports by location radius
   * @param {Object} center - Center coordinates {lat, lng}
   * @param {number} radiusKm - Radius in kilometers
   */
  getReportsByLocation(center, radiusKm) {
    return this.reports.filter((report) => {
      if (!report.gpsCoordinates) return false;

      const distance = this.calculateDistance(
        center.lat,
        center.lng,
        report.gpsCoordinates.lat,
        report.gpsCoordinates.lng
      );

      return distance <= radiusKm;
    });
  },

  /**
   * Calculate distance between two GPS coordinates
   * @param {number} lat1 - Latitude 1
   * @param {number} lng1 - Longitude 1
   * @param {number} lat2 - Latitude 2
   * @param {number} lng2 - Longitude 2
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  // ========== Export Functions ==========
  /**
   * Export reports data with optional date range
   * @param {string} format - Export format ('json', 'csv')
   * @param {Object} dateRange - Optional date range {start, end}
   */
  exportReports(format = "json", dateRange = null) {
    let reportsToExport = [...this.reports];

    // Apply date filter if provided
    if (dateRange) {
      reportsToExport = reportsToExport.filter(
        (r) => r.createdAt >= dateRange.start && r.createdAt <= dateRange.end
      );
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      totalReports: reportsToExport.length,
      reports: reportsToExport.map((report) => ({
        id: report.id,
        title: report.title,
        location: report.location,
        description: report.description,
        status: report.status,
        priority: report.priority,
        gpsCoordinates: report.gpsCoordinates,
        createdAt: new Date(report.createdAt).toISOString(),
        lastUpdatedAt: new Date(report.lastUpdatedAt).toISOString(),
        escalated: !!report.escalatedAt,
      })),
    };

    this.downloadData(
      exportData,
      `reports-export-${new Date().toISOString().split("T")[0]}`,
      format
    );
  },

  /**
   * Download data as file
   * @param {Object} data - Data to download
   * @param {string} filename - Filename without extension
   * @param {string} format - File format ('json' or 'csv')
   */
  downloadData(data, filename, format) {
    let content, mimeType, extension;

    if (format === "csv" && data.reports) {
      // Convert to CSV
      const headers = Object.keys(data.reports[0]).join(",");
      const rows = data.reports.map((report) =>
        Object.values(report)
          .map((val) =>
            typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val
          )
          .join(",")
      );
      content = [headers, ...rows].join("\n");
      mimeType = "text/csv";
      extension = "csv";
    } else {
      // JSON format
      content = JSON.stringify(data, null, 2);
      mimeType = "application/json";
      extension = "json";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.${extension}`;
    link.click();

    URL.revokeObjectURL(url);
  },

  // ========== Profile Management ==========
  /**
   * Update profile
   * @param {Object} profileData - Profile data
   */
  updateProfile(profileData) {
    this.profile = { ...this.profile, ...profileData };
    this.saveAll();
    return this.profile;
  },

  /**
   * Get profile
   */
  getProfile() {
    return { ...this.profile };
  },

  // ========== Ratings Management ==========
  /**
   * Add rating
   * @param {Object} ratingData - Rating data
   */
  addRating(ratingData) {
    const newRating = {
      id: Utils.generateId(),
      ...ratingData,
      at: Date.now(),
    };

    this.ratings.push(newRating);
    this.saveAll();
    return newRating;
  },

  /**
   * Get ratings with statistics
   */
  getRatings() {
    const ratings = [...this.ratings].sort((a, b) => b.at - a.at);
    const totalRatings = ratings.length;
    const averageRating =
      totalRatings > 0
        ? (ratings.reduce((sum, r) => sum + r.score, 0) / totalRatings).toFixed(
            1
          )
        : 0;

    return {
      ratings,
      totalRatings,
      averageRating,
    };
  },

  /**
   * Add demo reports for testing
   */
  addDemoReports() {
    const demoReports = [
      {
        id: Utils.generateId(),
        title: "Jalan Rusak di Jl. Sukasari",
        name: this.profile.name,
        location: "Jl. Sukasari",
        description:
          "Jalan berlubang besar, butuh segera diperbaiki. Kondisi sangat membahayakan pengendara motor dan mobil.",
        files: [],
        status: "baru",
        priority: "urgent",
        gpsCoordinates: { lat: -6.2088, lng: 106.8456 },
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
        lastUpdatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
        escalatedAt: null,
      },
      {
        id: Utils.generateId(),
        title: "Lampu Jalan Mati",
        name: this.profile.name,
        location: "Lapangan Desa",
        description:
          "Lampu jalan tidak menyala pada malam hari. Membuat area menjadi gelap dan rawan kejahatan.",
        files: [],
        status: "proses",
        priority: "normal",
        gpsCoordinates: { lat: -6.2087, lng: 106.8457 },
        createdAt: Date.now() - 1000 * 60 * 60 * 10, // 10 hours ago
        lastUpdatedAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
        escalatedAt: null,
      },
      {
        id: Utils.generateId(),
        title: "Sampah Menumpuk",
        name: this.profile.name,
        location: "Jl. Mawar RT 02",
        description:
          "Sampah sudah menumpuk selama seminggu tidak diangkut. Mulai menimbulkan bau tidak sedap.",
        files: [],
        status: "selesai",
        priority: "normal",
        gpsCoordinates: { lat: -6.2089, lng: 106.8455 },
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1, // 1 day ago
        lastUpdatedAt: Date.now() - 1000 * 60 * 60 * 4, // 4 hours ago
        escalatedAt: null,
      },
    ];

    this.reports = demoReports;
  },
};
