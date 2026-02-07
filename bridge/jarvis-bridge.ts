/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * bridge/jarvis-bridge.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * Jarvis Bridge - Integration between sandironratio-node (Hive) and
 * sofie-llama-backend (Jarvis AI)
 *
 * Provides:
 * - Repository manifest loading
 * - Voice command proxy to Jarvis
 * - Ledger anchoring of all Admin actions
 * - Status synchronization
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { hexStore } from '../db/hex-store.js';

/**
 * Repository manifest interface
 */
interface RepositoryInfo {
  id: number;
  name: string;
  full_name: string;
  type: string;
  language: string;
  description: string;
  default_branch: string;
  deployable: boolean;
  priority: string;
  status?: string;
  is_local?: boolean;
}

interface RepoManifest {
  manifest_version: string;
  owner: string;
  owner_github: string;
  access_level: string;
  god_mode: boolean;
  repositories: RepositoryInfo[];
  security: {
    whitelist_pattern: string;
    allowed_operations: string[];
    confirmation_required: string[];
    rate_limits: Record<string, number>;
  };
  jarvis_config: {
    voice_model: string;
    llm_model: string;
    ollama_host: string;
    hive_api_url: string;
    command_timeout: number;
    confirmation_timeout: number;
    autonomous_mode: boolean;
    watch_interval: number;
  };
  ledger_integration: {
    anchor_actions: boolean;
    transparency_mode: string;
    hash_algorithm: string;
    action_types: string[];
  };
}

/**
 * Jarvis command result
 */
interface JarvisResult {
  success: boolean;
  message: string;
  details: Record<string, any>;
  timestamp: string;
  error?: string;
}

/**
 * Jarvis Bridge - God Mode integration
 */
export class JarvisBridge {
  private manifest: RepoManifest;
  private jarvisUrl: string;
  private hiveUrl: string;
  private isConnected: boolean = false;

  constructor(
    manifestPath: string = join(process.cwd(), 'config', 'repos-manifest.json'),
    jarvisUrl: string = process.env.JARVIS_URL || 'http://localhost:8000',
    hiveUrl: string = process.env.HIVE_URL || 'http://localhost:3000'
  ) {
    this.jarvisUrl = jarvisUrl;
    this.hiveUrl = hiveUrl;
    this.manifest = this.loadManifest(manifestPath);
  }

