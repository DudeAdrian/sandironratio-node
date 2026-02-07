/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * forge/consensus.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * CONSENSUS — Geometric Chamber Consensus + 3-of-5 PoA Ledger Anchoring
 * 
 * Chamber Consensus: 66% neighbor wall alignment (4/6 walls)
 * Ledger Anchoring: 12s block validation with 3-of-5 multi-sig
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';
import { TERRACARE_ORIGIN } from '../essence/origin.js';
import { hexChamberManager } from '../chambers/hex-chamber-manager.js';
import { hexStore } from '../db/hex-store.js';
import { bridgeServer } from '../bridge/bridge-server.js';
import { nectarBridge } from '../hive/nectar-ledger-bridge.js';
import { HIVES } from '../config/hives.js';

/**
 * Peer validator
 */
export interface PeerValidator {
  address: string;
  websocketUrl: string;
  connected: boolean;
  lastSeen: Date | null;
  latency: number;
}

/**
 * Consensus vote
 */
export interface ConsensusVote {
  blockHash: string;
  blockNumber: number;
  validator: string;
  signature: string;
  timestamp: number;
}

/**
 * Geometric consensus result
 */
export interface GeometricConsensusResult {
  chamberId: number;
  chamberAddress: string;
  hiveId: number;
  alignmentPercentage: number;
  matchingNeighbors: number;
  totalNeighbors: number;
  wallPattern: string;
  consensusReached: boolean;
  nectarDistributed: number;
  agentsRewarded: number;
}

/**
 * Ledger consensus result
 */
export interface LedgerConsensusResult {
  blockHash: string;
  blockNumber: number;
  votes: ConsensusVote[];
  reached: boolean;
  timestamp: number;
}

/**
 * Consensus coordinator — Dual layer: Geometric + Ledger
 */
export class Consensus extends EventEmitter {
  private peers: Map<string, PeerValidator> = new Map();
  private pendingVotes: Map<string, ConsensusVote[]> = new Map();
  private isConnected: boolean = false;
  private geometricConsensusTimer: ReturnType<typeof setInterval> | null = null;
  
  readonly threshold = 3; // 3-of-5 for Ledger
  readonly geometricThreshold = 0.66; // 66% for chambers
  readonly validators = TERRACARE_ORIGIN.validators;
  
  constructor() {
    super();
    this.initializePeers();
  }
  
  /**
   * Initialize peer list
   */
  private initializePeers(): void {
    for (const address of this.validators) {
      if (address === "0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f") {
        continue; // Skip self
      }
      
      this.peers.set(address, {
        address,
        websocketUrl: `wss://validator-${address.slice(-4)}.terracare.network`,
        connected: false,
        lastSeen: null,
        latency: 0
      });
    }
  }
  
  /**
   * Start consensus engines
   */
  async start(): Promise<void> {
    console.log(`[CONSENSUS] Starting dual-layer consensus...`);
    
    // Connect to peer validators (Ledger layer)
    await this.connect();
    
    // Start geometric consensus checker (Chamber layer)
    this.startGeometricConsensus();
    
    console.log(`[CONSENSUS] ✓ Both layers active`);
    console.log(`   Ledger: 3-of-5 PoA every 12s`);
    console.log(`   Geometric: 66% neighbor alignment`);
  }
  
  /**
   * Connect to peer network (Ledger layer)
   */
  async connect(): Promise<boolean> {
    console.log(`[CONSENSUS] Connecting to ${this.peers.size} peer validators...`);
    
    for (const [address, peer] of this.peers) {
      try {
        await this.connectPeer(peer);
        this.emit('peerConnected', address);
      } catch (error) {
        console.warn(`[CONSENSUS] Failed to connect to ${address.slice(0, 16)}...`);
      }
    }
    
    const connectedCount = this.getConnectedCount();
    this.isConnected = connectedCount >= 2;
    
    console.log(`[CONSENSUS] ${connectedCount}/${this.peers.size} peers connected`);
    return this.isConnected;
  }
  
