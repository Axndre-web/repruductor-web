import { createHash, randomUUID } from 'node:crypto';
import { appendFile, mkdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const proofFile = path.join(root, 'data', 'onchain-task-proofs.jsonl');
const envTrue = name => String(process.env[name] || '').trim().toLowerCase() === 'true';
const envValue = name => String(process.env[name] || '').trim();
const SOLANA_SYSTEM_PROGRAM = '11111111111111111111111111111111';
const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

async function rpc(method, params = []) {
  const endpoint = envValue('SOLANA_RPC_ENDPOINT');
  if (!endpoint) throw new Error('SOLANA_RPC_ENDPOINT_NOT_CONFIGURED');
  const url = new URL(endpoint);
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('SOLANA_RPC_PROTOCOL_INVALID');
  if (url.protocol === 'http:' && !['localhost', '127.0.0.1', '::1'].includes(url.hostname)) throw new Error('SOLANA_RPC_REQUIRES_HTTPS');
  const response = await fetch(url, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: randomUUID(), method, params }),
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error(`SOLANA_RPC_HTTP_${response.status}`);
  const body = await response.json();
  if (body.error) throw new Error(`SOLANA_RPC_${String(body.error.code || 'ERROR')}`);
  return body.result;
}

function publicWallet() {
  const address = envValue('SOLANA_WALLET_ADDRESS');
  return address || null;
}

async function getSplBalances(address, commitment) {
  const [{ PublicKey }, spl] = await Promise.all([import('@solana/web3.js'), import('@solana/spl-token')]);
  const owner = new PublicKey(address);
  const programs = [spl.TOKEN_PROGRAM_ID, spl.TOKEN_2022_PROGRAM_ID].filter(Boolean);
  const results = await Promise.all(programs.map(async programId => {
    const result = await rpc('getTokenAccountsByOwner', [owner.toBase58(), { programId: programId.toBase58() }, { encoding: 'jsonParsed', commitment }]);
    return (result?.value || []).map(item => {
      const info = item?.account?.data?.parsed?.info;
      const amount = info?.tokenAmount || {};
      return {
        tokenAccount: item.pubkey,
        mint: info?.mint || null,
        amountRaw: amount.amount ?? '0',
        amount: amount.uiAmountString ?? (amount.uiAmount == null ? null : String(amount.uiAmount)),
        decimals: Number.isInteger(amount.decimals) ? amount.decimals : null,
        program: programId.toBase58()
      };
    });
  }));
  return results.flat();
}

export async function getSolanaStatus() {
  const address = publicWallet();
  const configured = Boolean(envValue('SOLANA_RPC_ENDPOINT') && address);
  if (!configured) return {
    ok: true, network: envValue('SOLANA_NETWORK') || 'unconfigured', configured: false,
    rpcReachable: false, walletConfigured: Boolean(address), walletAddress: address,
    signingEnabled: envTrue('NEON_ALLOW_SIGNING'), writesEnabled: envTrue('NEON_CHAIN_WRITE_ENABLED'),
    mintingEnabled: envTrue('NEON_ALLOW_MINTING'), tokenMintConfigured: Boolean(envValue('NXC_MINT_ADDRESS')),
    note: 'Configura RPC y dirección pública. No se infiere conectividad ni saldo.'
  };
  try {
    const [version, slot, balance, splTokenAccounts] = await Promise.all([
      rpc('getVersion'), rpc('getSlot', [{ commitment: envValue('SOLANA_COMMITMENT') || 'confirmed' }]),
      rpc('getBalance', [address, { commitment: envValue('SOLANA_COMMITMENT') || 'confirmed' }]),
      getSplBalances(address, envValue('SOLANA_COMMITMENT') || 'confirmed')
    ]);
    return {
      ok: true, network: envValue('SOLANA_NETWORK') || 'custom-rpc', configured: true,
      rpcReachable: true, walletConfigured: true, walletAddress: address,
      rpcVersion: version?.['solana-core'] || null, slot,
      balanceLamports: Number(balance?.value ?? 0), balanceSol: Number(balance?.value ?? 0) / 1e9,
      splTokenAccounts, splTokenAccountCount: splTokenAccounts.length,
      signingEnabled: envTrue('NEON_ALLOW_SIGNING'), writesEnabled: envTrue('NEON_CHAIN_WRITE_ENABLED'),
      mintingEnabled: envTrue('NEON_ALLOW_MINTING'), tokenMintConfigured: Boolean(envValue('NXC_MINT_ADDRESS')),
      note: 'Saldo y slot consultados al RPC; la disponibilidad del RPC no verifica titularidad ni liquidez de NXC.'
    };
  } catch (error) {
    return {
      ok: false, network: envValue('SOLANA_NETWORK') || 'custom-rpc', configured: true,
      rpcReachable: false, walletConfigured: true, walletAddress: address,
      error: String(error?.message || 'SOLANA_RPC_UNAVAILABLE'),
      signingEnabled: envTrue('NEON_ALLOW_SIGNING'), writesEnabled: envTrue('NEON_CHAIN_WRITE_ENABLED'),
      mintingEnabled: envTrue('NEON_ALLOW_MINTING'), tokenMintConfigured: Boolean(envValue('NXC_MINT_ADDRESS'))
    };
  }
}

