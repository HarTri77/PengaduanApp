/**
 * Chat/Comments Component
 * Fitur chat/komentar antara pelapor dan petugas
 */
const Chat = {
  // DOM Elements
  chatContainer: null,
  chatInput: null,
  sendButton: null,

  // State
  currentReportId: null,
  userRole: "citizen", // 'citizen' atau 'officer'

  /**
   * Initialize chat component
   */
  init() {
    this.cacheDOMElements();
    this.bindEvents();
  },

  /**
   * Cache DOM elements
   */
  cacheDOMElements() {
    this.chatContainer = document.getElementById("chatContainer");
    this.chatInput = document.getElementById("chatInput");
    this.sendButton = document.getElementById("sendChatButton");
  },

  /**
   * Bind event listeners
   */
  bindEvents() {
    if (this.sendButton) {
      this.sendButton.addEventListener("click", () => {
        this.sendMessage();
      });
    }

    if (this.chatInput) {
      this.chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }
  },

  /**
   * Open chat for specific report
   */
  openChat(reportId) {
    this.currentReportId = reportId;
    this.loadChatHistory();
    this.renderChatInterface();
  },

  /**
   * Send new message
   */
  sendMessage() {
    if (!this.chatInput || !this.currentReportId) return;

    const message = this.chatInput.value.trim();
    if (!message) {
      Utils.showNotification("Pesan tidak boleh kosong", "error");
      return;
    }

    try {
      const profile = Storage.getProfile();
      const newMessage = {
        id: Utils.generateId(),
        reportId: this.currentReportId,
        sender: profile.name,
        senderRole: this.userRole,
        message: message,
        timestamp: Date.now(),
        isRead: false,
      };

      // Add message to storage
      Storage.addChatMessage(newMessage);

      // Clear input
      this.chatInput.value = "";

      // Update chat display
      this.loadChatHistory();

      // Show notification for successful send
      Utils.showNotification("Pesan terkirim", "success");

      // Auto-generate officer response for demo (dalam implementasi nyata ini dari backend)
      if (this.userRole === "citizen") {
        setTimeout(() => {
          this.simulateOfficerResponse();
        }, 2000);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      Utils.showNotification("Gagal mengirim pesan", "error");
    }
  },

  /**
   * Load and display chat history
   */
  loadChatHistory() {
    if (!this.chatContainer || !this.currentReportId) return;

    const messages = Storage.getChatMessages(this.currentReportId);
    this.renderMessages(messages);
    this.scrollToBottom();
  },

  /**
   * Render chat messages
   */
  renderMessages(messages) {
    if (!this.chatContainer) return;

    this.chatContainer.innerHTML = "";

    if (messages.length === 0) {
      this.chatContainer.innerHTML = `
        <div class="chat-empty">
          <p class="muted">Belum ada percakapan. Mulai chat untuk follow-up laporan ini.</p>
        </div>
      `;
      return;
    }

    messages.forEach((message) => {
      const messageElement = this.createMessageElement(message);
      this.chatContainer.appendChild(messageElement);
    });
  },

  /**
   * Create message element
   */
  createMessageElement(message) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${message.senderRole}`;

    const isOwnMessage = message.senderRole === this.userRole;
    const time = new Date(message.timestamp).toLocaleString();

    messageDiv.innerHTML = `
      <div class="message-header">
        <strong class="sender-name">
          ${message.senderRole === "officer" ? "🏛️ Petugas" : "👤 " + Utils.escapeHtml(message.sender)}
        </strong>
        <span class="message-time">${time}</span>
      </div>
      <div class="message-content">
        ${Utils.escapeHtml(message.message)}
      </div>
      <div class="message-status">
        ${isOwnMessage ? (message.isRead ? "✓✓ Dibaca" : "✓ Terkirim") : ""}
      </div>
    `;

    return messageDiv;
  },

  /**
   * Render chat interface in modal
   */
  renderChatInterface() {
    const report = Storage.getReport(this.currentReportId);
    if (!report) return;

    const chatModalContent = `
      <div class="chat-modal">
        <div class="chat-header">
          <h3>💬 Chat Follow-up</h3>
          <p class="muted">${Utils.escapeHtml(report.title)}</p>
          <button class="btn ghost" onclick="Modal.close()">
            <i class="fa fa-times"></i> Tutup
          </button>
        </div>
        
        <div class="chat-messages" id="chatContainer">
          <!-- Messages akan di-render di sini -->
        </div>
        
        <div class="chat-input-area">
          <textarea 
            id="chatInput" 
            placeholder="Tulis pesan follow-up..."
            rows="2"
          ></textarea>
          <button id="sendChatButton" class="btn primary">
            <i class="fa fa-paper-plane"></i> Kirim
          </button>
        </div>
      </div>
    `;

    // Open modal dengan chat interface
    if (window.Modal) {
      Modal.modalContent.innerHTML = chatModalContent;
      Modal.open();

      // Re-cache elements after modal render
      this.cacheDOMElements();
      this.bindEvents();
      this.loadChatHistory();
    }
  },

  /**
   * Simulate officer response (untuk demo)
   */
  simulateOfficerResponse() {
    const responses = [
      "Terima kasih laporannya. Kami akan segera menindaklanjuti.",
      "Laporan sedang kami review. Tim lapangan akan segera ke lokasi.",
      "Update: Tim sudah berada di lokasi dan sedang menangani masalah.",
      "Perbaikan sudah selesai dilakukan. Mohon konfirmasi jika masih ada masalah.",
    ];

    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];

    const officerMessage = {
      id: Utils.generateId(),
      reportId: this.currentReportId,
      sender: "Petugas Desa",
      senderRole: "officer",
      message: randomResponse,
      timestamp: Date.now(),
      isRead: false,
    };

    Storage.addChatMessage(officerMessage);
    this.loadChatHistory();
  },

  /**
   * Get unread messages count
   */
  getUnreadCount(reportId = null) {
    if (reportId) {
      return Storage.getChatMessages(reportId).filter(
        (m) => !m.isRead && m.senderRole !== this.userRole
      ).length;
    }

    // Get total unread across all reports
    return Storage.getAllChatMessages().filter(
      (m) => !m.isRead && m.senderRole !== this.userRole
    ).length;
  },

  /**
   * Mark messages as read
   */
  markAsRead(reportId) {
    Storage.markChatMessagesAsRead(reportId, this.userRole);
    this.loadChatHistory();
  },

  /**
   * Scroll chat to bottom
   */
  scrollToBottom() {
    if (this.chatContainer) {
      this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
  },

  /**
   * Switch user role (untuk testing)
   */
  switchRole(newRole) {
    this.userRole = newRole;
    if (this.currentReportId) {
      this.loadChatHistory();
    }
  },

  /**
   * Export chat history
   */
  exportChatHistory(reportId) {
    const messages = Storage.getChatMessages(reportId);
    const report = Storage.getReport(reportId);

    const exportData = {
      reportTitle: report.title,
      reportId: reportId,
      exportDate: new Date().toISOString(),
      messages: messages.map((msg) => ({
        sender: msg.sender,
        role: msg.senderRole,
        message: msg.message,
        timestamp: new Date(msg.timestamp).toISOString(),
      })),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `chat-history-${reportId}-${new Date().toISOString().split("T")[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
  },
};
