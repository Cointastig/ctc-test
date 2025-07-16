import { AppState } from './state.js';
import { formatTime, getDefaultPrice } from './util.js';

export function updateDashboard() {
  if (!AppState.walletData) return;
  let totalValue = 0;
  for (const [symbol, data] of Object.entries(AppState.walletData.tokens)) {
    const price = AppState.marketData[symbol]?.price || getDefaultPrice(symbol);
    totalValue += parseFloat(data.balance) * price;
  }
  const balanceEl = document.querySelector('.balance-amount');
  const changeEl = document.querySelector('.balance-change');
  if (balanceEl) {
    balanceEl.textContent = `$${totalValue.toFixed(2)}`;
  }
  if (changeEl) {
    const change = AppState.marketData.CTC?.change24h || 0;
    changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    changeEl.className = 'balance-change ' + (change >= 0 ? 'positive' : 'negative');
  }
  updateAssetList();
  updateTransactionList();
}

export function updateAssetList() {
  const assetListEl = document.getElementById('dashboard-assets');
  if (!assetListEl || !AppState.walletData) return;
  const assetsHtml = Object.entries(AppState.walletData.tokens).map(([symbol, data]) => {
    const price = AppState.marketData[symbol]?.price || getDefaultPrice(symbol);
    const value = parseFloat(data.balance) * price;
    const change = AppState.marketData[symbol]?.change24h || 0;
    return `
      <div class="asset-item">
        ${symbol === 'CTC' ? 
          '<img src="assets/logo.png" alt="CTC" class="asset-icon">' :
          `<div class="asset-icon-placeholder">${symbol}</div>`
        }
        <div class="asset-info">
          <div class="asset-name">${symbol}</div>
          <div class="asset-balance">${data.balance} ${symbol}</div>
        </div>
        <div class="asset-values">
          <div class="asset-price">$${value.toFixed(2)}</div>
          <div class="asset-change ${change >= 0 ? 'positive' : 'negative'}">
            ${change >= 0 ? '+' : ''}${change.toFixed(2)}%
          </div>
        </div>
      </div>
    `;
  }).join('');
  assetListEl.innerHTML = assetsHtml;
}

export function updateTransactionList() {
  const txListEl = document.getElementById('dashboard-transactions');
  if (!txListEl || !AppState.walletData) return;
  const txs = AppState.walletData.transactions.slice(0, 5);
  if (txs.length === 0) {
    txListEl.innerHTML = `<p style="text-align:center; color: var(--text-secondary);" data-i18n="dashboard.noTransactions">No transactions yet</p>`;
    return;
  }
  const txHtml = txs.map(tx => {
    const iconPath = tx.type === 'receive' 
      ? '<path d="M12 5v14m0 0l7-7m-7 7l-7-7"/>' 
      : '<path d="M12 19V5m0 0l-7 7m7-7l7 7"/>';
    return `
      <div class="transaction-item">
        <div class="transaction-icon ${tx.type}">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${iconPath}
          </svg>
        </div>
        <div class="transaction-info">
          <div class="transaction-type">${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</div>
          <div class="transaction-time">${formatTime(tx.timestamp)}</div>
        </div>
        <div class="transaction-amount">
          <div class="transaction-value ${tx.type === 'receive' ? 'positive' : ''}">
            ${tx.type === 'receive' ? '+' : '-'}${tx.amount} ${tx.asset || tx.fromAsset}
          </div>
        </div>
      </div>
    `;
  }).join('');
  txListEl.innerHTML = txHtml;
}

export function updateMarkets() {
  const marketListEl = document.getElementById('market-list');
  if (!marketListEl) return;
  const markets = ['CTC', 'BTC', 'ETH', 'USDT'];
  const listHtml = markets.map(sym => {
    const price = AppState.marketData[sym]?.price || getDefaultPrice(sym);
    const change = AppState.marketData[sym]?.change24h || 0;
    return `
      <div class="market-item">
        <div class="market-name">${sym}</div>
        <div class="market-price">$${price.toFixed(2)}</div>
        <div class="market-change ${change >= 0 ? 'positive' : 'negative'}">${change >= 0 ? '+' : ''}${change.toFixed(2)}%</div>
      </div>
    `;
  }).join('');
  marketListEl.innerHTML = listHtml;
}

export function updateExplore() {
  // Explore screen content is static; nothing to update dynamically
}

export function initializeSendScreen() {
  const amountInput = document.getElementById('amount');
  const recipientInput = document.getElementById('recipient');
  if (amountInput) amountInput.value = '';
  if (recipientInput) recipientInput.value = '';
  updateAmountConversion();
}

export function setAmount(percentage) {
  const balance = parseFloat(AppState.walletData?.tokens[AppState.selectedAsset]?.balance || '0') || 0;
  const amount = (balance * percentage / 100).toFixed(2);
  const amountInput = document.getElementById('amount');
  if (amountInput) {
    amountInput.value = amount;
  }
  updateAmountConversion();
}

