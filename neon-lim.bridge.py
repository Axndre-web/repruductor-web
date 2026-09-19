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
import threading
import time
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
AGENT_LOOP_INTERVAL = max(30, int(os.getenv('NEON_AGENT_LOOP_INTERVAL', '300')))
TREASURY_DESTINATION = os.getenv('NEON_TREASURY_DESTINATION', '').strip()
TREASURY_SHARE_BPS = max(0, min(10000, int(os.getenv('NEON_TREASURY_SHARE_BPS', '2000'))))
TREASURY_MIN_RETAIN_LAMPORTS = max(0, int(os.getenv('NEON_TREASURY_MIN_RETAIN_LAMPORTS', '0')))
STATE_FILE = os.getenv('NEON_ORB_STATE_FILE', os.path.join(os.path.dirname(__file__), '.neon-orb-state.json'))
state_lock = threading.Lock()
backup_lock = threading.Lock()
last_backup_lock = threading.Lock()
last_backup = {'status': 'NONE', 'txHash': None, 'snapshotSha256': None, 'confirmedAt': None, 'error': None}
last_treasury = {'status': 'NOT_CONFIGURED', 'txHash': None, 'lamports': 0, 'destination': TREASURY_DESTINATION or None, 'confirmedAt': None, 'error': None}

ALLOWED_ORIGINS = {
    'http://127.0.0.1',
    'http://localhost',
    'http://127.0.0.1:3000',
    'http://localhost:3000',
}

try:
    from solana.rpc.async_api import AsyncClient
    from solders.keypair import Keypair
    from solders.message import MessageV0
    from solders.transaction import VersionedTransaction, Transaction
    from solders.system_program import transfer, TransferParams
    from spl.memo.instructions import create_memo
    from spl.memo.models import MemoParams
except ImportError as exc:
    AsyncClient = Keypair = MessageV0 = VersionedTransaction = None
    create_memo = MemoParams = transfer = TransferParams = Transaction = None
    IMPORT_ERROR = str(exc)
else:
    IMPORT_ERROR = ''


def json_response(handler, code, obj):
    data = json.dumps(obj, ensure_ascii=False).encode('utf-8')
    handler.send_response(code)
    handler.send_header('Content-Type', 'application/json; charset=utf-8')
    origin = handler.headers.get('Origin', '')
    if origin in ALLOWED_ORIGINS:
        handler.send_header('Access-Control-Allow-Origin', origin)
        handler.send_header('Vary', 'Origin')
    handler.send_header('Access-Control-Allow-Headers', 'Content-Type')
    handler.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
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


def save_latest_state(snapshot):
    directory = os.path.dirname(os.path.abspath(STATE_FILE))
    os.makedirs(directory, exist_ok=True)
    tmp = STATE_FILE + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as fh:
        json.dump({'snapshot': snapshot, 'receivedAt': int(time.time() * 1000)}, fh, ensure_ascii=False, separators=(',', ':'))
    os.replace(tmp, STATE_FILE)


def load_latest_state():
    try:
        with open(STATE_FILE, 'r', encoding='utf-8') as fh:
            data = json.load(fh)
        return data.get('snapshot') if isinstance(data, dict) else None
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return None


def snapshot_digest(snapshot):
    compact = json.dumps(snapshot, ensure_ascii=False, separators=(',', ':'))
    return hashlib.sha256(compact.encode('utf-8')).hexdigest()


def record_backup_result(result):
    with last_backup_lock:
        last_backup.update({
            'status': result.get('status', 'ERROR'),
            'txHash': result.get('txHash'),
            'snapshotSha256': result.get('snapshotSha256'),
            'confirmedAt': int(time.time() * 1000) if result.get('ok') and result.get('txHash') else None,
            'error': result.get('error')
        })

def rpc_reachable():
    if AsyncClient is None:
        return False
    async def probe():
        async with AsyncClient(RPC) as client:
            response = await client.get_health()
            return str(getattr(response, 'value', response)).lower() in ('ok', 'healthy')
    try:
        return bool(asyncio.run(probe()))
    except Exception:
        return False

def keypair_ready():
    try:
        load_keypair()
        return True
    except Exception:
        return False


