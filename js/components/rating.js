/**
 * Rating Component
 */
const Rating = {
  // DOM Elements
  ratingStars: null,
  ratingComment: null,
  submitRatingBtn: null,
  avgRatingEl: null,
  totalRatingsEl: null,
  ratingListEl: null,
  
  // State
  currentRating: 0,

  /**
   * Initialize rating component
   */
  init() {
    this.cacheDOMElements();
    this.bindEvents();
    this.renderRatingOverview();
  },

  /**
   * Cache DOM elements
   */
  cacheDOMElements() {
    this.ratingStars = document.querySelectorAll('#ratingInput .star');
    this.ratingComment = document.getElementById('ratingComment');
    this.submitRatingBtn = document.getElementById('submitRating');
    this.avgRatingEl = document.getElementById('avgRating');
    this.totalRatingsEl = document.getElementById('totalRatings');
    this.ratingListEl = document.getElementById('ratingList');
  },

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Star interactions
    this.ratingStars.forEach(star => {
      star.addEventListener('mouseenter', () => {
        const value = parseInt(star.dataset.value);
        this.highlightStars(value);
      });

      star.addEventListener('mouseleave', () => {
        this.highlightStars(this.currentRating);
      });

      star.addEventListener('click', () => {
        this.currentRating = parseInt(star.dataset.value);
        this.highlightStars(this.currentRating);
      });
    });

    // Submit rating
    if (this.submitRatingBtn) {
      this.submitRatingBtn.addEventListener('click', () => {
        this.handleSubmitRating();
      });
    }

    // Allow Enter key in comment textarea
    if (this.ratingComment) {
      this.ratingComment.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
          this.handleSubmitRating();
        }
      });
    }
  },

  /**
   * Highlight stars up to given number
   */
  highlightStars(count) {
    this.ratingStars.forEach(star => {
      const value = parseInt(star.dataset.value);
      star.classList.toggle('active', value <= count);
    });
  },

  /**
   * Handle rating submission
   */
  handleSubmitRating() {
    try {
      if (this.currentRating === 0) {
        Utils.showNotification('Pilih rating (1-5 bintang)', 'error');
        return;
      }

      const comment = this.ratingComment?.value?.trim() || '';
      
      // Validate rating
      const validation = this.validateRating(this.currentRating, comment);
      if (!validation.isValid) {
        Utils.showNotification(validation.error, 'error');
        return;
      }

      // Add rating to storage
      Storage.addRating({
        score: this.currentRating,
        comment: comment,
      });

      // Reset form
      this.resetRatingForm();
      
      // Update display
      this.renderRatingOverview();
      
      Utils.showNotification('Terima kasih atas rating Anda', 'success');
    } catch (error) {
      console.error('Error submitting rating:', error);
      Utils.showNotification('Terjadi kesalahan saat mengirim rating', 'error');
    }
  },

  /**
   * Validate rating data
   */
  validateRating(score, comment) {
    if (score < CONFIG.RATING.MIN_STARS || score > CONFIG.RATING.MAX_STARS) {
      return {
        isValid: false,
        error: `Rating harus antara ${CONFIG.RATING.MIN_STARS}-${CONFIG.RATING.MAX_STARS} bintang`
      };
    }

    if (comment.length > 500) {
      return {
        isValid: false,
        error: 'Komentar terlalu panjang (maksimal 500 karakter)'
      };
    }

    return { isValid: true };
  },

  /**
   * Reset rating form
   */
  resetRatingForm() {
    this.currentRating = 0;
    this.highlightStars(0);
    
    if (this.ratingComment) {
      this.ratingComment.value = '';
    }
  },

  /**
   * Render rating overview and list
   */
  renderRatingOverview() {
    const ratingData = Storage.getRatings();
    
    this.updateRatingSummary(ratingData);
    this.renderRatingsList(ratingData.ratings);
  },

  /**
   * Update rating summary display
   */
  updateRatingSummary(ratingData) {
    if (this.avgRatingEl) {
      const displayRating = ratingData.totalRatings > 0 ? ratingData.averageRating : '—';
      this.avgRatingEl.textContent = displayRating;
    }

    if (this.totalRatingsEl) {
      const label = Utils.formatCount(ratingData.totalRatings, 'review', 'reviews');
      this.totalRatingsEl.textContent = label;
    }
  },

  /**
   * Render ratings list
   */
  renderRatingsList(ratings) {
    if (!this.ratingListEl) return;

    this.ratingListEl.innerHTML = '';

    if (ratings.length === 0) {
      this.ratingListEl.innerHTML = '<div class="muted">Belum ada rating</div>';
      return;
    }

    ratings.forEach(rating => {
      const ratingCard = this.createRatingCard(rating);
      this.ratingListEl.appendChild(ratingCard);
    });
  },

  /**
   * Create rating card element
   */
  createRatingCard(rating) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '8px';

    const starsDisplay = this.generateStarsDisplay(rating.score);
    const timeDisplay = new Date(rating.at).toLocaleString();
    const comment = rating.comment || '(tanpa komentar)';

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <div>
          <strong>Pengguna</strong>
          <div class="muted" style="font-size: 0.85rem;">${timeDisplay}</div>
        </div>
        <div style="font-size: 1.1rem; color: #ffdede;">${starsDisplay}</div>
      </div>
      <p style="color: #ddd;">${Utils.escapeHtml(comment)}</p>
      ${this.renderRatingActions(rating.id)}
    `;

    return card;
  },

  /**
   * Generate stars display for rating
   */
  generateStarsDisplay(score) {
    const filledStars = '★'.repeat(score);
    const emptyStars = '☆'.repeat(CONFIG.RATING.MAX_STARS - score);
    return filledStars + emptyStars;
  },

  /**
   * Render rating actions (if needed)
   */
  renderRatingActions(ratingId) {
    // For now, no actions needed for ratings
    // But this can be extended for edit/delete functionality
    return '';
  },

  /**
   * Get current rating statistics
   */
  getRatingStats() {
    const ratingData = Storage.getRatings();
    
    // Calculate distribution
    const distribution = {};
    for (let i = 1; i <= CONFIG.RATING.MAX_STARS; i++) {
      distribution[i] = 0;
    }
    
    ratingData.ratings.forEach(rating => {
      distribution[rating.score] = (distribution[rating.score] || 0) + 1;
    });

    return {
      average: parseFloat(ratingData.averageRating) || 0,
      total: ratingData.totalRatings,
      distribution: distribution,
      latest: ratingData.ratings.slice(0, 5) // Get 5 latest ratings
    };
  },

  /**
   * Export ratings data
   */
  exportRatings() {
    const ratingData = Storage.getRatings();
    const exportData = {
      exportDate: new Date().toISOString(),
      summary: {
        totalRatings: ratingData.totalRatings,
        averageRating: ratingData.averageRating
      },
      ratings: ratingData.ratings.map(rating => ({
        score: rating.score,
        comment: rating.comment,
        date: new Date(rating.at).toISOString()
      }))
    };

    // Create download link
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ratings-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }
};