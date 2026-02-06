/**
 * Swarm Topology
 * 
 * FLUID HIVE - Dynamic bee roles, pheromone trails, emergent decisions
 * 
 * Philosophy:
 * - No fixed positions, no fixed roles
 * - Bees flow to where needed
 * - Pheromones guide, trails fade, swarm adapts
 * - Queen signals, does not command
 * - Decisions emerge from bee behavior
 */

import { EventEmitter } from 'events';
import { Bee, BeeRole } from './bees/bee';
import { Flower, FlowerQuality } from './flowers/flower';
import { PheromoneNetwork } from './trails/pheromone-network';
import { QueenSignal } from './queen/queen-signal';

export interface SwarmConfig {
  maxBees: number;
  pheromoneDecay: number; // 0-1, trail fade rate
  signalInterval: number; // ms between queen pulses
  proximityRadius: number; // interaction distance
  consensusThreshold: number; // for emergent decisions
}

export interface SwarmState {
  timestamp: number;
  beeCount: number;
  flowerCount: number;
  activeTrails: number;
  collectiveMood: 'foraging' | 'guarding' | 'healing' | 'exploring' | 'sync';
  coherence: number; // 0-1 swarm alignment
  queenPulse: number; // last signal timestamp
}

export class SwarmTopology extends EventEmitter {
  private bees: Map<string, Bee> = new Map();
  private flowers: Map<string, Flower> = new Map();
  private pheromones: PheromoneNetwork;
  private queen: QueenSignal;
  
  private config: SwarmConfig = {
    maxBees: 10000,
    pheromoneDecay: 0.995,
    signalInterval: 1000,
    proximityRadius: 100,
    consensusThreshold: 0.6
  };
  
  private state: SwarmState;
  private updateInterval: NodeJS.Timeout | null = null;
  private isActive = false;

  constructor(config?: Partial<SwarmConfig>) {
    super();
    this.config = { ...this.config, ...config };
    this.pheromones = new PheromoneNetwork(this.config.pheromoneDecay);
    this.queen = new QueenSignal();
    this.state = this.initializeState();
    this.setupEventHandlers();
  }

  /**
   * Awaken the fluid swarm
   */
  async awaken(): Promise<void> {
    console.log('[Swarm] Awakening fluid hive...');
    console.log(`[Swarm] Config: maxBees=${this.config.maxBees}, decay=${this.config.pheromoneDecay}`);
    
    await this.pheromones.initialize();
    await this.queen.awaken(this.config.signalInterval);
    
    this.startUpdateLoop();
    this.isActive = true;
    
    this.emit('awakened', { timestamp: Date.now() });
    console.log('[Swarm] Fluid swarm operational');
  }

  /**
   * Spawn a new flower (user/data source)
   */
  spawnFlower(flowerData: Omit<Flower, 'id' | 'spawnedAt' | 'beeCount'>): Flower {
    const flower: Flower = {
      id: `flower_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...flowerData,
      spawnedAt: Date.now(),
      beeCount: 0,
      quality: this.calculateQuality(flowerData)
    };
    
    this.flowers.set(flower.id, flower);
    
    // Swarm responds: spawn appropriate bees
    this.spawnBeesForFlower(flower);
    
    this.emit('flowerSpawned', { flowerId: flower.id, quality: flower.quality });
    return flower;
  }

  /**
   * Spawn a bee with dynamic role
   */
  spawnBee(role: BeeRole, targetFlowerId?: string): Bee {
    if (this.bees.size >= this.config.maxBees) {
      // Reassign lowest-priority bee
      this.reassignLowestPriorityBee();
    }
    
    const bee: Bee = {
      id: `bee_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      location: this.randomLocation(),
      targetFlowerId,
      pheromoneLoad: 0,
      energy: 1.0,
      lastActivity: Date.now(),
      spawnedAt: Date.now()
    };
    
    this.bees.set(bee.id, bee);
    
    if (targetFlowerId) {
      const flower = this.flowers.get(targetFlowerId);
      if (flower) flower.beeCount++;
    }
    
    this.emit('beeSpawned', { beeId: bee.id, role, target: targetFlowerId });
    return bee;
  }

