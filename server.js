import express from 'express';
import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
const app = express();
const PORT = process.env.PORT || 3000;

function getApiKey(){
  return process.env.VITE_SPORTS_API_KEY || '';
}

console.log('StatLock proxy using VITE_SPORTS_API_KEY for API-Sports requests');

async function fetchJson(url, headers = {}) {
  const target = new URL(url);
  const isHttps = target.protocol === 'https:';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  console.log('fetchJson start', url);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      agent: isHttps ? new https.Agent({ rejectUnauthorized: false, servername: target.hostname }) : undefined,
      signal: controller.signal
    });

    const text = await response.text();
    console.log('fetchJson got', response.status, url, text?.slice(0, 200).replace(/\n/g, ' '));
    let payload = null;

    if (text) {
      try {
        payload = JSON.parse(text);
      } catch (err) {
        console.warn('fetchJson invalid JSON for', url, err.message || err);
        payload = { error: `Invalid JSON response from the remote API: ${err.message}` };
      }
    }

    return { status: response.status, payload };
  } catch (err) {
    const message = err?.message || err?.code || 'fetch failed';
    console.error('fetchJson error for', url, message);
    return { status: 502, payload: { error: message } };
  } finally {
    clearTimeout(timeoutId);
  }
}

const apiHosts = {
  football: [
    'https://v3.football.api-sports.io',
    'https://v1.football.api-sports.io',
    'https://v1.football.api-sports.com'
  ],
  basketball: [
    'https://v1.basketball.api-sports.io',
    'https://v1.basketball.api-sports.com'
  ],
  hockey: [
    'https://v1.hockey.api-sports.io',
    'https://v1.hockey.api-sports.com'
  ],
  baseball: [
    'https://v1.baseball.api-sports.io',
    'https://v1.baseball.api-sports.com'
  ],
  volleyball: [
    'https://v1.volleyball.api-sports.io',
    'https://v1.volleyball.api-sports.com'
  ]
};
const endpointMap = {
  football: ['fixtures'],
  basketball: ['games', 'fixtures', 'matches'],
  hockey: ['games', 'fixtures', 'matches'],
  baseball: ['games'],
  volleyball: ['games', 'fixtures', 'matches']
};

const indexPath = path.join(__dirname, 'index.html');
const sampleFixturesPath = path.join(__dirname, 'src', 'data', 'sample-fixtures.json');
const isDevelopment = process.env.NODE_ENV !== 'production';
let indexHtml = '';

function loadSampleFixtures() {
  try {
    const sampleText = fs.readFileSync(sampleFixturesPath, 'utf8');
    return JSON.parse(sampleText);
  } catch (err) {
    console.warn('Unable to load local sample fixtures:', err.message || err);
    return null;
  }
}

try {
  indexHtml = fs.readFileSync(indexPath, 'utf8');
} catch (err) {
  console.error('Failed to load index.html:', err);
  process.exit(1);
}

// Serve static assets from the /src folder at the /src URL path.
app.use('/src', express.static(path.join(__dirname, 'src')));

app.get('/api/fixtures', async (req, res) => {
  const sport = String(req.query.sport || '').toLowerCase();
  const date = String(req.query.date || '').trim();
  const status = String(req.query.status || '').trim().toLowerCase();
  const apiKey = getApiKey();

  if(!sport || (!date && status !== 'live')){
    return res.status(400).json({ error: 'Missing required query parameters: sport and date, or sport and status=live.' });
  }

  if(!apiKey){
    return res.status(500).json({ error: 'Missing VITE_SPORTS_API_KEY in server environment.' });
  }

  const hosts = apiHosts[sport];
  const endpoints = endpointMap[sport];

  if(!hosts || !endpoints){
    return res.status(400).json({ error: `Unsupported sport: ${sport}` });
  }

  let lastError;

  const getPayloadErrorMessage = (payload) => {
    if(!payload || typeof payload !== 'object') return null;
    if(typeof payload.error === 'string' && payload.error.trim()) return payload.error;

    const errors = payload.errors;
    if(typeof errors === 'string' && errors.trim()) return errors;
    if(Array.isArray(errors) && errors.length > 0) return errors.join(', ');
    if(errors && typeof errors === 'object'){
      if(typeof errors.requests === 'string' && errors.requests.trim()) return errors.requests;
      if(typeof errors.token === 'string' && errors.token.trim()) return errors.token;
      if(typeof errors.message === 'string' && errors.message.trim()) return errors.message;
      if(Object.keys(errors).length > 0) return JSON.stringify(errors);
    }

    return null;
  };

  for(const host of hosts){
    for(const endpoint of endpoints){
      const genericHost = /^(https:\/\/api-sports\.(io|com))$/i.test(host);
      const queryParams = {};
      if (date) queryParams.date = date;
      if (status) queryParams.status = status;
      if (genericHost) queryParams.sport = sport;
      const queryString = new URLSearchParams(queryParams).toString();
      const url = `${host}/${endpoint}${queryString ? `?${queryString}` : ''}`;
      console.log('Proxy trying', { sport, host, endpoint, date, url });
      try{
        const { status, payload } = await fetchJson(url, {
          'Content-Type': 'application/json',
          'x-apisports-key': apiKey
        });
        console.log('Proxy got', { url, status, payloadSummary: payload && typeof payload === 'object' ? { errors: payload.errors, results: payload.results, response: Array.isArray(payload.response) ? payload.response.length : undefined } : payload });

        if(status < 200 || status >= 300){
          lastError = new Error(`Remote API returned ${status} for ${url}`);
          continue;
        }

        const errorsMessage = getPayloadErrorMessage(payload);
        const hasErrors = errorsMessage !== null;
        const hasData = payload && typeof payload === 'object' && (
          Array.isArray(payload.response)
          || Array.isArray(payload.data)
          || Array.isArray(payload.results)
          || Array.isArray(payload.matches)
          || Array.isArray(payload.fixtures)
          || ('response' in payload)
          || ('data' in payload)
          || ('results' in payload)
          || ('matches' in payload)
          || ('fixtures' in payload)
        );

        if(hasData && !hasErrors){
          return res.json(payload);
        }

        if(hasErrors){
          lastError = new Error(`Remote API returned errors for ${url}: ${errorsMessage}`);
          continue;
        }

        lastError = new Error(`Invalid payload from ${url}`);
      }catch(err){
        lastError = err;
      }
    }
  }

  console.error('Fixture proxy error:', lastError);
  if(isDevelopment){
    const samplePayload = loadSampleFixtures();
    if(samplePayload){
      console.warn('Serving sample fixture payload because the API is unavailable or rate limited.');
      samplePayload.sampleFallback = true;
      return res.json(samplePayload);
    }
  }

  return res.status(502).json({ error: lastError?.message || 'Failed to fetch fixtures from API-Sports.' });
});

// Serve the root index.html for all client routes and inject the API key.
app.get('*', (req, res) => {
  const apiKey = getApiKey();
  const renderedHtml = indexHtml.replace('__API_SPORTS_KEY__', apiKey);
  res.type('html').send(renderedHtml);
});

app.listen(PORT, () => {
  console.log(`StatLock server running on port ${PORT}`);
});

