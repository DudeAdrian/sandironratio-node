/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * hive/nectar-ledger-bridge.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * NECTAR LEDGER BRIDGE — Integration with Terracare-Ledger
 * 
 * Methods:
 * - mintNectar: Submit proof to Ledger, receive Nectar tokens
 * - getNectarBalance: Query on-chain balance (shadow + confirmed)
 * - graduateAgent: Level 1→2 ceremony (shadow to confirmed)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';
import { hexStore } from '../db/hex-store.js';
import { HIVES } from '../config/hives.js';

export interface NectarMintRequest {
  agentId: string;
  amount: number;
  proofHash: string;
  activityType: string;
  duration: number;
  consensusStrength: number;
  chamberAddress: string;
  hiveId: number;
}

export interface NectarMintResult {
  success: boolean;
  txHash?: string;
  amount: number;
  newBalance: number;
  error?: string;
}

export interface NectarBalance {
  agentId: string;
  shadowNectar: number;    // Level 1 (pre-wallet)
  confirmedNectar: number; // Level 2+ (on-chain)
  total: number;
  graduationLevel: number;
}

export interface GraduationResult {
  success: boolean;
  agentId: string;
  previousLevel: number;
  newLevel: number;
  shadowConverted: number;
  txHash?: string;
}

/**
 * Activity type nectar multipliers
 */
const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  'wellness_tai_chi': 1.3,
  'wellness_meditation': 1.2,
  'wellness_frequency': 1.4,
  'creative_website': 1.5,
  'creative_mobile_app': 1.6,
  'creative_document': 1.1,
  'creative_image': 1.4,
  'creative_audio': 1.3,
  'creative_code': 1.4,
  'social_post': 1.2,
  'technical_iot': 1.3,
  'default': 1.0
};

/**
 * Bee role nectar multipliers
 */
const ROLE_MULTIPLIERS: Record<string, number> = {
  'scout': 1.3,
  'worker': 1.2,
  'nurse': 1.25,
  'guard': 1.4,
  'queen': 2.0
};

/**
 * Nectar Ledger Bridge
 */
export class NectarLedgerBridge extends EventEmitter {
  private ledgerEndpoint: string = 'http://localhost:8545'; // Terracare Ledger RPC
  private isConnected: boolean = false;
  
  /**
   * Initialize connection to Ledger
   */
  async initialize(): Promise<boolean> {
    console.log(`[NECTAR-BRIDGE] Initializing connection to Terracare Ledger...`);
    
    try {
      // Placeholder: In real implementation, would:
      // 1. Connect to Ethereum-compatible RPC
      // 2. Verify contract deployment
      // 3. Check wallet balance for gas
      
      this.isConnected = true;
      console.log(`[NECTAR-BRIDGE] ✓ Connected to Ledger at ${this.ledgerEndpoint}`);
      
      this.emit('connected');
      return true;
      
    } catch (error) {
      console.error(`[NECTAR-BRIDGE] Connection failed:`, error);
      this.emit('error', error);
      return false;
    }
  }
  
  /**
   * Calculate nectar reward
   */
  calculateNectarReward(
    activityType: string,
    duration: number,
    consensusStrength: number,
    beeRole: string
  ): number {
    // Base reward: 10 nectar per minute
    const baseReward = (duration / 60) * 10;
    
    // Activity multiplier
    const activityMult = ACTIVITY_MULTIPLIERS[activityType] || ACTIVITY_MULTIPLIERS['default'];
    
    // Role multiplier
    const roleMult = ROLE_MULTIPLIERS[beeRole] || 1.0;
    
    // Consensus bonus (0.5 to 1.5 based on alignment)
    const consensusBonus = 0.5 + (consensusStrength * 1.0);
    
    // Calculate final amount
    const amount = baseReward * activityMult * roleMult * consensusBonus;
    
    return Math.round(amount * 100) / 100; // Round to 2 decimals
  }
  
