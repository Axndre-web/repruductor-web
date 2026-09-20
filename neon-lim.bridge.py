"""
NEON PLAYER X — Neon Orb local activation bridge
REAL / COMPUTABLE / VIVA
- Health endpoint: GET /health
- Optional snapshot endpoint: POST /snapshot
- Private signing material is read ONLY from environment/keypair path.
- No private key is shipped in this source file.
- A snapshot is never reported as confirmed unless the Solana RPC confirms it.
"""
import os, json, time
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.request import Request, urlopen
from urllib.error import URLError

HOST=os.getenv("NEON_BRIDGE_HOST","127.0.0.1")
PORT=int(os.getenv("NEON_BRIDGE_PORT","8787"))
RPC=os.getenv("SOLANA_RPC_URL","").strip()
KEYPAIR_PATH=os.getenv("SOLANA_KEYPAIR_PATH","").strip()
PUBLIC=os.getenv("NEON_ORB_SOLANA_ADDRESS","AvcMD59dTTTnHKzfdQtF9AcSzgSNcqCWEkcUYx4BnUeh")

def health():
    keypair_ready=bool(KEYPAIR_PATH and os.path.isfile(KEYPAIR_PATH))
    rpc_ready=bool(RPC)
    return {
        "ok": rpc_ready and keypair_ready,
        "status":"READY" if rpc_ready and keypair_ready else "NOT_CONFIGURED",
        "network":"configured" if rpc_ready else "RPC_MISSING",
        "signer":"configured" if keypair_ready else "KEYPAIR_MISSING",
        "publicAddress":PUBLIC,
        "checkedAt":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())
    }

class Handler(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        raw=json.dumps(obj).encode()
        self.send_response(code); self.send_header("Content-Type","application/json")
        self.send_header("Cache-Control","no-store"); self.send_header("Content-Length",str(len(raw)))
        self.end_headers(); self.wfile.write(raw)
    def do_GET(self):
        if self.path.split("?")[0]=="/health": self._send(200,health()); return
        self._send(404,{"ok":False,"error":"NOT_FOUND"})
    def do_POST(self):
        if self.path.split("?")[0]!="/snapshot": self._send(404,{"ok":False,"error":"NOT_FOUND"}); return
        h=health()
        if not h["ok"]:
            self._send(503,{"ok":False,"status":"NOT_CONFIGURED","health":h}); return
        # Deliberately refuse to invent a transaction. A production signer must
        # be connected here with the intended Solana program/data format.
        self._send(501,{"ok":False,"status":"SIGNING_NOT_IMPLEMENTED",
                         "reason":"No transaction is fabricated or reported as confirmed.",
                         "health":h})
    def log_message(self,*args): pass

if __name__=="__main__":
    print(f"Neon Orb bridge listening on http://{HOST}:{PORT}")
    HTTPServer((HOST,PORT),Handler).serve_forever()
