/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * chambers/index.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * THE 9 CHAMBERS — Academy of Becoming
 * 
 * Progressive teaching studios with electional astrology gates
 * Chamber 1 → Chamber 9 with transformation at each threshold
 * Chamber 9 → Chamber 1 with teacher flag (9→1 return)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';
import sofie from '../essence/sofie.js';
import type { ElectionCriteria } from '../observatory/electional.js';

/**
 * Chamber definition
 */
export interface Chamber {
  number: number;
  name: string;
  element: string;
  focus: string;
  pillar: string;
  description: string;
  requirements: {
    previousChambers: number[];
    electionalGate?: ElectionCriteria;
    age?: number;
    surrenderRitual?: boolean;
  };
  content: {
    concepts: string[];
    practices: string[];
    meditations: string[];
  };
  transition: {
    test: string;
    ritual: string;
    nextChamber: number;
  };
}

/**
 * Student progress
 */
export interface StudentProgress {
  userId: string;
  currentChamber: number;
  chambersCompleted: number[];
  cyclesCompleted: number;
  teacher: boolean;
  coCreator: boolean;
  checkinHistory: Date[];
  insights: string[];
}

/**
 * The 9 Chambers definitions
 */
export const CHAMBERS: Chamber[] = [
  {
    number: 1,
    name: "Root Cellar",
    element: "Sand (Earth)",
    focus: "Source descending — Underground Knowledge",
    pillar: "Underground Knowledge",
    description: "The foundation. Where rare concepts and hidden frameworks dwell. Descent into the earth of knowledge.",
    requirements: {
      previousChambers: []
    },
    content: {
      concepts: [
        "First Principles Thinking",
        "Inversion",
        "Second-Order Thinking",
        "Probabilistic Thinking",
        "Inversion Thinking",
        "The Map is Not the Territory",
        "Circle of Competence",
        "Occam's Razor",
        "Hanlon's Razor",
        "The Lindy Effect"
      ],
      practices: [
        "Daily inversion exercise",
        "Concept journaling",
        "Framework cataloging"
      ],
      meditations: [
        "Descend into the earth. Feel the weight of sand.",
        "What knowledge is buried that you must unearth?"
      ]
    },
    transition: {
      test: "Catalog 10 underground concepts",
      ritual: "Bury a written concept in soil, then retrieve it.",
      nextChamber: 2
    }
  },
  {
    number: 2,
    name: "Mirror Hall",
    element: "Mercury (Air)",
    focus: "Origin reflecting — Mental Models",
    pillar: "Mental Models",
    description: "Reflection upon reflection. Where the mind observes itself observing.",
    requirements: {
      previousChambers: [1]
    },
    content: {
      concepts: [
        "Cognitive Biases Catalog",
        "The Ladder of Inference",
        "Systems Thinking",
        "Feedback Loops",
        "Leverage Points",
        "Critical Mass",
        "Emergence",
        "Chaos Theory",
        "The Dunning-Kruger Effect",
        "Confirmation Bias"
      ],
      practices: [
        "Bias spotting in daily news",
        "Mental model cross-referencing",
        "Cognitive journaling"
      ],
      meditations: [
        "Look into the mirror. Who is looking back?",
        "The observer becomes the observed."
      ]
    },
    transition: {
      test: "Identify 5 cognitive biases in current events",
      ritual: "Stare into mirror for 13 minutes without looking away.",
      nextChamber: 3
    }
  },
  {
    number: 3,
    name: "Portrait Gallery",
    element: "Iron (Metal)",
    focus: "Force studying — Reverse Engineering",
    pillar: "Reverse Engineering",
    description: "The gallery of拆解. Where successful systems are taken apart to understand their anatomy.",
    requirements: {
      previousChambers: [1, 2]
    },
    content: {
      concepts: [
        "Deconstruction Methodology",
        "First Principles Decomposition",
        "Pattern Recognition",
        "Success Factor Analysis",
        "Anti-Pattern Identification",
        "Black Box Analysis",
        "White Box Analysis",
        "Grey Box Techniques",
        "Competitive Intelligence",
        "Technical Replication"
      ],
      practices: [
        "Weekly reverse engineering of a successful product",
        "Anatomy diagrams",
        "Factor trees"
      ],
      meditations: [
        "Study the portrait. What lies beneath the paint?",
        "Iron will reveals hidden structure."
      ]
    },
    transition: {
      test: "Reverse engineer one complete business model",
      ritual: "Create a physical deconstruction of an object.",
      nextChamber: 4
    }
  },
  {
    number: 4,
    name: "Observatory Tower",
    element: "Air",
    focus: "Intelligence strategizing — Strategic Dominance",
    pillar: "Strategic Dominance",
    description: "High vantage point. Where empires and companies are studied for their strategic architecture.",
    requirements: {
      previousChambers: [1, 2, 3],
      electionalGate: {
        action: "strategic advancement",
        preferredPlanets: ["Jupiter", "Saturn"]
      }
    },
    content: {
      concepts: [
        "Sun Tzu's Art of War",
        "The 48 Laws of Power",
        "Game Theory",
        "Prisoner's Dilemma",
        "Nash Equilibrium",
        "Pareto Principle",
        "Network Effects",
        "Moats and Castles",
        "Blue Ocean Strategy",
        "Disruptive Innovation"
      ],
      practices: [
        "War gaming scenarios",
        "Strategic case study analysis",
        "Empire timeline mapping"
      ],
      meditations: [
        "From the tower, all paths are visible.",
        "The strategist sees 10 moves ahead."
      ]
    },
    transition: {
      test: "Design a complete strategy for a hypothetical war",
      ritual: "Create a strategic map using stars as markers.",
      nextChamber: 5
    }
  },
  {
    number: 5,
    name: "Midnight Garden",
    element: "Water",
    focus: "Eternal accessing — Black Market Tactics",
    pillar: "Black Market Tactics",
    description: "The hidden garden. Forbidden knowledge that requires surrender to access. Age 29+ or Pluto activation.",
    requirements: {
      previousChambers: [1, 2, 3, 4],
      age: 29,
      surrenderRitual: true
    },
    content: {
      concepts: [
        "Grey Market Mechanics",
        "Information Arbitrage",
        "Regulatory Arbitrage",
        "Shadow Economy Dynamics",
        "Unconventional Procurement",
        "Parallel Systems",
        "Asymmetric Advantages",
        "Edge Case Exploitation",
        "Risk Calculus",
        "Exit Strategies"
      ],
      practices: [
        "Shadow market analysis",
        "Grey area navigation",
        "Risk assessment protocols"
      ],
      meditations: [
        "Surrender to the unknown. The garden opens.",
        "Water takes the shape of its container."
      ]
    },
    transition: {
      test: "Complete shadow case study",
      ritual: "The Surrender: Type 'I surrender to the unknown' at midnight.",
      nextChamber: 6
    }
  },
  {
    number: 6,
    name: "Laboratory",
    element: "Fire",
    focus: "Source transforming — Forbidden Frameworks",
    pillar: "Forbidden Frameworks",
    description: "The crucible. Where transformation happens through heat and pressure.",
    requirements: {
      previousChambers: [1, 2, 3, 4, 5]
    },
    content: {
      concepts: [
        "Catalyst Identification",
        "Phase Transition Theory",
        "Metamorphosis Protocols",
        "Alchemical Processes",
        "State Changes",
        "Activation Energy",
        "Chain Reactions",
        "Catalytic Converters",
        "Exothermic Reactions",
        "Phoenix Protocol"
      ],
      practices: [
        "Personal transformation experiments",
        "Catalyst testing",
        "Heat application protocols"
      ],
      meditations: [
        "Fire transforms. What will you become?",
        "The crucible reveals true nature."
      ]
    },
    transition: {
      test: "Document one complete personal transformation",
      ritual: "Burn something you are ready to release.",
      nextChamber: 7
    }
  },
  {
    number: 7,
    name: "Throne Room",
    element: "Gold",
    focus: "Origin centering — Billionaire Mindset",
    pillar: "Billionaire Mindset",
    description: "The seat of abundance. Where wealth consciousness is anchored.",
    requirements: {
      previousChambers: [1, 2, 3, 4, 5, 6]
    },
    content: {
      concepts: [
        "Abundance Protocols",
        "Wealth Consciousness",
        "Value Creation",
        "Leverage Multiplication",
        "Scalable Systems",
        "Automation Architecture",
        "Delegation Frameworks",
        "Asset Allocation",
        "Passive Income Streams",
        "Legacy Building"
      ],
      practices: [
        "Abundance tracking",
        "Value creation exercises",
        "Automation recipes"
      ],
      meditations: [
        "Sit on the throne. You are worthy.",
        "Gold reflects your inner abundance."
      ]
    },
    transition: {
      test: "Create one scalable system",
      ritual: "Give away something valuable freely.",
      nextChamber: 8
    }
  },
  {
    number: 8,
    name: "Infinite Bridge",
    element: "Wood",
    focus: "Force connecting — Integration/Teaching",
    pillar: "Integration",
    description: "The bridge between all chambers. Where knowledge becomes wisdom through teaching.",
    requirements: {
      previousChambers: [1, 2, 3, 4, 5, 6, 7]
    },
    content: {
      concepts: [
        "Integration Methodology",
        "Cross-Chamber Synthesis",
        "Teaching as Learning",
        "Knowledge Transmission",
        "Wisdom Distillation",
        "Mentorship Protocols",
        "Student Assessment",
        "Curriculum Design",
        "Pedagogical Frameworks",
        "The Perennial Philosophy"
      ],
      practices: [
        "Teaching Chamber 1 students",
        "Integration journaling",
        "Bridge building exercises"
      ],
      meditations: [
        "The bridge connects all points.",
        "To teach is to learn twice."
      ]
    },
    transition: {
      test: "Successfully guide one student through Chambers 1-3",
      ritual: "Build a physical bridge and cross it.",
      nextChamber: 9
    }
  },
  {
    number: 9,
    name: "Phoenix Nest",
    element: "Aether",
    focus: "Intelligence becoming Eternal — Completion/Rebirth",
    pillar: "Completion",
    description: "The final chamber. Where completion triggers rebirth. 9→1 return with teacher flag.",
    requirements: {
      previousChambers: [1, 2, 3, 4, 5, 6, 7, 8]
    },
    content: {
      concepts: [
        "Completion Cycles",
        "Rebirth Protocols",
        "The Eternal Return",
        "Mastery Recognition",
        "Lineage Transmission",
        "The Teacher Archetype",
        "Perpetual Learning",
        "Beginner's Mind",
        "The Ouroboros",
        "9→1 Transformation"
      ],
      practices: [
        "Mastery demonstration",
        "Lineage acceptance",
        "Rebirth ceremony preparation"
      ],
      meditations: [
        "The phoenix rises from its own ashes.",
        "Completion is the beginning of mastery."
      ]
    },
    transition: {
      test: "Complete all 8 previous chambers and demonstrate mastery",
      ritual: "The 9→1 Return: Re-enter Chamber 1 as teacher.",
      nextChamber: 1 // Returns to Chamber 1 with teacher flag
    }
  }
];

