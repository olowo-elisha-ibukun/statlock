/**
 * Internationalization (i18n) Module
 * Manages language translations and locale switching for StatLock
 */

export const translations = {
  en: {
    // Brand & Header
    brand: "StatLock",
    tagline: "Sports analytics & insights",
    
    // Search
    searchPlaceholder: "Search teams, players, matches",
    
    // Section Navigation
    summary: "Summary",
    matches: "Matches",
    matchFilter: "Match Filter",
    mySelections: "My Selections",
    livescore: "Livescore",
    
    // Subview Labels
    popularBets: "Popular Bets",
    popularBetsDescription: "Top 5 matches with the lowest favorite odds from the current fixtures.",
    popularBetsEmpty: "No popular bets available from fixture odds.",
    favoriteOdds: "Favorite odds",
    tbd: "TBD",
    results: "Results",
    noFinishedMatches: "No finished matches found for this date.",
    droppingOdds: "Dropping Odds",
    droppingOddsDescription: "Matches with a recent shift in form that could affect odds.",
    droppingOddsEmpty: "No matches with a clear form shift were found.",
    recentForm: "Recent form",
    mySelectionsDescription: "Your current accumulator slip selections appear here.",
    mySelectionsEmpty: "Your selection slip is empty. Add matches by clicking an odd cell.",
    selectionLabel: "Selection",
    noLiveMatches: "No live matches are active for this sport and date.",
    sectionPlaceholder: "Content for {section} will appear here soon.",
    teamComparison: "Team Comparison",
    closeComparisonModal: "Close comparison modal",
    currentForm: "Current Form",
    record: "Record",
    h2hSummary: "H2H Summary",
    matches: "Matches",
    wins: "wins",
    draws: "Draws",
    noRecentResults: "No recent results",
    status: "Status",
    winningStreaks: "Winning streaks",
    streaksDescription: "Performance streaks for {sport} fixtures, grouped by league.",
    noStreaksFound: "No streaks found for the current fixtures.",
    international: "International",
    pleaseTryAgainLater: "Please try again later.",
    missingApiKeyMessage: "Missing API key. Run the app with a valid API_SPORTS_KEY / VITE_SPORTS_API_KEY, or open the page with ?apiSportsKey=YOUR_KEY.",
    rateLimitMessage: "{sport} fixtures are unavailable because the API request limit has been reached. Please try again later or use a different API key.",
    failedToLoadFixturesFormat: "Failed to load fixtures: {message}",
    
    // Filter Toolbar
    allMatches: "All Matches",
    live: "Live",
    upcoming: "Upcoming",
    
    // Fixtures Display
    todaysFixtures: "TODAY'S FIXTURES",
    
    // Accumulator Sidebar
    mySelections_sidebar: "My Selections",
    overallOdds: "OVERALL ODDS",
    emptySlip: "Your accumulator slip is empty. Click an odd to add a selection.",
    tip: "Tip",
    slipTip: "Click a HOME, DRAW, or AWAY box to build your accumulator.",
    deleteAll: "Delete all matches in this selection",
    removeSelection: "Remove selection",
    line: "Line",
    
    // Odds Labels
    home: "Home",
    draw: "Draw",
    away: "Away",
    
    // Match Status & Section Headers
    liveMatches: "LIVE MATCHES",
    upcomingMatches: "UPCOMING MATCHES",
    allFixtures: "ALL FIXTURES",
    live: "LIVE",
    vs: "vs",
    
    // Common Labels
    unknownLeague: "Unknown League",
    unknownCountry: "Unknown Country",
    noFixtures: "No fixtures found for this date.",
    loadingFixtures: "Loading fixtures…",
    noOddsMatches: "No matches found matching these odds parameters.",
    noFixturesAvailable: "No fixtures available yet.",
    switchSportsRefresh: "Switch sports or refresh to load matches.",
    minOdds: "Min Odds",
    maxOdds: "Max Odds",
    timeframe: "Timeframe",
    today: "Today",
    next1day: "Next 1 day",
    next2days: "Next 2 days",
    allDates: "All dates",
    
    // Sports Names
    sport_football: "Football",
    sport_basketball: "Basketball",
    sport_hockey: "Hockey",
    sport_baseball: "Baseball",
    sport_volleyball: "Volleyball",
    
    // Language Selector
    language: "Language",
    english: "English",
    italian: "Italiano",
    portuguese: "Português (Brasil)",
    
    // Authentication
    login: "Login",
    register: "Register",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    fullName: "Full Name",
    rememberMe: "Remember me",
    agreeTerms: "I agree to the Terms of Service",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    logout: "Log Out",
    allFieldsRequired: "Please fill in all fields",
    invalidEmail: "Please enter a valid email address",
    passwordTooShort: "Password must be at least 6 characters",
    passwordsMismatch: "Passwords do not match",
    mustAcceptTerms: "You must accept the Terms of Service",
    
    // Match Status Labels
    tbd: "TBD",
    live: "Live",
    ft: "FT",
    final: "Final",
    finished: "Finished",
    upcoming: "Upcoming",
    scheduled: "Scheduled",
    pending: "Pending",
    notStarted: "Not Started",
    postponed: "Postponed",
    cancelled: "Cancelled",
    abandoned: "Abandoned"
  },
  
  it: {
    // Brand & Header
    brand: "StatLock",
    tagline: "Analisi sportiva e approfondimenti",
    
    // Search
    searchPlaceholder: "Cerca squadre, giocatori, partite",
    
    // Section Navigation
    summary: "Sommario",
    matches: "Partite",
    matchFilter: "Filtro Partite",
    mySelections: "Le mie selezioni",
    livescore: "Punteggio in diretta",
    
    // Subview Labels
    popularBets: "Scommesse popolari",
    popularBetsDescription: "Le 5 partite migliori con le quote favorite più basse dagli incontri correnti.",
    popularBetsEmpty: "Nessuna scommessa popolare disponibile dalle quote delle partite.",
    favoriteOdds: "Quote preferite",
    tbd: "TBD",
    results: "Risultati",
    noFinishedMatches: "Nessuna partita finita trovata per questa data.",
    droppingOdds: "Quote in calo",
    droppingOddsDescription: "Partite con un recente cambiamento di forma che potrebbe influenzare le quote.",
    droppingOddsEmpty: "Non sono state trovate partite con un chiaro cambiamento di forma.",
    recentForm: "Forma recente",
    mySelectionsDescription: "Le selezioni correnti del tuo accumulatore appaiono qui.",
    mySelectionsEmpty: "Il tuo foglio selezioni è vuoto. Aggiungi partite facendo clic su una quota.",
    selectionLabel: "Selezione",
    noLiveMatches: "Nessuna partita in diretta è attiva per questo sport e questa data.",
    sectionPlaceholder: "Il contenuto per {section} apparirà qui presto.",
    teamComparison: "Confronto squadre",
    closeComparisonModal: "Chiudi modal di confronto",
    currentForm: "Forma attuale",
    record: "Record",
    h2hSummary: "Riepilogo testa a testa",
    matches: "Partite",
    wins: "vittorie",
    draws: "Pareggi",
    noRecentResults: "Nessun risultato recente",
    status: "Stato",
    winningStreaks: "Serie vincenti",
    streaksDescription: "Serie di prestazioni per le partite di {sport}, raggruppate per lega.",
    noStreaksFound: "Nessuna serie trovata per le partite correnti.",
    international: "Internazionale",
    pleaseTryAgainLater: "Riprova più tardi.",
    missingApiKeyMessage: "Manca la chiave API. Avvia l'app con una API_SPORTS_KEY / VITE_SPORTS_API_KEY valida o apri la pagina con ?apiSportsKey=YOUR_KEY.",
    rateLimitMessage: "Le partite di {sport} non sono disponibili perché è stato raggiunto il limite di richieste API. Riprova più tardi o usa una chiave API diversa.",
    failedToLoadFixturesFormat: "Impossibile caricare le partite: {message}",
    
    // Filter Toolbar
    allMatches: "Tutte le partite",
    live: "In diretta",
    upcoming: "Prossimo",
    
    // Fixtures Display
    todaysFixtures: "PALINSESTO DI OGGI",
    
    // Accumulator Sidebar
    mySelections_sidebar: "Le mie selezioni",
    overallOdds: "QUOTE COMPLESSIVE",
    emptySlip: "Il tuo foglio accumulatore è vuoto. Fai clic su una quota per aggiungere una selezione.",
    tip: "Consiglio",
    slipTip: "Fai clic su una casella HOME, DRAW o AWAY per costruire il tuo accumulatore.",
    deleteAll: "Elimina tutte le partite in questa selezione",
    removeSelection: "Rimuovi selezione",
    line: "Linea",
    
    // Odds Labels
    home: "Casa",
    draw: "Pareggio",
    away: "Trasferta",
    
    // Match Status & Section Headers
    liveMatches: "PARTITE IN DIRETTA",
    upcomingMatches: "PARTITE IN ARRIVO",
    allFixtures: "TUTTI GLI INCONTRI",
    live: "DIRETTA",
    vs: "vs",
    
    // Common Labels
    unknownLeague: "Lega Sconosciuta",
    unknownCountry: "Paese Sconosciuto",
    noFixtures: "Nessuna partita trovata per questa data.",
    loadingFixtures: "Caricamento partite…",
    noOddsMatches: "Nessuna partita trovata con questi parametri di quota.",
    noFixturesAvailable: "Nessuna partita disponibile al momento.",
    switchSportsRefresh: "Cambia sport o aggiorna per caricare le partite.",
    minOdds: "Quote minime",
    maxOdds: "Quote massime",
    timeframe: "Intervallo di tempo",
    today: "Oggi",
    next1day: "Prossimo 1 giorno",
    next2days: "Prossimi 2 giorni",
    allDates: "Tutte le date",
    
    // Sports Names
    sport_football: "Calcio",
    sport_basketball: "Pallacanestro",
    sport_hockey: "Hockey",
    sport_baseball: "Baseball",
    sport_volleyball: "Pallavolo",
    
    // Language Selector
    language: "Lingua",
    english: "English",
    italian: "Italiano",
    portuguese: "Português (Brasil)",
    
    // Authentication
    login: "Accedi",
    register: "Registrati",
    email: "Email",
    password: "Password",
    confirmPassword: "Conferma Password",
    fullName: "Nome Completo",
    rememberMe: "Ricordami",
    agreeTerms: "Accetto i Termini di Servizio",
    noAccount: "Non hai un account?",
    haveAccount: "Hai già un account?",
    logout: "Esci",
    allFieldsRequired: "Compila tutti i campi",
    invalidEmail: "Inserisci un indirizzo email valido",
    passwordTooShort: "La password deve essere almeno 6 caratteri",
    passwordsMismatch: "Le password non corrispondono",
    mustAcceptTerms: "Devi accettare i Termini di Servizio",
    
    // Match Status Labels
    tbd: "TBD",
    live: "In diretta",
    ft: "FT",
    final: "Finale",
    finished: "Finito",
    upcoming: "Prossimo",
    scheduled: "Programmato",
    pending: "In sospeso",
    notStarted: "Non iniziato",
    postponed: "Rinviato",
    cancelled: "Cancellato",
    abandoned: "Abbandonato"
  },
  
  pt: {
    // Brand & Header
    brand: "StatLock",
    tagline: "Análise esportiva e insights",
    
    // Search
    searchPlaceholder: "Buscar times, jogadores, partidas",
    
    // Section Navigation
    summary: "Resumo",
    matches: "Partidas",
    matchFilter: "Filtro de Partidas",
    mySelections: "Minhas Seleções",
    livescore: "Placar ao vivo",
    
    // Subview Labels
    popularBets: "Apostas populares",
    popularBetsDescription: "Top 5 partidas com as odds favoritas mais baixas das partidas atuais.",
    popularBetsEmpty: "Nenhuma aposta popular disponível a partir das odds das partidas.",
    favoriteOdds: "Odds favoritas",
    tbd: "TBD",
    results: "Resultados",
    noFinishedMatches: "Nenhuma partida finalizada encontrada para esta data.",
    droppingOdds: "Odds em queda",
    droppingOddsDescription: "Partidas com uma mudança recente de forma que pode afetar as odds.",
    droppingOddsEmpty: "Nenhuma partida com mudança clara de forma foi encontrada.",
    recentForm: "Forma recente",
    mySelectionsDescription: "Suas seleções atuais do acumulador aparecem aqui.",
    mySelectionsEmpty: "Seu boletim de seleções está vazio. Adicione partidas clicando em uma cotação.",
    selectionLabel: "Seleção",
    noLiveMatches: "Nenhuma partida ao vivo está ativa para este esporte e data.",
    sectionPlaceholder: "Conteúdo para {section} aparecerá aqui em breve.",
    teamComparison: "Comparação de equipes",
    closeComparisonModal: "Fechar modal de comparação",
    currentForm: "Forma atual",
    record: "Recorde",
    h2hSummary: "Resumo H2H",
    matches: "Partidas",
    wins: "vitórias",
    draws: "Empates",
    noRecentResults: "Sem resultados recentes",
    status: "Status",
    winningStreaks: "Sequências vencedoras",
    streaksDescription: "Sequências de desempenho para partidas de {sport}, agrupadas por liga.",
    noStreaksFound: "Nenhuma sequência encontrada para as partidas atuais.",
    international: "Internacional",
    pleaseTryAgainLater: "Por favor, tente novamente mais tarde.",
    missingApiKeyMessage: "Chave API ausente. Execute o aplicativo com um API_SPORTS_KEY / VITE_SPORTS_API_KEY válido ou abra a página com ?apiSportsKey=YOUR_KEY.",
    rateLimitMessage: "As partidas de {sport} não estão disponíveis porque o limite de solicitações da API foi atingido. Por favor, tente novamente mais tarde ou use uma chave de API diferente.",
    failedToLoadFixturesFormat: "Falha ao carregar partidas: {message}",
    
    // Filter Toolbar
    allMatches: "Todas as Partidas",
    live: "Ao Vivo",
    upcoming: "Próximas",
    
    // Fixtures Display
    todaysFixtures: "JOGOS DE HOJE",
    
    // Accumulator Sidebar
    mySelections_sidebar: "Minhas Seleções",
    overallOdds: "ODDS GERAIS",
    emptySlip: "Seu boletim acumulador está vazio. Clique em uma cotação para adicionar uma seleção.",
    tip: "Dica",
    slipTip: "Clique em uma caixa HOME, DRAW ou AWAY para construir seu acumulador.",
    deleteAll: "Excluir todas as partidas nesta seleção",
    removeSelection: "Remover seleção",
    line: "Linha",
    
    // Odds Labels
    home: "Início",
    draw: "Empate",
    away: "Fora",
    
    // Match Status & Section Headers
    liveMatches: "PARTIDAS AO VIVO",
    upcomingMatches: "PARTIDAS PRÓXIMAS",
    allFixtures: "TODOS OS JOGOS",
    live: "AO VIVO",
    vs: "vs",
    
    // Common Labels
    unknownLeague: "Liga Desconhecida",
    unknownCountry: "País Desconhecido",
    noFixtures: "Nenhuma partida encontrada para esta data.",
    loadingFixtures: "Carregando partidas…",
    noOddsMatches: "Nenhuma partida encontrada com esses parâmetros de odds.",
    noFixturesAvailable: "Nenhuma partida disponível no momento.",
    switchSportsRefresh: "Mude de esporte ou atualize para carregar partidas.",
    minOdds: "Odds mínimas",
    maxOdds: "Odds máximas",
    timeframe: "Período",
    today: "Hoje",
    next1day: "Próximo 1 dia",
    next2days: "Próximos 2 dias",
    allDates: "Todas as datas",
    
    // Sports Names
    sport_football: "Futebol",
    sport_basketball: "Basquete",
    sport_hockey: "Hóquei",
    sport_baseball: "Beisebol",
    sport_volleyball: "Voleibol",
    
    // Language Selector
    language: "Idioma",
    english: "English",
    italian: "Italiano",
    portuguese: "Português (Brasil)",
    
    // Authentication
    login: "Entrar",
    register: "Cadastrar",
    email: "Email",
    password: "Senha",
    confirmPassword: "Confirmar Senha",
    fullName: "Nome Completo",
    rememberMe: "Lembrar-me",
    agreeTerms: "Concordo com os Termos de Serviço",
    noAccount: "Não tem uma conta?",
    haveAccount: "Já tem uma conta?",
    logout: "Sair",
    allFieldsRequired: "Por favor, preencha todos os campos",
    invalidEmail: "Por favor, insira um endereço de email válido",
    passwordTooShort: "A senha deve ter pelo menos 6 caracteres",
    passwordsMismatch: "As senhas não correspondem",
    mustAcceptTerms: "Você deve aceitar os Termos de Serviço",
    
    // Match Status Labels
    tbd: "TBD",
    live: "Ao Vivo",
    ft: "FT",
    final: "Final",
    finished: "Finalizado",
    upcoming: "Próximo",
    scheduled: "Agendado",
    pending: "Pendente",
    notStarted: "Não iniciado",
    postponed: "Adiado",
    cancelled: "Cancelado",
    abandoned: "Abandonado"
  }
};

