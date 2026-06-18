import ExternalServices from './ExternalServices.mjs';
import MatchDetails from './MatchDetails.mjs';
import AccumulatorSlip from './AccumulatorSlip.mjs';
import LockIndex from './LockIndex.mjs';
import { t, getCurrentLanguage, setLanguage, getAvailableLanguages, getLocalizedCountry, getLocalizedLeague } from './Languages.mjs';

export default class UIController {
  constructor(){
    this.currentSport = 'football';
    this.currentSubView = 'matches';
    this.currentFilter = 'all';
    this.currentDate = new Date();
    this.supportedSports = ['football', 'basketball', 'hockey', 'baseball', 'volleyball'];
    this.services = new ExternalServices();
    this.slip = new AccumulatorSlip();
    this.currentFixtures = [];
    this.currentLiveFixtures = [];
    this.compareModalContainer = null;
  }

  init(){
    this.setupLanguageSelector();
    this.applyCurrentLanguage();
    this.setupEventListeners();
    this.setupAuthModal();
    this.setupSectionNavigationListeners();
    this.createCompareModalContainer();
    this.updateSectionNavigationForSport();
    this.updateDateDisplay();
    this.restoreUserSignedInState();
    this.loadDashboardData();
    this.renderAccumulatorSlip();
  }

