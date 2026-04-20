// ==========================================
// Helper functions
// ==========================================

export function getCategoryBadge(category, dict) {
  const map = {
    hotel: `<span class="badge badge-hotel">${dict.res_badge_hotel}</span>`,
    restaurant: `<span class="badge badge-restaurant">${dict.res_badge_restaurant}</span>`,
    sport: `<span class="badge badge-sport">${dict.res_badge_sport}</span>`,
    tourist: `<span class="badge badge-tourist">${dict.res_badge_tourist}</span>`,
  };

  return map[category] || '';
}

export function getCategoryBadgeText(category, dict) {
  const map = {
    hotel: dict.res_cat_hotel,
    restaurant: dict.res_cat_restaurant,
    sport: dict.res_cat_sport,
    tourist: dict.res_cat_tourist,
  };

  return map[category] || dict.res_cat_place;
}

export function getCategoryIcon(category) {
  const map = {
    hotel: '🏨',
    restaurant: '🍜',
    sport: '⚽',
    tourist: '🏛️',
  };

  return map[category] || '📍';
}

export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function showToast(message, type = 'success') {
  document.querySelectorAll('.toast').forEach((toast) => toast.remove());

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
