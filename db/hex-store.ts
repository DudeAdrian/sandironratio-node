/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * db/hex-store.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * HEXAGONAL HIVE DATABASE — SQLite with better-sqlite3
 * 
 * Chambers: 144,000 per hive in hexagonal close packing
 * Pollen Agents: With bee roles and nectar balances
 * Consensus: Geometric wall alignment tracking
 * Migration: The Great Migration event log
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import Database from 'better-sqlite3';
import { EventEmitter } from 'events';
import { CHAMBERS_PER_HIVE } from '../config/hives.js';

export interface Chamber {
  id: number;
  hive_id: number;
  chamber_address: string; // format: "hive:lifePath.latHash.lonHash"
  life_path: number;
  lat_hash: string;
  lon_hash: string;
  wall_n: number; // 0=closed, 1=open
  wall_ne: number;
  wall_se: number;
  wall_s: number;
  wall_sw: number;
  wall_nw: number;
  occupant_count: number;
  last_consensus: string | null;
  created_at: string;
}

export interface PollenAgent {
  agent_id: string;
  user_id: string;
  hive_id: number;
  chamber_id: number | null;
  bee_role: 'scout' | 'worker' | 'nurse' | 'guard' | 'queen' | null;
  nectar_balance: number;
  shadow_nectar: number;
  graduation_level: number; // 1=custodial, 2=connected, 3=sovereign
  last_ping: string | null;
  geolat: number | null;
  geolon: number | null;
  created_at: string;
}

export interface ConsensusLog {
  id: number;
  hive_id: number;
  chamber_id: number;
  wall_pattern: string; // binary 6-digit string e.g., "101010"
  alignment_percentage: number;
  block_hash: string | null;
  timestamp: string;
}

export interface MigrationRecord {
  id: number;
  agent_id: string;
  from_hive: number;
  to_hive: number;
  from_chamber: number;
  to_chamber: number;
  migrated_at: string;
  ledger_tx_hash: string | null;
}

/**
 * Hexagonal Database Manager
 */
export class HexStore extends EventEmitter {
  private db: Database.Database | null = null;
  private dbPath: string = './data/hive-hex.db';
  private isInitialized: boolean = false;
  
  /**
   * Initialize database and create tables
   */
  initialize(): boolean {
    try {
      console.log(`[HEX-STORE] Initializing SQLite at ${this.dbPath}...`);
      
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL'); // Write-ahead logging for performance
      
      this.createTables();
      this.isInitialized = true;
      
      console.log(`[HEX-STORE] ✓ Database ready`);
      this.emit('initialized');
      return true;
      
    } catch (error) {
      console.error(`[HEX-STORE] Initialization failed:`, error);
      this.emit('error', error);
      return false;
    }
  }
  
  /**
   * Create database schema
   */
  private createTables(): void {
    if (!this.db) return;
    
    // Chambers: Hexagonal grid 144k per hive
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chambers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hive_id INTEGER NOT NULL,
        chamber_address TEXT UNIQUE NOT NULL,
        life_path INTEGER,
        lat_hash TEXT,
        lon_hash TEXT,
        wall_n INTEGER DEFAULT 0,
        wall_ne INTEGER DEFAULT 0,
        wall_se INTEGER DEFAULT 0,
        wall_s INTEGER DEFAULT 0,
        wall_sw INTEGER DEFAULT 0,
        wall_nw INTEGER DEFAULT 0,
        occupant_count INTEGER DEFAULT 0,
        last_consensus TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_chambers_hive ON chambers(hive_id);
      CREATE INDEX IF NOT EXISTS idx_chambers_address ON chambers(chamber_address);
      CREATE INDEX IF NOT EXISTS idx_chambers_lifepath ON chambers(life_path);
    `);
    
    // Pollen Agents
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pollen_agents (
        agent_id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        hive_id INTEGER DEFAULT 1,
        chamber_id INTEGER,
        bee_role TEXT CHECK(bee_role IN ('scout','worker','nurse','guard','queen')),
        nectar_balance REAL DEFAULT 0,
        shadow_nectar REAL DEFAULT 0,
        graduation_level INTEGER DEFAULT 1,
        last_ping DATETIME,
        geolat REAL,
        geolon REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chamber_id) REFERENCES chambers(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_agents_hive ON pollen_agents(hive_id);
      CREATE INDEX IF NOT EXISTS idx_agents_chamber ON pollen_agents(chamber_id);
      CREATE INDEX IF NOT EXISTS idx_agents_user ON pollen_agents(user_id);
    `);
    
