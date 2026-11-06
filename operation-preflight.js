/**
 * Guarded EVM transaction preflight.
 * This module never signs or broadcasts transactions and never reads private keys.
 */
const DEFAULT_RPC = 'https://ethereum-rpc.publicnode.com';
const validAddress = value => /^0x[a-fA-F0-9]{40}$/.test(String(value || ''));
const validHexData = value => typeof value === 'string' && /^0x(?:[0-9a-fA-F]{2})*$/.test(value);
const toBigIntHex = value => {
  if (typeof value !== 'string' || !/^0x[0-9a-f]+$/i.test(value)) throw new Error('RPC_INVALID_HEX');
  return BigInt(value);
};
const hex = value => `0x${value.toString(16)}`;

function getRpc() {
  const raw = String(process.env.ETHEREUM_RPC_ENDPOINT || DEFAULT_RPC).trim();
  const url = new URL(raw);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(url.hostname))) {
    throw new Error('EVM_RPC_MUST_USE_HTTPS');
  }
  return url.toString();
}
async function rpc(method, params) {
  const response = await fetch(getRpc(), {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(7000),
    redirect: 'error'
  });
  if (!response.ok) throw new Error(`RPC_HTTP_${response.status}`);
  const body = await response.json();
  if (body.error || body.result == null) throw new Error(`RPC_${method.toUpperCase()}_FAILED`);
  return body.result;
}
export function operationPolicy() {
  const enabled = process.env.NEON_CHAIN_WRITES_ENABLED === 'true';
  return {
    mode: enabled ? 'GUARDED_WRITE_POLICY_ENABLED' : 'READ_ONLY',
    writePolicyEnabled: enabled,
    actualSigning: false,
    actualBroadcast: false,
    signer: 'EXTERNAL_WALLET_REQUIRED',
    approvalRequired: true,
    notes: enabled
      ? 'La política permite preparar operaciones, pero este paquete no firma ni transmite transacciones; la wallet externa debe mostrar y firmar cada operación.'
      : 'La escritura está desactivada. El preflight es de solo lectura y no mueve fondos.'
  };
}
export async function preflightEvmTransaction({ from, to, valueWei = '0', data = '0x', chainId } = {}) {
  if (!validAddress(from) || !validAddress(to)) throw new Error('INVALID_EVM_ADDRESS');
  if (!/^(0|[1-9][0-9]*)$/.test(String(valueWei))) throw new Error('INVALID_VALUE_WEI');
  if (!validHexData(data)) throw new Error('INVALID_CALLDATA');
  const expectedChain = Number(process.env.NEON_EVM_CHAIN_ID || 1);
  const actualChain = Number(toBigIntHex(await rpc('eth_chainId', [])));
  if (chainId != null && Number(chainId) !== actualChain) throw new Error('REQUEST_CHAIN_ID_MISMATCH');
  if (actualChain !== expectedChain) throw new Error('RPC_CHAIN_ID_MISMATCH');

  const tx = { from, to, value: hex(BigInt(valueWei)), data };
  const [balanceHex, gasPriceHex, gasLimitHex] = await Promise.all([
    rpc('eth_getBalance', [from, 'latest']),
    rpc('eth_gasPrice', []),
    rpc('eth_estimateGas', [tx])
  ]);
  const balance = toBigIntHex(balanceHex);
  const gasPrice = toBigIntHex(gasPriceHex);
  const estimatedGas = toBigIntHex(gasLimitHex);
  // 20% safety margin for gas volatility, plus configured native-currency reserve.
  const gasLimitWithMargin = (estimatedGas * 120n + 99n) / 100n;
  const maxFee = gasLimitWithMargin * gasPrice;
  const reserve = BigInt(String(process.env.NEON_EVM_MIN_RESERVE_WEI || '0'));
  const value = BigInt(valueWei);
  const required = value + maxFee + reserve;
  return {
    ok: balance >= required,
    chainId: actualChain,
    from, to, valueWei: value.toString(),
    balanceWei: balance.toString(),
    gasPriceWei: gasPrice.toString(),
    estimatedGas: estimatedGas.toString(),
    gasLimitWithMargin: gasLimitWithMargin.toString(),
    maxFeeWei: maxFee.toString(),
    configuredReserveWei: reserve.toString(),
    requiredWei: required.toString(),
    shortfallWei: balance >= required ? '0' : (required - balance).toString(),
    checkedAt: new Date().toISOString(),
    signs: false,
    broadcasts: false,
    policy: operationPolicy()
  };
}
