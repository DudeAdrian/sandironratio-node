/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * hive/hive-scaler.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * HIVE SCALER — The Great Migration Protocol
 * 
 * Triggers at 143,000 agents in Genesis Hive
 * Redistributes to 9 dormant Hives (~14,300 each)
 * Ledger anchors migration event
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';
import { 
  HIVES, 
  MIGRATION_THRESHOLD, 
  getHive, 
  activateDormantHives, 
  findNearestHive,
  getHiveStatusSummary 
} from '../config/hives.js';
import { hexStore, PollenAgent, MigrationRecord } from '../db/hex-store.js';
import { hexGrid, HexCoord } from '../db/hex-grid.js';

export interface MigrationPlan {
  agentId: string;
  fromHive: number;
  toHive: number;
  fromChamber: number;
  toChamber: number;
  distance: number;
}

export interface MigrationResult {
  success: boolean;
  migrated: number;
  failed: number;
  duration: number;
  ledgerTxHash?: string;
}

/**
 * Hive Scaler — Manages migration events
 */
export class HiveScaler extends EventEmitter {
  private isMigrating: boolean = false;
  private migrationQueue: MigrationPlan[] = [];
  
  /**
   * Check if migration should trigger
   */
  shouldMigrate(): boolean {
    const genesisCount = hexStore.getAgentCount(1);
    return genesisCount >= MIGRATION_THRESHOLD;
  }
  
  /**
   * Get migration readiness status
   */
  getMigrationStatus(): {
    genesisCount: number;
    threshold: number;
    shouldMigrate: boolean;
    isMigrating: boolean;
    dormantHives: number;
  } {
    return {
      genesisCount: hexStore.getAgentCount(1),
      threshold: MIGRATION_THRESHOLD,
      shouldMigrate: this.shouldMigrate(),
      isMigrating: this.isMigrating,
      dormantHives: HIVES.filter(h => h.status === 'dormant').length
    };
  }
  
  /**
   * Calculate migration plan
   * Redistributes 143,000 agents from Genesis to Hives 2-10
   */
  calculateMigrationPlan(): MigrationPlan[] {
    console.log(`[HIVE-SCALER] Calculating migration plan...`);
    
    const plans: MigrationPlan[] = [];
    
    // Get all agents in Genesis Hive
    // Note: In real implementation, query all agents from DB
    // For now, generate plan based on geographic proximity
    
    const activeHives = HIVES.filter(h => h.id !== 1); // Exclude Genesis
    const agentsPerHive = Math.floor(MIGRATION_THRESHOLD / activeHives.length);
    
    console.log(`[HIVE-SCALER] Target: ${agentsPerHive} agents per dormant Hive`);
    
    // Create balanced distribution plan
    let agentIndex = 0;
    
    for (const targetHive of activeHives) {
      for (let i = 0; i < agentsPerHive; i++) {
        // Calculate optimal chamber in target hive
        const chamberIndex = i % hexGrid.getTotalChambers();
        const hex = hexGrid.indexToHex(chamberIndex);
        
        plans.push({
          agentId: `agent_${agentIndex}`, // Placeholder - would use real agent IDs
          fromHive: 1,
          toHive: targetHive.id,
          fromChamber: 0, // Would be actual chamber
          toChamber: chamberIndex,
          distance: this.calculateDistance(1, targetHive.id)
        });
        
        agentIndex++;
      }
    }
    
    console.log(`[HIVE-SCALER] Migration plan: ${plans.length} agents`);
    return plans;
  }
  