export async function recordTaskProof(input = {}) {
  const taskId = String(input.taskId || '').trim().slice(0, 160);
  const result = input.result;
  if (!taskId || result === undefined) throw new Error('TASK_ID_AND_RESULT_REQUIRED');
  const serialized = JSON.stringify({ taskId, result, timestamp: new Date().toISOString() });
  const proofHash = createHash('sha256').update(serialized).digest('hex');
  const record = { schema: 'neon-proof/v1', taskId, proofHash, createdAt: new Date().toISOString(), source: 'server-observed-task-result' };
  await mkdir(path.dirname(proofFile), { recursive: true });
  await appendFile(proofFile, JSON.stringify(record) + '\n', { mode: 0o600 });
  if (envTrue('NEON_AUTO_ANCHOR_TASK_PROOFS')) {
    try {
      const anchored = await anchorTaskProof(proofHash);
      return { ...record, persistence: 'local_append_only_log', ...anchored, note: 'Prueba registrada localmente y anclada en Solana; el hash no demuestra por sí solo la utilidad del trabajo.' };
    } catch (error) {
      return { ...record, persistence: 'local_append_only_log', onChain: false, anchoringError: String(error?.message || 'ANCHOR_FAILED'), note: 'La prueba local se guardó, pero el anclaje en cadena no se completó.' };
    }
  }
  return { ...record, persistence: 'local_append_only_log', onChain: false, note: 'Hash real del resultado recibido; no prueba por sí solo que el trabajo sea útil ni que un tercero lo haya validado.' };
}

export async function listTaskProofs(limit = 50) {
  try {
    const source = await readFile(proofFile, 'utf8');
    return source.split(/\r?\n/).filter(Boolean).slice(-Math.max(1, Math.min(200, limit))).map(line => JSON.parse(line));
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function loadWallet() {
  if (!envTrue('NEON_ALLOW_SIGNING')) throw new Error('SIGNING_DISABLED');
  if (!envTrue('NEON_CHAIN_WRITE_ENABLED')) throw new Error('CHAIN_WRITES_DISABLED');
  const [{ Keypair, PublicKey, Transaction, TransactionInstruction, SystemProgram, sendAndConfirmTransaction }] = await Promise.all([
    import('@solana/web3.js')
  ]);
  const raw = envValue('SOLANA_SECRET_KEY');
  const keypairPath = envValue('SOLANA_KEYPAIR_PATH');
  let secret;
  if (raw && keypairPath) throw new Error('CONFIGURE_ONLY_ONE_SIGNING_KEY_SOURCE');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.some(n => !Number.isInteger(n) || n < 0 || n > 255)) throw new Error('invalid byte array');
      secret = Uint8Array.from(parsed);
    } catch { throw new Error('SOLANA_SECRET_KEY_MUST_BE_JSON_BYTE_ARRAY'); }
  } else if (keypairPath) {
    const resolved = path.resolve(root, keypairPath);
    const publicDir = path.resolve(root, 'public') + path.sep;
    if (resolved.startsWith(publicDir)) throw new Error('KEYPAIR_PATH_MUST_NOT_BE_PUBLIC');
    const info = await stat(resolved);
    if (!info.isFile()) throw new Error('KEYPAIR_PATH_NOT_A_FILE');
    let parsed;
    try { parsed = JSON.parse(await readFile(resolved, 'utf8')); } catch { throw new Error('KEYPAIR_FILE_MUST_BE_JSON_BYTE_ARRAY'); }
    if (!Array.isArray(parsed) || parsed.some(n => !Number.isInteger(n) || n < 0 || n > 255)) throw new Error('KEYPAIR_FILE_MUST_BE_JSON_BYTE_ARRAY');
    secret = Uint8Array.from(parsed);
  } else {
    // Legacy material is intentionally not repaired by guessing malformed bytes.
    const legacy = await import('../keypair.js');
    if (!legacy.SECRET_KEY_BYTES) throw new Error('LEGACY_KEYPAIR_MALFORMED_CONFIGURE_SOLANA_SECRET_KEY_OR_KEYPAIR_PATH');
    secret = Uint8Array.from(legacy.SECRET_KEY_BYTES);
  }
  if (![32, 64].includes(secret.length)) throw new Error('SOLANA_SECRET_KEY_LENGTH_INVALID');
  let keypair;
  try { keypair = secret.length === 64 ? Keypair.fromSecretKey(secret) : Keypair.fromSeed(secret); }
  catch { throw new Error('SOLANA_SECRET_KEY_INVALID'); }
  const configuredAddress = publicWallet();
  if (!configuredAddress || keypair.publicKey.toBase58() !== configuredAddress) throw new Error('SIGNER_PUBLIC_KEY_MISMATCH');
  return { Keypair, PublicKey, Transaction, TransactionInstruction, SystemProgram, sendAndConfirmTransaction, keypair };
}

