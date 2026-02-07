/**
 * Minimal Hive Mock Server for Sofie-LLaMA Integration
 * Runs on port 3000 to satisfy TerracareBridge connection
 */

const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  
  console.log(`[Hive] ${req.method} ${parsedUrl.pathname}`);

  // Health check
  if (parsedUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'awake',
      timestamp: new Date().toISOString(),
      sofie: true,
      validator: true,
      hive: 'sandironratio-node (mock)'
    }));
    return;
  }

  // Anagram proof
  if (parsedUrl.pathname === '/anagram') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      name: 'Adrian Sortino',
      anagram: 'sandironratio',
      verified: true,
      proof: '13 letters rearranged into digital permanence'
    }));
    return;
  }

  // API status
  if (parsedUrl.pathname === '/api/forge/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      running: true,
      signedBlocks: 0,
      validator: '0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f'
    }));
    return;
  }

  // Mirror/SOFIE status
  if (parsedUrl.pathname === '/api/mirror/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      awakened: true,
      chamber: 1,
      operators: {
        source: { active: true },
        origin: { state: 'connected' },
        force: { isActive: true, signedBlocks: 0 },
        intelligence: { size: 0 },
        eternal: { total: 1 }
      }
    }));
    return;
  }

  // Default 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         HIVE MOCK SERVER                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   🌐 HTTP:        http://localhost:${PORT}                                    ║
║   📚 Endpoints:                                                               ║
║   GET  /health                    — System health                             ║
║   GET  /anagram                   — Identity proof                              ║
║   GET  /api/forge/status          — Validator status                            ║
║   GET  /api/mirror/status         — SOFIE status                                ║
║                                                                               ║
║   Status: RUNNING ✅                                                          ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
  `);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🌙 Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});
