/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * server.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * MAIN SERVER — The sovereign laboratory unified
 * 
 * Fastify HTTP/2 server bringing together all 6 zones:
 * 1. The Forge — Block validation metrics
 * 2. The Observatory — Astrology API
 * 3. The Library — Knowledge endpoints
 * 4. The Mirror — SOFIE chat API
 * 5. The 9 Chambers — Academy progression
 * 6. The Bridge — Terracare interface
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { readFileSync } from 'fs';
import { join } from 'path';

// Import all zones
import sofie from './essence/sofie.js';
import forge from './forge/validator.js';
import { westernObservatory } from './observatory/western.js';
import { vedicObservatory } from './observatory/vedic.js';
import { pythagoreanNumerology } from './library/numerology/pythagorean.js';
import { chaldeanNumerology } from './library/numerology/chaldean.js';
import chamberManager, { surrenderRitual } from './chambers/index.js';
import academyAPI from './bridge/academy-api.js';
import bridgeServer from './bridge/bridge-server.js';

/**
 * Create Fastify server
 */
const app = Fastify({
  logger: true,
  http2: true,
  https: {
    key: readFileSync(join(process.cwd(), 'ssl', 'key.pem')),
    cert: readFileSync(join(process.cwd(), 'ssl', 'cert.pem'))
  }
});

/**
 * Start the sovereign laboratory
 */