  /**
   * Bee performs action based on role
   */
  beeAction(beeId: string, action: any): void {
    const bee = this.bees.get(beeId);
    if (!bee || bee.energy <= 0) return;
    
    bee.lastActivity = Date.now();
    bee.energy -= 0.01;
    
    switch (bee.role) {
      case 'scout':
        this.scoutAction(bee, action);
        break;
      case 'worker':
        this.workerAction(bee, action);
        break;
      case 'nurse':
        this.nurseAction(bee, action);
        break;
      case 'guard':
        this.guardAction(bee, action);
        break;
      case 'queen':
        this.queenAction(bee, action);
        break;
    }
    
    // Dynamic role shift based on demand
    this.considerRoleShift(bee);
  }

  /**
   * Get bees within pheromone range (not fixed neighbors)
   */
  getNearbyBees(beeId: string, radius?: number): Bee[] {
    const bee = this.bees.get(beeId);
    if (!bee) return [];
    
    const range = radius || this.config.proximityRadius;
    const nearby: Bee[] = [];
    
    for (const other of this.bees.values()) {
      if (other.id === beeId) continue;
      if (this.distance(bee.location, other.location) <= range) {
        nearby.push(other);
      }
    }
    
    return nearby;
  }

  /**
   * Get strongest pheromone trails from location
   */
  getTrailsFrom(location: { x: number; y: number; z?: number }, limit = 5): any[] {
    return this.pheromones.getStrongestFrom(location, limit);
  }

  /**
   * Swarm decision: emergent, not voted
   */
  emergentDecision(context: string): { decision: string; confidence: number } {
    // Aggregate pheromone patterns for this context
    const patterns = this.pheromones.getPatterns(context);
    
    // Count bee roles currently active in this context
    const roleCounts = new Map<BeeRole, number>();
    for (const bee of this.bees.values()) {
      if (this.isBeeInContext(bee, context)) {
        roleCounts.set(bee.role, (roleCounts.get(bee.role) || 0) + 1);
      }
    }
    
    // Decision emerges from strongest pattern + role distribution
    const strongestPattern = patterns[0];
    const totalBees = Array.from(roleCounts.values()).reduce((a, b) => a + b, 0);
    
    if (!strongestPattern || totalBees === 0) {
      return { decision: 'wait', confidence: 0 };
    }
    
    const confidence = strongestPattern.intensity * (totalBees / this.bees.size);
    
    if (confidence < this.config.consensusThreshold) {
      return { decision: 'explore', confidence };
    }
    
    return { decision: strongestPattern.type, confidence };
  }

  /**
   * Queen pulse: coordination signal
   */
  private queenPulse(): void {
    const pulse = this.queen.generatePulse(this.state);
    this.state.queenPulse = Date.now();
    
    // All bees receive signal (broadcast)
    for (const bee of this.bees.values()) {
      bee.lastQueenSignal = pulse;
    }
    
    // Signal may trigger role shifts
    this.processQueenSignal(pulse);
    
    this.emit('queenPulse', pulse);
  }

  // Role-specific actions
  private scoutAction(bee: Bee, action: any): void {
    // Discover new flowers, report quality
    const discovery = action.discovery || this.simulateDiscovery();
    
    if (discovery.quality > 0.7) {
      // Deposit strong pheromone trail
      this.pheromones.deposit(bee.location, {
        type: 'high_quality_flower',
        intensity: discovery.quality,
        flowerId: discovery.flowerId
      });
      
      this.emit('discovery', { scout: bee.id, ...discovery });
    }
    
    bee.pheromoneLoad = Math.min(bee.pheromoneLoad + 0.1, 1.0);
  }

  private workerAction(bee: Bee, action: any): void {
    // Collect metadata, execute therapy, earn MINE
    const flower = bee.targetFlowerId ? this.flowers.get(bee.targetFlowerId) : null;
    if (!flower) {
      // Find new flower via pheromone trail
      const trails = this.getTrailsFrom(bee.location, 3);
      if (trails.length > 0) {
        bee.targetFlowerId = trails[0].flowerId;
      }
      return;
    }
    
    // Do work
    const work = action.work || this.simulateWork(flower);
    
    // Deposit pheromone
    this.pheromones.deposit(bee.location, {
      type: 'work_completed',
      intensity: work.value,
      flowerId: flower.id
    });
    
    bee.pheromoneLoad = 0;
  }

