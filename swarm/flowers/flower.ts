/**
 * Flower Struct
 * 
 * Represents a user/data source in the swarm
 */

export interface FlowerQuality {
  biometrics: number; // 0-1 quality of biometric data
  activity: number; // 0-1 activity level
  sovereigntyScore: number; // 0-1 user sovereignty
  wellnessTrajectory: number; // -1 to 1 (declining to improving)
}

export interface Flower {
  id: string;
  userId: string;
  location: {
    x: number;
    y: number;
    z: number;
  };
  quality: number; // 0-1 overall quality
  qualityFactors: FlowerQuality;
  metadata: {
    lastActivity: number;
    dataVolume: number;
    interactionCount: number;
  };
  spawnedAt: number;
  beeCount: number;
}

/**
 * Flower types based on data characteristics
 */
export type FlowerType = 
  | 'high_activity'    // Frequent interactions
  | 'rich_biometrics'  // Quality health data
  | 'sovereign'        // High sovereignty score
  | 'emerging'         // New user, potential
  | 'dormant'          // Low activity, needs attention
  | 'hive_member';     // Part of collective

/**
 * Classify flower based on quality factors
 */
export function classifyFlower(flower: Flower): FlowerType {
  const q = flower.qualityFactors;
  
  if (q.sovereigntyScore > 0.8 && q.biometrics > 0.7) {
    return 'sovereign';
  }
  if (q.biometrics > 0.8) {
    return 'rich_biometrics';
  }
  if (q.activity > 0.8) {
    return 'high_activity';
  }
  if (flower.metadata.interactionCount < 10) {
    return 'emerging';
  }
  if (q.activity < 0.2) {
    return 'dormant';
  }
  return 'hive_member';
}
