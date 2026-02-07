/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * bridge/bridge-server.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * BRIDGE SERVER — WebSocket endpoint for ecosystem (Port 9001)
 * 
 * Pollen Agent Integration:
 * - spawn: Geographic agent assignment to Hives
 * - wall_update: Chamber wall state management
 * - proof_submit: Activity proof submission for Nectar
 * - heartbeat: Agent liveness and geolocation
 * 
 * Legacy Support:
 * - subscribe/unsubscribe: Presence signals
 * - getChamberState: 9 Chambers academy state
 * - getKarma: User progress
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';
import academyAPI from './academy-api.js';
import { hexStore } from '../db/hex-store.js';
import { hexGrid } from '../db/hex-grid.js';
import { hexChamberManager } from '../chambers/hex-chamber-manager.js';
import { assignBeeRoleFromBirthDate } from '../hive/bee-roles.js';
import { nectarBridge } from '../hive/nectar-ledger-bridge.js';
import { hiveScaler } from '../hive/hive-scaler.js';
import { HIVES, findNearestHive, MIGRATION_THRESHOLD } from '../config/hives.js';
import { randomUUID } from 'crypto';

/**
 * WebSocket client connection
 */
interface WSClient {
  id: string;
  socket: unknown;
  subscribed: boolean;
  lastPing: Date;
  agentId?: string; // Linked Pollen agent
}

/**
 * Bridge server configuration
 */
export interface BridgeConfig {
  port: number;
  host: string;
  heartbeatInterval: number;
}

/**
 * Bridge server for ecosystem connectivity
 */
export class BridgeServer extends EventEmitter {
  config: BridgeConfig = {
    port: 9001,
    host: 'localhost',
    heartbeatInterval: 30000
  };
  
  private clients: Map<string, WSClient> = new Map();
  private isRunning: boolean = false;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  
  /**
   * Start the bridge server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log(`[BRIDGE] Already running on port ${this.config.port}`);
      return;
    }
    
    console.log(`\n🌉 [BRIDGE] Starting server...`);
    console.log(`   Port: ${this.config.port}`);
    console.log(`   Endpoint: ws://${this.config.host}:${this.config.port}\n`);
    
    // Initialize database
    hexStore.initialize();
    hexChamberManager.initialize();
    await nectarBridge.initialize();
    
    // Placeholder: Actual implementation creates WebSocketServer
    // import { WebSocketServer } from 'ws';
    // this.wss = new WebSocketServer({ port: this.config.port });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.isRunning = true;
    this.startHeartbeat();
    this.startAcademyBroadcasts();
    
    console.log(`🌉 [BRIDGE] Server ready`);
    console.log(`   Protocol: Pollen spawn, wall consensus, Nectar rewards\n`);
    
    this.emit('started');
  }
  
  /**
   * Stop the server
   */
  stop(): void {
    if (!this.isRunning) return;
    
    console.log(`\n🌉 [BRIDGE] Stopping server...`);
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    academyAPI.stopBroadcasting();
    hexStore.close();
    
    // Disconnect all clients
    for (const client of this.clients.values()) {
      this.disconnectClient(client);
    }
    
    this.isRunning = false;
    console.log(`🌉 [BRIDGE] Server stopped\n`);
    
    this.emit('stopped');
  }
  
  /**
   * Handle new client connection
   */
  private handleConnection(socket: unknown): void {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    
    const client: WSClient = {
      id: clientId,
      socket,
      subscribed: false,
      lastPing: new Date()
    };
    
    this.clients.set(clientId, client);
    console.log(`[BRIDGE] Client connected: ${clientId}`);
    
    // Send welcome
    this.sendToClient(client, {
      type: 'welcome',
      message: 'Connected to sandironratio-node Bridge (Hexagonal Hive v2.0)',
      protocol: '2.0',
      hives: HIVES.length,
      chambersPerHive: 144000,
      timestamp: new Date().toISOString()
    });
    
    this.emit('clientConnected', clientId);
  }
  