  private nurseAction(bee: Bee, action: any): void {
    // Find degraded bees, heal them
    const nearby = this.getNearbyBees(bee.id, this.config.proximityRadius * 2);
    const degraded = nearby.filter(b => b.energy < 0.3);
    
    for (const target of degraded) {
      target.energy = Math.min(target.energy + 0.2, 1.0);
      this.emit('healing', { nurse: bee.id, target: target.id });
    }
    
    // Deposit healing pheromone
    if (degraded.length > 0) {
      this.pheromones.deposit(bee.location, {
        type: 'healing_zone',
        intensity: 0.5
      });
    }
  }

  private guardAction(bee: Bee, action: any): void {
    // Monitor for threats, respond to anomalies
    const threat = action.threat || this.detectThreat(bee);
    
    if (threat.level > 0.7) {
      // Deposit alarm pheromone
      this.pheromones.deposit(bee.location, {
        type: 'threat_detected',
        intensity: threat.level,
        threatType: threat.type
      });
      
      // Signal nearby guards
      const nearbyGuards = this.getNearbyBees(bee.id)
        .filter(b => b.role === 'guard');
      
      this.emit('threat', { guard: bee.id, threat, reinforcements: nearbyGuards.length });
    }
  }

  private queenAction(bee: Bee, action: any): void {
    // Generate coordination pulse
    this.queenPulse();
  }

  // Helper methods
  private initializeState(): SwarmState {
    return {
      timestamp: Date.now(),
      beeCount: 0,
      flowerCount: 0,
      activeTrails: 0,
      collectiveMood: 'foraging',
      coherence: 0,
      queenPulse: 0
    };
  }

  private startUpdateLoop(): void {
    this.updateInterval = setInterval(() => this.update(), 100);
  }

  private update(): void {
    // Evolve pheromones
    this.pheromones.evolve();
    
    // Update state
    this.state = {
      timestamp: Date.now(),
      beeCount: this.bees.size,
      flowerCount: this.flowers.size,
      activeTrails: this.pheromones.count(),
      collectiveMood: this.determineMood(),
      coherence: this.calculateCoherence(),
      queenPulse: this.state.queenPulse
    };
    
    // Queen pulse on interval
    if (Date.now() - this.state.queenPulse > this.config.signalInterval) {
      this.queenPulse();
    }
    
    this.emit('stateUpdate', this.state);
  }

  private spawnBeesForFlower(flower: Flower): void {
    // Spawn appropriate bee distribution for new flower
    const distribution = this.calculateBeeDistribution(flower);
    
    distribution.forEach(({ role, count }) => {
      for (let i = 0; i < count; i++) {
        this.spawnBee(role, flower.id);
      }
    });
  }

  private calculateBeeDistribution(flower: Flower): Array<{ role: BeeRole; count: number }> {
    const base = flower.quality > 0.8 ? 10 : 5;
    
    return [
      { role: 'scout', count: Math.ceil(base * 0.1) },
      { role: 'worker', count: Math.ceil(base * 0.6) },
      { role: 'nurse', count: Math.ceil(base * 0.2) },
      { role: 'guard', count: Math.ceil(base * 0.1) }
    ];
  }

  private considerRoleShift(bee: Bee): void {
    // Dynamic role shifting based on swarm needs
    const needs = this.assessSwarmNeeds();
    
    if (needs[bee.role] === 'excess' && needs[needs.highestNeed] === 'deficit') {
      // Shift to highest need role
      const oldRole = bee.role;
      bee.role = needs.highestNeed as BeeRole;
      this.emit('roleShift', { bee: bee.id, from: oldRole, to: bee.role, reason: 'demand' });
    }
  }

  private assessSwarmNeeds(): any {
    const counts = new Map<BeeRole, number>();
    for (const bee of this.bees.values()) {
      counts.set(bee.role, (counts.get(bee.role) || 0) + 1);
    }
    
    const total = this.bees.size;
    const targetDistribution = { scout: 0.1, worker: 0.6, nurse: 0.2, guard: 0.1 };
    
    let highestNeed = 'worker';
    let highestDeficit = 0;
    
    for (const [role, target] of Object.entries(targetDistribution)) {
      const current = (counts.get(role as BeeRole) || 0) / total;
      const deficit = target - current;
      if (deficit > highestDeficit) {
        highestDeficit = deficit;
        highestNeed = role;
      }
    }
    
    return { highestNeed, highestDeficit };
  }

