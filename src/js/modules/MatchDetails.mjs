export default class MatchDetails {
  constructor(matchObject, sport){
    this.rawData = matchObject;
    this.sport = sport;
  }

  normalize(){
    const sport = String(this.sport).toLowerCase();

    if(sport === 'football'){
      const homeScore = this.rawData.goals?.home ?? 0;
      const awayScore = this.rawData.goals?.away ?? 0;
      return {
        id: this.rawData.fixture?.id,
        sport: 'football',
        homeTeam: this.rawData.teams?.home?.name,
        awayTeam: this.rawData.teams?.away?.name,
        homeScore,
        awayScore,
        status: this.rawData.fixture?.status?.long,
        score: `${homeScore} - ${awayScore}`,
        recentForm: this.rawData.recentForm || this.rawData.form || [],
        h2hHistory: this.rawData.h2hHistory || this.rawData.h2h?.results || []
      };
    }

    if(sport === 'basketball'){
      const homeScore = this.rawData.scores?.home?.total ?? 0;
      const awayScore = this.rawData.scores?.away?.total ?? 0;
      return {
        id: this.rawData.id,
        sport: 'basketball',
        homeTeam: this.rawData.teams?.home?.name,
        awayTeam: this.rawData.teams?.away?.name,
        homeScore,
        awayScore,
        status: this.rawData.status?.long,
        score: `${homeScore} - ${awayScore}`,
        recentForm: this.rawData.recentForm || this.rawData.form || [],
        h2hHistory: this.rawData.h2hHistory || this.rawData.h2h?.results || []
      };
    }

    throw new Error(`Unsupported sport: ${sport}`);
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