/**
 * Get the current language setting from localStorage or default to English
 */
export function getCurrentLanguage(){
  return localStorage.getItem('statlock_lang') || 'en';
}

/**
 * Localization dictionary for geographic and league names
 * Maps English names to translations in other languages
 */
export const localization = {
  // Countries
  countries: {
    en: {
      'England': 'England',
      'Spain': 'Spain',
      'Italy': 'Italy',
      'Germany': 'Germany',
      'France': 'France',
      'Portugal': 'Portugal',
      'Netherlands': 'Netherlands',
      'Belgium': 'Belgium',
      'Austria': 'Austria',
      'Switzerland': 'Switzerland',
      'Greece': 'Greece',
      'Turkey': 'Turkey',
      'Russia': 'Russia',
      'Poland': 'Poland',
      'Czech Republic': 'Czech Republic',
      'Hungary': 'Hungary',
      'Romania': 'Romania',
      'Brazil': 'Brazil',
      'Argentina': 'Argentina',
      'Uruguay': 'Uruguay',
      'Mexico': 'Mexico',
      'United States': 'United States',
      'Canada': 'Canada',
      'Japan': 'Japan',
      'South Korea': 'South Korea',
      'China': 'China',
      'Australia': 'Australia',
      'World': 'World',
      'European Union': 'European Union'
    },
    it: {
      'England': 'Inghilterra',
      'Spain': 'Spagna',
      'Italy': 'Italia',
      'Germany': 'Germania',
      'France': 'Francia',
      'Portugal': 'Portogallo',
      'Netherlands': 'Paesi Bassi',
      'Belgium': 'Belgio',
      'Austria': 'Austria',
      'Switzerland': 'Svizzera',
      'Greece': 'Grecia',
      'Turkey': 'Turchia',
      'Russia': 'Russia',
      'Poland': 'Polonia',
      'Czech Republic': 'Repubblica Ceca',
      'Hungary': 'Ungheria',
      'Romania': 'Romania',
      'Brazil': 'Brasile',
      'Argentina': 'Argentina',
      'Uruguay': 'Uruguay',
      'Mexico': 'Messico',
      'United States': 'Stati Uniti',
      'Canada': 'Canada',
      'Japan': 'Giappone',
      'South Korea': 'Corea del Sud',
      'China': 'Cina',
      'Australia': 'Australia',
      'World': 'Mondiale',
      'European Union': 'Unione Europea'
    },
    pt: {
      'England': 'Inglaterra',
      'Spain': 'Espanha',
      'Italy': 'Itália',
      'Germany': 'Alemanha',
      'France': 'França',
      'Portugal': 'Portugal',
      'Netherlands': 'Países Baixos',
      'Belgium': 'Bélgica',
      'Austria': 'Áustria',
      'Switzerland': 'Suíça',
      'Greece': 'Grécia',
      'Turkey': 'Turquia',
      'Russia': 'Rússia',
      'Poland': 'Polônia',
      'Czech Republic': 'República Tcheca',
      'Hungary': 'Hungria',
      'Romania': 'Romênia',
      'Brazil': 'Brasil',
      'Argentina': 'Argentina',
      'Uruguay': 'Uruguai',
      'Mexico': 'México',
      'United States': 'Estados Unidos',
      'Canada': 'Canadá',
      'Japan': 'Japão',
      'South Korea': 'Coreia do Sul',
      'China': 'China',
      'Australia': 'Austrália',
      'World': 'Mundial',
      'European Union': 'União Europeia'
    }
  },

  // Leagues
  leagues: {
    en: {
      'Premier League': 'Premier League',
      'Championship': 'Championship',
      'League One': 'League One',
      'League Two': 'League Two',
      'La Liga': 'La Liga',
      'Segunda División': 'Segunda División',
      'Serie A': 'Serie A',
      'Serie B': 'Serie B',
      'Bundesliga': 'Bundesliga',
      '2. Bundesliga': '2. Bundesliga',
      'Ligue 1': 'Ligue 1',
      'Ligue 2': 'Ligue 2',
      'Primeira Liga': 'Primeira Liga',
      'Eredivisie': 'Eredivisie',
      'Primeira Divisão': 'Primeira Divisão',
      'Super Lig': 'Super Lig',
      'UEFA Champions League': 'UEFA Champions League',
      'UEFA Europa League': 'UEFA Europa League',
      'Copa del Rey': 'Copa del Rey',
      'Coppa Italia': 'Coppa Italia',
      'DFB Pokal': 'DFB Pokal',
      'FA Cup': 'FA Cup',
      'Carabao Cup': 'Carabao Cup',
      'Coupe de France': 'Coupe de France',
      'Taça da Liga': 'Taça da Liga',
      'CONMEBOL Copa América': 'CONMEBOL Copa América',
      'FIFA World Cup': 'FIFA World Cup'
    },
    it: {
      'Premier League': 'Premier League',
      'Championship': 'Championship',
      'League One': 'League One',
      'League Two': 'League Two',
      'La Liga': 'La Liga',
      'Segunda División': 'Segunda División',
      'Serie A': 'Serie A',
      'Serie B': 'Serie B',
      'Bundesliga': 'Bundesliga',
      '2. Bundesliga': '2. Bundesliga',
      'Ligue 1': 'Ligue 1',
      'Ligue 2': 'Ligue 2',
      'Primeira Liga': 'Primeira Liga',
      'Eredivisie': 'Eredivisie',
      'Primeira Divisão': 'Primeira Divisão',
      'Super Lig': 'Super Lig',
      'UEFA Champions League': 'UEFA Champions League',
      'UEFA Europa League': 'UEFA Europa League',
      'Copa del Rey': 'Copa del Rey',
      'Coppa Italia': 'Coppa Italia',
      'DFB Pokal': 'DFB Pokal',
      'FA Cup': 'FA Cup',
      'Carabao Cup': 'Carabao Cup',
      'Coupe de France': 'Coupe de France',
      'Taça da Liga': 'Taça da Liga',
      'CONMEBOL Copa América': 'CONMEBOL Copa América',
      'FIFA World Cup': 'Coppa del Mondo'
    },
    pt: {
      'Premier League': 'Premier League',
      'Championship': 'Championship',
      'League One': 'League One',
      'League Two': 'League Two',
      'La Liga': 'La Liga',
      'Segunda División': 'Segunda División',
      'Serie A': 'Serie A',
      'Serie B': 'Serie B',
      'Bundesliga': 'Bundesliga',
      '2. Bundesliga': '2. Bundesliga',
      'Ligue 1': 'Ligue 1',
      'Ligue 2': 'Ligue 2',
      'Primeira Liga': 'Primeira Liga',
      'Eredivisie': 'Eredivisie',
      'Primeira Divisão': 'Primeira Divisão',
      'Super Lig': 'Super Lig',
      'UEFA Champions League': 'UEFA Champions League',
      'UEFA Europa League': 'UEFA Europa League',
      'Copa del Rey': 'Copa del Rey',
      'Coppa Italia': 'Coppa Italia',
      'DFB Pokal': 'DFB Pokal',
      'FA Cup': 'FA Cup',
      'Carabao Cup': 'Carabao Cup',
      'Coupe de France': 'Coupe de France',
      'Taça da Liga': 'Taça da Liga',
      'CONMEBOL Copa América': 'CONMEBOL Copa América',
      'FIFA World Cup': 'Copa do Mundo da FIFA'
    }
  },

  // Teams (add major teams for quick translation, optional)
  teams: {
    en: {},
    it: {},
    pt: {}
  }
};