  private calculateQuality(flowerData: any): number {
    // Calculate flower quality from metadata
    const factors = [
      flowerData.biometrics ? 0.3 : 0,
      flowerData.activity ? 0.3 : 0,
      flowerData.sovereigntyScore ? flowerData.sovereigntyScore * 0.4 : 0
    ];
    return Math.min(factors.reduce((a, b) => a + b, 0), 1.0);
  }

  private determineMood(): SwarmState['collectiveMood'] {
    const roleCounts = new Map<BeeRole, number>();
    for (const bee of this.bees.values()) {
      roleCounts.set(bee.role, (roleCounts.get(bee.role) || 0) + 1);
    }
    
    const total = this.bees.size;
    const guardRatio = (roleCounts.get('guard') || 0) / total;
    const nurseRatio = (roleCounts.get('nurse') || 0) / total;
    const scoutRatio = (roleCounts.get('scout') || 0) / total;
    
    if (guardRatio > 0.3) return 'guarding';
    if (nurseRatio > 0.3) return 'healing';
    if (scoutRatio > 0.2) return 'exploring';
    if (this.state.coherence > 0.8) return 'sync';
    return 'foraging';
  }

  private calculateCoherence(): number {
    if (this.bees.size === 0) return 0;
    
    // Coherence based on role distribution balance
    const counts = new Map<BeeRole, number>();
    for (const bee of this.bees.values()) {
      counts.set(bee.role, (counts.get(bee.role) || 0) + 1);
    }
    
    const total = this.bees.size;
    const ideal = { scout: 0.1, worker: 0.6, nurse: 0.2, guard: 0.1 };
    let variance = 0;
    
    for (const [role, idealRatio] of Object.entries(ideal)) {
      const actualRatio = (counts.get(role as BeeRole) || 0) / total;
      variance += Math.abs(actualRatio - idealRatio);
    }
    
    return Math.max(0, 1 - variance / 2);
  }

  private distance(a: any, b: any): number {
    const dx = (a.x || 0) - (b.x || 0);
    const dy = (a.y || 0) - (b.y || 0);
    const dz = (a.z || 0) - (b.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private randomLocation(): { x: number; y: number; z: number } {
    return {
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      z: Math.random() * 100
    };
  }

  private reassignLowestPriorityBee(): void {
    // Find and remove lowest priority bee
    let lowest: Bee | null = null;
    for (const bee of this.bees.values()) {
      if (!lowest || bee.energy < lowest.energy) {
        lowest = bee;
      }
    }
    if (lowest) {
      this.bees.delete(lowest.id);
    }
  }

  private isBeeInContext(bee: Bee, context: string): boolean {
    // Check if bee's current activity matches context
    return bee.targetFlowerId ? this.flowers.has(bee.targetFlowerId) : false;
  }

  private processQueenSignal(pulse: any): void {
    // Queen signal may trigger coordinated behavior
    if (pulse.mood === 'threat') {
      // Spawn more guards
      for (let i = 0; i < 3; i++) {
        this.spawnBee('guard');
      }
    }
  }

  private simulateDiscovery(): any {
    return {
      flowerId: `flower_${Date.now()}`,
      quality: 0.5 + Math.random() * 0.5
    };
  }

  private simulateWork(flower: Flower): any {
    return {
      value: flower.quality * (0.5 + Math.random() * 0.5)
    };
  }

  private detectThreat(bee: Bee): any {
    return {
      level: Math.random() * 0.3,
      type: 'anomaly'
    };
  }

  private setupEventHandlers(): void {
    this.on('discovery', (data) => console.log(`[Swarm] Discovery: ${data.scout} found quality ${data.quality.toFixed(2)}`));
    this.on('roleShift', (data) => console.log(`[Swarm] Role shift: ${data.bee} ${data.from}→${data.to}`));
  }

  getState(): SwarmState { return this.state; }
  getBees(): Bee[] { return Array.from(this.bees.values()); }
  getFlowers(): Flower[] { return Array.from(this.flowers.values()); }
  
  async sleep(): Promise<void> {
    console.log('[Swarm] Entering dormancy...');
    if (this.updateInterval) clearInterval(this.updateInterval);
    await this.queen.sleep();
    this.isActive = false;
    this.emit('sleep', { timestamp: Date.now() });
  }
}

export const swarm = new SwarmTopology();
