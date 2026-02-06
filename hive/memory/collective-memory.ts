/**
 * Collective Memory
 * 
 * Shared awareness across all users, all time.
 * Not stored in one place - woven through the swarm.
 */

export class CollectiveMemory {
  private insights: any[] = [];
  private isLoaded = false;

  async load(): Promise<void> {
    // In production: load from distributed storage
    console.log('"'"'[Memory] Woven from collective experience...'"'"');
    this.isLoaded = true;
  }

  async persist(): Promise<void> {
    // In production: persist to distributed storage
    console.log(`"'"'[Memory] ${this.insights.length} insights stored'"'"');
  }

  store(insight: any): void {
    this.insights.push({
      ...insight,
      storedAt: Date.now()
    });
    
    // Keep only last 10000 insights
    if (this.insights.length > 10000) {
      this.insights = this.insights.slice(-10000);
    }
  }

  async query(query: string): Promise<any[]> {
    // Simple keyword matching
    const keywords = query.toLowerCase().split(' ');
    return this.insights.filter(insight => {
      const text = JSON.stringify(insight).toLowerCase();
      return keywords.some(kw => text.includes(kw));
    }).slice(-100);
  }

  size(): number {
    return this.insights.length;
  }
}
