// ==========================================
// Unit Tests: TripPlanner Model
// ==========================================
const TripPlanner = require('../models/TripPlanner');

describe('TripPlanner Model', () => {

  let planner;

  beforeEach(() => {
    planner = new TripPlanner();
  });

  // --------------------------------------------------
  // TC-T01: Constructor
  // --------------------------------------------------
  test('TC-T01: should create empty trip planner', () => {
    expect(planner.count).toBe(0);
    expect(planner.activities).toEqual([]);
  });

  // --------------------------------------------------
  // TC-T02: parseTime — แปลงเวลา
  // --------------------------------------------------
  test('TC-T02: should parse valid time string to minutes', () => {
    expect(TripPlanner.parseTime('09:00')).toBe(540);
    expect(TripPlanner.parseTime('14:30')).toBe(870);
    expect(TripPlanner.parseTime('00:00')).toBe(0);
    expect(TripPlanner.parseTime('23:59')).toBe(1439);
  });

  test('TC-T02b: should return NaN for invalid time string', () => {
    expect(isNaN(TripPlanner.parseTime(''))).toBe(true);
    expect(isNaN(TripPlanner.parseTime('abc'))).toBe(true);
    expect(isNaN(TripPlanner.parseTime(null))).toBe(true);
    expect(isNaN(TripPlanner.parseTime('25:00'))).toBe(true);
  });

  // --------------------------------------------------
  // TC-T03: minutesToTime — แปลงนาทีกลับ
  // --------------------------------------------------
  test('TC-T03: should convert minutes back to time string', () => {
    expect(TripPlanner.minutesToTime(540)).toBe('09:00');
    expect(TripPlanner.minutesToTime(870)).toBe('14:30');
    expect(TripPlanner.minutesToTime(0)).toBe('00:00');
  });

  test('TC-T03b: should return empty string for invalid minutes', () => {
    expect(TripPlanner.minutesToTime(-1)).toBe('');
    expect(TripPlanner.minutesToTime(NaN)).toBe('');
  });

  // --------------------------------------------------
  // TC-T04: getDuration — คำนวณระยะเวลา
  // --------------------------------------------------
  test('TC-T04: should calculate duration correctly', () => {
    expect(TripPlanner.getDuration('09:00', '11:00')).toBe(120);
    expect(TripPlanner.getDuration('14:00', '14:30')).toBe(30);
  });

  test('TC-T04b: should return negative for invalid time range', () => {
    expect(TripPlanner.getDuration('11:00', '09:00')).toBe(-120);
  });

  // --------------------------------------------------
  // TC-T05: validateActivity — ตรวจสอบข้อมูล
  // --------------------------------------------------
  test('TC-T05: should validate correct activity', () => {
    const result = planner.validateActivity('วัดพระแก้ว', '09:00', '11:00');
    expect(result.valid).toBe(true);
  });

  test('TC-T05b: should reject empty name', () => {
    const result = planner.validateActivity('', '09:00', '11:00');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('EMPTY_NAME');
  });

  test('TC-T05c: should reject when end time is before start', () => {
    const result = planner.validateActivity('Test', '11:00', '09:00');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('END_BEFORE_START');
  });

  test('TC-T05d: should reject invalid time format', () => {
    const result = planner.validateActivity('Test', 'abc', '11:00');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('INVALID_START_TIME');
  });

  // --------------------------------------------------
  // TC-T06: addActivity — เพิ่มกิจกรรม
  // --------------------------------------------------
  test('TC-T06: should add activity successfully', () => {
    const result = planner.addActivity('วัดพระแก้ว', '09:00', '11:00');
    expect(result.success).toBe(true);
    expect(planner.count).toBe(1);
  });

  test('TC-T06b: should reject activity with empty name', () => {
    const result = planner.addActivity('', '09:00', '11:00');
    expect(result.success).toBe(false);
    expect(result.error).toBe('EMPTY_NAME');
  });

  // --------------------------------------------------
  // TC-T07: checkOverlap — ตรวจสอบเวลาซ้อน
  // --------------------------------------------------
  test('TC-T07: should detect overlapping activities', () => {
    planner.addActivity('Activity 1', '09:00', '11:00');
    const overlap = planner.checkOverlap('10:00', '12:00');
    expect(overlap.overlaps).toBe(true);
    expect(overlap.conflictWith.name).toBe('Activity 1');
  });

  test('TC-T07b: should allow non-overlapping activities', () => {
    planner.addActivity('Activity 1', '09:00', '11:00');
    const overlap = planner.checkOverlap('11:00', '12:00');
    expect(overlap.overlaps).toBe(false);
  });

  test('TC-T07c: should detect contained overlap', () => {
    planner.addActivity('Activity 1', '09:00', '15:00');
    const overlap = planner.checkOverlap('10:00', '12:00');
    expect(overlap.overlaps).toBe(true);
  });

  // --------------------------------------------------
  // TC-T08: removeActivity — ลบกิจกรรม
  // --------------------------------------------------
  test('TC-T08: should remove activity by index', () => {
    planner.addActivity('A1', '09:00', '10:00');
    planner.addActivity('A2', '11:00', '12:00');
    expect(planner.removeActivity(0)).toBe(true);
    expect(planner.count).toBe(1);
    expect(planner.activities[0].name).toBe('A2');
  });

  test('TC-T08b: should return false for invalid index', () => {
    expect(planner.removeActivity(-1)).toBe(false);
    expect(planner.removeActivity(5)).toBe(false);
  });

  // --------------------------------------------------
  // TC-T09: getSortedActivities — เรียงลำดับ
  // --------------------------------------------------
  test('TC-T09: should return activities sorted by start time', () => {
    planner.addActivity('Lunch', '12:00', '13:00');
    planner.addActivity('Breakfast', '08:00', '09:00');
    planner.addActivity('Dinner', '18:00', '19:00');
    const sorted = planner.getSortedActivities();
    expect(sorted[0].name).toBe('Breakfast');
    expect(sorted[1].name).toBe('Lunch');
    expect(sorted[2].name).toBe('Dinner');
  });

  // --------------------------------------------------
  // TC-T10: getTotalDuration — เวลารวม
  // --------------------------------------------------
  test('TC-T10: should calculate total duration', () => {
    planner.addActivity('A1', '09:00', '11:00'); // 120 min
    planner.addActivity('A2', '13:00', '14:30'); // 90 min
    expect(planner.getTotalDuration()).toBe(210);
  });

  test('TC-T10b: should return 0 when no activities', () => {
    expect(planner.getTotalDuration()).toBe(0);
  });

  // --------------------------------------------------
  // TC-T11: getFreeTimeSlots — ช่วงเวลาว่าง
  // --------------------------------------------------
  test('TC-T11: should calculate free time slots', () => {
    planner.addActivity('Morning', '09:00', '11:00');
    planner.addActivity('Afternoon', '14:00', '16:00');
    const slots = planner.getFreeTimeSlots('08:00', '18:00');
    expect(slots.length).toBe(3); // 08-09, 11-14, 16-18
    expect(slots[0].start).toBe('08:00');
    expect(slots[0].end).toBe('09:00');
    expect(slots[1].durationMinutes).toBe(180); // 11:00-14:00
  });

  // --------------------------------------------------
  // TC-T12: clearAll — ล้างข้อมูล
  // --------------------------------------------------
  test('TC-T12: should clear all activities', () => {
    planner.addActivity('A1', '09:00', '10:00');
    planner.addActivity('A2', '11:00', '12:00');
    planner.clearAll();
    expect(planner.count).toBe(0);
  });

  // --------------------------------------------------
  // TC-T13: toJSON — ส่งออก JSON
  // --------------------------------------------------
  test('TC-T13: should export correct JSON structure', () => {
    planner.addActivity('Test', '09:00', '10:00');
    const json = planner.toJSON();
    expect(json).toHaveProperty('activities');
    expect(json).toHaveProperty('totalDurationMinutes', 60);
    expect(json).toHaveProperty('count', 1);
  });
});