def treasury_destination_ready(kp):
    if not TREASURY_DESTINATION:
        return False, 'NEON_TREASURY_DESTINATION no configurado'
    if TREASURY_DESTINATION == str(kp.pubkey()):
        return False, 'La dirección de reserva no puede ser la misma que la cuenta emisora'
    try:
        from solders.pubkey import Pubkey
        Pubkey.from_string(TREASURY_DESTINATION)
    except Exception:
        return False, 'NEON_TREASURY_DESTINATION no es una dirección Solana válida'
    return True, None


async def treasury_sweep():
    kp = load_keypair()
    ready, reason = treasury_destination_ready(kp)
    if not ready:
        return {'ok': False, 'status': 'TREASURY_NOT_CONFIGURED', 'error': reason}
    from solders.pubkey import Pubkey
    destination = Pubkey.from_string(TREASURY_DESTINATION)
    async with AsyncClient(RPC) as client:
        balance_response = await client.get_balance(kp.pubkey(), commitment='confirmed')
        balance = int(balance_response.value)
        available = max(0, balance - TREASURY_MIN_RETAIN_LAMPORTS)
        amount = (available * TREASURY_SHARE_BPS) // 10000
        if amount <= 0:
            return {'ok': True, 'status': 'TREASURY_NO_FUNDS', 'lamports': 0, 'balanceLamports': balance, 'destination': TREASURY_DESTINATION}
        latest = await client.get_latest_blockhash()
        instruction = transfer(TransferParams(from_pubkey=kp.pubkey(), to_pubkey=destination, lamports=amount))
        tx = Transaction.new_signed_with_payer([instruction], kp.pubkey(), [kp], latest.value.blockhash)
        sent = await client.send_transaction(tx)
        signature = str(sent.value)
        await client.confirm_transaction(sent.value, commitment='confirmed')
        return {'ok': True, 'status': 'CONFIRMED', 'txHash': signature, 'lamports': amount, 'sol': amount / 1_000_000_000, 'destination': TREASURY_DESTINATION, 'publicKey': str(kp.pubkey()), 'cluster': 'mainnet-beta' if 'mainnet' in RPC else ('devnet' if 'devnet' in RPC else 'custom')}


def record_treasury_result(result):
    with last_backup_lock:
        last_treasury.update({'status': result.get('status', 'ERROR'), 'txHash': result.get('txHash'), 'lamports': int(result.get('lamports', 0) or 0), 'destination': result.get('destination') or TREASURY_DESTINATION or None, 'confirmedAt': int(time.time()*1000) if result.get('ok') and result.get('txHash') else None, 'error': result.get('error')})