  /**
   * Mint Nectar tokens
   */
  async mintNectar(request: NectarMintRequest): Promise<NectarMintResult> {
    if (!this.isConnected) {
      await this.initialize();
    }
    
    console.log(`[NECTAR-BRIDGE] Minting ${request.amount} Nectar for ${request.agentId}...`);
    
    try {
      // Get agent details
      const agent = hexStore.getAgent(request.agentId);
      if (!agent) {
        return { success: false, amount: 0, newBalance: 0, error: 'Agent not found' };
      }
      
      // Add to shadow nectar (Level 1)
      hexStore.addShadowNectar(request.agentId, request.amount);
      
      // Placeholder: In real implementation, would:
      // 1. Submit transaction to Ledger smart contract
      // 2. Wait for confirmation
      // 3. Update agent's confirmed balance
      
      // Generate mock transaction hash
      const txHash = this.generateTxHash(request);
      
      // Get updated balance
      const updatedAgent = hexStore.getAgent(request.agentId);
      const newBalance = (updatedAgent?.shadow_nectar || 0) + (updatedAgent?.nectar_balance || 0);
      
      console.log(`[NECTAR-BRIDGE] ✓ Minted ${request.amount} Nectar (TX: ${txHash.slice(0, 20)}...)`);
      
      this.emit('nectarMinted', {
        agentId: request.agentId,
        amount: request.amount,
        txHash
      });
      
      return {
        success: true,
        txHash,
        amount: request.amount,
        newBalance
      };
      
    } catch (error) {
      console.error(`[NECTAR-BRIDGE] Mint failed:`, error);
      
      return {
        success: false,
        amount: request.amount,
        newBalance: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get Nectar balance (shadow + confirmed)
   */
  async getNectarBalance(agentId: string): Promise<NectarBalance> {
    const agent = hexStore.getAgent(agentId);
    
    if (!agent) {
      return {
        agentId,
        shadowNectar: 0,
        confirmedNectar: 0,
        total: 0,
        graduationLevel: 1
      };
    }
    
    // Placeholder: In real implementation, would also query Ledger
    // for on-chain confirmed balance
    
    return {
      agentId: agent.agent_id,
      shadowNectar: agent.shadow_nectar,
      confirmedNectar: agent.nectar_balance,
      total: agent.shadow_nectar + agent.nectar_balance,
      graduationLevel: agent.graduation_level
    };
  }
  
  /**
   * Graduate agent from Level 1→2
   * Converts shadow nectar to confirmed nectar
   */
  async graduateAgent(agentId: string): Promise<GraduationResult> {
    console.log(`[NECTAR-BRIDGE] Graduating agent ${agentId}...`);
    
    const agent = hexStore.getAgent(agentId);
    
    if (!agent) {
      return {
        success: false,
        agentId,
        previousLevel: 1,
        newLevel: 1,
        shadowConverted: 0,
        error: 'Agent not found'
      };
    }
    
    if (agent.graduation_level >= 2) {
      return {
        success: false,
        agentId,
        previousLevel: agent.graduation_level,
        newLevel: agent.graduation_level,
        shadowConverted: 0,
        error: 'Already graduated'
      };
    }
    
    const shadowAmount = agent.shadow_nectar;
    
    if (shadowAmount < 1000) {
      return {
        success: false,
        agentId,
        previousLevel: 1,
        newLevel: 1,
        shadowConverted: 0,
        error: 'Insufficient shadow nectar (minimum 1000)'
      };
    }
    
    try {
      // Placeholder: In real implementation, would:
      // 1. Create on-chain wallet for agent
      // 2. Transfer shadow nectar to confirmed
      // 3. Update agent graduation level
      
      // Generate transaction hash
      const txHash = this.generateTxHash({ agentId, amount: shadowAmount });
      
      // Update agent in database
      hexStore.graduateAgent(agentId);
      
      console.log(`[NECTAR-BRIDGE] ✓ Agent ${agentId} graduated to Level 2`);
      console.log(`   Shadow converted: ${shadowAmount} Nectar`);
      console.log(`   TX: ${txHash.slice(0, 20)}...`);
      
      this.emit('agentGraduated', {
        agentId,
        shadowConverted: shadowAmount,
        txHash
      });
      
      return {
        success: true,
        agentId,
        previousLevel: 1,
        newLevel: 2,
        shadowConverted: shadowAmount,
        txHash
      };
      
    } catch (error) {
      console.error(`[NECTAR-BRIDGE] Graduation failed:`, error);
      
      return {
        success: false,
        agentId,
        previousLevel: 1,
        newLevel: 1,
        shadowConverted: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Batch mint nectar for multiple agents
   */
  async batchMintNectar(requests: NectarMintRequest[]): Promise<NectarMintResult[]> {
    console.log(`[NECTAR-BRIDGE] Batch minting ${requests.length} nectar rewards...`);
    
    const results: NectarMintResult[] = [];
    
    for (const request of requests) {
      const result = await this.mintNectar(request);
      results.push(result);
    }
    
    console.log(`[NECTAR-BRIDGE] Batch complete: ${results.filter(r => r.success).length}/${results.length} successful`);
    
    return results;
  }
  
  /**
   * Generate transaction hash (placeholder)
   */
  private generateTxHash(data: unknown): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(JSON.stringify(data) + Date.now()).digest('hex');
    return `0x${hash.slice(0, 40)}`;
  }
  
  /**
   * Get global nectar statistics
   */
  async getGlobalStats(): Promise<{
    totalMinted: number;
    totalShadow: number;
    totalConfirmed: number;
    graduatedAgents: number;
    pendingGraduation: number;
  }> {
    // Placeholder: In real implementation, would query database
    // and Ledger for accurate statistics
    
    return {
      totalMinted: 0,
      totalShadow: 0,
      totalConfirmed: 0,
      graduatedAgents: 0,
      pendingGraduation: 0
    };
  }
}

// Export singleton
export const nectarBridge = new NectarLedgerBridge();
export default nectarBridge;
