#!/usr/bin/env python3
"""NEON LIM Bridge — V11.7.1 Real Work Unified
Local-only control/observation bridge for the public NEON PLAYER X frontend.

Design goals:
- /health and /telemetry are safe read-only endpoints.
- /wallet exposes only public identity and network-observed balances.
- No private keys or secrets are returned to the browser.
- Network values are marked observed/verified only when fetched successfully.
- Autonomous telemetry loop runs in the background and persists local state.
"""
from __future__ import annotations
import json, os, threading, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

# Read local .env with setdefault: explicitly exported process variables always win.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
def load_local_env():
    try:
        with open(os.path.join(BASE_DIR, '.env'), 'r', encoding='utf-8') as env_file:
            for raw in env_file:
                line = raw.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                key, value = line.split('=', 1)
                key, value = key.strip(), value.strip()
                if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
                    value = value[1:-1]
                if key:
                    os.environ.setdefault(key, value)
    except OSError:
        pass

load_local_env()

HOST = os.getenv('NEON_BRIDGE_HOST', '127.0.0.1')
PORT = int(os.getenv('NEON_BRIDGE_PORT', '8765'))
TOKEN = os.getenv('NEON_BRIDGE_TOKEN', '')
STATE_FILE = os.getenv('NEON_BRIDGE_STATE', os.path.join(os.path.dirname(__file__), 'neon-lim.state.json'))
# Arcade demo credits use a separate file; the NEON-LIM runtime state/receipts are untouched.
ARCADE_STATE_FILE = os.getenv('NEON_ARCADE_DEMO_STATE', os.path.join(os.path.dirname(__file__), 'neon-arcade-demo.state.json'))
SOLANA_ADDRESS = os.getenv('SOLANA_WALLET_ADDRESS') or os.getenv('NEON_SOLANA_ADDRESS') or ''
BITCOIN_ADDRESS = os.getenv('NEON_BITCOIN_ADDRESS') or os.getenv('BITCOIN_ADDRESS') or ''
SOLANA_RPC_URL = os.getenv('SOLANA_RPC_ENDPOINT') or os.getenv('SOLANA_RPC_URL') or os.getenv('NEON_SOLANA_RPC') or 'https://api.mainnet-beta.solana.com'
MEMPOOL_API = os.getenv('BITCOIN_API_BASE', 'https://mempool.space/api')
NETWORK_TIMEOUT = float(os.getenv('NEON_NETWORK_TIMEOUT', '8'))

lock = threading.RLock()
state = {
    'version': '11.7.1',
    'startedAt': time.time(),
    'cycles': 0,
    'decision': 'OBSERVE',
    'zone': 'LOCAL-BRIDGE',
    'energy': 100,
    'curiosity': 72,
    'attachment': 100,
    'journeys': 0,
    'resources': {'NXC': 0, 'CREDITS': 0, 'BITS': 0},
    'lastTick': None,
    'network': {'solana': {'status': 'unknown'}, 'bitcoin': {'status': 'unknown'}},
    'work': {'jobs': [], 'settlements': [], 'source': 'local-bridge'},
    'receipts': [],
}


def load_state():
    global state
    try:
        with open(STATE_FILE, 'r', encoding='utf-8') as f:
            saved = json.load(f)
        with lock:
            state.update(saved)
    except (OSError, ValueError, TypeError):
        pass


def save_state():
    tmp = STATE_FILE + '.tmp'
    try:
        with open(tmp, 'w', encoding='utf-8') as f:
            json.dump(state, f, ensure_ascii=False, indent=2)
        os.replace(tmp, STATE_FILE)
    except OSError:
        pass


def http_json(url, payload=None):
    data = None if payload is None else json.dumps(payload).encode('utf-8')
    req = Request(url, data=data, headers={'Content-Type': 'application/json', 'User-Agent': 'NEON-LIM/11.7.1'})
    with urlopen(req, timeout=NETWORK_TIMEOUT) as response:
        return json.loads(response.read().decode('utf-8'))


