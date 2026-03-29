// ==========================================
// PinMe - Full Stack Server
// ==========================================
// Serves static front-end files AND handles
// /scan API proxy requests to SerpAPI.
// ==========================================

const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

// --- Setup Paths ---
const PORT = 3000;
const FRONTEND_DIR = path.join(__dirname, 'front_end');
// Try loading .env.local from back_end folder first, then root
const envPathBack = path.join(__dirname, 'back_end', '.env.local');
const envPathRoot = path.join(__dirname, '.env.local');
let envPath = fs.existsSync(envPathBack) ? envPathBack : envPathRoot;

let SERPAPI_KEY = '';
try {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/SERPAPI_KEY=(.+)/);
    if (match) SERPAPI_KEY = match[1].trim();
  } else {
    console.warn('⚠️  .env.local not found — SerpAPI key missing');
  }
} catch (err) {
  console.warn('⚠️  Could not read .env.local —', err.message);
}

const SERPAPI_BASE = 'https://serpapi.com/search.json';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// --------------------------------------------------
// API Logic: Helpers
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

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

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
// API Route Handler: /scan
// --------------------------------------------------
async function handleScan(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

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
          lat: lat,
          lng: lng,
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
// Web Server (handles both API and Static files)
// --------------------------------------------------
const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsed = url.parse(req.url, true);
  let pathname = parsed.pathname;

  // 1. API route
  if (pathname === '/scan') {
    return handleScan(req, res);
  }

  // 2. Static File serving (front_end)
  if (pathname === '/') {
    pathname = '/index.html';
  }

  // decode url and resolve file path
  let filePath = path.join(FRONTEND_DIR, decodeURIComponent(pathname));

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('==========================================');
  console.log(`  🚀 PinMe Merged Server running`);
  console.log(`  🌐 Frontend: http://localhost:${PORT}/`);
  console.log(`  📡 API:      http://localhost:${PORT}/scan`);
  console.log(`  🔑 SerpAPI:  ${SERPAPI_KEY ? '✅ loaded' : '❌ missing'}`);
  console.log('==========================================');
  console.log('');
});
