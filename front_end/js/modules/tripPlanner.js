// ==========================================
// Mini Trip Planner (เช็คเวลาทับซ้อน & วาด Timeline)
// ==========================================

import { escapeHtml, showToast } from '../utils/helpers.js';

let tripPlan = []; // Array of { name, start, end }

function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function checkTimeOverlap(startStr, endStr, dict) {
  const newStart = parseTime(startStr);
  const newEnd = parseTime(endStr);

  if (newStart >= newEnd) {
    return dict.trip_time_invalid;
  }

  for (const item of tripPlan) {
    const itemStart = parseTime(item.start);
    const itemEnd = parseTime(item.end);

    // เช็คกรณีทับซ้อน (Overlap)
    if (newStart < itemEnd && newEnd > itemStart) {
      return dict.trip_overlap_msg
        .replace('{name}', item.name)
        .replace('{start}', item.start)
        .replace('{end}', item.end);
    }
  }

  return null; // ไม่มีทับซ้อน
}

export function renderTripPlan(tripTimeline, dict) {
  if (tripPlan.length === 0) {
    tripTimeline.innerHTML = `<p class="trip-empty-text" id="emptyTripState" data-i18n="empty_trip">${dict.empty_trip}</p>`;
    return;
  }

  // เรียงลำดับตามเวลาเริ่ม
  tripPlan.sort((a, b) => parseTime(a.start) - parseTime(b.start));

  tripTimeline.innerHTML = '';
  tripPlan.forEach((item) => {
    tripTimeline.innerHTML += `
      <div class="trip-item">
        <div class="trip-bullet"></div>
        <div class="trip-time">
          🕒 ${item.start} - ${item.end}
        </div>
        <div class="trip-content">
          <p class="trip-name">${escapeHtml(item.name)}</p>
        </div>
      </div>
    `;
  });
}

export function addTripActivity(nameInput, startTime, endTime, tripTimeline, dict) {
  if (!nameInput || !startTime || !endTime) {
    showToast(dict.trip_fill_all, 'warning');
    return false;
  }

  const overlapError = checkTimeOverlap(startTime, endTime, dict);
  if (overlapError) {
    showToast(dict.trip_overlap_prefix + overlapError, 'error');
    return false;
  }

  // ไม่ทับซ้อน เพิ่มลง Array
  tripPlan.push({
    name: nameInput,
    start: startTime,
    end: endTime
  });

  // อัปเดต UI
  renderTripPlan(tripTimeline, dict);
  
  showToast(dict.trip_added.replace('{name}', nameInput), 'success');
  return true;
}