  /**
   * Load repository manifest
   */
  private loadManifest(path: string): RepoManifest {
    try {
      const content = readFileSync(path, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('[JarvisBridge] Failed to load manifest:', error);
      throw new Error('Repository manifest not found');
    }
  }

  /**
   * Initialize bridge connection
   */
  async initialize(): Promise<boolean> {
    console.log('[JarvisBridge] Initializing...');
    console.log(`[JarvisBridge] Owner: ${this.manifest.owner}`);
    console.log(`[JarvisBridge] Repositories: ${this.manifest.repositories.length}`);
    console.log(`[JarvisBridge] God Mode: ${this.manifest.god_mode ? 'ENABLED' : 'disabled'}`);

    // Test connection to Jarvis
    try {
      const response = await fetch(`${this.jarvisUrl}/health`);
      if (response.ok) {
        this.isConnected = true;
        console.log('[JarvisBridge] ✓ Connected to Jarvis');
      }
    } catch {
      console.warn('[JarvisBridge] ⚠ Jarvis not available');
    }

    return this.isConnected;
  }

  /**
   * Get repository list
   */
  getRepositories(): RepositoryInfo[] {
    return this.manifest.repositories;
  }

  /**
   * Get repository by name
   */
  getRepository(name: string): RepositoryInfo | undefined {
    return this.manifest.repositories.find(r => 
      r.name.toLowerCase() === name.toLowerCase()
    );
  }

  /**
   * Check if repository is in whitelist
   */
  isWhitelisted(repoName: string): boolean {
    const repo = this.getRepository(repoName);
    if (!repo) return false;

    const pattern = new RegExp(this.manifest.security.whitelist_pattern);
    return pattern.test(`https://github.com/${repo.full_name}`);
  }

  /**
   * Send voice/text command to Jarvis
   */
  async sendCommand(command: string, confirmed: boolean = false): Promise<JarvisResult> {
    console.log(`[JarvisBridge] Command: ${command}`);

    if (!this.isConnected) {
      return {
        success: false,
        message: 'Jarvis not connected',
        details: {},
        timestamp: new Date().toISOString()
      };
    }

    try {
      const response = await fetch(`${this.jarvisUrl}/jarvis/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, confirmed })
      });

      const data = await response.json();

      // Anchor to ledger if enabled
      if (this.manifest.ledger_integration.anchor_actions) {
        await this.anchorAction('voice_command', {
          command,
          result: data.result?.success,
          timestamp: data.result?.timestamp
        });
      }

      return {
        success: data.result?.success || false,
        message: data.result?.message || 'Unknown response',
        details: data.result?.details || {},
        timestamp: data.result?.timestamp || new Date().toISOString()
      };

    } catch (error) {
      console.error('[JarvisBridge] Command failed:', error);
      return {
        success: false,
        message: `Error: ${error}`,
        details: {},
        timestamp: new Date().toISOString(),
        error: String(error)
      };
    }
  }

  /**
   * Get status of all repositories
   */
  async getAllRepoStatus(): Promise<Record<string, any>> {
    if (!this.isConnected) {
      return {};
    }

    try {
      const response = await fetch(`${this.jarvisUrl}/jarvis/repos`);
      const data = await response.json();
      return data.repositories || {};
    } catch {
      return {};
    }
  }

  /**
   * Get status of specific repository
   */
  async getRepoStatus(repoName: string): Promise<any> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const response = await fetch(`${this.jarvisUrl}/jarvis/repo/${repoName}/status`);
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Anchor action to Terracare Ledger
   */
  private async anchorAction(actionType: string, data: Record<string, any>): Promise<void> {
    try {
      // Log to consensus log (chambers table integration)
      hexStore.logConsensus(1, 0, JSON.stringify({
        type: 'admin_action',
        action: actionType,
        data,
        timestamp: new Date().toISOString()
      }), 100);

      console.log(`[JarvisBridge] ✓ Anchored ${actionType} to Ledger`);
    } catch (error) {
      console.error('[JarvisBridge] Failed to anchor:', error);
    }
  }

  /**
   * Check if Admin voice is enrolled
   */
  async isAdminEnrolled(): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      const response = await fetch(`${this.jarvisUrl}/jarvis/admin/enrolled`);
      const data = await response.json();
      return data.admin_enrolled || false;
    } catch {
      return false;
    }
  }

  /**
   * Get Jarvis system status
   */
  async getJarvisStatus(): Promise<any> {
    if (!this.isConnected) {
      return { status: 'disconnected' };
    }

    try {
      const response = await fetch(`${this.jarvisUrl}/jarvis/status`);
      return await response.json();
    } catch {
      return { status: 'error' };
    }
  }

  /**
   * Start autonomous watch mode
   */
  async startWatchMode(): Promise<void> {
    console.log('[JarvisBridge] Starting autonomous watch mode...');
    
    const interval = this.manifest.jarvis_config.watch_interval * 1000;
    
    setInterval(async () => {
      await this.watchTick();
    }, interval);
  }

  /**
   * Autonomous watch tick
   */
  private async watchTick(): Promise<void> {
    console.log('[JarvisBridge] Watch tick');

    // Check Hive status
    try {
      const hiveResponse = await fetch(`${this.hiveUrl}/api/hives/status`);
      const hiveData = await hiveResponse.json();
      
      const totalAgents = hiveData.hives?.reduce((sum: number, h: any) => sum + (h.current || 0), 0) || 0;
      
      if (totalAgents > 143000) {
        console.log('[JarvisBridge] ⚠️ Migration threshold approaching!');
      }
    } catch {
      // Hive not available
    }

    // Check repositories
    try {
      const repos = await this.getAllRepoStatus();
      console.log(`[JarvisBridge] Monitoring ${Object.keys(repos).length} repos`);
    } catch {
      // Ignore errors
    }
  }

  /**
   * Generate daily briefing
   */
  async generateDailyBriefing(): Promise<string> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Get stats from ledger
    const consensusEvents = 0; // Would query from hexStore
    const nectarDistributed = 15000; // Placeholder

    return `
📊 Daily Briefing for DudeAdrian
📅 ${yesterday.toDateString()}

🏛️ Hive Activity:
   • Consensus Events: ${consensusEvents}
   • Nectar Distributed: ${nectarDistributed.toLocaleString()}

📦 Repository Activity:
   • Commits: (query from GitHub)
   • Pull Requests: (query from GitHub)
   • Issues: (query from GitHub)

🧠 Jarvis Activity:
   • Commands Executed: (query from logs)
   • Code Generated: (query from logs)

⚠️ Alerts:
   • None

💡 Suggestions:
   • Check Hive Genesis capacity
   • Review pending PRs
    `.trim();
  }
}

/**
 * Singleton instance
 */
let jarvisBridge: JarvisBridge | null = null;

export function getJarvisBridge(): JarvisBridge {
  if (!jarvisBridge) {
    jarvisBridge = new JarvisBridge();
  }
  return jarvisBridge;
}

export default JarvisBridge;
