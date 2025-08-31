/**
 * Enhanced Dashboard Component
 * Dashboard dengan statistik lengkap dan analytics
 */
const Dashboard = {
  // DOM Elements
  statsContainer: null,
  chartsContainer: null,
  recentActivityContainer: null,
  alertsContainer: null,

  // Chart instances (for Chart.js if available)
  charts: {},

  /**
   * Initialize dashboard component
   */
  init() {
    this.cacheDOMElements();
    this.bindEvents();
    this.renderDashboard();

    // Auto refresh dashboard data
    if (CONFIG.DASHBOARD.STATS_REFRESH_INTERVAL > 0) {
      this.startAutoRefresh();
    }
  },

  /**
   * Cache DOM elements
   */
  cacheDOMElements() {
    this.statsContainer = document.getElementById("dashboardStats");
    this.chartsContainer = document.getElementById("dashboardCharts");
    this.recentActivityContainer = document.getElementById("recentActivity");
    this.alertsContainer = document.getElementById("dashboardAlerts");
  },

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Export button
    const exportBtn = document.getElementById("exportDashboard");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        this.exportDashboardData();
      });
    }

    // Refresh button
    const refreshBtn = document.getElementById("refreshDashboard");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        this.renderDashboard();
      });
    }

    // Date range selector
    const dateRangeSelect = document.getElementById("dashboardDateRange");
    if (dateRangeSelect) {
      dateRangeSelect.addEventListener("change", () => {
        this.renderDashboard();
      });
    }
  },

  /**
   * Render complete dashboard
   */
  renderDashboard() {
    try {
      const stats = this.calculateStats();

      this.renderStatsCards(stats);
      this.renderCharts(stats);
      this.renderRecentActivity();
      this.renderAlerts(stats);
    } catch (error) {
      console.error("Error rendering dashboard:", error);
      Utils.showNotification("Error loading dashboard data", "error");
    }
  },

  /**
   * Calculate comprehensive statistics
   */
  calculateStats() {
    const reports = Storage.reports;
    const chatMessages = Storage.chatMessages || [];
    const ratings = Storage.getRatings();

    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    const thisWeekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
    const thisMonthStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    ).getTime();

    // Basic stats
    const basicStats = Storage.getReportsStats();

    // Time-based stats
    const todayReports = reports.filter(
      (r) => r.createdAt >= todayStart
    ).length;
    const weekReports = reports.filter(
      (r) => r.createdAt >= thisWeekStart
    ).length;
    const monthReports = reports.filter(
      (r) => r.createdAt >= thisMonthStart
    ).length;

    // Response time analysis
    const completedReports = reports.filter((r) => r.status === "selesai");
    const avgResponseTime =
      completedReports.length > 0
        ? completedReports.reduce(
            (sum, r) => sum + (r.lastUpdatedAt - r.createdAt),
            0
          ) / completedReports.length
        : 0;

    // Resolution rate
    const resolutionRate =
      reports.length > 0
        ? ((completedReports.length / reports.length) * 100).toFixed(1)
        : 0;

    // Chat activity
    const totalMessages = chatMessages.length;
    const unreadMessages = chatMessages.filter((m) => !m.isRead).length;

    // Escalation stats
    const overdueReports = reports.filter((r) => {
      const daysSinceCreated = (now - r.createdAt) / (24 * 60 * 60 * 1000);
      return (
        r.status === "baru" &&
        daysSinceCreated > CONFIG.ESCALATION.AUTO_ESCALATE_DAYS
      );
    });

    // Priority distribution
    const priorityStats = {
      urgent: reports.filter((r) => r.priority === "urgent").length,
      normal: reports.filter((r) => r.priority === "normal").length,
      rendah: reports.filter((r) => r.priority === "rendah").length,
    };

    // Location-based stats (if GPS data available)
    const reportsWithGPS = reports.filter((r) => r.gpsCoordinates);

    // Trend analysis
    const trends = this.calculateTrends(reports);

    return {
      basic: basicStats,
      timeRange: {
        today: todayReports,
        week: weekReports,
        month: monthReports,
      },
      performance: {
        avgResponseTime: Math.round(avgResponseTime / (1000 * 60 * 60)), // hours
        resolutionRate: parseFloat(resolutionRate),
        overdueCount: overdueReports.length,
      },
      chat: {
        totalMessages,
        unreadMessages,
      },
      ratings: {
        average: parseFloat(ratings.averageRating),
        total: ratings.totalRatings,
      },
      priority: priorityStats,
      gps: {
        enabled: reportsWithGPS.length,
        total: reports.length,
        percentage:
          reports.length > 0
            ? ((reportsWithGPS.length / reports.length) * 100).toFixed(1)
            : 0,
      },
      trends,
    };
  },

  /**
   * Calculate trends (week over week, month over month)
   */
  calculateTrends(reports) {
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const monthMs = 30 * 24 * 60 * 60 * 1000;

    // This week vs last week
    const thisWeekStart = now - weekMs;
    const lastWeekStart = now - 2 * weekMs;

    const thisWeekReports = reports.filter(
      (r) => r.createdAt >= thisWeekStart
    ).length;
    const lastWeekReports = reports.filter(
      (r) => r.createdAt >= lastWeekStart && r.createdAt < thisWeekStart
    ).length;

    const weeklyTrend =
      lastWeekReports > 0
        ? (
            ((thisWeekReports - lastWeekReports) / lastWeekReports) *
            100
          ).toFixed(1)
        : thisWeekReports > 0
          ? 100
          : 0;

    // This month vs last month
    const thisMonthStart = now - monthMs;
    const lastMonthStart = now - 2 * monthMs;

    const thisMonthReports = reports.filter(
      (r) => r.createdAt >= thisMonthStart
    ).length;
    const lastMonthReports = reports.filter(
      (r) => r.createdAt >= lastMonthStart && r.createdAt < thisMonthStart
    ).length;

    const monthlyTrend =
      lastMonthReports > 0
        ? (
            ((thisMonthReports - lastMonthReports) / lastMonthReports) *
            100
          ).toFixed(1)
        : thisMonthReports > 0
          ? 100
          : 0;

    return {
      weekly: {
        current: thisWeekReports,
        previous: lastWeekReports,
        change: parseFloat(weeklyTrend),
      },
      monthly: {
        current: thisMonthReports,
        previous: lastMonthReports,
        change: parseFloat(monthlyTrend),
      },
    };
  },

  /**
   * Render statistics cards
   */
  renderStatsCards(stats) {
    const statsHTML = `
      <div class="stats-grid">
        <!-- Primary Stats -->
        <div class="stat-card primary">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-number">${stats.basic.total}</div>
            <div class="stat-label">Total Laporan</div>
            <div class="stat-trend ${stats.trends.monthly.change >= 0 ? "positive" : "negative"}">
              ${stats.trends.monthly.change >= 0 ? "📈" : "📉"} ${Math.abs(stats.trends.monthly.change)}% bulan ini
            </div>
          </div>
        </div>

        <div class="stat-card warning">
          <div class="stat-icon">⏳</div>
          <div class="stat-content">
            <div class="stat-number">${stats.basic.pending}</div>
            <div class="stat-label">Menunggu</div>
            <div class="stat-sublabel">${stats.performance.overdueCount} perlu eskalasi</div>
          </div>
        </div>

        <div class="stat-card info">
          <div class="stat-icon">🔄</div>
          <div class="stat-content">
            <div class="stat-number">${stats.basic.inProgress}</div>
            <div class="stat-label">Sedang Proses</div>
            <div class="stat-sublabel">Rata-rata ${stats.performance.avgResponseTime}h respons</div>
          </div>
        </div>

        <div class="stat-card success">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-number">${stats.basic.resolved}</div>
            <div class="stat-label">Selesai</div>
            <div class="stat-sublabel">${stats.performance.resolutionRate}% tingkat penyelesaian</div>
          </div>
        </div>

        <!-- Secondary Stats -->
        <div class="stat-card">
          <div class="stat-icon">💬</div>
          <div class="stat-content">
            <div class="stat-number">${stats.chat.totalMessages}</div>
            <div class="stat-label">Total Chat</div>
            <div class="stat-sublabel">${stats.chat.unreadMessages} belum dibaca</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-content">
            <div class="stat-number">${stats.ratings.average}</div>
            <div class="stat-label">Rating Rata-rata</div>
            <div class="stat-sublabel">${stats.ratings.total} ulasan</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📍</div>
          <div class="stat-content">
            <div class="stat-number">${stats.gps.percentage}%</div>
            <div class="stat-label">Laporan ber-GPS</div>
            <div class="stat-sublabel">${stats.gps.enabled} dari ${stats.gps.total}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🚨</div>
          <div class="stat-content">
            <div class="stat-number">${stats.priority.urgent}</div>
            <div class="stat-label">Prioritas Urgent</div>
            <div class="stat-sublabel">Perlu perhatian segera</div>
          </div>
        </div>
      </div>
    `;

    if (this.statsContainer) {
      this.statsContainer.innerHTML = statsHTML;
    } else {
      // If no dedicated stats container, update existing stats
      this.updateLegacyStats(stats);
    }
  },

  /**
   * Update legacy stats elements (backward compatibility)
   */
  updateLegacyStats(stats) {
    const statTotal = document.getElementById("statTotal");
    const statOpen = document.getElementById("statOpen");
    const statResolved = document.getElementById("statResolved");

    if (statTotal) statTotal.textContent = stats.basic.total;
    if (statOpen) statOpen.textContent = stats.basic.pending;
    if (statResolved) statResolved.textContent = stats.basic.resolved;
  },

  /**
   * Render charts and visualizations
   */
  renderCharts(stats) {
    if (!this.chartsContainer) return;

    const chartsHTML = `
      <div class="charts-grid">
        <div class="chart-container">
          <h4>Status Distribution</h4>
          <div class="chart-wrapper">
            ${this.renderPieChart("status", [
              { label: "Baru", value: stats.basic.pending, color: "#ff4444" },
              {
                label: "Proses",
                value: stats.basic.inProgress,
                color: "#ffaa00",
              },
              {
                label: "Selesai",
                value: stats.basic.resolved,
                color: "#44aa44",
              },
            ])}
          </div>
        </div>

        <div class="chart-container">
          <h4>Priority Breakdown</h4>
          <div class="chart-wrapper">
            ${this.renderBarChart("priority", [
              {
                label: "Urgent",
                value: stats.priority.urgent,
                color: "#ff4444",
              },
              {
                label: "Normal",
                value: stats.priority.normal,
                color: "#ffaa00",
              },
              {
                label: "Rendah",
                value: stats.priority.rendah,
                color: "#44aa44",
              },
            ])}
          </div>
        </div>

        <div class="chart-container">
          <h4>Weekly Trend</h4>
          <div class="trend-chart">
            ${this.renderTrendChart(stats.trends.weekly)}
          </div>
        </div>
      </div>
    `;

    this.chartsContainer.innerHTML = chartsHTML;
  },

  /**
   * Render simple pie chart (CSS-based)
   */
  renderPieChart(id, data) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return '<div class="no-data">No data</div>';

    let cumulativePercentage = 0;
    const segments = data
      .map((item) => {
        const percentage = (item.value / total) * 100;
        const startAngle = cumulativePercentage * 3.6; // Convert to degrees
        cumulativePercentage += percentage;

        return `
        <div class="pie-segment" style="
          background: conic-gradient(
            from ${startAngle}deg,
            ${item.color} 0deg ${cumulativePercentage * 3.6}deg,
            transparent ${cumulativePercentage * 3.6}deg
          );
        "></div>
      `;
      })
      .join("");

    const legend = data
      .map(
        (item) => `
      <div class="legend-item">
        <span class="legend-color" style="background: ${item.color}"></span>
        <span class="legend-label">${item.label}: ${item.value}</span>
      </div>
    `
      )
      .join("");

    return `
      <div class="pie-chart">
        <div class="pie-container">${segments}</div>
        <div class="chart-legend">${legend}</div>
      </div>
    `;
  },

  /**
   * Render simple bar chart
   */
  renderBarChart(id, data) {
    const maxValue = Math.max(...data.map((item) => item.value));
    if (maxValue === 0) return '<div class="no-data">No data</div>';

    const bars = data
      .map((item) => {
        const height = (item.value / maxValue) * 100;
        return `
        <div class="bar-item">
          <div class="bar" style="
            height: ${height}%; 
            background: ${item.color};
          "></div>
          <div class="bar-label">${item.label}</div>
          <div class="bar-value">${item.value}</div>
        </div>
      `;
      })
      .join("");

    return `<div class="bar-chart">${bars}</div>`;
  },

  /**
   * Render trend chart
   */
  renderTrendChart(trendData) {
    const isPositive = trendData.change >= 0;
    const arrow = isPositive ? "📈" : "📉";
    const colorClass = isPositive ? "positive" : "negative";

    return `
      <div class="trend-display">
        <div class="trend-main ${colorClass}">
          <span class="trend-icon">${arrow}</span>
          <span class="trend-number">${Math.abs(trendData.change)}%</span>
        </div>
        <div class="trend-details">
          <div>Minggu ini: ${trendData.current}</div>
          <div>Minggu lalu: ${trendData.previous}</div>
        </div>
      </div>
    `;
  },

  /**
   * Render recent activity feed
   */
  renderRecentActivity() {
    if (!this.recentActivityContainer) return;

    const activities = this.getRecentActivities();

    const activitiesHTML = activities
      .map(
        (activity) => `
      <div class="activity-item ${activity.type}">
        <div class="activity-icon">${activity.icon}</div>
        <div class="activity-content">
          <div class="activity-message">${activity.message}</div>
          <div class="activity-time">${Utils.formatTimeAgo(activity.timestamp)}</div>
        </div>
      </div>
    `
      )
      .join("");

    this.recentActivityContainer.innerHTML = `
      <div class="recent-activity">
        <h4>Aktivitas Terbaru</h4>
        <div class="activity-list">
          ${activitiesHTML || '<div class="no-activity">Belum ada aktivitas</div>'}
        </div>
      </div>
    `;
  },

  /**
   * Get recent activities from various sources
   */
  getRecentActivities() {
    const activities = [];
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;

    // Recent reports
    const recentReports = Storage.reports
      .filter((r) => r.createdAt >= dayAgo)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    recentReports.forEach((report) => {
      activities.push({
        type: "report",
        icon: "📝",
        message: `Laporan baru: "${report.title}"`,
        timestamp: report.createdAt,
      });
    });

    // Recent chat messages
    const recentMessages = (Storage.chatMessages || [])
      .filter((m) => m.timestamp >= dayAgo)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3);

    recentMessages.forEach((message) => {
      activities.push({
        type: "chat",
        icon: "💬",
        message: `Chat baru dari ${message.senderRole === "officer" ? "petugas" : "warga"}`,
        timestamp: message.timestamp,
      });
    });

    // Recent status changes
    const recentUpdates = Storage.reports
      .filter(
        (r) => r.lastUpdatedAt >= dayAgo && r.lastUpdatedAt !== r.createdAt
      )
      .sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt)
      .slice(0, 3);

    recentUpdates.forEach((report) => {
      activities.push({
        type: "update",
        icon: "🔄",
        message: `Status "${report.title}" diubah ke ${Utils.getStatusLabel(report.status)}`,
        timestamp: report.lastUpdatedAt,
      });
    });

    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, CONFIG.DASHBOARD.MAX_RECENT_ACTIVITIES);
  },

  /**
   * Render alerts and warnings
   */
  renderAlerts(stats) {
    if (!this.alertsContainer) return;

    const alerts = [];

    // Overdue reports alert
    if (stats.performance.overdueCount > 0) {
      alerts.push({
        type: "warning",
        icon: "⚠️",
        title: "Laporan Tertunda",
        message: `${stats.performance.overdueCount} laporan perlu eskalasi (lebih dari ${CONFIG.ESCALATION.AUTO_ESCALATE_DAYS} hari)`,
        action: "Lihat Laporan",
        onClick: "Dashboard.showOverdueReports()",
      });
    }

    // Low rating alert
    if (stats.ratings.average > 0 && stats.ratings.average < 3) {
      alerts.push({
        type: "warning",
        icon: "⭐",
        title: "Rating Rendah",
        message: `Rating rata-rata ${stats.ratings.average} - perlu perbaikan layanan`,
        action: "Lihat Rating",
        onClick: 'Navigation.navigateTo("ratingPage")',
      });
    }

    // Unread messages alert
    if (stats.chat.unreadMessages > 0) {
      alerts.push({
        type: "info",
        icon: "💬",
        title: "Pesan Belum Dibaca",
        message: `${stats.chat.unreadMessages} pesan chat belum dibaca`,
        action: "Lihat Chat",
        onClick: "Dashboard.showUnreadMessages()",
      });
    }

    const alertsHTML =
      alerts.length > 0
        ? alerts
            .map(
              (alert) => `
      <div class="alert-item ${alert.type}">
        <div class="alert-icon">${alert.icon}</div>
        <div class="alert-content">
          <div class="alert-title">${alert.title}</div>
          <div class="alert-message">${alert.message}</div>
          ${alert.action ? `<button class="alert-action" onclick="${alert.onClick}">${alert.action}</button>` : ""}
        </div>
      </div>
    `
            )
            .join("")
        : '<div class="no-alerts">✅ Semua baik-baik saja</div>';

    this.alertsContainer.innerHTML = `
      <div class="dashboard-alerts">
        <h4>Peringatan & Notifikasi</h4>
        <div class="alerts-list">${alertsHTML}</div>
      </div>
    `;
  },

  /**
   * Start auto refresh timer
   */
  startAutoRefresh() {
    setInterval(() => {
      this.renderDashboard();
    }, CONFIG.DASHBOARD.STATS_REFRESH_INTERVAL);
  },

  /**
   * Export dashboard data
   */
  exportDashboardData() {
    const stats = this.calculateStats();
    const exportData = {
      exportDate: new Date().toISOString(),
      dashboardStats: stats,
      reports: Storage.reports,
      ratings: Storage.getRatings(),
    };

    Storage.downloadData(
      exportData,
      `dashboard-export-${new Date().toISOString().split("T")[0]}`,
      "json"
    );
  },

  /**
   * Show overdue reports
   */
  showOverdueReports() {
    // Navigate to reports page with overdue filter
    Navigation.navigateTo("reports");
    // Would need to implement overdue filter in reports component
    Utils.showNotification("Menampilkan laporan yang perlu eskalasi", "info");
  },

  /**
   * Show unread messages
   */
  showUnreadMessages() {
    Utils.showNotification(
      "Fitur lihat pesan belum dibaca akan segera tersedia",
      "info"
    );
  },
};
