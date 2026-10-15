#!/usr/bin/env bash
set -euo pipefail

# Explicit opt-in only. This script does not download or install a miner.
: "${NEON_MINING_WALLET_ADDRESS:?Set a public ETC wallet address in the environment first}"
: "${NEON_MINER_BIN:?Set NEON_MINER_BIN to an already-installed, trusted lolMiner executable}"
NEON_MINING_WORKER="${NEON_MINING_WORKER:-neon-orb}"

if [[ ! "$NEON_MINING_WALLET_ADDRESS" =~ ^0x[a-fA-F0-9]{40}$ && ! "$NEON_MINING_WALLET_ADDRESS" =~ ^bc1[a-z0-9]{20,90}$ && ! "$NEON_MINING_WALLET_ADDRESS" =~ ^[13][a-km-zA-HJ-NP-Z1-9]{25,35}$ ]]; then
  echo "ERROR: set a valid public ETC address (0x + 40 hex chars) or a BTC address for 2Miners BTC payouts." >&2
  exit 2
fi
if [[ ! -x "$NEON_MINER_BIN" ]]; then
  echo "ERROR: NEON_MINER_BIN must point to an existing executable you trust. No miner is bundled." >&2
  exit 2
fi
if [[ ! "$NEON_MINING_WORKER" =~ ^[A-Za-z0-9._-]{1,32}$ ]]; then
  echo "ERROR: invalid worker name." >&2
  exit 2
fi

echo "Starting explicit ETC mining session against 2Miners."
echo "Pool: stratum+tcp://etc.2miners.com:1010"
echo "Payout identity: ${NEON_MINING_WALLET_ADDRESS:0:7}… (ETC payout if 0x address; BTC payout if BTC address)"
echo "Worker: ${NEON_MINING_WORKER}"
echo "Stop with Ctrl+C. Monitor power use, temperatures, pool shares, and net profitability."
exec "$NEON_MINER_BIN" --algo ETCHASH --pool stratum+tcp://etc.2miners.com:1010 --user "${NEON_MINING_WALLET_ADDRESS}.${NEON_MINING_WORKER}"
