import UIController from './modules/UIController.mjs';
import ExternalServices from './modules/ExternalServices.mjs';
import MatchDetails from './modules/MatchDetails.mjs';
import { getCurrentLanguage } from './modules/Languages.mjs';

const TEST_DATE = new Date().toISOString().slice(0,10); // YYYY-MM-DD

async function runModuleHealthCheck(ui){
  console.group('StatLock Module Health Check');

  const services = new ExternalServices();
  let payload;
  try{
    payload = await services.getFixtures(ui.currentSport, TEST_DATE);
  }catch(error){
    console.error('ExternalServices fetch failed:', error);
    console.groupEnd();
    return;
  }

  const rawFixtures = payload.response || payload.data || [];
  if(!Array.isArray(rawFixtures) || rawFixtures.length === 0){
    const container = document.getElementById('fixtures-container') || document.getElementById('fixtures-display');
    if(container){
      container.innerHTML = '<p class="muted">No fixtures available for this date.</p>';
    }
    console.groupEnd();
    return;
  }

  const normalizedFixtures = rawFixtures.map((raw) => {
    return new MatchDetails(raw, ui.currentSport).normalize();
  });

  ui.currentFixtures = normalizedFixtures;
  ui.renderMatchCards(normalizedFixtures);
  console.groupEnd();
}

document.addEventListener('DOMContentLoaded', async () => {
  const ui = new UIController();
  ui.init();

  if(window.location.search.includes('moduleTest=1')){
    await runModuleHealthCheck(ui);
  }
});
