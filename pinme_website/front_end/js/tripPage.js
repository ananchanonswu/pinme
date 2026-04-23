import { escapeHtml, getCategoryBadge, showToast } from './utils/helpers.js';

const FAVORITES_STORAGE_KEY = 'pinme_favorites';
const TRIP_STORAGE_KEY = 'pinme_trip_plan';
const PAGE_COPY = {
  en: {
    nav_scanner: 'Scanner',
    nav_favorites: 'Favorites',
    nav_trip: 'Trip Planner',
    trip_kicker: 'Itinerary Builder',
    trip_title: 'Trip Planner',
    trip_subtitle: 'Build a one-day plan from favorite places or custom activities. The planner checks time conflicts before adding each activity.',
    trip_activities: 'Activities',
    trip_duration: 'Duration',
    trip_add_kicker: 'Add Activity',
    trip_add_title: 'Plan one stop',
    trip_use_saved: 'Use saved place',
    trip_custom_activity: 'Custom activity',
    trip_activity_name: 'Activity name',
    trip_activity_placeholder: 'Grand Palace',
    trip_start: 'Start time',
    trip_end: 'End time',
    trip_add_btn: 'Add to trip',
    trip_clear_btn: 'Clear trip',
    trip_timeline_kicker: 'Timeline',
    trip_timeline_title: 'One-day itinerary',
    trip_view_favorites: 'View favorites',
    trip_empty: 'No activities in plan yet',
    fill_all: 'Please fill in all fields',
    time_invalid: 'End time must be after start time',
    conflict: 'Time conflicts with',
    added: 'Added',
    removed: 'Activity removed',
    cleared: 'Trip plan cleared',
    remove: 'Remove',
    res_badge_hotel: 'Hotel',
    res_badge_restaurant: 'Restaurant',
    res_badge_sport: 'Sport',
    res_badge_tourist: 'Tourist',
  },
  th: {
    nav_scanner: 'สแกน',
    nav_favorites: 'รายการโปรด',
    nav_trip: 'แผนทริป',
    trip_kicker: 'ตัวจัดแผนเดินทาง',
    trip_title: 'แผนทริป',
    trip_subtitle: 'สร้างแผนเที่ยว 1 วันจากสถานที่โปรดหรือกิจกรรมที่กรอกเอง ระบบจะตรวจเวลาไม่ให้ทับซ้อนก่อนเพิ่มกิจกรรม',
    trip_activities: 'กิจกรรม',
    trip_duration: 'เวลารวม',
    trip_add_kicker: 'เพิ่มกิจกรรม',
    trip_add_title: 'วางแผนหนึ่งจุด',
    trip_use_saved: 'ใช้สถานที่ที่บันทึกไว้',
    trip_custom_activity: 'กิจกรรมที่กรอกเอง',
    trip_activity_name: 'ชื่อกิจกรรม',
    trip_activity_placeholder: 'วัดพระแก้ว',
    trip_start: 'เวลาเริ่ม',
    trip_end: 'เวลาสิ้นสุด',
    trip_add_btn: 'เพิ่มลงทริป',
    trip_clear_btn: 'ล้างแผนทริป',
    trip_timeline_kicker: 'ไทม์ไลน์',
    trip_timeline_title: 'แผนเดินทาง 1 วัน',
    trip_view_favorites: 'ดูรายการโปรด',
    trip_empty: 'ยังไม่มีกิจกรรมในแผน',
    fill_all: 'กรุณากรอกข้อมูลให้ครบถ้วน',
    time_invalid: 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม',
    conflict: 'เวลาทับซ้อนกับ',
    added: 'เพิ่มแล้ว',
    removed: 'ลบกิจกรรมแล้ว',
    cleared: 'ล้างแผนทริปแล้ว',
    remove: 'ลบ',
    res_badge_hotel: 'โรงแรม',
    res_badge_restaurant: 'ร้านอาหาร',
    res_badge_sport: 'กีฬา',
    res_badge_tourist: 'ท่องเที่ยว',
  },
};

const form = document.getElementById('standaloneTripForm');
const favoriteSelect = document.getElementById('favoriteSelect');
const activityNameInput = document.getElementById('tripActivityName');
const startTimeInput = document.getElementById('tripStartTime');
const endTimeInput = document.getElementById('tripEndTime');
const timeline = document.getElementById('tripTimeline');
const clearTripBtn = document.getElementById('clearTripBtn');
const activityTotal = document.getElementById('activityTotal');
const durationTotal = document.getElementById('durationTotal');
const langToggleBtn = document.getElementById('langToggleBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');

let currentLang = localStorage.getItem('pinme_lang') || 'th';
let isDarkTheme = localStorage.getItem('pinme_theme') !== 'light';

function getDict() {
  return PAGE_COPY[currentLang] || PAGE_COPY.en;
}

function applyTheme() {
  document.documentElement.classList.toggle('light-theme', !isDarkTheme);
  themeToggleBtn.textContent = isDarkTheme ? '☀' : '☾';
}