  setupEventListeners(){
    const sportButtons = document.querySelectorAll('.sport-toggle button');
    const searchInput = document.getElementById('global-search');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const datePrev = document.querySelector('[data-action="date-prev"]');
    const dateNext = document.querySelector('[data-action="date-next"]');

    sportButtons.forEach((button) => {
      const sport = button.dataset.sport;
      if(!sport) return;
      button.addEventListener('click', (event) => {
        sportButtons.forEach((btn) => {
          btn.classList.remove('active');
          btn.setAttribute('aria-pressed', 'false');
        });

        const target = event.currentTarget;
        if(target){
          target.classList.add('active');
          target.setAttribute('aria-pressed', 'true');
        }

        this.switchSport(sport);
      });
    });

    filterTabs.forEach((tab) => {
      const filter = tab.dataset.filter;
      if(!filter) return;
      tab.addEventListener('click', () => this.setActiveFilter(filter));
    });

    if(datePrev){
      datePrev.addEventListener('click', () => this.changeDate(-1));
    }

    if(dateNext){
      dateNext.addEventListener('click', () => this.changeDate(1));
    }

    if(searchInput){
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        this.filterAndRenderFixtures(query);
      });
    }

    // Delegated event listeners for fixture cards and slip items
    document.addEventListener('click', (e) => {
      // Global delegation for authentication buttons and modal close
      const loginClick = e.target.closest('.login-btn');
      if(loginClick){
        e.preventDefault();
        this.openAuthModal('login');
        return;
      }

      const registerClick = e.target.closest('.register-btn');
      if(registerClick){
        e.preventDefault();
        this.openAuthModal('register');
        return;
      }

      if(e.target.closest('#logout-btn')){
        e.preventDefault();
        try {
          localStorage.removeItem('statlock_user');
          localStorage.removeItem('statlock_is_signed_in');
        } catch (err) {
          console.warn('Error clearing sign-in state:', err);
        }
        this.resetSignedOutState();
        return;
      }

      if(e.target.closest('.auth-modal-close') || e.target.id === 'auth-modal'){
        this.closeAuthModal();
        return;
      }

      const slipLink = e.target.closest('.slip-link');
      if(slipLink){
        const matchId = slipLink.dataset.matchId;
        const selectionSport = slipLink.dataset.sport || 'football';
        
        // Check if we need to switch sports
        if(selectionSport !== this.currentSport){
          // Find and click the sport button to switch views
          const sportButton = document.querySelector(`.sport-toggle button[data-sport="${selectionSport}"]`);
          if(sportButton){
            sportButton.click();
          }
        }
        
        // Add a small delay to allow the new sport's fixtures to render into the DOM
        setTimeout(() => {
          // Try multiple selectors to find the fixture across all sports (universal approach)
          let fixtureElement = null;
          const selectors = [
            `.h2h-trigger[data-id="${matchId}"]`,
            `.match-row-container[data-id="${matchId}"]`,
            `.match-row[data-id="${matchId}"]`,
            `#fixture-${matchId}`,
            `[data-match-id="${matchId}"].match-row-container`,
            `[data-match-id="${matchId}"].match-row`
          ];
          for(const selector of selectors){
            const found = document.querySelector(selector);
            if(found) {
              fixtureElement = found.closest('.match-row-container') || found;
              break;
            }
          }
          if(fixtureElement){
            fixtureElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Do NOT auto-open the H2H drawer. Instead, briefly highlight the row so users can spot it.
            try {
              // gentle highlight using inline style fallback
              const prevBg = fixtureElement.style.backgroundColor || '';
              fixtureElement.style.transition = 'background-color 0.25s ease';
              fixtureElement.style.backgroundColor = 'rgba(243,160,5,0.12)';
              setTimeout(() => {
                fixtureElement.style.backgroundColor = prevBg;
              }, 1200);
              // also add/remove a CSS class for any stylesheet-driven highlight
              fixtureElement.classList.add('slip-jump-highlight');
              setTimeout(() => fixtureElement.classList.remove('slip-jump-highlight'), 1200);
            } catch (err) {
              // ignore any errors during highlight
            }
          }
        }, 100);
        return;
      }

      const oddCell = e.target.closest('.odds-cell');
      if(oddCell){
        const matchId = oddCell.dataset.matchId;
        const oddType = oddCell.dataset.oddType;
        const oddValue = oddCell.dataset.oddValue;
        const market = oddCell.dataset.market;
        const match = this.currentFixtures.find(m => {
          return String(m.id) === String(matchId) || String(m.matchId) === String(matchId);
        });
        if(match && oddType && oddValue){
          this.toggleSlipSelection(match, oddType, Number(oddValue), market || '1X2');
        }
        return;
      }

      const teamAction = e.target.closest('.match-team-action');
      if(teamAction){
        const homeTeam = teamAction.dataset.home;
        const awayTeam = teamAction.dataset.away;
        if(homeTeam && awayTeam){
          this.openTeamComparison(homeTeam, awayTeam);
        }
        return;
      }

      if(e.target.classList.contains('remove-selection-btn')){
        const matchId = e.target.getAttribute('data-match-id');
        this.slip.removeMatch(matchId);
        this.renderAccumulatorSlip();
        this.renderSubView();
        return;
      }

      if(e.target.classList.contains('clear-slip-btn')){
        this.slip.clearSlip();
        this.renderAccumulatorSlip();
        this.renderSubView();
        return;
      }

      if(e.target.classList.contains('compare-modal-close')){
        this.closeCompareModal();
      }

      const h2hTrigger = e.target.closest('.h2h-trigger');
      if(h2hTrigger){
        e.stopPropagation();
        const matchId = h2hTrigger.dataset.id;
        const drawer = document.getElementById(`drawer-${matchId}`);
        if(drawer){
          const isVisible = drawer.style.display !== 'none';
          drawer.style.display = isVisible ? 'none' : 'block';
          h2hTrigger.setAttribute('aria-expanded', String(!isVisible));
          if(!isVisible){
            const match = this.currentFixtures.find(m => String(m.id) === String(matchId));
            if(match){
              this.populateH2HDrawer(drawer, match);
            }
          }
        }
        return;
      }
    });

    // Authentication handled via global delegation below
  }

  setupLanguageSelector(){
    const langToggle = document.querySelector('.lang-toggle');
    const langDropdown = document.querySelector('.lang-dropdown');
    const langOptions = document.querySelectorAll('.lang-option');

    if(!langToggle || !langDropdown) return;

    // Toggle dropdown on globe click
    langToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      langDropdown.style.display = langDropdown.style.display === 'none' ? 'block' : 'none';
    });

    // Close dropdown on language option click
    langOptions.forEach((option) => {
      option.addEventListener('click', () => {
        const lang = option.dataset.lang;
        if(lang){
          setLanguage(lang);
          this.applyCurrentLanguage();
          this.updateLanguageDropdownUI();
          langDropdown.style.display = 'none';
          // Re-render content to apply translations to dynamic content
          this.renderAccumulatorSlip();
          this.renderSubView();
          // Force explicit re-render of match cards with new language translations
          if(this.currentFixtures && this.currentFixtures.length > 0){
            const fixtures = this.filterFixturesByToolbar();
            this.renderMatchCards(fixtures);
          }
        }
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if(!e.target.closest('.language-selector')){
        langDropdown.style.display = 'none';
      }
    });
  }

  setupAuthModal(){
    const modal = document.getElementById('auth-modal');
    if(!modal) return;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-hidden', 'true');
  }

  openAuthModal(formType = 'login'){
    const modal = document.getElementById('auth-modal');
    const formContainer = document.getElementById('modal-form-content');
    const lang = getCurrentLanguage();

    if(!modal || !formContainer) return;

    // Generate appropriate form based on type
    const form = formType === 'login' 
      ? this.getLoginFormHTML(lang)
      : this.getRegisterFormHTML(lang);

    formContainer.innerHTML = form;
    modal.classList.remove('hidden');
    // prevent background scrolling while modal is open
    document.body.classList.add('modal-open');
    modal.setAttribute('aria-hidden', 'false');

    // Focus first input for accessibility
    setTimeout(() => {
      const firstInput = modal.querySelector('.form-input');
      if(firstInput) firstInput.focus();
    }, 100);

    // Attach form-specific event listeners
    setTimeout(() => {
      this.attachFormListeners(formType, lang);
    }, 50);
  }

  closeAuthModal(){
    const modal = document.getElementById('auth-modal');
    if(modal){
      // Use the CSS-controlled hidden class instead of inline styles
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
      // restore body scroll
      document.body.classList.remove('modal-open');
      const formContainer = document.getElementById('modal-form-content');
      if(formContainer) formContainer.innerHTML = '';
      // Return focus to the login button for accessibility
      const loginBtn = document.querySelector('.login-btn');
      if(loginBtn) loginBtn.focus();
    }
  }

  getLoginFormHTML(lang){
    const emailLabel = t('email', lang) || 'Email';
    const passwordLabel = t('password', lang) || 'Password';
    const rememberMe = t('rememberMe', lang) || 'Remember me';
    const login = t('login', lang);
    const noAccount = t('noAccount', lang) || "Don't have an account?";
    const register = t('register', lang);

    return `
      <div class="auth-form-wrapper">
        <h2 class="auth-form-title">${login}</h2>
        <form id="login-form" class="auth-form">
          <div class="form-group">
            <label for="login-email" class="form-label">${emailLabel}</label>
            <input type="email" id="login-email" class="form-input" placeholder="user@example.com" required>
          </div>
          <div class="form-group">
            <label for="login-password" class="form-label">${passwordLabel}</label>
            <input type="password" id="login-password" class="form-input" placeholder="••••••••" required>
          </div>
          <div class="form-checkbox">
            <input type="checkbox" id="login-remember" class="checkbox-input">
            <label for="login-remember" class="checkbox-label">${rememberMe}</label>
          </div>
          <button type="submit" class="auth-form-submit">${login}</button>
        </form>
        <p class="auth-form-switch">
          ${noAccount} <a href="#" class="auth-form-link" data-form="register">${register}</a>
        </p>
      </div>
    `;
  }

  getRegisterFormHTML(lang){
    const fullName = t('fullName', lang) || 'Full Name';
    const emailLabel = t('email', lang) || 'Email';
    const passwordLabel = t('password', lang) || 'Password';
    const confirmPassword = t('confirmPassword', lang) || 'Confirm Password';
    const agreeTerms = t('agreeTerms', lang) || 'I agree to the Terms of Service';
    const register = t('register', lang);
    const haveAccount = t('haveAccount', lang) || 'Already have an account?';
    const login = t('login', lang);

    return `
      <div class="auth-form-wrapper">
        <h2 class="auth-form-title">${register}</h2>
        <form id="register-form" class="auth-form">
          <div class="form-group">
            <label for="register-name" class="form-label">${fullName}</label>
            <input type="text" id="register-name" class="form-input" placeholder="John Doe" required>
          </div>
          <div class="form-group">
            <label for="register-email" class="form-label">${emailLabel}</label>
            <input type="email" id="register-email" class="form-input" placeholder="user@example.com" required>
          </div>
          <div class="form-group">
            <label for="register-password" class="form-label">${passwordLabel}</label>
            <input type="password" id="register-password" class="form-input" placeholder="••••••••" required>
          </div>
          <div class="form-group">
            <label for="register-confirm" class="form-label">${confirmPassword}</label>
            <input type="password" id="register-confirm" class="form-input" placeholder="••••••••" required>
          </div>
          <div class="form-checkbox">
            <input type="checkbox" id="register-terms" class="checkbox-input" required>
            <label for="register-terms" class="checkbox-label">${agreeTerms}</label>
          </div>
          <button type="submit" class="auth-form-submit">${register}</button>
        </form>
        <p class="auth-form-switch">
          ${haveAccount} <a href="#" class="auth-form-link" data-form="login">${login}</a>
        </p>
      </div>
    `;
  }

  attachFormListeners(formType, lang){
    const form = formType === 'login' 
      ? document.getElementById('login-form')
      : document.getElementById('register-form');

    if(!form) return;

    // Form switch links
    const switchLinks = document.querySelectorAll('.auth-form-link');
    switchLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const newFormType = link.dataset.form;
        this.openAuthModal(newFormType);
      });
    });

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      if(formType === 'login'){
        this.handleLoginSubmit(form, lang);
      } else {
        this.handleRegisterSubmit(form, lang);
      }
    });
  }

  handleLoginSubmit(form, lang){
    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value.trim();

    // Validation
    if(!email || !password){
      alert(t('allFieldsRequired', lang) || 'Please fill in all fields');
      return;
    }

    if(!this.isValidEmail(email)){
      alert(t('invalidEmail', lang) || 'Please enter a valid email address');
      return;
    }

    if(password.length < 6){
      alert(t('passwordTooShort', lang) || 'Password must be at least 6 characters');
      return;
    }

    // Mock successful login
    this.showLoginSuccess(email, lang);
  }

  handleRegisterSubmit(form, lang){
    const name = document.getElementById('register-name')?.value.trim();
    const email = document.getElementById('register-email')?.value.trim();
    const password = document.getElementById('register-password')?.value.trim();
    const confirmPassword = document.getElementById('register-confirm')?.value.trim();
    const termsAccepted = document.getElementById('register-terms')?.checked;

    // Validation
    if(!name || !email || !password || !confirmPassword){
      alert(t('allFieldsRequired', lang) || 'Please fill in all fields');
      return;
    }

    if(!this.isValidEmail(email)){
      alert(t('invalidEmail', lang) || 'Please enter a valid email address');
      return;
    }

    if(password.length < 6){
      alert(t('passwordTooShort', lang) || 'Password must be at least 6 characters');
      return;
    }

    if(password !== confirmPassword){
      alert(t('passwordsMismatch', lang) || 'Passwords do not match');
      return;
    }

    if(!termsAccepted){
      alert(t('mustAcceptTerms', lang) || 'You must accept the Terms of Service');
      return;
    }

    // Mock successful registration
    this.showRegisterSuccess(name, lang);
  }

  isValidEmail(email){
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  showLoginSuccess(email, lang){
    this.closeAuthModal();
    const userName = email.split('@')[0];
    this.setUserSignedIn(userName);
  }

  showRegisterSuccess(name, lang){
    this.closeAuthModal();
    const firstName = name.split(' ')[0];
    this.setUserSignedIn(firstName);
  }

  setUserSignedIn(userName){
    // Hide auth buttons and show user profile badge
    const authButtons = document.querySelector('.auth-buttons');
    if(authButtons){
      authButtons.style.display = 'none';
    }

    // Create and insert user profile badge
    let profileBadge = document.querySelector('.user-profile-badge');
    if(!profileBadge){
      profileBadge = document.createElement('div');
      profileBadge.className = 'user-profile-badge';
      const headerControls = document.querySelector('.header-controls');
      if(headerControls){
        headerControls.appendChild(profileBadge);
      }
    }

    const logoutLabel = t('logout', getCurrentLanguage()) || 'Log Out';
    profileBadge.innerHTML = `
      <span class="user-profile-greeting">👋 Hello, ${userName}</span>
      <button id="logout-btn" class="auth-btn logout-btn" type="button">${logoutLabel}</button>
    `;
    profileBadge.style.display = 'flex';

    // Store signed-in state
    try {
      localStorage.setItem('statlock_user', userName);
    } catch (err) {
      console.warn('Could not store user info:', err);
    }
  }

  restoreUserSignedInState(){
    try {
      const userName = localStorage.getItem('statlock_user');
      if(userName){
        this.setUserSignedIn(userName);
      }
    } catch (err) {
      console.warn('Could not restore user state:', err);
    }
  }

  resetSignedOutState(){
    const profileBadge = document.querySelector('.user-profile-badge');
    if(profileBadge){
      profileBadge.remove();
    }

    const authButtons = document.querySelector('.auth-buttons');
    if(authButtons){
      authButtons.style.display = 'flex';
    }

    this.renderAccumulatorSlip();
    this.applyCurrentLanguage();
    this.renderSubView();
  }

  applyCurrentLanguage(){
    const lang = getCurrentLanguage();

    // Update static text elements
    const brandH1 = document.querySelector('.site-header .brand h1');
    if(brandH1) brandH1.textContent = t('brand', lang);

    const tagline = document.querySelector('.site-header .tagline');
    if(tagline) tagline.textContent = t('tagline', lang);

    const searchInput = document.querySelector('#global-search');
    if(searchInput) searchInput.placeholder = t('searchPlaceholder', lang);
    
    // Update authentication buttons
    const loginBtn = document.querySelector('.login-btn');
    if(loginBtn) loginBtn.textContent = t('login', lang);
    
    const registerBtn = document.querySelector('.register-btn');
    if(registerBtn) registerBtn.textContent = t('register', lang);

    const logoutBtn = document.getElementById('logout-btn');
    if(logoutBtn) logoutBtn.textContent = t('logout', lang);

    // Update section navigation labels
    const navButtons = document.querySelectorAll('.section-nav-tab');
    navButtons.forEach((btn) => {
      const view = btn.dataset.view;
      if(view === 'summary') btn.textContent = t('summary', lang);
      else if(view === 'matches') btn.textContent = t('matches', lang);
      else if(view === 'filter') btn.textContent = t('matchFilter', lang);
      else if(view === 'my-selections') btn.textContent = t('mySelections', lang);
      else if(view === 'livescore') btn.textContent = t('livescore', lang);
    });

    // Update filter tabs
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach((tab) => {
      const filter = tab.dataset.filter;
      if(filter === 'all'){
        // Preserve the "All Matches" with live count
        const liveCount = tab.querySelector('.live-count');
        tab.textContent = t('allMatches', lang);
        if(liveCount) tab.appendChild(liveCount);
      }
      else if(filter === 'live'){
        const liveCount = tab.querySelector('.live-count');
        tab.textContent = t('live', lang) + ' ';
        if(liveCount) tab.appendChild(liveCount);
      }
      else if(filter === 'upcoming') tab.textContent = t('upcoming', lang);
    });

    // Update language dropdown UI
    this.updateLanguageDropdownUI(lang);
  }

  updateLanguageDropdownUI(lang = null){
    const language = lang || getCurrentLanguage();
    const langOptions = document.querySelectorAll('.lang-option');

    langOptions.forEach((option) => {
      const optionLang = option.dataset.lang;
      const checkmark = option.querySelector('.lang-checkmark');

      if(optionLang === language){
        option.classList.add('active');
        if(checkmark) checkmark.textContent = '✓';
      } else {
        option.classList.remove('active');
        if(checkmark) checkmark.textContent = '';
      }
    });
  }

  setupSectionNavigationListeners(){
    const navButtons = document.querySelectorAll('.section-nav-tab');
    navButtons.forEach((button) => {
      const view = button.dataset.view;
      if(!view) return;
      button.addEventListener('click', () => {
        this.setActiveSection(view);
      });
    });
  }

  setActiveSection(view){
    let normalizedView = String(view || '').toLowerCase();
    if(this.currentSport === 'football' && normalizedView === 'summary'){
      normalizedView = 'matches';
    }

    const navButtons = document.querySelectorAll('.section-nav-tab');
    const visibleViews = Array.from(navButtons).map((button) => String(button.dataset.view || '').toLowerCase());
    const selectedView = normalizedView || (this.currentSport === 'football' ? 'matches' : 'summary');

    navButtons.forEach((button) => {
      const buttonView = String(button.dataset.view || '').toLowerCase();
      const isActive = buttonView === selectedView;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });

    this.currentSubView = selectedView;
    if (selectedView === 'livescore') {
      this.loadDashboardData();
      return;
    }
    this.renderSubView();
  }

  updateSectionNavigationForSport(){
    const navButtons = document.querySelectorAll('.section-nav-tab');
    navButtons.forEach((button) => {
      const buttonView = String(button.dataset.view || '').toLowerCase();
      const isSummaryTab = buttonView === 'summary';
      const shouldHide = this.currentSport === 'football' && isSummaryTab;
      button.style.display = shouldHide ? 'none' : '';
    });

    if(this.currentSport === 'football' && this.currentSubView === 'summary'){
      this.currentSubView = 'matches';
    }

    this.setActiveSection(this.currentSubView);
  }

  setActiveFilter(filter){
    const normalizedFilter = String(filter || '').toLowerCase();
    const filterTabs = document.querySelectorAll('.filter-tab');

    filterTabs.forEach((tab) => {
      const tabFilter = String(tab.dataset.filter || '').toLowerCase();
      const isActive = tabFilter === normalizedFilter;
      tab.classList.toggle('active', isActive);
    });

    this.currentFilter = normalizedFilter || 'all';
    this.renderSubView();
  }

  changeDate(days){
    this.currentDate = new Date(this.currentDate.getTime() + (days * 24 * 60 * 60 * 1000));
    this.updateDateDisplay();
    this.loadDashboardData();
  }

  updateDateDisplay(){
    const dateDisplay = document.querySelector('.date-display');
    if(!dateDisplay) return;

    const lang = getCurrentLanguage();
    const todayLabel = t('today', lang);
    const now = this.currentDate;
    const today = new Date();
    const isToday = now.toDateString() === today.toDateString();
    dateDisplay.textContent = isToday ? todayLabel : now.toISOString().slice(0,10);
  }

  getDefaultSubViewForSport(sport){
    const normalizedSport = String(sport || '').toLowerCase();
    return normalizedSport === 'football' ? 'matches' : 'summary';
  }

  switchSport(sport){
    if(!sport || !this.supportedSports.includes(sport)) return;
    this.currentSport = sport;
    this.currentFilter = 'all';
    this.currentSubView = this.getDefaultSubViewForSport(sport);
    this.clearFixturesDisplay();
    this.setActiveFilter('all');
    this.updateSectionNavigationForSport();
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

  getLoadingMarkup(lang = null){
    const language = lang || getCurrentLanguage();
    return `
      <div class="fixture-loading-state">
        <div class="spinner" aria-hidden="true"></div>
        <span>${t('loadingFixtures', language)}</span>
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
      payload.matches,
      payload.fixtures,
      payload.payload,
      payload.events,
      payload.response?.data,
      payload.response?.results,
      payload.response?.matches,
      payload.response?.fixtures,
      payload.data?.response,
      payload.data?.events,
      payload.data?.matches
    ];

    return possibleArrays.find(Array.isArray) || [];
  }

  getMatchStatusText(match){
    if(!match || typeof match !== 'object') return '';
    const statusShort = String(match.statusShort || '').trim();
    const statusFull = String(match.status || '').trim();
    return [statusShort, statusFull].filter(Boolean).join(' ').toLowerCase();
  }

  getTranslatedStatusString(statusShort){
    if(!statusShort) return '';
    const statusLower = String(statusShort).toLowerCase().trim();
    const lang = getCurrentLanguage();
    
    // Map API status values to translation keys
    const statusMap = {
      'tbd': 'tbd',
      'ns': 'notStarted',
      'live': 'live',
      '1h': 'live',
      '2h': 'live',
      'ft': 'ft',
      'final': 'final',
      'finished': 'finished',
      'match finished': 'finished',
      'upcoming': 'upcoming',
      'scheduled': 'scheduled',
      'pending': 'pending',
      'not started': 'notStarted',
      'postponed': 'postponed',
      'cancelled': 'cancelled',
      'abandoned': 'abandoned'
    };
    
    const key = statusMap[statusLower];
    if(key){
      return t(key, lang);
    }
    
    // Fallback: return original if no mapping found
    return statusShort;
  }

  getLocalizedValue(value, type = 'countries'){
    if(!value) return value;
    const lang = getCurrentLanguage();
    
    if(type === 'country'){
      return getLocalizedCountry(value, lang);
    } else if(type === 'league'){
      return getLocalizedLeague(value, lang);
    }
    
    // For unknown types, return original value
    return value;
  }

  isLiveMatch(match){
    if(!match || typeof match !== 'object') return false;
    if(match.isLive === true) return true;

    const sport = String(match.sport || '').toLowerCase();
    const statusText = this.getMatchStatusText(match);

    return MatchDetails.isLiveStatus(statusText, sport);
  }

  isFinishedMatch(match){
    const statusText = this.getMatchStatusText(match);
    return /\b(?:ft|final|match finished|finished)\b/.test(statusText);
  }

  isUpcomingMatch(match){
    if(!match || typeof match !== 'object') return false;
    const statusText = this.getMatchStatusText(match);
    const looksLikeTimeOnly = /^\s*(?:[01]?\d|2[0-3])[:\.][0-5]\d(?:\s*(?:am|pm))?\s*$/.test(statusText);
    return (
      /\b(?:tbd|ns|not started|upcoming|scheduled|pending|kickoff|future|preview|preseason)\b/.test(statusText)
      || looksLikeTimeOnly
    ) && !this.isLiveMatch(match)
      && !this.isFinishedMatch(match);
  }

  async loadDashboardData(){
    const dateString = this.currentDate.toISOString().slice(0,10); // YYYY-MM-DD
    const container = this.getFixturesContainer();

    if(container){
      container.innerHTML = this.getLoadingMarkup();
    }

    try{
      const fixtureOptions = {};
      const shouldRequestLive = this.currentSubView === 'livescore';
      if (shouldRequestLive) {
        fixtureOptions.status = 'live';
      }

      const payload = await this.services.getFixtures(this.currentSport, dateString, fixtureOptions);
      const hasPayloadErrors = payload?.errors && (
        (Array.isArray(payload.errors) && payload.errors.length > 0)
        || (typeof payload.errors === 'object' && Object.keys(payload.errors).length > 0)
        || (typeof payload.errors === 'string' && payload.errors.trim().length > 0)
      );

      if(hasPayloadErrors){
        const apiError = payload.errors.requests || payload.errors.token || payload.errors.message || JSON.stringify(payload.errors);
        throw new Error(`API error: ${apiError}`);
      }
      const fixtures = this.extractFixtureArray(payload);
      const normalizedFixtures = fixtures.map((raw) => new MatchDetails(raw, this.currentSport).normalize());

      if (shouldRequestLive) {
        this.currentLiveFixtures = normalizedFixtures;
      } else {
        this.currentFixtures = normalizedFixtures;
      }

      this.updateLiveCount();
      this.renderSubView();
      this.updateDateDisplay();
    }catch(err){
      console.warn('Failed to load dashboard data:', err);
      if(container){
        const lang = getCurrentLanguage();
        const rawMessage = String(err.message || t('pleaseTryAgainLater', lang));
        const missingKey = /missing api-?sports key|missing application key/i.test(rawMessage);
        const rateLimited = /request limit|rate limit|requests.*limit|upgrade your plan/i.test(rawMessage);
        const sportLabel = this.currentSport.charAt(0).toUpperCase() + this.currentSport.slice(1);
        const errorMessage = missingKey
          ? t('missingApiKeyMessage', lang)
          : rateLimited
            ? t('rateLimitMessage', lang).replace('{sport}', sportLabel)
            : t('failedToLoadFixturesFormat', lang).replace('{message}', rawMessage);
        container.innerHTML = `<div class="error">${errorMessage}</div>`;
      }
    }
  }

  filterAndRenderFixtures(query){
    if(!query){
      this.renderSubView();
      return;
    }

    const filtered = this.currentFixtures.filter((match) => {
      const homeTeam = String(match.homeTeam || '').toLowerCase();
      const awayTeam = String(match.awayTeam || '').toLowerCase();
      return homeTeam.includes(query) || awayTeam.includes(query);
    });

    this.renderMatchCards(filtered);
  }

  filterFixturesByToolbar(){
    if(this.currentFilter === 'all'){
      return this.currentFixtures;
    }

    if(this.currentFilter === 'live'){
      return this.currentFixtures.filter((match) => this.isLiveMatch(match));
    }

    if(this.currentFilter === 'upcoming'){
      return this.currentFixtures.filter((match) => this.isUpcomingMatch(match));
    }

    return this.currentFixtures;
  }

  formatLiveCount(count){
    if(typeof count !== 'number' || Number.isNaN(count)) return '0';
    if(count > 30) return '30+';
    return String(count);
  }

  updateLiveCount(){
    const countElement = document.querySelector('.live-count');
    if(!countElement) return;
    // Compute union of live fixtures from both sources for the current sport only
    const sportKey = String(this.currentSport || '').toLowerCase();
    const combinedIds = new Set();
    const addList = (list) => {
      (list || []).forEach((m) => {
        try {
          if(String(m.sport || '').toLowerCase() !== sportKey) return;
          if(!this.isLiveMatch(m)) return;
          const id = String(m.id || m.matchId || '').trim();
          if(id) combinedIds.add(id);
        } catch (err) {
          // ignore malformed entries
        }
      });
    };
    addList(this.currentLiveFixtures || []);
    addList(this.currentFixtures || []);
    const liveCount = combinedIds.size;
    countElement.textContent = this.formatLiveCount(liveCount);
  }

  renderMatchRow(match){
    const lang = getCurrentLanguage();
    const selectedItem = this.slip.items.find((item) => String(item.id) === String(match.id));
    const selectedLine = selectedItem?.selectedLine || '';
    const isBasketball = this.currentSport === 'basketball';
    const marketLabel = isBasketball
      ? (match.marketLabel ? String(match.marketLabel).replace(/1X2/gi, '1 2') : '1 2')
      : (match.marketLabel || '1X2');
    const homeOdds = match.oddsHome != null ? match.oddsHome : '--';
    const drawOdds = match.oddsDraw != null ? match.oddsDraw : '--';
    const awayOdds = match.oddsAway != null ? match.oddsAway : '--';
    const vsLabel = t('vs', lang);
    const homeLabel = t('home', lang);
    const drawLabel = t('draw', lang);
    const awayLabel = t('away', lang);
    const liveLabel = t('live', lang);
    const scoreContent = this.isUpcomingMatch(match)
      ? `<span class="score-dash">${vsLabel}</span>`
      : isBasketball
        ? `<span class="score-value">${match.homeScore ?? 0}</span><span class="score-separator">:</span><span class="score-value">${match.awayScore ?? 0}</span>`
        : `<span class="score-value">${match.homeScore ?? 0}</span><span class="score-separator">-</span><span class="score-value">${match.awayScore ?? 0}</span>`;

    const rowContainer = document.createElement('div');
    rowContainer.className = 'match-row-container';
    rowContainer.dataset.id = match.id;
    rowContainer.dataset.matchId = match.id;

    const row = document.createElement('div');
    row.className = 'match-row';
    const translatedStatus = this.getTranslatedStatusString(match.statusShort);
    
    // Localize team names (look up in translation dictionary)
    const homeTeamName = match.homeTeam ? this.getLocalizedValue(match.homeTeam, 'team') : 'Unknown';
    const awayTeamName = match.awayTeam ? this.getLocalizedValue(match.awayTeam, 'team') : 'Unknown';
    
    row.innerHTML = `
      <div class="match-status-column">
        ${this.isLiveMatch(match)
          ? `<span class="match-live-badge">${translatedStatus || liveLabel}</span>`
          : `<span class="match-time">${match.fixtureTime || ''}</span>`}
      </div>
      <div class="match-teams-column">
        <div class="h2h-trigger" data-id="${match.id}" role="button" tabindex="0" aria-expanded="false">
          <span class="team-name home-team">${homeTeamName}</span>
          <span class="match-score">${scoreContent}</span>
          <span class="team-name away-team">${awayTeamName}</span>
        </div>
      </div>
      <div class="match-odds-column ${isBasketball ? 'match-odds-column-2col' : ''}">
        <div class="match-market-label">${marketLabel}</div>
        <div class="match-odds-grid ${isBasketball ? 'odds-grid-2col' : ''}">
          <button class="odds-cell ${selectedLine === 'home' ? 'active' : ''}" type="button" data-match-id="${match.id}" data-odd-type="home" data-odd-value="${homeOdds}" data-market="${marketLabel}">
            <span class="odds-label">${isBasketball ? '1' : homeLabel}</span>
            <span class="odds-value">${homeOdds}</span>
          </button>
          ${!isBasketball ? `
            <button class="odds-cell ${selectedLine === 'draw' ? 'active' : ''}" type="button" data-match-id="${match.id}" data-odd-type="draw" data-odd-value="${drawOdds}" data-market="${marketLabel}">
              <span class="odds-label">${drawLabel}</span>
              <span class="odds-value">${drawOdds}</span>
            </button>
          ` : ''}
          <button class="odds-cell ${selectedLine === 'away' ? 'active' : ''}" type="button" data-match-id="${match.id}" data-odd-type="away" data-odd-value="${awayOdds}" data-market="${marketLabel}">
            <span class="odds-label">${isBasketball ? '2' : awayLabel}</span>
            <span class="odds-value">${awayOdds}</span>
          </button>
        </div>
      </div>
    `;
    rowContainer.appendChild(row);

    const drawer = document.createElement('div');
    drawer.className = 'h2h-drawer';
    drawer.id = `drawer-${match.id}`;
    drawer.style.display = 'none';
    rowContainer.appendChild(drawer);

    return rowContainer;
  }

  renderMatchSection(sectionTitle, matches, container){
    if(!Array.isArray(matches) || matches.length === 0) return;

    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'match-section-header';
    sectionHeader.innerHTML = `<h3 class="match-section-title">${sectionTitle}</h3>`;
    container.appendChild(sectionHeader);

    const lang = getCurrentLanguage();
    const unknownLeague = t('unknownLeague', lang);
    const unknownCountry = t('unknownCountry', lang);

    const grouped = matches.reduce((acc, match) => {
      const leagueName = this.getLocalizedValue(match.leagueName || unknownLeague, 'league');
      const leagueCountry = this.getLocalizedValue(match.leagueCountry || unknownCountry, 'country');
      const leagueKey = `${leagueName}|${leagueCountry}`;
      if(!acc[leagueKey]){
        acc[leagueKey] = {
          leagueName: leagueName,
          leagueCountry: leagueCountry,
          fixtures: []
        };
      }
      acc[leagueKey].fixtures.push(match);
      return acc;
    }, {});

    Object.values(grouped).forEach((group) => {
      const header = document.createElement('div');
      header.className = 'league-section-header';
      header.innerHTML = `
        <div class="league-header-content">
          <span class="league-name">${group.leagueName}</span>
          <span class="league-country">${group.leagueCountry}</span>
        </div>
      `;
      container.appendChild(header);

      group.fixtures.forEach((match) => {
        const row = this.renderMatchRow(match);
        container.appendChild(row);
      });
    });
  }

  renderMatchCards(matches){
    const container = this.getFixturesContainer();
    if(!container) return;

    container.innerHTML = '';

    const lang = getCurrentLanguage();
    const noFixturesMsg = t('noFixtures', lang);
    const liveMatchesLabel = t('liveMatches', lang);
    const upcomingMatchesLabel = t('upcomingMatches', lang);
    const allFixturesLabel = t('allFixtures', lang);

    // Separate live and non-live matches
    const liveMatches = matches.filter((m) => this.isLiveMatch(m));
    const nonLiveMatches = matches.filter((m) => !this.isLiveMatch(m));

    // If no fixtures at all
    if(matches.length === 0){
      const emptyMsg = document.createElement('p');
      emptyMsg.className = 'empty-state-message';
      emptyMsg.textContent = noFixturesMsg;
      container.appendChild(emptyMsg);
      return;
    }

    // Render live section if there are live matches
    if(liveMatches.length > 0){
      this.renderMatchSection(liveMatchesLabel, liveMatches, container);
    }

    // Render all fixtures section
    if(nonLiveMatches.length > 0){
      this.renderMatchSection(allFixturesLabel, nonLiveMatches, container);
    }
  }

  renderAccumulatorSlip(){
    const slipContainer = document.getElementById('slip-container') || document.getElementById('accumulator-sidebar');
    if(!slipContainer) return;

    const lang = getCurrentLanguage();
    const slipTitleText = t('mySelections_sidebar', lang);
    const overallOddsText = t('overallOdds', lang);
    const emptySlipText = t('emptySlip', lang);
    const slipTipText = t('slipTip', lang);
    const clearAllText = t('deleteAll', lang);
    const linePlaceholder = t('line', lang).toUpperCase();
    const vsText = t('vs', lang);
    const removeLabel = t('removeSelection', lang);

    slipContainer.innerHTML = '';
    const selectionCount = this.slip.items.length;
    const totalOdds = this.slip.items.reduce((acc, item) => {
      const price = Number(item.selectedPrice || 0);
      return acc * (price > 0 ? price : 1);
    }, 1);

    const slipHeader = document.createElement('div');
    slipHeader.className = 'slip-header';
    slipHeader.innerHTML = `
      <div>
        <div class="slip-header-top">
          <div class="slip-header-title">${slipTitleText} (${selectionCount})</div>
        </div>
      </div>
      <div class="overall-odds">${overallOddsText} <strong>${selectionCount ? totalOdds.toFixed(2) : '0.00'}</strong></div>
    `;
    slipContainer.appendChild(slipHeader);

    if(selectionCount === 0){
      const emptyMsg = document.createElement('p');
      emptyMsg.className = 'muted';
      emptyMsg.textContent = emptySlipText;
      slipContainer.appendChild(emptyMsg);

      const hint = document.createElement('p');
      hint.className = 'slip-compare-hint';
      hint.innerHTML = `💡 <strong>${t('tip', lang)}:</strong> ${slipTipText}`;
      slipContainer.appendChild(hint);
      return;
    }

    const slipList = document.createElement('ul');
    slipList.className = 'slip-items';

    this.slip.items.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'slip-item';
      // Localize team names in the slip display
      const localizedHomeTeam = item.homeTeam ? this.getLocalizedValue(item.homeTeam, 'team') : item.homeTeam;
      const localizedAwayTeam = item.awayTeam ? this.getLocalizedValue(item.awayTeam, 'team') : item.awayTeam;
      li.innerHTML = `
        <div class="slip-item-content">
          <span class="slip-sport">${item.sport || ''}</span>
          <span class="slip-teams slip-link" data-match-id="${item.id}" data-sport="${item.sport || 'football'}" style="cursor: pointer; color: #fff;" onmouseover="this.style.color='#f3a005'" onmouseout="this.style.color='#fff'">${localizedHomeTeam} ${vsText} ${localizedAwayTeam}</span>
          <span class="slip-selection">${(item.selectedLine || linePlaceholder).toUpperCase()} @ ${item.selectedPrice?.toFixed(2) || '--'}</span>
        </div>
        <button class="remove-selection-btn" data-match-id="${item.id}" type="button" aria-label="${removeLabel}">✕</button>
      `;
      slipList.appendChild(li);
    });

    slipContainer.appendChild(slipList);

    const clearAll = document.createElement('button');
    clearAll.type = 'button';
    clearAll.className = 'clear-slip-btn';
    clearAll.textContent = clearAllText;
    slipContainer.appendChild(clearAll);
  }

  toggleSlipSelection(match, oddType, oddValue, market){
    if(!match || !oddType) return;
    const existing = this.slip.items.find(item => String(item.id) === String(match.id));
    if(existing && existing.selectedLine === oddType){
      this.slip.removeMatch(match.id);
    } else {
      const selection = {
        ...match,
        selectedLine: oddType,
        selectedPrice: Number(oddValue),
        market: market || match.marketLabel || '1X2'
      };
      this.slip.addMatch(selection);
    }
    this.renderAccumulatorSlip();
    this.renderSubView();
  }

  createCompareModalContainer(){
    this.compareModalContainer = document.createElement('div');
    this.compareModalContainer.id = 'compare-modal-container';
    this.compareModalContainer.className = 'compare-modal hidden';
    document.body.appendChild(this.compareModalContainer);
  }

  renderSubView(){
    switch(this.currentSubView){
      case 'matches':
      case 'summary': {
        const fixtures = this.filterFixturesByToolbar();
        this.renderMatchCards(fixtures);
        return;
      }
      case 'filter':
        this.renderMatchFilterView();
        return;
      case 'my-selections':
        this.renderMySelectionsView();
        return;
      case 'livescore':
        this.renderLivescoreView();
        return;
      default:
        this.renderSectionPlaceholder(this.currentSubView);
    }
  }

  renderMatchFilterView(){
    const container = this.getFixturesContainer();
    if(!container) return;

    const lang = getCurrentLanguage();
    const matchFilterHeader = t('matchFilter', lang);
    const noFixturesAvailableText = t('noFixturesAvailable', lang);
    const switchSportsRefreshText = t('switchSportsRefresh', lang);
    const minOddsLabel = t('minOdds', lang);
    const maxOddsLabel = t('maxOdds', lang);
    const timeframeLabel = t('timeframe', lang);
    const todayLabel = t('today', lang);
    const next1DayLabel = t('next1day', lang);
    const next2DaysLabel = t('next2days', lang);
    const allDatesLabel = t('allDates', lang);

    container.innerHTML = '';

    if(this.currentFixtures.length === 0){
      container.innerHTML = `
        <div class="subview-panel">
          <div class="subview-header">
            <h2>${matchFilterHeader}</h2>
            <p>${noFixturesAvailableText} ${switchSportsRefreshText}</p>
          </div>
        </div>
      `;
      return;
    }

    // Create filter controls toolbar
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'odds-filter-controls';
    controlsDiv.innerHTML = `
      <div style="display: flex; gap: 1rem; flex-wrap: wrap; padding: 1rem; background: #f5f5f5; border-radius: 4px; margin-bottom: 1.5rem;">
        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
          <label for="min-odds-filter" style="font-weight: 600; font-size: 0.85rem;">${minOddsLabel}</label>
          <select id="min-odds-filter" style="padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.95rem;">
            <option value="1.00">1.00</option>
            <option value="1.10">1.10</option>
            <option value="1.20">1.20</option>
            <option value="1.30">1.30</option>
            <option value="1.40" selected>1.40</option>
            <option value="1.50">1.50</option>
            <option value="1.60">1.60</option>
            <option value="1.70">1.70</option>
            <option value="1.80">1.80</option>
            <option value="1.90">1.90</option>
            <option value="2.00">2.00</option>
            <option value="2.50">2.50</option>
            <option value="3.00">3.00</option>
            <option value="4.00">4.00</option>
            <option value="5.00">5.00</option>
          </select>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
          <label for="max-odds-filter" style="font-weight: 600; font-size: 0.85rem;">${maxOddsLabel}</label>
          <select id="max-odds-filter" style="padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.95rem;">
            <option value="1.10">1.10</option>
            <option value="1.20">1.20</option>
            <option value="1.30">1.30</option>
            <option value="1.40">1.40</option>
            <option value="1.50">1.50</option>
            <option value="1.60">1.60</option>
            <option value="1.70" selected>1.70</option>
            <option value="1.80">1.80</option>
            <option value="1.90">1.90</option>
            <option value="2.00">2.00</option>
            <option value="2.50">2.50</option>
            <option value="3.00">3.00</option>
            <option value="4.00">4.00</option>
            <option value="5.00">5.00</option>
            <option value="10.00">10.00</option>
          </select>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
          <label for="timeframe-filter" style="font-weight: 600; font-size: 0.85rem;">${timeframeLabel}</label>
          <select id="timeframe-filter" style="padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.95rem;">
            <option value="today" selected>${todayLabel}</option>
            <option value="next-1">${next1DayLabel}</option>
            <option value="next-2">${next2DaysLabel}</option>
            <option value="all">${allDatesLabel}</option>
          </select>
        </div>
      </div>
    `;
    container.appendChild(controlsDiv);

    // Create filter results container
    const resultsDiv = document.createElement('div');
    resultsDiv.id = 'filter-results';
    resultsDiv.className = 'filter-results-container';
    container.appendChild(resultsDiv);

    // Initial render with default filters
    this.applyOddsFilter(resultsDiv);

    // Attach event listeners to dropdowns
    const minOddsSelect = controlsDiv.querySelector('#min-odds-filter');
    const maxOddsSelect = controlsDiv.querySelector('#max-odds-filter');
    const timeframeSelect = controlsDiv.querySelector('#timeframe-filter');

    const updateFilter = () => this.applyOddsFilter(resultsDiv);

    minOddsSelect.addEventListener('change', updateFilter);
    maxOddsSelect.addEventListener('change', updateFilter);
    timeframeSelect.addEventListener('change', updateFilter);
  }

  applyOddsFilter(resultsDiv){
    if(!resultsDiv) return;
    resultsDiv.innerHTML = '';

    const minOddsSelect = document.getElementById('min-odds-filter');
    const maxOddsSelect = document.getElementById('max-odds-filter');
    const timeframeSelect = document.getElementById('timeframe-filter');

    const minOdds = parseFloat(minOddsSelect?.value || 1.40);
    const maxOdds = parseFloat(maxOddsSelect?.value || 1.70);
    const timeframe = timeframeSelect?.value || 'today';

    const today = new Date(this.currentDate);
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    if(timeframe === 'today' || timeframe === 'next-1'){
      endDate.setDate(endDate.getDate() + 1);
    } else if(timeframe === 'next-2'){
      endDate.setDate(endDate.getDate() + 2);
    } else {
      endDate.setDate(endDate.getDate() + 30);
    }

    const filtered = this.currentFixtures.filter((match) => {
      if(timeframe === 'all') return true;

      const matchDate = this.getMatchDateForFilter(match);
      if(!matchDate) return false;

      return matchDate >= today && matchDate < endDate;
    });

    // Further filter by odds range: at least one line must fall within [minOdds, maxOdds]
    const oddsFiltered = filtered.filter((match) => {
      const odds = [
        match.oddsHome,
        match.oddsDraw,
        match.oddsAway
      ].filter((o) => typeof o === 'number' && o > 0);

      return odds.some((odd) => odd >= minOdds && odd <= maxOdds);
    });

    if(oddsFiltered.length === 0){
      const emptyMsg = document.createElement('p');
      emptyMsg.className = 'empty-state-message';
      emptyMsg.style.padding = '2rem 1rem';
      emptyMsg.textContent = t('noOddsMatches', getCurrentLanguage());
      resultsDiv.appendChild(emptyMsg);
      return;
    }

    // Group filtered matches by league for display
    const groupedByLeague = {};
    oddsFiltered.forEach((match) => {
      const leagueKey = `${match.leagueCountry || 'INT'}|${match.leagueName || 'Unknown'}`;
      if(!groupedByLeague[leagueKey]){
        groupedByLeague[leagueKey] = {
          country: match.leagueCountry || 'INT',
          name: match.leagueName || 'Unknown',
          matches: []
        };
      }
      groupedByLeague[leagueKey].matches.push(match);
    });

    // Render each league section
    Object.values(groupedByLeague).forEach((league) => {
      // Create league header
      const leagueHeader = document.createElement('div');
      leagueHeader.style.cssText = 'background: #e8e8e8; padding: 0.75rem 1rem; margin-top: 1.5rem; margin-bottom: 0.5rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;';
      
      const flagEmoji = this.getCountryFlagEmoji(league.country);
      leagueHeader.innerHTML = `<span>${flagEmoji}</span><span style="color: #c41e3a;">${league.name}</span>`;
      resultsDiv.appendChild(leagueHeader);

      // Create column headers
      const headerRow = document.createElement('div');
      headerRow.style.cssText = 'display: grid; grid-template-columns: 60px 1fr 80px 80px 80px; gap: 1rem; padding: 0.75rem 1rem; background: #f5f5f5; font-weight: 600; font-size: 0.9rem; border-bottom: 1px solid #ddd;';
      headerRow.innerHTML = `
        <div>Time</div>
        <div>Match</div>
        <div style="text-align: center;">1</div>
        <div style="text-align: center;">X</div>
        <div style="text-align: center;">2</div>
      `;
      resultsDiv.appendChild(headerRow);

      // Render each match row
      league.matches.forEach((match) => {
        const row = this.renderMatchFilterRow(match);
        resultsDiv.appendChild(row);
      });
    });
  }

  renderMatchFilterRow(match){
    const row = document.createElement('div');
    row.style.cssText = 'display: grid; grid-template-columns: 60px 1fr 80px 80px 80px; gap: 1rem; padding: 0.75rem 1rem; border-bottom: 1px solid #eee; align-items: center; font-size: 0.95rem;';

    // Time column
    const timeStr = match.fixtureTime ? match.fixtureTime.substring(0, 5) : '—';
    const timeCell = document.createElement('div');
    timeCell.style.color = '#0066cc';
    timeCell.textContent = timeStr;

    // Match column
    const matchCell = document.createElement('div');
    matchCell.style.fontWeight = '500';
    matchCell.textContent = `${match.homeTeam || '?'} - ${match.awayTeam || '?'}`;

    const formatOdd = (value) => {
      if(value === undefined || value === null || Number.isNaN(Number(value))) return '—';
      return Number(value).toFixed(2);
    };

    const homeOdds = document.createElement('div');
    homeOdds.style.cssText = 'text-align: center; color: #c41e3a; font-weight: 600;';
    homeOdds.textContent = formatOdd(match.oddsHome);

    const drawOdds = document.createElement('div');
    drawOdds.style.cssText = 'text-align: center; color: #666; font-weight: 600;';
    drawOdds.textContent = formatOdd(match.oddsDraw);

    const awayOdds = document.createElement('div');
    awayOdds.style.cssText = 'text-align: center; color: #c41e3a; font-weight: 600;';
    awayOdds.textContent = formatOdd(match.oddsAway);

    row.appendChild(timeCell);
    row.appendChild(matchCell);
    row.appendChild(homeOdds);
    row.appendChild(drawOdds);
    row.appendChild(awayOdds);

    return row;
  }

  getMatchDateForFilter(match){
    if(!match || typeof match !== 'object') return null;
    if(match.fixtureDate instanceof Date && !Number.isNaN(match.fixtureDate.getTime())){
      return match.fixtureDate;
    }

    if(typeof match.fixtureDate === 'string' || typeof match.fixtureDate === 'number'){
      const parsed = new Date(match.fixtureDate);
      if(!Number.isNaN(parsed.getTime())) return parsed;
    }

    if(match.fixtureTime){
      const now = new Date(this.currentDate);
      const [hours, minutes] = String(match.fixtureTime).split(':').map((part) => Number(part));
      if(Number.isFinite(hours) && Number.isFinite(minutes)){
        now.setHours(hours, minutes, 0, 0);
        return now;
      }
    }

    return null;
  }

  getCountryFlagEmoji(countryCode){
    const countryMap = {
      'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      'Spain': '🇪🇸',
      'Germany': '🇩🇪',
      'France': '🇫🇷',
      'Italy': '🇮🇹',
      'Portugal': '🇵🇹',
      'Netherlands': '🇳🇱',
      'Belgium': '🇧🇪',
      'Austria': '🇦🇹',
      'Latvia': '🇱🇻',
      'Lithuania': '🇱🇹',
      'Norway': '🇳🇴',
      'USA': '🇺🇸',
      'Canada': '🇨🇦',
      'Australia': '🇦🇺',
      'New Zealand': '🇳🇿',
      'Dominican Republic': '🇩🇴',
      'Venezuela': '🇻🇪',
      'Italy': '🇮🇹',
      'Brazil': '🇧🇷',
      'Mexico': '🇲🇽',
      'Japan': '🇯🇵'
    };
    return countryMap[countryCode] || '🌍';
  }

  renderStreaksView(){
    const container = this.getFixturesContainer();
    if(!container) return;

    const lang = getCurrentLanguage();
    const winningStreaksTitle = t('winningStreaks', lang);
    const streaksDescription = t('streaksDescription', lang).replace('{sport}', this.currentSport.charAt(0).toUpperCase() + this.currentSport.slice(1));
    const noStreaksFoundText = t('noStreaksFound', lang);

    container.innerHTML = '';

    const streakRows = this.buildStreakRows(lang);

    const panelHeader = document.createElement('div');
    panelHeader.className = 'fixtures-header';
    panelHeader.innerHTML = `
      <div class="fixtures-header-top">
        <div>
          <p class="fixtures-subtitle">${winningStreaksTitle} - ${this.currentSport.charAt(0).toUpperCase() + this.currentSport.slice(1)}</p>
          <p style="margin:0;color:var(--muted);font-size:0.95rem;">${streaksDescription}</p>
        </div>
      </div>
    `;

    container.appendChild(panelHeader);

    if(streakRows.length === 0){
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state-message';
      emptyState.style.padding = '2rem 1rem';
      emptyState.textContent = noStreaksFoundText;
      container.appendChild(emptyState);
      return;
    }

    streakRows.forEach((section) => {
      const leagueSection = document.createElement('div');
      leagueSection.className = 'league-section';

      const leagueTitle = document.createElement('div');
      leagueTitle.className = 'league-header-content';
      leagueTitle.innerHTML = `
        <span class="league-name">${section.leagueName.toUpperCase()}</span>
        <span class="league-country">${section.leagueCountry}</span>
      `;
      leagueSection.appendChild(leagueTitle);

      const table = document.createElement('div');
      table.className = 'streak-table';
      table.innerHTML = `
        <div class="streak-table-row streak-table-header">
          <div class="streak-table-cell streak-table-cell-team">Team</div>
          <div class="streak-table-cell">W</div>
          <div class="streak-table-cell">Next match</div>
          <div class="streak-table-cell">1</div>
          <div class="streak-table-cell">X</div>
          <div class="streak-table-cell">2</div>
        </div>
      `;

      section.rows.forEach((row) => {
        const rowMarkup = document.createElement('div');
        rowMarkup.className = 'streak-table-row';
        rowMarkup.innerHTML = `
          <div class="streak-table-cell streak-table-cell-team">
            <span class="team-flag">${this.getCountryFlagEmoji(section.leagueCountry)}</span>
            <span>${row.teamName}</span>
          </div>
          <div class="streak-table-cell">${row.streakCount}</div>
          <div class="streak-table-cell">${row.nextMatch}</div>
          <div class="streak-table-cell">${row.odds1}</div>
          <div class="streak-table-cell">${row.oddsX}</div>
          <div class="streak-table-cell">${row.odds2}</div>
        `;
        table.appendChild(rowMarkup);
      });

      leagueSection.appendChild(table);
      container.appendChild(leagueSection);
    });
  }

  buildStreakRows(lang = getCurrentLanguage()){
    if(!Array.isArray(this.currentFixtures)) return [];

    const unknownLeague = t('unknownLeague', lang);
    const international = t('international', lang);
    const homeLabel = t('home', lang);
    const awayLabel = t('away', lang);

    const leagues = {};
    const teamStreaks = {};

    const getTeamForm = (match, side) => {
      const rawForm = side === 'home'
        ? match.homeRecentForm || match.recentForm || []
        : match.awayRecentForm || match.recentForm || [];
      return this.parseRecentForm(rawForm);
    };

    this.currentFixtures.forEach((match) => {
      const homeTeam = match.homeTeam || homeLabel;
      const awayTeam = match.awayTeam || awayLabel;
      const homeForm = getTeamForm(match, 'home');
      const awayForm = getTeamForm(match, 'away');
      const homeStreak = this.countWinningStreak(homeForm);
      const awayStreak = this.countWinningStreak(awayForm);
      const leagueKey = `${match.leagueCountry || international}|${match.leagueName || unknownLeague}`;
      const nextMatch = `${homeTeam} - ${awayTeam}`;

      if(homeStreak >= 2){
        const candidate = { streak: homeStreak, match, teamName: homeTeam, teamSide: 'home', nextMatch };
        const existing = teamStreaks[homeTeam];
        if(!existing || existing.streak < candidate.streak){
          teamStreaks[homeTeam] = candidate;
        }
      }

      if(awayStreak >= 2){
        const candidate = { streak: awayStreak, match, teamName: awayTeam, teamSide: 'away', nextMatch };
        const existing = teamStreaks[awayTeam];
        if(!existing || existing.streak < candidate.streak){
          teamStreaks[awayTeam] = candidate;
        }
      }

      if(!leagues[leagueKey]){
        leagues[leagueKey] = {
          leagueName: match.leagueName || 'Unknown League',
          leagueCountry: match.leagueCountry || 'International',
          rows: []
        };
      }
    });

    Object.values(teamStreaks).forEach((data) => {
      const match = data.match;
      const streak = data.streak;
      const leagueKey = `${match.leagueCountry || international}|${match.leagueName || unknownLeague}`;

      if(!leagues[leagueKey]){
        leagues[leagueKey] = {
          leagueName: match.leagueName || unknownLeague,
          leagueCountry: match.leagueCountry || international,
          rows: []
        };
      }

      leagues[leagueKey].rows.push({
        teamName: data.teamName,
        streakCount: streak,
        nextMatch: data.nextMatch,
        odds1: match.oddsHome != null ? match.oddsHome.toFixed(2) : '--',
        oddsX: match.oddsDraw != null ? match.oddsDraw.toFixed(2) : '--',
        odds2: match.oddsAway != null ? match.oddsAway.toFixed(2) : '--'
      });
    });

    Object.values(leagues).forEach((section) => {
      section.rows.sort((a, b) => b.streakCount - a.streakCount || a.teamName.localeCompare(b.teamName));
    });

    return Object.values(leagues).filter((section) => section.rows.length > 0);
  }

  normalizeFormResult(entry){
    if(entry === undefined || entry === null) return null;
    const value = String(entry).trim().toUpperCase();
    if(!value) return null;
    if(value === 'W' || /^WIN(?:NING)?/.test(value) || value === 'VICTORY' || value === 'V') return 'W';
    if(value === 'D' || /^DRAW/.test(value) || value === 'T' || /^TIE/.test(value)) return 'D';
    if(value === 'L' || /^LOSS/.test(value) || value === 'DEFEAT' || value === 'LOST') return 'L';
    if(value.startsWith('W')) return 'W';
    if(value.startsWith('D') || value.startsWith('T')) return 'D';
    if(value.startsWith('L')) return 'L';
    return value;
  }

  parseRecentForm(form){
    const normalizeEntry = (item) => {
      if(item === undefined || item === null) return null;
      if(typeof item === 'string' || typeof item === 'number'){
        return this.normalizeFormResult(item);
      }
      if(Array.isArray(item)){
        return item.flatMap((sub) => normalizeEntry(sub));
      }
      if(typeof item === 'object'){
        const knownKeys = ['result', 'outcome', 'label', 'type', 'status', 'value', 'form'];
        for(const key of knownKeys){
          if(item[key] !== undefined && item[key] !== null){
            return normalizeEntry(item[key]);
          }
        }
        if(Array.isArray(item.results)){
          return normalizeEntry(item.results);
        }
        return Object.values(item).flatMap((value) => normalizeEntry(value));
      }
      return null;
    };

    const entries = [];
    if(Array.isArray(form)){
      form.forEach((item) => {
        const normalized = normalizeEntry(item);
        if(Array.isArray(normalized)){
          normalized.forEach((value) => { if(value) entries.push(value); });
        } else if(normalized){
          entries.push(normalized);
        }
      });
      return entries.filter(Boolean);
    }

    if(typeof form === 'string' || typeof form === 'number'){
      return String(form)
        .split(/[\s,;|,]+/)
        .map((item) => this.normalizeFormResult(item))
        .filter(Boolean);
    }

    if(typeof form === 'object'){
      if(Array.isArray(form.results)) return this.parseRecentForm(form.results);
      if(Array.isArray(form.form)) return this.parseRecentForm(form.form);
      if(form.result !== undefined) return this.parseRecentForm(form.result);
    }

    return [];
  }

  countWinningStreak(formArray){
    const normalizedForm = this.parseRecentForm(formArray);
    if(normalizedForm.length === 0) return 0;
    const reversed = [...normalizedForm].reverse();
    let count = 0;
    for(const result of reversed){
      if(result === 'W') count++; else break;
    }
    return count;
  }

  generateH2HHistory(teamName, sport = 'football'){
    const pastDays = [3, 7, 14, 21, 28];
    const opponents = [
      'AC Milan', 'AS Roma', 'Napoli', 'Lazio', 'Juventus',
      'Inter', 'Fiorentina', 'Atalanta', 'Torino', 'Sampdoria',
      'Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla', 'Valencia',
      'Manchester City', 'Liverpool', 'Arsenal', 'Chelsea', 'Manchester United',
      'Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen',
      'PSG', 'Marseille', 'Lyon', 'Monaco', 'Nice'
    ];

    const normalizedSport = String(sport || '').trim().toLowerCase();
    const drawEligibleSports = ['football', 'hockey'];
    const allowDraws = drawEligibleSports.includes(normalizedSport);
    const results = allowDraws ? ['W', 'D', 'L'] : ['W', 'L'];
    const history = [];

    const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    for(let i = 0; i < 5; i++){
      const daysAgo = pastDays[i];
      const opponent = opponents[(teamName.charCodeAt(0) + i) % opponents.length];
      const result = results[Math.floor(Math.random() * results.length)];

      // We'll format the score as a string. For some sports (tennis) it's multi-part.
      let scoreString = '';

      if(normalizedSport === 'basketball'){
        // realistic basketball scores
        const winner = randInt(90, 130);
        const loser = randInt(Math.max(60, winner - 25), Math.max(60, winner - 1));
        if(result === 'W') scoreString = `${winner}-${loser}`; else scoreString = `${loser}-${winner}`;

      } else if(normalizedSport === 'tennis'){
        // Tennis: represent as sets, best-of-3. Example: "6-4,7-5" or "6-3,4-6,7-6"
        const setsCount = Math.random() < 0.5 ? 2 : 3; // 2 or 3 sets
        const teamWonMatch = result === 'W';
        const teamSetsWon = teamWonMatch ? 2 : (setsCount === 2 ? 0 : 1);
        const opponentSetsWon = setsCount - teamSetsWon;
        const sets = [];
        // build winning/losing sets order — not modeling exact order, just plausible scores
        for(let s = 0; s < setsCount; s++){
          const teamWinsThisSet = s < teamSetsWon;
          let w = randInt(6, 7);
          let l;
          if(w === 7){
            l = randInt(5, 6);
          } else {
            l = randInt(0, Math.max(0, w - 2));
          }
          if(teamWinsThisSet) sets.push(`${w}-${l}`); else sets.push(`${l}-${w}`);
        }
        scoreString = sets.join(',');

      } else if(normalizedSport === 'volleyball'){
        // Single-set style display (user requested single-line set score)
        const winner = randInt(25, 27);
        const loser = randInt(18, Math.min(24, winner - 1));
        if(result === 'W') scoreString = `${winner}-${loser}`; else scoreString = `${loser}-${winner}`;

      } else if(normalizedSport === 'baseball'){
        // baseball: low scoring but more than football sometimes
        const winner = randInt(1, 7);
        const loser = randInt(0, Math.max(0, winner - 1));
        if(result === 'W') scoreString = `${winner}-${loser}`; else scoreString = `${loser}-${winner}`;

      } else if(normalizedSport === 'hockey'){
        // hockey: similar to baseball ranges but allow draws in some contexts
        if(result === 'D'){
          const drawScore = randInt(0, 4);
          scoreString = `${drawScore}-${drawScore}`;
        } else {
          const winner = randInt(1, 6);
          const loser = randInt(0, Math.max(0, winner - 1));
          scoreString = result === 'W' ? `${winner}-${loser}` : `${loser}-${winner}`;
        }

      } else {
        // default: football-like low scores
        if(result === 'D'){
          const drawScore = randInt(0, 3);
          scoreString = `${drawScore}-${drawScore}`;
        } else {
          const winner = randInt(1, 4);
          const loser = randInt(0, Math.max(0, winner - 1));
          scoreString = result === 'W' ? `${winner}-${loser}` : `${loser}-${winner}`;
        }
      }

      const date = new Date();
      date.setDate(date.getDate() - daysAgo);

      history.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        opponent,
        result,
        score: scoreString
      });
    }

    return history;
  }

  populateH2HDrawer(drawer, match){
    const lang = getCurrentLanguage();
    const homeLabel = t('home', lang);
    const awayLabel = t('away', lang);
    const homeTeam = match.homeTeam || homeLabel;
    const awayTeam = match.awayTeam || awayLabel;
    const homeHistory = this.generateH2HHistory(homeTeam, this.currentSport);
    const awayHistory = this.generateH2HHistory(awayTeam, this.currentSport);

    const renderTeamColumn = (teamName, history) => {
      const matchRows = history.map((m) => {
        const badgeColor = m.result === 'W' ? '#2e7d32' : m.result === 'D' ? '#616161' : '#c62828';
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #252525; font-size: 13px;">
            <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              <span style="color: #bdbdbd;">${m.date}</span>
              <span style="color: #fff;">vs ${m.opponent}</span>
              <span style="color: #9e9e9e;">${m.score}</span>
            </div>
            <span style="width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 11px; font-weight: bold; color: #fff; text-align: center; background-color: ${badgeColor};">${m.result}</span>
          </div>
        `;
      }).join('');

      return `
        <div>
          <div style="font-size: 16px; font-weight: bold; color: #f3a005; margin-bottom: 12px; border-bottom: 1px solid #333; padding-bottom: 5px;">${teamName}</div>
          ${matchRows}
        </div>
      `;
    };

    drawer.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 15px; background-color: #1a1a1a; color: #fff; font-family: sans-serif;">
        ${renderTeamColumn(homeTeam, homeHistory)}
        ${renderTeamColumn(awayTeam, awayHistory)}
      </div>
    `;
  }

  renderPopularBetsView(){
    const container = this.getFixturesContainer();
    if(!container) return;

    const lang = getCurrentLanguage();
    const popularBetsTitle = t('popularBets', lang);
    const popularBetsDescription = t('popularBetsDescription', lang);
    const popularBetsEmptyText = t('popularBetsEmpty', lang);
    const favoriteOddsLabel = t('favoriteOdds', lang);
    const statusLabel = t('status', lang);
    const homeLabel = t('home', lang);
    const awayLabel = t('away', lang);
    const vsText = t('vs', lang);
    const tbdText = t('tbd', lang);

    container.innerHTML = '';
    const panel = document.createElement('div');
    panel.className = 'subview-panel';
    panel.innerHTML = `
      <div class="subview-header">
        <h2>${popularBetsTitle}</h2>
        <p>${popularBetsDescription}</p>
      </div>
    `;

    const ranked = this.currentFixtures
      .map((match) => {
        const odds = [match.oddsHome, match.oddsAway].filter((o) => typeof o === 'number' && o > 0);
        return { match, favorite: odds.length ? Math.min(...odds) : Number.MAX_SAFE_INTEGER };
      })
      .filter((item) => item.favorite < Number.MAX_SAFE_INTEGER)
      .sort((a, b) => a.favorite - b.favorite)
      .slice(0, 5);

    if(ranked.length === 0){
      panel.innerHTML += `<p class="subview-message">${popularBetsEmptyText}</p>`;
      container.appendChild(panel);
      return;
    }

    const list = document.createElement('div');
    list.className = 'subview-list';
    ranked.forEach(({ match, favorite }) => {
      const item = document.createElement('div');
      item.className = 'subview-card';
      item.innerHTML = `
        <strong>${match.homeTeam || homeLabel} ${vsText} ${match.awayTeam || awayLabel}</strong>
        <p>${favoriteOddsLabel}: ${favorite.toFixed(2)}</p>
        <p>${statusLabel}: ${match.status || tbdText}</p>
      `;
      list.appendChild(item);
    });

    container.appendChild(panel);
    container.appendChild(list);
  }

  renderResultsView(){
    const container = this.getFixturesContainer();
    if(!container) return;

    const lang = getCurrentLanguage();
    const resultsTitle = t('results', lang);
    const noFinishedMatchesText = t('noFinishedMatches', lang);
    const finished = this.currentFixtures.filter((match) => this.isFinishedMatch(match));
    container.innerHTML = '';

    if(finished.length === 0){
      container.innerHTML = `
        <div class="subview-panel">
          <div class="subview-header">
            <h2>${resultsTitle}</h2>
            <p>${noFinishedMatchesText}</p>
          </div>
        </div>
      `;
      return;
    }

    this.renderMatchCards(finished);
  }

  renderDroppingOddsView(){
    const container = this.getFixturesContainer();
    if(!container) return;

    const lang = getCurrentLanguage();
    const droppingOddsTitle = t('droppingOdds', lang);
    const droppingOddsDescription = t('droppingOddsDescription', lang);
    const droppingOddsEmptyText = t('droppingOddsEmpty', lang);
    const recentFormLabel = t('recentForm', lang);
    const statusLabel = t('status', lang);
    const homeLabel = t('home', lang);
    const awayLabel = t('away', lang);
    const vsText = t('vs', lang);
    const noRecentResults = t('noRecentResults', lang);
    const tbdText = t('tbd', lang);

    const drops = this.currentFixtures.filter((match) => {
      const form = Array.isArray(match.recentForm) ? match.recentForm : [];
      if(form.length < 4) return false;
      const priorTwo = form.slice(-4, -2).join('');
      const lastTwo = form.slice(-2).join('');
      return (priorTwo === 'WW' && lastTwo === 'LL') || (priorTwo === 'LL' && lastTwo === 'WW');
    });

    container.innerHTML = '';
    const panel = document.createElement('div');
    panel.className = 'subview-panel';
    panel.innerHTML = `
      <div class="subview-header">
        <h2>${droppingOddsTitle}</h2>
        <p>${droppingOddsDescription}</p>
      </div>
    `;

    if(drops.length === 0){
      panel.innerHTML += `<p class="subview-message">${droppingOddsEmptyText}</p>`;
      container.appendChild(panel);
      return;
    }

    const list = document.createElement('div');
    list.className = 'subview-list';
    drops.forEach((match) => {
      const item = document.createElement('div');
      item.className = 'subview-card';
      item.innerHTML = `
        <strong>${match.homeTeam || homeLabel} ${vsText} ${match.awayTeam || awayLabel}</strong>
        <p>${recentFormLabel}: ${Array.isArray(match.recentForm) ? match.recentForm.join(' ') : noRecentResults}</p>
        <p>${statusLabel}: ${match.status || tbdText}</p>
      `;
      list.appendChild(item);
    });

    container.appendChild(panel);
    container.appendChild(list);
  }

  renderMySelectionsView(){
    const container = this.getFixturesContainer();
    if(!container) return;

    const lang = getCurrentLanguage();
    const mySelectionsHeader = t('mySelections', lang);
    const mySelectionsDescription = t('mySelectionsDescription', lang);
    const mySelectionsEmptyText = t('mySelectionsEmpty', lang);
    const selectionLabel = t('selectionLabel', lang);
    const statusLabel = t('status', lang);
    const homeLabel = t('home', lang);
    const awayLabel = t('away', lang);
    const vsText = t('vs', lang);
    const linePlaceholder = t('line', lang).toUpperCase();
    const tbdText = t('tbd', lang);

    container.innerHTML = '';
    const panel = document.createElement('div');
    panel.className = 'subview-panel';
    panel.innerHTML = `
      <div class="subview-header">
        <h2>${mySelectionsHeader}</h2>
        <p>${mySelectionsDescription}</p>
      </div>
    `;

    const items = this.slip.items || [];
    if(items.length === 0){
      panel.innerHTML += `<p class="subview-message">${mySelectionsEmptyText}</p>`;
      container.appendChild(panel);
      return;
    }

    const list = document.createElement('ul');
    list.className = 'subview-list';
    items.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'subview-card';
      li.innerHTML = `
        <strong>${item.homeTeam || homeLabel} ${vsText} ${item.awayTeam || awayLabel}</strong>
        <p>${selectionLabel}: ${(item.selectedLine || linePlaceholder).toUpperCase()} @ ${item.selectedPrice?.toFixed(2) || '--'}</p>
        <p>${statusLabel}: ${item.status || tbdText}</p>
      `;
      list.appendChild(li);
    });

    container.appendChild(panel);
    container.appendChild(list);
  }

  renderLivescoreView(){
    const container = this.getFixturesContainer();
    if(!container) return;

    const lang = getCurrentLanguage();
    const livescoreTitle = t('livescore', lang);
    const noLiveMatchesText = t('noLiveMatches', lang);
    // Merge live fixtures from the dedicated live fetch and any live flags in the general fixtures list,
    // but only include matches for the currently selected sport and that are truly live.
    const sportKey = String(this.currentSport || '').toLowerCase();
    const liveFromCurrent = (this.currentFixtures || []).filter((match) => {
      try { return String(match.sport || '').toLowerCase() === sportKey && this.isLiveMatch(match); } catch { return false; }
    });

    const combined = [];
    const seen = new Set();

    // Add explicit live fixtures (for current sport) first
    (this.currentLiveFixtures || []).forEach((m) => {
      try {
        if(String(m.sport || '').toLowerCase() !== sportKey) return;
        if(!this.isLiveMatch(m)) return;
        const id = String(m.id || m.matchId || '').trim();
        if(!id) return;
        if(!seen.has(id)){
          seen.add(id);
          combined.push(m);
        }
      } catch (err) {
        // ignore malformed entries
      }
    });

    // Add any other live fixtures found in the general fixtures list
    liveFromCurrent.forEach((m) => {
      try {
        const id = String(m.id || m.matchId || '').trim();
        if(!id) return;
        if(!seen.has(id)){
          seen.add(id);
          combined.push(m);
        }
      } catch (err) {
        // ignore
      }
    });

    const liveMatches = combined;
    container.innerHTML = '';

    if(liveMatches.length === 0){
      container.innerHTML = `
        <div class="subview-panel">
          <div class="subview-header">
            <h2>${livescoreTitle}</h2>
            <p>${noLiveMatchesText}</p>
          </div>
        </div>
      `;
      return;
    }

    this.renderMatchCards(liveMatches);
  }

  renderSectionPlaceholder(section){
    const container = this.getFixturesContainer();
    if(!container) return;

    const lang = getCurrentLanguage();
    const sectionName = this.capitalize(section.replace(/-/g, ' '));
    const placeholderText = t('sectionPlaceholder', lang).replace('{section}', sectionName);

    container.innerHTML = `
      <div class="subview-panel">
        <div class="subview-header">
          <h2>${sectionName}</h2>
          <p>${placeholderText}</p>
        </div>
      </div>
    `;
  }

  capitalize(value){
    return String(value)
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
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

    const lang = getCurrentLanguage();
    const formatRecord = (record) => `W:${record.W} D:${record.D} L:${record.L}`;
    const teamAForm = comparison.teamA.form.join(' ') || t('noRecentResults', lang);
    const teamBForm = comparison.teamB.form.join(' ') || t('noRecentResults', lang);
    const teamComparisonTitle = t('teamComparison', lang);
    const closeComparisonLabel = t('closeComparisonModal', lang);
    const currentFormLabel = t('currentForm', lang);
    const recordLabel = t('record', lang);
    const h2hSummaryLabel = t('h2hSummary', lang);
    const matchesLabel = t('matches', lang);
    const winsLabel = t('wins', lang);
    const drawsLabel = t('draws', lang);

    this.compareModalContainer.innerHTML = `
      <div class="compare-modal-backdrop"></div>
      <div class="compare-modal-panel" role="dialog" aria-modal="true" aria-label="${teamComparisonTitle}">
        <div class="compare-modal-header">
          <h2>${teamComparisonTitle}</h2>
          <button class="compare-modal-close" type="button" aria-label="${closeComparisonLabel}">✕</button>
        </div>
        <div class="compare-modal-grid">
          <div class="compare-team-card">
            <h3>${comparison.teamA.name}</h3>
            <p><strong>${currentFormLabel}</strong></p>
            <p>${teamAForm}</p>
            <p><strong>${recordLabel}</strong> ${formatRecord(comparison.teamA.record)}</p>
          </div>
          <div class="compare-summary-card">
            <h3>${h2hSummaryLabel}</h3>
            <p><strong>${matchesLabel}</strong> ${comparison.h2h.matches}</p>
            <p>${comparison.teamA.name} ${winsLabel}: ${comparison.h2h.teamAWins}</p>
            <p>${comparison.teamB.name} ${winsLabel}: ${comparison.h2h.teamBWins}</p>
            <p>${drawsLabel}: ${comparison.h2h.draws}</p>
          </div>
          <div class="compare-team-card">
            <h3>${comparison.teamB.name}</h3>
            <p><strong>${currentFormLabel}</strong></p>
            <p>${teamBForm}</p>
            <p><strong>${recordLabel}</strong> ${formatRecord(comparison.teamB.record)}</p>
          </div>
        </div>
      </div>
    `;

    this.compareModalContainer.classList.remove('hidden');
  }
}
