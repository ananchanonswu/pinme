// ==========================================
// PinMe - Location Scanner App
// ==========================================

const API_ENDPOINT = 'http://localhost:3000/scan';

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
// Render Results
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
  resultsCount.textContent = `${results.length} สถานที่`;

  resultsGrid.innerHTML = results.map((place, i) => {
    const categoryBadge = getCategoryBadge(place.category || place.type || 'other');
    const distance = place.distance
      ? `${place.distance < 1 ? (place.distance * 1000).toFixed(0) + ' ม.' : place.distance.toFixed(1) + ' กม.'}`
      : '';

    return `
      <div class="result-card" style="animation-delay: ${i * 0.05}s">
        <div style="display: flex; align-items: flex-start; gap: 0.85rem;">
          <div style="
            width: 3rem; height: 3rem;
            background: linear-gradient(135deg, rgba(13,148,136,0.2), rgba(13,148,136,0.05));
            border-radius: 0.75rem;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.3rem; flex-shrink: 0;
          ">
            ${getCategoryIcon(place.category || place.type)}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem;">
              <h3 style="font-size: 0.95rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${escapeHtml(place.name || 'ไม่ทราบชื่อ')}
              </h3>
              ${categoryBadge}
            </div>
            ${place.address ? `<p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.35rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(place.address)}</p>` : ''}
            <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.78rem; color: var(--text-secondary);">
              ${distance ? `<span>📍 ${distance}</span>` : ''}
              ${place.rating ? `<span>⭐ ${place.rating}</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
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
