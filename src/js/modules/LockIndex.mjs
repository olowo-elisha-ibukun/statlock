export default class LockIndex {
  constructor(matchItemsArray){
    this.selections = matchItemsArray || [];
  }

  calculateScore(){
    if(this.selections.length === 0){
      return { score: 0, rating: 'Empty', color: '#aaaaaa' };
    }

    let score = 100;
    
    // Deduct 15 points per selection (accumulator risk)
    score -= this.selections.length * 15;
    
    // Clamp between 10 and 100
    score = Math.max(10, Math.min(100, score));

    // Determine rating tier
    let rating, color;
    if(score >= 75){
      rating = 'LOCK (High)';
      color = '#00C853'; // Emerald Green
    } else if(score >= 45){
      rating = 'SOLID';
      color = '#FFC107'; // Amber
    } else {
      rating = 'RISKY';
      color = '#F44336'; // Red
    }

    return { score, rating, color };
  }

  static compareTeams(teamAName, teamBName, fixtures = []){
    const normalize = (name) => String(name || '').trim().toLowerCase();
    const teamA = normalize(teamAName);
    const teamB = normalize(teamBName);

    const recordTemplate = () => ({ W: 0, D: 0, L: 0, total: 0 });
    const teamARecord = recordTemplate();
    const teamBRecord = recordTemplate();
    const h2h = { matches: 0, teamAWins: 0, teamBWins: 0, draws: 0 };

    const parseResult = (match, teamName) => {
      const home = normalize(match.homeTeam);
      const away = normalize(match.awayTeam);
      const homeScore = match.homeScore != null ? Number(match.homeScore) : null;
      const awayScore = match.awayScore != null ? Number(match.awayScore) : null;

      if(homeScore == null || awayScore == null || Number.isNaN(homeScore) || Number.isNaN(awayScore)){
        return null;
      }

      if(home === teamName){
        if(homeScore > awayScore) return 'W';
        if(homeScore === awayScore) return 'D';
        return 'L';
      }

      if(away === teamName){
        if(awayScore > homeScore) return 'W';
        if(awayScore === homeScore) return 'D';
        return 'L';
      }

      return null;
    };

    const teamAFixtures = fixtures.filter((match) => {
      const home = normalize(match.homeTeam);
      const away = normalize(match.awayTeam);
      return home === teamA || away === teamA;
    });

    const teamBFixtures = fixtures.filter((match) => {
      const home = normalize(match.homeTeam);
      const away = normalize(match.awayTeam);
      return home === teamB || away === teamB;
    });

    const h2hFixtures = fixtures.filter((match) => {
      const home = normalize(match.homeTeam);
      const away = normalize(match.awayTeam);
      return (home === teamA && away === teamB) || (home === teamB && away === teamA);
    });

    teamAFixtures.slice(-5).forEach((match) => {
      const result = parseResult(match, teamA);
      if(result){
        teamARecord[result] += 1;
        teamARecord.total += 1;
      }
    });

    teamBFixtures.slice(-5).forEach((match) => {
      const result = parseResult(match, teamB);
      if(result){
        teamBRecord[result] += 1;
        teamBRecord.total += 1;
      }
    });

    h2hFixtures.forEach((match) => {
      const homeScore = match.homeScore != null ? Number(match.homeScore) : null;
      const awayScore = match.awayScore != null ? Number(match.awayScore) : null;
      if(homeScore == null || awayScore == null || Number.isNaN(homeScore) || Number.isNaN(awayScore)){
        return;
      }

      h2h.matches += 1;
      const home = normalize(match.homeTeam);
      const away = normalize(match.awayTeam);
      if(homeScore > awayScore){
        if(home === teamA) h2h.teamAWins += 1;
        else h2h.teamBWins += 1;
      } else if(homeScore < awayScore){
        if(home === teamA) h2h.teamBWins += 1;
        else h2h.teamAWins += 1;
      } else {
        h2h.draws += 1;
      }
    });

    return {
      teamA: {
        name: teamAName,
        form: teamAFixtures.slice(-5).map((match) => parseResult(match, teamA)).filter(Boolean),
        record: teamARecord
      },
      teamB: {
        name: teamBName,
        form: teamBFixtures.slice(-5).map((match) => parseResult(match, teamB)).filter(Boolean),
        record: teamBRecord
      },
      h2h
    };
  }
}
