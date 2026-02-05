/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * forge/consensus.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * CONSENSUS — 3-of-5 PoA validator coordination
 * 
 * WebSocket coordination with 4 peer validators
 * Multi-signature logic for block finality
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';
import { TERRACARE_ORIGIN } from '../essence/origin.js';

/**
 * Peer validator
 */
export interface PeerValidator {
  address: string;
  websocketUrl: string;
  connected: boolean;
  lastSeen: Date | null;
  latency: number; // ms
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
 * Consensus result
 */
export interface ConsensusResult {
  blockHash: string;
  blockNumber: number;
  votes: ConsensusVote[];
  reached: boolean;
  timestamp: number;
}

/**
 * Consensus coordinator
 */
export class Consensus extends EventEmitter {
  private peers: Map<string, PeerValidator> = new Map();
  private pendingVotes: Map<string, ConsensusVote[]> = new Map();
  private isConnected: boolean = false;
  
  readonly threshold = 3; // 3-of-5
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
   * Connect to peer network
   */
  async connect(): Promise<boolean> {
    console.log(`[CONSENSUS] Connecting to ${this.peers.size} peers...`);
    
    // Placeholder: Actual implementation uses WebSocket connections
    for (const [address, peer] of this.peers) {
      try {
        await this.connectPeer(peer);
        this.emit('peerConnected', address);
      } catch (error) {
        console.warn(`[CONSENSUS] Failed to connect to ${address.slice(0, 16)}...`);
      }
    }
    
    const connectedCount = this.getConnectedCount();
    this.isConnected = connectedCount >= 2; // Need at least 2 others for consensus
    
    console.log(`[CONSENSUS] ${connectedCount}/${this.peers.size} peers connected`);
    return this.isConnected;
  }
  
  /**
   * Connect to a single peer
   */
  private async connectPeer(peer: PeerValidator): Promise<void> {
    // Placeholder: Actual WebSocket connection
    await new Promise(resolve => setTimeout(resolve, 100));
    
    peer.connected = true;
    peer.lastSeen = new Date();
    peer.latency = Math.floor(Math.random() * 50) + 10; // Mock latency
  }
  
  /**
   * Submit a vote for a block
   */
  submitVote(vote: ConsensusVote): ConsensusResult | null {
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
      const result: ConsensusResult = {
        blockHash: vote.blockHash,
        blockNumber: vote.blockNumber,
        votes,
        reached: true,
        timestamp: Date.now()
      };
      
      this.emit('consensusReached', result);
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
    // Placeholder: Actual WebSocket send
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
   * Check if consensus possible
   */
  canReachConsensus(): boolean {
    // Need 3 validators total (self + 2 peers minimum)
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
}

// Export singleton
export const consensus = new Consensus();
export default consensus;