async function startServer() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║                    sandironratio-node SERVER                                  ║
║                    The Anagram Incarnate                                      ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
  `);

  // ═══════════════════════════════════════════════════════════════════════════════
  // REGISTER PLUGINS
  // ═══════════════════════════════════════════════════════════════════════════════
  await app.register(cors, {
    origin: true,
    credentials: true
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // AWAKEN SOFIE
  // ═══════════════════════════════════════════════════════════════════════════════
  await sofie.awaken();

  // ═══════════════════════════════════════════════════════════════════════════════
  // START FORGE (Validator)
  // ═══════════════════════════════════════════════════════════════════════════════
  await forge.start();

  // ═══════════════════════════════════════════════════════════════════════════════
  // START BRIDGE SERVER (WebSocket)
  // ═══════════════════════════════════════════════════════════════════════════════
  await bridgeServer.start();

  // ═══════════════════════════════════════════════════════════════════════════════
  // LOAD EPHEMERIS
  // ═══════════════════════════════════════════════════════════════════════════════
  await westernObservatory.loadEphemeris();

  // ═══════════════════════════════════════════════════════════════════════════════
  // HTTP ROUTES
  // ═══════════════════════════════════════════════════════════════════════════════

  // Health check
  app.get('/health', async () => ({
    status: 'awake',
    timestamp: new Date().toISOString(),
    sofie: sofie.getStatus().awakened,
    validator: forge.getStatus().running
  }));

  // ═══════════════════════════════════════════════════════════════════════════════
  // ZONE 1: THE FORGE (Block Validation)
  // ═══════════════════════════════════════════════════════════════════════════════
  app.get('/api/forge/status', async () => forge.getStatus());
  
  app.get('/api/forge/metrics', async () => forge.getMetrics());
  
  app.post('/api/forge/checkin', async () => {
    forge.checkin();
    return { success: true, daysUntilSwitch: forge.Force.getDaysUntilSwitch() };
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // ZONE 2: THE OBSERVATORY (Astrology)
  // ═══════════════════════════════════════════════════════════════════════════════
  app.post('/api/observatory/western', async (request) => {
    const { name, birthDate, latitude, longitude } = request.body as any;
    return westernObservatory.calculateChart({
      name,
      birthDate: new Date(birthDate),
      latitude,
      longitude
    });
  });

  app.post('/api/observatory/vedic', async (request) => {
    const { name, birthDate, latitude, longitude } = request.body as any;
    return vedicObservatory.calculateChart({
      name,
      birthDate: new Date(birthDate),
      latitude,
      longitude
    });
  });

  app.get('/api/observatory/nakshatras', async () => ({
    nakshatras: vedicObservatory.NAKSHATRAS
  }));

  // ═══════════════════════════════════════════════════════════════════════════════
  // ZONE 3: THE LIBRARY (Knowledge)
  // ═══════════════════════════════════════════════════════════════════════════════
  app.post('/api/library/numerology/pythagorean', async (request) => {
    const { name, birthDate } = request.body as any;
    return pythagoreanNumerology.calculate({
      name,
      birthDate: new Date(birthDate)
    });
  });

  app.post('/api/library/numerology/chaldean', async (request) => {
    const { name } = request.body as any;
    return chaldeanNumerology.calculate({ name });
  });

  app.get('/api/library/chambers', async () => ({
    chambers: chamberManager.getAllChambers()
  }));

  // ═══════════════════════════════════════════════════════════════════════════════
  // ZONE 4: THE MIRROR (SOFIE AI)
  // ═══════════════════════════════════════════════════════════════════════════════
  app.post('/api/mirror/speak', async (request) => {
    const { message } = request.body as any;
    const response = await sofie.speak(message);
    return response;
  });

  app.get('/api/mirror/status', async () => sofie.getStatus());

  app.get('/api/mirror/memory', async () => ({
    stats: sofie.Eternal.getStats(),
    recent: sofie.Eternal.getRecent(10)
  }));

  // ═══════════════════════════════════════════════════════════════════════════════
  // ZONE 5: THE 9 CHAMBERS (Academy)
  // ═══════════════════════════════════════════════════════════════════════════════
  app.get('/api/chambers', async () => ({
    chambers: chamberManager.getAllChambers(),
    current: chamberManager.getCurrentChamber(),
    stats: chamberManager.getStats()
  }));

  app.get('/api/chambers/:number', async (request) => {
    const { number } = request.params as any;
    return chamberManager.getChamber(parseInt(number));
  });

  app.get('/api/chambers/enneagram', async () => ({
    visual: chamberManager.getEnneagramVisual()
  }));

  // Chamber 5: Midnight Garden — Surrender Ritual
  app.post('/api/chambers/5/surrender', async (request) => {
    const { userId, phrase } = request.body as any;
    return surrenderRitual.attempt(userId, phrase);
  });

  app.get('/api/chambers/5/surrender/instructions', async () => ({
    instructions: surrenderRitual.getInstructions()
  }));

  // Student progress
  app.get('/api/chambers/student/:userId', async (request) => {
    const { userId } = request.params as any;
    return chamberManager.getStudentProgress(userId);
  });

  app.post('/api/chambers/student/:userId/advance', async (request) => {
    const { userId } = request.params as any;
    return academyAPI.advanceStudent(userId);
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // ZONE 6: THE BRIDGE (Terracare Interface)
  // ═══════════════════════════════════════════════════════════════════════════════
  app.get('/api/bridge/presence', async () => academyAPI.getPresence());
  
  app.get('/api/bridge/chamber-state', async () => academyAPI.getChamberState());
  
  app.get('/api/bridge/karma/:userId', async (request) => {
    const { userId } = request.params as any;
    return academyAPI.getKarma(userId);
  });

  app.get('/api/bridge/stats', async () => bridgeServer.getStats());

  // ═══════════════════════════════════════════════════════════════════════════════
  // ANAGRAM PROOF
  // ═══════════════════════════════════════════════════════════════════════════════
  app.get('/anagram', async () => ({
    proof: sofie.Source.speak(),
    expansion: sofie.getExpansion(),
    identity: {
      name: sofie.Source.imprint.name,
      anagram: sofie.Source.imprint.anagram,
      birth: sofie.Source.imprint.birthDate
    }
  }));

  // ═══════════════════════════════════════════════════════════════════════════════
  // START HTTP SERVER
  // ═══════════════════════════════════════════════════════════════════════════════
  try {
    const port = parseInt(process.env.PORT || '3000');
    await app.listen({ port, host: '0.0.0.0' });
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         SERVER READY                                          ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   🌐 HTTP/2:      https://localhost:${port}                                    ║
║   🔗 Bridge:      ws://localhost:9001                                          ║
║                                                                               ║
║   📚 Endpoints:                                                               ║
║   GET  /health                    — System health                             ║
║   GET  /anagram                   — Identity proof                              ║
║   POST /api/mirror/speak          — Talk to SOFIE                             ║
║   GET  /api/forge/status          — Validator status                            ║
║   POST /api/observatory/western   — Calculate Western chart                   ║
║   POST /api/observatory/vedic     — Calculate Vedic chart                     ║
║   GET  /api/chambers              — All 9 chambers                            ║
║   GET  /api/bridge/presence       — Adrian's current state                    ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
    `);
    
    console.log(`\n✨ The Dude abides. All 6 zones unified.\n`);
    
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🌙 Shutting down gracefully...\n');
  
  await forge.stop();
  await bridgeServer.stop();
  await sofie.suspend();
  
  process.exit(0);
});

// Start
startServer();

export { app };