  /**
   * Handle client message
   */
  private handleMessage(client: WSClient, data: unknown): void {
    try {
      const message = typeof data === 'string' ? JSON.parse(data) : data;
      
      switch (message.type) {
        // ═══════════════════════════════════════════════════════════════════
        // POLLEN AGENT MESSAGES
        // ═══════════════════════════════════════════════════════════════════
        
        case 'spawn':
          this.handleSpawn(client, message);
          break;
          
        case 'wall_update':
          this.handleWallUpdate(client, message);
          break;
          
        case 'proof_submit':
          this.handleProofSubmit(client, message);
          break;
          
        case 'heartbeat':
          this.handleHeartbeat(client, message);
          break;
        
        // ═══════════════════════════════════════════════════════════════════
        // LEGACY MESSAGES
        // ═══════════════════════════════════════════════════════════════════
        
        case 'subscribe':
          client.subscribed = true;
          this.sendToClient(client, {
            type: 'subscribed',
            presence: academyAPI.getPresence()
          });
          break;
          
        case 'unsubscribe':
          client.subscribed = false;
          this.sendToClient(client, { type: 'unsubscribed' });
          break;
          
        case 'getChamberState':
          this.sendToClient(client, {
            type: 'chamberState',
            data: academyAPI.getChamberState()
          });
          break;
          
        case 'getKarma':
          this.sendToClient(client, {
            type: 'karma',
            data: academyAPI.getKarma(message.userId)
          });
          break;
          
        case 'ping':
          client.lastPing = new Date();
          this.sendToClient(client, { type: 'pong', timestamp: Date.now() });
          break;
          
        default:
          this.sendToClient(client, {
            type: 'error',
            message: `Unknown message type: ${message.type}`
          });
      }
    } catch (error) {
      console.error(`[BRIDGE] Message error:`, error);
      this.sendToClient(client, {
        type: 'error',
        message: error instanceof Error ? error.message : 'Invalid message'
      });
    }
  }
  
  /**
   * Handle Pollen spawn request
   */
  private handleSpawn(client: WSClient, message: any): void {
    try {
      const { user_id, birth_date, lat, lon, public_key } = message;
      
      console.log(`[BRIDGE] Spawn request: ${user_id} at (${lat}, ${lon})`);
      
      // Check if user already has agent
      const existingAgent = hexStore.getAgentByUser(user_id);
      if (existingAgent) {
        this.sendToClient(client, {
          type: 'spawn_response',
          success: true,
          agent_id: existingAgent.agent_id,
          hive_id: existingAgent.hive_id,
          chamber_address: hexStore.getChamberById(existingAgent.chamber_id!)?.chamber_address,
          bee_role: existingAgent.bee_role,
          nectar_balance: existingAgent.shadow_nectar + existingAgent.nectar_balance,
          message: 'Agent already exists'
        });
        return;
      }
      
      // Determine optimal Hive
      const genesisCount = hexStore.getAgentCount(1);
      let hiveId: number;
      
      if (genesisCount < MIGRATION_THRESHOLD) {
        // Genesis Hive has capacity
        hiveId = 1;
      } else {
        // Post-migration: find nearest active Hive
        const nearest = findNearestHive(lat, lon);
        hiveId = nearest.id;
        
        // Check if migration needed
        if (hiveScaler.shouldMigrate()) {
          console.log(`[BRIDGE] Migration threshold reached! Triggering The Great Migration...`);
          hiveScaler.executeMigration().catch(console.error);
        }
      }
      
      // Calculate Life Path and assign bee role
      const birthDate = new Date(birth_date);
      const { role: beeRole, lifePath } = assignBeeRoleFromBirthDate(birthDate);
      
      // Assign chamber in Hive
      const assignment = hexChamberManager.assignChamber(hiveId, lifePath, lat, lon);
      
      // Create agent
      const agentId = `pollen_${randomUUID().slice(0, 8)}`;
      hexStore.createAgent(agentId, user_id, hiveId, assignment.chamberId, beeRole, lat, lon);
      
      // Link client to agent
      client.agentId = agentId;
      
      // Update Hive count
      const hive = HIVES.find(h => h.id === hiveId);
      if (hive) hive.current++;
      
      console.log(`[BRIDGE] Spawned ${agentId} in Hive ${hiveId}, Chamber ${assignment.address} as ${beeRole}`);
      
      this.sendToClient(client, {
        type: 'spawn_response',
        success: true,
        agent_id: agentId,
        hive_id: hiveId,
        chamber_address: assignment.address,
        bee_role: beeRole,
        life_path: lifePath,
        nectar_balance: 0,
        message: `Welcome to ${hive?.name || 'Unknown'} Hive. You are a ${beeRole}.`
      });
      
      this.emit('agentSpawned', agentId, hiveId);
      
    } catch (error) {
      console.error(`[BRIDGE] Spawn error:`, error);
      this.sendToClient(client, {
        type: 'spawn_response',
        success: false,
        error: error instanceof Error ? error.message : 'Spawn failed'
      });
    }
  }
  
