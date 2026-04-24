// ==========================================
// Mini Trip Planner
// ==========================================

import { escapeHtml, showToast, getCategoryBadge } from '../utils/helpers.js';

const TRIP_STORAGE_KEY = 'pinme_trip_plan';
let tripPlan = loadTripPlan();

function loadTripPlan() {
  try {
    const saved = JSON.parse(localStorage.getItem(TRIP_STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch (err) {
    return [];
  }
}

function saveTripPlan() {
  localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(tripPlan));
}

function syncTripPlanFromStorage() {
  tripPlan = loadTripPlan();
}

function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function checkTimeOverlap(startStr, endStr, dict) {
  syncTripPlanFromStorage();
  const newStart = parseTime(startStr);
  const newEnd = parseTime(endStr);

  if (newStart >= newEnd) {
    return dict.trip_time_invalid;
  }

  for (const item of tripPlan) {
    const itemStart = parseTime(item.start);
    const itemEnd = parseTime(item.end);

    if (newStart < itemEnd && newEnd > itemStart) {
      return dict.trip_overlap_msg
        .replace('{name}', item.name)
        .replace('{start}', item.start)
        .replace('{end}', item.end);
    }
  }

  return null;
}

function formatDistance(distance, dict) {
  if (distance == null || Number.isNaN(distance)) return '';
  if (distance < 1) return `${(distance * 1000).toFixed(0)} ${dict.unit_m}`;
  return `${distance.toFixed(1)} ${dict.unit_km}`;
}

export function renderTripPlan(tripTimeline, dict) {
  syncTripPlanFromStorage();

  if (tripPlan.length === 0) {
    tripTimeline.innerHTML = `<p class="trip-empty-text" id="emptyTripState" data-i18n="empty_trip">${dict.empty_trip}</p>`;
    return;
  }

  tripPlan.sort((a, b) => parseTime(a.start) - parseTime(b.start));

  tripTimeline.innerHTML = '';
  tripPlan.forEach((item) => {
    const categoryBadge = item.category ? getCategoryBadge(item.category, dict) : '';
    const sourceLabel = item.source ? `<span class="trip-source">${escapeHtml(item.source)}</span>` : '';
    const distanceLabel = item.distance != null ? `<span class="trip-source">📍 ${formatDistance(item.distance, dict)}</span>` : '';

    tripTimeline.innerHTML += `
      <div class="trip-item">
        <div class="trip-bullet"></div>
        <div class="trip-time">🕒 ${item.start} - ${item.end}</div>
        <div class="trip-content">
          <p class="trip-name">${escapeHtml(item.name)}</p>
          ${(categoryBadge || sourceLabel || distanceLabel) ? `<div class="trip-tags">${categoryBadge}${sourceLabel}${distanceLabel}</div>` : ''}
          ${item.address ? `<p class="trip-address">${escapeHtml(item.address)}</p>` : ''}
        </div>
      </div>
    `;
  });
}

export function addTripActivity(nameInput, startTime, endTime, tripTimeline, dict, options = {}) {
  if (!nameInput || !startTime || !endTime) {
    showToast(dict.trip_fill_all, 'warning');
    return false;
  }

  const overlapError = checkTimeOverlap(startTime, endTime, dict);
  if (overlapError) {
    showToast(dict.trip_overlap_prefix + overlapError, 'error');
    return false;
  }

  tripPlan.push({
    name: nameInput,
    start: startTime,
    end: endTime,
    category: options.category || '',
    address: options.address || '',
    distance: typeof options.distance === 'number' ? options.distance : null,
    source: options.source || '',
  });
  saveTripPlan();

  renderTripPlan(tripTimeline, dict);
  showToast(dict.trip_added.replace('{name}', nameInput), 'success');
  return true;
}
