/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * hive/bee-roles.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * BEE ROLE ASSIGNMENT — Based on Life Path Numerology
 * 
 * Roles:
 * - Scout: Exploration, discovery (Life Paths 1, 5, 7)
 * - Worker: Maintenance, execution (Life Paths 2, 4, 8)
 * - Nurse: Wellness, healing (Life Paths 3, 6, 9)
 * - Guard: Security, validation (Master Numbers 11, 22, 33 or special)
 * - Queen: Coordination (Reserved for Hive Consciousness nodes)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export type BeeRole = 'scout' | 'worker' | 'nurse' | 'guard' | 'queen';

export interface BeeRoleConfig {
  role: BeeRole;
  description: string;
  duties: string[];
  nectarMultiplier: number;
  color: string; // For visualization
}

/**
 * Bee role definitions
 */
export const BEE_ROLES: Record<BeeRole, BeeRoleConfig> = {
  scout: {
    role: 'scout',
    description: 'Discovers opportunities, explores new chambers, finds resources',
    duties: [
      'Explore adjacent chambers',
      'Report wall state changes',
      'Discover new consensus patterns',
      'Map hex grid topology'
    ],
    nectarMultiplier: 1.3,
    color: '#FFD700' // Gold
  },
  worker: {
    role: 'worker',
    description: 'Maintains chambers, executes tasks, builds consensus',
    duties: [
      'Maintain chamber wall states',
      'Execute consensus protocols',
      'Process proof submissions',
      'Support chamber infrastructure'
    ],
    nectarMultiplier: 1.2,
    color: '#4169E1' // Royal Blue
  },
  nurse: {
    role: 'nurse',
    description: 'Wellness support, healing protocols, community care',
    duties: [
      'Monitor agent wellness',
      'Support graduation ceremonies',
      'Heal degraded chambers',
      'Maintain community health'
    ],
    nectarMultiplier: 1.25,
    color: '#32CD32' // Lime Green
  },
  guard: {
    role: 'guard',
    description: 'Security, validation, threat detection',
    duties: [
      'Validate proof submissions',
      'Monitor for sybil attacks',
      'Protect consensus integrity',
      'Guard chamber boundaries'
    ],
    nectarMultiplier: 1.4,
    color: '#DC143C' // Crimson
  },
  queen: {
    role: 'queen',
    description: 'Hive coordination, consensus orchestration (Reserved)',
    duties: [
      'Orchestrate hive-wide consensus',
      'Coordinate migrations',
      'Signal chamber state changes',
      'Govern nectar distribution'
    ],
    nectarMultiplier: 2.0,
    color: '#8B008B' // Dark Magenta
  }
};

/**
 * Calculate Life Path number from birth date
 */
export function calculateLifePath(birthDate: Date): number {
  const day = birthDate.getDate();
  const month = birthDate.getMonth() + 1;
  const year = birthDate.getFullYear();
  
  // Reduce each component to single digit (or master number)
  const dayNum = reduceToDigit(day);
  const monthNum = reduceToDigit(month);
  const yearNum = reduceToDigit(year);
  
  // Sum and reduce
  const sum = dayNum + monthNum + yearNum;
  return reduceToDigit(sum);
}

/**
 * Reduce number to single digit or master number (11, 22, 33)
 */
function reduceToDigit(num: number): number {
  // Master numbers stay as is
  if (num === 11 || num === 22 || num === 33) {
    return num;
  }
  
  // Reduce to single digit
  let sum = num;
  while (sum > 9) {
    sum = sum.toString().split('').reduce((a, b) => a + parseInt(b), 0);
    
    // Check for master number during reduction
    if (sum === 11 || sum === 22 || sum === 33) {
      return sum;
    }
  }
  
  return sum;
}

/**
 * Assign bee role based on Life Path number
 */
export function assignBeeRole(lifePath: number): BeeRole {
  // Master numbers or special combinations → Guard
  if (lifePath === 11 || lifePath === 22 || lifePath === 33) {
    return 'guard';
  }
  
  // Scout: 1, 5, 7 (Leadership, Freedom, Spirituality)
  if ([1, 5, 7].includes(lifePath)) {
    return 'scout';
  }
  
  // Worker: 2, 4, 8 (Cooperation, Stability, Power)
  if ([2, 4, 8].includes(lifePath)) {
    return 'worker';
  }
  
  // Nurse: 3, 6, 9 (Creativity, Nurturing, Completion)
  if ([3, 6, 9].includes(lifePath)) {
    return 'nurse';
  }
  
  // Default to worker
  return 'worker';
}

