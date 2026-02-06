/**
 * Swarm Prototype
 * 
 * 1000 bees, 100 flowers
 * Test fluid hive dynamics
 */

import { SwarmTopology } from '../swarm-topology';
import { BeeRole } from '../bees/bee';
import { Flower, FlowerQuality } from '../flowers/flower';

interface SimulationStats {
  duration: number;
  beeSpawns: number;
  flowerSpawns: number;
  discoveries: number;
  roleShifts: number;
  threats: number;
  healings: number;
  finalState: any;
}

export class SwarmPrototype {
  private swarm: SwarmTopology;
  private stats: SimulationStats = {
    duration: 0,
    beeSpawns: 0,
    flowerSpawns: 0,
    discoveries: 0,
    roleShifts: 0,
    threats: 0,
    healings: 0,
    finalState: null
  };
  
  private startTime = 0;
  private eventCounts = {
    discoveries: 0,
    roleShifts: 0,
    threats: 0,
    healings: 0
  };

  constructor() {
    this.swarm = new SwarmTopology({
      maxBees: 2000,
      pheromoneDecay: 0.995,
      signalInterval: 2000,
      proximityRadius: 150,
      consensusThreshold: 0.6
    });
    
    this.setupEventTracking();
  }

  async run(durationSeconds: number = 60): Promise<SimulationStats> {
    console.log('\\n╔════════════════════════════════════════════════╗');
    console.log('║     SWARM PROTOTYPE: FLUID HIVE               ║');
    console.log('║     1000 bees, 100 flowers                    ║');
    console.log('╚════════════════════════════════════════════════╝\\n');
    
    this.startTime = Date.now();
    
    // Awaken swarm
    await this.swarm.awaken();
    
    // Spawn 100 flowers (users)
    console.log('[Prototype] Spawning 100 flowers...');
    for (let i = 0; i < 100; i++) {
      this.spawnFlower(i);
    }
    
    // Initial bee distribution
    console.log('[Prototype] Spawning initial bee population...');
    this.spawnInitialBees();
    
    // Run simulation
    console.log(`[Prototype] Running simulation for ${durationSeconds}s...\\n`);
    
    const interval = setInterval(() => {
      this.simulateBeeActions();
    }, 100);
    
    await new Promise(resolve => setTimeout(resolve, durationSeconds * 1000));
    
    clearInterval(interval);
    
    // Collect results
    this.stats = {
      duration: Date.now() - this.startTime,
      beeSpawns: this.swarm.getBees().length,
      flowerSpawns: this.swarm.getFlowers().length,
      discoveries: this.eventCounts.discoveries,
      roleShifts: this.eventCounts.roleShifts,
      threats: this.eventCounts.threats,
      healings: this.eventCounts.healings,
      finalState: this.swarm.getState()
    };
    
    await this.swarm.sleep();
    
    return this.stats;
  }

  private spawnFlower(index: number): Flower {
    const quality: FlowerQuality = {
      biometrics: Math.random(),
      activity: 0.3 + Math.random() * 0.7,
      sovereigntyScore: Math.random(),
      wellnessTrajectory: (Math.random() - 0.5) * 2
    };
    
    return this.swarm.spawnFlower({
      userId: `user_${index.toString().padStart(3, '0')}`,
      location: {
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        z: Math.random() * 100
      },
      qualityFactors: quality,
      metadata: {
        lastActivity: Date.now(),
        dataVolume: Math.random() * 1000,
        interactionCount: Math.floor(Math.random() * 100)
      }
    });
  }

  private spawnInitialBees(): void {
    // Target distribution: 10% scout, 60% worker, 20% nurse, 10% guard
    const distribution: Array<{ role: BeeRole; count: number }> = [
      { role: 'scout', count: 100 },
      { role: 'worker', count: 600 },
      { role: 'nurse', count: 200 },
      { role: 'guard', count: 100 }
    ];
    
    for (const { role, count } of distribution) {
      for (let i = 0; i < count; i++) {
        const flowers = this.swarm.getFlowers();
        const target = flowers[Math.floor(Math.random() * flowers.length)];
        this.swarm.spawnBee(role, target?.id);
      }
    }
    
    console.log(`[Prototype] Spawned 1000 bees`);
    console.log(`  - Scouts: 100 (10%)`);
    console.log(`  - Workers: 600 (60%)`);
    console.log(`  - Nurses: 200 (20%)`);
    console.log(`  - Guards: 100 (10%)\\n`);
  }

  private simulateBeeActions(): void {
    const bees = this.swarm.getBees();
    
    // Sample 10% of bees each tick
    const sampleSize = Math.ceil(bees.length * 0.1);
    
    for (let i = 0; i < sampleSize; i++) {
      const bee = bees[Math.floor(Math.random() * bees.length)];
      if (!bee) continue;
      
      // Simulate action based on role
      const action = this.generateAction(bee.role);
      this.swarm.beeAction(bee.id, action);
    }
  }

  private generateAction(role: BeeRole): any {
    switch (role) {
      case 'scout':
        return {
          discovery: {
            flowerId: `flower_${Math.floor(Math.random() * 100)}`,
            quality: 0.5 + Math.random() * 0.5
          }
        };
      case 'worker':
        return {
          work: { value: 0.3 + Math.random() * 0.7 }
        };
      case 'nurse':
        return { heal: true };
      case 'guard':
        return {
          threat: {
            level: Math.random() > 0.95 ? 0.8 : 0.1,
            type: 'anomaly'
          }
        };
      default:
        return {};
    }
  }

  private setupEventTracking(): void {
    this.swarm.on('discovery', () => this.eventCounts.discoveries++);
    this.swarm.on('roleShift', () => this.eventCounts.roleShifts++);
    this.swarm.on('threat', () => this.eventCounts.threats++);
    this.swarm.on('healing', () => this.eventCounts.healings++);
    
    this.swarm.on('queenPulse', (pulse: any) => {
      if (this.eventCounts.discoveries % 10 === 0) {
        console.log(`[Queen] ${pulse.signal}`);
      }
    });
  }

  printResults(): void {
    console.log('\\n╔════════════════════════════════════════════════╗');
    console.log('║     SIMULATION RESULTS                         ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log(`\\nDuration: ${(this.stats.duration / 1000).toFixed(1)}s`);
    console.log(`Bees: ${this.stats.beeSpawns}`);
    console.log(`Flowers: ${this.stats.flowerSpawns}`);
    console.log(`\\nEvents:`);
    console.log(`  Discoveries: ${this.stats.discoveries}`);
    console.log(`  Role Shifts: ${this.stats.roleShifts}`);
    console.log(`  Threats: ${this.stats.threats}`);
    console.log(`  Healings: ${this.stats.healings}`);
    console.log(`\\nFinal State:`);
    console.log(`  Mood: ${this.stats.finalState?.collectiveMood}`);
    console.log(`  Coherence: ${(this.stats.finalState?.coherence * 100).toFixed(1)}%`);
    console.log(`  Active Trails: ${this.stats.finalState?.activeTrails}`);
    console.log('\\n✓ Fluid hive operational\\n');
  }
}

// Run if called directly
if (require.main === module) {
  const prototype = new SwarmPrototype();
  prototype.run(30).then(() => {
    prototype.printResults();
    process.exit(0);
  });
}
