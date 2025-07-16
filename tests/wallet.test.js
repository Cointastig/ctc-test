import { generateAddress } from '../src/wallet.js';

test('generateAddress returns a valid CTC address', () => {
  const addr = generateAddress();
  expect(addr.startsWith('ctc1q')).toBe(true);
  expect(addr.length).toBe(42);
});
