import ExternalServices from './ExternalServices.mjs';
import MatchDetails from './MatchDetails.mjs';
import AccumulatorSlip from './AccumulatorSlip.mjs';
import LockIndex from './LockIndex.mjs';

export default class UIController {
  constructor(){
    this.currentSport = 'football';
    this.services = new ExternalServices();
    this.slip = new AccumulatorSlip();
    this.currentFixtures = [];
  }

  init(){
    console.log('UIController initialized — current sport:', this.currentSport);
    this.setupEventListeners();
    this.loadDashboardData();
    this.renderAccumulatorSlip();
  }

  setupEventListeners(){
    const fb = document.getElementById('toggle-football');
    const bb = document.getElementById('toggle-basketball');

    if(fb) fb.addEventListener('click', () => this.switchSport('football'));
    if(bb) bb.addEventListener('click', () => this.switchSport('basketball'));

    // Delegated event listeners for fixture cards and slip items
    document.addEventListener('click', (e) => {
      if(e.target.classList.contains('add-selection-btn')){
        const matchId = e.target.getAttribute('data-match-id');
        const match = this.currentFixtures.find(m => {
          const id = m.fixture?.id || m.id;
          return String(id) === String(matchId);
        });
        if(match){
          this.slip.addSelection(match, this.currentSport);
          this.renderAccumulatorSlip();
        }
      }

      if(e.target.classList.contains('remove-selection-btn')){
        const matchId = e.target.getAttribute('data-match-id');
        this.slip.removeSelection(matchId);
        this.renderAccumulatorSlip();
      }
    });
  }

  switchSport(sport){
    if(!sport) return;
    this.currentSport = sport;

    const fb = document.getElementById('toggle-football');
    const bb = document.getElementById('toggle-basketball');

    if(fb){
      fb.classList.toggle('active', sport === 'football');
      fb.setAttribute('aria-pressed', sport === 'football');
    }

    if(bb){
      bb.classList.toggle('active', sport === 'basketball');
      bb.setAttribute('aria-pressed', sport === 'basketball');
    }

    console.log(`Active sport set to: ${this.currentSport}`);
    this.loadDashboardData();
  }

  async loadDashboardData(){
    const dateString = new Date().toISOString().slice(0,10); // YYYY-MM-DD

    try{
      const payload = await this.services.getFixtures(this.currentSport, dateString);
      console.log('Dashboard fixtures payload:', payload);
      
      // Store the raw fixtures for reference
      const fixtures = payload.response || payload.data || [];
      this.currentFixtures = fixtures;
      
      this.renderFixtureCards(fixtures);
    }catch(err){
      console.warn('Failed to load dashboard data:', err);
      const container = document.getElementById('fixtures-container') || document.getElementById('fixtures-display');
      if(container){
        container.innerHTML = '<div class="error">Failed to load fixtures. Please try again later.</div>';
      }
    }
  }

  renderFixtureCards(rawFixturesArray){
    const container = document.getElementById('fixtures-container') || document.getElementById('fixtures-display');
    if(!container) return;

    container.innerHTML = '';

    if(!Array.isArray(rawFixturesArray) || rawFixturesArray.length === 0){
      container.innerHTML = '<p class="muted">No fixtures available for this date.</p>';
      return;
    }

    rawFixturesArray.forEach((raw) => {
      try{
        const normalizer = new MatchDetails(raw, this.currentSport);
        const normalized = normalizer.normalize();

        const card = document.createElement('div');
        card.className = 'fixture-card';
        card.innerHTML = `
          <div class="fixture-header">
            <span class="status">${normalized.status || 'TBD'}</span>
          </div>
          <div class="fixture-body">
            <div class="team-row">
              <span class="team-name">${normalized.homeTeam || 'Unknown'}</span>
              <span class="score">${normalized.score}</span>
              <span class="team-name">${normalized.awayTeam || 'Unknown'}</span>
            </div>
          </div>
          <div class="fixture-footer">
            <button class="add-selection-btn" data-match-id="${normalized.id}" type="button">Add to Slip</button>
          </div>
        `;
        container.appendChild(card);
      }catch(e){
        console.warn('Error rendering fixture card:', e);
      }
    });
  }

  renderAccumulatorSlip(){
    const slipContainer = document.getElementById('slip-container') || document.getElementById('accumulator-sidebar');
    if(!slipContainer) return;

    slipContainer.innerHTML = '';

    // Calculate and display the LockIndex confidence score
    const riskEngine = new LockIndex(this.slip.items);
    const indexResult = riskEngine.calculateScore();

    const lockIndexSection = document.createElement('div');
    lockIndexSection.id = 'lock-index-score';
    lockIndexSection.className = 'lock-index-section';
    lockIndexSection.innerHTML = `
      <div class="lock-index-label">StatLock Confidence Index</div>
      <div class="lock-index-display">
        <span class="lock-index-number">${indexResult.score}</span>
        <span class="lock-index-percent">%</span>
      </div>
      <div class="lock-index-rating" style="color: ${indexResult.color}">${indexResult.rating}</div>
    `;
    slipContainer.appendChild(lockIndexSection);

    if(this.slip.items.length === 0){
      const emptyMsg = document.createElement('p');
      emptyMsg.className = 'muted';
      emptyMsg.textContent = 'Your accumulator slip is empty.';
      slipContainer.appendChild(emptyMsg);
      return;
    }

    const slipList = document.createElement('ul');
    slipList.className = 'slip-items';

    this.slip.items.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'slip-item';
      li.innerHTML = `
        <div class="slip-item-content">
          <span class="slip-sport">${item.sport}</span>
          <span class="slip-teams">${item.homeTeam} vs ${item.awayTeam}</span>
        </div>
        <button class="remove-selection-btn" data-match-id="${item.id}" type="button" aria-label="Remove">✕</button>
      `;
      slipList.appendChild(li);
    });

    slipContainer.appendChild(slipList);
  }
}
