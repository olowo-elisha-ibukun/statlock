export default class MatchDetails {
  constructor(matchObject, sport){
    this.rawData = matchObject;
    this.sport = sport;
  }

  static getLiveStatusPatterns(sport){
    const normalizedSport = String(sport || '').toLowerCase();
    const basePatterns = [
      /\blive\b/, 
      /\bin-play\b/, 
      /\bongoing\b/, 
      /\bplaying\b/
    ];

    const sportPatterns = {
      football: [
        /\b1h\b/, /\b2h\b/, /\bht\b/, /\bet\b/, /\bp\b/, /\bfirst half\b/, /\bsecond half\b/, /\bextra time\b/, /\bpenalty\b/, /\bperiod 1\b/, /\bperiod 2\b/
      ],
      basketball: [
        /\bq[1-4]\b/, /\b[1-4]q\b/, /\b(?:first|second|third|fourth) quarter\b/, /\bquarter\s*[1-4]\b/, /\b(?:1st|2nd|3rd|4th) quarter\b/, /\bot\b/, /\bht\b/, /\bhalf time\b/
      ],
      hockey: [
        /\b1st\b/, /\b2nd\b/, /\b3rd\b/, /\b(?:first|second|third) period\b/, /\b(?:1st|2nd|3rd)\s*period\b/, /\bot\b/, /\bap\b/, /\bovertime\b/
      ],
      baseball: [
        /\btop\s*[1-9]\b/, /\bbottom\s*[1-9]\b/, /\b(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth) inning\b/, /\b[1-9](?:st|nd|rd|th)\s*inning\b/, /\binning\s*[1-9]\b/, /\bextra inning\b/, /\b(?:t|b)[1-9]\b/, /\bei\b/
      ],
      volleyball: [
        /\blive\b/, /\bset\s*[1-5]\b/, /\b(?:first|second|third|fourth|fifth) set\b/, /\b[1-5](?:st|nd|rd|th)\s*set\b/, /\b1h\b/, /\b2h\b/
      ]
    };

    return [...basePatterns, ...(sportPatterns[normalizedSport] || [])];
  }

  static isLiveStatus(statusText, sport){
    const normalized = String(statusText || '').trim().toLowerCase();
    if(!normalized) return false;
    const patterns = MatchDetails.getLiveStatusPatterns(sport);
    return patterns.some((pattern) => pattern.test(normalized));
  }

  normalize(){
    const sport = String(this.sport).toLowerCase();

    const homeTeam = this.rawData.teams?.home?.name
      ?? this.rawData.home?.name
      ?? this.rawData.home_team_name
      ?? this.rawData.homeTeam
      ?? this.rawData.teamHome?.name
      ?? '';

    const awayTeam = this.rawData.teams?.away?.name
      ?? this.rawData.away?.name
      ?? this.rawData.away_team_name
      ?? this.rawData.awayTeam
      ?? this.rawData.teamAway?.name
      ?? '';

    const homeScore = this.rawData.goals?.home
      ?? this.rawData.scores?.home?.total
      ?? this.rawData.scores?.home?.points
      ?? this.rawData.score?.home
      ?? this.rawData.home?.points
      ?? this.rawData.home_points
      ?? this.rawData.homeScore
      ?? 0;

    const awayScore = this.rawData.goals?.away
      ?? this.rawData.scores?.away?.total
      ?? this.rawData.scores?.away?.points
      ?? this.rawData.score?.away
      ?? this.rawData.away?.points
      ?? this.rawData.away_points
      ?? this.rawData.awayScore
      ?? 0;

    const statusLongRaw = this.rawData.fixture?.status?.long
      ?? this.rawData.status?.long
      ?? this.rawData.status
      ?? this.rawData.match?.status
      ?? this.rawData.event?.status
      ?? '';

    const statusShortRaw = this.rawData.fixture?.status?.short
      ?? this.rawData.status?.short
      ?? this.rawData.statusShort
      ?? this.rawData.match?.statusShort
      ?? this.rawData.shortStatus
      ?? '';

    const parseTimestamp = (value) => {
      if(value === undefined || value === null || value === '') return null;
      if(typeof value === 'number' && !Number.isNaN(value)){
        return new Date(value < 1e12 ? value * 1000 : value);
      }

      const stringValue = String(value).trim();
      const parsed = new Date(stringValue);
      if(!Number.isNaN(parsed.getTime())) return parsed;

      const timeMatch = stringValue.match(/^([0-1]?\d|2[0-3])(?::|\.)([0-5]\d)(?:\s*(am|pm))?$/i);
      if(!timeMatch) return null;

      let hour = Number(timeMatch[1]);
      const minute = Number(timeMatch[2]);
      const meridiem = timeMatch[3]?.toLowerCase();
      if(meridiem){
        if(meridiem === 'pm' && hour < 12) hour += 12;
        if(meridiem === 'am' && hour === 12) hour = 0;
      }

      const now = new Date();
      now.setHours(hour, minute, 0, 0);
      return now;
    };

    const deriveStatusShort = (statusText) => {
      const normalized = String(statusText || '').trim().toLowerCase();
      if(/1st|1h|first half/.test(normalized)) return '1H';
      if(/2nd|2h|second half/.test(normalized)) return '2H';
      if(/halftime|half time/.test(normalized)) return 'HT';
      if(/final|ft|match finished|finished/.test(normalized)) return 'FT';
      if(/live|in-play|ongoing|playing/.test(normalized)) return 'LIVE';
      if(/scheduled|not started|pending|upcoming|tbd/.test(normalized)) return 'TBD';
      return statusText ? String(statusText).slice(0, 6).toUpperCase() : '';
    };

    const startTime = this.rawData.fixture?.date
      ?? this.rawData.event_date
      ?? this.rawData.date
      ?? this.rawData.start_date
      ?? this.rawData.startTime
      ?? this.rawData.match?.date
      ?? '';

    const timestampValue = this.rawData.fixture?.timestamp
      ?? this.rawData.event?.timestamp
      ?? this.rawData.timestamp
      ?? this.rawData.match?.timestamp
      ?? null;

    const fixtureDate = parseTimestamp(startTime)
      || parseTimestamp(timestampValue)
      || parseTimestamp(statusLongRaw)
      || parseTimestamp(statusShortRaw);

    const fixtureTime = fixtureDate ? fixtureDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }) : '';

    const marketLabel = this.rawData.market?.name
      ?? this.rawData.odds?.market
      ?? this.rawData.market
      ?? '1X2';

    const normalizeOddValue = (value) => {
      if(value === undefined || value === null || value === '') return null;
      const candidate = typeof value === 'string' ? value.replace(',', '.').trim() : value;
      const numeric = Number(candidate);
      return Number.isFinite(numeric) ? Number(numeric.toFixed(2)) : null;
    };

    const originalOdds = {
      home: normalizeOddValue(this.rawData.odds?.home
        ?? this.rawData.odds?.homePrice
        ?? this.rawData.odds?.home_odds
        ?? this.rawData.homeOdds
        ?? this.rawData.odds_home),
      draw: normalizeOddValue(this.rawData.odds?.draw
        ?? this.rawData.odds?.tie
        ?? this.rawData.odds?.drawPrice
        ?? this.rawData.drawOdds
        ?? this.rawData.odds_draw),
      away: normalizeOddValue(this.rawData.odds?.away
        ?? this.rawData.odds?.awayPrice
        ?? this.rawData.odds?.away_odds
        ?? this.rawData.awayOdds
        ?? this.rawData.odds_away)
    };

    const statusShort = statusShortRaw || deriveStatusShort(statusLongRaw);
    const statusTextForLive = [statusLongRaw, statusShort].filter(Boolean).join(' ');
    const finishedGame = /ft|final|match finished|finished/.test(String(statusLongRaw || statusShort).toLowerCase());
    const drawScore = Number(homeScore) === Number(awayScore);

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const formatOdds = (value) => {
      if(value === undefined || value === null || Number.isNaN(Number(value))) return null;
      return Number(Number(value).toFixed(2));
    };

    const buildFallbackOdds = () => {
      if(finishedGame){
        if(drawScore){
          const draw = clamp(1.55 + Math.min(0.3, (homeScore + awayScore) * 0.05), 1.45, 1.85);
          const side = clamp(2.9 + Math.min(0.5, (homeScore + awayScore) * 0.06), 2.90, 3.40);
          return { home: formatOdds(side), draw: formatOdds(draw), away: formatOdds(side) };
        }

        const diff = Math.max(1, Math.abs(homeScore - awayScore));
        const winner = clamp(1.45 + Math.min(0.4, 0.16 * Math.max(0, 2 - diff)), 1.45, 1.85);
        const loser = clamp(4.2 + Math.min(1.3, diff * 0.35), 4.2, 5.50);
        const draw = clamp(3.2 + Math.min(0.4, diff * 0.10), 3.2, 3.60);

        return homeScore > awayScore
          ? { home: formatOdds(winner), draw: formatOdds(draw), away: formatOdds(loser) }
          : { home: formatOdds(loser), draw: formatOdds(draw), away: formatOdds(winner) };
      }

      if(drawScore){
        const draw = clamp(1.75 + Math.min(0.25, (homeScore + awayScore) * 0.05), 1.55, 2.05);
        const side = clamp(2.8 + Math.min(0.5, (homeScore + awayScore) * 0.07), 2.80, 3.35);
        return { home: formatOdds(side), draw: formatOdds(draw), away: formatOdds(side) };
      }

      const diff = Math.abs(homeScore - awayScore);
      const leanHome = clamp(1.8 + Math.min(0.35, diff * 0.15), 1.8, 2.2);
      const leanAway = clamp(1.8 + Math.min(0.35, diff * 0.15), 1.8, 2.2);
      const mid = clamp(3.2 + Math.min(0.35, diff * 0.08), 3.2, 3.7);

      return homeScore > awayScore
        ? { home: formatOdds(leanHome), draw: formatOdds(mid), away: formatOdds(leanAway + 1.1) }
        : { home: formatOdds(leanHome + 1.1), draw: formatOdds(mid), away: formatOdds(leanAway) };
    };

    const fallbackOdds = buildFallbackOdds();
    const oddsHome = originalOdds.home ?? fallbackOdds.home;
    const oddsDraw = originalOdds.draw ?? fallbackOdds.draw;
    const oddsAway = originalOdds.away ?? fallbackOdds.away;

    const isLiveStatus = MatchDetails.isLiveStatus(statusTextForLive, sport);

    const resolveTeamRecentForm = (teamSide) => {
      const rawTeamForm = this.rawData[`${teamSide}RecentForm`]
        ?? this.rawData[`${teamSide}Form`]
        ?? this.rawData[`${teamSide}_recent_form`]
        ?? this.rawData[`${teamSide}_form`]
        ?? this.rawData[teamSide]?.recentForm
        ?? this.rawData[teamSide]?.form;
      return rawTeamForm || [];
    };

    const baseMatch = {
      id: this.rawData.id
        ?? this.rawData.fixture?.id
        ?? this.rawData.event?.id
        ?? this.rawData.match?.id
        ?? `${homeTeam}-${awayTeam}-${Date.now()}`,
      sport,
      leagueName: this.rawData.league?.name
        ?? this.rawData.competition?.name
        ?? this.rawData.tournament?.name
        ?? this.rawData.cup?.name
        ?? this.rawData.series?.name
        ?? this.rawData.event?.name
        ?? '',
      leagueCountry: this.rawData.league?.country
        ?? this.rawData.league?.area?.name
        ?? this.rawData.tournament?.country
        ?? this.rawData.tournament?.area?.name
        ?? this.rawData.competition?.country
        ?? this.rawData.competition?.area?.name
        ?? this.rawData.country?.name
        ?? this.rawData.country
        ?? this.rawData.area?.name
        ?? this.rawData.venue?.country
        ?? this.rawData.fixture?.venue?.country
        ?? this.rawData.cup?.country
        ?? this.rawData.region
        ?? 'International',
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      status: statusLongRaw || 'TBD',
      statusShort,
      fixtureTime,
      marketLabel,
      oddsHome,
      oddsDraw,
      oddsAway,
      isLive: isLiveStatus,
      score: `${homeScore} - ${awayScore}`,
      recentForm: this.rawData.recentForm || this.rawData.form || [],
      homeRecentForm: resolveTeamRecentForm('home'),
      awayRecentForm: resolveTeamRecentForm('away'),
      h2hHistory: this.rawData.h2hHistory || this.rawData.h2h?.results || []
    };

    if(sport === 'football'){
      return {
        ...baseMatch,
        sport: 'football',
        id: this.rawData.fixture?.id ?? baseMatch.id,
        leagueName: this.rawData.league?.name || this.rawData.competition?.name || '',
        leagueCountry: this.rawData.league?.country || this.rawData.competition?.country || this.rawData.competition?.area?.name || ''
      };
    }

    if(sport === 'basketball'){
      return {
        ...baseMatch,
        sport: 'basketball',
        id: this.rawData.fixture?.id ?? this.rawData.id ?? baseMatch.id,
        status: this.rawData.status?.long ?? baseMatch.status
      };
    }

    return baseMatch;
  }

  // Calculate a simple confidence score from recent performance and head-to-head history
  static calculateConfidence(matchData){
    if(!matchData || typeof matchData !== 'object') return 0;

    const formResults = Array.isArray(matchData.recentForm)
      ? matchData.recentForm
      : String(matchData.recentForm || '').split(/[,\s]+/).filter(Boolean);

    const formScore = formResults.reduce((total, result) => {
      const normalized = String(result).trim().toUpperCase();
      if(normalized === 'W') return total + 3;
      if(normalized === 'D' || normalized === 'T') return total + 1;
      return total;
    }, 0);

    const formMax = Math.max(formResults.length * 3, 1);
    const formPercent = (formScore / formMax) * 100;

    const h2hResults = Array.isArray(matchData.h2hHistory)
      ? matchData.h2hHistory
      : [];

    const h2hScore = h2hResults.reduce((total, result) => {
      const normalized = String(result).trim().toUpperCase();
      if(normalized === 'W') return total + 3;
      if(normalized === 'D' || normalized === 'T') return total + 1;
      return total;
    }, 0);

    const h2hMax = Math.max(h2hResults.length * 3, 1);
    const h2hPercent = (h2hScore / h2hMax) * 100;

    // Weight recent form more heavily because it reflects current team momentum.
    const recentFormWeight = 0.6;
    const historicalWeight = 0.4;

    const confidence = Math.round((formPercent * recentFormWeight) + (h2hPercent * historicalWeight));

    return Math.min(100, Math.max(0, confidence));
  }
}
