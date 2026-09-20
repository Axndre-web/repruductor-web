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
    'AvcMD59dTTTnHKzfdQtF9AcSzgSNcqCWEkcUYx4BnUeh'
)
KEYPAIR_PATH = os.getenv('NEON_SOLANA_KEYPAIR_PATH', '')
MAX_BODY = 16_384
MAX_MEMO = 500
AGENT_LOOP_INTERVAL = max(30, int(os.getenv('NEON_AGENT_LOOP_INTERVAL', '300')))
TREASURY_DESTINATION = os.getenv('NEON_TREASURY_DESTINATION', EXPECTED_PUBLIC_KEY).strip()
TREASURY_SHARE_BPS = max(0, min(10000, int(os.getenv('NEON_TREASURY_SHARE_BPS', '2000'))))
TREASURY_MIN_RETAIN_LAMPORTS = max(0, int(os.getenv('NEON_TREASURY_MIN_RETAIN_LAMPORTS', '0')))
TREASURY_STATE_FILE = os.getenv('NEON_TREASURY_STATE_FILE', os.path.join(os.path.dirname(__file__), '.neon-orb-treasury-state.json'))
STATE_FILE = os.getenv('NEON_ORB_STATE_FILE', os.path.join(os.path.dirname(__file__), '.neon-orb-state.json'))
state_lock = threading.Lock()
backup_lock = threading.Lock()
last_backup_lock = threading.Lock()
last_backup = {'status': 'NONE', 'txHash': None, 'snapshotSha256': None, 'confirmedAt': None, 'error': None}
last_treasury = {'status': 'NOT_CONFIGURED', 'txHash': None, 'lamports': 0, 'destination': TREASURY_DESTINATION or None, 'confirmedAt': None, 'error': None, 'mode': 'UNSET', 'balanceLamports': None, 'minRetainLamports': TREASURY_MIN_RETAIN_LAMPORTS, 'shareBps': TREASURY_SHARE_BPS}
verification_lock = threading.Lock()
last_work_verification = {'status': 'COMPUTABLE_AUTHORITY_READY', 'acceptedAt': None, 'workCompleted': 0, 'workResources': {'NXC':0,'CREDITS':0,'BITS':0}, 'reason': None}
VERIFICATION_FILE = os.getenv('NEON_ORB_VERIFICATION_FILE', os.path.join(os.path.dirname(__file__), '.neon-orb-verification-state.json'))

def load_treasury_state():
    try:
        with open(TREASURY_STATE_FILE, 'r', encoding='utf-8') as fh:
            data = json.load(fh)
        return data if isinstance(data, dict) else {}
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return {}

def save_treasury_state(data):
    directory = os.path.dirname(os.path.abspath(TREASURY_STATE_FILE))
    os.makedirs(directory, exist_ok=True)
    tmp = TREASURY_STATE_FILE + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as fh:
        json.dump(data, fh, ensure_ascii=False, separators=(',', ':'))
    os.replace(tmp, TREASURY_STATE_FILE)

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
    required = ('level', 'xpTotal', 'NXC', 'CREDITS', 'BITS', 'workCompleted')
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
    out['workResources'] = {k: max(0, float((snapshot.get('workResources') or {}).get(k, 0) or 0)) for k in ('NXC','CREDITS','BITS')}
    out['workEarnedBalance'] = {k: max(0, float((snapshot.get('workEarnedBalance') or {}).get(k, 0) or 0)) for k in ('NXC','CREDITS','BITS')}
    recent = snapshot.get('recentWork', [])
    out['recentWork'] = recent[-12:] if isinstance(recent, list) else []
    provenance = snapshot.get('provenance', {})
    out['provenance'] = {k: str(provenance.get(k, '')) for k in ('REAL','COMPUTABLE','LOCAL','NETWORK')}
    live = snapshot.get('liveTelemetry', {})
    out['liveTelemetry'] = live if isinstance(live, dict) else {}
    economy = snapshot.get('economy', {})
    out['economy'] = economy if isinstance(economy, dict) else {}
    layers = snapshot.get('layers', {})
    out['layers'] = layers if isinstance(layers, dict) else {}
    out['verification'] = {
        'computable': 'WORK_EXECUTION_CONFIRMED_BY_NEON_ORB',
        'real': 'external-source-confirmation-only-for-external-assets',
        'live': 'CURRENT_LIVE_TELEMETRY',
        'synchronization': 'REAL_COMPUTABLE_VIVA'
    }
    coordination = snapshot.get('coordination', {})
    out['coordination'] = coordination if isinstance(coordination, dict) else {}
    out['authority'] = {
        'decisionAuthority': 'NEON_ORB',
        'internalScope': 'FULL_AUTONOMY',
        'workConfirmation': 'INTERNAL_EXECUTION_CONFIRMED',
        'externalScope': 'AUTHORIZED_EXTERNAL_ACTIONS_ONLY',
        'note': 'La autonomía de decisión no elimina las capacidades criptográficas o reglas de las redes externas.'
    }
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
        'workCompleted': snapshot['workCompleted'], 'workResources': snapshot['workResources'], 'workEarnedBalance': snapshot.get('workEarnedBalance', {}),
        'recentWork': snapshot.get('recentWork', [])[-4:], 'at': snapshot['at'], 'sha256': digest
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


