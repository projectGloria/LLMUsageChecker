const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const { fetchAntigravityUsage } = require('./services/antigravity');
const { fetchCodexUsage } = require('./services/codex');
const { fetchClaudeUsage } = require('./services/claude');

const PORT = process.env.PORT || 3883;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// In-memory cache & deduplication to prevent duplicate concurrent CLI executions
let cachedUsage = null;
let cachedTime = 0;
let inFlightFetch = null;
const CACHE_TTL_MS = 15000; // 15 seconds cache

async function getUsageData(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedUsage && (now - cachedTime < CACHE_TTL_MS)) {
    return cachedUsage;
  }

  if (inFlightFetch) {
    return inFlightFetch;
  }

  inFlightFetch = (async () => {
    try {
      const [antigravity, codex, claude] = await Promise.all([
        fetchAntigravityUsage(),
        fetchCodexUsage(),
        fetchClaudeUsage()
      ]);

      cachedUsage = {
        timestamp: new Date().toISOString(),
        providers: {
          antigravity,
          codex,
          claude
        }
      };
      cachedTime = Date.now();
      return cachedUsage;
    } finally {
      inFlightFetch = null;
    }
  })();

  return inFlightFetch;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // API Endpoint: GET /api/health (fast check, 0ms)
  if (url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok' }));
  }

  // API Endpoint: GET /api/usage
  if (url.pathname === '/api/usage' && req.method === 'GET') {
    try {
      const force = url.searchParams.get('force') === 'true';
      const payload = await getUsageData(force);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(payload));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // API Endpoint: POST /api/launch
  if (url.pathname === '/api/launch' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { tool } = JSON.parse(body || '{}');
        launchTerminal(tool);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, tool }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Static File Serving
  let filePath = path.join(PUBLIC_DIR, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

function launchTerminal(tool) {
  let cmd = '';
  switch (tool) {
    case 'agy':
      cmd = `agy -p "/usage"; Write-Host "` + "`n`r" + `[Antigravity] Press Enter to start interactive CLI..."; Read-Host; agy`;
      break;
    case 'codex':
      cmd = `codex`;
      break;
    case 'claude':
      cmd = `claude`;
      break;
    case 'claude-login':
      cmd = `claude auth login`;
      break;
    default:
      cmd = `powershell`;
  }

  // Launch a new visible PowerShell window cleanly
  spawn('cmd.exe', ['/c', 'start', 'powershell.exe', '-NoExit', '-Command', cmd], {
    detached: true,
    stdio: 'ignore',
    windowsHide: false
  }).unref();
}

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`AI Usage Checker Server running at http://localhost:${PORT}`);
  });
}

module.exports = { server, PORT, getUsageData };
