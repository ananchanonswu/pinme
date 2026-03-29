// ==========================================
// PinMe - Location Scanner App
// ==========================================

const API_ENDPOINT = 'http://localhost:3000/scan';

// ==========================================
// Mock Data (สำหรับทดสอบ)
// ==========================================
const MOCK_PLACES = [
  {
    name: 'โรงแรมริเวอร์ไซด์ กรุงเทพ',
    category: 'hotel',
    distance: 1.2,
    lat: 13.7248,
    lng: 100.5108,
    address: '257/1-3 ถ.เจริญนคร แขวงสำเหร่ เขตธนบุรี กรุงเทพฯ',
    rating: 4.5,
  },
  {
    name: 'ร้านครัวบ้านย่า',
    category: 'restaurant',
    distance: 0.8,
    lat: 13.7301,
    lng: 100.5220,
    address: '12 ซอยสุขุมวิท 26 แขวงคลองตัน เขตคลองเตย กรุงเทพฯ',
    rating: 4.7,
  },
  {
    name: 'สนามกีฬาราชมังคลากีฬาสถาน',
    category: 'sport',
    distance: 3.5,
    lat: 13.7553,
    lng: 100.6210,
    address: 'ถ.รามคำแหง แขวงหัวหมาก เขตบางกะปิ กรุงเทพฯ',
    rating: 4.2,
  },
  {
    name: 'วัดพระแก้ว',
    category: 'tourist',
    distance: 5.0,
    lat: 13.7516,
    lng: 100.4927,
    address: 'ถ.หน้าพระลาน แขวงพระบรมมหาราชวัง เขตพระนคร กรุงเทพฯ',
    rating: 4.9,
  },
  {
    name: 'Café Amazon สาขาสยามสแควร์',
    category: 'restaurant',
    distance: 2.1,
    lat: 13.7455,
    lng: 100.5346,
    address: 'สยามสแควร์ ซอย 3 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ',
    rating: 4.0,
  },
  {
    name: 'โรงแรมเดอะสุโขทัย',
    category: 'hotel',
    distance: 4.3,
    lat: 13.7225,
    lng: 100.5355,
    address: '13/3 ถ.สาทรใต้ แขวงทุ่งมหาเมฆ เขตสาทร กรุงเทพฯ',
    rating: 4.8,
  },
];

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

// --- State ---
let selectedRadius = '3';
let selectedCategory = 'all';

// --- Map State ---
let map = null;
let userMarker = null;
let radiusCircle = null;
let placeMarkersLayer = null;

// ==========================================
// initMap — สร้างแผนที่เริ่มต้น + ปักหมุดผู้ใช้
// ==========================================
/**
 * @param {number} lat - Latitude ของจุดตั้งต้น
 * @param {number} lng - Longitude ของจุดตั้งต้น
 *
 * สร้าง Leaflet Map, ปักหมุดจุดเริ่มต้น + วงกลมรัศมี
 * แล้ว Popup แสดง "คุณอยู่ที่นี่"
 */
