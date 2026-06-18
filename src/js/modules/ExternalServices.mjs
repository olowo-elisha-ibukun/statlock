const CACHE_PREFIX = 'statlock_cache';
const CACHE_FRESH_MS = 60 * 60 * 1000; // 1 hour freshness window
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours maximum lifespan

export default class ExternalServices {
  constructor() {
    this.sportBaseUrls = {
      football: 'https://v3.football.api-sports.io',
      basketball: 'https://v1.basketball.api-sports.io',
      hockey: 'https://v1.hockey.api-sports.io',
      baseball: 'https://v1.baseball.api-sports.io',
      volleyball: 'https://v1.volleyball.api-sports.io'
    };

    this.apiKey = this.getBrowserApiKey()
      || (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SPORTS_API_KEY : undefined);

    this.cleanupStaleCache();
  }

  getBrowserApiKey() {
    if (typeof window === 'undefined') return undefined;

    const browserKey = window.APP_CONFIG?.apiSportsKey;
    const queryParamKey = new URLSearchParams(window.location.search).get('apiSportsKey');
    let storedKey;

    try {
      storedKey = window.localStorage.getItem('STATLOCK_API_KEY') || undefined;
    } catch (err) {
      storedKey = undefined;
    }

    const key = [browserKey, queryParamKey, storedKey].find((value) => value && value !== '__API_SPORTS_KEY__');

    if (queryParamKey) {
      try {
        window.localStorage.setItem('STATLOCK_API_KEY', queryParamKey);
      } catch (err) {
        console.warn('Unable to persist API key to localStorage:', err);
      }
    }

    return key;
  }

  getCacheKey(sport, endpoint, params = {}) {
    const normalizedSport = String(sport).trim().toLowerCase();
    const queryString = new URLSearchParams(params).toString();
    return `${CACHE_PREFIX}:${normalizedSport}:${endpoint}${queryString ? `?${queryString}` : ''}`;
  }

  getCachedResponse(cacheKey) {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return null;

    try {
      const raw = window.localStorage.getItem(cacheKey);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.timestamp === 'number' && parsed.payload !== undefined) {
        return parsed;
      }
    } catch (err) {
      console.warn('ExternalServices.getCachedResponse failed:', err);
    }

    return null;
  }

  isCacheFresh(cachedEntry) {
    if (!cachedEntry || typeof cachedEntry.timestamp !== 'number') return false;
    return (Date.now() - cachedEntry.timestamp) < CACHE_FRESH_MS;
  }

  isPayloadInvalid(payload) {
    if (!payload || typeof payload !== 'object') return true;
    if (payload.error || payload.errors) return true;
    if (!Array.isArray(payload.response)
      && !Array.isArray(payload.data)
      && !Array.isArray(payload.results)
      && !Array.isArray(payload.matches)
      && !Array.isArray(payload.fixtures)) {
      return true;
    }
    return false;
  }

  saveResponseToCache(cacheKey, payload) {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;

    try {
      window.localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        payload
      }));
    } catch (err) {
      console.warn('ExternalServices.saveResponseToCache failed:', err);
    }
  }

  cleanupStaleCache() {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;

    try {
      const keysToRemove = [];
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const storageKey = window.localStorage.key(i);
        if (!storageKey?.startsWith(`${CACHE_PREFIX}:`)) continue;

        try {
          const entry = JSON.parse(window.localStorage.getItem(storageKey));
          if (!entry || typeof entry.timestamp !== 'number' || (Date.now() - entry.timestamp) >= CACHE_TTL_MS) {
            keysToRemove.push(storageKey);
          }
        } catch (_err) {
          keysToRemove.push(storageKey);
        }
      }
      keysToRemove.forEach((key) => window.localStorage.removeItem(key));
    } catch (err) {
      console.warn('ExternalServices.cleanupStaleCache failed:', err);
    }
  }

  async getFixtures(sport, dateString, options = {}) {
    if (!sport) {
      throw new Error('sport is required');
    }

    const lowerSport = String(sport).trim().toLowerCase();
    const proxyUrl = new URL('/api/fixtures', window.location.origin);
    proxyUrl.searchParams.set('sport', lowerSport);

    if (options.status) {
      proxyUrl.searchParams.set('status', String(options.status).trim().toLowerCase());
    }

    if (dateString) {
      proxyUrl.searchParams.set('date', dateString);
    }

    const response = await fetch(proxyUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const payloadText = await response.text().catch(() => '');
      const message = payloadText || response.statusText;
      throw new Error(`Fixture proxy failed (${response.status}): ${message}`);
    }

    return await response.json();
  }
}
