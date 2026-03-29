// ==========================================
// PinMe - Main Application Logic
// ==========================================

import { MOCK_PLACES } from './data/mockData.js';
import { TRANSLATIONS } from './data/translations.js';
import { getCategoryBadge, getCategoryBadgeText, getCategoryIcon, escapeHtml, showToast } from './utils/helpers.js';
import { initMap, addPlaceMarkers, flyToPlaceAndOpenPopup, invalidateMapSize, updateRadiusCircleAndMap, setMapTheme } from './modules/map.js';
import { renderTripPlan, addTripActivity } from './modules/tripPlanner.js';

// เปลี่ยน Endpoint ให้รองรับระบบ Unified Server (เรียกแบบ Relative Path)
const API_ENDPOINT = '/scan';

// --- DOM Elements ---
const searchForm = document.getElementById('searchForm');
const latInput = document.getElementById('latitude');
const lngInput = document.getElementById('longitude');
const gpsBtn = document.getElementById('gpsBtn');
const submitBtn = document.getElementById('submitBtn');
const submitBtnText = document.getElementById('submitBtnText');
const submitSpinner = document.getElementById('submitSpinner');
const resultsContainer = document.getElementById('resultsContainer');
const resultsGrid = document.getElementById('resultsGrid');
const resultsCount = document.getElementById('resultsCount');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const mapToggleBtn = document.getElementById('mapToggleBtn');
const mapWrapper = document.getElementById('mapWrapper');
const mapRadiusBadge = document.getElementById('mapRadiusBadge');

// --- Detail Modal Elements ---
const detailModal = document.getElementById('detailModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalContent = document.getElementById('modalContent');
const modalTitle = document.getElementById('modalTitle');
const modalCategoryBadge = document.getElementById('modalCategoryBadge');
const modalAddress = document.getElementById('modalAddress');
const modalRating = document.getElementById('modalRating');
const modalRatingContainer = document.getElementById('modalRatingContainer');
const modalImage = document.getElementById('modalImage');
const modalImageContainer = document.getElementById('modalImageContainer');
const modalCloseBtnTop = document.getElementById('modalCloseBtnTop');
const modalCloseBtnBottom = document.getElementById('modalCloseBtnBottom');

// --- Trip Planner Elements ---
const tripForm = document.getElementById('tripForm');
const tripActivityName = document.getElementById('tripActivityName');
const tripStartTime = document.getElementById('tripStartTime');
const tripEndTime = document.getElementById('tripEndTime');
const tripTimeline = document.getElementById('tripTimeline');

// --- Toggles ---
const langToggleBtn = document.getElementById('langToggleBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');

// --- State ---
let selectedRadius = '3';
let selectedCategory = 'all';
let currentLang = localStorage.getItem('pinme_lang') || 'th';
let isDarkTheme = localStorage.getItem('pinme_theme') !== 'light'; // Default to dark
let currentResults = [];

// ==========================================
// Helper logic inside app
// ==========================================

function setLoadingState(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtnText.style.display = isLoading ? 'none' : 'inline';
  submitSpinner.style.display = isLoading ? 'inline-block' : 'none';

  if (isLoading) {
    resultsContainer.classList.add('visible');
    loadingState.style.display = 'flex';
    emptyState.style.display = 'none';
    resultsGrid.innerHTML = '';
  }
}

function updateMapState(lat, lng) {
  initMap(lat, lng, selectedRadius, isDarkTheme, TRANSLATIONS[currentLang], mapRadiusBadge);
}

// ==========================================
// Initializations
// ==========================================

function applyTranslations() {
  const dict = TRANSLATIONS[currentLang];
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.innerHTML = dict[key];
    }
  });

  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    if (dict[key]) {
      el.setAttribute('placeholder', dict[key]);
    }
  });

  langToggleBtn.innerHTML = currentLang === 'th' ? '🇹🇭 TH' : '🇺🇸 EN';
}

function toggleLanguage() {
  currentLang = currentLang === 'th' ? 'en' : 'th';
  localStorage.setItem('pinme_lang', currentLang);
  
  applyTranslations();

  if (resultsContainer.classList.contains('visible') && !loadingState.style.display.includes('flex')) {
    renderResults(currentResults);
  }
  
  mapRadiusBadge.textContent = TRANSLATIONS[currentLang].map_radius.replace('{val}', selectedRadius);
  const isCollapsed = mapWrapper.classList.contains('collapsed');
  mapToggleBtn.textContent = isCollapsed ? TRANSLATIONS[currentLang].btn_show_map : TRANSLATIONS[currentLang].btn_hide_map;
  renderTripPlan(tripTimeline, TRANSLATIONS[currentLang]);

  // Re-update map marker's text
  const lat = parseFloat(latInput.value);
  const lng = parseFloat(lngInput.value);
  if (!isNaN(lat) && !isNaN(lng)) {
    updateMapState(lat, lng);
  }
}

function applyTheme() {
  if (isDarkTheme) {
    document.documentElement.classList.remove('light-theme');
    themeToggleBtn.innerHTML = '☀️';
  } else {
    document.documentElement.classList.add('light-theme');
    themeToggleBtn.innerHTML = '🌙';
  }
  setMapTheme(isDarkTheme);
}