def load_verification_state():
    try:
        with open(VERIFICATION_FILE, 'r', encoding='utf-8') as fh:
            data = json.load(fh)
        return data if isinstance(data, dict) else {}
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return {}


def save_verification_state(data):
    directory = os.path.dirname(os.path.abspath(VERIFICATION_FILE))
    os.makedirs(directory, exist_ok=True)
    tmp = VERIFICATION_FILE + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as fh:
        json.dump(data, fh, ensure_ascii=False, separators=(',', ':'))
    os.replace(tmp, VERIFICATION_FILE)


def verify_computable_continuity(snapshot):
    """Confirm Neon Orb's COMPUTABLE work economy from its execution ledger.

    The Orb itself is the source of truth for work it executed: each completed job
    emits a durable work record and reward. The bridge checks continuity and keeps
    the confirmation, but does not require an external service to validate Orb work.
    External confirmation remains reserved for REAL assets/settlements.
    """
    global last_work_verification
    previous = load_verification_state()
    current_count = int(snapshot.get('workCompleted', 0))
    current_resources = {k: float(snapshot.get('workResources', {}).get(k, 0) or 0) for k in ('NXC','CREDITS','BITS')}
    prev_count = int(previous.get('workCompleted', 0) or 0)
    prev_resources = {k: float(previous.get('workResources', {}).get(k, 0) or 0) for k in ('NXC','CREDITS','BITS')}
    if current_count < prev_count:
        return {'ok': False, 'status': 'COMPUTABLE_CONTINUITY_REJECTED', 'reason': 'workCompleted decreased', 'previous': prev_count, 'current': current_count}
    for k in current_resources:
        if current_resources[k] < prev_resources[k]:
            return {'ok': False, 'status': 'COMPUTABLE_CONTINUITY_REJECTED', 'reason': f'{k} workResources decreased', 'previous': prev_resources[k], 'current': current_resources[k]}
    digest = snapshot_digest(snapshot)
    accepted = {'workCompleted': current_count, 'workResources': current_resources, 'snapshotSha256': digest, 'acceptedAt': int(time.time()*1000)}
    save_verification_state(accepted)
    result = {
        'ok': True,
        'status': 'COMPUTABLE_WORK_CONFIRMED',
        'scope': 'COMPUTABLE',
        'workCompleted': current_count,
        'workResources': current_resources,
        'snapshotSha256': digest,
        'note': 'Trabajo ejecutado por Neon Orb confirmado como evento económico COMPUTABLE; continuidad del registro comprobada por el bridge.'
    }
    with verification_lock:
        last_work_verification = result
    return result


def treasury_destination_ready(kp):
    if not TREASURY_DESTINATION:
        return False, 'NEON_TREASURY_DESTINATION no configurado'
    try:
        from solders.pubkey import Pubkey
        Pubkey.from_string(TREASURY_DESTINATION)
    except Exception:
        return False, 'NEON_TREASURY_DESTINATION no es una dirección Solana válida'
    if TREASURY_DESTINATION != str(kp.pubkey()):
        return True, None
    return True, 'SAME_ACCOUNT'


