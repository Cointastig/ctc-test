import { AppState } from './state.js';
import { showToast, openExternal } from './ui.js';
import { showScreen } from './router.js';

export function updateSettings() {
  const biometricToggle = document.getElementById('biometric-toggle');
  const notificationsToggle = document.getElementById('notifications-toggle');
  const themeToggle = document.getElementById('theme-toggle');
  const themeValue = document.getElementById('theme-value');
  const notificationsValue = document.getElementById('notifications-value');
  if (biometricToggle && AppState.walletData) {
    biometricToggle.classList.toggle('active', AppState.walletData.settings.biometric);
  }
  if (notificationsToggle && AppState.walletData) {
    const notiOn = AppState.walletData.settings.notifications;
    notificationsToggle.classList.toggle('active', notiOn);
    if (notificationsValue) {
      notificationsValue.textContent = notiOn ? 'Enabled' : 'Disabled';
    }
  }
  if (themeToggle) {
    const isDark = AppState.theme === 'dark';
    themeToggle.classList.toggle('active', isDark);
    if (themeValue) {
      themeValue.textContent = isDark ? 'On' : 'Off';
    }
  }
  // Hide recovery phrase option if no mnemonic (imported via private key)
  const recoveryItem = document.querySelector('[data-target="backup-phrase-screen"]');
  if (recoveryItem && AppState.walletData && AppState.walletData.secretType === 'privateKey') {
    recoveryItem.style.display = 'none';
  }
}

export function toggleBiometric() {
  if (!AppState.walletData) return;
  const toggleEl = document.getElementById('biometric-toggle');
  if (toggleEl) {
    const isActive = toggleEl.classList.toggle('active');
    AppState.walletData.settings.biometric = isActive;
    localStorage.setItem('ctc_wallet', JSON.stringify(AppState.walletData));
    showToast(isActive ? 'Biometric enabled' : 'Biometric disabled', 'success');
  }
}

export function toggleNotifications() {
  if (!AppState.walletData) return;
  const toggleEl = document.getElementById('notifications-toggle');
  if (toggleEl) {
    const isActive = toggleEl.classList.toggle('active');
    AppState.walletData.settings.notifications = isActive;
    localStorage.setItem('ctc_wallet', JSON.stringify(AppState.walletData));
    if (isActive) {
      requestNotificationPermission();
    } else {
      showToast('Notifications disabled', 'success');
    }
  }
}

async function requestNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      showToast('Notifications enabled', 'success');
    } else {
      showToast('Notification permission denied', 'error');
    }
  }
}

export function toggleTheme() {
  const toggleEl = document.getElementById('theme-toggle');
  const htmlEl = document.documentElement;
  if (toggleEl) {
    const isActive = toggleEl.classList.toggle('active');
    AppState.theme = isActive ? 'dark' : 'light';
    htmlEl.setAttribute('data-theme', AppState.theme);
    if (AppState.walletData) {
      AppState.walletData.settings.theme = AppState.theme;
      localStorage.setItem('ctc_wallet', JSON.stringify(AppState.walletData));
    }
    const themeValueEl = document.getElementById('theme-value');
    if (themeValueEl) {
      themeValueEl.textContent = isActive ? 'On' : 'Off';
    }
    showToast(isActive ? 'Dark mode enabled' : 'Dark mode disabled', 'info');
  }
}

export function editProfile() {
  showToast('Profile editing coming soon', 'info');
}

export function showSupport() {
  openExternal('https://support.ctcwallet.com');
}

export function logout() {
  if (confirm('Are you sure you want to sign out?')) {
    AppState.authPin = '';
    showScreen('auth-screen');
    showToast('Signed out successfully', 'info');
  }
}
