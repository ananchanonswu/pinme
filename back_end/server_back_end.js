// ==========================================
// PinMe - Simple API Server
// ==========================================
// Receives scan requests from the front-end
// and proxies them to SerpAPI (Google Maps)
// ==========================================

const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

// --- Load API Key from .env.local ---
const envPath = path.join(__dirname, '.env.local');
let SERPAPI_KEY = '';
try {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/SERPAPI_KEY=(.+)/);
  if (match) SERPAPI_KEY = match[1].trim();
} catch {
  console.warn('⚠️  .env.local not found — SerpAPI key missing');
}

const PORT = 3000;
const SERPAPI_BASE = 'https://serpapi.com/search.json';

// --------------------------------------------------
// Helper: Make HTTPS GET request and return JSON
// --------------------------------------------------
function fetchJSON(reqUrl) {
  return new Promise((resolve, reject) => {
    https.get(reqUrl, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error('Invalid JSON from SerpAPI'));
        }
      });
    }).on('error', reject);
  });
}

// --------------------------------------------------
// CORS headers (allow front-end on different origin)
// --------------------------------------------------
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// --------------------------------------------------
// Read POST body as JSON
// --------------------------------------------------
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
  });
}

// --------------------------------------------------
// Route: POST /scan
// --------------------------------------------------
async function handleScan(req, res) {
  try {
    const body = await readBody(req);
    const { latitude, longitude, radius, category } = body;

    // --- Validation ---
    if (latitude == null || longitude == null) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing latitude / longitude' }));
      return;
    }

    console.log(`📤 Scan request: lat=${latitude} lng=${longitude} radius=${radius} category=${category}`);

    // --- Build SerpAPI query ---
    const categoryQueries = {
      hotel: 'hotels',
      restaurant: 'restaurants',
      sport: 'sports complex',
      tourist: 'tourist attractions',
      all: 'places of interest',
    };

    const q = categoryQueries[category] || categoryQueries.all;
    const ll = `@${latitude},${longitude},14z`; // location bias

    const params = new URLSearchParams({
      engine: 'google_maps',
      q: q,
      ll: ll,
      type: 'search',
      api_key: SERPAPI_KEY,
    });

    const serpUrl = `${SERPAPI_BASE}?${params.toString()}`;
    console.log(`🔎 Calling SerpAPI: ${q} near ${latitude},${longitude}`);

    const data = await fetchJSON(serpUrl);

    // --- Extract & normalize results ---
    const localResults = data.local_results || [];
    const radiusKm = radius || 5;

    const results = localResults
      .map((place) => {
        const lat = place.gps_coordinates?.latitude;
        const lng = place.gps_coordinates?.longitude;
        if (lat == null || lng == null) return null;

        // Haversine distance
        const toRad = (v) => (v * Math.PI) / 180;
        const dLat = toRad(lat - latitude);
        const dLng = toRad(lng - longitude);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(latitude)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
        const distance = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        if (distance > radiusKm) return null;

        // Determine category from type
        let cat = category !== 'all' ? category : 'tourist';
        const typeLower = (place.type || '').toLowerCase();
        if (typeLower.includes('hotel') || typeLower.includes('resort')) cat = 'hotel';
        else if (typeLower.includes('restaurant') || typeLower.includes('cafe') || typeLower.includes('food')) cat = 'restaurant';
        else if (typeLower.includes('gym') || typeLower.includes('sport') || typeLower.includes('stadium')) cat = 'sport';

        return {
          name: place.title || 'Unknown',
          category: cat,
          distance: parseFloat(distance.toFixed(2)),
          address: place.address || '',
          rating: place.rating || null,
          type: place.type || '',
          thumbnail: place.thumbnail || '',
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance);

    console.log(`✅ Found ${results.length} places within ${radiusKm} km`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ results }));
  } catch (err) {
    console.error('❌ Scan error:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// --------------------------------------------------
// Route: GET /scan (query-string variant for testing)
// --------------------------------------------------
async function handleScanGet(req, res) {
  const parsed = url.parse(req.url, true);
  const { lat, lng, radiusKm, q } = parsed.query;

  if (!lat || !lng) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing lat / lng query params' }));
    return;
  }

  console.log(`📤 GET Scan: lat=${lat} lng=${lng} radius=${radiusKm} q=${q}`);

  const params = new URLSearchParams({
    engine: 'google_maps',
    q: q || 'places of interest',
    ll: `@${lat},${lng},14z`,
    type: 'search',
    api_key: SERPAPI_KEY,
  });

  try {
    const data = await fetchJSON(`${SERPAPI_BASE}?${params.toString()}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// --------------------------------------------------
// HTTP Server
// --------------------------------------------------
const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  if (pathname === '/scan' && req.method === 'POST') {
    await handleScan(req, res);
  } else if (pathname === '/scan' && req.method === 'GET') {
    await handleScanGet(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log('');
  console.log('==========================================');
  console.log(`  🚀 PinMe API Server running`);
  console.log(`  📡 http://localhost:${PORT}/scan`);
  console.log(`  🔑 SerpAPI key: ${SERPAPI_KEY ? '✅ loaded' : '❌ missing'}`);
  console.log('==========================================');
  console.log('');
});