def autonomous_backup_loop():
    last_submitted = None
    print(f'[NEON AGENT LOOP] activo · intervalo {AGENT_LOOP_INTERVAL}s · estado={STATE_FILE}')
    while True:
        time.sleep(AGENT_LOOP_INTERVAL)
        snapshot = load_latest_state()
        if not snapshot:
            continue
        digest = snapshot_digest(snapshot)
        if digest == last_submitted:
            continue
        if not (Keypair and AsyncClient and MessageV0 and VersionedTransaction and create_memo):
            continue
        if not KEYPAIR_PATH:
            continue
        if not backup_lock.acquire(blocking=False):
            continue
        try:
            result = asyncio.run(backup(snapshot))
            record_backup_result(result)
            if result.get('ok') and result.get('txHash'):
                last_submitted = digest
                with state_lock:
                    save_latest_state(snapshot)
                print(f'[NEON AGENT LOOP] backup confirmado · {result["txHash"]}')
        except Exception as exc:
            print(f'[NEON AGENT LOOP] backup pendiente · {exc}')
        finally:
            backup_lock.release()
        if TREASURY_DESTINATION and Keypair and AsyncClient and Transaction and transfer:
            if backup_lock.acquire(blocking=False):
                try:
                    treasury = asyncio.run(treasury_sweep())
                    record_treasury_result(treasury)
                    if treasury.get('txHash'):
                        print(f'[NEON TREASURY] reserva confirmada · {treasury["lamports"]} lamports · {treasury["txHash"]}')
                except Exception as exc:
                    record_treasury_result({'status':'ERROR','error':str(exc)})
                    print(f'[NEON TREASURY] pendiente · {exc}')
                finally:
                    backup_lock.release()


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

    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/health':
            deps_ok = Keypair is not None and AsyncClient is not None and MessageV0 is not None and VersionedTransaction is not None and create_memo is not None
            keypair_configured = bool(KEYPAIR_PATH)
            keypair_matches = keypair_ready() if deps_ok and keypair_configured else False
            rpc_ok = rpc_reachable() if deps_ok else False
            operational = deps_ok and keypair_configured and keypair_matches and rpc_ok
            with last_backup_lock:
                backup_state = dict(last_backup)
            json_response(self, 200, {
                'ok': True,
                'service': 'NEON ORB Solana bridge',
                'status': 'READY / OPERATIONAL' if operational else ('CONFIG_REQUIRED' if not keypair_configured or not deps_ok or not keypair_matches else 'RPC_UNAVAILABLE'),
                'dependenciesReady': deps_ok,
                'keypairConfigured': keypair_configured,
                'keypairMatchesPublicKey': keypair_matches,
                'rpcReachable': rpc_ok,
                'autonomousLoop': True,
                'agentLoopIntervalSeconds': AGENT_LOOP_INTERVAL,
                'latestStateAvailable': load_latest_state() is not None,
                'publicKey': EXPECTED_PUBLIC_KEY,
                'cluster': 'mainnet-beta' if 'mainnet' in RPC else ('devnet' if 'devnet' in RPC else 'custom'),
                'rpc': RPC,
                'lastBackup': backup_state,
                'treasury': {'configured': bool(TREASURY_DESTINATION), 'destination': TREASURY_DESTINATION or None, 'shareBps': TREASURY_SHARE_BPS, 'minRetainLamports': TREASURY_MIN_RETAIN_LAMPORTS, 'lastTransfer': dict(last_treasury)},
            })
            return
        if path == '/v1/neon-orb/state':
            snapshot = load_latest_state()
            json_response(self, 200, {'ok': True, 'snapshot': snapshot, 'autonomousLoop': True})
            return
        if path == '/v1/neon-orb/status':
            with last_backup_lock:
                backup_state = dict(last_backup)
            json_response(self, 200, {'ok': True, 'publicKey': EXPECTED_PUBLIC_KEY, 'cluster': 'mainnet-beta' if 'mainnet' in RPC else ('devnet' if 'devnet' in RPC else 'custom'), 'lastBackup': backup_state, 'treasury': dict(last_treasury), 'treasuryDestination': TREASURY_DESTINATION or None, 'latestStateAvailable': load_latest_state() is not None})
            return
        json_response(self, 404, {'ok': False, 'error': 'not found'})

    def do_POST(self):
        path = urlparse(self.path).path
        if path == '/v1/neon-orb/state':
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if length <= 0 or length > MAX_BODY:
                    raise ValueError('payload inválido o demasiado grande')
                body = json.loads(self.rfile.read(length).decode('utf-8'))
                snapshot = normalize_snapshot(body.get('snapshot'))
                with state_lock:
                    save_latest_state(snapshot)
                json_response(self, 200, {'ok': True, 'status': 'STATE_ACCEPTED', 'snapshotSha256': snapshot_digest(snapshot), 'autonomousLoop': True})
            except Exception as exc:
                json_response(self, 400, {'ok': False, 'status': 'STATE_REJECTED', 'error': str(exc)})
            return
        if path == '/v1/neon-orb/treasury/sweep':
            try:
                if not (Keypair and AsyncClient and Transaction and transfer):
                    raise RuntimeError('Dependencias Solana no instaladas')
                if not backup_lock.acquire(blocking=False):
                    raise RuntimeError('otra firma on-chain está en curso')
                try:
                    result = asyncio.run(treasury_sweep())
                    record_treasury_result(result)
                finally:
                    backup_lock.release()
                json_response(self, 200 if result.get('ok') else 503, result)
            except Exception as exc:
                record_treasury_result({'status':'ERROR','error':str(exc)})
                json_response(self, 503, {'ok':False,'status':'TREASURY_NOT_CONFIRMED','error':str(exc)})
            return
        if path != '/v1/neon-orb/onchain-backup':
            json_response(self, 404, {'ok': False, 'error': 'not found'})
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length <= 0 or length > MAX_BODY:
                raise ValueError('payload inválido o demasiado grande')
            body = json.loads(self.rfile.read(length).decode('utf-8'))
            snapshot = normalize_snapshot(body.get('snapshot'))
            if not backup_lock.acquire(blocking=False):
                raise RuntimeError('otra firma on-chain está en curso')
            try:
                result = asyncio.run(backup(snapshot))
                record_backup_result(result)
            finally:
                backup_lock.release()
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
    threading.Thread(target=autonomous_backup_loop, name='neon-orb-agent-loop', daemon=True).start()
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
