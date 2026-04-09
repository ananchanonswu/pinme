// ==========================================
// PinMe - Main Application Logic
// ==========================================

import { MOCK_PLACES } from './data/mockData.js';
import { TRANSLATIONS } from './data/translations.js';
import { getCategoryBadge, getCategoryIcon, escapeHtml, showToast } from './utils/helpers.js';
import {
  initMap,
  addPlaceMarkers,
  flyToPlaceAndOpenPopup,
  invalidateMapSize,
  updateRadiusCircleAndMap,
  setMapTheme
} from './modules/map.js';
import { renderTripPlan, addTripActivity } from './modules/tripPlanner.js';

const API_ENDPOINT = '/scan';
const IMAGE_PROXY_ENDPOINT = '/image';
const FAVORITES_STORAGE_KEY = 'pinme_favorites';

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
const favoritesGrid = document.getElementById('favoritesGrid');
const favoritesCount = document.getElementById('favoritesCount');
const favoritesEmptyState = document.getElementById('favoritesEmptyState');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const mapToggleBtn = document.getElementById('mapToggleBtn');
const mapWrapper = document.getElementById('mapWrapper');
const mapRadiusBadge = document.getElementById('mapRadiusBadge');
const heroRadiusValue = document.getElementById('heroRadiusValue');

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
let isDarkTheme = localStorage.getItem('pinme_theme') !== 'light';
let currentResults = [];
let favoritePlaces = loadFavorites();

function getDict() {
  return TRANSLATIONS[currentLang];
}

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
  initMap(lat, lng, selectedRadius, isDarkTheme, getDict(), mapRadiusBadge);
  syncRadiusLabels();
}

function syncRadiusLabels() {
  const radiusText = `${selectedRadius} ${getDict().unit_km}`;
  if (heroRadiusValue) {
    heroRadiusValue.textContent = radiusText;
  }
}

function getPlaceId(place) {
  const lat = place.lat ?? place.latitude ?? '';
  const lng = place.lng ?? place.longitude ?? '';
  return [
    String(place.name || '').trim().toLowerCase(),
    String(place.address || '').trim().toLowerCase(),
    String(lat),
    String(lng),
  ].join('|');
}

function normalizePlaceImage(place) {
  const rawImage =
    place?.thumbnail ||
    place?.image ||
    place?.photo ||
    place?.photoUrl ||
    place?.imageUrl ||
    place?.images?.[0] ||
    '';

  if (!rawImage || typeof rawImage !== 'string') {
    return '';
  }

  if (/^https?:\/\//i.test(rawImage)) {
    return `${IMAGE_PROXY_ENDPOINT}?url=${encodeURIComponent(rawImage)}`;
  }

  return rawImage;
}

function enrichPlace(place = {}) {
  return {
    ...place,
    placeId: place.placeId || getPlaceId(place),
    thumbnail: normalizePlaceImage(place),
  };
}

function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.map(enrichPlace) : [];
  } catch {
    return [];
  }
}

function saveFavorites() {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoritePlaces));
}

function isFavorite(place) {
  const placeId = place.placeId || getPlaceId(place);
  return favoritePlaces.some((item) => item.placeId === placeId);
}

function toggleFavorite(place) {
  const normalizedPlace = enrichPlace(place);
  const index = favoritePlaces.findIndex((item) => item.placeId === normalizedPlace.placeId);

  if (index >= 0) {
    favoritePlaces.splice(index, 1);
    saveFavorites();
    return false;
  }

  favoritePlaces.unshift(normalizedPlace);
  saveFavorites();
  return true;
}

function applyTranslations() {
  const dict = getDict();

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.innerHTML = dict[key];
    }
  });

  document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
    const key = el.getAttribute('data-i18n-ph');
    if (dict[key]) {
      el.setAttribute('placeholder', dict[key]);
    }
  });

  langToggleBtn.innerHTML = currentLang === 'th' ? '🇹🇭 TH' : '🇬🇧 EN';
  renderFavorites();
}

