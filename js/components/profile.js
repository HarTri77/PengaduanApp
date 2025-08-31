/**
 * Profile Component
 */
const Profile = {
  // DOM Elements
  avatarEl: null,
  profileNameEl: null,
  profileEmailEl: null,
  profileForm: null,
  avatarPreview: null,
  profileInputs: {},

  /**
   * Initialize profile component
   */
  init() {
    this.cacheDOMElements();
    this.bindEvents();
    this.refreshProfileUI();
  },

  /**
   * Cache DOM elements
   */
  cacheDOMElements() {
    this.avatarEl = document.getElementById('avatarEl');
    this.profileNameEl = document.getElementById('profileName');
    this.profileEmailEl = document.getElementById('profileEmail');
    this.profileForm = document.getElementById('profileForm');
    this.avatarPreview = document.getElementById('avatarPreview');
    
    this.profileInputs = {
      name: document.getElementById('profile_name'),
      email: document.getElementById('profile_email'),
      avatar: document.getElementById('profile_avatar'),
    };
  },

  /**
   * Bind event listeners
   */
  bindEvents() {
    if (this.profileForm) {
      this.profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleProfileSubmit();
      });
    }

    if (this.profileInputs.avatar) {
      this.profileInputs.avatar.addEventListener('change', (e) => {
        this.handleAvatarChange(e);
      });
    }
  },

  /**
   * Handle profile form submission
   */
  async handleProfileSubmit() {
    try {
      const formData = this.getFormData();
      const validation = this.validateProfileData(formData);
      
      if (!validation.isValid) {
        const errorMsg = Object.values(validation.errors).join('\n');
        Utils.showNotification(errorMsg, 'error');
        return;
      }

      // Update profile in storage
      Storage.updateProfile(formData);
      this.refreshProfileUI();
      
      Utils.showNotification('Profil berhasil disimpan', 'success');
    } catch (error) {
      console.error('Error saving profile:', error);
      Utils.showNotification('Terjadi kesalahan saat menyimpan profil', 'error');
    }
  },

  /**
   * Handle avatar file change
   */
  async handleAvatarChange(event) {
    try {
      const file = event.target.files[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        Utils.showNotification('Hanya file gambar yang diperbolehkan', 'error');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        Utils.showNotification('Ukuran file terlalu besar (maksimal 2MB)', 'error');
        return;
      }

      const dataURL = await Utils.fileToDataURL(file);
      
      // Update profile with new avatar
      Storage.updateProfile({ avatarData: dataURL });
      
      this.refreshProfileUI();
      this.updateAvatarPreview(dataURL);
      
    } catch (error) {
      console.error('Error processing avatar:', error);
      Utils.showNotification('Terjadi kesalahan saat memproses gambar', 'error');
    }
  },

  /**
   * Get form data
   */
  getFormData() {
    return {
      name: this.profileInputs.name?.value?.trim() || '',
      email: this.profileInputs.email?.value?.trim() || '',
    };
  },

  /**
   * Validate profile data
   */
  validateProfileData(data) {
    const rules = {
      name: {
        required: true,
        minLength: 2,
        maxLength: 50,
        label: 'Nama'
      },
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        label: 'Email',
        message: 'Format email tidak valid'
      }
    };

    return Utils.validateForm(data, rules);
  },

  /**
   * Refresh profile UI elements
   */
  refreshProfileUI() {
    const profile = Storage.getProfile();
    
    if (this.profileNameEl) {
      this.profileNameEl.textContent = profile.name || 'Anon';
    }
    
    if (this.profileEmailEl) {
      this.profileEmailEl.textContent = profile.email || '—';
    }
    
    this.updateAvatarDisplay(profile);
  },

  /**
   * Update avatar display
   */
  updateAvatarDisplay(profile) {
    if (!this.avatarEl) return;

    if (profile.avatarData) {
      this.avatarEl.style.backgroundImage = `url(${profile.avatarData})`;
      this.avatarEl.style.backgroundSize = 'cover';
      this.avatarEl.style.backgroundPosition = 'center';
      this.avatarEl.textContent = '';
    } else {
      this.avatarEl.style.backgroundImage = 'none';
      this.avatarEl.style.background = '#222';
      this.avatarEl.textContent = (profile.name || 'U').slice(0, 2).toUpperCase();
    }
  },

  /**
   * Update avatar preview
   */
  updateAvatarPreview(dataURL) {
    if (!this.avatarPreview) return;

    if (dataURL) {
      this.avatarPreview.style.backgroundImage = `url(${dataURL})`;
      this.avatarPreview.style.backgroundSize = 'cover';
      this.avatarPreview.style.backgroundPosition = 'center';
      this.avatarPreview.textContent = '';
    } else {
      this.avatarPreview.style.backgroundImage = 'none';
      this.avatarPreview.textContent = 'Preview';
    }
  },

  /**
   * Fill profile form with current data
   */
  fillProfileForm() {
    const profile = Storage.getProfile();
    
    if (this.profileInputs.name) {
      this.profileInputs.name.value = profile.name || '';
    }
    
    if (this.profileInputs.email) {
      this.profileInputs.email.value = profile.email || '';
    }
    
    this.updateAvatarPreview(profile.avatarData);
  },

  /**
   * Reset profile form
   */
  resetForm() {
    if (this.profileForm) {
      this.profileForm.reset();
    }
    this.updateAvatarPreview(null);
  },

  /**
   * Get avatar initials
   */
  getAvatarInitials(name) {
    if (!name) return 'U';
    return name.trim().slice(0, 2).toUpperCase();
  }
}