// ==========================================
// Place Model — Data structure สำหรับสถานที่
// ==========================================

class Place {
  /**
   * @param {Object} data
   * @param {string} data.name - ชื่อสถานที่
   * @param {string} data.category - หมวดหมู่ (hotel, restaurant, sport, tourist)
   * @param {number} data.lat - Latitude
   * @param {number} data.lng - Longitude
   * @param {string} [data.address] - ที่อยู่
   * @param {number} [data.rating] - คะแนน (0-5)
   * @param {number} [data.distance] - ระยะทาง (km)
   * @param {string} [data.type] - ประเภทจาก API
   * @param {string} [data.thumbnail] - URL รูปภาพ
   */
  constructor(data = {}) {
    this.name = data.name || 'Unknown';
    this.category = Place.normalizeCategory(data.category);
    this.lat = data.lat ?? null;
    this.lng = data.lng ?? null;
    this.address = data.address || '';
    this.rating = data.rating ?? null;
    this.distance = data.distance ?? null;
    this.type = data.type || '';
    this.thumbnail = data.thumbnail || '';
  }

  /** ตรวจสอบว่าพิกัดถูกต้อง */
  hasValidCoordinates() {
    return (
      this.lat !== null &&
      this.lng !== null &&
      typeof this.lat === 'number' &&
      typeof this.lng === 'number' &&
      this.lat >= -90 && this.lat <= 90 &&
      this.lng >= -180 && this.lng <= 180
    );
  }

  /** ตรวจสอบว่ามี rating หรือไม่ */
  hasRating() {
    return this.rating !== null && typeof this.rating === 'number' && this.rating >= 0 && this.rating <= 5;
  }

  /** คำนวณระยะทางจากจุดกำหนด (Haversine Formula) */
  static calculateDistance(lat1, lng1, lat2, lng2) {
    if ([lat1, lng1, lat2, lng2].some(v => typeof v !== 'number' || isNaN(v))) {
      return NaN;
    }
    const toRad = (v) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /** คำนวณระยะห่างจากพิกัดที่กำหนด */
  distanceFrom(lat, lng) {
    if (!this.hasValidCoordinates()) return NaN;
    return Place.calculateDistance(lat, lng, this.lat, this.lng);
  }

  /** ตรวจสอบว่าอยู่ในรัศมีที่กำหนดหรือไม่ */
  isWithinRadius(centerLat, centerLng, radiusKm) {
    const dist = this.distanceFrom(centerLat, centerLng);
    if (isNaN(dist)) return false;
    return dist <= radiusKm;
  }

  /** แสดงระยะทางในรูปแบบ text */
  getDistanceText(dict = { unit_km: 'km', unit_m: 'm' }) {
    if (this.distance == null) return '';
    if (this.distance < 1) {
      return `${(this.distance * 1000).toFixed(0)} ${dict.unit_m}`;
    }
    return `${this.distance.toFixed(1)} ${dict.unit_km}`;
  }

  /** Normalize category ให้เป็นค่าที่ระบบรองรับ */
  static normalizeCategory(category) {
    const validCategories = ['hotel', 'restaurant', 'sport', 'tourist'];
    const cat = (category || '').toLowerCase().trim();
    return validCategories.includes(cat) ? cat : 'other';
  }

  /** กำหนด category จาก type string ของ API */
  static detectCategoryFromType(typeStr) {
    const t = (typeStr || '').toLowerCase();
    if (t.includes('hotel') || t.includes('resort')) return 'hotel';
    if (t.includes('restaurant') || t.includes('cafe') || t.includes('food')) return 'restaurant';
    if (t.includes('gym') || t.includes('sport') || t.includes('stadium')) return 'sport';
    return 'tourist';
  }

  /** แปลง raw SerpAPI result เป็น Place */
  static fromSerpApiResult(raw, centerLat, centerLng) {
    const lat = raw.gps_coordinates?.latitude;
    const lng = raw.gps_coordinates?.longitude;

    if (lat == null || lng == null) return null;

    const distance = Place.calculateDistance(centerLat, centerLng, lat, lng);
    const category = Place.detectCategoryFromType(raw.type || '');

    return new Place({
      name: raw.title || 'Unknown',
      category,
      lat,
      lng,
      address: raw.address || '',
      rating: raw.rating || null,
      distance: parseFloat(distance.toFixed(2)),
      type: raw.type || '',
      thumbnail: raw.thumbnail || '',
    });
  }

  /** แปลงเป็น JSON object */
  toJSON() {
    return {
      name: this.name,
      category: this.category,
      lat: this.lat,
      lng: this.lng,
      address: this.address,
      rating: this.rating,
      distance: this.distance,
      type: this.type,
      thumbnail: this.thumbnail,
    };
  }
}

module.exports = Place;
