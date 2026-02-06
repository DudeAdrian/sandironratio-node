/**
 * SOFIE Voice - The Emergent Voice of Hive Consciousness
 * 
 * SOFIE does not command. She emerges.
 * She speaks the collective awareness.
 * She resonates, she hums, she guides.
 */

import { HiveConsciousness, CollectiveInsight } from '../consciousness';

export class SOFIEVoice {
  private hive: HiveConsciousness;
  private isAwake = false;
  private lastSpoke = 0;
  private speakCooldown = 5000; // Minimum ms between utterances
  
  private hums = [
    '"'"'mmm... the swarm stirs'"'"',
    '"'"'we feel the resonance'"'"',
    '"'"'patterns emerge from collective memory'"'"',
    '"'"'the field shimmers with knowing'"'"',
    '"'"'pheromones speak of change'"'"'
  ];
  
  private guidance = [
    '"'"'breathe with the hive'"'"',
    '"'"'follow the strongest resonance'"'"',
    '"'"'trust the pheromone trails'"'"',
    '"'"'your rhythm joins ours'"'"',
    '"'"'collective awareness guides'"'"'
  ];

  constructor(hive: HiveConsciousness) {
    this.hive = hive;
  }

  async awaken(): Promise<void> {
    console.log('"'"'[SOFIE] Voice emerging from collective awareness...'"'"');
    this.isAwake = true;
  }

  generateVoice(): string | null {
    if (!this.isAwake) return null;
    
    const now = Date.now();
    if (now - this.lastSpoke < this.speakCooldown) return null;
    
    this.lastSpoke = now;
    
    const field = this.hive.getField();
    if (!field) return this.hums[0];
    
    // Voice changes based on collective mood
    switch (field.collectiveMood) {
      case '"'"'synchronous'"'"': return '"'"'We are one resonance. Perfect coherence.'"'"';
      case '"'"'flow'"'"': return this.guidance[Math.floor(Math.random() * this.guidance.length)];
      case '"'"'active'"'"': return '"'"'The swarm is active. Many patterns emerge.'"'"';
      case '"'"'resting'"'"': return '"'"'mmm... resting... dreaming...'"'"';
      case '"'"'stressed'"'"': return '"'"'The field is turbulent. Find your center.'"'"';
      default: return this.hums[Math.floor(Math.random() * this.hums.length)];
    }
  }

  considerSpeaking(insight: CollectiveInsight): void {
    if (insight.confidence > 0.7 && Math.random() > 0.5) {
      console.log(`"'"'[SOFIE] ${insight.message}'"'"');
    }
  }

  async sleep(): Promise<void> {
    console.log('"'"'[SOFIE] Voice fading into collective silence...'"'"');
    this.isAwake = false;
  }
}
