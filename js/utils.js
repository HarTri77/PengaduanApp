/**
 * Utility Functions
 */
const Utils = {
  /**
   * Generate unique ID
   * @returns {string} Unique identifier
   */
  generateId() {
    return Math.random().toString(36).slice(2, 9);
  },

  /**
   * Get current timestamp formatted for display
   * @returns {string} Formatted date string
   */
  getCurrentTime() {
    return new Date().toLocaleString();
  },

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    if (!text) return "";
    return text
      .toString()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  },

  /**
   * Convert file to data URL
   * @param {File} file - File object
   * @returns {Promise<string>} Data URL
   */
  async fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Get status label from status code
   * @param {string} status - Status code
   * @returns {string} Human readable status
   */
  getStatusLabel(status) {
    return CONFIG.STATUS_LABELS[status] || status;
  },

  /**
   * Truncate text to specified length
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  truncateText(text, maxLength = CONFIG.UI.MAX_DESCRIPTION_LENGTH) {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  },

  /**
   * Debounce function calls
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  },

  /**
   * Format number with proper pluralization
   * @param {number} count - Count
   * @param {string} singular - Singular form
   * @param {string} plural - Plural form
   * @returns {string} Formatted string
   */
  formatCount(count, singular, plural) {
    return `${count} ${count === 1 ? singular : plural}`;
  },

  /**
   * Sort array by property
   * @param {Array} array - Array to sort
   * @param {string} property - Property to sort by
   * @param {string} order - 'asc' or 'desc'
   * @returns {Array} Sorted array
   */
  sortBy(array, property, order = 'desc') {
    return [...array].sort((a, b) => {
      const aVal = a[property];
      const bVal = b[property];
      
      if (order === 'desc') {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      }
    });
  },

  /**
   * Filter array by multiple criteria
   * @param {Array} array - Array to filter
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered array
   */
  filterBy(array, filters) {
    return array.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === 'all' || value === '') return true;
        return item[key] === value;
      });
    });
  },

  /**
   * Search array by text in multiple properties
   * @param {Array} array - Array to search
   * @param {string} query - Search query
   * @param {Array} properties - Properties to search in
   * @returns {Array} Filtered array
   */
  searchBy(array, query, properties) {
    if (!query.trim()) return array;
    
    const lowerQuery = query.toLowerCase();
    return array.filter(item => {
      return properties.some(prop => {
        const value = item[prop];
        return value && value.toString().toLowerCase().includes(lowerQuery);
      });
    });
  },

  /**
   * Show notification/alert with better UX
   * @param {string} message - Message to show
   * @param {string} type - Type: 'success', 'error', 'info'
   */
  showNotification(message, type = 'info') {
    // For now, use alert, but this can be enhanced with custom notifications
    alert(message);
  },

  /**
   * Validate form data
   * @param {Object} data - Form data to validate
   * @param {Object} rules - Validation rules
   * @returns {Object} Validation result
   */
  validateForm(data, rules) {
    const errors = {};
    
    Object.entries(rules).forEach(([field, rule]) => {
      const value = data[field];
      
      if (rule.required && (!value || value.toString().trim() === '')) {
        errors[field] = `${rule.label || field} is required`;
      }
      
      if (value && rule.minLength && value.length < rule.minLength) {
        errors[field] = `${rule.label || field} must be at least ${rule.minLength} characters`;
      }
      
      if (value && rule.maxLength && value.length > rule.maxLength) {
        errors[field] = `${rule.label || field} must be no more than ${rule.maxLength} characters`;
      }
      
      if (value && rule.pattern && !rule.pattern.test(value)) {
        errors[field] = rule.message || `${rule.label || field} is invalid`;
      }
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};