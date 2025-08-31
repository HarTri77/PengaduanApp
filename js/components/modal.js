/**
 * Modal Component
 */
const Modal = {
  // DOM Elements
  modalBackdrop: null,
  modalContent: null,
  
  // State
  currentReportId: null,
  isOpen: false,

  /**
   * Initialize modal component
   */
  init() {
    this.cacheDOMElements();
    this.bindEvents();
  },

  /**
   * Cache DOM elements
   */
  cacheDOMElements() {
    this.modalBackdrop = document.getElementById('modalBackdrop');
    this.modalContent = document.getElementById('modalContent');
  },

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Close modal when clicking backdrop
    if (this.modalBackdrop) {
      this.modalBackdrop.addEventListener('click', (e) => {
        if (e.target === this.modalBackdrop) {
          this.close();
        }
      });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  },

  /**
   * Open report detail modal
   */
  openReportDetail(reportId) {
    const report = Storage.getReport(reportId);
    if (!report) {
      Utils.showNotification('Laporan tidak ditemukan', 'error');
      return;
    }

    this.currentReportId = reportId;
    this.renderReportDetail(report);
    this.open();
  },

  /**
   * Render report detail content
   */
  renderReportDetail(report) {
    if (!this.modalContent) return;

    const filesDisplay = this.renderFiles(report.files);
    const statusBadge = `<span class="badge ${report.status}">${Utils.getStatusLabel(report.status)}</span>`;

    this.modalContent.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h2>Detail Laporan</h2>
        <button class="btn ghost" id="closeModal">
          <i class="fa fa-times"></i> Tutup
        </button>
      </div>
      
      <div class="modal-body">
        <div style="margin-bottom:12px;">
          <h3 style="font-weight:700;font-size:1.2rem;color:#ffdede;margin-bottom:6px;">
            ${Utils.escapeHtml(report.title)}
          </h3>
          <div class="muted" style="margin-bottom:8px;">
            <i class="fa fa-map-marker-alt"></i> ${Utils.escapeHtml(report.location)} • 
            <i class="fa fa-clock"></i> ${new Date(report.createdAt).toLocaleString()}
          </div>
          <div style="margin-bottom:8px;">
            <i class="fa fa-user"></i> Dilaporkan oleh: <strong>${Utils.escapeHtml(report.name)}</strong>
          </div>
          <div>Status: ${statusBadge}</div>
        </div>

        <div style="margin-bottom:16px;">
          <h4 style="color:#ffdddd;margin-bottom:8px;">Deskripsi</h4>
          <p style="color:#ddd;line-height:1.6;">${Utils.escapeHtml(report.description)}</p>
        </div>

        ${filesDisplay}

        <div style="margin-top:20px;">
          <h4 style="color:#ffdddd;margin-bottom:12px;">Aksi</h4>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn primary" id="markProses">
              <i class="fa fa-play"></i> Tandai Proses
            </button>
            <button class="btn ghost" id="markSelesai">
              <i class="fa fa-check"></i> Tandai Selesai
            </button>
            <button class="btn ghost" id="editReport" style="margin-left:auto;">
              <i class="fa fa-edit"></i> Edit
            </button>
            <button class="btn ghost" id="delBtn" style="background:rgba(255,77,77,0.1);color:#ff4d4d;">
              <i class="fa fa-trash"></i> Hapus
            </button>
          </div>
        </div>
      </div>
    `;

    // Bind modal-specific events
    this.bindModalEvents();
  },

  /**
   * Render files display
   */
  renderFiles(files) {
    if (!files || files.length === 0) {
      return `
        <div style="margin-bottom:16px;">
          <h4 style="color:#ffdddd;margin-bottom:8px;">Bukti</h4>
          <div class="muted">Tidak ada bukti yang dilampirkan</div>
        </div>
      `;
    }

    const filesHtml = files.map(file => `
      <img src="${file}" 
           style="width:150px;height:100px;object-fit:cover;border-radius:8px;margin-right:8px;margin-bottom:8px;cursor:pointer;" 
           onclick="Modal.viewImage('${file}')"
           alt="Bukti laporan">
    `).join('');

    return `
      <div style="margin-bottom:16px;">
        <h4 style="color:#ffdddd;margin-bottom:8px;">Bukti (${files.length} file)</h4>
        <div style="display:flex;flex-wrap:wrap;">
          ${filesHtml}
        </div>
      </div>
    `;
  },

  /**
   * Bind modal-specific event listeners
   */
  bindModalEvents() {
    // Close button
    const closeBtn = document.getElementById('closeModal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Status change buttons
    const markProsesBtn = document.getElementById('markProses');
    if (markProsesBtn) {
      markProsesBtn.addEventListener('click', () => {
        this.changeReportStatus('proses');
      });
    }

    const markSelesaiBtn = document.getElementById('markSelesai');
    if (markSelesaiBtn) {
      markSelesaiBtn.addEventListener('click', () => {
        this.changeReportStatus('selesai');
      });
    }

    // Edit button
    const editBtn = document.getElementById('editReport');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        this.editReport();
      });
    }

    // Delete button
    const delBtn = document.getElementById('delBtn');
    if (delBtn) {
      delBtn.addEventListener('click', () => {
        this.deleteReport();
      });
    }
  },

  /**
   * Change report status
   */
  changeReportStatus(newStatus) {
    if (!this.currentReportId) return;

    try {
      Storage.updateReport(this.currentReportId, { status: newStatus });
      
      // Update UI
      if (window.Reports) {
        Reports.updateStats();
        Reports.renderReports();
        Reports.renderLatest();
      }
      
      Utils.showNotification(`Status berhasil diubah ke ${Utils.getStatusLabel(newStatus)}`, 'success');
      this.close();
    } catch (error) {
      console.error('Error updating report status:', error);
      Utils.showNotification('Terjadi kesalahan saat mengubah status', 'error');
    }
  },

  /**
   * Edit report
   */
  editReport() {
    // For now, just close modal and navigate to form
    // In a full implementation, you'd populate the form with existing data
    Utils.showNotification('Fitur edit akan segera tersedia', 'info');
    this.close();
    
    if (window.Navigation) {
      Navigation.navigateTo('form');
    }
  },

  /**
   * Delete report
   */
  deleteReport() {
    if (!this.currentReportId) return;

    const confirmed = confirm('Apakah Anda yakin ingin menghapus laporan ini? Aksi ini tidak dapat dibatalkan.');
    
    if (confirmed) {
      try {
        Storage.deleteReport(this.currentReportId);
        
        // Update UI
        if (window.Reports) {
          Reports.updateStats();
          Reports.renderReports();
          Reports.renderLatest();
        }
        
        Utils.showNotification('Laporan berhasil dihapus', 'success');
        this.close();
      } catch (error) {
        console.error('Error deleting report:', error);
        Utils.showNotification('Terjadi kesalahan saat menghapus laporan', 'error');
      }
    }
  },

  /**
   * View image in full size
   */
  viewImage(imageSrc) {
    const imageModal = document.createElement('div');
    imageModal.className = 'modal-backdrop';
    imageModal.style.display = 'flex';
    imageModal.style.zIndex = '200';
    
    imageModal.innerHTML = `
      <div style="max-width:90vw;max-height:90vh;background:transparent;padding:20px;">
        <img src="${imageSrc}" 
             style="max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;" 
             alt="Gambar bukti">
        <div style="text-align:center;margin-top:12px;">
          <button class="btn ghost" onclick="this.closest('.modal-backdrop').remove()">
            <i class="fa fa-times"></i> Tutup
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(imageModal);
    
    // Close on backdrop click
    imageModal.addEventListener('click', (e) => {
      if (e.target === imageModal) {
        imageModal.remove();
      }
    });
  },

  /**
   * Open modal
   */
  open() {
    if (this.modalBackdrop) {
      this.modalBackdrop.style.display = 'flex';
      this.isOpen = true;
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }
  },

  /**
   * Close modal
   */
  close() {
    if (this.modalBackdrop) {
      this.modalBackdrop.style.display = 'none';
      this.isOpen = false;
      this.currentReportId = null;
      
      // Restore body scroll
      document.body.style.overflow = '';
    }
  },

  /**
   * Check if modal is currently open
   */
  isModalOpen() {
    return this.isOpen;
  }
};