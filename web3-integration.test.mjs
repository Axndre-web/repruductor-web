import test from 'node:test';
import assert from 'node:assert/strict';
import { getSolanaStatus, recordTaskProof, anchorTaskProof, mintNxc } from '../integrations/solana-web3.js';

test('Solana status does not claim connectivity when RPC is not configured', async () => {
  const previous = process.env.SOLANA_RPC_ENDPOINT;
  const previousWallet = process.env.SOLANA_WALLET_ADDRESS;
  delete process.env.SOLANA_RPC_ENDPOINT;
  delete process.env.SOLANA_WALLET_ADDRESS;
  try {
    const status = await getSolanaStatus();
    assert.equal(status.configured, false);
    assert.equal(status.rpcReachable, false);
  } finally {
    if (previous === undefined) delete process.env.SOLANA_RPC_ENDPOINT; else process.env.SOLANA_RPC_ENDPOINT = previous;
    if (previousWallet === undefined) delete process.env.SOLANA_WALLET_ADDRESS; else process.env.SOLANA_WALLET_ADDRESS = previousWallet;
  }
});

test('task proof rejects missing task/result and produces a SHA-256 receipt', async () => {
  await assert.rejects(() => recordTaskProof({ taskId: '', result: {} }), /TASK_ID_AND_RESULT_REQUIRED/);
  const proof = await recordTaskProof({ taskId: `test-${Date.now()}`, result: { outcome: 'verified-by-test' } });
  assert.match(proof.proofHash, /^[a-f0-9]{64}$/);
  assert.equal(proof.onChain, false);
  assert.equal(proof.persistence, 'local_append_only_log');
});

test('on-chain writes fail closed unless explicitly enabled', async () => {
  const oldAnchor = process.env.NEON_ALLOW_PROOF_ANCHORING;
  const oldMint = process.env.NEON_ALLOW_MINTING;
  process.env.NEON_ALLOW_PROOF_ANCHORING = 'false';
  process.env.NEON_ALLOW_MINTING = 'false';
  try {
    await assert.rejects(() => anchorTaskProof('a'.repeat(64)), /PROOF_ANCHORING_DISABLED/);
    await assert.rejects(() => mintNxc({ destination: '11111111111111111111111111111111', amount: 1 }), /MINTING_DISABLED/);
  } finally {
    if (oldAnchor === undefined) delete process.env.NEON_ALLOW_PROOF_ANCHORING; else process.env.NEON_ALLOW_PROOF_ANCHORING = oldAnchor;
    if (oldMint === undefined) delete process.env.NEON_ALLOW_MINTING; else process.env.NEON_ALLOW_MINTING = oldMint;
  }
});
