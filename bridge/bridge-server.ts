/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * bridge/bridge-server.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * BRIDGE SERVER — WebSocket endpoint for ecosystem
 * 
 * WebSocket server on port 9001 for other repos (heartware) to:
 * - Subscribe to Adrian's presence
 * - Query chamber state
 * - Receive mood broadcasts
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';
import academyAPI from './academy-api.js';

/**
 * WebSocket client connection
 */
interface WSClient {
  id: string;
  socket: unknown; // Would be WebSocket in actual implementation
  subscribed: boolean;
  lastPing: Date;
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
    
    // Placeholder: Actual implementation creates WebSocketServer
    // import { WebSocketServer } from 'ws';
    // this.wss = new WebSocketServer({ port: this.config.port });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.isRunning = true;
    this.startHeartbeat();
    this.startAcademyBroadcasts();
    
    console.log(`🌉 [BRIDGE] Server ready`);
    console.log(`   Protocol: Presence signals, mood broadcasts, chamber state\n`);
    
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
      message: 'Connected to sandironratio-node Bridge',
      protocol: '1.0',
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
    }
  }
  
  /**
   * Send message to client
   */
  private sendToClient(client: WSClient, data: unknown): void {
    // Placeholder: Actual implementation uses WebSocket send
    // client.socket.send(JSON.stringify(data));
  }
  
  /**
   * Disconnect client
   */
  private disconnectClient(client: WSClient): void {
    // Placeholder: Close WebSocket connection
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
