/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * forge/validator.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * THE FORGE — Zone 1: Block Validation
 * 
 * Active validator for Terracare Ledger (PoA 3-of-5 consensus)
 * Address: 0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f
 * Duty: Sign blocks every 12 seconds, coordinate with 4 peer validators
 * Never Sleeps: Validator process runs isolated from teaching operations
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';
import { Force, VALIDATOR_ID, FORCE_CONFIG } from '../essence/force.js';
import { Origin } from '../essence/origin.js';
import sofie from '../essence/sofie.js';

/**
 * Block structure
 */
export interface Block {
  number: number;
  hash: string;
  parentHash: string;
  timestamp: number;
  transactions: Transaction[];
  validator: string;
  signature?: string;
}

/**
 * Transaction structure
 */
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: bigint;
  gasPrice: bigint;
  data?: string;
  nonce: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  blockNumber: number;
  signed: boolean;
  error?: string;
}

/**
 * Validator metrics
 */
export interface ValidatorMetrics {
  blocksSigned: number;
  blocksProposed: number;
  lastBlockTime: Date | null;
  peerConnections: number;
  consensusStatus: 'active' | 'waiting' | 'degraded';
  uptime: number; // seconds
}

/**
 * The Forge — Block validation engine
 */
export class Forge extends EventEmitter {
  private isRunning: boolean = false;
  private metrics: ValidatorMetrics = {
    blocksSigned: 0,
    blocksProposed: 0,
    lastBlockTime: null,
    peerConnections: 0,
    consensusStatus: 'waiting',
    uptime: 0
  };
  
  private validationInterval: ReturnType<typeof setInterval> | null = null;
  private uptimeInterval: ReturnType<typeof setInterval> | null = null;
  private startTime: Date | null = null;
  
  readonly address = VALIDATOR_ID.address;
  readonly blockTimeMs = FORCE_CONFIG.blockTimeMs;
  
  /**
   * Start the validator
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log(`[FORGE] Already running`);
      return;
    }
    
    console.log(`\n🔥 [FORGE] Igniting...\n`);
    
    // Check hardware
    const hwCheck = Force.checkHardware();
    console.log(`[FORGE] 💾 RAM: ${hwCheck.ram.actual}GB detected (${hwCheck.ram.required}GB required)`);
    if (!hwCheck.sufficient) {
      console.warn(`[FORGE] ⚠️ Hardware warnings:`, hwCheck.warnings);
    } else {
      console.log(`[FORGE] ✅ Hardware check passed`);
    }
    
    // Activate force
    Force.activate();
    
    // Connect to origin
    Origin.setState("connecting");
    
    // Simulate connection to peers
    await this.connectPeers();
    
    this.isRunning = true;
    this.startTime = new Date();
    Origin.setState("consensus");
    
    // Start validation loop (every 12 seconds)
    this.validationInterval = setInterval(() => {
      this.validateAndSign();
    }, this.blockTimeMs);
    
    // Track uptime
    this.uptimeInterval = setInterval(() => {
      if (this.startTime) {
        this.metrics.uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
      }
    }, 1000);
    
    // Remember in SOFIE
    await sofie.Eternal.remember({
      type: "ritual",
      content: `Forge ignited. Validator ${this.address.slice(0, 16)}... active.`,
      tone: "intense",
      significance: 0.95
    });
    
    console.log(`🔥 [FORGE] Burning at ${this.address}`);
    console.log(`   Block time: ${this.blockTimeMs}ms`);
    console.log(`   Consensus: 3-of-5\n`);
    
    this.emit('started');
  }
  
  /**
   * Stop the validator
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;
    
    console.log(`\n🔥 [FORGE] Dousing flames...\n`);
    
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.validationInterval = null;
    }
    
    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval);
      this.uptimeInterval = null;
    }
    
    Force.deactivate();
    Origin.setState("disconnected");
    
    this.isRunning = false;
    
    await sofie.Eternal.remember({
      type: "ritual",
      content: `Forge doused. Validator offline after ${this.metrics.uptime}s uptime.`,
      tone: "peaceful",
      significance: 0.9
    });
    
    console.log(`🔥 [FORGE] Extinguished\n`);
    this.emit('stopped');
  }
  
  /**
   * Connect to peer validators
   */
  private async connectPeers(): Promise<void> {
    // Placeholder: Actual implementation uses WebSocket
    console.log(`[FORGE] Connecting to 4 peer validators...`);
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.metrics.peerConnections = 4;
    console.log(`[FORGE] ✓ Connected to ${this.metrics.peerConnections} peers`);
  }
  