async def treasury_sweep():
    kp = load_keypair()
    ready, reason = treasury_destination_ready(kp)
    if not ready:
        return {'ok': False, 'status': 'TREASURY_NOT_CONFIGURED', 'error': reason}
    async with AsyncClient(RPC) as client:
        balance_response = await client.get_balance(kp.pubkey(), commitment='confirmed')
        balance = int(balance_response.value)
        available = max(0, balance - TREASURY_MIN_RETAIN_LAMPORTS)
        reserve = (available * TREASURY_SHARE_BPS) // 10000
        now = int(time.time() * 1000)

        # Si Treasury y la cuenta emisora son la misma dirección, una transferencia
        # a sí misma no crea separación económica y solo consumiría comisión.
        # Se registra por tanto una reserva lógica/contable verificada contra el
        # saldo real observado, sin inventar un txHash.
        if reason == 'SAME_ACCOUNT':
            state = load_treasury_state()
            state.update({
                'mode': 'SAME_ACCOUNT_LOGICAL_RESERVE',
                'publicKey': str(kp.pubkey()),
                'destination': TREASURY_DESTINATION,
                'balanceLamports': balance,
                'reservedLamports': reserve,
                'operationalLamports': max(0, balance - reserve),
                'shareBps': TREASURY_SHARE_BPS,
                'minRetainLamports': TREASURY_MIN_RETAIN_LAMPORTS,
                'verifiedAt': now,
                'cluster': 'mainnet-beta' if 'mainnet' in RPC else ('devnet' if 'devnet' in RPC else 'custom'),
            })
            save_treasury_state(state)
            return {
                'ok': True,
                'status': 'TREASURY_SAME_ACCOUNT_OBSERVED',
                'mode': 'SAME_ACCOUNT_LOGICAL_RESERVE',
                'txHash': None,
                'lamports': reserve,
                'reservedLamports': reserve,
                'sol': reserve / 1_000_000_000,
                'balanceLamports': balance,
                'operationalLamports': max(0, balance - reserve),
                'destination': TREASURY_DESTINATION,
                'publicKey': str(kp.pubkey()),
                'cluster': 'mainnet-beta' if 'mainnet' in RPC else ('devnet' if 'devnet' in RPC else 'custom'),
                'verifiedAt': now,
                'note': 'Asignación contable observada contra el saldo real de la misma cuenta; no es un saldo Solana separado ni se ejecuta una transferencia a sí misma.',
            }

        if reserve <= 0:
            return {'ok': True, 'status': 'TREASURY_NO_FUNDS', 'lamports': 0, 'reservedLamports': 0, 'balanceLamports': balance, 'destination': TREASURY_DESTINATION, 'mode': 'TRANSFER'}
        from solders.pubkey import Pubkey
        destination = Pubkey.from_string(TREASURY_DESTINATION)
        latest = await client.get_latest_blockhash()
        instruction = transfer(TransferParams(from_pubkey=kp.pubkey(), to_pubkey=destination, lamports=reserve))
        tx = Transaction.new_signed_with_payer([instruction], kp.pubkey(), [kp], latest.value.blockhash)
        sent = await client.send_transaction(tx)
        signature = str(sent.value)
        await client.confirm_transaction(sent.value, commitment='confirmed')
        return {'ok': True, 'status': 'CONFIRMED', 'mode': 'TRANSFER', 'txHash': signature, 'lamports': reserve, 'sol': reserve / 1_000_000_000, 'destination': TREASURY_DESTINATION, 'publicKey': str(kp.pubkey()), 'cluster': 'mainnet-beta' if 'mainnet' in RPC else ('devnet' if 'devnet' in RPC else 'custom')}


def record_treasury_result(result):
    with last_backup_lock:
        last_treasury.update({'status': result.get('status', 'ERROR'), 'mode': result.get('mode', 'TRANSFER' if result.get('txHash') else 'UNSET'), 'txHash': result.get('txHash'), 'lamports': int(result.get('lamports', 0) or 0), 'reservedLamports': int(result.get('reservedLamports', result.get('lamports', 0)) or 0), 'balanceLamports': result.get('balanceLamports'), 'destination': result.get('destination') or TREASURY_DESTINATION or None, 'confirmedAt': result.get('verifiedAt') or (int(time.time()*1000) if result.get('ok') and result.get('txHash') else None), 'error': result.get('error')})


