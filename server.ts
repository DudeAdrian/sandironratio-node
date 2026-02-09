/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * server.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * MAIN SERVER — The sovereign laboratory unified
 * 
 * Fastify HTTP/2 server bringing together all 7 zones:
 * 1. The Forge — Block validation metrics
 * 2. The Observatory — Astrology API
 * 3. The Library — Knowledge endpoints
 * 4. The Mirror — SOFIE chat API
 * 5. The 9 Chambers — Academy progression
 * 6. The Bridge — Terracare interface
 * 7. The Hives — 10-Hive geographic consensus network
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
import chamberManager from './chambers/index.js';
import { surrenderRitual } from './chambers/05-midnight-garden/surrender-ritual.js';
import academyAPI from './bridge/academy-api.js';
import bridgeServer from './bridge/bridge-server.js';
import { hexStore } from './db/hex-store.js';
import { hexChamberManager } from './chambers/hex-chamber-manager.js';
import { getHiveStatusSummary, getHive, HIVES, MIGRATION_THRESHOLD } from './config/hives.js';

/**
 * Create Fastify server
 */
const useHTTPS = process.env.USE_HTTPS === 'true';

const app = Fastify({
  logger: true,
  http2: useHTTPS,
  ...(useHTTPS ? {
    https: {
      key: readFileSync(join(process.cwd(), 'ssl', 'key.pem')),
      cert: readFileSync(join(process.cwd(), 'ssl', 'cert.pem'))
    }
  } : {})
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
  // ZONE 7: THE HIVES (10-Hive Geographic Consensus Network)
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Get all hive status
  app.get('/api/hives/status', async () => ({
    hives: getHiveStatusSummary(),
    migrationThreshold: MIGRATION_THRESHOLD,
    totalAgents: HIVES.reduce((sum, h) => sum + h.current, 0),
    consensusMechanism: '66% neighbor wall alignment',
    walls: {
      n: { name: 'Nourishment', value: 5 },
      ne: { name: 'Creation', value: 15 },
      se: { name: 'Service', value: 3 },
      s: { name: 'Transparency', value: 10 },
      sw: { name: 'Guard', value: 20 },
      nw: { name: 'Attunement', value: 8 }
    }
  }));

  // Get specific chamber details
  app.get('/api/hives/:hive_id/chambers/:address', async (request) => {
    const { hive_id, address } = request.params as any;
    const chamber = hexStore.getChamberByAddress(address);
    
    if (!chamber || chamber.hive_id !== parseInt(hive_id)) {
      return { error: 'Chamber not found', address };
    }
    
    const neighbors = hexChamberManager.getNeighbors(address);
    const consensus = hexChamberManager.calculateChamberConsensus(address);
    const agents = hexStore.getAgentsInChamber(chamber.id);
    
    return {
      chamber: {
        address: chamber.address,
        hive_id: chamber.hive_id,
        walls: {
          n: chamber.wall_n,
          ne: chamber.wall_ne,
          se: chamber.wall_se,
          s: chamber.wall_s,
          sw: chamber.wall_sw,
          nw: chamber.wall_nw
        },
        consensus_reached: chamber.consensus_reached,
        last_consensus_at: chamber.last_consensus_at
      },
      neighbors: neighbors.map(n => ({
        address: n.address,
        direction: n.direction
      })),
      consensus: {
        alignment: consensus.alignment,
        matching_neighbors: consensus.matchingNeighbors,
        is_aligned: consensus.alignment >= 66
      },
      agents: agents.map(a => ({
        agent_id: a.agent_id,
        bee_role: a.bee_role,
        nectar_balance: a.nectar_balance,
        graduation_level: a.graduation_level
      }))
    };
  });

  // Graduate an agent from Level 1 (shadow) to Level 2 (confirmed)
  app.post('/api/nectar/graduate', async (request) => {
    const { agent_id, proof_hash } = request.body as any;
    
    if (!agent_id) {
      return { error: 'agent_id required' };
    }
    
    const agent = hexStore.getAgent(agent_id);
    if (!agent) {
      return { error: 'Agent not found' };
    }
    
    if (agent.graduation_level !== 1) {
      return { error: 'Agent already graduated or invalid level' };
    }
    
    const result = hexStore.graduateAgent(agent_id);
    
    if (result.success) {
      // Mint the shadow nectar to confirmed balance
      // This would integrate with the actual Nectar contract
      return {
        success: true,
        agent_id,
        graduated_to_level: 2,
        nectar_minted: agent.shadow_nectar,
        message: 'Shadow Nectar crystallized into confirmed balance'
      };
    }
    
    return { error: 'Graduation failed' };
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // ZONE 8: GOD MODE (Jarvis Bridge - DudeAdrian Admin Control)
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Import Jarvis Bridge
  const { getJarvisBridge } = await import('./bridge/jarvis-bridge.js');
  const jarvisBridge = getJarvisBridge();
  await jarvisBridge.initialize();
  
  // Get repository manifest
  app.get('/api/admin/manifest', async () => ({
    owner: 'DudeAdrian',
    repositories: jarvisBridge.getRepositories(),
    god_mode: true,
    jarvis_connected: jarvisBridge['isConnected']
  }));
  
  // Get repository status via Jarvis
  app.get('/api/admin/repos/:name/status', async (request) => {
    const { name } = request.params as any;
    const status = await jarvisBridge.getRepoStatus(name);
    return status || { error: 'Repository not found or Jarvis unavailable' };
  });
  
  // Execute voice/command via Jarvis
  app.post('/api/admin/command', async (request) => {
    const { command, god_mode = false, context } = request.body as any;
    
    if (!command) {
      return { error: 'command required' };
    }
    
    // SPECIAL COMMAND: convene_council (SOFIE GOD MODE)
    if (command === 'convene_council' && god_mode) {
      console.log(`\n🔷 [ GOD MODE ] SOFIE convening council via voice command\n`);
      
      try {
        const result = await sofie.conveneCouncil();
        
        // Log to HEX ledger (immediate transparency)
        hexStore.logConsensus(1, 0, JSON.stringify({
          type: 'council_convening',
          command: 'convene_council',
          godMode: true,
          success: result.success,
          phase: result.councilStatus.phase,
          agentsReady: result.councilStatus.agentsReady,
          terracareLedgerId: result.terracareLedger?.transactionId,
          timestamp: new Date().toISOString()
        }), 100);
        
        return {
          success: result.success,
          message: result.message,
          council: result.councilStatus,
          ledger: result.terracareLedger,
          godMode: true
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Council convening failed',
          godMode: true
        };
      }
    }
    
    // Regular Jarvis command
    const result = await jarvisBridge.sendCommand(command, false);
    
    // Log to ledger
    hexStore.logConsensus(1, 0, JSON.stringify({
      type: 'admin_command',
      command,
      result: result.success,
      timestamp: new Date().toISOString()
    }), 100);
    
    return result;
  });
  
  // Check Admin voice enrollment
  app.get('/api/admin/voice/enrolled', async () => {
    const enrolled = await jarvisBridge.isAdminEnrolled();
    return {
      admin_enrolled: enrolled,
      message: enrolled ? 'Admin voice enrolled' : 'Admin voice enrollment required'
    };
  });
  
  // Get Jarvis status
  app.get('/api/admin/jarvis/status', async () => {
    return await jarvisBridge.getJarvisStatus();
  });
  
  // Daily briefing
  app.get('/api/admin/briefing', async () => {
    const briefing = await jarvisBridge.generateDailyBriefing();
    return { briefing };
  });

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
    
    const protocol = useHTTPS ? 'https' : 'http';
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         SERVER READY                                          ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   🌐 ${useHTTPS ? 'HTTP/2' : 'HTTP'}:      ${protocol}://localhost:${port}                                    ║
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
║   GET  /api/hives/status          — 10-Hive network status                    ║
║   GET  /api/hives/:id/chambers/:addr — Chamber details                        ║
║   POST /api/nectar/graduate       — Graduate shadow to confirmed              ║
║   🔴 GOD MODE (DudeAdrian):                                                    ║
║   GET  /api/admin/manifest        — Repository manifest                       ║
║   GET  /api/admin/repos/:name/status — Repository status via Jarvis           ║
║   POST /api/admin/command         — Execute voice/command                     ║
║   GET  /api/admin/jarvis/status   — Jarvis AI status                          ║
║   GET  /api/admin/briefing        — Daily briefing                            ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
    `);
    
    console.log(`\n✨ The Dude abides. All 8 zones unified. God Mode Active.\n`);
    
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
