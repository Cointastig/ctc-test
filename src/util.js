export function formatTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function getDefaultPrice(symbol) {
  const prices = {
    CTC: 2.45,
    BTC: 45000,
    ETH: 3200,
    USDT: 1.0,
    BNB: 320,
    SOL: 100
  };
  return prices[symbol] || 1;
}
