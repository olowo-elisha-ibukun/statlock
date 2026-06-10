const CACHE_PREFIX = 'statlock_cache';
const CACHE_FRESH_MS = 60 * 60 * 1000; // 1 hour freshness window
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours maximum lifespan
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json'
};

export default class ExternalServices {
  constructor(){
    this.footballBaseUrl = 'https://v3.football.api-sports.io';
    this.basketballBaseUrl = 'https://v1.basketball.api-sports.io';
    this.apiKey = (typeof process !== 'undefined' && process?.env?.API_SPORTS_KEY)
      || (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SPORTS_API_KEY : undefined);

    this.cleanupStaleCache();
  }

  async handleResponse(response){
    if(!response.ok){
      throw new Error(`Request failed with status ${response.status}`);
    }

    return await response.json();
  }

  async buildBaseUrl(sport){
    const lower = String(sport).toLowerCase();

    if(lower === 'football'){
      return this.footballBaseUrl;
    }

    if(lower === 'basketball'){
      return this.basketballBaseUrl;
    }

    throw new Error(`Unsupported sport: ${sport}`);
  }

  getCacheKey(sport, endpoint, params = {}){
    const normalizedSport = String(sport).trim().toLowerCase();
    const queryString = new URLSearchParams(params).toString();
    return `${CACHE_PREFIX}:${normalizedSport}:${endpoint}${queryString ? `?${queryString}` : ''}`;
  }

  getCachedResponse(cacheKey){
    if(typeof localStorage === 'undefined') return null;

    try{
      const raw = localStorage.getItem(cacheKey);
      if(!raw) return null;

      const parsed = JSON.parse(raw);
      if(parsed && typeof parsed.timestamp === 'number' && parsed.payload !== undefined){
        return parsed;
      }
    }catch(err){
      console.warn('ExternalServices.getCachedResponse failed:', err);
    }

    return null;
  }

  isCacheFresh(cachedEntry){
    if(!cachedEntry || typeof cachedEntry.timestamp !== 'number') return false;
    return (Date.now() - cachedEntry.timestamp) < CACHE_FRESH_MS;
  }

  saveResponseToCache(cacheKey, payload){
    if(typeof localStorage === 'undefined') return;

    try{
      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        payload
      }));
    }catch(err){
      console.warn('ExternalServices.saveResponseToCache failed:', err);
    }
  }

  cleanupStaleCache(){
    if(typeof localStorage === 'undefined') return;

    try{
      const keysToRemove = [];

      for(let i = 0; i < localStorage.length; i++){
        const storageKey = localStorage.key(i);
        if(!storageKey?.startsWith(`${CACHE_PREFIX}:`)) continue;

        try{
          const entry = JSON.parse(localStorage.getItem(storageKey));
          if(!entry || typeof entry.timestamp !== 'number'){
            keysToRemove.push(storageKey);
            continue;
          }

          if((Date.now() - entry.timestamp) >= CACHE_TTL_MS){
            keysToRemove.push(storageKey);
          }
        }catch(_){
          keysToRemove.push(storageKey);
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));
    }catch(err){
      console.warn('ExternalServices.cleanupStaleCache failed:', err);
    }
  }

  async fetchMatchData(sport, endpoint, params = {}){
    if(!sport || !endpoint) throw new Error('sport and endpoint are required');
    if(!this.apiKey) throw new Error('Missing API-SPORTS key. Set VITE_SPORTS_API_KEY in your .env file.');

    const cacheKey = this.getCacheKey(sport, endpoint, params);
    const cached = this.getCachedResponse(cacheKey);
    if(this.isCacheFresh(cached)){
      return cached.payload;
    }

    const base = await this.buildBaseUrl(sport);
    const query = new URLSearchParams(params).toString();
    const url = `${base}/${endpoint}${query ? `?${query}` : ''}`;

    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-apisports-key': this.apiKey
      }
    };

    try{
      const response = await fetch(url, options);
      const payload = await this.handleResponse(response);
      this.saveResponseToCache(cacheKey, payload);
      return payload;
    }catch(err){
      console.error('ExternalServices.fetchMatchData error:', err);

      if(typeof window !== 'undefined' && typeof alert === 'function'){
        alert('Data currently unavailable. Please try again later.');
      }

      if(cached && cached.payload){
        console.warn('Using stale cache fallback for', cacheKey);
        return cached.payload;
      }

      throw err;
    }
  }

  getFixtures(sport, dateString){
    const lower = String(sport).toLowerCase();
    const endpoint = lower === 'basketball' ? 'games' : 'fixtures';
    return this.fetchMatchData(sport, endpoint, { date: dateString });
  }

  adaptMatchData(sport, rawMatch){
    const lower = String(sport).toLowerCase();

    if(lower === 'football'){
      return this.adaptFootballMatch(rawMatch);
    }

    if(lower === 'basketball'){
      return this.adaptBasketballMatch(rawMatch);
    }

    throw new Error(`Unsupported sport: ${sport}`);
  }

  adaptFootballMatch(raw){
    return {
      homeTeam: raw?.teams?.home?.name ?? raw?.teamHome?.name ?? '',
      awayTeam: raw?.teams?.away?.name ?? raw?.teamAway?.name ?? '',
      homeScore: raw?.goals?.home ?? raw?.score?.fulltime?.home ?? null,
      awayScore: raw?.goals?.away ?? raw?.score?.fulltime?.away ?? null
    };
  }

  adaptBasketballMatch(raw){
    const homeTeam = raw?.teams?.home?.name
      ?? raw?.teamHome?.name
      ?? raw?.team_home?.name
      ?? raw?.home_team_name
      ?? raw?.home?.name
      ?? raw?.homeTeam
      ?? '';

    const awayTeam = raw?.teams?.away?.name
      ?? raw?.teamAway?.name
      ?? raw?.team_away?.name
      ?? raw?.away_team_name
      ?? raw?.away?.name
      ?? raw?.awayTeam
      ?? '';

    const homeScore = raw?.scores?.home?.total
      ?? raw?.scores?.home?.points
      ?? raw?.score?.home
      ?? raw?.home?.points
      ?? raw?.home_points
      ?? raw?.homeScore
      ?? null;

    const awayScore = raw?.scores?.away?.total
      ?? raw?.scores?.away?.points
      ?? raw?.score?.away
      ?? raw?.away?.points
      ?? raw?.away_points
      ?? raw?.awayScore
      ?? null;

    return {
      homeTeam,
      awayTeam,
      homeScore,
      awayScore
    };
  }
}
