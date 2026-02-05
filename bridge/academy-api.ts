/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * bridge/academy-api.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * ACADEMY API — External queries interface
 * 
 * REST endpoints for external repos (heartware) to query:
 * - GET /chamber-state
 * - GET /karma/:userId
 * - GET /presence
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';
import chamberManager from '../chambers/index.js';
import sofie from '../essence/sofie.js';
import forge from '../forge/validator.js';

/**
 * Chamber state response
 */
export interface ChamberStateResponse {
  currentChamber: number;
  chamberName: string;
  element: string;
  totalStudents: number;
  teachers: number;
  completions: number;
}

/**
 * Karma/user progress response
 */
export interface KarmaResponse {
  userId: string;
  currentChamber: number;
  chambersCompleted: number[];
  cyclesCompleted: number;
  teacher: boolean;
  coCreator: boolean;
  insights: string[];
}

/**
 * Presence/mood broadcast
 */
export interface PresenceBroadcast {
  timestamp: string;
  status: 'awake' | 'teaching' | 'validating' | 'resting';
  currentChamber: number;
  chamberName: string;
  mood: string;
  validatorActive: boolean;
  blocksSigned: number;
}

/**
 * Academy API
 */
export class AcademyAPI extends EventEmitter {
  private presenceSubscribers: Set<(data: PresenceBroadcast) => void> = new Set();
  private broadcastInterval: ReturnType<typeof setInterval> | null = null;
  
  /**
   * Get chamber state
   */
  getChamberState(): ChamberStateResponse {
    const current = chamberManager.getCurrentChamber();
    const stats = chamberManager.getStats();
    
    return {
      currentChamber: current.number,
      chamberName: current.name,
      element: current.element,
      totalStudents: stats.totalStudents,
      teachers: stats.teachers,
      completions: stats.completions
    };
  }
  
  /**
   * Get karma/progress for user
   */
  getKarma(userId: string): KarmaResponse {
    const progress = chamberManager.getStudentProgress(userId);
    
    return {
      userId: progress.userId,
      currentChamber: progress.currentChamber,
      chambersCompleted: progress.chambersCompleted,
      cyclesCompleted: progress.cyclesCompleted,
      teacher: progress.teacher,
      coCreator: progress.coCreator,
      insights: progress.insights
    };
  }
  
  /**
   * Get current presence/mood
   */
  getPresence(): PresenceBroadcast {
    const status = sofie.getStatus();
    const forgeStatus = forge.getStatus();
    const current = chamberManager.getCurrentChamber();
    
    const moods = [
      "The Field organizes peacefully",
      "The Dude abides",
      "Sand surrenders to wind",
      "Iron holds steady",
      "Ratio reveals truth"
    ];
    
    return {
      timestamp: new Date().toISOString(),
      status: forgeStatus.running ? 'validating' : (status.awakened ? 'teaching' : 'resting'),
      currentChamber: current.number,
      chamberName: current.name,
      mood: moods[Math.floor(Math.random() * moods.length)],
      validatorActive: forgeStatus.running,
      blocksSigned: forgeStatus.metrics.blocksSigned
    };
  }
  
  /**
   * Subscribe to presence broadcasts
   */
  subscribePresence(callback: (data: PresenceBroadcast) => void): () => void {
    this.presenceSubscribers.add(callback);
    
    // Send immediate update
    callback(this.getPresence());
    
    // Return unsubscribe function
    return () => {
      this.presenceSubscribers.delete(callback);
    };
  }
  
  /**
   * Start presence broadcasting
   */
  startBroadcasting(intervalMs: number = 30000): void {
    if (this.broadcastInterval) return;
    
    this.broadcastInterval = setInterval(() => {
      const presence = this.getPresence();
      
      for (const subscriber of this.presenceSubscribers) {
        try {
          subscriber(presence);
        } catch (error) {
          console.error(`[ACADEMY-API] Broadcast error:`, error);
        }
      }
      
      this.emit('presenceBroadcast', presence);
    }, intervalMs);
    
    console.log(`[ACADEMY-API] Presence broadcasting started (${intervalMs}ms)`);
  }
  
  /**
   * Stop broadcasting
   */
  stopBroadcasting(): void {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
      console.log(`[ACADEMY-API] Presence broadcasting stopped`);
    }
  }
  
  /**
   * Record student insight
   */
  recordInsight(userId: string, insight: string): { success: boolean } {
    chamberManager.addInsight(userId, insight);
    
    // Remember in SOFIE
    sofie.Eternal.remember({
      type: "insight",
      content: `Student ${userId}: ${insight}`,
      chamber: chamberManager.getCurrentChamber().number,
      significance: 0.7
    });
    
    return { success: true };
  }
  
  /**
   * Advance student to next chamber
   */
  advanceStudent(userId: string): { success: boolean; newChamber: number } {
    const progress = chamberManager.getStudentProgress(userId);
    const currentChamber = progress.currentChamber;
    
    // Complete current chamber
    chamberManager.completeChamber(userId, currentChamber);
    
    const newProgress = chamberManager.getStudentProgress(userId);
    
    return {
      success: true,
      newChamber: newProgress.currentChamber
    };
  }
}

// Export singleton
export const academyAPI = new AcademyAPI();
export default academyAPI;
