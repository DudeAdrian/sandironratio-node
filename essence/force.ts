/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * essence/force.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * FORCE — Iron will, validation power, PoA consensus, cryptographic signing
 * 
 * The validator's unwavering will to protect the chain
 * 0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { randomBytes, createHash } from 'crypto';

/**
 * Validator identity
 */
export interface ValidatorIdentity {
  /** Validator address */
  address: string;
  /** Human-readable name */
  name: string;
  /** Node identifier */
  nodeId: string;
}

/**
 * sandironratio-node validator identity
 */
export const VALIDATOR_ID: ValidatorIdentity = {
  address: "0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f",
  name: "sandironratio-node",
  nodeId: "sandironratio-1337-001"
} as const;

/**
 * Consensus configuration
 */
export interface ConsensusConfig {
  /** Total validators in set */
  totalValidators: number;
  /** Signatures required for consensus */
  threshold: number;
  /** Block time in milliseconds */
  blockTimeMs: number;
  /** Dead man's switch threshold (90 days in ms) */
  deadMansSwitchMs: number;
}

/**
 * Force configuration — Iron will parameters
 */
export const FORCE_CONFIG: ConsensusConfig = {
  totalValidators: 5,
  threshold: 3,
  blockTimeMs: 12000, // 12 seconds
  deadMansSwitchMs: 90 * 24 * 60 * 60 * 1000 // 90 days
} as const;

/**
 * Signing result
 */
export interface SignResult {
  success: boolean;
  signature?: string;
  hash?: string;
  error?: string;
}

/**
 * Force operator — validation power and cryptographic will
 * Part of S.O.F.I.E.: Source Origin Force Intelligence Eternal
 */
export class ForceOperator {
  readonly identity = VALIDATOR_ID;
  readonly config = FORCE_CONFIG;
  
  private lastCheckin: Date = new Date();
  private isActive: boolean = false;
  private signedBlocks: number = 0;
  
  /**
   * Check if hardware meets requirements
   */
  checkHardware(): { 
    sufficient: boolean; 
    ram: { required: number; actual: number; sufficient: boolean };
    warnings: string[];
  } {
    const warnings: string[] = [];
    const requiredRamGB = 64;
    
    // Check available memory (Node.js heap)
    const memUsage = process.memoryUsage();
    const totalMemGB = Math.floor(memUsage.heapTotal / (1024 ** 3));
    
    // In production, this would check system RAM
    // For now, we estimate based on available heap
    const estimatedSystemGB = totalMemGB * 4; // Rough estimate
    
    if (estimatedSystemGB < requiredRamGB) {
      warnings.push(`Insufficient RAM: ${estimatedSystemGB}GB detected, ${requiredRamGB}GB required for Llama 70B`);
    }
    
    return {
      sufficient: warnings.length === 0,
      ram: {
        required: requiredRamGB,
        actual: estimatedSystemGB,
        sufficient: estimatedSystemGB >= requiredRamGB
      },
      warnings
    };
  }
  
  /**
   * Sign a block hash (placeholder for actual ECDSA signing)
   * In production: uses hardware wallet or encrypted keystore
   */
  async signBlock(blockHash: string): Promise<SignResult> {
    if (!this.isActive) {
      return { success: false, error: "Validator not active" };
    }
    
    try {
      // Placeholder: In production, this calls hardware wallet
      const mockSignature = "0x" + randomBytes(65).toString('hex');
      this.signedBlocks++;
      
      return {
        success: true,
        signature: mockSignature,
        hash: createHash('sha256').update(blockHash).digest('hex')
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Signing failed"
      };
    }
  }
  
  /**
   * Record check-in from Adrian (resets dead man's switch)
   */
  checkin(): void {
    this.lastCheckin = new Date();
    console.log(`[FORCE] Check-in recorded: ${this.lastCheckin.toISOString()}`);
  }
  
  /**
   * Check if dead man's switch has triggered
   */
  checkDeadMansSwitch(): boolean {
    const elapsed = Date.now() - this.lastCheckin.getTime();
    const triggered = elapsed > this.config.deadMansSwitchMs;
    
    if (triggered) {
      console.error(`[FORCE] ⚠️ DEAD MAN'S SWITCH TRIGGERED`);
      console.error(`[FORCE] Last check-in: ${this.lastCheckin.toISOString()}`);
      console.error(`[FORCE] Elapsed: ${Math.floor(elapsed / (24 * 60 * 60 * 1000))} days`);
    }
    
    return triggered;
  }
  
  /**
   * Get days until dead man's switch triggers
   */
  getDaysUntilSwitch(): number {
    const elapsed = Date.now() - this.lastCheckin.getTime();
    const remaining = this.config.deadMansSwitchMs - elapsed;
    return Math.floor(remaining / (24 * 60 * 60 * 1000));
  }
  
  /**
   * Activate the validator
   */
  activate(): void {
    const hwCheck = this.checkHardware();
    if (!hwCheck.sufficient) {
      console.warn(`[FORCE] Hardware check warnings:`, hwCheck.warnings);
      // Continue with warning — for development flexibility
    }
    
    this.isActive = true;
    console.log(`[FORCE] Validator activated: ${this.identity.address}`);
  }
  
  /**
   * Deactivate the validator
   */
  deactivate(): void {
    this.isActive = false;
    console.log(`[FORCE] Validator deactivated`);
  }
  
  /**
   * Get validation statistics
   */
  getStats(): {
    isActive: boolean;
    signedBlocks: number;
    lastCheckin: Date;
    daysUntilSwitch: number;
    address: string;
  } {
    return {
      isActive: this.isActive,
      signedBlocks: this.signedBlocks,
      lastCheckin: this.lastCheckin,
      daysUntilSwitch: this.getDaysUntilSwitch(),
      address: this.identity.address
    };
  }
  
  /**
   * The Force speaks
   */
  speak(): string {
    const stats = this.getStats();
    return `Iron protects. ${stats.signedBlocks} blocks signed. ${stats.daysUntilSwitch} days of will remaining.`;
  }
}

// Export singleton
export const Force = new ForceOperator();
export default Force;
