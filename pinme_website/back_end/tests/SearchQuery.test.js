// ==========================================
// Unit Tests: SearchQuery Model
// ==========================================
const SearchQuery = require('../models/SearchQuery');

describe('SearchQuery Model', () => {

  // --------------------------------------------------
  // TC-S01: Constructor ค่าเริ่มต้น
  // --------------------------------------------------
  test('TC-S01: should create with default values', () => {
    const query = new SearchQuery();
    expect(query.latitude).toBeNull();
    expect(query.longitude).toBeNull();
    expect(query.radius).toBe(3);
    expect(query.category).toBe('all');
  });

  // --------------------------------------------------
  // TC-S02: Constructor ค่าครบถ้วน
  // --------------------------------------------------
  test('TC-S02: should create with provided values', () => {
    const query = new SearchQuery({
      latitude: 13.7367,
      longitude: 100.5232,
      radius: 5,
      category: 'hotel',
    });
    expect(query.latitude).toBe(13.7367);
    expect(query.longitude).toBe(100.5232);
    expect(query.radius).toBe(5);
    expect(query.category).toBe('hotel');
  });

  // --------------------------------------------------
  // TC-S03: ป้องกัน category ที่ไม่ถูกต้อง
  // --------------------------------------------------
  test('TC-S03: should default to "all" for invalid category', () => {
    const query = new SearchQuery({ category: 'invalid_cat' });
    expect(query.category).toBe('all');
  });

  // --------------------------------------------------
  // TC-S04: isValidLatitude
  // --------------------------------------------------
  test('TC-S04: should validate latitude in range [-90, 90]', () => {
    expect(new SearchQuery({ latitude: 0 }).isValidLatitude()).toBe(true);
    expect(new SearchQuery({ latitude: 90 }).isValidLatitude()).toBe(true);
    expect(new SearchQuery({ latitude: -90 }).isValidLatitude()).toBe(true);
    expect(new SearchQuery({ latitude: 91 }).isValidLatitude()).toBe(false);
    expect(new SearchQuery({ latitude: -91 }).isValidLatitude()).toBe(false);
    expect(new SearchQuery({ latitude: null }).isValidLatitude()).toBe(false);
  });

  // --------------------------------------------------
  // TC-S05: isValidLongitude
  // --------------------------------------------------
  test('TC-S05: should validate longitude in range [-180, 180]', () => {
    expect(new SearchQuery({ longitude: 0 }).isValidLongitude()).toBe(true);
    expect(new SearchQuery({ longitude: 180 }).isValidLongitude()).toBe(true);
    expect(new SearchQuery({ longitude: -180 }).isValidLongitude()).toBe(true);
    expect(new SearchQuery({ longitude: 181 }).isValidLongitude()).toBe(false);
    expect(new SearchQuery({ longitude: null }).isValidLongitude()).toBe(false);
  });

  // --------------------------------------------------
  // TC-S06: validate — ตรวจสอบทั้งหมด
  // --------------------------------------------------
  test('TC-S06: should pass validation with valid coords', () => {
    const query = new SearchQuery({ latitude: 13.7, longitude: 100.5 });
    const result = query.validate();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('TC-S06b: should fail with missing coords', () => {
    const query = new SearchQuery();
    const result = query.validate();
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('INVALID_LATITUDE');
    expect(result.errors).toContain('INVALID_LONGITUDE');
  });

  // --------------------------------------------------
  // TC-S07: getSearchQuery
  // --------------------------------------------------
  test('TC-S07: should return correct search query per category', () => {
    expect(new SearchQuery({ category: 'hotel' }).getSearchQuery()).toBe('hotels');
    expect(new SearchQuery({ category: 'restaurant' }).getSearchQuery()).toBe('restaurants');
    expect(new SearchQuery({ category: 'sport' }).getSearchQuery()).toBe('sports complex');
    expect(new SearchQuery({ category: 'tourist' }).getSearchQuery()).toBe('tourist attractions');
    expect(new SearchQuery({ category: 'all' }).getSearchQuery()).toBe('places of interest');
  });

  // --------------------------------------------------
  // TC-S08: getLocationBias
  // --------------------------------------------------
  test('TC-S08: should generate location bias string', () => {
    const query = new SearchQuery({ latitude: 13.7, longitude: 100.5 });
    expect(query.getLocationBias()).toBe('@13.7,100.5,14z');
  });

  test('TC-S08b: should return empty for invalid coords', () => {
    const query = new SearchQuery();
    expect(query.getLocationBias()).toBe('');
  });

  // --------------------------------------------------
  // TC-S09: toSerpApiParams
  // --------------------------------------------------
  test('TC-S09: should generate SerpAPI params', () => {
    const query = new SearchQuery({
      latitude: 13.7367,
      longitude: 100.5232,
      category: 'hotel',
    });
    const params = query.toSerpApiParams('test_key');
    expect(params).not.toBeNull();
    expect(params.engine).toBe('google_maps');
    expect(params.q).toBe('hotels');
    expect(params.api_key).toBe('test_key');
    expect(params.ll).toBe('@13.7367,100.5232,14z');
  });

  test('TC-S09b: should return null for invalid query', () => {
    const query = new SearchQuery();
    expect(query.toSerpApiParams('key')).toBeNull();
  });

  // --------------------------------------------------
  // TC-S10: toJSON
  // --------------------------------------------------
  test('TC-S10: should serialize correctly', () => {
    const query = new SearchQuery({
      latitude: 13.7,
      longitude: 100.5,
      radius: 5,
      category: 'restaurant',
    });
    const json = query.toJSON();
    expect(json).toEqual({
      latitude: 13.7,
      longitude: 100.5,
      radius: 5,
      category: 'restaurant',
    });
  });
});
