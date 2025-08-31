/**
 * Main Application Entry Point - Clean Version
 */
class PengaduanApp {
  constructor() {
    this.components = {};
    this.isInitialized = false;
  }

  async init() {
    try {
      console.log("Initializing PengaduanApp...");

      if (document.readyState === "loading") {
        await new Promise((resolve) => {
          document.addEventListener("DOMContentLoaded", resolve);
        });
      }

      Storage.init();
      console.log("Storage initialized");

      await this.initializeComponents();
      this.setupErrorHandling();
      this.isInitialized = true;

      console.log("PengaduanApp initialized successfully");
      this.checkFirstTimeUser();
    } catch (error) {
      console.error("Failed to initialize PengaduanApp:", error);
      Utils.showNotification("Terjadi kesalahan saat memuat aplikasi", "error");
    }
  }

  async initializeComponents() {
    const initPromises = [];
    const componentInitializers = [
      { name: "Profile", instance: Profile },
      { name: "Navigation", instance: Navigation },
      { name: "Reports", instance: Reports },
      { name: "Rating", instance: Rating },
      { name: "Modal", instance: Modal },
    ];

    for (const { name, instance } of componentInitializers) {
      try {
        if (instance && typeof instance.init === "function") {
          initPromises.push(
            Promise.resolve(instance.init()).then(() => {
              this.components[name] = instance;
              console.log(`${name} component initialized`);
            })
          );
        }
      } catch (error) {
        console.error(`Failed to initialize ${name} component:`, error);
      }
    }

    await Promise.all(initPromises);
  }

  setupErrorHandling() {
    window.addEventListener("error", (event) => {
      console.error("Global error:", event.error);
      this.handleError(event.error);
    });

    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled promise rejection:", event.reason);
      this.handleError(event.reason);
    });
  }

  handleError(error) {
    if (process?.env?.NODE_ENV === "development") {
      return;
    }
    Utils.showNotification("Terjadi kesalahan. Silakan coba lagi.", "error");
  }

  checkFirstTimeUser() {
    const hasVisited = localStorage.getItem("pa_has_visited");
    if (!hasVisited) {
      localStorage.setItem("pa_has_visited", "true");
      setTimeout(() => {
        Utils.showNotification(
          "Selamat datang di PengaduanApp! Klik tombol + untuk membuat pengaduan pertama Anda.",
          "info"
        );
      }, 1000);
    }
  }

  getComponent(name) {
    return this.components[name];
  }

  isReady() {
    return this.isInitialized;
  }
}

// Global app instance
window.App = new PengaduanApp();

// Auto-initialize
(async () => {
  await window.App.init();
})();

// Global exports
window.Reports = Reports;
window.Modal = Modal;
window.Navigation = Navigation;
window.Profile = Profile;
window.Rating = Rating;
window.Utils = Utils;
window.Storage = Storage;
window.CONFIG = CONFIG;

// Development helpers
window.PengaduanApp = {
  app: window.App,
  components: { Reports, Modal, Navigation, Profile, Rating },
  utils: { Utils, Storage, CONFIG },
  debug: {
    getState: () => ({
      reports: Storage.reports,
      profile: Storage.profile,
      ratings: Storage.ratings,
    }),
    clearData: () => {
      if (confirm("Are you sure you want to clear all data?")) {
        localStorage.clear();
        location.reload();
      }
    },
    addTestData: () => {
      Storage.addDemoReports();
      Reports.updateStats();
      Reports.renderLatest();
      Reports.renderReports();
      console.log("Test data added");
    },
  },
};

// ========== ENHANCED FEATURES ==========