def refresh_network():
    sol = {'address': SOLANA_ADDRESS, 'network': 'mainnet-beta', 'status': 'unavailable'}
    btc = {'address': BITCOIN_ADDRESS, 'network': 'bitcoin-mainnet', 'status': 'unavailable'}
    if SOLANA_ADDRESS:
        try:
            result = http_json(SOLANA_RPC_URL, {'jsonrpc': '2.0', 'id': 1, 'method': 'getBalance', 'params': [SOLANA_ADDRESS]})
            lamports = int(result.get('result', {}).get('value', 0))
            sol.update({'status': 'observed', 'lamports': lamports, 'sol': lamports / 1_000_000_000, 'observedAt': time.time()})
        except Exception as exc:
            sol['error'] = type(exc).__name__
    else:
        sol['status'] = 'not_configured'
    if BITCOIN_ADDRESS:
        try:
            result = http_json(f'{MEMPOOL_API.rstrip("/")}/address/{BITCOIN_ADDRESS}')
            chain = result.get('chain_stats', {})
            funded = int(chain.get('funded_txo_sum', 0))
            spent = int(chain.get('spent_txo_sum', 0))
            btc.update({'status': 'observed', 'satoshis': max(0, funded - spent), 'btc': max(0, funded - spent) / 100_000_000, 'observedAt': time.time()})
        except Exception as exc:
            btc['error'] = type(exc).__name__
    else:
        btc['status'] = 'not_configured'
    with lock:
        state['network'] = {'solana': sol, 'bitcoin': btc}
        state['lastNetworkRefresh'] = time.time()
    save_state()


