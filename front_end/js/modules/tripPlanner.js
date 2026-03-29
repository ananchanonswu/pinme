// ==========================================
// Mini Trip Planner (เช็คเวลาทับซ้อน & วาด Timeline)
// ==========================================

import { escapeHtml, showToast } from '../utils/helpers.js';

let tripPlan = []; // Array of { name, start, end }

function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function checkTimeOverlap(startStr, endStr) {
  const newStart = parseTime(startStr);
  const newEnd = parseTime(endStr);

  if (newStart >= newEnd) {
    return 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม';
  }

  for (const item of tripPlan) {
    const itemStart = parseTime(item.start);
    const itemEnd = parseTime(item.end);

    // เช็คกรณีทับซ้อน (Overlap)
    if (newStart < itemEnd && newEnd > itemStart) {
      return `เวลาทับซ้อนกับกิจกรรม "${item.name}" (${item.start} - ${item.end})`;
    }
  }

  return null; // ไม่มีทับซ้อน
}

export function renderTripPlan(tripTimeline, dict) {
  if (tripPlan.length === 0) {
    tripTimeline.innerHTML = `<p class="text-sm text-slate-400 py-2 -ml-4 pl-0 text-center w-full" id="emptyTripState" data-i18n="empty_trip">${dict.empty_trip}</p>`;
    return;
  }

  // เรียงลำดับตามเวลาเริ่ม
  tripPlan.sort((a, b) => parseTime(a.start) - parseTime(b.start));

  tripTimeline.innerHTML = '';
  tripPlan.forEach((item) => {
    tripTimeline.innerHTML += `
      <div class="relative flex flex-col mb-3 last:mb-0 group cursor-default">
        <!-- Bullet -->
        <div class="absolute -left-[1.35rem] top-1.5 w-[11px] h-[11px] rounded-full bg-teal-500 border-2 border-slate-900 group-hover:bg-teal-300 transition-colors z-10"></div>
        <!-- Time -->
        <div class="text-[0.65rem] text-teal-400 font-mono mb-0.5 leading-none bg-slate-900/50 inline-block w-fit px-1.5 py-0.5 rounded">
          🕒 ${item.start} - ${item.end}
        </div>
        <!-- Content -->
        <div class="bg-white/5 p-2.5 rounded-lg border border-white/10 hover:border-teal-500/30 transition-colors ml-1 mt-1">
          <p class="text-sm font-semibold text-slate-100 leading-snug">${escapeHtml(item.name)}</p>
        </div>
      </div>
    `;
  });
}

export function addTripActivity(nameInput, startTime, endTime, tripTimeline, dict) {
  if (!nameInput || !startTime || !endTime) {
    alert('กรุณากรอกข้อมูลให้ครบถ้วน');
    return false;
  }

  const overlapError = checkTimeOverlap(startTime, endTime);
  if (overlapError) {
    alert('⚠️ ขัดข้อง: ' + overlapError);
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
  
  showToast(`✅ เพิ่ม "${nameInput}" ลงแผนทริปแล้ว`, 'success');
  return true;
}
