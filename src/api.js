import { AppState } from './state.js';
import { updateDashboard, updateMarkets } from './screens.js';

export async function loadMarketData() {
  try {
    // Initialize with default data
    AppState.marketData = {
      CTC: { price: 2.45, change24h: 12.5 },
      BTC: { price: 45000, change24h: -2.1 },
      ETH: { price: 3200, change24h: 5.8 },
      USDT: { price: 1.0, change24h: 0.1 }
    };
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd&include_24hr_change=true');
    if (response.ok) {
      const data = await response.json();
      if (data.bitcoin) {
        AppState.marketData.BTC = {
          price: data.bitcoin.usd,
          change24h: data.bitcoin.usd_24h_change
        };
      }
      if (data.ethereum) {
        AppState.marketData.ETH = {
          price: data.ethereum.usd,
          change24h: data.ethereum.usd_24h_change
        };
      }
      if (data.tether) {
        AppState.marketData.USDT = {
          price: data.tether.usd,
          change24h: data.tether.usd_24h_change
        };
      }
    }
  } catch (error) {
    console.error('Failed to load market data:', error);
    import('./ui.js').then(m => m.showToast('Market data update failed', 'error'));
  }
}

export function startMarketUpdates() {
  // Initial load
  loadMarketData().then(() => {
    if (AppState.currentScreen === 'dashboard-screen') {
      updateDashboard();
    } else if (AppState.currentScreen === 'markets-screen') {
      updateMarkets();
    }
  });
  // Update every 30 seconds
  setInterval(() => {
    loadMarketData().then(() => {
      if (AppState.currentScreen === 'dashboard-screen') {
        updateDashboard();
      } else if (AppState.currentScreen === 'markets-screen') {
        updateMarkets();
      }
    });
  }, 30000);
}
