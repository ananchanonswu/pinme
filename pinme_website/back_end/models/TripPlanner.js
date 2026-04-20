// ==========================================
// TripPlanner Model — Data structure สำหรับแผนทริป
// ==========================================

class TripPlanner {
  constructor() {
    this.activities = []; // Array of { name, start, end }
  }

  /** Parse time string "HH:MM" เป็นนาที */
  static parseTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return NaN;
    const parts = timeStr.split(':');
    if (parts.length !== 2) return NaN;
    const [h, m] = parts.map(Number);
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return NaN;
    return h * 60 + m;
  }

  /** แปลงนาทีกลับเป็น "HH:MM" */
  static minutesToTime(minutes) {
    if (typeof minutes !== 'number' || isNaN(minutes) || minutes < 0) return '';
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /** คำนวณระยะเวลา (นาที) */
  static getDuration(startStr, endStr) {
    const start = TripPlanner.parseTime(startStr);
    const end = TripPlanner.parseTime(endStr);
    if (isNaN(start) || isNaN(end)) return NaN;
    return end - start;
  }

  /** ตรวจสอบ validation ของข้อมูล activity */
  validateActivity(name, startStr, endStr) {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return { valid: false, error: 'EMPTY_NAME' };
    }
    const start = TripPlanner.parseTime(startStr);
    const end = TripPlanner.parseTime(endStr);
    if (isNaN(start)) {
      return { valid: false, error: 'INVALID_START_TIME' };
    }
    if (isNaN(end)) {
      return { valid: false, error: 'INVALID_END_TIME' };
    }
    if (start >= end) {
      return { valid: false, error: 'END_BEFORE_START' };
    }
    return { valid: true, error: null };
  }

  /** ตรวจสอบเวลาทับซ้อน */
  checkOverlap(startStr, endStr) {
    const newStart = TripPlanner.parseTime(startStr);
    const newEnd = TripPlanner.parseTime(endStr);

    for (const item of this.activities) {
      const itemStart = TripPlanner.parseTime(item.start);
      const itemEnd = TripPlanner.parseTime(item.end);

      if (newStart < itemEnd && newEnd > itemStart) {
        return {
          overlaps: true,
          conflictWith: item,
        };
      }
    }

    return { overlaps: false, conflictWith: null };
  }

  /** เพิ่มกิจกรรม */
  addActivity(name, startStr, endStr) {
    const validation = this.validateActivity(name, startStr, endStr);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const overlap = this.checkOverlap(startStr, endStr);
    if (overlap.overlaps) {
      return { success: false, error: 'OVERLAP', conflictWith: overlap.conflictWith };
    }

    this.activities.push({
      name: name.trim(),
      start: startStr,
      end: endStr,
    });

    return { success: true };
  }

  /** ลบกิจกรรมตาม index */
  removeActivity(index) {
    if (index < 0 || index >= this.activities.length) return false;
    this.activities.splice(index, 1);
    return true;
  }

  /** เรียงลำดับตามเวลาเริ่ม */
  getSortedActivities() {
    return [...this.activities].sort(
      (a, b) => TripPlanner.parseTime(a.start) - TripPlanner.parseTime(b.start)
    );
  }

  /** คำนวณเวลาว่าง (gaps) ระหว่างกิจกรรม */
  getFreeTimeSlots(dayStartStr = '08:00', dayEndStr = '22:00') {
    const sorted = this.getSortedActivities();
    const slots = [];
    let cursor = TripPlanner.parseTime(dayStartStr);
    const dayEnd = TripPlanner.parseTime(dayEndStr);

    for (const act of sorted) {
      const actStart = TripPlanner.parseTime(act.start);
      const actEnd = TripPlanner.parseTime(act.end);
      if (actStart > cursor) {
        slots.push({
          start: TripPlanner.minutesToTime(cursor),
          end: TripPlanner.minutesToTime(actStart),
          durationMinutes: actStart - cursor,
        });
      }
      cursor = Math.max(cursor, actEnd);
    }

    if (cursor < dayEnd) {
      slots.push({
        start: TripPlanner.minutesToTime(cursor),
        end: TripPlanner.minutesToTime(dayEnd),
        durationMinutes: dayEnd - cursor,
      });
    }

    return slots;
  }

  /** จำนวนกิจกรรมทั้งหมด */
  get count() {
    return this.activities.length;
  }

  /** คำนวณเวลาที่ใช้รวม (นาที) */
  getTotalDuration() {
    return this.activities.reduce((sum, act) => {
      const dur = TripPlanner.getDuration(act.start, act.end);
      return sum + (isNaN(dur) ? 0 : dur);
    }, 0);
  }

  /** ล้างกิจกรรมทั้งหมด */
  clearAll() {
    this.activities = [];
  }

  /** แปลงเป็น JSON */
  toJSON() {
    return {
      activities: this.getSortedActivities(),
      totalDurationMinutes: this.getTotalDuration(),
      count: this.count,
    };
  }
}

module.exports = TripPlanner;
