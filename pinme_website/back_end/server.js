// ==========================================
// PinMe - Full Stack Server
// ==========================================
// Serves static front-end files and handles
// /scan API proxy requests to SerpAPI.
// Falls back to local data when SerpAPI is
// unavailable or the API key is missing.
// ==========================================

const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const Place = require('./models/Place');
const SearchQuery = require('./models/SearchQuery');

const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, '..', 'front_end');
const envPath = path.join(__dirname, '.env.local');
const SERPAPI_BASE = 'https://serpapi.com/search.json';

let SERPAPI_KEY = process.env.SERPAPI_KEY || '';
try {
  if (!SERPAPI_KEY && fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/SERPAPI_KEY=(.+)/);
    if (match) SERPAPI_KEY = match[1].trim();
  } else if (!SERPAPI_KEY) {
    console.warn('[startup] .env.local not found; SerpAPI key missing');
  }
} catch (err) {
  console.warn('[startup] Could not read .env.local:', err.message);
}

const FALLBACK_PLACES = [
  {
    name: 'Riverside Bangkok Hotel',
    category: 'hotel',
    lat: 13.7248,
    lng: 100.5108,
    address: '257/1-3 Charoen Nakhon Rd, Bangkok',
    rating: 4.5,
    thumbnail: '',
  },
  {
    name: 'Grandma Kitchen',
    category: 'restaurant',
    lat: 13.7301,
    lng: 100.5220,
    address: '12 Sukhumvit 26, Bangkok',
    rating: 4.7,
    thumbnail: '',
  },
  {
    name: 'Rajamangala National Stadium',
    category: 'sport',
    lat: 13.7553,
    lng: 100.6210,
    address: 'Ramkhamhaeng Rd, Bangkok',
    rating: 4.2,
    thumbnail: '',
  },
  {
    name: 'Wat Phra Kaew',
    category: 'tourist',
    lat: 13.7516,
    lng: 100.4927,
    address: 'Na Phra Lan Rd, Bangkok',
    rating: 4.9,
    thumbnail: '',
  },
  {
    name: 'Cafe Amazon Siam Square',
    category: 'restaurant',
    lat: 13.7455,
    lng: 100.5346,
    address: 'Siam Square Soi 3, Bangkok',
    rating: 4.0,
    thumbnail: '',
  },
  {
    name: 'The Sukhothai Bangkok',
    category: 'hotel',
    lat: 13.7225,
    lng: 100.5355,
    address: '13/3 South Sathorn Rd, Bangkok',
    rating: 4.8,
    thumbnail: '',
  },
];

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

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function getErrorMessage(error) {
  if (!error) return 'Unknown error';
  if (Array.isArray(error.errors) && error.errors.length > 0) {
    return error.errors
      .map((item) => getErrorMessage(item))
      .filter(Boolean)
      .join('; ');
  }
  if (error instanceof Error && error.message) return error.message;
  if (error && error.code) return String(error.code);
  return String(error);
}

function getRemoteClient(targetUrl) {
  return targetUrl.startsWith('https://') ? https : http;
}

function fetchImageBuffer(targetUrl, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (!targetUrl || redirectCount > 5) {
      reject(new Error('Invalid image URL'));
      return;
    }

    const client = getRemoteClient(targetUrl);
    client.get(targetUrl, (remoteRes) => {
      const statusCode = remoteRes.statusCode || 500;
      const location = remoteRes.headers.location;

      if ([301, 302, 303, 307, 308].includes(statusCode) && location) {
        const redirectUrl = new URL(location, targetUrl).toString();
        remoteRes.resume();
        resolve(fetchImageBuffer(redirectUrl, redirectCount + 1));
        return;
      }

      if (statusCode < 200 || statusCode >= 300) {
        remoteRes.resume();
        reject(new Error(`Image request failed with status ${statusCode}`));
        return;
      }

      const chunks = [];
      remoteRes.on('data', (chunk) => chunks.push(chunk));
      remoteRes.on('end', () => {
        resolve({
          buffer: Buffer.concat(chunks),
          contentType: remoteRes.headers['content-type'] || 'image/jpeg',
          cacheControl: remoteRes.headers['cache-control'] || 'public, max-age=3600',
        });
      });
    }).on('error', reject);
  });
}

