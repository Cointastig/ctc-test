import { AppState } from './state.js';

export function showToast(message, type = 'success') {
  const toastEl = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');
  const toastIconEl = document.querySelector('.toast-icon');
  if (!toastEl || !toastMsg || !toastIconEl) return;
  toastMsg.textContent = message;
  const icons = {
    success: '<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>',
    error: '<path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>',
    info: '<path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>'
  };
  toastIconEl.innerHTML = icons[type] || icons.info;
  toastEl.classList.add('show');
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3000);
}

export function copyToClipboard(text, successMessage) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMessage, 'success');
    }).catch(err => {
      console.error('Clipboard copy failed:', err);
      showToast('Copy failed', 'error');
    });
  }
}

export function openExternal(url) {
  window.open(url, '_blank');
}
