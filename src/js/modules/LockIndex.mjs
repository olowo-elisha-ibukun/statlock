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
}
