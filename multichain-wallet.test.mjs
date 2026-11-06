import test from 'node:test';
import assert from 'node:assert/strict';
import { getMultichainWalletSnapshot } from '../server/multichain-wallet.js';

test('multichain snapshot rejects invalid EVM public address before making network calls', async () => {
  await assert.rejects(() => getMultichainWalletSnapshot({ evmAddress: 'not-an-address' }), /EVM_ADDRESS_INVALID/);
});

test('multichain snapshot rejects invalid Solana public address before making network calls', async () => {
  await assert.rejects(() => getMultichainWalletSnapshot({ solanaAddress: 'not-a-solana-address' }), /SOLANA_ADDRESS_INVALID/);
});

test('multichain snapshot rejects invalid Bitcoin public address before making network calls', async () => {
  await assert.rejects(() => getMultichainWalletSnapshot({ bitcoinAddress: 'not-a-bitcoin-address' }), /BITCOIN_ADDRESS_INVALID/);
});