  /**
   * Handle wall update request
   */
  private handleWallUpdate(client: WSClient, message: any): void {
    try {
      const { agent_id, chamber_address, walls } = message;
      
      // Validate agent
      const agent = hexStore.getAgent(agent_id);
      if (!agent) {
        this.sendToClient(client, {
          type: 'wall_update_response',
          success: false,
          error: 'Agent not found'
        });
        return;
      }
      
      // Get chamber
      const chamber = hexStore.getChamberByAddress(chamber_address);
      if (!chamber) {
        this.sendToClient(client, {
          type: 'wall_update_response',
          success: false,
          error: 'Chamber not found'
        });
        return;
      }
      
      // Validate agent owns this chamber
      if (agent.chamber_id !== chamber.id) {
        this.sendToClient(client, {
          type: 'wall_update_response',
          success: false,
          error: 'Agent not assigned to this chamber'
        });
        return;
      }
      
      // Update walls
      hexChamberManager.updateWallState(chamber.id, {
        n: walls.n,
        ne: walls.ne,
        se: walls.se,
        s: walls.s,
        sw: walls.sw,
        nw: walls.nw
      });
      
      // Calculate consensus
      const consensus = hexChamberManager.calculateChamberConsensus(chamber.id);
      
      console.log(`[BRIDGE] Wall update: ${chamber_address} - Alignment: ${(consensus.alignment * 100).toFixed(1)}%`);
      
      // Broadcast to neighbors if consensus reached
      if (consensus.consensusReached) {
        this.broadcastToNeighbors(chamber.id, {
          type: 'consensus_achieved',
          chamber_address: chamber_address,
          alignment: consensus.alignment,
          message: `Chamber ${chamber_address} has reached consensus!`
        });
      }
      
      this.sendToClient(client, {
        type: 'wall_update_response',
        success: true,
        chamber_address: chamber_address,
        walls: walls,
        consensus: consensus,
        message: consensus.consensusReached ? 'Consensus achieved!' : 'Walls updated'
      });
      
    } catch (error) {
      console.error(`[BRIDGE] Wall update error:`, error);
      this.sendToClient(client, {
        type: 'wall_update_response',
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      });
    }
  }
  
