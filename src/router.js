import { AppState } from './state.js';
import { updateDashboard, updateMarkets, updateExplore, updateSettings, loadStakingData } from './screens.js';

export function showScreen(screenId) {
  const currentEl = document.getElementById(AppState.currentScreen);
  const newEl = document.getElementById(screenId);
  if (!newEl) {
    // If screen not found (feature not implemented), show info message
    if (screenId === 'change-pin-screen' || screenId === 'currency-screen' || screenId === 'search-screen') {
      import('./ui.js').then(module => module.showToast('Feature coming soon', 'info'));
    }
    return;
  }
  if (currentEl) {
    currentEl.classList.remove('active');
  }
  newEl.classList.add('active');
  AppState.currentScreen = screenId;
  // Handle bottom navigation visibility
  const bottomNav = document.getElementById('bottom-nav');
  const mainScreens = ['dashboard-screen', 'markets-screen', 'explore-screen', 'settings-screen'];
  if (mainScreens.includes(screenId)) {
    bottomNav.classList.add('visible');
    updateActiveTab(screenId);
  } else {
    bottomNav.classList.remove('visible');
  }
  // Load screen-specific data
  loadScreenData(screenId);
}

function loadScreenData(screenId) {
  switch (screenId) {
    case 'dashboard-screen':
      updateDashboard();
      break;
    case 'markets-screen':
      updateMarkets();
      break;
    case 'explore-screen':
      updateExplore();
      break;
    case 'settings-screen':
      updateSettings();
      break;
    case 'send-screen':
      import('./screens.js').then(m => m.initializeSendScreen());
      break;
    case 'receive-screen':
      import('./screens.js').then(m => m.generateQRCode());
      break;
    case 'swap-screen':
      import('./screens.js').then(m => m.initializeSwapScreen());
      break;
    case 'staking-screen':
      loadStakingData();
      break;
    case 'backup-phrase-screen':
      // Decrypt and show backup phrase when viewing backup
      import('./wallet.js').then(m => m.displayBackupPhrase());
      break;
  }
}

export function switchTab(tab) {
  const screenMap = {
    'dashboard': 'dashboard-screen',
    'markets': 'markets-screen',
    'explore': 'explore-screen',
    'settings': 'settings-screen'
  };
  const targetScreen = screenMap[tab];
  if (targetScreen) {
    showScreen(targetScreen);
  }
}

function updateActiveTab(screenId) {
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  navItems.forEach(item => item.classList.remove('active'));
  const tabMap = {
    'dashboard-screen': 0,
    'markets-screen': 1,
    'explore-screen': 2,
    'settings-screen': 3
  };
  const idx = tabMap[screenId];
  if (idx !== undefined) {
    navItems[idx].classList.add('active');
  }
}
