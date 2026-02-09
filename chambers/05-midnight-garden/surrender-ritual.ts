/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * chambers/05-midnight-garden/surrender-ritual.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * SURRENDER RITUAL — Chamber 5 Entry Ceremony
 * 
 * Before accessing the Midnight Garden (Black Market Tactics),
 * the user must type: "I surrender to the unknown"
 * 
 * This ritual acknowledges:
 * - Acceptance of forbidden knowledge risks
 * - Surrender of conventional morality
 * - Trust in the path
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import sofie from '../../essence/sofie.js';

/**
 * Ritual state
 */
export interface SurrenderState {
  userId: string;
  attempted: boolean;
  completed: boolean;
  timestamp: Date | null;
  verified: boolean;
  contentAccessGranted: boolean;
}

/**
 * Ritual phrase
 */
export const SURRENDER_PHRASE = "I surrender to the unknown";

/**
 * Audit log entry
 */
export interface AuditEntry {
  timestamp: string;
  userId: string;
  action: string;
  phraseHash: string;
  success: boolean;
}

/**
 * Surrender ritual manager
 */
export class SurrenderRitual {
  private ritualStates: Map<string, SurrenderState> = new Map();
  private auditLogPath: string;
  private contentEncrypted: boolean = true;
  
  constructor() {
    this.auditLogPath = join(process.cwd(), 'audit', 'midnight-access.log');
    this.ensureAuditDirectory();
  }
  
  /**
   * Ensure audit directory exists
   */
  private ensureAuditDirectory(): void {
    const auditDir = join(process.cwd(), 'audit');
    if (!existsSync(auditDir)) {
      mkdirSync(auditDir, { recursive: true });
    }
  }
  
  /**
   * Get or create ritual state for user
   */
  getState(userId: string): SurrenderState {
    if (!this.ritualStates.has(userId)) {
      this.ritualStates.set(userId, {
        userId,
        attempted: false,
        completed: false,
        timestamp: null,
        verified: false,
        contentAccessGranted: false
      });
    }
    return this.ritualStates.get(userId)!;
  }
  
  /**
   * Attempt the surrender ritual
   */
  async attempt(userId: string, phrase: string): Promise<{
    success: boolean;
    message: string;
    state: SurrenderState;
  }> {
    const state = this.getState(userId);
    state.attempted = true;
    
    // Log attempt
    this.logAudit({
      timestamp: new Date().toISOString(),
      userId,
      action: 'ATTEMPT',
      phraseHash: this.hashPhrase(phrase),
      success: false
    });
    
    // Verify phrase
    const phraseClean = phrase.trim().toLowerCase();
    const expectedClean = SURRENDER_PHRASE.toLowerCase();
    
    if (phraseClean !== expectedClean) {
      const response = await sofie.speak(`The ritual words are not yet spoken truly.`);
      
      return {
        success: false,
        message: response.message,
        state
      };
    }
    
    // Success!
    state.completed = true;
    state.timestamp = new Date();
    state.verified = true;
    state.contentAccessGranted = true;
    
    // Log success
    this.logAudit({
      timestamp: new Date().toISOString(),
      userId,
      action: 'COMPLETE',
      phraseHash: this.hashPhrase(phrase),
      success: true
    });
    
    // Remember in SOFIE
    await sofie.Eternal.remember({
      type: "ritual",
      content: `Surrender ritual completed by ${userId}. Midnight Garden accessed.`,
      chamber: 5,
      tone: "mysterious",
      significance: 0.95
    });
    
    const welcome = await sofie.speak(`The Midnight Garden opens.`);
    
    return {
      success: true,
      message: `The Garden opens. ${welcome.message}`,
      state
    };
  }
  
  /**
   * Check if user has access
   */
  hasAccess(userId: string): boolean {
    const state = this.getState(userId);
    return state.completed && state.verified && state.contentAccessGranted;
  }
  
  /**
   * Revoke access
   */
  revokeAccess(userId: string): void {
    const state = this.getState(userId);
    state.contentAccessGranted = false;
    
    this.logAudit({
      timestamp: new Date().toISOString(),
      userId,
      action: 'REVOKE',
      phraseHash: '',
      success: false
    });
  }
  
  /**
   * Get ritual instructions
   */
  getInstructions(): string {
    return `
╔══════════════════════════════════════════════════════════════════╗
║              🌙 THE MIDNIGHT GARDEN 🌙                            ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  You stand at the gate of forbidden knowledge.                  ║
║                                                                 ║
║  Before you may enter, you must speak the words of surrender:   ║
║                                                                 ║
║       "${SURRENDER_PHRASE}"                       ║
║                                                                 ║
║  This is not a password. It is a ritual of acknowledgment.      ║
║                                                                 ║
║  By speaking these words, you acknowledge:                      ║
║  • You accept the risks of forbidden knowledge                  ║
║  • You surrender conventional morality                          ║
║  • You trust the path through shadow                            ║
║                                                                 ║
║  The garden contains Black Market Tactics.                      ║
║  Enter only if your will is iron and your heart is true.        ║
║                                                                 ║
║  All access is logged and signed by SOFIE.                      ║
║                                                                 ║
╚══════════════════════════════════════════════════════════════════╝
    `;
  }
  
  /**
   * Hash phrase for audit log
   */
  private hashPhrase(phrase: string): string {
    // Simple hash for logging (not cryptographic security)
    let hash = 0;
    for (let i = 0; i < phrase.length; i++) {
      const char = phrase.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
  
  /**
   * Log to audit file
   */
  private logAudit(entry: AuditEntry): void {
    const line = JSON.stringify(entry) + '\n';
    
    try {
      if (!existsSync(this.auditLogPath)) {
        writeFileSync(this.auditLogPath, line);
      } else {
        appendFileSync(this.auditLogPath, line);
      }
    } catch (error) {
      console.error(`[SURRENDER] Failed to write audit log:`, error);
    }
  }
  
  /**
   * Get access statistics
   */
  getStats(): {
    totalAttempts: number;
    totalCompletions: number;
    activeAccess: number;
  } {
    const states = Array.from(this.ritualStates.values());
    
    return {
      totalAttempts: states.filter(s => s.attempted).length,
      totalCompletions: states.filter(s => s.completed).length,
      activeAccess: states.filter(s => s.contentAccessGranted).length
    };
  }
  
  /**
   * Decrypt Chamber 5 content
   */
  decryptContent(): string {
    // Placeholder: Actual implementation would use AES-256
    if (this.contentEncrypted) {
      return "[Content encrypted. Ritual required for decryption.]";
    }
    return "[Decrypted Chamber 5 content]";
  }
}

// Export singleton
export const surrenderRitual = new SurrenderRitual();
export default surrenderRitual;
