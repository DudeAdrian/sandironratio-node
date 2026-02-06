/**
 * Swarm Sensors
 * 
 * Each Pollen bot is a neuron in the hive mind.
 * Sensors detect patterns from collective contributions.
 */

export interface DetectedPattern {
  type: string;
  confidence: number;
  nodes: string[];
  timestamp: number;
  metadata: Record<string, any>;
}

export class SwarmSensors {
  private recentContributions: Map<string, any[]> = new Map();
  private patterns: DetectedPattern[] = [];

  process(node: any, metadata: Record<string, any>): void {
    // Store contribution for pattern analysis
    const nodeContributions = this.recentContributions.get(node.id) || [];
    nodeContributions.push({ ...metadata, timestamp: Date.now() });
    
    // Keep only last 100 contributions per node
    if (nodeContributions.length > 100) nodeContributions.shift();
    this.recentContributions.set(node.id, nodeContributions);
    
    // Analyze for patterns
    this.analyzePatterns();
  }

  detectPatterns(): DetectedPattern[] {
    return this.patterns;
  }

  private analyzePatterns(): void {
    // Simple pattern detection: find similar contributions across nodes
    const allContributions: any[] = [];
    for (const [nodeId, contributions] of this.recentContributions) {
      contributions.forEach(c => allContributions.push({ ...c, nodeId }));
    }
    
    // Group by activity type
    const byActivity = this.groupBy(allContributions, 'activity');
    
    // Find clusters
    const newPatterns: DetectedPattern[] = [];
    for (const [activity, items] of byActivity) {
      if (items.length >= 3) {
        newPatterns.push({
          type: activity,
          confidence: Math.min(items.length / 10, 1.0),
          nodes: [...new Set(items.map((i: any) => i.nodeId))],
          timestamp: Date.now(),
          metadata: { count: items.length }
        });
      }
    }
    
    this.patterns = newPatterns;
  }

  private groupBy(array: any[], key: string): Map<string, any[]> {
    return array.reduce((map, item) => {
      const group = item[key];
      if (group) {
        const list = map.get(group) || [];
        list.push(item);
        map.set(group, list);
      }
      return map;
    }, new Map());
  }
}