export function selectFee(fee) {
  AppState.selectedFee = fee;
  document.querySelectorAll('.fee-option').forEach(opt => opt.classList.remove('selected'));
  const optionEl = document.querySelector(`input[name="fee"][value="${fee}"]`);
  if (optionEl) {
    optionEl.parentElement.classList.add('selected');
  }
}

export function updateAmountConversion() {
  const amountVal = parseFloat(document.getElementById('amount')?.value) || 0;
  const price = AppState.marketData[AppState.selectedAsset]?.price || getDefaultPrice(AppState.selectedAsset);
  const usdValue = (amountVal * price).toFixed(2);
  const convertedEl = document.querySelector('.amount-conversion');
  if (convertedEl) {
    convertedEl.textContent = `≈ $${usdValue} USD`;
  }
}

export function reviewTransaction() {
  const recipient = document.getElementById('recipient')?.value;
  const amount = document.getElementById('amount')?.value;
  if (!recipient || !amount || parseFloat(amount) <= 0) {
    import('./ui.js').then(m => m.showToast('Please fill all fields', 'error'));
    return;
  }
  const balance = parseFloat(AppState.walletData?.tokens[AppState.selectedAsset]?.balance || '0') || 0;
  if (parseFloat(amount) > balance) {
    import('./ui.js').then(m => m.showToast('Insufficient balance', 'error'));
    return;
  }
  AppState.transactionData = {
    recipient,
    amount,
    asset: AppState.selectedAsset,
    fee: (AppState.selectedFee && AppState.FEE_OPTIONS?.[AppState.selectedFee]?.amount) 
      ? AppState.FEE_OPTIONS[AppState.selectedFee].amount 
      : 0.01
  };
  updateConfirmScreen();
  import('./router.js').then(m => m.showScreen('confirm-screen'));
}

export function updateConfirmScreen() {
  const data = AppState.transactionData;
  if (!data) return;
  const amountEl = document.querySelector('.confirm-amount .amount-large');
  const usdEl = document.querySelector('.confirm-amount .amount-usd');
  const fromEl = document.getElementById('confirm-from');
  const toEl = document.getElementById('confirm-to');
  const amtEl = document.getElementById('confirm-amount');
  const feeEl = document.getElementById('confirm-fee');
  const totalEl = document.getElementById('confirm-total');
  if (amountEl) {
    amountEl.textContent = `${data.amount} ${data.asset}`;
  }
  if (usdEl) {
    const price = AppState.marketData[data.asset]?.price || getDefaultPrice(data.asset);
    usdEl.textContent = `≈ $${(parseFloat(data.amount) * price).toFixed(2)} USD`;
  }
  if (fromEl) fromEl.textContent = AppState.walletData?.address || '';
  if (toEl) toEl.textContent = data.recipient;
  if (amtEl) amtEl.textContent = `${data.amount} ${data.asset}`;
  if (feeEl) feeEl.textContent = `${data.fee} CTC`;
  if (totalEl) totalEl.textContent = `${(parseFloat(data.amount) + parseFloat(data.fee)).toFixed(2)} CTC`;
}

export function sendTransaction() {
  import('./ui.js').then(m => m.showToast('Sending transaction...', 'info'));
  setTimeout(() => {
    const asset = AppState.transactionData.asset;
    const currentBalance = parseFloat(AppState.walletData.tokens[asset].balance);
    AppState.walletData.tokens[asset].balance = (currentBalance - parseFloat(AppState.transactionData.amount) - AppState.transactionData.fee).toFixed(2);
    const tx = {
      id: Date.now().toString(16),
      type: 'send',
      amount: AppState.transactionData.amount,
      asset: asset,
      recipient: AppState.transactionData.recipient,
      fee: AppState.transactionData.fee,
      timestamp: Date.now(),
      status: 'pending'
    };
    AppState.walletData.transactions.unshift(tx);
    localStorage.setItem('ctc_wallet', JSON.stringify(AppState.walletData));
    import('./router.js').then(m => m.showScreen('success-screen'));
    setTimeout(() => {
      tx.status = 'confirmed';
      localStorage.setItem('ctc_wallet', JSON.stringify(AppState.walletData));
      const statusBadge = document.getElementById('success-status');
      if (statusBadge) {
        statusBadge.textContent = 'Confirmed';
        statusBadge.classList.remove('pending');
      }
    }, 3000);
  }, 2000);
}

export function generateQRCode() {
  const addressEl = document.getElementById('wallet-address');
  const qrContainer = document.getElementById('qr-code');
  if (addressEl && AppState.walletData) {
    addressEl.textContent = AppState.walletData.address;
  }
  if (qrContainer) {
    qrContainer.innerHTML = `
      <div style="width:200px;height:200px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;">
        <span style="color:#999;font-size:14px;">QR Code</span>
      </div>
    `;
  }
}