/**
 * Assign bee role from birth date
 */
export function assignBeeRoleFromBirthDate(birthDate: Date): { role: BeeRole; lifePath: number } {
  const lifePath = calculateLifePath(birthDate);
  const role = assignBeeRole(lifePath);
  
  return { role, lifePath };
}

/**
 * Get role configuration
 */
export function getRoleConfig(role: BeeRole): BeeRoleConfig {
  return BEE_ROLES[role];
}

/**
 * Calculate role distribution in a hive
 */
export function calculateRoleDistribution(agentRoles: BeeRole[]): Record<BeeRole, number> {
  const distribution: Record<BeeRole, number> = {
    scout: 0,
    worker: 0,
    nurse: 0,
    guard: 0,
    queen: 0
  };
  
  for (const role of agentRoles) {
    distribution[role]++;
  }
  
  return distribution;
}

/**
 * Get optimal role ratios for a healthy hive
 */
export function getOptimalRoleRatios(): Record<BeeRole, number> {
  return {
    scout: 0.10,    // 10% - Explorers
    worker: 0.60,   // 60% - Core workforce
    nurse: 0.20,    // 20% - Healers
    guard: 0.10,    // 10% - Security
    queen: 0.00     // 0% - Reserved (1 per hive)
  };
}

/**
 * Check if hive role distribution is healthy
 */
export function isRoleDistributionHealthy(distribution: Record<BeeRole, number>, total: number): boolean {
  const optimal = getOptimalRoleRatios();
  
  for (const role of Object.keys(optimal) as BeeRole[]) {
    const actual = distribution[role] / total;
    const target = optimal[role];
    
    // Allow 50% deviation from optimal
    if (Math.abs(actual - target) > target * 0.5) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get role description with stats
 */
export function getRoleStats(role: BeeRole, count: number, total: number): string {
  const config = BEE_ROLES[role];
  const percentage = ((count / total) * 100).toFixed(1);
  
  return `${config.role.toUpperCase()}: ${count} (${percentage}%) - ${config.description}`;
}

/**
 * Assign role with geographic influence
 * If agent is near hive center → higher chance of Queen/Guard
 * If agent is on periphery → higher chance of Scout
 */
export function assignBeeRoleWithGeography(
  birthDate: Date, 
  distanceFromCenter: number, // 0.0 to 1.0
  isValidator: boolean = false
): { role: BeeRole; lifePath: number; reason: string } {
  const { role: baseRole, lifePath } = assignBeeRoleFromBirthDate(birthDate);
  
  // Validators become Guards
  if (isValidator) {
    return { role: 'guard', lifePath, reason: 'Validator status' };
  }
  
  // Center agents (distance < 0.1) can become Queens (rare)
  if (distanceFromCenter < 0.01 && Math.random() < 0.001) {
    return { role: 'queen', lifePath, reason: 'Hive center proximity (1/1000 chance)' };
  }
  
  // Near-center agents more likely to be Guards
  if (distanceFromCenter < 0.1 && Math.random() < 0.3) {
    return { role: 'guard', lifePath, reason: 'Near-center location' };
  }
  
  // Periphery agents more likely to be Scouts
  if (distanceFromCenter > 0.8 && Math.random() < 0.3) {
    return { role: 'scout', lifePath, reason: 'Periphery location' };
  }
  
  return { role: baseRole, lifePath, reason: 'Life Path numerology' };
}

/**
 * Life Path meanings for reference
 */
export const LIFE_PATH_MEANINGS: Record<number, string> = {
  1: 'The Leader - Independence, pioneering, creation',
  2: 'The Diplomat - Cooperation, balance, sensitivity',
  3: 'The Creator - Expression, joy, communication',
  4: 'The Builder - Stability, hard work, foundation',
  5: 'The Explorer - Freedom, adaptability, change',
  6: 'The Nurturer - Responsibility, service, harmony',
  7: 'The Seeker - Spirituality, analysis, wisdom',
  8: 'The Powerhouse - Ambition, authority, success',
  9: 'The Humanitarian - Compassion, completion, giving',
  11: 'The Intuitive - Illumination, intuition, sensitivity (Master)',
  22: 'The Master Builder - Practical idealism, large-scale vision (Master)',
  33: 'The Master Teacher - Compassionate guidance, blessing (Master)'
};

/**
 * Get life path meaning
 */
export function getLifePathMeaning(lifePath: number): string {
  return LIFE_PATH_MEANINGS[lifePath] || 'Unknown Life Path';
}