function initMap(lat, lng) {
  // ถ้าแผนที่ยังไม่ได้สร้าง → สร้างใหม่
  if (!map) {
    map = L.map('map', {
      zoomControl: true,
      attributionControl: true,
    }).setView([lat, lng], 13);

    // Dark-toned tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Layer group สำหรับหมุดสถานที่
    placeMarkersLayer = L.layerGroup().addTo(map);
  } else {
    map.setView([lat, lng], 13);
  }

  // --- ลบ Marker / Circle เดิม ---
  if (userMarker) map.removeLayer(userMarker);
  if (radiusCircle) map.removeLayer(radiusCircle);

  // --- สร้าง User Marker ด้วย Custom Icon ---
  const userIcon = L.divIcon({
    className: 'user-marker-icon',
    html: `<div style="
      width: 24px; height: 24px;
      background: linear-gradient(135deg, #0d9488, #14b8a6);
      border: 3px solid #f1f5f9;
      border-radius: 50%;
      box-shadow: 0 0 12px rgba(13,148,136,0.6), 0 0 24px rgba(13,148,136,0.3);
      animation: pulseMarker 2s ease-in-out infinite;
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -16],
  });

  userMarker = L.marker([lat, lng], { icon: userIcon })
    .addTo(map)
    .bindPopup(`
      <div class="popup-card">
        <strong>📍 คุณอยู่ที่นี่</strong>
        <span class="popup-distance">${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
      </div>
    `)
    .openPopup();

  // --- วงกลมรัศมีค้นหา ---
  const radiusKm = parseInt(selectedRadius);
  radiusCircle = L.circle([lat, lng], {
    radius: radiusKm * 1000,
    color: '#0d9488',
    fillColor: '#14b8a6',
    fillOpacity: 0.08,
    weight: 1.5,
    dashArray: '6 4',
  }).addTo(map);

  // อัปเดต badge
  mapRadiusBadge.textContent = `รัศมี ${radiusKm} กม.`;

  // Fit bounds ให้เห็นวงกลมทั้งหมด
  map.fitBounds(radiusCircle.getBounds(), { padding: [30, 30] });

  console.log(`🗺️ Map initialized at ${lat}, ${lng} with radius ${radiusKm} km`);
}

// ==========================================
// addPlaceMarkers — ปักหมุดสถานที่ผลลัพธ์
// ==========================================
/**
 * @param {Array} placesArray - Array of { name, lat, lng, category?, distance?, ... }
 *
 * ลูปปักหมุดสถานที่ลงบนแผนที่ + Popup แสดงข้อมูล
 */
function addPlaceMarkers(placesArray) {
  // เคลียร์หมุดเก่า
  if (placeMarkersLayer) placeMarkersLayer.clearLayers();

  const categoryColors = {
    hotel: '#818cf8',
    restaurant: '#fbbf24',
    sport: '#4ade80',
    tourist: '#f472b6',
  };

  placesArray.forEach((place) => {
    const lat = place.lat ?? place.latitude;
    const lng = place.lng ?? place.longitude;

    // ข้ามหากไม่มีพิกัด
    if (lat == null || lng == null) return;

    const color = categoryColors[place.category] || '#14b8a6';
    const icon = getCategoryIcon(place.category);

    // Custom colored marker
    const markerIcon = L.divIcon({
      className: 'place-marker-icon',
      html: `<div style="
        width: 32px; height: 32px;
        background: ${color};
        border: 2px solid rgba(255,255,255,0.9);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 3px 12px ${color}66;
      ">
        <span style="transform: rotate(45deg); font-size: 14px;">${icon}</span>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -34],
    });

    // ระยะทาง
    const distText = place.distance != null
      ? (place.distance < 1
          ? `${(place.distance * 1000).toFixed(0)} ม.`
          : `${place.distance.toFixed(1)} กม.`)
      : '';

    const categoryLabel = getCategoryBadgeText(place.category);

    const marker = L.marker([lat, lng], { icon: markerIcon })
      .addTo(placeMarkersLayer)
      .bindPopup(`
        <div class="popup-card">
          <strong>${escapeHtml(place.name || 'ไม่ทราบชื่อ')}</strong>
          <span class="popup-category">${categoryLabel}</span>
          ${distText ? `<span class="popup-distance">📍 ${distText}</span>` : ''}
          ${place.rating ? `<span class="popup-distance">⭐ ${place.rating}</span>` : ''}
        </div>
      `);
  });

  console.log(`📌 Added ${placesArray.length} place markers to the map`);
}

// ==========================================
// Map Toggle (ซ่อน/แสดง)
// ==========================================
mapToggleBtn.addEventListener('click', () => {
  const isCollapsed = mapWrapper.classList.toggle('collapsed');
  mapToggleBtn.textContent = isCollapsed ? '🔼 แสดงแผนที่' : '🔽 ซ่อนแผนที่';

  // Leaflet ต้อง invalidateSize เมื่อแสดง
  if (!isCollapsed && map) {
    setTimeout(() => map.invalidateSize(), 450);
  }
});

// ==========================================
// Radius Chip Selection
// ==========================================
document.querySelectorAll('.radius-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.radius-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    selectedRadius = chip.dataset.value;

    // อัปเดตวงกลมรัศมีบนแผนที่
    if (map && radiusCircle && userMarker) {
      const latlng = userMarker.getLatLng();
      map.removeLayer(radiusCircle);
      radiusCircle = L.circle([latlng.lat, latlng.lng], {
        radius: parseInt(selectedRadius) * 1000,
        color: '#0d9488',
        fillColor: '#14b8a6',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '6 4',
      }).addTo(map);
      map.fitBounds(radiusCircle.getBounds(), { padding: [30, 30] });
      mapRadiusBadge.textContent = `รัศมี ${selectedRadius} กม.`;
    }
  });
});

// ==========================================
// Category Pill Selection
// ==========================================
document.querySelectorAll('.category-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    selectedCategory = pill.dataset.value;
  });
});

