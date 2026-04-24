// ==========================================
// SearchQuery Model — Data structure สำหรับ search request
// ==========================================

class SearchQuery {
  static VALID_CATEGORIES = ['all', 'hotel', 'restaurant', 'sport', 'tourist'];
  static VALID_RADII = [1, 3, 5];
  static CATEGORY_QUERIES = {
    hotel: 'hotels',
    restaurant: 'restaurants',
    sport: 'sports complex',
    tourist: 'tourist attractions',
    all: 'places of interest',
  };

  /**
   * @param {Object} data
   * @param {number} data.latitude
   * @param {number} data.longitude
   * @param {number} [data.radius=3]
   * @param {string} [data.category='all']
   */
  constructor(data = {}) {
    this.latitude = data.latitude != null ? data.latitude : null;
    this.longitude = data.longitude != null ? data.longitude : null;
    this.radius = data.radius || 3;
    this.category = SearchQuery.VALID_CATEGORIES.includes(data.category) ? data.category : 'all';
  }

  /** ตรวจสอบ latitude ถูกต้อง */
  isValidLatitude() {
    return (
      this.latitude !== null &&
      typeof this.latitude === 'number' &&
      !isNaN(this.latitude) &&
      this.latitude >= -90 &&
      this.latitude <= 90
    );
  }

  /** ตรวจสอบ longitude ถูกต้อง */
  isValidLongitude() {
    return (
      this.longitude !== null &&
      typeof this.longitude === 'number' &&
      !isNaN(this.longitude) &&
      this.longitude >= -180 &&
      this.longitude <= 180
    );
  }

  /** ตรวจสอบ query ทั้งหมด */
  validate() {
    const errors = [];
    if (!this.isValidLatitude()) errors.push('INVALID_LATITUDE');
    if (!this.isValidLongitude()) errors.push('INVALID_LONGITUDE');
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /** สร้าง query string สำหรับ SerpAPI */
  getSearchQuery() {
    return SearchQuery.CATEGORY_QUERIES[this.category] || SearchQuery.CATEGORY_QUERIES.all;
  }

  /** สร้าง location bias string สำหรับ Google Maps */
  getLocationBias() {
    if (!this.isValidLatitude() || !this.isValidLongitude()) return '';
    return `@${this.latitude},${this.longitude},14z`;
  }

  /** สร้าง SerpAPI parameters */
  toSerpApiParams(apiKey) {
    const validation = this.validate();
    if (!validation.valid) return null;

    return {
      engine: 'google_maps',
      q: this.getSearchQuery(),
      ll: this.getLocationBias(),
      type: 'search',
      api_key: apiKey,
    };
  }

  /** แปลงเป็น JSON body สำหรับ POST */
  toJSON() {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
      radius: this.radius,
      category: this.category,
    };
  }
}

module.exports = SearchQuery;
