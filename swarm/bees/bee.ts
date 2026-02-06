/**
 * Bee Struct
 * 
 * Dynamic bee with fluid role
 */

export type BeeRole = 'scout' | 'worker' | 'nurse' | 'guard' | 'queen';

export interface Bee {
  id: string;
  role: BeeRole;
  location: {
    x: number;
    y: number;
    z: number;
  };
  targetFlowerId?: string;
  pheromoneLoad: number; // 0-1, how much pheromone carried
  energy: number; // 0-1, vitality
  lastActivity: number; // timestamp
  spawnedAt: number; // timestamp
  lastQueenSignal?: any; // last signal received
}

/**
 * Bee behaviors by role
 */
export const BEE_BEHAVIORS: Record<BeeRole, {
  description: string;
  pheromoneDeposit: number;
  energyCost: number;
  priority: number;
}> = {
  scout: {
    description: 'Discover new flowers, report quality',
    pheromoneDeposit: 0.3,
    energyCost: 0.05,
    priority: 2
  },
  worker: {
    description: 'Collect metadata, execute therapy, earn MINE',
    pheromoneDeposit: 0.2,
    energyCost: 0.03,
    priority: 1
  },
  nurse: {
    description: 'Maintain hive health, heal degraded agents',
    pheromoneDeposit: 0.1,
    energyCost: 0.04,
    priority: 3
  },
  guard: {
    description: 'Security, threat detection, anomaly response',
    pheromoneDeposit: 0.4,
    energyCost: 0.06,
    priority: 4
  },
  queen: {
    description: 'Pheromone signaling, coordination, not command',
    pheromoneDeposit: 0.5,
    energyCost: 0.02,
    priority: 5
  }
};