/**
 * Get localized value (country, league, or team name) based on current language
 * Falls back to English if translation not found
 */
export function getLocalizedValue(value, type = 'countries', lang = null){
  if(!value) return value;
  
  const language = lang || getCurrentLanguage();
  
  // Ensure type exists in localization
  if(!localization[type]){
    return value;
  }
  
  // Try to find translation in requested language
  if(localization[type][language]?.[value]){
    return localization[type][language][value];
  }
  
  // Try to find translation in English (fallback)
  if(localization[type]['en']?.[value]){
    return localization[type]['en'][value];
  }
  
  // Return original value if no translation found
  return value;
}

/**
 * Localize a country name
 */
export function getLocalizedCountry(countryName, lang = null){
  return getLocalizedValue(countryName, 'countries', lang);
}

/**
 * Localize a league name
 */
export function getLocalizedLeague(leagueName, lang = null){
  return getLocalizedValue(leagueName, 'leagues', lang);
}

/**
 * Set the language and save to localStorage
 */
export function setLanguage(lang){
  if(translations[lang]){
    localStorage.setItem('statlock_lang', lang);
    return true;
  }
  return false;
}

/**
 * Get translated text for a key in the current language
 */
export function t(key, lang = null){
  const language = lang || getCurrentLanguage();
  return translations[language]?.[key] || translations['en'][key] || key;
}

/**
 * Get all available languages
 */
export function getAvailableLanguages(){
  return Object.keys(translations);
}
