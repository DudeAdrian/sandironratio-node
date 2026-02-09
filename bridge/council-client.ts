/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * bridge/council-client.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * COUNCIL BRIDGE — Connection to the 6-Agent Council for Code Generation
 * 
 * The Council (Python FastAPI on port 9000) provides:
 * - Veda (The Builder) - Codebase architecture
 * - Aura (The Healer) - Wellness validation, veto power
 * - Hex (The Keeper) - NECTAR ledger, economics
 * - Node (The Weaver) - Integration, cross-repo connections
 * - Spark (The Muse) - Creative generation, UX/UI
 * - Tess (The Lattice) - Chair, systems architecture, coordination
 * 
 * Workflow:
 * 1. SOFIE receives user request
 * 2. SOFIE sends briefing to Council
 * 3. Council deliberates and proposes implementation
 * 4. User authorizes proposal
 * 5. Council executes and builds code
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { EventEmitter } from 'events';

/**
 * Council API endpoints
 */
export interface CouncilEndpoints {
  health: string;
  convene: string;
  status: string;
  authorize: string;
  standup: string;
  ledger: string;
}

/**
 * Sofie briefing to the council
 */
export interface SofieBriefing {
  command: 'convene';
  timestamp: string;
  chief_architect_present: boolean;
  ecosystem_state: {
    active_repos: string[];
    recent_changes: string[];
    blocked_tasks: string[];
  };
  sofie_requirements: string[];
  critical_path: string[];
  protected_notice: string;
}

/**
 * Council convening result
 */
export interface ConveningResult {
  phase: 'convened' | 'deliberating' | 'proposing';
  chair: 'tess';
  agents: string[];
  briefing_summary: string;
  sovereign_protection: string;
}

/**
 * Council proposal
 */
export interface CouncilProposal {
  proposal_id: string;
  timestamp: string;
  task_assignments: {
    agent_name: string;
    tasks: Array<{
      task_id: string;
      description: string;
      repo: string;
      estimated_hours: number;
      files_to_create: string[];
      files_to_modify: string[];
    }>;
  }[];
  timeline: {
    total_hours_estimated: number;
    parallel_execution: boolean;
    completion_date: string;
  };
  wellness_check: {
    aura_approved: boolean;
    concerns: string[];
  };
  requires_authorization: boolean;
}

/**
 * Authorization request
 */
export interface AuthorizationRequest {
  proposal_id: string;
  authorized: boolean;
  modifications?: Record<string, any>;
}

/**
 * Deployment result
 */
export interface DeploymentResult {
  success: boolean;
  deployed_files: string[];
  git_commits: string[];
  hours_logged: number;
  NECTAR_earned: number;
  next_steps: string[];
}

/**
 * Council client configuration
 */
export interface CouncilConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

/**
 * Council Client — Bridge to the 6-Agent Build Council
 */
export class CouncilClient {
  private config: CouncilConfig;
  private endpoints: CouncilEndpoints;
  private isConnected: boolean = false;
  
  constructor(config?: Partial<CouncilConfig>) {
    this.config = {
      baseUrl: config?.baseUrl || 'http://localhost:9000',
      timeout: config?.timeout || 30000,
      retries: config?.retries || 3
    };
    
    this.endpoints = {
      health: `${this.config.baseUrl}/health`,
      convene: `${this.config.baseUrl}/council/convene`,
      status: `${this.config.baseUrl}/council/status`,
      authorize: `${this.config.baseUrl}/council/authorize`,
      standup: `${this.config.baseUrl}/council/standup`,
      ledger: `${this.config.baseUrl}/council/ledger`
    };
  }
  
  /**
   * Check if council is running
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(this.endpoints.health, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        this.isConnected = data.status === 'healthy';
        console.log(`🏛️ [COUNCIL] ${this.isConnected ? 'Connected' : 'Unavailable'}`);
        console.log(`   Sovereign protection: ${data.sovereign_protection}`);
        return this.isConnected;
      }
      return false;
    } catch (error) {
      console.error(`🏛️ [COUNCIL] Health check failed:`, error);
      this.isConnected = false;
      return false;
    }
  }
  
  /**
   * Convene the council with Sofie's briefing
   */
  async convene(briefing: SofieBriefing): Promise<ConveningResult> {
    if (!this.isConnected) {
      await this.checkHealth();
    }
    
    console.log(`🏛️ [COUNCIL] Convening with briefing...`);
    console.log(`   Requirements: ${briefing.sofie_requirements.length}`);
    console.log(`   Critical path items: ${briefing.critical_path.length}`);
    
    const response = await fetch(this.endpoints.convene, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(briefing),
      signal: AbortSignal.timeout(this.config.timeout)
    });
    
