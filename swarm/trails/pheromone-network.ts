/**
 * Pheromone Network
 * 
 * Trails guide bees, fade over time, strongest wins
 */

export interface PheromoneTrail {
  id: string;
  location: {
    x: number;
    y: number;
    z: number;
  };
  type: string;
  intensity: number; // 0-1, strength of signal
  flowerId?: string;
  metadata: Record<string, any>;
  depositedAt: number;
  lastRefreshed: number;
  depositCount: number;
}

export interface TrailPattern {
  type: string;
  locations: Array<{ x: number; y: number; z: number }>;
  averageIntensity: number;
  confidence: number;
}

export class PheromoneNetwork {
  private trails: Map<string, PheromoneTrail> = new Map();
  private spatialIndex: Map<string, Set<string>> = new Map(); // grid cell -> trail IDs
  private decayRate: number;
  private cellSize = 50; // spatial grid cell size

  constructor(decayRate: number = 0.995) {
    this.decayRate = decayRate;
  }

  async initialize(): Promise<void> {
    console.log(`[Trails] Pheromone network initialized (decay: ${this.decayRate})`);
  }

  /**
   * Deposit pheromone at location
   */
  deposit(
    location: { x: number; y: number; z?: number },
    data: {
      type: string;
      intensity: number;
      flowerId?: string;
      metadata?: Record<string, any>;
    }
  ): PheromoneTrail {
    const cell = this.getCell(location);
    const trailId = `${cell}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    // Check for existing trail at this location
    const existing = this.findTrailAt(location, 10);
    
    if (existing) {
      // Refresh existing trail
      existing.intensity = Math.min(existing.intensity + data.intensity, 1.0);
      existing.lastRefreshed = Date.now();
      existing.depositCount++;
      return existing;
    }
    
    // Create new trail
    const trail: PheromoneTrail = {
      id: trailId,
      location: { x: location.x, y: location.y, z: location.z || 0 },
      type: data.type,
      intensity: data.intensity,
      flowerId: data.flowerId,
      metadata: data.metadata || {},
      depositedAt: Date.now(),
      lastRefreshed: Date.now(),
      depositCount: 1
    };
    
    this.trails.set(trailId, trail);
    
    // Add to spatial index
    if (!this.spatialIndex.has(cell)) {
      this.spatialIndex.set(cell, new Set());
    }
    this.spatialIndex.get(cell)!.add(trailId);
    
    return trail;
  }

  /**
   * Get strongest trails from a location
   */
  getStrongestFrom(
    location: { x: number; y: number; z?: number },
    limit: number = 5,
    radius: number = 200
  ): PheromoneTrail[] {
    const nearby = this.getTrailsInRadius(location, radius);
    
    return nearby
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, limit);
  }

  /**
   * Get trails by pattern type
   */
  getPatterns(context: string): Array<{ type: string; intensity: number }> {
    const patterns = new Map<string, number>();
    
    for (const trail of this.trails.values()) {
      if (trail.type.includes(context) || context === 'all') {
        const current = patterns.get(trail.type) || 0;
        patterns.set(trail.type, current + trail.intensity);
      }
    }
    
    return Array.from(patterns.entries())
      .map(([type, intensity]) => ({ type, intensity }))
      .sort((a, b) => b.intensity - a.intensity);
  }

  /**
   * Evolve trails - decay over time
   */
  evolve(): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    for (const [id, trail] of this.trails) {
      // Decay based on time since last refresh
      const age = now - trail.lastRefreshed;
      const decayFactor = Math.pow(this.decayRate, age / 1000);
      
      trail.intensity *= decayFactor;
      
      // Remove faded trails
      if (trail.intensity < 0.01) {
        toDelete.push(id);
      }
    }
    
    // Delete faded trails
    for (const id of toDelete) {
      this.removeTrail(id);
    }
  }

  /**
   * Find efficient path between locations using trails
   */
  findPath(
    from: { x: number; y: number; z?: number },
    to: { x: number; y: number; z?: number },
    maxSteps: number = 10
  ): Array<{ x: number; y: number; z: number }> {
    const path: Array<{ x: number; y: number; z: number }> = [from];
    let current = from;
    
    for (let step = 0; step < maxSteps; step++) {
      // Get trails leading toward destination
      const trails = this.getStrongestFrom(current, 3, 150);
      
      if (trails.length === 0) break;
      
      // Pick trail that reduces distance to destination
      let bestTrail = trails[0];
      let bestDistance = this.distance(bestTrail.location, to);
      
      for (const trail of trails) {
        const dist = this.distance(trail.location, to);
        if (dist < bestDistance) {
          bestDistance = dist;
          bestTrail = trail;
        }
      }
      
      current = bestTrail.location;
      path.push(current);
      
      if (bestDistance < 10) break; // Close enough
    }
    
    return path;
  }

  count(): number {
    return this.trails.size;
  }

  // Private helpers
  private getCell(location: { x: number; y: number; z?: number }): string {
    const cx = Math.floor(location.x / this.cellSize);
    const cy = Math.floor(location.y / this.cellSize);
    const cz = Math.floor((location.z || 0) / this.cellSize);
    return `${cx},${cy},${cz}`;
  }

  private getTrailsInRadius(
    location: { x: number; y: number; z?: number },
    radius: number
  ): PheromoneTrail[] {
    const centerCell = this.getCell(location);
    const [cx, cy, cz] = centerCell.split(',').map(Number);
    
    const nearby: PheromoneTrail[] = [];
    const cellRadius = Math.ceil(radius / this.cellSize);
    
    // Check neighboring cells
    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        for (let dz = -cellRadius; dz <= cellRadius; dz++) {
          const cell = `${cx + dx},${cy + dy},${cz + dz}`;
          const trailIds = this.spatialIndex.get(cell);
          
          if (trailIds) {
            for (const id of trailIds) {
              const trail = this.trails.get(id);
              if (trail && this.distance(location, trail.location) <= radius) {
                nearby.push(trail);
              }
            }
          }
        }
      }
    }
    
    return nearby;
  }

  private findTrailAt(
    location: { x: number; y: number; z?: number },
    tolerance: number
  ): PheromoneTrail | null {
    const nearby = this.getTrailsInRadius(location, tolerance);
    return nearby.length > 0 ? nearby[0] : null;
  }

  private removeTrail(id: string): void {
    const trail = this.trails.get(id);
    if (!trail) return;
    
    const cell = this.getCell(trail.location);
    this.spatialIndex.get(cell)?.delete(id);
    this.trails.delete(id);
  }

  private distance(a: any, b: any): number {
    const dx = (a.x || 0) - (b.x || 0);
    const dy = (a.y || 0) - (b.y || 0);
    const dz = (a.z || 0) - (b.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}
