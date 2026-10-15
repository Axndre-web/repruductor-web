# Neon Orb — pool telemetry and real mining setup

## What V6 does
- Reads public pool statistics from the 2Miners API.
- If `NEON_MINING_WALLET_ADDRESS` is configured, reads account telemetry for that specific coin.
- Shows live spot prices from Coinbase's public spot-price endpoint.
- Reads the configured public SOL wallet balance from Solana JSON-RPC and BTC address balance from mempool.space when those addresses are configured.
- Never signs transactions, claims estimated earnings as paid, or starts a miner automatically.

## Current pool
The default is 2Miners Ethereum Classic (ETC):
- Pool: `stratum+tcp://etc.2miners.com:1010`
- API: `https://etc.2miners.com/api`
- Coin: ETC; algorithm: ETCHash.
- The pool's published fee/minimum payout can change; check its official page before mining.

Official pool details: https://2miners.com/etc-mining-pool
API docs: https://apidoc.2miners.com/
BTC payout setup: https://etc.2miners.com/help

## To submit real shares
A compatible miner and compatible hardware must run on a machine you own or are authorized to use. A pool API cannot generate shares by itself. 2Miners documents BTC payouts for ETC mining; the existing public BTC address in the project is configured as the account/payout identity. Alternatively, use your own ETC wallet address. Set:
`NEON_MINING_POOL=etc`
`NEON_MINING_WALLET_ADDRESS=<public BTC address for BTC payout, or public ETC address>`

Then configure a compatible ETCHash miner using the pool's current official setup guide. Do not use a Solana address for ETC. Keep the miner outside the web server process so it can be monitored and stopped independently. This project intentionally does not download or launch third-party mining binaries automatically.

The API may report current hashrate, workers, pool balance, and paid totals. For ETC pool mining, 2Miners documents BTC payouts when the miner username is a BTC address. Accepted/rejected share counters are shown only if the upstream pool API exposes them; otherwise the dashboard displays that they are unavailable. A pool's `paid` field is pool-reported telemetry, not by itself an on-chain proof of a particular transaction. Verify payouts by transaction hash/address before recording realized revenue.

## Economics
A free-to-connect pool is not free compute and does not guarantee profit. Mining requires suitable hardware, power, and may be unprofitable after electricity, pool fees, hardware depreciation, and payout thresholds. SOL is proof-of-stake, not a proof-of-work mining coin; SOL rewards require staking/delegation, which is a different on-chain action and must be explicitly authorized.

## APIs exposed by Neon Player X
- `GET /api/neon-orb/mining/pools`
- `GET /api/neon-orb/mining/status?pool=etc`
- `GET /api/neon-orb/market-data?assets=BTC,ETH,SOL,USDC&fiats=USD,EUR`
- `GET /api/neon-orb/mining/payout/<txid>/verify` — verifies a confirmed BTC transaction output to the configured public payout address.
- `GET /api/neon-orb/wallet/observed`

All endpoints are read-only. Market spot prices are indicative, not executable swap quotes. Existing conversion/execution endpoints remain governed by their authorization policy and require a real provider plus verified settlement evidence.