    // Consensus Log
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS consensus_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hive_id INTEGER NOT NULL,
        chamber_id INTEGER NOT NULL,
        wall_pattern TEXT,
        alignment_percentage REAL,
        block_hash TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_consensus_hive ON consensus_log(hive_id);
      CREATE INDEX IF NOT EXISTS idx_consensus_chamber ON consensus_log(chamber_id);
      CREATE INDEX IF NOT EXISTS idx_consensus_time ON consensus_log(timestamp);
    `);
    
    // Migration Registry
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migration_registry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT NOT NULL,
        from_hive INTEGER NOT NULL,
        to_hive INTEGER NOT NULL,
        from_chamber INTEGER NOT NULL,
        to_chamber INTEGER NOT NULL,
        migrated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ledger_tx_hash TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_migration_agent ON migration_registry(agent_id);
      CREATE INDEX IF NOT EXISTS idx_migration_from ON migration_registry(from_hive);
    `);
    
    console.log(`[HEX-STORE] ✓ Tables created`);
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // CHAMBER OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  /**
   * Create a new chamber
   */
  createChamber(hiveId: number, address: string, lifePath: number, latHash: string, lonHash: string): number {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      INSERT INTO chambers (hive_id, chamber_address, life_path, lat_hash, lon_hash)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(hiveId, address, lifePath, latHash, lonHash);
    return result.lastInsertRowid as number;
  }
  
  /**
   * Get chamber by address
   */
  getChamberByAddress(address: string): Chamber | undefined {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM chambers WHERE chamber_address = ?');
    return stmt.get(address) as Chamber | undefined;
  }
  
  /**
   * Get chamber by ID
   */
  getChamberById(id: number): Chamber | undefined {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM chambers WHERE id = ?');
    return stmt.get(id) as Chamber | undefined;
  }
  
  /**
   * Update wall state
   */
  updateWallState(chamberId: number, walls: { n: number; ne: number; se: number; s: number; sw: number; nw: number }): void {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      UPDATE chambers 
      SET wall_n = ?, wall_ne = ?, wall_se = ?, wall_s = ?, wall_sw = ?, wall_nw = ?
      WHERE id = ?
    `);
    
    stmt.run(walls.n, walls.ne, walls.se, walls.s, walls.sw, walls.nw, chamberId);
    this.emit('wallUpdated', chamberId, walls);
  }
  
  /**
   * Get wall pattern as binary string
   */
  getWallPattern(chamberId: number): string {
    const chamber = this.getChamberById(chamberId);
    if (!chamber) return '000000';
    
    return `${chamber.wall_n}${chamber.wall_ne}${chamber.wall_se}${chamber.wall_s}${chamber.wall_sw}${chamber.wall_nw}`;
  }
  
  /**
   * Increment occupant count
   */
  incrementOccupants(chamberId: number): void {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('UPDATE chambers SET occupant_count = occupant_count + 1 WHERE id = ?');
    stmt.run(chamberId);
  }
  
  /**
   * Get chamber count for hive
   */
  getChamberCount(hiveId: number): number {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM chambers WHERE hive_id = ?');
    const result = stmt.get(hiveId) as { count: number };
    return result.count;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // POLLEN AGENT OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  /**
   * Create new Pollen agent
   */
  createAgent(agentId: string, userId: string, hiveId: number, chamberId: number, beeRole: string, geolat?: number, geolon?: number): void {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      INSERT INTO pollen_agents (agent_id, user_id, hive_id, chamber_id, bee_role, geolat, geolon)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(agentId, userId, hiveId, chamberId, beeRole, geolat ?? null, geolon ?? null);
    
    // Increment occupant count
    this.incrementOccupants(chamberId);
    
    this.emit('agentCreated', agentId);
  }
  
  /**
   * Get agent by ID
   */
  getAgent(agentId: string): PollenAgent | undefined {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM pollen_agents WHERE agent_id = ?');
    return stmt.get(agentId) as PollenAgent | undefined;
  }
  
  /**
   * Get agent by user ID
   */
  getAgentByUser(userId: string): PollenAgent | undefined {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM pollen_agents WHERE user_id = ?');
    return stmt.get(userId) as PollenAgent | undefined;
  }
  
  /**
   * Get all agents in a chamber
   */
  getAgentsInChamber(chamberId: number): PollenAgent[] {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM pollen_agents WHERE chamber_id = ?');
    return stmt.all(chamberId) as PollenAgent[];
  }
  
  /**
   * Update agent ping
   */
  updateAgentPing(agentId: string): void {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('UPDATE pollen_agents SET last_ping = CURRENT_TIMESTAMP WHERE agent_id = ?');
    stmt.run(agentId);
  }
  
  /**
   * Update agent chamber (migration)
   */
  updateAgentChamber(agentId: string, hiveId: number, chamberId: number): void {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('UPDATE pollen_agents SET hive_id = ?, chamber_id = ? WHERE agent_id = ?');
    stmt.run(hiveId, chamberId, agentId);
  }
  
  /**
   * Add shadow nectar
   */
  addShadowNectar(agentId: string, amount: number): void {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('UPDATE pollen_agents SET shadow_nectar = shadow_nectar + ? WHERE agent_id = ?');
    stmt.run(amount, agentId);
  }
  
  /**
   * Graduate agent (Level 1→2)
   */
  graduateAgent(agentId: string): void {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      UPDATE pollen_agents 
      SET graduation_level = 2, 
          nectar_balance = nectar_balance + shadow_nectar,
          shadow_nectar = 0
      WHERE agent_id = ?
    `);
    
    stmt.run(agentId);
    this.emit('agentGraduated', agentId);
  }
  
  /**
   * Get agent count for hive
   */
  getAgentCount(hiveId: number): number {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM pollen_agents WHERE hive_id = ?');
    const result = stmt.get(hiveId) as { count: number };
    return result.count;
  }
  
  /**
   * Get total agents across all hives
   */
  getTotalAgentCount(): number {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM pollen_agents');
    const result = stmt.get() as { count: number };
    return result.count;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // CONSENSUS OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  /**
   * Log consensus event
   */
  logConsensus(hiveId: number, chamberId: number, wallPattern: string, alignmentPercentage: number, blockHash?: string): void {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      INSERT INTO consensus_log (hive_id, chamber_id, wall_pattern, alignment_percentage, block_hash)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(hiveId, chamberId, wallPattern, alignmentPercentage, blockHash ?? null);
    
    // Update chamber last_consensus
    const updateStmt = this.db.prepare('UPDATE chambers SET last_consensus = CURRENT_TIMESTAMP WHERE id = ?');
    updateStmt.run(chamberId);
    
    this.emit('consensusLogged', hiveId, chamberId, alignmentPercentage);
  }
  
  /**
   * Get recent consensus events
   */
  getRecentConsensus(hiveId: number, limit: number = 100): ConsensusLog[] {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      SELECT * FROM consensus_log 
      WHERE hive_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    
    return stmt.all(hiveId, limit) as ConsensusLog[];
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // MIGRATION OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  /**
   * Record migration event
   */
  recordMigration(agentId: string, fromHive: number, toHive: number, fromChamber: number, toChamber: number, txHash?: string): void {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      INSERT INTO migration_registry (agent_id, from_hive, to_hive, from_chamber, to_chamber, ledger_tx_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(agentId, fromHive, toHive, fromChamber, toChamber, txHash ?? null);
    this.emit('migrationRecorded', agentId, fromHive, toHive);
  }
  
  /**
   * Get migration history for agent
   */
  getAgentMigrations(agentId: string): MigrationRecord[] {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM migration_registry WHERE agent_id = ? ORDER BY migrated_at DESC');
    return stmt.all(agentId) as MigrationRecord[];
  }
  
  /**
   * Get all migrations
   */
  getAllMigrations(): MigrationRecord[] {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM migration_registry ORDER BY migrated_at DESC');
    return stmt.all() as MigrationRecord[];
  }
  
  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.isInitialized = false;
      console.log('[HEX-STORE] Database closed');
    }
  }
}

// Export singleton
export const hexStore = new HexStore();
export default hexStore;