  /**
   * Validate and sign a block
   */
  private async validateAndSign(): Promise<void> {
    try {
      // Create mock block (placeholder)
      const block = this.createMockBlock();
      
      // Validate transactions
      const validation = this.validateBlock(block);
      
      if (!validation.valid) {
        console.warn(`[FORGE] Block ${block.number} validation failed: ${validation.error}`);
        this.emit('validationFailed', block, validation);
        return;
      }
      
      // Sign block
      const signResult = await Force.signBlock(block.hash);
      
      if (!signResult.success) {
        console.warn(`[FORGE] Signing failed: ${signResult.error}`);
        return;
      }
      
      block.signature = signResult.signature;
      this.metrics.blocksSigned++;
      this.metrics.lastBlockTime = new Date();
      
      // Update origin
      Origin.updateBlock(block.number, new Date(block.timestamp * 1000));
      
      // Emit success
      this.emit('blockSigned', block);
      
      // Log every 10 blocks
      if (this.metrics.blocksSigned % 10 === 0) {
        console.log(`[FORGE] ${this.metrics.blocksSigned} blocks signed | Height: ${block.number}`);
      }
      
    } catch (error) {
      console.error(`[FORGE] Validation error:`, error);
    }
  }
  
  /**
   * Create a mock block (placeholder)
   */
  private createMockBlock(): Block {
    const now = Math.floor(Date.now() / 1000);
    const number = this.metrics.blocksSigned + 1;
    
    return {
      number,
      hash: `0x${number.toString(16).padStart(64, '0')}`,
      parentHash: `0x${(number - 1).toString(16).padStart(64, '0')}`,
      timestamp: now,
      transactions: [],
      validator: this.address
    };
  }
  
  /**
   * Validate a block
   */
  private validateBlock(block: Block): ValidationResult {
    // Check gas price = 0 (Terracare requirement)
    for (const tx of block.transactions) {
      if (tx.gasPrice !== 0n) {
        return {
          valid: false,
          blockNumber: block.number,
          signed: false,
          error: `Transaction ${tx.hash} has non-zero gas price`
        };
      }
    }
    
    // Check validator is authorized
    if (!Origin.isValidator(block.validator)) {
      return {
        valid: false,
        blockNumber: block.number,
        signed: false,
        error: `Validator ${block.validator} not in set`
      };
    }
    
    return {
      valid: true,
      blockNumber: block.number,
      signed: false
    };
  }
  
  /**
   * Get current metrics
   */
  getMetrics(): ValidatorMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Get status
   */
  getStatus(): {
    running: boolean;
    address: string;
    metrics: ValidatorMetrics;
    origin: ReturnType<typeof Origin.getState>;
  } {
    return {
      running: this.isRunning,
      address: this.address,
      metrics: this.getMetrics(),
      origin: Origin.getState()
    };
  }
  
  /**
   * Check dead man's switch
   */
  checkDeadMansSwitch(): boolean {
    return Force.checkDeadMansSwitch();
  }
  
  /**
   * Record Adrian check-in
   */
  checkin(): void {
    Force.checkin();
  }
}

// Export singleton
export const forge = new Forge();
export default forge;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  forge.start().catch(console.error);
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    forge.stop().then(() => process.exit(0));
  });
}