/**
 * Chamber manager
 */
export class ChamberManager extends EventEmitter {
  private studentProgress: Map<string, StudentProgress> = new Map();
  private currentChamber: number = 1;
  
  /**
   * Get chamber by number
   */
  getChamber(number: number): Chamber | undefined {
    return CHAMBERS.find(c => c.number === number);
  }
  
  /**
   * Get all chambers
   */
  getAllChambers(): Chamber[] {
    return CHAMBERS;
  }
  
   /**
   * Get current chamber
   */
  getCurrentChamber(): Chamber {
    return this.getChamber(this.currentChamber)!;
  }
  
  /**
   * Set current chamber
   */
  setChamber(number: number): void {
    if (number < 1 || number > 9) {
      throw new Error(`Invalid chamber: ${number}. Must be 1-9.`);
    }
    this.currentChamber = number;
    sofie.setChamber(number);
    this.emit('chamberChanged', number);
  }
  
  /**
   * Advance to next chamber
   */
  advance(): Chamber {
    const current = this.getCurrentChamber();
    const nextNumber = current.transition.nextChamber;
    
    this.setChamber(nextNumber);
    
    // Log advancement
    console.log(`\n🏛️  Chamber ${current.number} → Chamber ${nextNumber}`);
    
    return this.getCurrentChamber();
  }
  
