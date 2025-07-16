import { AppState } from './state.js';
import * as bip39 from 'bip39';

async function deriveEncryptionKey(pin, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw', enc.encode(pin), { name: 'PBKDF2' }, false, ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptSecret(secret, pin) {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveEncryptionKey(pin, salt);
  const ciphertext = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, enc.encode(secret));
  // Combine salt, iv, and ciphertext into one base64 string
  const combined = new Uint8Array(salt.byteLength + iv.byteLength + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.byteLength);
  combined.set(new Uint8Array(ciphertext), salt.byteLength + iv.byteLength);
  return btoa(String.fromCharCode(...combined));
}

async function decryptSecret(encryptedData, pin) {
  try {
    const data = atob(encryptedData);
    const bytes = Uint8Array.from(data, c => c.charCodeAt(0));
    const salt = bytes.slice(0, 16);
    const iv = bytes.slice(16, 28);
    const ciphertext = bytes.slice(28);
    const key = await deriveEncryptionKey(pin, salt);
    const plaintextArrayBuffer = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, ciphertext);
    const dec = new TextDecoder();
    return dec.decode(plaintextArrayBuffer);
  } catch (e) {
    console.error('Decryption failed:', e);
    return null;
  }
}

export function generateAddress() {
  const chars = '0123456789abcdef';
  let address = 'ctc1q';
  for (let i = 0; i < 38; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

export async function createWalletFromMnemonic(pin, mnemonic) {
  const address = generateAddress();
  const wallet = {
    pin: pin,
    address: address,
    balance: '0.00',
    tokens: {
      CTC: { balance: '0.00', value: 0 },
      BTC: { balance: '0.0', value: 0 },
      ETH: { balance: '0.0', value: 0 },
      USDT: { balance: '0.00', value: 0 }
    },
    transactions: [],
    settings: {
      currency: 'USD',
      biometric: false,
      notifications: true,
      theme: AppState.theme || 'light',
      language: 'en'
    },
    createdAt: Date.now(),
    lastAccess: Date.now(),
    secretType: 'mnemonic'
  };
  try {
    const encrypted = await encryptSecret(mnemonic, pin);
    wallet.encryptedSecret = encrypted;
    localStorage.setItem('ctc_wallet', JSON.stringify(wallet));
    AppState.walletData = wallet;
    return wallet;
  } catch (error) {
    console.error('Wallet creation failed:', error);
    throw error;
  }
}

export async function createWalletFromKey(pin, privateKey) {
  const address = generateAddress();
  const wallet = {
    pin: pin,
    address: address,
    balance: '0.00',
    tokens: {
      CTC: { balance: '0.00', value: 0 }
      // Additional tokens can be added if needed
    },
    transactions: [],
    settings: {
      currency: 'USD',
      biometric: false,
      notifications: true,
      theme: AppState.theme || 'light',
      language: 'en'
    },
    createdAt: Date.now(),
    lastAccess: Date.now(),
    secretType: 'privateKey'
  };
  try {
    const encrypted = await encryptSecret(privateKey, pin);
    wallet.encryptedSecret = encrypted;
    localStorage.setItem('ctc_wallet', JSON.stringify(wallet));
    AppState.walletData = wallet;
    return wallet;
  } catch (error) {
    console.error('Wallet creation failed:', error);
    throw error;
  }
}

export async function generateNewWallet(pin) {
  // Generate a secure 12-word mnemonic
  const mnemonic = bip39.generateMnemonic();
  await createWalletFromMnemonic(pin, mnemonic);
  return mnemonic;
}

export async function displayBackupPhrase() {
  if (!AppState.walletData) return;
  const seedGrid = document.getElementById('seed-grid');
  if (!seedGrid) return;
  try {
    const encrypted = AppState.walletData.encryptedSecret;
    const pin = AppState.walletData.pin;
    const secret = await decryptSecret(encrypted, pin);
    if (!secret) {
      import('./ui.js').then(m => m.showToast('Unable to decrypt backup', 'error'));
      return;
    }
    // Display the secret (mnemonic or key) in the seed grid
    seedGrid.innerHTML = '';
    if (AppState.walletData.secretType === 'mnemonic') {
      const words = secret.split(' ');
      words.forEach((word, index) => {
        const div = document.createElement('div');
        div.className = 'seed-word';
        div.innerHTML = `
          <div class="seed-number">${index + 1}</div>
          <div class="seed-text">${word}</div>
        `;
        seedGrid.appendChild(div);
      });
    } else {
      // If imported by private key, show the key itself
      const div = document.createElement('div');
      div.className = 'seed-word';
      div.innerHTML = `<div class="seed-text">${secret}</div>`;
      seedGrid.appendChild(div);
    }
  } catch (error) {
    console.error('Error displaying backup:', error);
    import('./ui.js').then(m => m.showToast('Error displaying backup', 'error'));
  }
}