  /**
   * Handle proof submission
   */
  private async handleProofSubmit(client: WSClient, message: any): Promise<void> {
    try {
      const { agent_id, activity_type, duration, proof_hash } = message;
      
      // Get agent
      const agent = hexStore.getAgent(agent_id);
      if (!agent) {
        this.sendToClient(client, {
          type: 'proof_response',
          success: false,
          error: 'Agent not found'
        });
        return;
      }
      
      // Calculate consensus bonus
      let consensusBonus = 1.0;
      if (agent.chamber_id) {
        const consensus = hexChamberManager.calculateChamberConsensus(agent.chamber_id);
        if (consensus.consensusReached) {
          consensusBonus = 2.0; // Double rewards in consensus
        }
      }
      
      // Calculate Nectar reward with wall bonuses
      const baseAmount = nectarBridge.calculateNectarReward(
        activity_type,
        duration,
        consensusBonus,
        agent.bee_role || 'worker'
      );
      
      // Add wall value bonuses
      const wallBonus = this.calculateWallBonuses(agent.chamber_id, activity_type);
      const totalAmount = baseAmount + wallBonus;
      
      // Process based on graduation level
      let txHash: string | undefined;
      
      if (agent.graduation_level === 1) {
        // Level 1: Add to shadow nectar
        hexStore.addShadowNectar(agent_id, totalAmount);
      } else {
        // Level 2+: Mint confirmed nectar
        const result = await nectarBridge.mintNectar({
          agentId: agent_id,
          amount: totalAmount,
          proofHash: proof_hash,
          activityType: activity_type,
          duration: duration,
          consensusStrength: consensusBonus - 1.0,
          chamberAddress: hexStore.getChamberById(agent.chamber_id!)?.chamber_address || '',
          hiveId: agent.hive_id
        });
        txHash = result.txHash;
      }
      
      // Get updated balance
      const updatedAgent = hexStore.getAgent(agent_id);
      const newBalance = (updatedAgent?.shadow_nectar || 0) + (updatedAgent?.nectar_balance || 0);
      
      // Check graduation eligibility
      const graduationEligible = updatedAgent?.graduation_level === 1 && 
                                updatedAgent?.shadow_nectar >= 1000;
      
      console.log(`[BRIDGE] Proof submitted: ${agent_id} earned ${totalAmount.toFixed(2)} Nectar (Level ${updatedAgent?.graduation_level})`);
      
      this.sendToClient(client, {
        type: 'proof_response',
        success: true,
        nectar_earned: totalAmount,
        base_amount: baseAmount,
        wall_bonus: wallBonus,
        consensus_bonus: consensusBonus > 1.0 ? '2x' : '1x',
        new_balance: newBalance,
        graduation_eligible: graduationEligible,
        tx_hash: txHash,
        message: graduationEligible ? 'You are eligible for graduation!' : `Earned ${totalAmount.toFixed(2)} Nectar`
      });
      
    } catch (error) {
      console.error(`[BRIDGE] Proof submission error:`, error);
      this.sendToClient(client, {
        type: 'proof_response',
        success: false,
        error: error instanceof Error ? error.message : 'Submission failed'
      });
    }
  }
  
  /**
   * Calculate wall value bonuses
   */
  private calculateWallBonuses(chamberId: number | null, activityType: string): number {
    if (!chamberId) return 0;
    
    const chamber = hexStore.getChamberById(chamberId);
    if (!chamber) return 0;
    
    let bonus = 0;
    
    // Wall value multipliers
    if (chamber.wall_n === 1) bonus += 5;   // N: Hourly attunement
    if (chamber.wall_ne === 1) bonus += 15; // NE: Creation boost
    if (chamber.wall_se === 1) bonus += 3;  // SE: Patience
    if (chamber.wall_s === 1) bonus += 10;  // S: Transparency
    if (chamber.wall_sw === 1) bonus += 20; // SW: Guardian
    if (chamber.wall_nw === 1) bonus += 8;  // NW: Attunement
    
    return bonus;
  }
  
  /**
   * Handle heartbeat
   */
  private handleHeartbeat(client: WSClient, message: any): void {
    try {
      const { agent_id, geolat, geolon } = message;
      
      // Update agent ping
      hexStore.updateAgentPing(agent_id);
      
      // Get agent
      const agent = hexStore.getAgent(agent_id);
      if (agent && agent.hive_id) {
        // Check if geolocation changed significantly
        if (agent.geolat && agent.geolon && geolat && geolon) {
          const distance = this.calculateDistance(agent.geolat, agent.geolon, geolat, geolon);
          
          // If moved more than 500km, suggest migration
          if (distance > 500) {
            const nearestHive = findNearestHive(geolat, geolon);
            if (nearestHive.id !== agent.hive_id) {
              this.sendToClient(client, {
                type: 'migration_suggestion',
                current_hive: agent.hive_id,
                suggested_hive: nearestHive.id,
                distance: Math.round(distance),
                message: `You are ${Math.round(distance)}km from your current Hive. Consider migrating to ${nearestHive.name}.`
              });
            }
          }
        }
        
        // Update geolocation
        const updateStmt = hexStore['db']?.prepare(
          'UPDATE pollen_agents SET geolat = ?, geolon = ? WHERE agent_id = ?'
        );
        if (updateStmt) {
          updateStmt.run(geolat, geolon, agent_id);
        }
      }
      
      client.lastPing = new Date();
      
      this.sendToClient(client, {
        type: 'heartbeat_ack',
        timestamp: Date.now(),
        agent_status: 'active'
      });
      
    } catch (error) {
      console.error(`[BRIDGE] Heartbeat error:`, error);
    }
  }
  