function toggleLanguage() {
  currentLang = currentLang === 'th' ? 'en' : 'th';
  localStorage.setItem('pinme_lang', currentLang);

  applyTranslations();

  if (resultsContainer.classList.contains('visible') && loadingState.style.display !== 'flex') {
    renderResults(currentResults);
  }

  mapRadiusBadge.textContent = getDict().map_radius.replace('{val}', selectedRadius);
  syncRadiusLabels();
  const isCollapsed = mapWrapper.classList.contains('collapsed');
  mapToggleBtn.textContent = isCollapsed ? getDict().btn_show_map : getDict().btn_hide_map;
  renderTripPlan(tripTimeline, getDict());

  const lat = parseFloat(latInput.value);
  const lng = parseFloat(lngInput.value);
  if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
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

function createPlaceCard(place, dict, options = {}) {
  const { index = 0, cardClassName = '' } = options;
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
  const pinned = isFavorite(place);
  const cardIndex = String(index + 1).padStart(2, '0');
  const imageMarkup = place.thumbnail
    ? `<img class="card-thumb" src="${escapeHtml(place.thumbnail)}" alt="${escapeHtml(name)}">`
    : `<div class="card-icon card-icon-large">${categoryIcon}</div>`;

  const card = document.createElement('div');
  card.className = `result-card ${cardClassName}`.trim();
  card.style.animationDelay = `${index * 0.06}s`;
  card.innerHTML = `
    <div class="card-visual">
      ${imageMarkup}
      <div class="card-visual-overlay">
        <div class="card-topline">
          <span class="card-index">#${cardIndex}</span>
          ${pinned ? '<span class="card-favorite-flag">Saved</span>' : ''}
        </div>
        <div class="card-visual-meta">
          ${categoryBadge}
          ${distanceText ? `<span class="meta-pill meta-pill-on-image">📍 ${distanceText}</span>` : ''}
        </div>
      </div>
    </div>
    <div class="card-body">
      <div class="card-content">
        <div class="card-header">
          <div class="card-heading">
            <h3 class="card-title">${escapeHtml(name)}</h3>
            ${place.address ? `<p class="card-address">${escapeHtml(place.address)}</p>` : ''}
          </div>
        </div>
        <div class="card-meta">
          ${place.rating ? `<span class="meta-pill meta-pill-star">⭐ ${place.rating}</span>` : ''}
          ${distanceText ? `<span class="meta-pill">📍 ${distanceText}</span>` : ''}
        </div>
      </div>
    </div>
    <div class="card-actions">
      <button class="card-btn card-btn-detail">${dict.btn_detail}</button>
      <button class="card-btn card-btn-pin ${pinned ? 'pinned' : ''}">${pinned ? dict.btn_pinned : dict.btn_pin}</button>
    </div>
  `;

  const detailBtn = card.querySelector('.card-btn-detail');
  const pinBtn = card.querySelector('.card-btn-pin');
  const thumbImg = card.querySelector('.card-thumb');

  if (thumbImg) {
    thumbImg.addEventListener('error', () => {
      thumbImg.replaceWith(Object.assign(document.createElement('div'), {
        className: 'card-icon',
        textContent: categoryIcon,
      }));
    });
  }

  detailBtn.addEventListener('click', () => {
    openDetailModal(place);
  });

  pinBtn.addEventListener('click', () => {
    const nowPinned = toggleFavorite(place);
    pinBtn.classList.toggle('pinned', nowPinned);
    pinBtn.innerHTML = nowPinned ? dict.btn_pinned : dict.btn_pin;
    showToast(
      nowPinned
        ? `⭐ ${dict.toast_pinned} "${name}"`
        : `❌ ${dict.toast_unpinned} "${name}"`,
      nowPinned ? 'success' : 'warning'
    );
    renderFavorites();
    renderPlaces(currentResults);
  });

  return card;
}

function renderPlaces(places) {
  const dict = getDict();
  resultsCount.textContent = `${places.length} ${dict.toast_places}`;
  resultsGrid.innerHTML = '';

  places.forEach((place, index) => {
    resultsGrid.appendChild(createPlaceCard(place, dict, { index }));
  });
}

function renderFavorites() {
  const dict = getDict();
  favoritesCount.textContent = `${favoritePlaces.length}`;
  favoritesGrid.innerHTML = '';

  if (favoritePlaces.length === 0) {
    favoritesEmptyState.style.display = 'flex';
    return;
  }

  favoritesEmptyState.style.display = 'none';

  favoritePlaces.forEach((place, index) => {
    favoritesGrid.appendChild(createPlaceCard(place, dict, { index, cardClassName: 'favorite-card' }));
  });
}

function renderResults(data) {
  const results = (Array.isArray(data) ? data : data.results || []).map(enrichPlace);
  currentResults = results;
  resultsContainer.classList.add('visible');
  loadingState.style.display = 'none';

  if (results.length === 0) {
    resultsGrid.innerHTML = '';
    emptyState.style.display = 'flex';
    emptyState.querySelector('.empty-title').textContent = getDict().empty_res_title;
    emptyState.querySelector('.empty-desc').textContent = getDict().empty_res_desc;
    resultsCount.textContent = `0 ${getDict().toast_places}`;
    return;
  }

  emptyState.style.display = 'none';
  renderPlaces(results);
  addPlaceMarkers(results, getDict());
}

function openDetailModal(place) {
  const dict = getDict();
  const normalizedPlace = enrichPlace(place);
  const name = normalizedPlace.name || dict.unknown_name;
  const category = normalizedPlace.category || 'other';

  modalTitle.textContent = name;
  modalCategoryBadge.innerHTML = getCategoryBadge(category, dict);
  modalAddress.textContent = normalizedPlace.address || dict.modal_no_address;

  if (normalizedPlace.rating) {
    modalRatingContainer.style.display = 'flex';
    modalRating.textContent = `${normalizedPlace.rating} / 5.0`;
  } else {
    modalRatingContainer.style.display = 'none';
  }

  if (normalizedPlace.thumbnail) {
    modalImageContainer.classList.remove('hidden');
    modalImage.src = normalizedPlace.thumbnail;
    modalImage.alt = name;
  } else {
    modalImage.removeAttribute('src');
    modalImageContainer.classList.add('hidden');
  }

  detailModal.classList.remove('hidden');
  detailModal.classList.add('flex');
  requestAnimationFrame(() => {
    modalContent.classList.remove('scale-95', 'opacity-0');
    modalContent.classList.add('scale-100', 'opacity-100');
  });

  const placeLat = normalizedPlace.lat ?? normalizedPlace.latitude;
  const placeLng = normalizedPlace.lng ?? normalizedPlace.longitude;
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

langToggleBtn.addEventListener('click', toggleLanguage);
themeToggleBtn.addEventListener('click', toggleTheme);

mapToggleBtn.addEventListener('click', () => {
  const isCollapsed = mapWrapper.classList.toggle('collapsed');
  mapToggleBtn.textContent = isCollapsed ? getDict().btn_show_map : getDict().btn_hide_map;
  if (!isCollapsed) {
    invalidateMapSize();
  }
});

document.querySelectorAll('.radius-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.radius-chip').forEach((item) => item.classList.remove('active'));
    chip.classList.add('active');
    selectedRadius = chip.dataset.value;
    updateRadiusCircleAndMap(selectedRadius, getDict(), mapRadiusBadge);
    syncRadiusLabels();
  });
});

