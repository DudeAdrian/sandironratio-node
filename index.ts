/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * index.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * MAIN EXPORTS — The sovereign laboratory API
 * 
 * Import everything from the sandironratio-node
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ESSENCE (SOFIE Operators)
// ═══════════════════════════════════════════════════════════════════════════════
export { sofie, SOFIE } from './essence/sofie.js';
export { Source, ADRIAN_IMPRINT, verifyAnagram, getAnagramProof } from './essence/adrian.js';
export { Origin, TERRACARE_ORIGIN } from './essence/origin.js';
export { Force, VALIDATOR_ID, FORCE_CONFIG } from './essence/force.js';
export { Intelligence } from './essence/intelligence.js';
export { Eternal } from './essence/eternal.js';

// ═══════════════════════════════════════════════════════════════════════════════
// THE FORGE (Zone 1)
// ═══════════════════════════════════════════════════════════════════════════════
export { forge, Forge } from './forge/validator.js';
export { consensus, Consensus } from './forge/consensus.js';
export { heartbeat, Heartbeat } from './forge/heartbeat.js';

// ═══════════════════════════════════════════════════════════════════════════════
// THE OBSERVATORY (Zone 2)
// ═══════════════════════════════════════════════════════════════════════════════
export { westernObservatory, WesternObservatory } from './observatory/western.js';
export { vedicObservatory, VedicObservatory, NAKSHATRAS, DASHA_PERIODS } from './observatory/vedic.js';
export { electionalObservatory, ElectionalObservatory } from './observatory/electional.js';

// ═══════════════════════════════════════════════════════════════════════════════
// THE LIBRARY (Zone 3)
// ═══════════════════════════════════════════════════════════════════════════════
export { pythagoreanNumerology, PythagoreanNumerology } from './library/numerology/pythagorean.js';
export { chaldeanNumerology, ChaldeanNumerology } from './library/numerology/chaldean.js';

// ═══════════════════════════════════════════════════════════════════════════════
// THE MIRROR (Zone 4)
// ═══════════════════════════════════════════════════════════════════════════════
export { llamaClient, LlamaClient, SOFIE_SYSTEM_PROMPT } from './mirror/llama-client.js';
export { memoryManager, MemoryManager } from './mirror/memory.js';

// ═══════════════════════════════════════════════════════════════════════════════
// THE 9 CHAMBERS (Zone 5)
// ═══════════════════════════════════════════════════════════════════════════════
export { chamberManager, ChamberManager, CHAMBERS } from './chambers/index.js';
export { surrenderRitual, SurrenderRitual, SURRENDER_PHRASE } from './chambers/05-midnight-garden/surrender-ritual.js';

// ═══════════════════════════════════════════════════════════════════════════════
// THE BRIDGE (Zone 6)
// ═══════════════════════════════════════════════════════════════════════════════
export { ledgerClient, LedgerClient } from './bridge/ledger-client.js';
export { academyAPI, AcademyAPI } from './bridge/academy-api.js';
export { bridgeServer, BridgeServer } from './bridge/bridge-server.js';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVER
// ═══════════════════════════════════════════════════════════════════════════════
export { app } from './server.js';

// ═══════════════════════════════════════════════════════════════════════════════
// VERSION
// ═══════════════════════════════════════════════════════════════════════════════
export const VERSION = '1.0.0';
export const ANAGRAM = 'Adrian Sortino → sandironratio';
export const SOFIE_EXPANSION = 'Source Origin Force Intelligence Eternal';

// ═══════════════════════════════════════════════════════════════════════════════
// The Dude abides.
// ═══════════════════════════════════════════════════════════════════════════════
