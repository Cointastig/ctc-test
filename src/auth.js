import { AppState } from './state.js';
import { showScreen } from './router.js';
import { showToast } from './ui.js';

export function updatePinDisplay() {
  for (let i = 1; i <= 6; i++) {
    const dot = document.getElementById(`pin-${i}`);
    if (!dot) continue;
    if (i <= AppState.pin.length) {
      dot.classList.add('filled');
    } else {
      dot.classList.remove('filled');
    }
  }
}

export function updateAuthPinDisplay() {
  for (let i = 1; i <= 6; i++) {
    const dot = document.getElementById(`auth-pin-${i}`);
    if (!dot) continue;
    if (i <= AppState.authPin.length) {
      dot.classList.add('filled');
    } else {
      dot.classList.remove('filled');
    }
  }
}

export async function addPin(digit) {
  if (AppState.pin.length < 6) {
    AppState.pin += digit;
    updatePinDisplay();
    if (AppState.pin.length === 6) {
      // Small delay for UX
      setTimeout(async () => {
        try {
          if (AppState.importedPhrase) {
            // Complete import using provided recovery phrase
            const { createWalletFromMnemonic } = await import('./wallet.js');
            await createWalletFromMnemonic(AppState.pin, AppState.importedPhrase);
            AppState.importedPhrase = null;
            showToast('Wallet imported successfully!', 'success');
            showScreen('dashboard-screen');
            (await import('./api.js')).startMarketUpdates();
          } else if (AppState.importedKey) {
            const { createWalletFromKey } = await import('./wallet.js');
            await createWalletFromKey(AppState.pin, AppState.importedKey);
            AppState.importedKey = null;
            showToast('Wallet imported successfully!', 'success');
            showScreen('dashboard-screen');
            (await import('./api.js')).startMarketUpdates();
          } else {
            const { generateNewWallet } = await import('./wallet.js');
            const mnemonic = await generateNewWallet(AppState.pin);
            // Populate the recovery phrase screen with the generated words
            const seedGrid = document.getElementById('seed-grid');
            if (seedGrid) {
              seedGrid.innerHTML = '';
              mnemonic.split(' ').forEach((word, index) => {
                const seedWord = document.createElement('div');
                seedWord.className = 'seed-word';
                seedWord.innerHTML = `
                  <div class="seed-number">${index + 1}</div>
                  <div class="seed-text">${word}</div>
                `;
                seedGrid.appendChild(seedWord);
              });
            }
            showScreen('seed-phrase-screen');
          }
        } catch (e) {
          showToast('Error creating wallet', 'error');
          console.error(e);
        }
        AppState.pin = '';
      }, 300);
    }
  }
}

export function deletePin() {
  if (AppState.pin.length > 0) {
    AppState.pin = AppState.pin.slice(0, -1);
    updatePinDisplay();
  }
}

export function clearPin() {
  AppState.pin = '';
  updatePinDisplay();
}

export function addAuthPin(digit) {
  if (AppState.authPin.length < 6) {
    AppState.authPin += digit;
    updateAuthPinDisplay();
    if (AppState.authPin.length === 6) {
      authenticatePin();
    }
  }
}

export function deleteAuthPin() {
  if (AppState.authPin.length > 0) {
    AppState.authPin = AppState.authPin.slice(0, -1);
    updateAuthPinDisplay();
  }
}

function authenticatePin() {
  if (AppState.walletData && AppState.walletData.pin === AppState.authPin) {
    AppState.authPin = '';
    updateAuthPinDisplay();
    showScreen('dashboard-screen');
    showToast('Welcome back!', 'success');
    (async () => {
      (await import('./api.js')).startMarketUpdates();
    })();
  } else {
    showToast('Incorrect PIN', 'error');
    AppState.authPin = '';
    updateAuthPinDisplay();
    if ('vibrate' in navigator) {
      navigator.vibrate(200);
    }
  }
}

export function authenticateBiometric() {
  if (!AppState.walletData || !AppState.walletData.settings.biometric) {
    showToast('Biometric authentication is disabled', 'info');
    return;
  }
  try {
    showToast('Authenticating...', 'info');
    setTimeout(() => {
      showScreen('dashboard-screen');
      showToast('Authentication successful', 'success');
      import('./api.js').then(m => m.startMarketUpdates());
    }, 1000);
  } catch (error) {
    showToast('Authentication failed', 'error');
  }
}

export function forgotPin() {
  if (confirm('This will reset your wallet. You will need your recovery phrase to restore it. Continue?')) {
    localStorage.removeItem('ctc_wallet');
    AppState.walletData = null;
    showScreen('welcome-screen');
    showToast('Wallet reset successfully', 'info');
  }
}