// ==========================================
// GPS Geolocation
// ==========================================
gpsBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    showToast('เบราว์เซอร์ไม่รองรับ Geolocation', 'error');
    return;
  }

  gpsBtn.classList.add('loading');
  gpsBtn.querySelector('.gps-text').textContent = 'กำลังหาตำแหน่ง...';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      latInput.value = lat.toFixed(6);
      lngInput.value = lng.toFixed(6);

      // Trigger input animations
      latInput.style.borderColor = 'var(--success)';
      lngInput.style.borderColor = 'var(--success)';
      setTimeout(() => {
        latInput.style.borderColor = '';
        lngInput.style.borderColor = '';
      }, 1500);

      gpsBtn.classList.remove('loading');
      gpsBtn.querySelector('.gps-text').textContent = 'ใช้ตำแหน่งปัจจุบัน';
      showToast('✅ ได้รับพิกัดตำแหน่งแล้ว', 'success');

      // อัปเดตแผนที่ไปยังตำแหน่ง GPS
      initMap(lat, lng);
    },
    (error) => {
      gpsBtn.classList.remove('loading');
      gpsBtn.querySelector('.gps-text').textContent = 'ใช้ตำแหน่งปัจจุบัน';

      const messages = {
        1: 'ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง',
        2: 'ไม่สามารถหาตำแหน่งได้',
        3: 'หมดเวลาในการหาตำแหน่ง',
      };
      showToast(messages[error.code] || 'เกิดข้อผิดพลาด', 'error');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

// ==========================================
// Form Submission & Fetch API
// ==========================================
searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const lat = parseFloat(latInput.value);
  const lng = parseFloat(lngInput.value);

  // --- Validation ---
  if (isNaN(lat) || isNaN(lng)) {
    showToast('⚠️ กรุณากรอกพิกัด Latitude และ Longitude', 'warning');
    return;
  }

  if (lat < -90 || lat > 90) {
    showToast('⚠️ Latitude ต้องอยู่ระหว่าง -90 ถึง 90', 'warning');
    return;
  }

  if (lng < -180 || lng > 180) {
    showToast('⚠️ Longitude ต้องอยู่ระหว่าง -180 ถึง 180', 'warning');
    return;
  }

  // --- Build Request Body ---
  const requestBody = {
    latitude: lat,
    longitude: lng,
    radius: parseInt(selectedRadius),
    category: selectedCategory,
  };

  console.log('📤 Sending request:', requestBody);

  // --- อัปเดตแผนที่ไปยังจุดค้นหา ---
  initMap(lat, lng);

  // --- UI: Loading State ---
  setLoadingState(true);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Server Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📥 Response data:', data);

    // --- Render Results + Map Markers ---
    renderResults(data);
    showToast(`✅ พบ ${data.results?.length || 0} สถานที่`, 'success');

  } catch (error) {
    console.error('❌ Fetch Error:', error);

    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      showToast('❌ ไม่สามารถเชื่อมต่อ Server ได้', 'error');
    } else {
      showToast(`❌ ${error.message}`, 'error');
    }

    // Show empty state with error
    resultsContainer.classList.add('visible');
    loadingState.style.display = 'none';
    resultsGrid.innerHTML = '';
    emptyState.style.display = 'flex';
    emptyState.querySelector('.empty-title').textContent = 'เชื่อมต่อไม่สำเร็จ';
    emptyState.querySelector('.empty-desc').textContent =
      'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง';

  } finally {
    setLoadingState(false);
  }
});

// ==========================================
// Render Results (wrapper for API response)
// ==========================================
function renderResults(data) {
  const results = data.results || data || [];
  resultsContainer.classList.add('visible');
  loadingState.style.display = 'none';

  if (!Array.isArray(results) || results.length === 0) {
    resultsGrid.innerHTML = '';
    emptyState.style.display = 'flex';
    emptyState.querySelector('.empty-title').textContent = 'ไม่พบสถานที่';
    emptyState.querySelector('.empty-desc').textContent =
      'ลองเปลี่ยนรัศมีหรือหมวดหมู่แล้วค้นหาอีกครั้ง';
    resultsCount.textContent = '0 สถานที่';
    return;
  }

  emptyState.style.display = 'none';
  renderPlaces(results);

  // ปักหมุดสถานที่ผลลัพธ์บนแผนที่
  addPlaceMarkers(results);
}

