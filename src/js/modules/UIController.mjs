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
    this.compareModalContainer = null;
  }

  init(){
    this.setupEventListeners();
    this.createCompareModalContainer();
    this.loadDashboardData();
    this.renderAccumulatorSlip();
  }

  setupEventListeners(){
    const fb = document.getElementById('toggle-football');
    const bb = document.getElementById('toggle-basketball');
    const searchInput = document.getElementById('global-search');

    if(fb) fb.addEventListener('click', () => this.switchSport('football'));
    if(bb) bb.addEventListener('click', () => this.switchSport('basketball'));

    if(searchInput){
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        this.filterAndRenderFixtures(query);
      });
    }

    // Delegated event listeners for fixture cards and slip items
    document.addEventListener('click', (e) => {
      if(e.target.classList.contains('add-to-slip-btn')){
        const matchId = e.target.getAttribute('data-id');
        const match = this.currentFixtures.find(m => {
          return String(m.id) === String(matchId) || String(m.matchId) === String(matchId);
        });
        if(match){
          this.slip.addMatch(match);
          this.renderAccumulatorSlip();
        }
      }

      if(e.target.classList.contains('remove-selection-btn')){
        const matchId = e.target.getAttribute('data-match-id');
        this.slip.removeMatch(matchId);
        this.renderAccumulatorSlip();
      }

      if(e.target.classList.contains('compare-teams-btn')){
        const homeTeam = e.target.getAttribute('data-home');
        const awayTeam = e.target.getAttribute('data-away');
        if(homeTeam && awayTeam){
          this.openTeamComparison(homeTeam, awayTeam);
        }
      }

      if(e.target.classList.contains('compare-modal-close')){
        this.closeCompareModal();
      }
    });
  }

  switchSport(sport){
    if(!sport) return;
    this.currentSport = sport;
    this.clearFixturesDisplay();

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

    this.loadDashboardData();
  }

  getFixturesContainer(){
    return document.getElementById('fixtures-container') || document.getElementById('fixtures-display');
  }

  clearFixturesDisplay(){
    const container = this.getFixturesContainer();
    if(container){
      container.innerHTML = '';
    }
  }

  getLoadingMarkup(){
    return `
      <div class="fixture-loading-state">
        <div class="spinner" aria-hidden="true"></div>
        <span>Loading fixtures…</span>
      </div>
    `;
  }

  extractFixtureArray(payload){
    if(!payload) return [];
    if(Array.isArray(payload)) return payload;

    const possibleArrays = [
      payload.response,
      payload.data,
      payload.results,
      payload.fixtures,
      payload.payload,
      payload.events,
      payload.response?.data,
      payload.response?.results,
      payload.response?.fixtures,
      payload.data?.response,
      payload.data?.events
    ];

    return possibleArrays.find(Array.isArray) || [];
  }

  async loadDashboardData(){
    const dateString = new Date().toISOString().slice(0,10); // YYYY-MM-DD
    const container = this.getFixturesContainer();

    if(container){
      container.innerHTML = this.getLoadingMarkup();
    }

    try{
      const payload = await this.services.getFixtures(this.currentSport, dateString);
      const fixtures = this.extractFixtureArray(payload);

      this.currentFixtures = fixtures.map((raw) => new MatchDetails(raw, this.currentSport).normalize());
      this.renderMatchCards(this.currentFixtures);
    }catch(err){
      console.warn('Failed to load dashboard data:', err);
      if(container){
        container.innerHTML = '<div class="error">Failed to load fixtures. Please try again later.</div>';
      }
    }
  }

  filterAndRenderFixtures(query){
    if(!query){
      this.renderMatchCards(this.currentFixtures);
      return;
    }

    const filtered = this.currentFixtures.filter((match) => {
      const homeTeam = String(match.homeTeam || '').toLowerCase();
      const awayTeam = String(match.awayTeam || '').toLowerCase();
      return homeTeam.includes(query) || awayTeam.includes(query);
    });

    this.renderMatchCards(filtered);
  }

  renderMatchCards(matches){
    const container = this.getFixturesContainer();
    if(!container) return;

    container.innerHTML = '';

    if(!Array.isArray(matches) || matches.length === 0){
      container.innerHTML = '<p class="empty-state-message">No fixtures found for this date.</p>';
      return;
    }

    matches.forEach((match) => {
      const confidence = MatchDetails.calculateConfidence(match);
      const badgeColor = confidence > 75 ? 'confidence-high' : confidence >= 50 ? 'confidence-medium' : 'confidence-low';

      const card = document.createElement('div');
      card.className = 'fixture-card';
      card.innerHTML = `
        <div class="fixture-card-inner" style="background:#1e1e1e;color:#fff;">
          <div class="fixture-card-header">
            <span class="fixture-status">${match.status || 'TBD'}</span>
            <span class="fixture-confidence-badge ${badgeColor}">
              ${confidence}% Confidence
            </span>
          </div>
          <div class="fixture-card-body">
            <div class="fixture-team-row">
              <div class="fixture-team">
                <span class="fixture-team-label">Home</span>
                <strong>${match.homeTeam || 'Unknown'}</strong>
              </div>
              <div class="fixture-score">
                ${match.homeScore ?? 0} - ${match.awayScore ?? 0}
              </div>
              <div class="fixture-team">
                <span class="fixture-team-label">Away</span>
                <strong>${match.awayTeam || 'Unknown'}</strong>
              </div>
            </div>
          </div>
          <div class="fixture-card-footer">
            <button class="add-to-slip-btn" data-id="${match.id}" type="button">Add to Slip</button>
            <button class="compare-teams-btn" data-home="${match.homeTeam}" data-away="${match.awayTeam}" type="button">Compare Teams</button>
          </div>
        </div>
      `;
      container.appendChild(card);
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

      const compareHint = document.createElement('p');
      compareHint.className = 'slip-compare-hint';
      compareHint.innerHTML = '💡 <strong>Tip:</strong> Click "Compare Teams" on any fixture card to see H2H history & current form.';
      slipContainer.appendChild(compareHint);
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

  createCompareModalContainer(){
    this.compareModalContainer = document.createElement('div');
    this.compareModalContainer.id = 'compare-modal-container';
    this.compareModalContainer.className = 'compare-modal hidden';
    document.body.appendChild(this.compareModalContainer);
  }

  openTeamComparison(homeTeam, awayTeam){
    const comparison = LockIndex.compareTeams(homeTeam, awayTeam, this.currentFixtures);
    this.renderCompareModal(comparison);
  }

  closeCompareModal(){
    if(this.compareModalContainer){
      this.compareModalContainer.classList.add('hidden');
      this.compareModalContainer.innerHTML = '';
    }
  }

  renderCompareModal(comparison){
    if(!this.compareModalContainer) return;

    const formatRecord = (record) => `W:${record.W} D:${record.D} L:${record.L}`;
    const teamAForm = comparison.teamA.form.join(' ') || 'No recent results';
    const teamBForm = comparison.teamB.form.join(' ') || 'No recent results';

    this.compareModalContainer.innerHTML = `
      <div class="compare-modal-backdrop"></div>
      <div class="compare-modal-panel" role="dialog" aria-modal="true" aria-label="Compare teams">
        <div class="compare-modal-header">
          <h2>Team Comparison</h2>
          <button class="compare-modal-close" type="button" aria-label="Close comparison modal">✕</button>
        </div>
        <div class="compare-modal-grid">
          <div class="compare-team-card">
            <h3>${comparison.teamA.name}</h3>
            <p><strong>Current Form</strong></p>
            <p>${teamAForm}</p>
            <p><strong>Record</strong> ${formatRecord(comparison.teamA.record)}</p>
          </div>
          <div class="compare-summary-card">
            <h3>H2H Summary</h3>
            <p><strong>Matches</strong> ${comparison.h2h.matches}</p>
            <p>${comparison.teamA.name} wins: ${comparison.h2h.teamAWins}</p>
            <p>${comparison.teamB.name} wins: ${comparison.h2h.teamBWins}</p>
            <p>Draws: ${comparison.h2h.draws}</p>
          </div>
          <div class="compare-team-card">
            <h3>${comparison.teamB.name}</h3>
            <p><strong>Current Form</strong></p>
            <p>${teamBForm}</p>
            <p><strong>Record</strong> ${formatRecord(comparison.teamB.record)}</p>
          </div>
        </div>
      </div>
    `;

    this.compareModalContainer.classList.remove('hidden');
  }
}