export function copyAddress() {
  if (AppState.walletData) {
    import('./ui.js').then(m => m.copyToClipboard(AppState.walletData.address, 'Address copied'));
  }
}

export function shareAddress() {
  if (!AppState.walletData) return;
  if (navigator.share) {
    navigator.share({
      title: 'My CTC Address',
      text: AppState.walletData.address
    }).catch(err => {
      if (err.name !== 'AbortError') {
        copyAddress();
      }
    });
  } else {
    copyAddress();
  }
}

export function requestAmount() {
  import('./ui.js').then(m => m.showToast('Request amount feature coming soon', 'info'));
}

export function initializeSwapScreen() {
  updateSwapRates();
}

export function switchSwapAssets() {
  const temp = AppState.swapData.from;
  AppState.swapData.from = AppState.swapData.to;
  AppState.swapData.to = temp;
  const fromInput = document.getElementById('swap-from-amount');
  const toInput = document.getElementById('swap-to-amount');
  if (fromInput) fromInput.value = '';
  if (toInput) toInput.value = '';
  updateSwapRates();
}

export function updateSwapFromAmount(amount) {
  AppState.swapData.fromAmount = amount;
  calculateSwapAmount();
}

function calculateSwapAmount() {
  const fromAmount = parseFloat(AppState.swapData.fromAmount) || 0;
  const fromPrice = AppState.marketData[AppState.swapData.from]?.price || getDefaultPrice(AppState.swapData.from);
  const toPrice = AppState.marketData[AppState.swapData.to]?.price || getDefaultPrice(AppState.swapData.to);
  const toAmount = fromAmount * (fromPrice / toPrice);
  AppState.swapData.toAmount = toAmount.toFixed(6);
  const toAmountEl = document.getElementById('swap-to-amount');
  if (toAmountEl) {
    toAmountEl.value = AppState.swapData.toAmount;
  }
}

export function updateSwapRates() {
  const fromPrice = AppState.marketData[AppState.swapData.from]?.price || getDefaultPrice(AppState.swapData.from);
  const toPrice = AppState.marketData[AppState.swapData.to]?.price || getDefaultPrice(AppState.swapData.to);
  const rate = fromPrice / toPrice;
  const rateEl = document.getElementById('swap-rate');
  if (rateEl) {
    rateEl.textContent = `1 ${AppState.swapData.from} = ${rate.toFixed(6)} ${AppState.swapData.to}`;
  }
}

export function executeSwap() {
  if (!AppState.swapData.fromAmount || parseFloat(AppState.swapData.fromAmount) <= 0) {
    import('./ui.js').then(m => m.showToast('Please enter amount', 'error'));
    return;
  }
  const fromBalance = parseFloat(AppState.walletData.tokens[AppState.swapData.from].balance);
  if (parseFloat(AppState.swapData.fromAmount) > fromBalance) {
    import('./ui.js').then(m => m.showToast('Insufficient balance', 'error'));
    return;
  }
  import('./ui.js').then(m => m.showToast('Processing swap...', 'info'));
  setTimeout(() => {
    const fromAmount = parseFloat(AppState.swapData.fromAmount);
    const toAmount = parseFloat(AppState.swapData.toAmount) || 0;
    const fee = fromAmount * 0.003;
    AppState.walletData.tokens[AppState.swapData.from].balance = (fromBalance - fromAmount - fee).toFixed(6);
    const toBalance = parseFloat(AppState.walletData.tokens[AppState.swapData.to].balance) || 0;
    AppState.walletData.tokens[AppState.swapData.to].balance = (toBalance + toAmount).toFixed(6);
    const tx = {
      id: Date.now().toString(16),
      type: 'swap',
      fromAsset: AppState.swapData.from,
      fromAmount: fromAmount.toFixed(6),
      toAsset: AppState.swapData.to,
      toAmount: toAmount.toFixed(6),
      fee: fee.toFixed(6),
      timestamp: Date.now(),
      status: 'confirmed'
    };
    AppState.walletData.transactions.unshift(tx);
    localStorage.setItem('ctc_wallet', JSON.stringify(AppState.walletData));
    updateDashboard();
    import('./ui.js').then(m => m.showToast('Swap successful', 'success'));
    import('./router.js').then(m => m.showScreen('dashboard-screen'));
  }, 2000);
}

export function loadStakingData() {
  const positionsEl = document.getElementById('staking-positions');
  if (!positionsEl) return;
  if (AppState.stakingPositions.length === 0) {
    positionsEl.innerHTML = '<p style="text-align:center; color: var(--text-secondary);">No active staking positions</p>';
  } else {
    positionsEl.innerHTML = AppState.stakingPositions.map(position => `
      <div class="staking-position">
        <!-- Staking position details -->
      </div>
    `).join('');
  }
}

export function showStakeDialog() {
  import('./ui.js').then(m => m.showToast('Staking feature coming soon', 'info'));
}
