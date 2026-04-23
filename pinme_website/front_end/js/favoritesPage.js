import { escapeHtml, getCategoryBadge, getCategoryIcon, showToast } from './utils/helpers.js';

const FAVORITES_STORAGE_KEY = 'pinme_favorites';
const PAGE_COPY = {
  en: {
    nav_scanner: 'Scanner',
    nav_favorites: 'Favorites',
    nav_trip: 'Trip Planner',
    fav_kicker: 'Saved Places',
    fav_title: 'Favorites',
    fav_subtitle: 'Review places pinned from the scanner and remove places that no longer fit your trip.',
    fav_saved: 'Saved',
    fav_storage: 'Storage',
    fav_local: 'Local',
    fav_panel_kicker: 'Favorite Places',
    fav_panel_title: 'Pinned location list',
    fav_scan_more: 'Scan more',
    fav_empty_title: 'No favorite places yet',
    fav_empty_desc: 'Open the Scanner page, search for nearby places, then pin cards to save them here.',
    res_badge_hotel: 'Hotel',
    res_badge_restaurant: 'Restaurant',
    res_badge_sport: 'Sport',
    res_badge_tourist: 'Tourist',
    unit_km: 'km',
    unit_m: 'm',
    saved_flag: 'Saved',
    rating_label: 'Rating',
    plan_trip: 'Plan trip',
    remove: 'Remove',
    removed: 'Removed',
  },
  th: {
    nav_scanner: 'สแกน',
    nav_favorites: 'รายการโปรด',
    nav_trip: 'แผนทริป',
    fav_kicker: 'สถานที่ที่บันทึกไว้',
    fav_title: 'รายการโปรด',
    fav_subtitle: 'ดูสถานที่ที่ปักหมุดจากหน้า Scanner และลบสถานที่ที่ไม่ต้องการออกจากแผนได้',
    fav_saved: 'บันทึกแล้ว',
    fav_storage: 'การเก็บข้อมูล',
    fav_local: 'ในเครื่อง',
    fav_panel_kicker: 'สถานที่โปรด',
    fav_panel_title: 'รายการสถานที่ที่ปักหมุด',
    fav_scan_more: 'สแกนเพิ่ม',
    fav_empty_title: 'ยังไม่มีสถานที่โปรด',
    fav_empty_desc: 'เปิดหน้า Scanner ค้นหาสถานที่ใกล้เคียง แล้วกดบันทึกการ์ดสถานที่เพื่อแสดงที่นี่',
    res_badge_hotel: 'โรงแรม',
    res_badge_restaurant: 'ร้านอาหาร',
    res_badge_sport: 'กีฬา',
    res_badge_tourist: 'ท่องเที่ยว',
    unit_km: 'กม.',
    unit_m: 'ม.',
    saved_flag: 'บันทึกแล้ว',
    rating_label: 'คะแนน',
    plan_trip: 'วางแผนทริป',
    remove: 'ลบ',
    removed: 'ลบแล้ว',
  },
};

const grid = document.getElementById('favoritesPageGrid');
const emptyState = document.getElementById('favoritesEmptyState');
const favoriteTotal = document.getElementById('favoriteTotal');
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
  langToggleBtn.textContent = currentLang === 'th' ? 'TH' : 'EN';
  renderFavorites();
}

function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveFavorites(places) {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(places));
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

function formatDistance(distance) {
  const dict = getDict();
  if (distance == null || Number.isNaN(Number(distance))) return '';
  const numericDistance = Number(distance);
  if (numericDistance < 1) return `${(numericDistance * 1000).toFixed(0)} ${dict.unit_m}`;
  return `${numericDistance.toFixed(1)} ${dict.unit_km}`;
}

function renderFavorites() {
  const dict = getDict();
  const favorites = loadFavorites();
  favoriteTotal.textContent = String(favorites.length);
  grid.innerHTML = '';

  if (favorites.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';

  favorites.forEach((place, index) => {
    const category = place.category || 'tourist';
    const icon = getCategoryIcon(category);
    const distance = formatDistance(place.distance);
    const card = document.createElement('article');
    card.className = 'result-card favorite-card';
    card.style.animationDelay = `${index * 0.05}s`;
    card.innerHTML = `
      <div class="card-visual">
        ${place.thumbnail ? `<img class="card-thumb" src="${escapeHtml(place.thumbnail)}" alt="${escapeHtml(place.name || 'Favorite place')}" />` : `<div class="card-icon card-icon-large">${icon}</div>`}
        <div class="card-visual-overlay">
          <div class="card-topline">
            <span class="card-index">#${String(index + 1).padStart(2, '0')}</span>
            <span class="card-favorite-flag">${dict.saved_flag}</span>
          </div>
          <div class="card-visual-meta">
            ${getCategoryBadge(category, dict)}
            ${distance ? `<span class="meta-pill meta-pill-on-image">${distance}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="card-body">
        <div class="card-content">
          <h3 class="card-title">${escapeHtml(place.name || 'Unknown place')}</h3>
          ${place.address ? `<p class="card-address">${escapeHtml(place.address)}</p>` : ''}
          <div class="card-meta">
            ${place.rating ? `<span class="meta-pill meta-pill-star">${dict.rating_label} ${escapeHtml(String(place.rating))}</span>` : ''}
            ${distance ? `<span class="meta-pill">${distance}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="card-actions two-actions">
        <a class="card-btn card-btn-trip page-card-link" href="trip-planner.html">${dict.plan_trip}</a>
        <button class="card-btn card-btn-pin pinned" type="button">${dict.remove}</button>
      </div>
    `;

    card.querySelector('button').addEventListener('click', () => {
      const id = place.placeId || getPlaceId(place);
      const nextFavorites = loadFavorites().filter((item) => (item.placeId || getPlaceId(item)) !== id);
      saveFavorites(nextFavorites);
      showToast(`${dict.removed} "${place.name || 'place'}"`, 'warning');
      renderFavorites();
    });

    grid.appendChild(card);
  });
}

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
