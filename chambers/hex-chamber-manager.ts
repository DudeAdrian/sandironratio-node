/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * chambers/hex-chamber-manager.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * HEX CHAMBER MANAGER — Extension for 144,000 Chamber Architecture
 * 
 * Integrates with existing 9 Chambers system
 * Adds hexagonal grid capabilities
 * 6-wall neighbor system
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';
import { hexStore, Chamber } from '../db/hex-store.js';
import { hexGrid, HexCoord, NeighborChambers } from '../db/hex-grid.js';
import { HIVES, CHAMBERS_PER_HIVE } from '../config/hives.js';

export interface HexChamber extends Chamber {
  hexCoord: HexCoord;
  neighbors: Partial<NeighborChambers & { ids: Record<string, number> }>;
  ring: number;
}

export interface WallState {
  n: number;
  ne: number;
  se: number;
  s: number;
  sw: number;
  nw: number;
}

/**
 * Hex Chamber Manager — Manages 144k chambers per hive
 */
export class HexChamberManager extends EventEmitter {
  private chamberCache: Map<string, HexChamber> = new Map();
  private initialized: boolean = false;
  
  /**
   * Initialize hex chambers for all active hives
   */
  initialize(): void {
    console.log(`[HEX-CHAMBER-MANAGER] Initializing 144k chamber architecture...`);
    
    for (const hive of HIVES) {
      if (hive.status === 'active') {
        this.initializeHiveChambers(hive.id);
      }
    }
    
    this.initialized = true;
    console.log(`[HEX-CHAMBER-MANAGER] ✓ Ready`);
    this.emit('initialized');
  }
  
  /**
   * Initialize chambers for a specific hive
   */
  private initializeHiveChambers(hiveId: number): void {
    const existingCount = hexStore.getChamberCount(hiveId);
    
    if (existingCount >= CHAMBERS_PER_HIVE) {
      console.log(`[HEX-CHAMBER-MANAGER] Hive ${hiveId}: ${existingCount} chambers already exist`);
      return;
    }
    
    console.log(`[HEX-CHAMBER-MANAGER] Creating chambers for Hive ${hiveId}...`);
    
    // Generate chambers in batches
    const batchSize = 1000;
    let created = 0;
    
    for (let i = 0; i < CHAMBERS_PER_HIVE; i += batchSize) {
      const batchEnd = Math.min(i + batchSize, CHAMBERS_PER_HIVE);
      
      for (let index = i; index < batchEnd; index++) {
        const hex = hexGrid.indexToHex(index);
        const address = `${hiveId}:0.hex${index}.gen`;
        
        hexStore.createChamber(
          hiveId,
          address,
          0, // life path - assigned when agent spawns
          `hex${index}`,
          `gen${hiveId}`
        );
        
        created++;
      }
      
      const progress = ((batchEnd / CHAMBERS_PER_HIVE) * 100).toFixed(1);
      console.log(`[HEX-CHAMBER-MANAGER] Hive ${hiveId}: ${progress}% (${created} chambers)`);
    }
    
    console.log(`[HEX-CHAMBER-MANAGER] Hive ${hiveId}: ${created} chambers created`);
  }
  
  /**
   * Assign chamber to agent
   */
  assignChamber(hiveId: number, lifePath: number, lat: number, lon: number): { 
    chamberId: number; 
    address: string; 
    hex: HexCoord;
  } {
    // Generate address from coordinates
    const address = hexGrid.constructor.prototype.generateAddress(hiveId, lifePath, lat, lon);
    
    // Check if chamber exists
    let chamber = hexStore.getChamberByAddress(address.fullAddress);
    
    if (!chamber) {
      // Create new chamber
      const chamberId = hexStore.createChamber(
        hiveId,
        address.fullAddress,
        lifePath,
        address.latHash,
        address.lonHash
      );
      
      chamber = hexStore.getChamberById(chamberId);
    }
    
    if (!chamber) {
      throw new Error(`Failed to assign chamber for ${address.fullAddress}`);
    }
    
    return {
      chamberId: chamber.id,
      address: chamber.chamber_address,
      hex: hexGrid.indexToHex(chamber.id % 144000)
    };
  }
  
  /**
   * Get adjacent chambers
   */
  getAdjacentChambers(chamberId: number): Array<{ id: number; direction: keyof NeighborChambers }> {
    const chamber = hexStore.getChamberById(chamberId);
    if (!chamber) return [];
    
    const hex = hexGrid.indexToHex(chamberId % 144000);
    const neighbors = hexGrid.getNeighbors(hex);
    
    const adjacent: Array<{ id: number; direction: keyof NeighborChambers }> = [];
    
    for (const [direction, neighborHex] of Object.entries(neighbors) as [keyof NeighborChambers, HexCoord][]) {
      const neighborIndex = hexGrid.hexToIndex(neighborHex);
      const neighborAddress = `${chamber.hive_id}:0.hex${neighborIndex}.gen`;
      const neighbor = hexStore.getChamberByAddress(neighborAddress);
      
      if (neighbor) {
        adjacent.push({ id: neighbor.id, direction });
      }
    }
    
    return adjacent;
  }
  
  /**
   * Update wall state
   */
  updateWallState(chamberId: number, walls: WallState): void {
    hexStore.updateWallState(chamberId, walls);
    
    // Calculate consensus after wall update
    this.calculateChamberConsensus(chamberId);
    
    this.emit('wallStateUpdated', chamberId, walls);
  }
  