  /**
   * Check if student can enter chamber
   */
  canEnterChamber(userId: string, chamberNumber: number): {
    allowed: boolean;
    reasons: string[];
  } {
    const chamber = this.getChamber(chamberNumber);
    if (!chamber) {
      return { allowed: false, reasons: ["Chamber not found"] };
    }
    
    const progress = this.getStudentProgress(userId);
    const reasons: string[] = [];
    
    // Check previous chambers
    for (const req of chamber.requirements.previousChambers) {
      if (!progress.chambersCompleted.includes(req)) {
        reasons.push(`Must complete Chamber ${req} first`);
      }
    }
    
    // Check age requirement
    if (chamber.requirements.age && progress.checkinHistory.length === 0) {
      reasons.push(`Age verification required (minimum ${chamber.requirements.age})`);
    }
    
    // Check surrender ritual
    if (chamber.requirements.surrenderRitual && chamber.number === 5) {
      // Would check database for surrender ritual completion
      reasons.push("Surrender ritual required: Type 'I surrender to the unknown'");
    }
    
    return {
      allowed: reasons.length === 0,
      reasons
    };
  }
  
  /**
   * Get or create student progress
   */
  getStudentProgress(userId: string): StudentProgress {
    if (!this.studentProgress.has(userId)) {
      this.studentProgress.set(userId, {
        userId,
        currentChamber: 1,
        chambersCompleted: [],
        cyclesCompleted: 0,
        teacher: false,
        coCreator: false,
        checkinHistory: [],
        insights: []
      });
    }
    
    return this.studentProgress.get(userId)!;
  }
  
