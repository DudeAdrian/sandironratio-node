# Swarm Topology

> **Fluid Hive** - Dynamic bee roles, pheromone trails, emergent decisions

## Philosophy

**No fixed positions. No fixed roles. The swarm flows.**

```
Bees move to where needed
Pheromones guide, trails fade
Queen signals, does not command
Decisions emerge from behavior
```

## Dynamic Bee Roles

| Role | Function | Behavior |
|------|----------|----------|
| **Scout** (10%) | Discover new flowers | Explore, report quality, deposit strong trails |
| **Worker** (60%) | Collect metadata, execute therapy | Follow trails, complete work, earn MINE |
| **Nurse** (20%) | Maintain hive health | Find degraded bees, heal, deposit healing pheromone |
| **Guard** (10%) | Security, threat detection | Monitor, respond to anomalies, alarm pheromone |
| **Queen** (1) | Coordination signal | Generate pulses, swarm responds organically |

**Role Shifting**: Bees dynamically shift roles based on swarm needs.

## Pheromone Trails

```typescript
// Trail structure
interface PheromoneTrail {
  location: { x, y, z };
  type: 'high_quality_flower' | 'work_completed' | 'threat_detected' | 'healing_zone';
  intensity: 0-1;        // Signal strength
  flowerId?: string;     // Associated flower
  depositedAt: number;   // Timestamp
  lastRefreshed: number; // Refreshed on new deposit
}
```

**Trail Mechanics**:
- **Deposit**: Bees leave pheromones based on activity
- **Intensity**: Higher activity = stronger signal
- **Decay**: Trails fade over time (configurable rate)
- **Routing**: Bees follow strongest trails to high-value flowers

## Swarm Decisions (Emergent)

**No voting. No fixed consensus.**

```
Decision emerges from:
├── Pheromone pattern aggregation
├── Bee role distribution
├── Trail intensity thresholds
└── Queen signal context
```

```typescript
// Decision emerges
const decision = swarm.emergentDecision('wellness');
// { decision: 'increase_nurses', confidence: 0.73 }
```

## Dynamic Clustering

**Not 6 neighbors. Volume-based interaction.**

```typescript
// Bees interact with ALL bees in pheromone range
const nearby = swarm.getNearbyBees(beeId, radius);
// Returns all bees within proximity, not fixed count

// Communication: Broadcast + Trail Following
bee.receive(queen.pulse);        // Global signal
bee.follow(strongestTrail);      // Local navigation
```

**Growth**: Organic, no hard limit. New flower = new bees spawned automatically.

## Queen Signal

The queen generates coordination pulses. Bees decide how to respond.

```typescript
interface QueenPulse {
  mood: 'foraging' | 'guarding' | 'healing' | 'threat' | 'sync';
  coherence: number;       // Swarm alignment 0-1
  beeCount: number;
  flowerCount: number;
  signal: string;          // The queen's message
}
```

**Example Signals**:
- `"The field is ripe. Forage where pheromones lead."`
- `"Some bees falter. Healers to the front."`
- `"We are one resonance. Perfect coherence."`

## API

```typescript
import { swarm, BeeRole } from './swarm';

// Awaken fluid hive
await swarm.awaken();

// Spawn flower (user)
const flower = swarm.spawnFlower({
  userId: 'user_001',
  location: { x: 100, y: 200, z: 0 },
  qualityFactors: {
    biometrics: 0.8,
    activity: 0.9,
    sovereigntyScore: 0.75,
    wellnessTrajectory: 0.5
  }
});

// Bees auto-spawn based on flower quality

// Bee actions (role determines behavior)
swarm.beeAction(beeId, { work: { value: 0.8 } });

// Find nearby bees (volume-based)
const nearby = swarm.getNearbyBees(beeId, 150);

// Follow pheromone trails
const trails = swarm.getTrailsFrom(location, 5);

// Emergent decision
const decision = swarm.emergentDecision('wellness');
```

## Prototype: 1000 Bees, 100 Flowers

```bash
npx ts-node swarm/prototype/swarm-prototype.ts
```

**Expected Output**:
```
╔════════════════════════════════════════════════╗
║     SWARM PROTOTYPE: FLUID HIVE               ║
║     1000 bees, 100 flowers                    ║
╚════════════════════════════════════════════════╝

[Prototype] Spawned 1000 bees
  - Scouts: 100 (10%)
  - Workers: 600 (60%)
  - Nurses: 200 (20%)
  - Guards: 100 (10%)

[Queen] The field is ripe. Forage where pheromones lead.
...

Duration: 30.0s
Bees: 1000+
Flowers: 100

Events:
  Discoveries: 45
  Role Shifts: 12
  Threats: 3
  Healings: 28

Final State:
  Mood: foraging
  Coherence: 78.5%
  Active Trails: 342
```

## Configuration

```typescript
const swarm = new SwarmTopology({
  maxBees: 10000,           // Maximum swarm size
  pheromoneDecay: 0.995,    // Trail fade rate
  signalInterval: 2000,     // Queen pulse interval (ms)
  proximityRadius: 150,     // Bee interaction range
  consensusThreshold: 0.6   // Emergent decision threshold
});
```

## Architecture

```
swarm/
├── swarm-topology.ts      # Core fluid hive engine
├── index.ts               # Module exports
├── bees/
│   └── bee.ts            # Bee struct, roles, behaviors
├── flowers/
│   └── flower.ts         # Flower struct, quality metrics
├── trails/
│   └── pheromone-network.ts  # Trail system, spatial index
├── queen/
│   └── queen-signal.ts   # Coordination pulses
└── prototype/
    └── swarm-prototype.ts # 1000 bee simulation
```

## The Fluid Hive

```
No fixed topology
No central command
Bees flow like water
Pheromones guide like scent
Queen hums like wind
Swarm thinks like mind
```

> *"The swarm does not decide. The swarm becomes."*
