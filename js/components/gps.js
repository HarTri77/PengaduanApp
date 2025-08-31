/**
 * GPS Location Component
 * Handle automatic GPS location capture and location-based features
 */
const GPS = {
  // Current position
  currentPosition: null,
  watchId: null,

  // Permission status
  permissionGranted: false,
  permissionAsked: false,

  /**
   * Initialize GPS component
   */
  init() {
    this.checkGeolocationSupport();
    this.bindEvents();
  },

  /**
   * Check if geolocation is supported
   */
  checkGeolocationSupport() {
    if (!navigator.geolocation) {
      console.warn("Geolocation tidak didukung browser ini");
      return false;
    }
    return true;
  },

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Auto-detect location button
    const autoLocationBtn = document.getElementById("autoLocationBtn");
    if (autoLocationBtn) {
      autoLocationBtn.addEventListener("click", () => {
        this.requestCurrentLocation();
      });
    }

    // Manual location input
    const locationInput = document.getElementById("inpLocation");
    if (locationInput) {
      // Add GPS button next to location input
      this.addGPSButton(locationInput);
    }
  },

  /**
   * Add GPS button next to location input
   */
  addGPSButton(locationInput) {
    const gpsBtn = document.createElement("button");
    gpsBtn.type = "button";
    gpsBtn.className = "gps-btn";
    gpsBtn.innerHTML = "📍 GPS";
    gpsBtn.title = "Dapatkan lokasi otomatis";

    gpsBtn.addEventListener("click", () => {
      this.autoFillLocation(locationInput);
    });

    // Insert GPS button after location input
    locationInput.parentNode.insertBefore(gpsBtn, locationInput.nextSibling);
  },

  /**
   * Request current location permission and coordinates
   */
  async requestCurrentLocation() {
    if (!this.checkGeolocationSupport()) {
      Utils.showNotification("Geolocation tidak didukung", "error");
      return null;
    }

    try {
      const position = await this.getCurrentPosition();
      this.currentPosition = position;
      this.permissionGranted = true;

      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
    } catch (error) {
      this.handleLocationError(error);
      return null;
    }
  },

  /**
   * Get current position as Promise
   */
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      const options = {
        enableHighAccuracy: CONFIG.GPS.HIGH_ACCURACY,
        timeout: CONFIG.GPS.TIMEOUT,
        maximumAge: CONFIG.GPS.MAX_AGE,
      };

      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  },

  /**
   * Auto-fill location input with GPS data
   */
  async autoFillLocation(locationInput) {
    const gpsBtn = locationInput.nextSibling;
    if (gpsBtn) {
      gpsBtn.innerHTML = "⏳ Mencari...";
      gpsBtn.disabled = true;
    }

    try {
      const coords = await this.requestCurrentLocation();

      if (coords) {
        // Get human-readable address
        const address = await this.reverseGeocode(coords.lat, coords.lng);

        if (address) {
          locationInput.value = address;
          Utils.showNotification("Lokasi berhasil dideteksi", "success");
        } else {
          locationInput.value = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
          Utils.showNotification("Koordinat GPS berhasil didapat", "success");
        }

        // Store coordinates for report
        locationInput.dataset.gpsLat = coords.lat;
        locationInput.dataset.gpsLng = coords.lng;
      }
    } catch (error) {
      console.error("Error getting location:", error);
    } finally {
      if (gpsBtn) {
        gpsBtn.innerHTML = "📍 GPS";
        gpsBtn.disabled = false;
      }
    }
  },

  /**
   * Reverse geocoding - convert coordinates to address
   */
  async reverseGeocode(lat, lng) {
    try {
      // Using OpenStreetMap Nominatim API (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );

      if (!response.ok) throw new Error("Geocoding failed");

      const data = await response.json();

      if (data.display_name) {
        // Format address for Indonesian context
        const address = this.formatIndonesianAddress(data.address);
        return address || data.display_name;
      }

      return null;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return null;
    }
  },

  /**
   * Format address for Indonesian context
   */
  formatIndonesianAddress(addressComponents) {
    if (!addressComponents) return null;

    const parts = [];

    // Road/Street
    if (addressComponents.road) {
      parts.push(addressComponents.road);
    }

    // House number
    if (addressComponents.house_number) {
      parts[0] = `${addressComponents.road} No.${addressComponents.house_number}`;
    }

    // Village/Suburb
    if (addressComponents.village || addressComponents.suburb) {
      parts.push(addressComponents.village || addressComponents.suburb);
    }

    // District
    if (addressComponents.city_district || addressComponents.county) {
      parts.push(addressComponents.city_district || addressComponents.county);
    }

    // City
    if (addressComponents.city || addressComponents.town) {
      parts.push(addressComponents.city || addressComponents.town);
    }

    return parts.slice(0, 3).join(", "); // Limit to 3 parts
  },

  /**
   * Handle location errors
   */
  handleLocationError(error) {
    let message = "Gagal mendapatkan lokasi";

    switch (error.code) {
      case error.PERMISSION_DENIED:
        message =
          "Akses lokasi ditolak. Mohon izinkan akses lokasi di pengaturan browser.";
        break;
      case error.POSITION_UNAVAILABLE:
        message = "Informasi lokasi tidak tersedia.";
        break;
      case error.TIMEOUT:
        message = "Timeout saat mencari lokasi.";
        break;
      default:
        message = "Error tidak diketahui saat mencari lokasi.";
        break;
    }

    Utils.showNotification(message, "error");
    this.permissionGranted = false;
  },

  /**
   * Get GPS coordinates from form data
   */
  getGPSFromForm() {
    const locationInput = document.getElementById("inpLocation");

    if (
      locationInput &&
      locationInput.dataset.gpsLat &&
      locationInput.dataset.gpsLng
    ) {
      return {
        lat: parseFloat(locationInput.dataset.gpsLat),
        lng: parseFloat(locationInput.dataset.gpsLng),
      };
    }

    return null;
  },

  /**
   * Calculate distance between two points
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    return Storage.calculateDistance(lat1, lng1, lat2, lng2);
  },

  /**
   * Find nearby reports
   */
  findNearbyReports(
    centerLat,
    centerLng,
    radiusKm = CONFIG.GPS.DEFAULT_RADIUS
  ) {
    return Storage.getReportsByLocation(
      { lat: centerLat, lng: centerLng },
      radiusKm
    );
  },

  /**
   * Show reports on map (placeholder for future map integration)
   */
  showReportsOnMap(reports) {
    // This would integrate with a mapping service like Leaflet or Google Maps
    console.log("Map integration not implemented yet");

    // For now, just show list of nearby reports
    const locations = reports.map((report) => ({
      title: report.title,
      location: report.location,
      distance: this.currentPosition
        ? this.calculateDistance(
            this.currentPosition.coords.latitude,
            this.currentPosition.coords.longitude,
            report.gpsCoordinates.lat,
            report.gpsCoordinates.lng
          ).toFixed(1) + " km"
        : "Unknown",
    }));

    return locations;
  },

  /**
   * Start watching position changes
   */
  startWatching() {
    if (!this.checkGeolocationSupport()) return;

    const options = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 60000,
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.currentPosition = position;
        this.onPositionChange(position);
      },
      (error) => {
        console.warn("Position watch error:", error);
      },
      options
    );
  },

  /**
   * Stop watching position changes
   */
  stopWatching() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  },

  /**
   * Handle position change events
   */
  onPositionChange(position) {
    // This can be used for real-time location tracking
    // For example, updating user's location in reports
    console.log("Position updated:", position.coords);
  },

  /**
   * Check if location permission is granted
   */
  async checkPermission() {
    if ("permissions" in navigator) {
      try {
        const result = await navigator.permissions.query({
          name: "geolocation",
        });
        this.permissionGranted = result.state === "granted";
        return result.state;
      } catch (error) {
        console.warn("Permission API not supported");
        return "unknown";
      }
    }
    return "unknown";
  },

  /**
   * Get current coordinates (if available)
   */
  getCurrentCoordinates() {
    if (this.currentPosition) {
      return {
        lat: this.currentPosition.coords.latitude,
        lng: this.currentPosition.coords.longitude,
        accuracy: this.currentPosition.coords.accuracy,
      };
    }
    return null;
  },

  /**
   * Format coordinates for display
   */
  formatCoordinates(lat, lng) {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  },

  /**
   * Export location data
   */
  exportLocationData() {
    const reportsWithGPS = Storage.reports.filter((r) => r.gpsCoordinates);

    const locationData = {
      exportDate: new Date().toISOString(),
      totalReports: Storage.reports.length,
      reportsWithGPS: reportsWithGPS.length,
      locations: reportsWithGPS.map((report) => ({
        id: report.id,
        title: report.title,
        location: report.location,
        coordinates: report.gpsCoordinates,
        status: report.status,
        createdAt: new Date(report.createdAt).toISOString(),
      })),
    };

    Storage.downloadData(
      locationData,
      `location-export-${new Date().toISOString().split("T")[0]}`,
      "json"
    );
  },
};