  /**
   * Execute The Great Migration
   */
  async executeMigration(): Promise<MigrationResult> {
    if (this.isMigrating) {
      return { success: false, migrated: 0, failed: 0, duration: 0 };
    }
    
    if (!this.shouldMigrate()) {
      console.log(`[HIVE-SCALER] Migration threshold not reached`);
      return { success: false, migrated: 0, failed: 0, duration: 0 };
    }
    
    const startTime = Date.now();
    this.isMigrating = true;
    
    console.log(`\n╔═══════════════════════════════════════════════════════════════════════════════╗`);
    console.log(`║                                                                               ║`);
    console.log(`║                    🌍 THE GREAT MIGRATION 🌍                                  ║`);
    console.log(`║                                                                               ║`);
    console.log(`╚═══════════════════════════════════════════════════════════════════════════════╝\n`);
    
    this.emit('migrationStarted');
    
    try {
      // Step 1: Activate dormant Hives
      console.log(`[HIVE-SCALER] Activating dormant Hives...`);
      activateDormantHives();
      
      // Step 2: Calculate migration plan
      const plans = this.calculateMigrationPlan();
      this.migrationQueue = plans;
      
      // Step 3: Execute migrations in batches
      const batchSize = 1000;
      let migrated = 0;
      let failed = 0;
      
      for (let i = 0; i < plans.length; i += batchSize) {
        const batch = plans.slice(i, i + batchSize);
        const batchResult = await this.executeBatch(batch);
        
        migrated += batchResult.migrated;
        failed += batchResult.failed;
        
        // Progress update
        const progress = ((i + batch.length) / plans.length * 100).toFixed(1);
        console.log(`[HIVE-SCALER] Progress: ${progress}% (${migrated} migrated, ${failed} failed)`);
        
        this.emit('migrationProgress', { progress: parseFloat(progress), migrated, failed });
      }
      
      // Step 4: Ledger anchor
      const ledgerTxHash = await this.anchorToLedger(migrated);
      
      // Step 5: Update Genesis Hive status
      const genesisHive = getHive(1);
      if (genesisHive) {
        genesisHive.current = hexStore.getAgentCount(1);
      }
      
      const duration = Date.now() - startTime;
      
      console.log(`\n✅ [HIVE-SCALER] Migration complete!`);
      console.log(`   Migrated: ${migrated} agents`);
      console.log(`   Failed: ${failed} agents`);
      console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);
      console.log(`   Ledger TX: ${ledgerTxHash}\n`);
      
      this.emit('migrationComplete', { migrated, failed, duration });
      
      return {
        success: true,
        migrated,
        failed,
        duration,
        ledgerTxHash
      };
      
    } catch (error) {
      console.error(`[HIVE-SCALER] Migration failed:`, error);
      this.emit('migrationError', error);
      
      return {
        success: false,
        migrated: 0,
        failed: 0,
        duration: Date.now() - startTime
      };
      
    } finally {
      this.isMigrating = false;
      this.migrationQueue = [];
    }
  }
  
  /**
   * Execute a batch of migrations
   */
  private async executeBatch(batch: MigrationPlan[]): Promise<{ migrated: number; failed: number }> {
    let migrated = 0;
    let failed = 0;
    
    for (const plan of batch) {
      try {
        // In real implementation, would:
        // 1. Get agent from DB
        // 2. Create new chamber in target hive
        // 3. Transfer wall states
        // 4. Update agent record
        // 5. Record in migration_registry
        
        // Create target chamber
        const targetHive = getHive(plan.toHive);
        if (!targetHive) continue;
        
        const address = `${plan.toHive}:0.hex${plan.toChamber}.mig`;
        const newChamberId = hexStore.createChamber(
          plan.toHive,
          address,
          0, // life path would be from agent
          `mig${plan.toChamber}`,
          `hex${plan.toChamber}`
        );
        
        // Update agent
        hexStore.updateAgentChamber(plan.agentId, plan.toHive, newChamberId);
        
        // Record migration
        hexStore.recordMigration(
          plan.agentId,
          plan.fromHive,
          plan.toHive,
          plan.fromChamber,
          newChamberId
        );
        
        // Update hive counts
        targetHive.current++;
        
        migrated++;
        
      } catch (error) {
        console.warn(`[HIVE-SCALER] Failed to migrate ${plan.agentId}:`, error);
        failed++;
      }
    }
    
    return { migrated, failed };
  }
  
  /**
   * Anchor migration to Ledger
   */
  private async anchorToLedger(totalMigrated: number): Promise<string> {
    console.log(`[HIVE-SCALER] Anchoring to Ledger...`);
    
    // Placeholder: In real implementation, would:
    // 1. Create merkle root of all migrations
    // 2. Submit to Terracare Ledger
    // 3. Return transaction hash
    
    const merkleRoot = this.generateMerkleRoot(totalMigrated);
    const txHash = `0x${merkleRoot}`;
    
    console.log(`[HIVE-SCALER] Ledger anchor: ${txHash}`);
    
    return txHash;
  }
  
  /**
   * Generate merkle root placeholder
   */
  private generateMerkleRoot(count: number): string {
    const data = `migration_${count}_${Date.now()}`;
    return require('crypto').createHash('sha256').update(data).digest('hex').slice(0, 40);
  }
  
  /**
   * Calculate distance between hives (placeholder)
   */
  private calculateDistance(fromHive: number, toHive: number): number {
    const from = getHive(fromHive);
    const to = getHive(toHive);
    
    if (!from || !to) return 0;
    
    // Haversine distance
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(to.lat - from.lat);
    const dLon = this.toRad(to.lon - from.lon);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(from.lat)) * Math.cos(this.toRad(to.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
  
  /**
   * Get optimal Hive for new agent (post-migration)
   */
  getOptimalHiveForNewAgent(lat: number, lon: number): number {
    // If Genesis is below threshold, use it
    const genesis = getHive(1);
    if (genesis && genesis.current < MIGRATION_THRESHOLD) {
      return 1;
    }
    
    // Otherwise, find nearest active hive
    const nearest = findNearestHive(lat, lon);
    return nearest.id;
  }
  
  /**
   * Get migration statistics
   */
  getMigrationStats(): {
    totalMigrations: number;
    recentMigrations: MigrationRecord[];
    hiveDistribution: Record<number, number>;
  } {
    const allMigrations = hexStore.getAllMigrations();
    
    const hiveDistribution: Record<number, number> = {};
    for (const migration of allMigrations) {
      hiveDistribution[migration.to_hive] = (hiveDistribution[migration.to_hive] || 0) + 1;
    }
    
    return {
      totalMigrations: allMigrations.length,
      recentMigrations: allMigrations.slice(0, 10),
      hiveDistribution
    };
  }
}

// Export singleton
export const hiveScaler = new HiveScaler();
export default hiveScaler;