function fetchJSON(reqUrl) {
  return new Promise((resolve, reject) => {
    https.get(reqUrl, (remoteRes) => {
      let data = '';
      remoteRes.on('data', (chunk) => {
        data += chunk;
      });
      remoteRes.on('end', () => {
        const statusCode = remoteRes.statusCode || 500;
        if (statusCode < 200 || statusCode >= 300) {
          reject(new Error(`SerpAPI HTTP ${statusCode}`));
          return;
        }

        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(`SerpAPI error: ${parsed.error}`));
            return;
          }
          resolve(parsed);
        } catch (err) {
          reject(new Error(`Invalid JSON from SerpAPI: ${err.message}`));
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
  if (req.body && typeof req.body === 'object') {
    return Promise.resolve(req.body);
  }

  if (typeof req.body === 'string') {
    try {
      return Promise.resolve(req.body ? JSON.parse(req.body) : {});
    } catch {
      return Promise.reject(new Error('Invalid JSON body'));
    }
  }

  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
  });
}

function normalizeServerPlace(rawPlace, latitude, longitude, requestedCategory) {
  const resolvedCategory = requestedCategory === 'all'
    ? (rawPlace.category || Place.detectCategoryFromType(rawPlace.type || ''))
    : requestedCategory;

  const place = new Place({
    ...rawPlace,
    category: resolvedCategory,
  });

  if (!place.hasValidCoordinates()) {
    return null;
  }

  const distance = place.distanceFrom(latitude, longitude);
  if (Number.isNaN(distance)) {
    return null;
  }

  place.distance = parseFloat(distance.toFixed(2));

  return {
    ...place.toJSON(),
    image: rawPlace.image || '',
    photo: rawPlace.photo || '',
    imageUrl: rawPlace.imageUrl || rawPlace.image_url || '',
    photoUrl: rawPlace.photoUrl || rawPlace.photo_url || '',
    images: Array.isArray(rawPlace.images) ? rawPlace.images : [],
    photos: Array.isArray(rawPlace.photos) ? rawPlace.photos : [],
  };
}

function mapSerpApiPlace(rawPlace, latitude, longitude, requestedCategory) {
  return normalizeServerPlace({
    name: rawPlace.title || 'Unknown',
    category: Place.detectCategoryFromType(rawPlace.type || ''),
    lat: rawPlace.gps_coordinates?.latitude,
    lng: rawPlace.gps_coordinates?.longitude,
    address: rawPlace.address || '',
    rating: rawPlace.rating || null,
    type: rawPlace.type || '',
    thumbnail: rawPlace.thumbnail || rawPlace.image || rawPlace.photo || rawPlace.images?.[0] || rawPlace.photos?.[0] || '',
    image: rawPlace.image || '',
    photo: rawPlace.photo || '',
    image_url: rawPlace.image_url || '',
    photo_url: rawPlace.photo_url || '',
    images: Array.isArray(rawPlace.images) ? rawPlace.images : [],
    photos: Array.isArray(rawPlace.photos) ? rawPlace.photos : [],
  }, latitude, longitude, requestedCategory);
}

function buildFallbackResults(searchQuery) {
  return FALLBACK_PLACES
    .filter((place) => searchQuery.category === 'all' || place.category === searchQuery.category)
    .map((place) => normalizeServerPlace(place, searchQuery.latitude, searchQuery.longitude, searchQuery.category))
    .filter((place) => place && place.distance <= searchQuery.radius)
    .sort((a, b) => a.distance - b.distance);
}

async function getScanResults(searchQuery) {
  if (!SERPAPI_KEY) {
    return {
      results: buildFallbackResults(searchQuery),
      source: 'fallback',
      warning: 'SERPAPI_KEY is missing; using local fallback data.',
    };
  }

  const params = searchQuery.toSerpApiParams(SERPAPI_KEY);
  const serpUrl = `${SERPAPI_BASE}?${new URLSearchParams(params).toString()}`;
  console.log(`[scan] Calling SerpAPI: ${searchQuery.getSearchQuery()} near ${searchQuery.latitude},${searchQuery.longitude}`);

  try {
    const data = await fetchJSON(serpUrl);
    const results = (data.local_results || [])
      .map((place) => mapSerpApiPlace(place, searchQuery.latitude, searchQuery.longitude, searchQuery.category))
      .filter((place) => place && place.distance <= searchQuery.radius)
      .sort((a, b) => a.distance - b.distance);

    return {
      results,
      source: 'serpapi',
      warning: results.length === 0 ? 'No places returned from SerpAPI for this query.' : null,
    };
  } catch (error) {
    return {
      results: buildFallbackResults(searchQuery),
      source: 'fallback',
      warning: `SerpAPI failed: ${getErrorMessage(error)}. Using local fallback data.`,
    };
  }
}

async function handleScan(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  try {
    const body = await readBody(req);
    const searchQuery = new SearchQuery({
      latitude: Number(body.latitude),
      longitude: Number(body.longitude),
      radius: Number(body.radius) || 5,
      category: body.category,
    });
    const validation = searchQuery.validate();

    if (!validation.valid) {
      const details = validation.errors.map((code) => {
        if (code === 'INVALID_LATITUDE') return 'Latitude must be a number between -90 and 90.';
        if (code === 'INVALID_LONGITUDE') return 'Longitude must be a number between -180 and 180.';
        return code;
      });

      sendJson(res, 400, {
        error: 'Invalid scan request.',
        details,
      });
      return;
    }

    console.log(
      `[scan] Request lat=${searchQuery.latitude} lng=${searchQuery.longitude} radius=${searchQuery.radius} category=${searchQuery.category}`
    );

    const scanResult = await getScanResults(searchQuery);
    console.log(`[scan] Returning ${scanResult.results.length} place(s) from ${scanResult.source}`);
    sendJson(res, 200, scanResult);
  } catch (err) {
    const message = getErrorMessage(err);
    console.error('[scan] Unhandled error:', message);
    sendJson(res, 500, {
      error: 'Scan request failed.',
      details: [message],
    });
  }
}

async function handleImageProxy(req, res) {
  try {
    const parsed = new URL(req.url, `http://${req.headers.host}`);
    const imageUrl = parsed.searchParams.get('url');

    if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
      sendJson(res, 400, { error: 'Missing or invalid image url' });
      return;
    }

    const { buffer, contentType, cacheControl } = await fetchImageBuffer(imageUrl);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
    });
    res.end(buffer);
  } catch (err) {
    console.error('[image] Proxy error:', getErrorMessage(err));
    sendJson(res, 502, { error: 'Could not load image' });
  }
}

async function handleRequest(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsed = url.parse(req.url, true);
  let pathname = parsed.pathname;

  if (pathname === '/scan' || pathname === '/api/scan') {
    return handleScan(req, res);
  }

  if (pathname === '/image' || pathname === '/api/image') {
    return handleImageProxy(req, res);
  }

  if (pathname === '/') {
    pathname = '/index.html';
  }

  const filePath = path.join(FRONTEND_DIR, decodeURIComponent(pathname));

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

if (require.main === module) {
  const server = http.createServer(handleRequest);
  server.listen(PORT, () => {
    console.log('');
    console.log('==========================================');
    console.log(`  PinMe server running on http://localhost:${PORT}/`);
    console.log(`  Scan API: http://localhost:${PORT}/api/scan`);
    console.log(`  SerpAPI:  ${SERPAPI_KEY ? 'loaded' : 'missing -> fallback mode'}`);
    console.log('==========================================');
    console.log('');
  });
}

module.exports = {
  handleRequest,
  handleScan,
  handleImageProxy,
  setCorsHeaders,
};