// Simple GPS Feature
const SimpleGPS = {
  init() {
    this.addGPSButton();
  },

  addGPSButton() {
    const locationInput = document.getElementById("inpLocation");
    if (locationInput && !document.getElementById("gpsBtn")) {
      const gpsBtn = document.createElement("button");
      gpsBtn.id = "gpsBtn";
      gpsBtn.type = "button";
      gpsBtn.innerHTML = "📍 GPS";
      gpsBtn.style.cssText = `
        margin-left: 8px;
        background: rgba(76, 175, 80, 0.2);
        border: 1px solid rgba(76, 175, 80, 0.3);
        color: #4caf50;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 0.8rem;
        cursor: pointer;
      `;
      gpsBtn.onclick = () => this.getLocation(locationInput);
      locationInput.parentNode.appendChild(gpsBtn);
    }
  },

  async getLocation(input) {
    const btn = document.getElementById("gpsBtn");
    if (!navigator.geolocation) {
      alert("GPS tidak didukung browser ini");
      return;
    }

    btn.innerHTML = "⏳ Mencari...";
    btn.disabled = true;

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      input.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      input.dataset.gpsLat = lat;
      input.dataset.gpsLng = lng;

      alert("Lokasi GPS berhasil didapat!");
    } catch (error) {
      console.error("GPS Error:", error);
      alert("Gagal mendapatkan lokasi GPS");
    } finally {
      btn.innerHTML = "📍 GPS";
      btn.disabled = false;
    }
  },
};