def autonomous_loop():
    while True:
        now = time.time()
        with lock:
            state['cycles'] = int(state.get('cycles', 0)) + 1
            state['lastTick'] = now
            state['energy'] = max(0, min(100, 82 + int(18 * ((now // 5) % 2))))
            state['decision'] = 'OBSERVE_NETWORK' if state['cycles'] % 6 else 'REFRESH_STATE'
        save_state()
        if state['cycles'] % 6 == 0:
            refresh_network()
        time.sleep(5)


class Handler(BaseHTTPRequestHandler):
    server_version = 'NEON-LIM/11.7.1'

    def log_message(self, fmt, *args):
        print('[NEON-LIM]', fmt % args)

    def send_json(self, code, payload):
        raw = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Neon-Bridge-Token')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Content-Length', str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self):
        self.send_json(204, {})

    def authorized(self):
        if not TOKEN:
            return True
        return self.headers.get('X-Neon-Bridge-Token', '') == TOKEN

    def do_GET(self):
        path = self.path.split('?', 1)[0]
        if path in ('/health', '/telemetry', '/wallet', '/work', '/receipts', '/api/health', '/api/telemetry', '/api/wallet', '/api/work', '/api/receipts'):
            if not self.authorized():
                self.send_json(401, {'ok': False, 'error': 'UNAUTHORIZED'})
                return
            with lock:
                snapshot = json.loads(json.dumps(state))
            if path.endswith('/health') or path == '/health':
                self.send_json(200, {
                    'ok': True, 'service': 'NEON-LIM', 'version': state['version'],
                    'bridge': 'CONNECTED', 'mode': 'READ_ONLY_OBSERVABLE',
                    'uptimeSeconds': max(0, time.time() - state['startedAt']),
                    'lastTick': snapshot.get('lastTick'),
                    'lastNetworkRefresh': snapshot.get('lastNetworkRefresh'),
                })
            elif path.endswith('/telemetry') or path == '/telemetry':
                self.send_json(200, {'ok': True, 'source': 'local-autonomous-loop', 'telemetry': snapshot})
            elif path.endswith('/work') or path == '/work':
                self.send_json(200, {
                    'ok': True, 'source': 'local-bridge',
                    'mode': 'READ_ONLY_OBSERVABLE',
                    'work': snapshot.get('work', {'jobs': [], 'settlements': []}),
                })
            elif path.endswith('/receipts') or path == '/receipts':
                self.send_json(200, {
                    'ok': True, 'source': 'local-bridge',
                    'mode': 'READ_ONLY_OBSERVABLE',
                    'receipts': snapshot.get('receipts', []),
                })
            else:
                self.send_json(200, {
                    'ok': True, 'identity': {'username': '@neonorb'},
                    'addresses': {'solana': SOLANA_ADDRESS, 'bitcoin': BITCOIN_ADDRESS},
                    'network': snapshot.get('network', {}),
                    'mode': 'OBSERVED_PUBLIC_STATE',
                })
            return
        if path == '/arcade/state':
            if not self.authorized():
                self.send_json(401, {'ok': False, 'error': 'UNAUTHORIZED'})
                return
            device_id = self.path.split('deviceId=', 1)[1].split('&', 1)[0] if 'deviceId=' in self.path else ''
            if not device_id or len(device_id) > 100 or any(not (c.isalnum() or c in '_-') for c in device_id):
                self.send_json(400, {'ok': False, 'error': 'INVALID_DEVICE_ID'})
                return
            try:
                with lock:
                    try:
                        with open(ARCADE_STATE_FILE, 'r', encoding='utf-8') as f:
                            arcade = json.load(f)
                    except (OSError, ValueError):
                        arcade = {'version': 1, 'devices': {}}
                    import hashlib
                    key = hashlib.sha256(device_id.encode('utf-8')).hexdigest()
                    record = arcade.setdefault('devices', {}).get(key)
                    if not isinstance(record, dict) or not isinstance(record.get('balance'), (int, float)) or record.get('balance', 0) <= 0:
                        record = {'balance': 100.0, 'events': [], 'updatedAt': time.time(), 'currency': 'DEMO_CREDITS'}
                        arcade['devices'][key] = record
                        os.makedirs(os.path.dirname(ARCADE_STATE_FILE) or '.', exist_ok=True)
                        temp = ARCADE_STATE_FILE + '.tmp'
                        with open(temp, 'w', encoding='utf-8') as f: json.dump(arcade, f, ensure_ascii=False)
                        os.replace(temp, ARCADE_STATE_FILE)
                    response = {'ok': True, 'balance': round(float(record['balance']), 2), 'events': record.get('events', [])[-100:], 'currency': 'DEMO_CREDITS', 'source': 'python-arcade-demo-store'}
                self.send_json(200, response)
            except Exception:
                self.send_json(500, {'ok': False, 'error': 'ARCADE_STORE_UNAVAILABLE'})
            return
        self.send_json(404, {'ok': False, 'error': 'NOT_FOUND'})

    def do_POST(self):
        path = self.path.split('?', 1)[0]
        if path != '/arcade/state':
            self.send_json(404, {'ok': False, 'error': 'NOT_FOUND'})
            return
        if not self.authorized():
            self.send_json(401, {'ok': False, 'error': 'UNAUTHORIZED'})
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length <= 0 or length > 32768:
                self.send_json(413, {'ok': False, 'error': 'PAYLOAD_TOO_LARGE'})
                return
            body = json.loads(self.rfile.read(length).decode('utf-8'))
            device_id = body.get('deviceId', '')
            balance = float(body.get('balance'))
            event = body.get('event')
            if not isinstance(device_id, str) or not (8 <= len(device_id) <= 100) or any(not (c.isalnum() or c in '_-') for c in device_id):
                raise ValueError('invalid_device_id')
            if not (0 <= balance <= 1000000) or not isinstance(event, dict):
                raise ValueError('invalid_demo_event')
            bet, win = float(event.get('betAmount')), float(event.get('winAmount'))
            if not (0 <= bet <= 10000 and 0 <= win <= 1000000):
                raise ValueError('invalid_demo_amount')
            import hashlib
            key = hashlib.sha256(device_id.encode('utf-8')).hexdigest()
            with lock:
                try:
                    with open(ARCADE_STATE_FILE, 'r', encoding='utf-8') as f: arcade = json.load(f)
                except (OSError, ValueError): arcade = {'version': 1, 'devices': {}}
                devices = arcade.setdefault('devices', {})
                previous = devices.get(key, {'events': []})
                events = previous.get('events', []) if isinstance(previous.get('events', []), list) else []
                clean = {'type': 'DEMO_SPIN', 'betAmount': round(bet, 2), 'winAmount': round(win, 2), 'balance': round(balance, 2), 'reels': [str(x)[:8] for x in event.get('reels', [])[:5]] if isinstance(event.get('reels', []), list) else [], 'at': str(event.get('at', time.time()))[:40], 'currency': 'DEMO_CREDITS'}
                events.append(clean)
                devices[key] = {'balance': round(balance, 2), 'events': events[-100:], 'updatedAt': time.time(), 'currency': 'DEMO_CREDITS'}
                os.makedirs(os.path.dirname(ARCADE_STATE_FILE) or '.', exist_ok=True)
                temp = ARCADE_STATE_FILE + '.tmp'
                with open(temp, 'w', encoding='utf-8') as f: json.dump(arcade, f, ensure_ascii=False)
                os.replace(temp, ARCADE_STATE_FILE)
            self.send_json(201, {'ok': True, 'balance': round(balance, 2), 'persisted': True, 'currency': 'DEMO_CREDITS'})
        except (ValueError, TypeError, json.JSONDecodeError):
            self.send_json(400, {'ok': False, 'error': 'INVALID_DEMO_EVENT'})
        except Exception:
            self.send_json(500, {'ok': False, 'error': 'ARCADE_STORE_UNAVAILABLE'})


def main():
    load_state()
    # Start HTTP immediately; network observation runs asynchronously so /health never waits on RPC/API.
    thread = threading.Thread(target=autonomous_loop, daemon=True)
    thread.start()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f'NEON LIM bridge: http://{HOST}:{PORT}', flush=True)
    print('Endpoints: /health /telemetry /wallet /work /receipts', flush=True)
    server.serve_forever()

if __name__ == '__main__':
    main()
