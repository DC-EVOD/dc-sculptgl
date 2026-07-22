"""forge_daemon.py — DC FORGE DAEMON (localhost bridge for dc-sculptgl).

Wraps the three VERIFIED headless-Blender engines as HTTP endpoints for the
deployed fork at https://dc-evod.github.io/dc-sculptgl:

  GET  /health            -> JSON status (blender found? scripts present?)
  POST /intake?...        -> body: PLY  -> cleaned/remeshed PLY back
        params: remesh=none|voxel|quad  target_faces=N  voxel_size=F  merge_dist=F
  POST /rings?...         -> body: PLY (with cyan RETOPO MARKS) -> ringed PLY back
        params: rings=N
  POST /bake?...          -> body: PLY (vertex-painted) -> ZIP (obj+mtl+albedo[+ao]) back
        params: res=N  ao=0|1  ao_rays=N  margin=N  name=str

Receipts: every engine prints "RECEIPT {json}"; the daemon returns it in the
X-DC-Receipt response header (exposed via Access-Control-Expose-Headers).

CORS: exact pattern PROVEN by probe_daemon.py on 2026-07-22 (deployed HTTPS
page fetched localhost:8571 OK) — origin-locked to the GitHub Pages site,
Access-Control-Allow-Private-Network: true for Chrome's PNA preflight.

Run:  python3 forge_daemon.py            (expects blender on PATH)
      python3 forge_daemon.py --blender /path/to/blender
      DC_BLENDER=/path/to/blender python3 forge_daemon.py
Engines (intake.py / edge_rings.py / bake_out.py) must sit next to this file.
"""
import json, os, shutil, subprocess, sys, tempfile, zipfile
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

PORT = 8571
ORIGIN = 'https://dc-evod.github.io'          # proven probe pattern
HERE = os.path.dirname(os.path.abspath(__file__))
ENGINES = {'intake': 'intake.py', 'rings': 'edge_rings.py', 'bake': 'bake_out.py'}
MAX_BODY = 256 * 1024 * 1024                  # 256 MB mesh ceiling

def find_blender():
    cand = [os.environ.get('DC_BLENDER'), 'blender']
    for i, a in enumerate(sys.argv):
        if a == '--blender' and i + 1 < len(sys.argv):
            cand.insert(0, sys.argv[i + 1])
    for c in cand:
        if c and shutil.which(c):
            return shutil.which(c)
        if c and os.path.isfile(c) and os.access(c, os.X_OK):
            return c
    return None

BLENDER = find_blender()

def run_engine(script, script_args, timeout=600):
    """Run blender -b -P script -- args. Returns (receipt_dict, full_output)."""
    cmd = [BLENDER, '-b', '-P', os.path.join(HERE, script), '--'] + script_args
    p = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    out = p.stdout + '\n' + p.stderr
    receipt = None
    for line in p.stdout.splitlines():
        if line.startswith('RECEIPT '):
            receipt = json.loads(line[8:])
    if receipt is None:
        raise RuntimeError('engine gave no RECEIPT; tail:\n' + out[-2000:])
    return receipt, out

class Handler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    # ---- CORS: proven probe pattern -------------------------------------
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', ORIGIN)
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Private-Network', 'true')
        self.send_header('Access-Control-Expose-Headers', 'X-DC-Receipt')

    def _send(self, code, body, ctype, receipt=None):
        self.send_response(code)
        self._cors()
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        if receipt is not None:
            self.send_header('X-DC-Receipt', json.dumps(receipt))
        self.end_headers()
        self.wfile.write(body)

    def _err(self, code, msg):
        self._send(code, json.dumps({'error': msg}).encode(), 'application/json')

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.send_header('Content-Length', '0')
        self.end_headers()

    def do_GET(self):
        if urlparse(self.path).path != '/health':
            return self._err(404, 'unknown endpoint')
        status = {
            'daemon': 'DC FORGE DAEMON',
            'ok': BLENDER is not None,
            'blender': BLENDER or 'NOT FOUND (set DC_BLENDER or --blender)',
            'engines': {k: os.path.isfile(os.path.join(HERE, v))
                        for k, v in ENGINES.items()},
        }
        self._send(200, json.dumps(status).encode(), 'application/json')

    def do_POST(self):
        u = urlparse(self.path)
        ep = u.path.lstrip('/')
        if ep not in ENGINES:
            return self._err(404, 'unknown endpoint')
        if BLENDER is None:
            return self._err(503, 'blender not found on this machine')
        n = int(self.headers.get('Content-Length', 0))
        if n <= 0 or n > MAX_BODY:
            return self._err(400, 'bad Content-Length')
        body = self.rfile.read(n)
        q = {k: v[0] for k, v in parse_qs(u.query).items()}
        tmp = tempfile.mkdtemp(prefix='dcforge_')
        try:
            src = os.path.join(tmp, 'in.ply')
            with open(src, 'wb') as f:
                f.write(body)
            if ep == 'intake':
                dst = os.path.join(tmp, 'out.ply')
                a = ['--in', src, '--out', dst,
                     '--remesh', q.get('remesh', 'none'),
                     '--target-faces', q.get('target_faces', '30000'),
                     '--voxel-size', q.get('voxel_size', '0.02'),
                     '--merge-dist', q.get('merge_dist', '0.0001')]
                receipt, _ = run_engine(ENGINES[ep], a)
                with open(dst, 'rb') as f:
                    self._send(200, f.read(), 'application/octet-stream', receipt)
            elif ep == 'rings':
                dst = os.path.join(tmp, 'out.ply')
                a = ['--in', src, '--out', dst, '--rings', q.get('rings', '3')]
                receipt, _ = run_engine(ENGINES[ep], a)
                with open(dst, 'rb') as f:
                    self._send(200, f.read(), 'application/octet-stream', receipt)
            else:  # bake
                outdir = os.path.join(tmp, 'bake')
                name = ''.join(ch for ch in q.get('name', 'asset')
                               if ch.isalnum() or ch in '-_') or 'asset'
                a = ['--in', src, '--outdir', outdir,
                     '--res', q.get('res', '1024'),
                     '--ao', q.get('ao', '0'),
                     '--ao-rays', q.get('ao_rays', '24'),
                     '--margin', q.get('margin', '4'),
                     '--name', name]
                receipt, _ = run_engine(ENGINES[ep], a, timeout=1800)
                zpath = os.path.join(tmp, name + '_bake.zip')
                with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED) as z:
                    for fn in sorted(os.listdir(outdir)):
                        z.write(os.path.join(outdir, fn), fn)
                with open(zpath, 'rb') as f:
                    self._send(200, f.read(), 'application/zip', receipt)
        except subprocess.TimeoutExpired:
            self._err(504, 'engine timed out')
        except Exception as e:
            self._err(500, str(e)[:2000])
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def log_message(self, fmt, *args):
        sys.stderr.write('[dcforge] ' + fmt % args + '\n')

if __name__ == '__main__':
    print('DC FORGE DAEMON on localhost:%d' % PORT)
    print('  blender: %s' % (BLENDER or 'NOT FOUND — set DC_BLENDER or --blender'))
    for k, v in ENGINES.items():
        print('  /%s -> %s %s' % (k, v,
              'OK' if os.path.isfile(os.path.join(HERE, v)) else 'MISSING'))
    print('  origin lock: %s   Ctrl+C to stop' % ORIGIN)
    ThreadingHTTPServer(('localhost', PORT), Handler).serve_forever()
