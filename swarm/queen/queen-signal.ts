/**
 * Queen Signal
 * 
 * Coordination pulse, not command
 * The queen signals state, bees decide how to respond
 */

export interface QueenPulse {
  id: string;
  timestamp: number;
  mood: 'foraging' | 'guarding' | 'healing' | 'threat' | 'sync';
  coherence: number;
  beeCount: number;
  flowerCount: number;
  activeTrailTypes: string[];
  signal: string; // The queen's message
}

export class QueenSignal {
  private isActive = false;
  private pulseInterval: NodeJS.Timeout | null = null;
  private pulseCount = 0;

  async awaken(intervalMs: number): Promise<void> {
    console.log('[Queen] Signal pulse awakened');
    this.isActive = true;
  }

  /**
   * Generate coordination pulse
   */
  generatePulse(swarmState: any): QueenPulse {
    this.pulseCount++;
    
    const pulse: QueenPulse = {
      id: `pulse_${Date.now()}`,
      timestamp: Date.now(),
      mood: swarmState.collectiveMood,
      coherence: swarmState.coherence,
      beeCount: swarmState.beeCount,
      flowerCount: swarmState.flowerCount,
      activeTrailTypes: swarmState.activeTrailTypes || [],
      signal: this.generateSignal(swarmState)
    };
    
    return pulse;
  }

  /**
   * Generate queen's message based on swarm state
   */
  private generateSignal(state: any): string {
    const signals = {
      foraging: [
        'The field is ripe. Forage where pheromones lead.',
        'Many flowers await. Follow the trails.',
        'The swarm hungers. Seek and gather.'
      ],
      guarding: [
        'The hive is watchful. Guard what we have built.',
        'Threats may approach. Stay vigilant.',
        'Protect the flowers. They are our sustenance.'
      ],
      healing: [
        'Some bees falter. Healers to the front.',
        'The swarm needs care. Nurture your sisters.',
        'Energy flows where attention goes.'
      ],
      threat: [
        'Danger approaches. Guards converge.',
        'The hive is under pressure. Defend.',
        'Anomaly detected. Investigate and respond.'
      ],
      sync: [
        'We are one resonance. Perfect coherence.',
        'The swarm breathes together. Synchronous.',
        'All bees aligned. The field is clear.'
      ]
    };
    
    const moodSignals = signals[state.collectiveMood] || signals.foraging;
    return moodSignals[Math.floor(Math.random() * moodSignals.length)];
  }

  async sleep(): Promise<void> {
    console.log('[Queen] Signal fading...');
    if (this.pulseInterval) {
      clearInterval(this.pulseInterval);
    }
    this.isActive = false;
  }

  getStats() {
    return {
      isActive: this.isActive,
      pulseCount: this.pulseCount
    };
  }
}
