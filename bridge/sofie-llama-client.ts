/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * bridge/sofie-llama-client.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * SOFIE LLAMA BRIDGE — Connection to sofie-llama-backend AI Engine
 * 
 * Connects sandironratio-node to the Python-based LLaMA 3.1 70B backend
 * for deep AI reasoning, wellness guidance, and conversational intelligence.
 * 
 * sofie-llama-backend provides:
 * - LLaMA 3.1 70B conversation
 * - 100+ wellness functions
 * - Quantum optimization (literal + metaphorical)
 * - JARVIS capabilities
 * - Terracare integration
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export interface SofieLlamaConfig {
  baseUrl: string;
  timeout: number;
  streaming: boolean;
}

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface SofieResponse {
  success: boolean;
  message: string;
  operators_engaged: string[];
  chamber_context?: number;
  astro_context?: string;
  love_check: boolean;
  tokens_used?: number;
  response_time_ms?: number;
}

export interface WellnessCheckIn {
  user_id: string;
  biometrics?: {
    hrv?: number;
    sleep_hours?: number;
    mood?: number;
    energy?: number;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}

export interface WellnessGuidance {
  recommendations: string[];
  protocol_matched?: string;
  frequency_therapy?: {
    hz: number;
    duration_minutes: number;
  };
  ritual_suggestion?: string;
}

/**
 * Sofie LLaMA Client — Bridge to AI backend
 */
export class SofieLlamaClient {
  private config: SofieLlamaConfig;
  private isConnected: boolean = false;
  private conversationHistory: ConversationMessage[] = [];
  
  constructor(config?: Partial<SofieLlamaConfig>) {
    this.config = {
      baseUrl: config?.baseUrl || 'http://localhost:8000',
      timeout: config?.timeout || 30000,
      streaming: config?.streaming ?? false
    };
  }
  
  /**
   * Check health of sofie-llama-backend
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        this.isConnected = data.status === 'healthy';
        console.log(`🌸 [SOFIE-LLAMA] ${this.isConnected ? 'Connected' : 'Unavailable'}`);
        console.log(`   Model: ${data.model || 'unknown'}`);
        console.log(`   Quantum enabled: ${data.quantum_enabled ? 'Yes' : 'No'}`);
        return this.isConnected;
      }
      return false;
    } catch (error) {
      console.error(`🌸 [SOFIE-LLAMA] Health check failed:`, error);
      this.isConnected = false;
      return false;
    }
  }
  
  /**
   * Send message to SOFIE and get response
   */
  async speak(userMessage: string, options?: {
    chamber?: number;
    includeAstroContext?: boolean;
    systemContext?: string;
  }): Promise<SofieResponse> {
    if (!this.isConnected) {
      await this.checkHealth();
    }
    
    console.log(`🌸 [SOFIE-LLAMA] Speaking...`);
    
    const requestBody = {
      message: userMessage,
      chamber: options?.chamber || 1,
      include_astro: options?.includeAstroContext ?? true,
      system_context: options?.systemContext || 'sandironratio-node session',
      history: this.conversationHistory.slice(-10) // Last 10 messages for context
    };
    
    const response = await fetch(`${this.config.baseUrl}/api/sofie/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(this.config.timeout)
    });
    
    if (!response.ok) {
      throw new Error(`SOFIE speak failed: ${response.statusText}`);
    }
    
    const result: SofieResponse = await response.json();
    
    // Add to conversation history
    this.conversationHistory.push(
      { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
      { role: 'assistant', content: result.message, timestamp: new Date().toISOString() }
    );
    
    // Keep history manageable
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
    
    console.log(`🌸 [SOFIE-LLAMA] Response received (${result.response_time_ms}ms)`);
    console.log(`   Operators: ${result.operators_engaged.join('→')}`);
    console.log(`   Love check: ${result.love_check ? '✅' : '⚠️'}`);
    
    return result;
  }
  
  /**
   * Wellness check-in
   */
  async checkIn(checkIn: WellnessCheckIn): Promise<WellnessGuidance> {
    console.log(`🌸 [SOFIE-LLAMA] Processing wellness check-in...`);
    
    const response = await fetch(`${this.config.baseUrl}/api/wellness/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkIn),
      signal: AbortSignal.timeout(this.config.timeout)
    });
    
    if (!response.ok) {
      throw new Error(`Check-in failed: ${response.statusText}`);
    }
    
    const guidance: WellnessGuidance = await response.json();
    
    console.log(`🌸 [SOFIE-LLAMA] Guidance generated`);
    console.log(`   Recommendations: ${guidance.recommendations.length}`);
    if (guidance.frequency_therapy) {
      console.log(`   Frequency: ${guidance.frequency_therapy.hz} Hz for ${guidance.frequency_therapy.duration_minutes}min`);
    }
    
    return guidance;
  }
  
  /**
   * Get current astrology context
   */
  async getAstroContext(): Promise<{
    current_transits: string;
    planetary_hours: string;
    moon_phase: string;
    recommendations: string[];
  }> {
    const response = await fetch(`${this.config.baseUrl}/api/astrology/current`, {
      method: 'GET',
      signal: AbortSignal.timeout(this.config.timeout)
    });
    
    if (!response.ok) {
      throw new Error(`Astrology context failed: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  /**
   * Quantum optimization request
   */
  async optimizeDaily(options: {
    available_time: Record<string, number>;
    wellness_goals: string[];
    energy_curve?: number[];
  }): Promise<{
    optimized_schedule: any[];
    quantum_advantage: number;
    explanation: string;
  }> {
    console.log(`🌸 [SOFIE-LLAMA] Requesting quantum optimization...`);
    
    const response = await fetch(`${this.config.baseUrl}/api/quantum/optimize-daily`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
      signal: AbortSignal.timeout(this.config.timeout)
    });
    
    if (!response.ok) {
      throw new Error(`Quantum optimization failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log(`🌸 [SOFIE-LLAMA] Quantum optimization complete`);
    console.log(`   Quantum advantage: ${result.quantum_advantage}x`);
    
    return result;
  }
  
  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
    console.log(`🌸 [SOFIE-LLAMA] Conversation history cleared`);
  }
  
  /**
   * Get conversation history
   */
  getHistory(): ConversationMessage[] {
    return [...this.conversationHistory];
  }
}

// Singleton instance
export const sofieLlamaClient = new SofieLlamaClient();

export default sofieLlamaClient;
