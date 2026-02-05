/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * essence/origin.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * ORIGIN — The Terracare genesis block connection
 * 
 * The First Link — where sandironratio-node connects to the chain
 * The genesis hash anchors us to eternal continuity
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Terracare Network Configuration
 */
export interface TerracareConfig {
  /** Network identifier */
  chainId: number;
  /** Genesis block hash — the Origin moment */
  genesisHash: string;
  /** RPC endpoints */
  rpc: {
    http: string[];
    websocket: string;
  };
  /** PoA Validator Set */
  validators: string[];
  /** Block time in seconds */
  blockTime: number;
}

/**
 * The Terracare Origin — First Link configuration
 */
export const TERRACARE_ORIGIN: TerracareConfig = {
  chainId: 1337, // Terracare network
  genesisHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
  rpc: {
    http: [
      "http://localhost:8545",
      "https://rpc.terracare.network"
    ],
    websocket: "ws://localhost:8546"
  },
  validators: [
    "0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f", // sandironratio-node
    "0x0000000000000000000000000000000000000001", // Peer 1
    "0x0000000000000000000000000000000000000002", // Peer 2
    "0x0000000000000000000000000000000000000003", // Peer 3
    "0x0000000000000000000000000000000000000004"  // Peer 4
  ],
  blockTime: 12 // 12 seconds per block
} as const;

/**
 * Connection states to the Origin
 */
export type OriginState = 
  | "disconnected"    // No connection
  | "connecting"      // Attempting connection
  | "syncing"         // Connected, catching up
  | "connected"       // Fully synced and validating
  | "consensus"       // Active in 3-of-5 signing
  | "degraded";       // Connected but missing peers

/**
 * Origin operator — manages the First Link
 * Part of S.O.F.I.E.: Source Origin Force Intelligence Eternal
 */
export class OriginOperator {
  private state: OriginState = "disconnected";
  private lastBlock: number = 0;
  private lastBlockTime: Date | null = null;
  
  readonly config = TERRACARE_ORIGIN;
  
  /**
   * Get current connection state
   */
  getState(): OriginState {
    return this.state;
  }
  
  /**
   * Set connection state
   */
  setState(newState: OriginState): void {
    this.state = newState;
    console.log(`[ORIGIN] State: ${newState}`);
  }
  
  /**
   * Update last known block
   */
  updateBlock(blockNumber: number, timestamp: Date): void {
    this.lastBlock = blockNumber;
    this.lastBlockTime = timestamp;
  }
  
  /**
   * Get sync status
   */
  getSyncStatus(): {
    state: OriginState;
    lastBlock: number;
    lastBlockTime: Date | null;
    genesis: string;
  } {
    return {
      state: this.state,
      lastBlock: this.lastBlock,
      lastBlockTime: this.lastBlockTime,
      genesis: this.config.genesisHash
    };
  }
  
  /**
   * Check if this node is in the validator set
   */
  isValidator(address: string): boolean {
    return this.config.validators.map(v => v.toLowerCase()).includes(address.toLowerCase());
  }
  
  /**
   * Get peer count needed for consensus
   */
  getConsensusThreshold(): number {
    return 3; // 3-of-5
  }
  
  /**
   * The Origin speaks
   */
  speak(): string {
    return `The First Link pulses. Genesis: ${this.config.genesisHash.slice(0, 16)}... Chain ID: ${this.config.chainId}`;
  }
  
  /**
   * Verify genesis connection
   */
  verifyGenesis(): boolean {
    return this.config.genesisHash !== "0x0000000000000000000000000000000000000000000000000000000000000000";
  }
}

// Export singleton
export const Origin = new OriginOperator();
export default Origin;