  /**
   * Calculate consensus for a chamber based on neighbor alignment
   */
  calculateChamberConsensus(chamberId: number): { 
    alignment: number; 
    matches: number; 
    total: number;
    consensusReached: boolean;
  } {
    const chamber = hexStore.getChamberById(chamberId);
    if (!chamber) {
      return { alignment: 0, matches: 0, total: 0, consensusReached: false };
    }
    
    const adjacent = this.getAdjacentChambers(chamberId);
    const chamberPattern = hexStore.getWallPattern(chamberId);
    
    let matches = 0;
    let total = 0;
    
    for (const neighbor of adjacent) {
      const neighborPattern = hexStore.getWallPattern(neighbor.id);
      
      // Check if walls align (both open or both closed)
      const alignment = HexChamberManager.calculateWallAlignment(
        chamberPattern, 
        neighborPattern, 
        neighbor.direction
      );
      
      if (alignment >= 100) {
        matches++;
      }
      total++;
    }
    
    const alignment = total > 0 ? (matches / total) : 0;
    const consensusReached = alignment >= 0.66; // 66% threshold
    
    if (consensusReached) {
      // Log consensus event
      hexStore.logConsensus(
        chamber.hive_id,
        chamberId,
        chamberPattern,
        alignment * 100
      );
      
      this.emit('consensusReached', chamberId, alignment);
    }
    
    return {
      alignment: Math.round(alignment * 100) / 100,
      matches,
      total,
      consensusReached
    };
  }
  
  /**
   * Calculate wall alignment between two patterns
   */
  static calculateWallAlignment(pattern1: string, pattern2: string, direction: keyof NeighborChambers): number {
    if (pattern1.length !== 6 || pattern2.length !== 6) return 0;
    
    // Opposite wall indices
    const opposites: Record<keyof NeighborChambers, number> = {
      n: 3,   // n <-> s
      ne: 4,  // ne <-> sw
      se: 5,  // se <-> nw
      s: 0,   // s <-> n
      sw: 1,  // sw <-> ne
      nw: 2   // nw <-> se
    };
    
    const wall1 = pattern1[opposites[direction]];
    const directionIndex = ['n', 'ne', 'se', 's', 'sw', 'nw'].indexOf(direction);
    const wall2 = pattern2[directionIndex];
    
    // Return 100 if both walls are open (1), 0 otherwise
    return (wall1 === '1' && wall2 === '1') ? 100 : 0;
  }
  
  /**
   * Get chamber by address
   */
  getChamberByAddress(address: string): HexChamber | undefined {
    const chamber = hexStore.getChamberByAddress(address);
    if (!chamber) return undefined;
    
    return this.enrichChamber(chamber);
  }
  
  /**
   * Get chamber by ID
   */
  getChamberById(id: number): HexChamber | undefined {
    const chamber = hexStore.getChamberById(id);
    if (!chamber) return undefined;
    
    return this.enrichChamber(chamber);
  }
  
  /**
   * Enrich chamber data with hex coordinates and neighbors
   */
  private enrichChamber(chamber: Chamber): HexChamber {
    const hex = hexGrid.indexToHex(chamber.id % 144000);
    const neighbors = hexGrid.getNeighbors(hex);
    
    // Calculate ring number
    const ring = Math.max(Math.abs(hex.q), Math.abs(hex.r), Math.abs(hex.q + hex.r));
    
    return {
      ...chamber,
      hexCoord: hex,
      neighbors: {
        ...neighbors,
        ids: {} // Would be populated with actual neighbor chamber IDs
      },
      ring
    };
  }
  
  /**
   * Get chambers in a ring
   */
  getChambersInRing(hiveId: number, ring: number): HexChamber[] {
    const hexes = hexGrid.getRing(ring);
    const chambers: HexChamber[] = [];
    
    for (const hex of hexes) {
      const index = hexGrid.hexToIndex(hex);
      const address = `${hiveId}:0.hex${index}.gen`;
      const chamber = this.getChamberByAddress(address);
      
      if (chamber) {
        chambers.push(chamber);
      }
    }
    
    return chambers;
  }
  
  /**
   * Get chamber statistics
   */
  getStats(hiveId?: number): {
    totalChambers: number;
    occupiedChambers: number;
    consensusEvents: number;
    averageOccupancy: number;
  } {
    if (hiveId) {
      const total = hexStore.getChamberCount(hiveId);
      // Would query for occupied count
      return {
        totalChambers: total,
        occupiedChambers: 0,
        consensusEvents: 0,
        averageOccupancy: 0
      };
    }
    
    // Global stats
    let total = 0;
    for (const hive of HIVES) {
      if (hive.status === 'active') {
        total += hexStore.getChamberCount(hive.id);
      }
    }
    
    return {
      totalChambers: total,
      occupiedChambers: 0,
      consensusEvents: 0,
      averageOccupancy: 0
    };
  }
}

// Export singleton
export const hexChamberManager = new HexChamberManager();
export default hexChamberManager;

// Compatibility exports
export const HEX_CHAMBERS = {
  total: 144000,
  perHive: 144000,
  walls: 6,
  directions: ['n', 'ne', 'se', 's', 'sw', 'nw']
};
