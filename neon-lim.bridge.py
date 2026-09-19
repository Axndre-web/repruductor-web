#!/usr/bin/env python3
"""NEON ORB · secure local Solana state-backup bridge.

This bridge is intentionally separate from the browser. It is the only component
in this project that may read the delegated Solana keypair.

Required environment for real on-chain signing:
  NEON_SOLANA_KEYPAIR_PATH   path to a Solana keypair JSON file
  NEON_SOLANA_RPC            RPC endpoint (defaults to Solana mainnet)
  NEON_SOLANA_PUBLIC_KEY     expected public key; must match the keypair
  NEON_SOLANA_BRIDGE_PORT    local HTTP port (defaults to 8788)

The browser sends only a computable snapshot. No private key is accepted over HTTP.
The bridge records the snapshot as a Solana Memo transaction and returns its signature.
NXC/CREDITS/BITS remain Neon Orb's internal economy; this does not mint or transfer
those assets on Solana.
"""
import asyncio
import hashlib
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

HOST = '127.0.0.1'
PORT = int(os.getenv('NEON_SOLANA_BRIDGE_PORT', '8788'))
RPC = os.getenv('NEON_SOLANA_RPC', 'https://api.mainnet-beta.solana.com')
EXPECTED_PUBLIC_KEY = os.getenv(
    'NEON_SOLANA_PUBLIC_KEY',
    '5ifQth8MCG9LgnuxJaTaNcRgfmpxhsc9bMZexy2FMTJ3'
)
KEYPAIR_PATH = os.getenv('NEON_SOLANA_KEYPAIR_PATH', '')
MAX_BODY = 16_384
MAX_MEMO = 500

try:
    from solana.rpc.async_api import AsyncClient
    from solders.keypair import Keypair
    from solders.message import MessageV0
    from solders.transaction import VersionedTransaction
    from spl.memo.instructions import create_memo
    from spl.memo.models import MemoParams
except ImportError as exc:
    AsyncClient = Keypair = MessageV0 = VersionedTransaction = None
    create_memo = MemoParams = None
    IMPORT_ERROR = str(exc)
else:
    IMPORT_ERROR = ''


def json_response(handler, code, obj):
    data = json.dumps(obj, ensure_ascii=False).encode('utf-8')
    handler.send_response(code)
    handler.send_header('Content-Type', 'application/json; charset=utf-8')
    handler.send_header('Access-Control-Allow-Origin', '*')
    handler.send_header('Access-Control-Allow-Headers', 'Content-Type')
    handler.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
    handler.send_header('Content-Length', str(len(data)))
    handler.end_headers()
    handler.wfile.write(data)


def load_keypair():
    if not KEYPAIR_PATH:
        raise RuntimeError('NEON_SOLANA_KEYPAIR_PATH no configurado')
    if Keypair is None:
        raise RuntimeError(
            'Dependencias Solana no instaladas. Ejecuta: pip install -r requirements-solana.txt'
        )
    with open(KEYPAIR_PATH, 'r', encoding='utf-8') as fh:
        raw = json.load(fh)
    if not isinstance(raw, list) or len(raw) not in (32, 64):
        raise RuntimeError('El keypair JSON debe contener 32 o 64 bytes')
    kp = Keypair.from_bytes(bytes(int(x) for x in raw))
    if str(kp.pubkey()) != EXPECTED_PUBLIC_KEY:
        raise RuntimeError('La clave pública del keypair no coincide con NEON_SOLANA_PUBLIC_KEY')
    return kp


def normalize_snapshot(snapshot):
    if not isinstance(snapshot, dict):
        raise ValueError('snapshot inválido')
    required = ('level', 'xpTotal', 'NXC', 'CREDITS', 'BITS')
    out = {'protocol': 'NEON-ORB-ONCHAIN-BACKUP-V1'}
    for key in required:
        value = snapshot.get(key)
        if isinstance(value, bool):
            raise ValueError(f'{key} debe ser numérico')
        try:
            n = float(value)
        except (TypeError, ValueError):
            raise ValueError(f'{key} debe ser numérico')
        if not (n == n) or n in (float('inf'), float('-inf')):
            raise ValueError(f'{key} no es finito')
        out[key] = int(n) if n.is_integer() else round(n, 6)
    out['generation'] = int(snapshot.get('generation', out['level']))
    out['interactions'] = int(snapshot.get('interactions', 0))
    out['at'] = int(snapshot.get('at', 0))
    return out