function toggleTheme() {
  isDarkTheme = !isDarkTheme;
  localStorage.setItem('pinme_theme', isDarkTheme ? 'dark' : 'light');
  applyTheme();
}

// Event Listeners for Toggles
langToggleBtn.addEventListener('click', toggleLanguage);
themeToggleBtn.addEventListener('click', toggleTheme);
applyTheme();
applyTranslations();

// ==========================================
// Core UI Event Listeners
// ==========================================

mapToggleBtn.addEventListener('click', () => {
  const isCollapsed = mapWrapper.classList.toggle('collapsed');
  mapToggleBtn.textContent = isCollapsed ? TRANSLATIONS[currentLang].btn_show_map : TRANSLATIONS[currentLang].btn_hide_map;
  if (!isCollapsed) {
    invalidateMapSize();
  }
});

document.querySelectorAll('.radius-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.radius-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    selectedRadius = chip.dataset.value;
    updateRadiusCircleAndMap(selectedRadius, TRANSLATIONS[currentLang], mapRadiusBadge);
  });
});

document.querySelectorAll('.category-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    selectedCategory = pill.dataset.value;
  });
});

gpsBtn.addEventListener('click', () => {
  const dict = TRANSLATIONS[currentLang];
  if (!navigator.geolocation) {
    showToast(dict.toast_gps_fail, 'error');
    return;
  }

  gpsBtn.classList.add('loading');
  gpsBtn.querySelector('.gps-text').textContent = dict.toast_gps_wait;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      latInput.value = lat.toFixed(6);
      lngInput.value = lng.toFixed(6);

      latInput.style.borderColor = 'var(--success)';
      lngInput.style.borderColor = 'var(--success)';
      setTimeout(() => {
        latInput.style.borderColor = '';
        lngInput.style.borderColor = '';
      }, 1500);

      gpsBtn.classList.remove('loading');
      gpsBtn.querySelector('.gps-text').textContent = TRANSLATIONS[currentLang].btn_gps;
      showToast(TRANSLATIONS[currentLang].toast_gps_success, 'success');

      updateMapState(lat, lng);
    },
    (error) => {
      gpsBtn.classList.remove('loading');
      gpsBtn.querySelector('.gps-text').textContent = TRANSLATIONS[currentLang].btn_gps;

      const gpsDict = TRANSLATIONS[currentLang];
      const messages = {
        1: gpsDict.toast_gps_denied,
        2: gpsDict.toast_gps_unavail,
        3: gpsDict.toast_gps_timeout,
      };
      showToast(messages[error.code] || gpsDict.toast_gps_fail, 'error');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

tripForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const nameInput = tripActivityName.value.trim();
  const startTime = tripStartTime.value;
  const endTime = tripEndTime.value;

  const success = addTripActivity(nameInput, startTime, endTime, tripTimeline, TRANSLATIONS[currentLang]);
  if (success) {
    tripActivityName.value = '';
    tripStartTime.value = '';
    tripEndTime.value = '';
  }
});

searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const lat = parseFloat(latInput.value);
  const lng = parseFloat(lngInput.value);
  const dict = TRANSLATIONS[currentLang];

  if (isNaN(lat) || isNaN(lng)) {
    showToast(dict.toast_fill_coords, 'warning');
    return;
  }

  if (lat < -90 || lat > 90) {
    showToast(dict.toast_lat_err, 'warning');
    return;
  }

  if (lng < -180 || lng > 180) {
    showToast(dict.toast_lng_err, 'warning');
    return;
  }

  const requestBody = {
    latitude: lat,
    longitude: lng,
    radius: parseInt(selectedRadius),
    category: selectedCategory,
  };

  updateMapState(lat, lng);
  setLoadingState(true);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Server Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    renderResults(data);
    showToast(`${dict.toast_found} ${data.results?.length || 0} ${dict.toast_places}`, 'success');

  } catch (error) {
    console.error('❌ Fetch Error:', error);
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      showToast(dict.toast_server_err, 'error');
    } else {
      showToast(`❌ ${error.message}`, 'error');
    }

    resultsContainer.classList.add('visible');
    loadingState.style.display = 'none';
    resultsGrid.innerHTML = '';
    emptyState.style.display = 'flex';
    emptyState.querySelector('.empty-title').textContent = dict.toast_conn_fail;
    emptyState.querySelector('.empty-desc').textContent = dict.toast_conn_fail_desc;
  } finally {
    setLoadingState(false);
  }
});

// ==========================================
// Render Logic
// ==========================================

function renderResults(data) {
  const results = data.results || data || [];
  currentResults = results;
  resultsContainer.classList.add('visible');
  loadingState.style.display = 'none';

  if (!Array.isArray(results) || results.length === 0) {
    resultsGrid.innerHTML = '';
    emptyState.style.display = 'flex';
    emptyState.querySelector('.empty-title').textContent = TRANSLATIONS[currentLang].empty_res_title;
    emptyState.querySelector('.empty-desc').textContent = TRANSLATIONS[currentLang].empty_res_desc;
    resultsCount.textContent = `0 ${TRANSLATIONS[currentLang].toast_places}`;
    return;
  }

  emptyState.style.display = 'none';
  renderPlaces(results);
  addPlaceMarkers(results, TRANSLATIONS[currentLang]);
}