document.querySelectorAll('.category-pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.category-pill').forEach((item) => item.classList.remove('active'));
    pill.classList.add('active');
    selectedCategory = pill.dataset.value;
  });
});

gpsBtn.addEventListener('click', () => {
  const dict = getDict();
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
      gpsBtn.classList.remove('loading');
      gpsBtn.querySelector('.gps-text').textContent = dict.btn_gps;
      showToast(dict.toast_gps_success, 'success');
      updateMapState(lat, lng);
    },
    (error) => {
      gpsBtn.classList.remove('loading');
      gpsBtn.querySelector('.gps-text').textContent = dict.btn_gps;

      const messages = {
        1: dict.toast_gps_denied,
        2: dict.toast_gps_unavail,
        3: dict.toast_gps_timeout,
      };
      showToast(messages[error.code] || dict.toast_gps_fail, 'error');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

tripForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const nameInput = tripActivityName.value.trim();
  const startTime = tripStartTime.value;
  const endTime = tripEndTime.value;

  const success = addTripActivity(nameInput, startTime, endTime, tripTimeline, getDict());
  if (success) {
    tripActivityName.value = '';
    tripStartTime.value = '';
    tripEndTime.value = '';
  }
});

searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const lat = parseFloat(latInput.value);
  const lng = parseFloat(lngInput.value);
  const dict = getDict();

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
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
    radius: parseInt(selectedRadius, 10),
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
    console.error('Fetch Error:', error);
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

modalCloseBtnTop.addEventListener('click', closeDetailModal);
modalCloseBtnBottom.addEventListener('click', closeDetailModal);
modalBackdrop.addEventListener('click', closeDetailModal);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !detailModal.classList.contains('hidden')) {
    closeDetailModal();
  }
});

modalImage.addEventListener('error', () => {
  modalImage.removeAttribute('src');
  modalImageContainer.classList.add('hidden');
  showToast(getDict().toast_image_unavailable, 'warning');
});

applyTheme();
applyTranslations();
syncRadiusLabels();

(function showDemoData() {
  const defaultLat = 13.7367;
  const defaultLng = 100.5232;

  latInput.value = defaultLat;
  lngInput.value = defaultLng;

  updateMapState(defaultLat, defaultLng);
  renderTripPlan(tripTimeline, getDict());
  renderFavorites();

  const demoPlaces = MOCK_PLACES.map(enrichPlace);
  currentResults = demoPlaces;
  resultsContainer.classList.add('visible');
  emptyState.style.display = 'none';
  renderPlaces(demoPlaces);
  addPlaceMarkers(demoPlaces, getDict());
})();