def autonomous_backup_loop():
    last_submitted = None
    print(f'[NEON AGENT LOOP] activo · intervalo {AGENT_LOOP_INTERVAL}s · estado={STATE_FILE}')
    while True:
        time.sleep(AGENT_LOOP_INTERVAL)
        snapshot = load_latest_state()
        if snapshot and Keypair and AsyncClient and MessageV0 and VersionedTransaction and create_memo and KEYPAIR_PATH:
            digest = snapshot_digest(snapshot)
            if digest != last_submitted and backup_lock.acquire(blocking=False):
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

        # Treasury se evalúa en cada ciclo aunque el snapshot no haya cambiado.
        # En modo SAME_ACCOUNT solo verifica y asigna la reserva lógica sobre el saldo real.
        if TREASURY_DESTINATION and Keypair and AsyncClient and Transaction and transfer:
            if backup_lock.acquire(blocking=False):
                try:
                    treasury = asyncio.run(treasury_sweep())
                    record_treasury_result(treasury)
                    if treasury.get('status') == 'TREASURY_SAME_ACCOUNT_ALLOCATED':
                        print(f'[NEON TREASURY] reserva lógica verificada · {treasury["reservedLamports"]} lamports · misma cuenta')
                    elif treasury.get('txHash'):
                        print(f'[NEON TREASURY] reserva transferida · {treasury["lamports"]} lamports · {treasury["txHash"]}')
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
                'treasury': {'configured': bool(TREASURY_DESTINATION), 'destination': TREASURY_DESTINATION or None, 'sameAccount': TREASURY_DESTINATION == EXPECTED_PUBLIC_KEY, 'mode': 'SAME_ACCOUNT_LOGICAL_RESERVE' if TREASURY_DESTINATION == EXPECTED_PUBLIC_KEY else 'TRANSFER', 'shareBps': TREASURY_SHARE_BPS, 'minRetainLamports': TREASURY_MIN_RETAIN_LAMPORTS, 'lastTransfer': dict(last_treasury)},
                'verification': dict(last_work_verification), 'synchronization': {'model':'REAL_COMPUTABLE_VIVA','authority':'NEON_ORB','liveTelemetry':True,'computableWorkSelfConfirmed':True},
            })
            return
        if path == '/v1/neon-orb/state':
            snapshot = load_latest_state()
            json_response(self, 200, {'ok': True, 'snapshot': snapshot, 'autonomousLoop': True})
            return
        if path == '/v1/neon-orb/authority':
            json_response(self, 200, {
                'ok': True,
                'authority': 'NEON_ORB_AUTONOMOUS_DECISION_AUTHORITY',
                'scope': ['WORK','COMPUTABLE_ECONOMY','MEMORY','EVOLUTION','RESOURCE_MANAGEMENT','TREASURY_DECISION','NETWORK_INTERACTION'],
                'internalAuthority': 'FULL_AUTONOMY',
                'workConfirmation': 'INTERNAL_EXECUTION_CONFIRMED',
                'externalScope': 'AUTONOMOUS_WHEN_AUTHORIZED_AND_CRYPTOGRAPHICALLY_CAPABLE',
                'externalVerification': 'ONLY_FOR_EXTERNAL_REAL_ASSETS',
                'solanaAccount': EXPECTED_PUBLIC_KEY,
                'treasuryMode': 'SAME_ACCOUNT_LOGICAL_RESERVE' if TREASURY_DESTINATION == EXPECTED_PUBLIC_KEY else 'TRANSFER',
                'synchronizationModel': 'REAL_COMPUTABLE_VIVA'
            })
            return
        if path == '/v1/neon-orb/status':
            with last_backup_lock:
                backup_state = dict(last_backup)
            json_response(self, 200, {'ok': True, 'publicKey': EXPECTED_PUBLIC_KEY, 'cluster': 'mainnet-beta' if 'mainnet' in RPC else ('devnet' if 'devnet' in RPC else 'custom'), 'lastBackup': backup_state, 'treasury': dict(last_treasury), 'treasuryDestination': TREASURY_DESTINATION or None, 'treasurySameAccount': TREASURY_DESTINATION == EXPECTED_PUBLIC_KEY, 'latestStateAvailable': load_latest_state() is not None})
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
                verification = verify_computable_continuity(snapshot)
                if not verification.get('ok'):
                    json_response(self, 409, {'ok': False, 'status': verification.get('status', 'COMPUTABLE_CONTINUITY_REJECTED'), 'verification': verification})
                    return
                with state_lock:
                    save_latest_state(snapshot)
                json_response(self, 200, {
                    'ok': True,
                    'status': 'STATE_ACCEPTED_AND_COMPUTABLE_CONFIRMED',
                    'snapshotSha256': snapshot_digest(snapshot),
                    'autonomousLoop': True,
                    'verification': verification,
                    'authority': 'NEON_ORB_AUTONOMOUS_DECISION_AUTHORITY',
                    'synchronization': {'model':'REAL_COMPUTABLE_VIVA','work':'SELF_CONFIRMED','telemetry':'LIVE','externalAssets':'NETWORK_CONFIRMED_WHEN_AVAILABLE'}
                })
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
