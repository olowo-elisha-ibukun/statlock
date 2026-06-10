export default class AccumulatorSlip {
  constructor(){
    this.storageKey = 'statlock_slip';
    this.items = [];
    this.loadFromLocalStorage();
  }

  // Retrieve the saved slip from browser storage and keep the items array current
  loadFromLocalStorage(){
    try{
      if(typeof localStorage !== 'undefined'){
        const raw = localStorage.getItem(this.storageKey);
        if(raw){
          const parsed = JSON.parse(raw);
          if(Array.isArray(parsed)){
            this.items = parsed;
            return;
          }
        }
      }
    }catch(e){
      console.warn('AccumulatorSlip.loadFromLocalStorage() failed:', e);
    }

    this.items = [];
  }

  // Save the current slip items to browser storage
  saveToLocalStorage(){
    try{
      if(typeof localStorage !== 'undefined'){
        localStorage.setItem(this.storageKey, JSON.stringify(this.items));
      }
    }catch(e){
      console.warn('AccumulatorSlip.saveToLocalStorage() failed:', e);
    }
  }

  // Add a match to the accumulator slip if it is not already present
  addMatch(match){
    if(!match || typeof match !== 'object') return;

    const matchId = match.matchId ?? match.id ?? match.match_id;
    const id = matchId != null ? String(matchId) : `generated_${Date.now()}`;

    const alreadyAdded = this.items.some(item => String(item.id) === id);
    if(alreadyAdded) return;

    const toStore = {
      ...match,
      id,
      matchId: id
    };

    this.items.push(toStore);
    this.saveToLocalStorage();
  }

  // Remove a match from the slip by its ID
  removeMatch(matchId){
    if(matchId == null) return;

    const id = String(matchId);
    const previousLength = this.items.length;
    this.items = this.items.filter(item => String(item.id) !== id && String(item.matchId) !== id);

    if(this.items.length !== previousLength){
      this.saveToLocalStorage();
    }
  }

  // Backward compatibility with older method names
  addSelection(matchObject, sport){
    const entry = { ...matchObject };
    if(sport) entry.sport = sport;
    this.addMatch(entry);
  }

  removeSelection(matchId){
    this.removeMatch(matchId);
  }

  // Clear the accumulator slip and remove the saved entry from storage
  clearSlip(){
    this.items = [];
    try{
      if(typeof localStorage !== 'undefined'){
        localStorage.removeItem(this.storageKey);
      }
    }catch(e){
      console.warn('AccumulatorSlip.clearSlip() failed to clear localStorage:', e);
    }
  }
}