function applyTranslations() {
  const dict = getDict();
  document.documentElement.lang = currentLang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) el.textContent = dict[key];
  });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
    const key = el.getAttribute('data-i18n-ph');
    if (dict[key]) el.setAttribute('placeholder', dict[key]);
  });
  langToggleBtn.textContent = currentLang === 'th' ? 'TH' : 'EN';
  renderFavoriteOptions();
  renderTrip();
}

function readJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function loadFavorites() {
  return readJson(FAVORITES_STORAGE_KEY, []);
}

function loadTrip() {
  return readJson(TRIP_STORAGE_KEY, []);
}

function saveTrip(trip) {
  localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(trip));
}

function getActivityId(item) {
  return [
    item.name || '',
    item.start || '',
    item.end || '',
    item.address || '',
  ].join('|');
}

function parseTime(timeStr) {
  if (!timeStr || !timeStr.includes(':')) return NaN;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return NaN;
  return hours * 60 + minutes;
}

function minutesToLabel(minutes) {
  if (!minutes) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hours) return `${mins}m`;
  if (!mins) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function validateActivity(trip, name, start, end) {
  const dict = getDict();
  if (!name || !start || !end) return dict.fill_all;

  const newStart = parseTime(start);
  const newEnd = parseTime(end);
  if (Number.isNaN(newStart) || Number.isNaN(newEnd) || newStart >= newEnd) {
    return dict.time_invalid;
  }

  const conflict = trip.find((item) => {
    const itemStart = parseTime(item.start);
    const itemEnd = parseTime(item.end);
    return newStart < itemEnd && newEnd > itemStart;
  });

  if (conflict) {
    return `${dict.conflict} "${conflict.name}" (${conflict.start} - ${conflict.end})`;
  }

  return '';
}

function renderFavoriteOptions() {
  const dict = getDict();
  const favorites = loadFavorites();
  favoriteSelect.innerHTML = `<option value="">${dict.trip_custom_activity}</option>`;

  favorites.forEach((place, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = place.name || `Favorite place ${index + 1}`;
    favoriteSelect.appendChild(option);
  });
}

function renderTrip() {
  const dict = getDict();
  const trip = loadTrip().sort((a, b) => parseTime(a.start) - parseTime(b.start));
  const totalMinutes = trip.reduce((sum, item) => sum + Math.max(0, parseTime(item.end) - parseTime(item.start)), 0);

  activityTotal.textContent = String(trip.length);
  durationTotal.textContent = minutesToLabel(totalMinutes);

  if (trip.length === 0) {
    timeline.innerHTML = `<p class="trip-empty-text">${dict.trip_empty}</p>`;
    return;
  }

  timeline.innerHTML = '';
  trip.forEach((item) => {
    const node = document.createElement('div');
    node.className = 'trip-item trip-item-editable';
    node.innerHTML = `
      <div class="trip-bullet"></div>
      <div class="trip-time">${escapeHtml(item.start)} - ${escapeHtml(item.end)}</div>
      <div class="trip-content">
        <p class="trip-name">${escapeHtml(item.name)}</p>
        ${(item.category || item.address) ? `
          <div class="trip-tags">
            ${item.category ? getCategoryBadge(item.category, dict) : ''}
            ${item.address ? `<span class="trip-source">${escapeHtml(item.address)}</span>` : ''}
          </div>
        ` : ''}
      </div>
      <button type="button" class="trip-remove-btn" aria-label="${dict.remove} ${escapeHtml(item.name)}">${dict.remove}</button>
    `;

    node.querySelector('button').addEventListener('click', () => {
      const targetId = getActivityId(item);
      const nextTrip = loadTrip().filter((activity) => getActivityId(activity) !== targetId);
      saveTrip(nextTrip);
      renderTrip();
      showToast(dict.removed, 'warning');
    });

    timeline.appendChild(node);
  });
}

favoriteSelect.addEventListener('change', () => {
  const favorites = loadFavorites();
  const selected = favorites[Number(favoriteSelect.value)];
  if (!selected) return;
  activityNameInput.value = selected.name || '';
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const trip = loadTrip();
  const favorites = loadFavorites();
  const selectedPlace = favorites[Number(favoriteSelect.value)] || null;
  const name = activityNameInput.value.trim();
  const start = startTimeInput.value;
  const end = endTimeInput.value;
  const error = validateActivity(trip, name, start, end);

  if (error) {
    showToast(error, 'error');
    return;
  }

  trip.push({
    name,
    start,
    end,
    category: selectedPlace?.category || '',
    address: selectedPlace?.address || '',
  });
  saveTrip(trip);
  form.reset();
  renderTrip();
  showToast(`${getDict().added} "${name}"`, 'success');
});

clearTripBtn.addEventListener('click', () => {
  saveTrip([]);
  renderTrip();
  showToast(getDict().cleared, 'warning');
});

langToggleBtn.addEventListener('click', () => {
  currentLang = currentLang === 'th' ? 'en' : 'th';
  localStorage.setItem('pinme_lang', currentLang);
  applyTranslations();
});

themeToggleBtn.addEventListener('click', () => {
  isDarkTheme = !isDarkTheme;
  localStorage.setItem('pinme_theme', isDarkTheme ? 'dark' : 'light');
  applyTheme();
});

applyTheme();
applyTranslations();
