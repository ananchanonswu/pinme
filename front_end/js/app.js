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
    address: '257/1-3 ถ.เจริญนคร แขวงสำเหร่ เขตธนบุรี กรุงเทพฯ',
    rating: 4.5,
  },
  {
    name: 'ร้านครัวบ้านย่า',
    category: 'restaurant',
    distance: 0.8,
    address: '12 ซอยสุขุมวิท 26 แขวงคลองตัน เขตคลองเตย กรุงเทพฯ',
    rating: 4.7,
  },
  {
    name: 'สนามกีฬาราชมังคลากีฬาสถาน',
    category: 'sport',
    distance: 3.5,
    address: 'ถ.รามคำแหง แขวงหัวหมาก เขตบางกะปิ กรุงเทพฯ',
    rating: 4.2,
  },
  {
    name: 'วัดพระแก้ว',
    category: 'tourist',
    distance: 5.0,
    address: 'ถ.หน้าพระลาน แขวงพระบรมมหาราชวัง เขตพระนคร กรุงเทพฯ',
    rating: 4.9,
  },
  {
    name: 'Café Amazon สาขาสยามสแควร์',
    category: 'restaurant',
    distance: 2.1,
    address: 'สยามสแควร์ ซอย 3 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ',
    rating: 4.0,
  },
  {
    name: 'โรงแรมเดอะสุโขทัย',
    category: 'hotel',
    distance: 4.3,
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

// --- State ---
let selectedRadius = '3';
let selectedCategory = 'all';

// ==========================================
// Radius Chip Selection
// ==========================================
document.querySelectorAll('.radius-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.radius-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    selectedRadius = chip.dataset.value;
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
      latInput.value = position.coords.latitude.toFixed(6);
      lngInput.value = position.coords.longitude.toFixed(6);

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

    // --- Render Results ---
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
}

// ==========================================
// renderPlaces — สร้าง Card จาก Array of Places
// ==========================================
/**
 * รับ Array of Objects ที่มี:
 *   - name       (string)  ชื่อสถานที่
 *   - category   (string)  หมวดหมู่ เช่น hotel, restaurant, sport, tourist
 *   - distance   (number)  ระยะทาง (กม.)
 *   - address?   (string)  ที่อยู่ (optional)
 *   - rating?    (number)  คะแนน (optional)
 *
 * แล้ว render เป็น Card พร้อมปุ่ม "ดูรายละเอียด" และ "ปักหมุด (Pin)"
 * แทรกลงใน #resultsGrid
 */
function renderPlaces(places) {
  // อัปเดตจำนวนผลลัพธ์
  resultsCount.textContent = `${places.length} สถานที่`;

  // เคลียร์ผลลัพธ์เดิม
  resultsGrid.innerHTML = '';

  places.forEach((place, index) => {
    // --- ข้อมูลที่ต้องแสดง ---
    const name        = place.name     || 'ไม่ทราบชื่อ';
    const category    = place.category || place.type || 'other';
    const distanceRaw = place.distance;

    // แปลงระยะทาง: < 1 กม. แสดงเป็น เมตร
    const distanceText = distanceRaw != null
      ? (distanceRaw < 1
          ? `${(distanceRaw * 1000).toFixed(0)} ม.`
          : `${distanceRaw.toFixed(1)} กม.`)
      : null;

    const categoryBadge = getCategoryBadge(category);
    const categoryIcon  = getCategoryIcon(category);

    // --- สร้าง DOM Element ---
    const card = document.createElement('div');
    card.className = 'result-card';
    card.style.animationDelay = `${index * 0.06}s`;

    card.innerHTML = `
      <div class="card-body">
        <!-- Icon -->
        <div class="card-icon">
          ${categoryIcon}
        </div>

        <!-- Content -->
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
      showToast(`📋 ${escapeHtml(name)} — รายละเอียดจะเปิดเร็ว ๆ นี้`, 'success');
      console.log('🔎 ดูรายละเอียด:', place);
    });

    pinBtn.addEventListener('click', () => {
      // Toggle pin state
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
  // Remove existing toasts
  document.querySelectorAll('.toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Auto-hide
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// ==========================================
// Demo: แสดง Mock Data เมื่อเปิดหน้าเว็บ
// ==========================================
(function showDemoData() {
  resultsContainer.classList.add('visible');
  emptyState.style.display = 'none';
  renderPlaces(MOCK_PLACES);
})();