    if (!response.ok) {
      throw new Error(`Council convening failed: ${response.statusText}`);
    }
    
    const result: ConveningResult = await response.json();
    console.log(`🏛️ [COUNCIL] Convened successfully`);
    console.log(`   Chair: ${result.chair}`);
    console.log(`   Agents: ${result.agents.join(', ')}`);
    
    return result;
  }
  
  /**
   * Get council status and proposal
   */
  async getStatus(): Promise<{
    phase: string;
    proposal?: CouncilProposal;
  }> {
    const response = await fetch(this.endpoints.status, {
      method: 'GET',
      signal: AbortSignal.timeout(this.config.timeout)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get council status: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  /**
   * Authorize a council proposal
   */
  async authorize(proposalId: string, authorized: boolean = true): Promise<DeploymentResult> {
    console.log(`🏛️ [COUNCIL] ${authorized ? 'Authorizing' : 'Rejecting'} proposal ${proposalId}`);
    
    const request: AuthorizationRequest = {
      proposal_id: proposalId,
      authorized
    };
    
    const response = await fetch(this.endpoints.authorize, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(this.config.timeout * 2) // Longer timeout for deployment
    });
    
    if (!response.ok) {
      throw new Error(`Authorization failed: ${response.statusText}`);
    }
    
    const result: DeploymentResult = await response.json();
    
    if (result.success) {
      console.log(`🏛️ [COUNCIL] Deployment complete`);
      console.log(`   Files deployed: ${result.deployed_files.length}`);
      console.log(`   Git commits: ${result.git_commits.length}`);
      console.log(`   NECTAR earned: ${result.NECTAR_earned}`);
    }
    
    return result;
  }
  
  /**
   * Request full workflow: convene → deliberate → propose → authorize
   */
  async requestBuild(options: {
    requirements: string[];
    criticalPath?: string[];
    autoAuthorize?: boolean;
  }): Promise<DeploymentResult> {
    // Step 1: Create briefing
    const briefing: SofieBriefing = {
      command: 'convene',
      timestamp: new Date().toISOString(),
      chief_architect_present: true,
      ecosystem_state: {
        active_repos: ['sandironratio-node', 'sofie-llama-backend'],
        recent_changes: [],
        blocked_tasks: []
      },
      sofie_requirements: options.requirements,
      critical_path: options.criticalPath || [],
      protected_notice: 'sofie-llama-backend is sovereign territory - council builds external interfaces only'
    };
    
    // Step 2: Convene
    await this.convene(briefing);
    
    // Step 3: Wait for proposal
    console.log(`🏛️ [COUNCIL] Awaiting deliberation and proposal...`);
    await new Promise(resolve => setTimeout(resolve, 3000)); // Give council time to deliberate
    
    const status = await this.getStatus();
    
    if (!status.proposal) {
      throw new Error('Council did not generate a proposal');
    }
    
    // Step 4: Display proposal
    console.log(`\n📋 [PROPOSAL] ${status.proposal.proposal_id}`);
    console.log(`   Timeline: ${status.proposal.timeline.total_hours_estimated}h`);
    console.log(`   Wellness check: ${status.proposal.wellness_check.aura_approved ? '✅' : '⚠️'}`);
    
    for (const assignment of status.proposal.task_assignments) {
      console.log(`\n   ${assignment.agent_name}:`);
      for (const task of assignment.tasks) {
        console.log(`     - ${task.description} (~${task.estimated_hours}h)`);
      }
    }
    
    // Step 5: Authorize (if auto-authorize)
    if (options.autoAuthorize) {
      console.log(`\n🔐 [AUTO-AUTHORIZE] Proceeding with deployment...`);
      return await this.authorize(status.proposal.proposal_id, true);
    } else {
      console.log(`\n⏸️  [AWAITING] User authorization required`);
      console.log(`   Run: council.authorize("${status.proposal.proposal_id}", true)`);
      throw new Error('User authorization required');
    }
  }
  
  /**
   * Get daily standup report
   */
  async getDailyStandup(): Promise<any> {
    const response = await fetch(this.endpoints.standup, {
      method: 'GET',
      signal: AbortSignal.timeout(this.config.timeout)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get standup: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  /**
   * Query NECTAR ledger
   */
  async getNECTARBalance(agentName?: string): Promise<any> {
    const url = agentName 
      ? `${this.endpoints.ledger}?agent=${agentName}`
      : this.endpoints.ledger;
    
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(this.config.timeout)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to query ledger: ${response.statusText}`);
    }
    
    return await response.json();
  }
}

// Singleton instance
export const councilClient = new CouncilClient();

export default councilClient;