async function assertSolFeeReserve(connection, publicKey, extraCostLamports = 10000) {
  const reserveSol = Number(envValue('NEON_MIN_SOL_RESERVE') || '0.01');
  if (!Number.isFinite(reserveSol) || reserveSol < 0) throw new Error('NEON_MIN_SOL_RESERVE_INVALID');
  const balance = await connection.getBalance(publicKey, envValue('SOLANA_COMMITMENT') || 'confirmed');
  const reserveLamports = Math.ceil(reserveSol * 1e9);
  const minimumLamports = reserveLamports + Math.max(0, Math.ceil(extraCostLamports));
  if (balance < minimumLamports) throw new Error('INSUFFICIENT_SOL_FEE_RESERVE');
  return { balanceLamports: balance, reserveLamports, estimatedCostLamports: Math.max(0, Math.ceil(extraCostLamports)) };
}

export async function anchorTaskProof(proofHash) {
  if (!/^[a-f0-9]{64}$/i.test(String(proofHash || ''))) throw new Error('PROOF_HASH_MUST_BE_SHA256');
  if (!envTrue('NEON_ALLOW_PROOF_ANCHORING')) throw new Error('PROOF_ANCHORING_DISABLED');
  const sdk = await loadWallet();
  const endpoint = envValue('SOLANA_RPC_ENDPOINT');
  const { Connection } = await import('@solana/web3.js');
  const connection = new Connection(endpoint, envValue('SOLANA_COMMITMENT') || 'confirmed');
  await assertSolFeeReserve(connection, sdk.keypair.publicKey);
  const memo = Buffer.from(`NEON_PROOF_V1:${proofHash}`);
  const transaction = new sdk.Transaction().add(new sdk.TransactionInstruction({
    keys: [{ pubkey: sdk.keypair.publicKey, isSigner: true, isWritable: false }],
    programId: new sdk.PublicKey(MEMO_PROGRAM_ID), data: memo
  }));
  const signature = await sdk.sendAndConfirmTransaction(connection, transaction, [sdk.keypair], { commitment: envValue('SOLANA_COMMITMENT') || 'confirmed' });
  return { onChain: true, signature, explorerUrl: `https://explorer.solana.com/tx/${signature}${envValue('SOLANA_NETWORK') === 'mainnet-beta' ? '' : '?cluster=' + encodeURIComponent(envValue('SOLANA_NETWORK') || 'devnet')}` };
}

export async function mintNxc(input = {}) {
  if (!envTrue('NEON_ALLOW_MINTING')) throw new Error('MINTING_DISABLED');
  const mintAddress = envValue('NXC_MINT_ADDRESS');
  if (!mintAddress) throw new Error('NXC_MINT_ADDRESS_NOT_CONFIGURED');
  const destination = String(input.destination || '').trim();
  if (!destination) throw new Error('DESTINATION_REQUIRED');
  const allowlist = envValue('NEON_MINT_DESTINATION_ALLOWLIST').split(',').map(x => x.trim()).filter(Boolean);
  if (!allowlist.includes(destination)) throw new Error('DESTINATION_NOT_ALLOWLISTED');
  const amount = Number(input.amount);
  const maxAmount = Number(envValue('NEON_MINT_MAX_PER_TX') || '0');
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(amount) || maxAmount <= 0 || amount > maxAmount) throw new Error('MINT_AMOUNT_OUT_OF_POLICY');
  const sdk = await loadWallet();
  const spl = await import('@solana/spl-token');
  const { Connection } = await import('@solana/web3.js');
  const connection = new Connection(envValue('SOLANA_RPC_ENDPOINT'), envValue('SOLANA_COMMITMENT') || 'confirmed');
  // Conservative allowance for transaction fees plus a possible new associated token account rent.
  await assertSolFeeReserve(connection, sdk.keypair.publicKey, 3_000_000);
  const mint = new sdk.PublicKey(mintAddress);
  const recipient = new sdk.PublicKey(destination);
  const mintInfo = await spl.getMint(connection, mint, envValue('SOLANA_COMMITMENT') || 'confirmed');
  if (!mintInfo.mintAuthority || !mintInfo.mintAuthority.equals(sdk.keypair.publicKey)) throw new Error('SIGNER_IS_NOT_MINT_AUTHORITY');
  const ata = await spl.getOrCreateAssociatedTokenAccount(connection, sdk.keypair, mint, recipient);
  const baseUnits = BigInt(amount) * (10n ** BigInt(mintInfo.decimals));
  const signature = await spl.mintTo(connection, sdk.keypair, mint, ata.address, sdk.keypair, baseUnits);
  return { ok: true, mint: mint.toBase58(), destination: recipient.toBase58(), amount, decimals: mintInfo.decimals, signature, explorerUrl: `https://explorer.solana.com/tx/${signature}${envValue('SOLANA_NETWORK') === 'mainnet-beta' ? '' : '?cluster=' + encodeURIComponent(envValue('SOLANA_NETWORK') || 'devnet')}` };
}

export const solanaIntegrationConstants = Object.freeze({ systemProgram: SOLANA_SYSTEM_PROGRAM, memoProgram: MEMO_PROGRAM_ID });
