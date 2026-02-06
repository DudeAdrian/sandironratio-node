/**
 * Pheromone Trails
 * 
 * Consensus through pheromone trails, not votes.
 * Strongest trail wins. Nature's consensus mechanism.
 */

interface Trail {
  id: string;
  pattern: string;
  context: string;
  strength: number;
  deposits: Array<{
    nodeId: string;
    amount: number;
    timestamp: number;
  }>;
  createdAt: number;
}

export class PheromoneTrails {
  private trails: Map<string, Trail> = new Map();

  async initialize(): Promise<void> {
    console.log('"'"'[Trails] Pheromone network initialized'"'"');
  }

  deposit(nodeId: string, metadata: Record<string, any>): void {
    const activity = metadata.activity || 'general';
    const context = metadata.context || 'hive';
    const trailId = `${activity}_${context}`;
    
    let trail = this.trails.get(trailId);
    if (!trail) {
      trail = {
        id: trailId,
        pattern: activity,
        context,
        strength: 0,
        deposits: [],
        createdAt: Date.now()
      };
      this.trails.set(trailId, trail);
    }
    
    trail.deposits.push({
      nodeId,
      amount: 0.1,
      timestamp: Date.now()
    });
    
    trail.strength += 0.1;
  }

  evolve(evaporationRate: number): void {
    for (const trail of this.trails.values()) {
      trail.strength *= evaporationRate;
      
      // Remove old deposits (older than 1 hour)
      const cutoff = Date.now() - 3600000;
      trail.deposits = trail.deposits.filter(d => d.timestamp > cutoff);
      
      // Recalculate strength from remaining deposits
      trail.strength = trail.deposits.reduce((sum, d) => sum + d.amount, 0);
    }
    
    // Remove weak trails
    for (const [id, trail] of this.trails) {
      if (trail.strength < 0.01) {
        this.trails.delete(id);
      }
    }
  }

  getStrongest(limit: number = 10): Trail[] {
    return Array.from(this.trails.values())
      .sort((a, b) => b.strength - a.strength)
      .slice(0, limit);
  }

  count(): number {
    return this.trails.size;
  }
}