function renderPlaces(places) {
  const dict = TRANSLATIONS[currentLang];
  resultsCount.textContent = `${places.length} ${dict.toast_places}`;
  resultsGrid.innerHTML = '';

  places.forEach((place, index) => {
    const name = place.name || dict.unknown_name;
    const category = place.category || place.type || 'other';
    const distanceRaw = place.distance;

    const distanceText = distanceRaw != null
      ? (distanceRaw < 1
          ? `${(distanceRaw * 1000).toFixed(0)} ${dict.unit_m}`
          : `${distanceRaw.toFixed(1)} ${dict.unit_km}`)
      : null;

    const categoryBadge = getCategoryBadge(category, dict);
    const categoryIcon = getCategoryIcon(category);

    const card = document.createElement('div');
    card.className = 'result-card';
    card.style.animationDelay = `${index * 0.06}s`;

    card.innerHTML = `
      <div class="card-body">
        <div class="card-icon">${categoryIcon}</div>
        <div class="card-content">
          <div class="card-header">
            <h3 class="card-title">${escapeHtml(name)}</h3>
            ${categoryBadge}
          </div>
          ${place.address ? `<p class="card-address">${escapeHtml(place.address)}</p>` : ''}
          <div class="card-meta">
            ${distanceText ? `<span>📍 ${distanceText}</span>` : ''}
            ${place.rating ? `<span>⭐ ${place.rating}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="card-actions">
        <button class="card-btn card-btn-detail" data-place-index="${index}">${dict.btn_detail}</button>
        <button class="card-btn card-btn-pin" data-place-index="${index}">${dict.btn_pin}</button>
      </div>
    `;

    const detailBtn = card.querySelector('.card-btn-detail');
    const pinBtn = card.querySelector('.card-btn-pin');

    detailBtn.addEventListener('click', () => {
      openDetailModal(place, dict);
    });

    pinBtn.addEventListener('click', () => {
      const isPinned = pinBtn.classList.toggle('pinned');
      pinBtn.innerHTML = isPinned ? dict.btn_pinned : dict.btn_pin;
      showToast(
        isPinned ? `📍 ${dict.toast_pinned} "${escapeHtml(name)}"` : `❌ ${dict.toast_unpinned} "${escapeHtml(name)}"`,
        isPinned ? 'success' : 'warning'
      );
    });

    resultsGrid.appendChild(card);
  });
}

// ==========================================
// Detail Modal Logic
// ==========================================

function openDetailModal(place, dict) {
  const name = place.name || dict.unknown_name;
  const category = place.category || 'other';

  // Populate modal content
  modalTitle.textContent = name;
  modalCategoryBadge.innerHTML = getCategoryBadge(category, dict);
  modalAddress.textContent = place.address || dict.modal_no_address;

  if (place.rating) {
    modalRatingContainer.style.display = 'flex';
    modalRating.textContent = `${place.rating} / 5.0`;
  } else {
    modalRatingContainer.style.display = 'none';
  }

  if (place.thumbnail) {
    modalImageContainer.classList.remove('hidden');
    modalImage.src = place.thumbnail;
    modalImage.alt = name;
  } else {
    modalImageContainer.classList.add('hidden');
  }

  // Show modal with animation
  detailModal.classList.remove('hidden');
  detailModal.classList.add('flex');
  requestAnimationFrame(() => {
    modalContent.classList.remove('scale-95', 'opacity-0');
    modalContent.classList.add('scale-100', 'opacity-100');
  });

  // Also fly to the place on the map
  const placeLat = place.lat ?? place.latitude;
  const placeLng = place.lng ?? place.longitude;
  flyToPlaceAndOpenPopup(placeLat, placeLng);
}

function closeDetailModal() {
  modalContent.classList.remove('scale-100', 'opacity-100');
  modalContent.classList.add('scale-95', 'opacity-0');
  setTimeout(() => {
    detailModal.classList.add('hidden');
    detailModal.classList.remove('flex');
  }, 200);
}

// Modal close event listeners
modalCloseBtnTop.addEventListener('click', closeDetailModal);
modalCloseBtnBottom.addEventListener('click', closeDetailModal);
modalBackdrop.addEventListener('click', closeDetailModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !detailModal.classList.contains('hidden')) {
    closeDetailModal();
  }
});

// ==========================================
// Demo Data (on startup)
// ==========================================
(function showDemoData() {
  const defaultLat = 13.7367;
  const defaultLng = 100.5232;

  latInput.value = defaultLat;
  lngInput.value = defaultLng;

  updateMapState(defaultLat, defaultLng);

  resultsContainer.classList.add('visible');
  emptyState.style.display = 'none';
  renderPlaces(MOCK_PLACES);
  addPlaceMarkers(MOCK_PLACES, TRANSLATIONS[currentLang]);
})();