// Simple Chat Feature
const SimpleChat = {
  chatMessages: {},

  init() {
    this.loadChatData();
  },

  loadChatData() {
    const stored = localStorage.getItem("pa_chat_messages");
    this.chatMessages = stored ? JSON.parse(stored) : {};
  },

  saveChatData() {
    localStorage.setItem("pa_chat_messages", JSON.stringify(this.chatMessages));
  },

  openChat(reportId) {
    const report = Storage.getReport(reportId);
    if (!report) return;

    const messages = this.chatMessages[reportId] || [];
    const chatHTML = `
      <div style="width: 500px; max-width: 90vw;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3>💬 Chat: ${report.title}</h3>
          <button onclick="Modal.close()" class="btn ghost">Tutup</button>
        </div>
        
        <div id="chatMessages" style="height: 300px; overflow-y: auto; background: #0f0f0f; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
          ${this.renderMessages(messages)}
        </div>
        
        <div style="display: flex; gap: 8px;">
          <textarea id="chatInput" placeholder="Tulis pesan..." style="flex: 1; background: #222; color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 8px; resize: vertical; min-height: 40px;"></textarea>
          <button onclick="SimpleChat.sendMessage('${reportId}')" class="btn primary">Kirim</button>
        </div>
      </div>
    `;

    Modal.modalContent.innerHTML = chatHTML;
    Modal.open();
  },

  renderMessages(messages) {
    if (messages.length === 0) {
      return '<div style="text-align: center; color: #666; padding: 20px;">Belum ada percakapan</div>';
    }

    return messages
      .map(
        (msg) => `
      <div style="margin-bottom: 12px; padding: 8px 12px; background: ${msg.isOfficer ? "rgba(183,28,28,0.2)" : "rgba(255,255,255,0.05)"}; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <strong style="color: #ffbcbc;">${msg.isOfficer ? "🏛️ Petugas" : "👤 " + msg.sender}</strong>
          <small style="color: #999;">${new Date(msg.timestamp).toLocaleString()}</small>
        </div>
        <div style="color: #eee;">${msg.message}</div>
      </div>
    `
      )
      .join("");
  },

  sendMessage(reportId) {
    const input = document.getElementById("chatInput");
    const message = input.value.trim();

    if (!message) {
      alert("Pesan tidak boleh kosong");
      return;
    }

    if (!this.chatMessages[reportId]) {
      this.chatMessages[reportId] = [];
    }

    const profile = Storage.getProfile();
    this.chatMessages[reportId].push({
      id: Utils.generateId(),
      sender: profile.name,
      message: message,
      timestamp: Date.now(),
      isOfficer: false,
    });

    this.saveChatData();
    input.value = "";

    // Update display
    const chatContainer = document.getElementById("chatMessages");
    if (chatContainer) {
      chatContainer.innerHTML = this.renderMessages(
        this.chatMessages[reportId]
      );
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    alert("Pesan terkirim!");

    // Simulate officer response
    setTimeout(() => {
      this.chatMessages[reportId].push({
        id: Utils.generateId(),
        sender: "Petugas Desa",
        message: "Terima kasih laporannya. Kami akan segera menindaklanjuti.",
        timestamp: Date.now(),
        isOfficer: true,
      });

      this.saveChatData();
      if (document.getElementById("chatMessages")) {
        document.getElementById("chatMessages").innerHTML = this.renderMessages(
          this.chatMessages[reportId]
        );
      }
    }, 2000);
  },

  getChatCount(reportId) {
    return this.chatMessages[reportId] ? this.chatMessages[reportId].length : 0;
  },
};

// Auto-Escalation Check
const SimpleEscalation = {
  init() {
    this.checkOverdueReports();
    setInterval(() => this.checkOverdueReports(), 60 * 60 * 1000);
  },

  checkOverdueReports() {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const overdueReports = Storage.reports.filter(
      (r) => r.status === "baru" && r.createdAt < weekAgo
    );

    if (overdueReports.length > 0) {
      console.log(`${overdueReports.length} laporan perlu eskalasi`);
      const statOpen = document.getElementById("statOpen");
      if (statOpen) {
        statOpen.style.color = "#ff4444";
        statOpen.title = `${overdueReports.length} laporan perlu eskalasi`;
      }
    }
  },

  getOverdueCount() {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    return Storage.reports.filter(
      (r) => r.status === "baru" && r.createdAt < weekAgo
    ).length;
  },
};

// Enhanced Dashboard Stats
const EnhancedDashboard = {
  init() {
    this.addEnhancedStats();
    this.removeDashboardButtons();
  },

  addEnhancedStats() {
    const dashboardPage = document.getElementById("page-dashboard");
    if (dashboardPage && !document.getElementById("enhancedStats")) {
      const enhancedStatsDiv = document.createElement("div");
      enhancedStatsDiv.id = "enhancedStats";
      enhancedStatsDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin: 16px 0;">
          <div class="card" style="text-align: center;">
            <h4>📊 Statistik Minggu Ini</h4>
            <div style="font-size: 1.5rem; color: #4caf50;" id="weeklyStats">
              ${Storage.reports.filter((r) => r.createdAt > Date.now() - 7 * 24 * 60 * 60 * 1000).length}
            </div>
            <small class="muted">Laporan baru</small>
          </div>
          
          <div class="card" style="text-align: center;">
            <h4>⚠️ Perlu Eskalasi</h4>
            <div style="font-size: 1.5rem; color: #ff4444;" id="escalationStats">
              ${SimpleEscalation.getOverdueCount()}
            </div>
            <small class="muted">Laporan tertunda</small>
          </div>
          
          <div class="card" style="text-align: center;">
            <h4>💬 Total Chat</h4>
            <div style="font-size: 1.5rem; color: #2196f3;" id="chatStats">
              ${Object.values(SimpleChat.chatMessages).reduce((sum, msgs) => sum + msgs.length, 0)}
            </div>
            <small class="muted">Pesan exchanged</small>
          </div>
          
          <div class="card" style="text-align: center;">
            <h4>📍 GPS Aktif</h4>
            <div style="font-size: 1.5rem; color: #ff9800;" id="gpsStats">
              ${Storage.reports.filter((r) => r.gpsCoordinates).length}
            </div>
            <small class="muted">Laporan dengan GPS</small>
          </div>
        </div>
      `;

      const latestCards = document.getElementById("latestCards");
      if (latestCards) {
        latestCards.parentNode.insertBefore(enhancedStatsDiv, latestCards);
      }
    }
  },

  removeDashboardButtons() {
    setTimeout(() => {
      const dashboardBtns = document.querySelectorAll(
        "#refreshDashboard, #exportDashboard"
      );
      dashboardBtns.forEach((btn) => btn.remove());

      const buttonContainer = document.querySelector(
        '#page-dashboard div[style*="display: flex"][style*="justify-content: space-between"]'
      );
      if (buttonContainer && !buttonContainer.querySelector("button")) {
        buttonContainer.remove();
      }
    }, 100);
  },
};

// Enhanced Modal with Chat
const EnhancedModal = {
  init() {
    if (window.Modal) {
      Modal.originalOpenReportDetail = Modal.openReportDetail;
      Modal.openReportDetail = function (reportId) {
        const report = Storage.getReport(reportId);
        if (!report) {
          Utils.showNotification("Laporan tidak ditemukan", "error");
          return;
        }

        this.currentReportId = reportId;
        const filesDisplay = this.renderFiles(report.files);
        const statusBadge = `<span class="badge ${report.status}">${Utils.getStatusLabel(report.status)}</span>`;

        // Priority display
        const priority = report.priority || "normal";
        const priorityColors = {
          urgent: "#f44336",
          normal: "#ff9800",
          rendah: "#4caf50",
        };
        const priorityBadge = `<span style="background: ${priorityColors[priority]}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">${priority.toUpperCase()}</span>`;

        // Chat count
        const chatCount = SimpleChat.getChatCount(reportId);
        const chatInfo = chatCount > 0 ? ` (${chatCount})` : "";

        this.modalContent.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <h2>Detail Laporan</h2>
            <button class="btn ghost" id="closeModal"><i class="fa fa-times"></i> Tutup</button>
          </div>
          
          <div class="modal-body">
            <div style="margin-bottom:12px;">
              <h3 style="font-weight:700;font-size:1.2rem;color:#ffdede;margin-bottom:8px;">${Utils.escapeHtml(report.title)}</h3>
              <div style="margin-bottom:8px;">Status: ${statusBadge} | Prioritas: ${priorityBadge}</div>
              <div class="muted" style="margin-bottom:8px;">
                <i class="fa fa-map-marker-alt"></i> ${Utils.escapeHtml(report.location)} • 
                <i class="fa fa-clock"></i> ${new Date(report.createdAt).toLocaleString()}
              </div>
              <div style="margin-bottom:8px;">
                <i class="fa fa-user"></i> Dilaporkan oleh: <strong>${Utils.escapeHtml(report.name)}</strong>
              </div>
              ${report.gpsCoordinates ? `<div style="margin-bottom:8px; color: #4caf50;"><i class="fa fa-location-arrow"></i> GPS: ${report.gpsCoordinates.lat.toFixed(6)}, ${report.gpsCoordinates.lng.toFixed(6)}</div>` : ""}
            </div>

            <div style="margin-bottom:16px;">
              <h4 style="color:#ffdddd;margin-bottom:8px;">Deskripsi</h4>
              <p style="color:#ddd;line-height:1.6;">${Utils.escapeHtml(report.description)}</p>
            </div>

            ${filesDisplay}

            <div style="margin-top:20px;">
              <h4 style="color:#ffdddd;margin-bottom:12px;">Aksi</h4>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button class="btn primary" onclick="SimpleChat.openChat('${reportId}')">
                  <i class="fa fa-comments"></i> Chat${chatInfo}
                </button>
                <button class="btn primary" id="markProses"><i class="fa fa-play"></i> Tandai Proses</button>
                <button class="btn ghost" id="markSelesai"><i class="fa fa-check"></i> Tandai Selesai</button>
                <button class="btn ghost" id="delBtn" style="background:rgba(255,77,77,0.1);color:#ff4d4d; margin-left: auto;">
                  <i class="fa fa-trash"></i> Hapus
                </button>
              </div>
            </div>
          </div>
        `;

        this.bindModalEvents();
        this.open();
      };
    }
  },
};

// Initialize Enhanced Features
document.addEventListener("DOMContentLoaded", function () {
  setTimeout(() => {
    SimpleGPS.init();
    SimpleChat.init();
    SimpleEscalation.init();
    EnhancedDashboard.init();
    EnhancedModal.init();

    console.log("Enhanced features initialized");
  }, 2000);
});

// Global exports untuk enhanced features
window.SimpleGPS = SimpleGPS;
window.SimpleChat = SimpleChat;
window.SimpleEscalation = SimpleEscalation;
