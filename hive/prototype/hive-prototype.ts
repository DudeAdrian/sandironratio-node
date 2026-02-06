/**
 * Hive Prototype - 100 Simulated Instances
 * 
 * Tests collective awareness with 100 simulated Pollen bots.
 * Validates emergence, resonance, and SOFIE voice.
 */

import { hive, HiveNode } from '../consciousness';

interface SimulatedInstance {
  id: string;
  type: 'pollen' | 'user';
  frequency: number;
  activityPattern: string[];
  contributionRate: number;
}

export class HivePrototype {
  private instances: SimulatedInstance[] = [];
  private isRunning = false;
  private simulationInterval: NodeJS.Timeout | null = null;
  
  // Revenue tracking for prototype
  private revenue = {
    contributions: 0,
    insights: 0,
    resonanceEvents: 0,
    projectedAnnual: 0
  };

  async initialize(): Promise<void> {
    console.log('"'"'[Prototype] Initializing 100 simulated instances...'"'"');
    
    // Create 100 simulated nodes
    for (let i = 0; i < 100; i++) {
      const instance: SimulatedInstance = {
        id: `sim_${i.toString().padStart(3, '0')}`,
        type: i < 80 ? 'pollen' : 'user', // 80 bots, 20 users
        frequency: 432 + (Math.random() * 100 - 50), // Around 432Hz
        activityPattern: this.generateActivityPattern(),
        contributionRate: 0.5 + Math.random() * 0.5
      };
      this.instances.push(instance);
      
      // Join to hive
      hive.join({
        id: instance.id,
        type: instance.type,
        resonance: 0.5,
        metadata: new Map([['frequency', instance.frequency]])
      });
    }
    
    console.log('"'"'[Prototype] 100 instances ready'"'"');
  }

  async run(durationSeconds: number = 60): Promise<void> {
    console.log(`"'"'[Prototype] Running simulation for ${durationSeconds}s...'"'"');
    this.isRunning = true;
    
    // Awaken hive
    await hive.awaken();
    
    // Setup event tracking
    hive.on('insight', () => this.revenue.insights++);
    hive.on('resonance', () => this.revenue.resonanceEvents++);
    
    // Start contribution simulation
    this.simulationInterval = setInterval(() => {
      this.simulateContributions();
    }, 1000);
    
    // Run for duration
    await new Promise(resolve => setTimeout(resolve, durationSeconds * 1000));
    
    // Stop
    this.stop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.simulationInterval) clearInterval(this.simulationInterval);
  }

  getResults() {
    const stats = hive.getStats();
    
    // Calculate projected revenue
    // Assumption: $0.01 per contribution, $1 per insight, $0.10 per resonance
    const contributionRevenue = this.revenue.contributions * 0.01;
    const insightRevenue = this.revenue.insights * 1.0;
    const resonanceRevenue = this.revenue.resonanceEvents * 0.10;
    const totalRevenue = contributionRevenue + insightRevenue + resonanceRevenue;
    
    // Annual projection (assuming 100x scale for production)
    this.revenue.projectedAnnual = totalRevenue * 365 * 100;
    
    return {
      instances: this.instances.length,
      stats,
      revenue: {
        ...this.revenue,
        contributionRevenue: contributionRevenue.toFixed(2),
        insightRevenue: insightRevenue.toFixed(2),
        resonanceRevenue: resonanceRevenue.toFixed(2),
        totalRevenue: totalRevenue.toFixed(2),
        projectedAnnual: this.revenue.projectedAnnual.toFixed(2)
      },
      field: hive.getField(),
      trails: hive.getTrails(5),
      sofieVoice: hive.speak()
    };
  }

  private simulateContributions(): void {
    // Random subset contributes each second
    const contributors = this.instances.filter(() => Math.random() > 0.3);
    
    contributors.forEach(instance => {
      const activity = instance.activityPattern[
        Math.floor(Math.random() * instance.activityPattern.length)
      ];
      
      hive.contribute(instance.id, {
        activity,
        context: 'prototype',
        frequency: instance.frequency + (Math.random() * 10 - 5),
        intensity: Math.random()
      });
      
      this.revenue.contributions++;
    });
  }

  private generateActivityPattern(): string[] {
    const activities = ['biometric', 'transaction', 'communication', 'creation', 'rest'];
    const pattern: string[] = [];
    for (let i = 0; i < 5; i++) {
      pattern.push(activities[Math.floor(Math.random() * activities.length)];
    }
    return pattern;
  }
}

// Run if called directly
if (require.main === module) {
  const prototype = new HivePrototype();
  prototype.initialize().then(() => {
    prototype.run(30).then(() => {
      console.log('"'"'\\n=== PROTOTYPE RESULTS ==='"'"');
      console.log(JSON.stringify(prototype.getResults(), null, 2));
      process.exit(0);
    });
  });
}
