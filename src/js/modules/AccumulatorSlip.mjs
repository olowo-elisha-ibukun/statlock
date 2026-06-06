export default class AccumulatorSlip {
  constructor(){
    this.storageKey = 'statlock_slip';
    this.items = [];

    try{
      if(typeof localStorage !== 'undefined'){
        const raw = localStorage.getItem(this.storageKey);
        if(raw){
          const parsed = JSON.parse(raw);
          if(Array.isArray(parsed)) this.items = parsed;
        }
      }
    }catch(e){
      // If parsing fails or localStorage is unavailable, default to empty array
      this.items = [];
    }
  }

  // Persist current items to localStorage
  save(){
    try{
      if(typeof localStorage !== 'undefined'){
        localStorage.setItem(this.storageKey, JSON.stringify(this.items));
      }
    }catch(e){
      console.warn('AccumulatorSlip.save() failed to persist data:', e);
    }
  }

  // Add a selection if it does not already exist (by id)
  addSelection(matchObject, sport){
    if(!matchObject) return;

    const id = matchObject.id ?? matchObject.matchId ?? matchObject.match_id;
    if(id == null){
      // If no recognizable id is present, generate a simple timestamp id (best-effort)
      matchObject.id = `generated_${Date.now()}`;
    } else {
      matchObject.id = id;
    }

    const exists = this.items.some(item => item.id === matchObject.id);
    if(!exists){
      const toStore = Object.assign({}, matchObject, { sport });
      this.items.push(toStore);
      this.save();
    }
  }

  // Remove any selection matching the provided matchId
  removeSelection(matchId){
    if(matchId == null) return;
    const before = this.items.length;
    this.items = this.items.filter(item => item.id !== matchId);
    if(this.items.length !== before) this.save();
  }

  // Clear all selections
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