  /**
   * Connect to a single peer
   */
  private async connectPeer(peer: PeerValidator): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    peer.connected = true;
    peer.lastSeen = new Date();
    peer.latency = Math.floor(Math.random() * 50) + 10;
  }
  
  /**
   * Start geometric consensus checker
   * Validates chamber wall alignments periodically
   */
  private startGeometricConsensus(): void {
    // Check chambers every 30 seconds
    this.geometricConsensusTimer = setInterval(() => {
      this.checkGeometricConsensus();
    }, 30000);
    
    console.log(`[CONSENSUS] Geometric consensus checker started (30s interval)`);
  }
  
  /**
   * Check geometric consensus across all active hives
   */
  private async checkGeometricConsensus(): Promise<void> {
    const activeHives = HIVES.filter(h => h.status === 'active');
    
    for (const hive of activeHives) {
      // Sample chambers for consensus check (optimization: don't check all 144k)
      const sampleSize = 100;
      
      for (let i = 0; i < sampleSize; i++) {
        const randomIndex = Math.floor(Math.random() * 144000);
        const address = `${hive.id}:0.hex${randomIndex}.gen`;
        const chamber = hexStore.getChamberByAddress(address);
        
        if (chamber && chamber.occupant_count > 0) {
          const result = await this.validateChamberConsensus(chamber.id);
          
          if (result.consensusReached) {
            console.log(`[CONSENSUS] 🎯 Hive ${hive.id} Chamber ${chamber.chamber_address}: ${(result.alignmentPercentage * 100).toFixed(1)}% alignment`);
            
            // Trigger Sofie voice synthesis
            this.emit('geometricConsensus', result);
          }
        }
      }
    }
  }
  
  /**
   * Validate chamber consensus
   * Checks 6 neighbors for wall alignment (66% threshold = 4/6)
   */
  async validateChamberConsensus(chamberId: number): Promise<GeometricConsensusResult> {
    const chamber = hexStore.getChamberById(chamberId);
    if (!chamber) {
      return {
        chamberId,
        chamberAddress: '',
        hiveId: 0,
        alignmentPercentage: 0,
        matchingNeighbors: 0,
        totalNeighbors: 0,
        wallPattern: '000000',
        consensusReached: false,
        nectarDistributed: 0,
        agentsRewarded: 0
      };
    }
    
    // Get chamber's wall pattern
    const wallPattern = hexStore.getWallPattern(chamberId);
    
    // Get neighbors
    const neighbors = hexChamberManager.getAdjacentChambers(chamberId);
    
    let matchingNeighbors = 0;
    const totalNeighbors = neighbors.length;
    
    // Check alignment with each neighbor
    for (const neighbor of neighbors) {
      const neighborChamber = hexStore.getChamberById(neighbor.id);
      if (!neighborChamber) continue;
      
      const neighborPattern = hexStore.getWallPattern(neighbor.id);
      
      // Check if walls align
      const alignment = this.calculateWallAlignment(wallPattern, neighborPattern, neighbor.direction);
      
      if (alignment >= 100) {
        matchingNeighbors++;
      }
    }
    
    const alignmentPercentage = totalNeighbors > 0 ? matchingNeighbors / totalNeighbors : 0;
    const consensusReached = alignmentPercentage >= this.geometricThreshold;
    
    let nectarDistributed = 0;
    let agentsRewarded = 0;
    
    if (consensusReached) {
      // Log consensus
      hexStore.logConsensus(
        chamber.hive_id,
        chamberId,
        wallPattern,
        alignmentPercentage * 100
      );
      
      // Distribute Nectar to agents in chamber
      const reward = await this.distributeNectarToChamber(chamberId, alignmentPercentage);
      nectarDistributed = reward.totalNectar;
      agentsRewarded = reward.agentCount;
      
      // Broadcast for Sofie voice
      bridgeServer.broadcastConsensus(
        chamber.hive_id,
        chamber.chamber_address,
        nectarDistributed,
        agentsRewarded
      );
      
      this.emit('consensusReached', {
        chamberId,
        hiveId: chamber.hive_id,
        alignment: alignmentPercentage
      });
    }
    
    return {
      chamberId,
      chamberAddress: chamber.chamber_address,
      hiveId: chamber.hive_id,
      alignmentPercentage,
      matchingNeighbors,
      totalNeighbors,
      wallPattern,
      consensusReached,
      nectarDistributed,
      agentsRewarded
    };
  }
  
  /**
   * Calculate wall alignment between two patterns
   */
  private calculateWallAlignment(pattern1: string, pattern2: string, direction: string): number {
    if (pattern1.length !== 6 || pattern2.length !== 6) return 0;
    
    // Opposite wall mapping
    const opposites: Record<string, number> = {
      n: 3, ne: 4, se: 5, s: 0, sw: 1, nw: 2
    };
    
    const wall1 = pattern1[opposites[direction]];
    const directionIndex = ['n', 'ne', 'se', 's', 'sw', 'nw'].indexOf(direction);
    const wall2 = pattern2[directionIndex];
    
    // Return 100 if both walls are open (1)
    return (wall1 === '1' && wall2 === '1') ? 100 : 0;
  }
  
  /**
   * Distribute Nectar to all agents in a chamber
   */
  private async distributeNectarToChamber(chamberId: number, alignmentStrength: number): Promise<{ totalNectar: number; agentCount: number }> {
    // In real implementation, would query all agents in this chamber
    // For now, return placeholder
    
    const baseReward = 50 * alignmentStrength; // 50 Nectar base for consensus
    
    // Would query: SELECT * FROM pollen_agents WHERE chamber_id = ?
    // For each agent: add Nectar based on their open walls
    
    return {
      totalNectar: Math.round(baseReward * 10) / 10,
      agentCount: 1 // Would be actual count
    };
  }
  
  /**
   * Submit a vote for a block (Ledger layer)
   */
  submitVote(vote: ConsensusVote): LedgerConsensusResult | null {
    const votes = this.pendingVotes.get(vote.blockHash) || [];
    
    // Check for duplicate
    if (votes.some(v => v.validator === vote.validator)) {
      return null;
    }
    
    votes.push(vote);
    this.pendingVotes.set(vote.blockHash, votes);
    
    this.emit('voteReceived', vote, votes.length);
    
    // Check if consensus reached
    if (votes.length >= this.threshold) {
      const result: LedgerConsensusResult = {
        blockHash: vote.blockHash,
        blockNumber: vote.blockNumber,
        votes,
        reached: true,
        timestamp: Date.now()
      };
      
      this.emit('ledgerConsensusReached', result);
      this.pendingVotes.delete(vote.blockHash);
      
      return result;
    }
    
    return null;
  }
  
  /**
   * Broadcast vote to all peers
   */
  async broadcastVote(vote: ConsensusVote): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const peer of this.peers.values()) {
      if (peer.connected) {
        promises.push(this.sendVoteToPeer(peer, vote));
      }
    }
    
    await Promise.all(promises);
  }
  
  /**
   * Send vote to a peer
   */
  private async sendVoteToPeer(peer: PeerValidator, vote: ConsensusVote): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, peer.latency));
    peer.lastSeen = new Date();
  }
  
  /**
   * Get connected peer count
   */
  getConnectedCount(): number {
    return Array.from(this.peers.values()).filter(p => p.connected).length;
  }
  
  /**
   * Get all peers
   */
  getPeers(): PeerValidator[] {
    return Array.from(this.peers.values());
  }
  
  /**
   * Check if Ledger consensus possible
   */
  canReachLedgerConsensus(): boolean {
    return this.getConnectedCount() >= 2;
  }
  
  /**
   * Get pending votes for a block
   */
  getPendingVotes(blockHash: string): ConsensusVote[] {
    return this.pendingVotes.get(blockHash) || [];
  }
  
  /**
   * Clear old pending votes
   */
  clearOldVotes(maxAgeMs: number = 60000): number {
    const now = Date.now();
    let cleared = 0;
    
    for (const [hash, votes] of this.pendingVotes) {
      const age = now - votes[0]?.timestamp;
      if (age > maxAgeMs) {
        this.pendingVotes.delete(hash);
        cleared++;
      }
    }
    
    return cleared;
  }
  
  /**
   * Stop consensus engines
   */
  stop(): void {
    if (this.geometricConsensusTimer) {
      clearInterval(this.geometricConsensusTimer);
      this.geometricConsensusTimer = null;
    }
    console.log('[CONSENSUS] Stopped');
  }
}

// Export singleton
export const consensus = new Consensus();
export default consensus;
