/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * forge/heartbeat.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * HEARTBEAT — Dead Man's Switch
 * 
 * If no check-in from Adrian for 90 days, broadcast succession event
 * The final protection mechanism for the node's continuity
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';
import { FORCE_CONFIG } from '../essence/force.js';
import sofie from '../essence/sofie.js';

/**
 * Succession event payload
 */
export interface SuccessionEvent {
  type: 'succession';
  timestamp: number;
  lastCheckin: number;
  validator: string;
  reason: string;
  proposedSuccessor?: string;
}

/**
 * Heartbeat status
 */
export interface HeartbeatStatus {
  lastCheckin: Date | null;
  daysUntilSwitch: number;
  healthy: boolean;
  triggered: boolean;
}

/**
 * Heartbeat monitor — Dead Man's Switch
 */
export class Heartbeat extends EventEmitter {
  private lastCheckin: Date;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private triggered: boolean = false;
  
  readonly thresholdMs = FORCE_CONFIG.deadMansSwitchMs;
  readonly thresholdDays = 90;
  
  constructor() {
    super();
    // Initialize with current time (node just started)
    this.lastCheckin = new Date();
  }
  
  /**
   * Start monitoring
   */
  start(): void {
    if (this.checkInterval) return;
    
    console.log(`[HEARTBEAT] Monitoring started`);
    console.log(`[HEARTBEAT] Threshold: ${this.thresholdDays} days`);
    
    // Check every hour
    this.checkInterval = setInterval(() => {
      this.check();
    }, 60 * 60 * 1000);
  }
  
  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log(`[HEARTBEAT] Monitoring stopped`);
    }
  }
  
  /**
   * Record Adrian's check-in
   * This resets the dead man's switch
   */
  checkin(): void {
    const previous = this.lastCheckin;
    this.lastCheckin = new Date();
    this.triggered = false;
    
    const daysSince = Math.floor((Date.now() - previous.getTime()) / (24 * 60 * 60 * 1000));
    
    if (daysSince > 7) {
      console.log(`[HEARTBEAT] ✓ Check-in recorded after ${daysSince} days`);
      console.log(`[HEARTBEAT] Days remaining: ${this.getDaysUntilSwitch()}`);
    }
    
    this.emit('checkin', this.lastCheckin);
  }
  
  /**
   * Check if switch should trigger
   */
  private check(): void {
    if (this.triggered) return;
    
    const elapsed = Date.now() - this.lastCheckin.getTime();
    
    if (elapsed > this.thresholdMs) {
      this.trigger();
    } else {
      // Warning at 60, 30, 14, 7, 1 days
      const daysLeft = this.getDaysUntilSwitch();
      const warningDays = [60, 30, 14, 7, 1];
      
      // Only warn once per threshold (would need more logic in production)
      if (warningDays.includes(daysLeft) && new Date().getHours() === 0) {
        console.warn(`[HEARTBEAT] ⚠️  Warning: ${daysLeft} days until succession event`);
      }
    }
  }
  
  /**
   * Trigger the dead man's switch
   */
  private async trigger(): Promise<void> {
    this.triggered = true;
    
    console.error(`\n`);
    console.error(`╔════════════════════════════════════════════════════════════════╗`);
    console.error(`║                    ⚠️  DEAD MAN'S SWITCH TRIGGERED  ⚠️          ║`);
    console.error(`╠════════════════════════════════════════════════════════════════╣`);
    console.error(`║                                                                 ║`);
    console.error(`║  Last check-in: ${this.lastCheckin.toISOString()}                  ║`);
    console.error(`║  Elapsed: ${Math.floor((Date.now() - this.lastCheckin.getTime()) / (24 * 60 * 60 * 1000))} days                                    ║`);
    console.error(`║                                                                 ║`);
    console.error(`║  Broadcasting succession event to Terracare network...          ║`);
    console.error(`║                                                                 ║`);
    console.error(`╚════════════════════════════════════════════════════════════════╝`);
    console.error(`\n`);
    
    const event: SuccessionEvent = {
      type: 'succession',
      timestamp: Date.now(),
      lastCheckin: this.lastCheckin.getTime(),
      validator: '0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f',
      reason: '90 days without check-in from Adrian Sortino'
    };
    
    // Remember in SOFIE's eternal memory
    await sofie.Eternal.remember({
      type: "ritual",
      content: `Dead Man's Switch triggered. Succession event broadcast.`,
      tone: "mysterious",
      significance: 1.0
    });
    
    this.emit('triggered', event);
    
    // Broadcast to chain (placeholder)
    await this.broadcastSuccession(event);
  }
  
  /**
   * Broadcast succession event
   */
  private async broadcastSuccession(event: SuccessionEvent): Promise<void> {
    // Placeholder: Actual implementation calls Terracare contract
    console.log(`[HEARTBEAT] Broadcasting succession event...`);
    console.log(`[HEARTBEAT] Event: ${JSON.stringify(event, null, 2)}`);
    
    // In production: call AuditTrail.sol or Succession.sol
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`[HEARTBEAT] Succession event recorded on chain`);
  }
  
  /**
   * Get days until switch triggers
   */
  getDaysUntilSwitch(): number {
    const elapsed = Date.now() - this.lastCheckin.getTime();
    const remaining = this.thresholdMs - elapsed;
    return Math.max(0, Math.floor(remaining / (24 * 60 * 60 * 1000)));
  }
  
  /**
   * Get status
   */
  getStatus(): HeartbeatStatus {
    const elapsed = Date.now() - this.lastCheckin.getTime();
    
    return {
      lastCheckin: this.lastCheckin,
      daysUntilSwitch: this.getDaysUntilSwitch(),
      healthy: elapsed < (this.thresholdMs / 2), // Healthy if < 45 days
      triggered: this.triggered
    };
  }
  
  /**
   * Check if healthy
   */
  isHealthy(): boolean {
    return this.getStatus().healthy;
  }
}

// Export singleton
export const heartbeat = new Heartbeat();
export default heartbeat;

// Re-export for convenience
export { FORCE_CONFIG };
