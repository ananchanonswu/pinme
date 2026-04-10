// ==========================================
// Map Module (Leaflet)
// ==========================================

import { getCategoryIcon, getCategoryBadgeText, escapeHtml } from '../utils/helpers.js';

let map = null;
let tileLayer = null;
let userMarker = null;
let radiusCircle = null;
let placeMarkersLayer = null;

// ==========================================
// initMap — สร้างแผนที่เริ่มต้น + ปักหมุดผู้ใช้
// ==========================================
export function initMap(lat, lng, radiusKm, isDarkTheme, dict, mapRadiusBadge) {
  if (!map) {
    map = L.map('map', {
      zoomControl: true,
      attributionControl: true,
    }).setView([lat, lng], 13);

    const tileUrl = isDarkTheme 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    tileLayer = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    placeMarkersLayer = L.layerGroup().addTo(map);
  } else {
    map.setView([lat, lng], 13);
  }

  if (userMarker) map.removeLayer(userMarker);
  if (radiusCircle) map.removeLayer(radiusCircle);

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
        <strong>${dict.map_you_are_here}</strong>
        <span class="popup-distance">${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
      </div>
    `, { className: 'white-popup' })
    .openPopup();

  radiusCircle = L.circle([lat, lng], {
    radius: radiusKm * 1000,
    color: '#0d9488',
    fillColor: '#14b8a6',
    fillOpacity: 0.08,
    weight: 1.5,
    dashArray: '6 4',
  }).addTo(map);

  mapRadiusBadge.textContent = dict.map_radius.replace('{val}', radiusKm);

  map.fitBounds(radiusCircle.getBounds(), { padding: [30, 30] });
  console.log(`🗺️ Map initialized at ${lat}, ${lng} with radius ${radiusKm} km`);
}

// ==========================================
// addPlaceMarkers — ปักหมุดสถานที่ผลลัพธ์
// ==========================================
export function addPlaceMarkers(placesArray, dict) {
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

    if (lat == null || lng == null) return;

    const color = categoryColors[place.category] || '#14b8a6';
    const icon = getCategoryIcon(place.category);

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

    const distText = place.distance != null
      ? (place.distance < 1
          ? `${(place.distance * 1000).toFixed(0)} ${dict.unit_m}`
          : `${place.distance.toFixed(1)} ${dict.unit_km}`)
      : '';

    const categoryLabel = getCategoryBadgeText(place.category, dict);

    const marker = L.marker([lat, lng], { icon: markerIcon })
      .addTo(placeMarkersLayer)
      .bindPopup(`
        <div class="popup-card">
          <strong>${escapeHtml(place.name || dict.unknown_name)}</strong>
          <span class="popup-category">${categoryLabel}</span>
          ${distText ? `<span class="popup-distance">📍 ${distText}</span>` : ''}
          ${place.rating ? `<span class="popup-distance">⭐ ${place.rating}</span>` : ''}
        </div>
      `);
  });

  console.log(`📌 Added ${placesArray.length} place markers to the map`);
}

// ==========================================
// Utility wrappers
// ==========================================
export function invalidateMapSize() {
  if (map) {
    setTimeout(() => map.invalidateSize(), 450);
  }
}

export function flyToPlaceAndOpenPopup(placeLat, placeLng) {
  if (map && placeLat != null && placeLng != null) {
    map.flyTo([placeLat, placeLng], 16, { animate: true, duration: 0.8 });
    if (placeMarkersLayer) {
      placeMarkersLayer.eachLayer((layer) => {
        const pos = layer.getLatLng();
        if (Math.abs(pos.lat - placeLat) < 0.0001 && Math.abs(pos.lng - placeLng) < 0.0001) {
          layer.openPopup();
        }
      });
    }
  }
}

export function updateRadiusCircleAndMap(radiusKm, dict, mapRadiusBadge) {
  if (map && radiusCircle && userMarker) {
    const latlng = userMarker.getLatLng();
    const numericRadius = parseFloat(radiusKm);
    map.removeLayer(radiusCircle);
    radiusCircle = L.circle([latlng.lat, latlng.lng], {
      radius: numericRadius * 1000,
      color: '#0d9488',
      fillColor: '#14b8a6',
      fillOpacity: 0.08,
      weight: 1.5,
      dashArray: '6 4',
    }).addTo(map);
    map.fitBounds(radiusCircle.getBounds(), { padding: [30, 30] });
    mapRadiusBadge.textContent = dict.map_radius.replace('{val}', String(numericRadius));
  }
}

export function setMapTheme(isDarkTheme) {
  if (map && tileLayer) {
    const tileUrl = isDarkTheme 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    tileLayer.setUrl(tileUrl);
  }
}