// ==========================================
// renderPlaces — สร้าง Card จาก Array of Places
// ==========================================
function renderPlaces(places) {
  resultsCount.textContent = `${places.length} สถานที่`;
  resultsGrid.innerHTML = '';

  places.forEach((place, index) => {
    const name        = place.name     || 'ไม่ทราบชื่อ';
    const category    = place.category || place.type || 'other';
    const distanceRaw = place.distance;

    const distanceText = distanceRaw != null
      ? (distanceRaw < 1
          ? `${(distanceRaw * 1000).toFixed(0)} ม.`
          : `${distanceRaw.toFixed(1)} กม.`)
      : null;

    const categoryBadge = getCategoryBadge(category);
    const categoryIcon  = getCategoryIcon(category);

    const card = document.createElement('div');
    card.className = 'result-card';
    card.style.animationDelay = `${index * 0.06}s`;

    card.innerHTML = `
      <div class="card-body">
        <div class="card-icon">
          ${categoryIcon}
        </div>
        <div class="card-content">
          <div class="card-header">
            <h3 class="card-title">${escapeHtml(name)}</h3>
            ${categoryBadge}
          </div>
          ${place.address
            ? `<p class="card-address">${escapeHtml(place.address)}</p>`
            : ''}
          <div class="card-meta">
            ${distanceText ? `<span>📍 ${distanceText}</span>` : ''}
            ${place.rating  ? `<span>⭐ ${place.rating}</span>` : ''}
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="card-actions">
        <button class="card-btn card-btn-detail" data-place-index="${index}">
          🔎 ดูรายละเอียด
        </button>
        <button class="card-btn card-btn-pin" data-place-index="${index}">
          📌 ปักหมุด (Pin)
        </button>
      </div>
    `;

    // --- Event Listeners ---
    const detailBtn = card.querySelector('.card-btn-detail');
    const pinBtn    = card.querySelector('.card-btn-pin');

    detailBtn.addEventListener('click', () => {
      // Pan แผนที่ไปยังสถานที่นั้น
      const placeLat = place.lat ?? place.latitude;
      const placeLng = place.lng ?? place.longitude;
      if (map && placeLat != null && placeLng != null) {
        map.flyTo([placeLat, placeLng], 16, { animate: true, duration: 0.8 });
        // เปิด popup ของ marker ที่ตรงกัน
        if (placeMarkersLayer) {
          placeMarkersLayer.eachLayer((layer) => {
            const pos = layer.getLatLng();
            if (Math.abs(pos.lat - placeLat) < 0.0001 && Math.abs(pos.lng - placeLng) < 0.0001) {
              layer.openPopup();
            }
          });
        }
      }
      showToast(`📋 ${escapeHtml(name)} — ดูตำแหน่งบนแผนที่`, 'success');
      console.log('🔎 ดูรายละเอียด:', place);
    });

    pinBtn.addEventListener('click', () => {
      const isPinned = pinBtn.classList.toggle('pinned');
      pinBtn.innerHTML = isPinned ? '📍 ปักหมุดแล้ว' : '📌 ปักหมุด (Pin)';
      showToast(
        isPinned
          ? `📍 ปักหมุด "${escapeHtml(name)}" แล้ว`
          : `❌ ยกเลิกหมุด "${escapeHtml(name)}"`,
        isPinned ? 'success' : 'warning'
      );
      console.log(isPinned ? '📍 Pinned:' : '❌ Unpinned:', place);
    });

    resultsGrid.appendChild(card);
  });
}

// ==========================================
// Helpers
// ==========================================
function getCategoryBadge(category) {
  const map = {
    hotel: '<span class="badge badge-hotel">โรงแรม</span>',
    restaurant: '<span class="badge badge-restaurant">ร้านอาหาร</span>',
    sport: '<span class="badge badge-sport">สนามกีฬา</span>',
    tourist: '<span class="badge badge-tourist">ท่องเที่ยว</span>',
  };
  return map[category] || '';
}

function getCategoryBadgeText(category) {
  const map = {
    hotel: '🏨 โรงแรม',
    restaurant: '🍽️ ร้านอาหาร',
    sport: '⚽ สนามกีฬา',
    tourist: '🏛️ ท่องเที่ยว',
  };
  return map[category] || '📍 สถานที่';
}

function getCategoryIcon(category) {
  const map = {
    hotel: '🏨',
    restaurant: '🍽️',
    sport: '⚽',
    tourist: '🏛️',
  };
  return map[category] || '📍';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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

// ==========================================
// Toast Notification
// ==========================================
function showToast(message, type = 'success') {
  document.querySelectorAll('.toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// ==========================================
// Demo: แสดง Mock Data + แผนที่ เมื่อเปิดหน้าเว็บ
// ==========================================
(function showDemoData() {
  // ตั้งค่าเริ่มต้น: กรุงเทพมหานคร
  const defaultLat = 13.7367;
  const defaultLng = 100.5232;

  // เติมค่า lat/lng ลง input
  latInput.value = defaultLat;
  lngInput.value = defaultLng;

  // เริ่มต้นแผนที่ ณ จุด Default
  initMap(defaultLat, defaultLng);

  // แสดงการ์ดผลลัพธ์
  resultsContainer.classList.add('visible');
  emptyState.style.display = 'none';
  renderPlaces(MOCK_PLACES);

  // ปักหมุดสถานที่ Mock ลงบนแผนที่
  addPlaceMarkers(MOCK_PLACES);
})();