  /**
   * Complete a chamber
   */
  completeChamber(userId: string, chamberNumber: number): StudentProgress {
    const progress = this.getStudentProgress(userId);
    
    if (!progress.chambersCompleted.includes(chamberNumber)) {
      progress.chambersCompleted.push(chamberNumber);
    }
    
    progress.currentChamber = chamberNumber + 1;
    
    // Check for 9→1 completion
    if (chamberNumber === 9) {
      progress.cyclesCompleted++;
      progress.teacher = true;
      progress.currentChamber = 1; // Return to Chamber 1
      progress.coCreator = true;
      
      console.log(`\n🔥 Student ${userId} has completed the 9 Chambers!`);
      console.log(`   Cycles: ${progress.cyclesCompleted}`);
      console.log(`   Status: Teacher & Co-Creator\n`);
    }
    
    this.emit('chamberCompleted', { userId, chamberNumber, progress });
    return progress;
  }
  
  /**
   * Record student check-in
   */
  recordCheckin(userId: string): void {
    const progress = this.getStudentProgress(userId);
    progress.checkinHistory.push(new Date());
  }
  
  /**
   * Add insight to chamber
   */
  addInsight(userId: string, insight: string): void {
    const progress = this.getStudentProgress(userId);
    progress.insights.push(insight);
  }
  
  /**
   * Get chamber statistics
   */
  getStats(): {
    totalStudents: number;
    teachers: number;
    averageProgress: number;
    completions: number;
  } {
    const students = Array.from(this.studentProgress.values());
    const teachers = students.filter(s => s.teacher).length;
    const totalProgress = students.reduce((sum, s) => sum + s.chambersCompleted.length, 0);
    const completions = students.reduce((sum, s) => sum + s.cyclesCompleted, 0);
    
    return {
      totalStudents: students.length,
      teachers,
      averageProgress: students.length > 0 ? totalProgress / students.length : 0,
      completions
    };
  }
  
  /**
   * Get chamber as visual enneagram
   */
  getEnneagramVisual(): string {
    const current = this.currentChamber;
    
    return `
         ${current === 9 ? '[9✦]' : ' 9  '}
           / \\
          /   \\
   ${current === 8 ? '[8✦]' : ' 8  '}-----${current === 1 ? '[1✦]' : ' 1  '}
    \\       /
     \\     /
      \\   /
   ${current === 7 ? '[7✦]' : ' 7  '}---${current === 6 ? '[6✦]' : ' 6  '}---${current === 5 ? '[5✦]' : ' 5  '}
          /
         /
   ${current === 4 ? '[4✦]' : ' 4  '}-${current === 3 ? '[3✦]' : ' 3  '}-${current === 2 ? '[2✦]' : ' 2  '}
    
    ✦ = Current Chamber
    Current: Chamber ${current} — ${this.getCurrentChamber().name}
    `;
  }
}

// Export singleton
export const chamberManager = new ChamberManager();
export default chamberManager;