  /**
   * Broadcast to chamber neighbors
   */
  private broadcastToNeighbors(chamberId: number, data: unknown): void {
    const neighbors = hexChamberManager.getAdjacentChambers(chamberId);
    
    // Find agents in neighboring chambers
    for (const neighbor of neighbors) {
      const neighborChamber = hexStore.getChamberById(neighbor.id);
      if (!neighborChamber) continue;
      
      // Would query for agents in this chamber and notify them
      // For now, broadcast to all subscribed clients
      for (const client of this.clients.values()) {
        if (client.subscribed) {
          this.sendToClient(client, data);
        }
      }
    }
  }
  
  /**
   * Calculate distance between coordinates (km)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  /**
   * Send message to client
   */
  private sendToClient(client: WSClient, data: unknown): void {
    // Placeholder: Actual implementation uses WebSocket send
    // client.socket.send(JSON.stringify(data));
    console.log(`[BRIDGE] → ${client.id}: ${(data as any).type}`);
  }
  
  /**
   * Disconnect client
   */
  private disconnectClient(client: WSClient): void {
    this.clients.delete(client.id);
    console.log(`[BRIDGE] Client disconnected: ${client.id}`);
  }
  
  /**
   * Start heartbeat checker
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const now = new Date();
      
      for (const client of this.clients.values()) {
        const elapsed = now.getTime() - client.lastPing.getTime();
        
        // Disconnect if no ping for 2 minutes
        if (elapsed > 2 * 60 * 1000) {
          console.log(`[BRIDGE] Client timeout: ${client.id}`);
          this.disconnectClient(client);
        }
      }
    }, this.config.heartbeatInterval);
  }
  
  /**
   * Start academy API broadcasts
   */
  private startAcademyBroadcasts(): void {
    academyAPI.startBroadcasting(30000);
    
    // Forward broadcasts to subscribed clients
    academyAPI.subscribePresence((presence) => {
      for (const client of this.clients.values()) {
        if (client.subscribed) {
          this.sendToClient(client, {
            type: 'presence',
            data: presence
          });
        }
      }
    });
  }
  
  /**
   * Broadcast to all connected clients
   */
  broadcast(data: unknown): void {
    for (const client of this.clients.values()) {
      this.sendToClient(client, data);
    }
  }
  
  /**
   * Broadcast consensus event (for Sofie voice)
   */
  broadcastConsensus(hiveId: number, chamberAddress: string, nectarMinted: number, agentCount: number): void {
    this.broadcast({
      type: 'consensus_event',
      hive_id: hiveId,
      chamber_address: chamberAddress,
      nectar_minted: nectarMinted,
      agent_count: agentCount,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Get server statistics
   */
  getStats(): {
    running: boolean;
    clients: number;
    subscribed: number;
    port: number;
  } {
    return {
      running: this.isRunning,
      clients: this.clients.size,
      subscribed: Array.from(this.clients.values()).filter(c => c.subscribed).length,
      port: this.config.port
    };
  }
}

// Export singleton
export const bridgeServer = new BridgeServer();
export default bridgeServer;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  bridgeServer.start().catch(console.error);
  
  process.on('SIGINT', () => {
    bridgeServer.stop();
    process.exit(0);
  });
}