def memo_for(snapshot):
    compact = json.dumps(snapshot, ensure_ascii=False, separators=(',', ':'))
    digest = hashlib.sha256(compact.encode('utf-8')).hexdigest()
    # Keep the complete compact snapshot when possible. If it ever exceeds the
    # memo budget, store its hash plus the essential numeric state rather than
    # silently truncating data.
    if len(compact.encode('utf-8')) <= MAX_MEMO:
        return compact, digest
    fallback = json.dumps({
        'protocol': snapshot['protocol'], 'level': snapshot['level'],
        'xpTotal': snapshot['xpTotal'], 'NXC': snapshot['NXC'],
        'CREDITS': snapshot['CREDITS'], 'BITS': snapshot['BITS'],
        'generation': snapshot['generation'], 'interactions': snapshot['interactions'],
        'at': snapshot['at'], 'sha256': digest
    }, ensure_ascii=False, separators=(',', ':'))
    if len(fallback.encode('utf-8')) > MAX_MEMO:
        raise ValueError('snapshot demasiado grande para el Memo de Solana')
    return fallback, digest


async def backup(snapshot):
    kp = load_keypair()
    memo_text, digest = memo_for(snapshot)
    async with AsyncClient(RPC) as client:
        latest = await client.get_latest_blockhash()
        instruction = create_memo(MemoParams(program_id=__import__('solders.pubkey', fromlist=['Pubkey']).Pubkey.from_string('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'), signer=kp.pubkey(), message=memo_text.encode('utf-8')))
        message = MessageV0.try_compile(
            payer=kp.pubkey(),
            instructions=[instruction],
            address_lookup_table_accounts=[],
            recent_blockhash=latest.value.blockhash,
        )
        tx = VersionedTransaction(message, [kp])
        sent = await client.send_transaction(tx)
        signature = str(sent.value)
        confirmed = await client.confirm_transaction(sent.value, commitment='confirmed')
        return {
            'ok': True,
            'status': 'CONFIRMED',
            'txHash': signature,
            'signature': signature,
            'publicKey': str(kp.pubkey()),
            'cluster': 'mainnet-beta' if 'mainnet' in RPC else ('devnet' if 'devnet' in RPC else 'custom'),
            'rpc': RPC,
            'snapshotSha256': digest,
            'confirmed': bool(getattr(confirmed, 'value', confirmed)),
        }


class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        json_response(self, 204, {})

    def do_POST(self):
        if urlparse(self.path).path != '/v1/neon-orb/onchain-backup':
            json_response(self, 404, {'ok': False, 'error': 'not found'})
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length <= 0 or length > MAX_BODY:
                raise ValueError('payload inválido o demasiado grande')
            body = json.loads(self.rfile.read(length).decode('utf-8'))
            snapshot = normalize_snapshot(body.get('snapshot'))
            result = asyncio.run(backup(snapshot))
            json_response(self, 200, result)
        except Exception as exc:
            json_response(self, 503, {
                'ok': False,
                'status': 'NOT_CONFIRMED',
                'error': str(exc),
                'detail': IMPORT_ERROR or None,
            })

    def log_message(self, fmt, *args):
        print('[NEON SOLANA BRIDGE] ' + fmt % args)


if __name__ == '__main__':
    print(f'NEON ORB Solana bridge: http://{HOST}:{PORT}/v1/neon-orb/onchain-backup')
    print(f'RPC: {RPC}')
    print('Firma autónoma: configurada solo si NEON_SOLANA_KEYPAIR_PATH apunta a un keypair válido.')
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
