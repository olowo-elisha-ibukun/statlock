export default class MatchDetails {
  constructor(matchObject, sport){
    this.rawData = matchObject;
    this.sport = sport;
  }

  normalize(){
    const sport = String(this.sport).toLowerCase();

    if(sport === 'football'){
      return {
        id: this.rawData.fixture?.id,
        sport: 'football',
        homeTeam: this.rawData.teams?.home?.name,
        awayTeam: this.rawData.teams?.away?.name,
        status: this.rawData.fixture?.status?.long,
        score: `${this.rawData.goals?.home ?? 0} - ${this.rawData.goals?.away ?? 0}`
      };
    }

    if(sport === 'basketball'){
      return {
        id: this.rawData.id,
        sport: 'basketball',
        homeTeam: this.rawData.teams?.home?.name,
        awayTeam: this.rawData.teams?.away?.name,
        status: this.rawData.status?.long,
        score: `${this.rawData.scores?.home?.total ?? 0} - ${this.rawData.scores?.away?.total ?? 0}`
      };
    }

    // Unsupported sport type
    throw new Error(`Unsupported sport: ${sport}`);
  }
}
