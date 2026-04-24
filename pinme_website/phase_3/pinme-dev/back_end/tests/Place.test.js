// ==========================================
// Unit Tests: Place Model
// ==========================================
const Place = require('../models/Place');

describe('Place Model', () => {

  // --------------------------------------------------
  // TC-P01: Constructor ค่าเริ่มต้น
  // --------------------------------------------------
  test('TC-P01: should create place with default values when no data provided', () => {
    const place = new Place();
    expect(place.name).toBe('Unknown');
    expect(place.category).toBe('other');
    expect(place.lat).toBeNull();
    expect(place.lng).toBeNull();
    expect(place.address).toBe('');
    expect(place.rating).toBeNull();
    expect(place.distance).toBeNull();
  });

  // --------------------------------------------------
  // TC-P02: Constructor ค่าครบถ้วน
  // --------------------------------------------------
  test('TC-P02: should create place with full data correctly', () => {
    const data = {
      name: 'วัดพระแก้ว',
      category: 'tourist',
      lat: 13.7516,
      lng: 100.4927,
      address: 'ถ.หน้าพระลาน',
      rating: 4.9,
      distance: 5.0,
      type: 'Tourist attraction',
      thumbnail: 'https://example.com/img.jpg',
    };
    const place = new Place(data);
    expect(place.name).toBe('วัดพระแก้ว');
    expect(place.category).toBe('tourist');
    expect(place.lat).toBe(13.7516);
    expect(place.lng).toBe(100.4927);
    expect(place.rating).toBe(4.9);
  });

  // --------------------------------------------------
  // TC-P03: hasValidCoordinates — พิกัดถูกต้อง
  // --------------------------------------------------
  test('TC-P03: should return true for valid coordinates', () => {
    const place = new Place({ lat: 13.7367, lng: 100.5232 });
    expect(place.hasValidCoordinates()).toBe(true);
  });

  // --------------------------------------------------
  // TC-P04: hasValidCoordinates — พิกัดเกินช่วง
  // --------------------------------------------------
  test('TC-P04: should return false for out-of-range latitude (>90)', () => {
    const place = new Place({ lat: 91, lng: 100 });
    expect(place.hasValidCoordinates()).toBe(false);
  });

  test('TC-P04b: should return false for out-of-range longitude (>180)', () => {
    const place = new Place({ lat: 13, lng: 200 });
    expect(place.hasValidCoordinates()).toBe(false);
  });

  // --------------------------------------------------
  // TC-P05: hasValidCoordinates — พิกัดเป็น null
  // --------------------------------------------------
  test('TC-P05: should return false when coordinates are null', () => {
    const place = new Place();
    expect(place.hasValidCoordinates()).toBe(false);
  });

  // --------------------------------------------------
  // TC-P06: hasRating — ค่า rating ถูกต้อง
  // --------------------------------------------------
  test('TC-P06: should return true for valid rating (0-5)', () => {
    const place = new Place({ rating: 4.5 });
    expect(place.hasRating()).toBe(true);
  });

  test('TC-P06b: should return false for rating > 5', () => {
    const place = new Place({ rating: 6 });
    expect(place.hasRating()).toBe(false);
  });

  test('TC-P06c: should return false for null rating', () => {
    const place = new Place();
    expect(place.hasRating()).toBe(false);
  });

  // --------------------------------------------------
  // TC-P07: calculateDistance — Haversine Formula
  // --------------------------------------------------
  test('TC-P07: should calculate distance correctly (Bangkok to Pattaya ~101 km)', () => {
    const dist = Place.calculateDistance(13.7563, 100.5018, 12.9236, 100.8825);
    expect(dist).toBeGreaterThan(95);
    expect(dist).toBeLessThan(110);
  });

  test('TC-P07b: should return 0 for same coordinates', () => {
    const dist = Place.calculateDistance(13.7563, 100.5018, 13.7563, 100.5018);
    expect(dist).toBe(0);
  });

  test('TC-P07c: should return NaN for invalid input', () => {
    const dist = Place.calculateDistance(null, 100, 13, 100);
    expect(isNaN(dist)).toBe(true);
  });

  // --------------------------------------------------
  // TC-P08: distanceFrom — คำนวณระยะจากจุดกำหนด
  // --------------------------------------------------
  test('TC-P08: should calculate distance from a reference point', () => {
    const place = new Place({ lat: 13.7516, lng: 100.4927 });
    const dist = place.distanceFrom(13.7367, 100.5232);
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThan(10);
  });

  test('TC-P08b: should return NaN when place has no coordinates', () => {
    const place = new Place();
    expect(isNaN(place.distanceFrom(13, 100))).toBe(true);
  });

  // --------------------------------------------------
  // TC-P09: isWithinRadius — ตรวจสอบรัศมี
  // --------------------------------------------------
  test('TC-P09: should return true when place is within radius', () => {
    const place = new Place({ lat: 13.7400, lng: 100.5200 });
    expect(place.isWithinRadius(13.7367, 100.5232, 5)).toBe(true);
  });

  test('TC-P09b: should return false when place is outside radius', () => {
    const place = new Place({ lat: 14.0, lng: 101.0 });
    expect(place.isWithinRadius(13.7367, 100.5232, 1)).toBe(false);
  });

  // --------------------------------------------------
  // TC-P10: getDistanceText — แสดงระยะทาง
  // --------------------------------------------------
  test('TC-P10: should format distance >= 1km in km', () => {
    const place = new Place({ distance: 2.5 });
    expect(place.getDistanceText()).toBe('2.5 km');
  });

  test('TC-P10b: should format distance < 1km in meters', () => {
    const place = new Place({ distance: 0.5 });
    expect(place.getDistanceText()).toBe('500 m');
  });

  test('TC-P10c: should return empty string when distance is null', () => {
    const place = new Place();
    expect(place.getDistanceText()).toBe('');
  });

  // --------------------------------------------------
  // TC-P11: normalizeCategory
  // --------------------------------------------------
  test('TC-P11: should normalize valid category', () => {
    expect(Place.normalizeCategory('Hotel')).toBe('hotel');
    expect(Place.normalizeCategory('RESTAURANT')).toBe('restaurant');
    expect(Place.normalizeCategory('sport')).toBe('sport');
  });

  test('TC-P11b: should return "other" for invalid category', () => {
    expect(Place.normalizeCategory('unknown')).toBe('other');
    expect(Place.normalizeCategory('')).toBe('other');
    expect(Place.normalizeCategory(null)).toBe('other');
  });

  // --------------------------------------------------
  // TC-P12: detectCategoryFromType
  // --------------------------------------------------
  test('TC-P12: should detect hotel from type string', () => {
    expect(Place.detectCategoryFromType('Luxury Hotel')).toBe('hotel');
    expect(Place.detectCategoryFromType('Beach Resort')).toBe('hotel');
  });

  test('TC-P12b: should detect restaurant from type string', () => {
    expect(Place.detectCategoryFromType('Thai Restaurant')).toBe('restaurant');
    expect(Place.detectCategoryFromType('Cafe & Bar')).toBe('restaurant');
    expect(Place.detectCategoryFromType('Street Food')).toBe('restaurant');
  });

  test('TC-P12c: should detect sport from type string', () => {
    expect(Place.detectCategoryFromType('National Stadium')).toBe('sport');
    expect(Place.detectCategoryFromType('Fitness Gym')).toBe('sport');
  });

  test('TC-P12d: should default to tourist for unknown type', () => {
    expect(Place.detectCategoryFromType('Museum')).toBe('tourist');
    expect(Place.detectCategoryFromType('')).toBe('tourist');
  });

  // --------------------------------------------------
  // TC-P13: fromSerpApiResult
  // --------------------------------------------------
  test('TC-P13: should create Place from SerpAPI result', () => {
    const raw = {
      title: 'Grand Palace',
      gps_coordinates: { latitude: 13.7500, longitude: 100.4913 },
      address: '123 Bangkok',
      rating: 4.7,
      type: 'Tourist attraction',
    };
    const place = Place.fromSerpApiResult(raw, 13.7367, 100.5232);
    expect(place).toBeInstanceOf(Place);
    expect(place.name).toBe('Grand Palace');
    expect(place.category).toBe('tourist');
    expect(place.distance).toBeGreaterThan(0);
  });

  test('TC-P13b: should return null for result without coordinates', () => {
    const raw = { title: 'No Coords Place' };
    expect(Place.fromSerpApiResult(raw, 13, 100)).toBeNull();
  });

  // --------------------------------------------------
  // TC-P14: toJSON
  // --------------------------------------------------
  test('TC-P14: should serialize to JSON correctly', () => {
    const place = new Place({
      name: 'Test Place',
      category: 'hotel',
      lat: 13.5,
      lng: 100.5,
      rating: 4.0,
    });
    const json = place.toJSON();
    expect(json.name).toBe('Test Place');
    expect(json.category).toBe('hotel');
    expect(json.lat).toBe(13.5);
    expect(json).toHaveProperty('thumbnail');
  });
});
