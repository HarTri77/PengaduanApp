/**
 * Application Configuration - Updated with new features
 */
const CONFIG = {
  // Local Storage Keys
  STORAGE_KEYS: {
    REPORTS: "pa_reports_v2",
    PROFILE: "pa_profile_v2",
    RATINGS: "pa_ratings_v2",
    CHAT_MESSAGES: "pa_chat_messages_v1", // New
    ESCALATIONS: "pa_escalations_v1", // New
  },

  // Default Profile Data
  DEFAULT_PROFILE: {
    name: "Tri",
    email: "tri@example.com",
    avatarData: null,
    role: "citizen", // New: citizen or officer
  },

  // Report Status Labels
  STATUS_LABELS: {
    baru: "Baru",
    proses: "Proses",
    selesai: "Selesai",
  },

  // Report Priority Labels
  PRIORITY_LABELS: {
    urgent: "Urgent",
    normal: "Normal",
    rendah: "Rendah",
  },

  // Priority Colors
  PRIORITY_COLORS: {
    urgent: "#ff4444",
    normal: "#ffaa00",
    rendah: "#00aa44",
  },

  // UI Constants
  UI: {
    MAX_LATEST_REPORTS: 6,
    MAX_DESCRIPTION_LENGTH: 140,
    ANIMATION_DURATION: 250,
    DASHBOARD_CHART_COLORS: ["#b71c1c", "#ff4d4d", "#ffbcbc", "#ff8a80"],
  },

  // File Upload Settings
  FILE_UPLOAD: {
    ACCEPTED_TYPES: "image/*,video/*",
    MAX_PREVIEW_WIDTH: 110,
    MAX_PREVIEW_HEIGHT: 80,
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  },

  // Rating Settings
  RATING: {
    MIN_STARS: 1,
    MAX_STARS: 5,
  },

  // Chat Settings
  CHAT: {
    MAX_MESSAGE_LENGTH: 500,
    REFRESH_INTERVAL: 30000, // 30 seconds
    TYPING_TIMEOUT: 3000, // 3 seconds
  },

  // Escalation Settings
  ESCALATION: {
    AUTO_ESCALATE_DAYS: 7, // Auto escalate after 7 days
    WARNING_DAYS: 5, // Show warning after 5 days
    URGENT_PRIORITY_DAYS: 3, // Escalate urgent reports after 3 days
  },

  // GPS Settings
  GPS: {
    DEFAULT_RADIUS: 5, // 5km radius for location search
    HIGH_ACCURACY: true,
    TIMEOUT: 10000, // 10 seconds
    MAX_AGE: 300000, // 5 minutes
  },

  // Export Settings
  EXPORT: {
    DEFAULT_FORMAT: "json",
    BATCH_SIZE: 1000,
    INCLUDE_ATTACHMENTS: false, // For now, exclude base64 files to keep size reasonable
  },

  // Notification Settings
  NOTIFICATIONS: {
    AUTO_HIDE_DELAY: 5000, // 5 seconds
    TYPES: {
      SUCCESS: "success",
      ERROR: "error",
      WARNING: "warning",
      INFO: "info",
    },
  },

  // Dashboard Widget Settings
  DASHBOARD: {
    STATS_REFRESH_INTERVAL: 60000, // 1 minute
    CHART_ANIMATION_DURATION: 1000,
    MAX_RECENT_ACTIVITIES: 10,
    SHOW_TRENDS: true,
  },

  // Performance Settings
  PERFORMANCE: {
    DEBOUNCE_DELAY: 300, // milliseconds
    VIRTUAL_SCROLL_THRESHOLD: 100, // Enable virtual scrolling after 100 items
    IMAGE_LAZY_LOADING: true,
  },

  // Feature Flags
  FEATURES: {
    GPS_LOCATION: true,
    CHAT_SYSTEM: true,
    AUTO_ESCALATION: true,
    EXPORT_REPORTS: true,
    ADVANCED_ANALYTICS: true,
    REAL_TIME_NOTIFICATIONS: false, // For future implementation
    MULTI_LANGUAGE: false, // For future implementation
  },
};
