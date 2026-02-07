/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * library/numerology/pythagorean.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * PYTHAGOREAN NUMEROLOGY
 * 
 * The Western system: Life Path, Expression, Soul Urge
 * Letters A-Z map to 1-9 in repeating cycle
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { type CalculationResult } from '../../essence/intelligence.js';

/**
 * Pythagorean calculation result
 */
export interface PythagoreanResult {
  lifePath: {
    number: number;
    meaning: string;
    calculation: string;
  };
  expression: {
    number: number;
    meaning: string;
    calculation: string;
  };
  soulUrge: {
    number: number;
    meaning: string;
    calculation: string;
  };
  birthday: {
    number: number;
    meaning: string;
  };
  personalYear: {
    number: number;
    meaning: string;
    currentYear: number;
  };
}

/**
 * Pythagorean number meanings
 */
export const PYTHAGOREAN_MEANINGS: { [key: number]: { 
  title: string; 
  lifePath: string;
  expression: string;
  soulUrge: string;
} } = {
  1: {
    title: "The Leader",
    lifePath: "Independent, pioneering, self-motivated. Born to lead and innovate.",
    expression: "Natural leader with creative drive. Strong individualist.",
    soulUrge: "Desires autonomy and recognition. Drives toward achievement."
  },
  2: {
    title: "The Peacemaker",
    lifePath: "Cooperative, diplomatic, sensitive. Born to mediate and unite.",
    expression: "Diplomatic and intuitive. Excels in partnerships.",
    soulUrge: "Desires harmony and connection. Sensitive to others' needs."
  },
  3: {
    title: "The Communicator",
    lifePath: "Creative, expressive, social. Born to inspire and entertain.",
    expression: "Artistic and charismatic. Natural communicator.",
    soulUrge: "Desires self-expression and joy. Creative at core."
  },
  4: {
    title: "The Builder",
    lifePath: "Practical, disciplined, reliable. Born to establish foundations.",
    expression: "Systematic and hardworking. Builds lasting structures.",
    soulUrge: "Desires stability and order. Values security."
  },
  5: {
    title: "The Freedom Seeker",
    lifePath: "Adventurous, versatile, progressive. Born to explore and change.",
    expression: "Dynamic and adaptable. Thrives on variety.",
    soulUrge: "Desires freedom and experience. Resists restriction."
  },
  6: {
    title: "The Nurturer",
    lifePath: "Responsible, protective, loving. Born to serve and harmonize.",
    expression: "Caring and artistic. Natural healer and counselor.",
    soulUrge: "Desires to nurture and be nurtured. Seeks beauty."
  },
  7: {
    title: "The Seeker",
    lifePath: "Analytical, spiritual, introspective. Born to seek truth.",
    expression: "Intellectual and mystical. Deep thinker.",
    soulUrge: "Desires knowledge and understanding. Solitary at heart."
  },
  8: {
    title: "The Powerhouse",
    lifePath: "Ambitious, authoritative, materially focused. Born to achieve.",
    expression: "Executive and efficient. Masters material world.",
    soulUrge: "Desires success and recognition. Driven to accomplish."
  },
  9: {
    title: "The Humanitarian",
    lifePath: "Compassionate, idealistic, universal. Born to serve humanity.",
    expression: "Selfless and artistic. Global perspective.",
    soulUrge: "Desires to uplift others. Compassionate core."
  },
  11: {
    title: "The Intuitive",
    lifePath: "Illuminated, sensitive, visionary. Master number of intuition.",
    expression: "Inspirational and perceptive. Spiritual messenger.",
    soulUrge: "Desires spiritual connection. High sensitivity."
  },
  22: {
    title: "The Master Builder",
    lifePath: "Practical visionary, ambitious, powerful. Master number of manifestation.",
    expression: "Organized and inspired. Builds for humanity.",
    soulUrge: "Desires to create lasting legacy. Great potential."
  },
  33: {
    title: "The Master Teacher",
    lifePath: "Compassionate, nurturing, self-sacrificing. Master number of service.",
    expression: "Loving and guiding. Uplifts through teaching.",
    soulUrge: "Desires to heal and guide. Christ consciousness."
  }
};

/**
 * Pythagorean letter values
 */
export const PYTHAGOREAN_CHART: { [key: string]: number } = {
  a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9,
  j: 1, k: 2, l: 3, m: 4, n: 5, o: 6, p: 7, q: 8, r: 9,
  s: 1, t: 2, u: 3, v: 4, w: 5, x: 6, y: 7, z: 8
};

/**
 * Pythagorean numerology engine
 */
export class PythagoreanNumerology {
  /**
   * Calculate complete Pythagorean profile
   */
  calculate(params: {
    name: string;
    birthDate: Date;
  }): CalculationResult<PythagoreanResult> {
    const lifePath = this.calculateLifePath(params.birthDate);
    const expression = this.calculateExpression(params.name);
    const soulUrge = this.calculateSoulUrge(params.name);
    const birthday = this.calculateBirthday(params.birthDate);
    const personalYear = this.calculatePersonalYear(params.birthDate);
    
    const result: PythagoreanResult = {
      lifePath,
      expression,
      soulUrge,
      birthday,
      personalYear
    };
    
    return {
      success: true,
      domain: "numerology",
      data: result,
      confidence: 0.9,
      timestamp: new Date()
    };
  }
  
  /**
   * Calculate Life Path Number from birth date
   */
  calculateLifePath(birthDate: Date): PythagoreanResult['lifePath'] {
    const day = birthDate.getDate();
    const month = birthDate.getMonth() + 1;
    const year = birthDate.getFullYear();
    
    // Reduce each component
    const dayNum = this.reduce(day);
    const monthNum = this.reduce(month);
    const yearNum = this.reduce(year);
    
    // Sum and reduce
    const total = dayNum + monthNum + yearNum;
    const lifePath = this.reduceToMaster(total);
    
    const meaning = PYTHAGOREAN_MEANINGS[lifePath];
    
    return {
      number: lifePath,
      meaning: meaning ? meaning.lifePath : "Unknown",
      calculation: `${day}/${month}/${year} → ${dayNum} + ${monthNum} + ${yearNum} = ${total} → ${lifePath}`
    };
  }
  
  /**
   * Calculate Expression Number from full name
   */
  calculateExpression(name: string): PythagoreanResult['expression'] {
    const letters = name.toLowerCase().replace(/[^a-z]/g, '');
    let total = 0;
    
    for (const letter of letters) {
      total += PYTHAGOREAN_CHART[letter] || 0;
    }
    
    const expression = this.reduceToMaster(total);
    const meaning = PYTHAGOREAN_MEANINGS[expression];
    
    return {
      number: expression,
      meaning: meaning ? meaning.expression : "Unknown",
      calculation: `"${name}" = ${total} → ${expression}`
    };
  }
  
  /**
   * Calculate Soul Urge Number from vowels in name
   */
  calculateSoulUrge(name: string): PythagoreanResult['soulUrge'] {
    const vowels = name.toLowerCase().replace(/[^aeiou]/g, '');
    let total = 0;
    
    for (const letter of vowels) {
      total += PYTHAGOREAN_CHART[letter] || 0;
    }
    
    const soulUrge = this.reduceToMaster(total);
    const meaning = PYTHAGOREAN_MEANINGS[soulUrge];
    
    return {
      number: soulUrge,
      meaning: meaning ? meaning.soulUrge : "Unknown",
      calculation: `Vowels in "${name}" = ${total} → ${soulUrge}`
    };
  }
  
  /**
   * Calculate Birthday Number (day of birth reduced)
   */
  calculateBirthday(birthDate: Date): PythagoreanResult['birthday'] {
    const day = birthDate.getDate();
    const birthday = this.reduceToMaster(day);
    
    const meanings: { [key: number]: string } = {
      1: "Natural leader, independent spirit",
      2: "Diplomatic, cooperative nature",
      3: "Creative self-expression",
      4: "Practical foundation builder",
      5: "Freedom-loving adventurer",
      6: "Nurturing, harmonious soul",
      7: "Seeker of truth and wisdom",
      8: "Ambitious, materially successful",
      9: "Compassionate humanitarian",
      11: "Intuitive, spiritually sensitive",
      22: "Master builder potential",
      29: "Intuitive healer (11/2)"
    };
    
    return {
      number: birthday,
      meaning: meanings[birthday] || "Unique birthday energy"
    };
  }
  
  /**
   * Calculate Personal Year Number
   */
  calculatePersonalYear(birthDate: Date): PythagoreanResult['personalYear'] {
    const currentYear = new Date().getFullYear();
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();
    
    const total = this.reduce(month) + this.reduce(day) + this.reduce(currentYear);
    const personalYear = this.reduceToMaster(total);
    
    const meanings: { [key: number]: string } = {
      1: "New beginnings, planting seeds",
      2: "Cooperation, patience, partnerships",
      3: "Creative expression, social activity",
      4: "Building foundations, hard work",
      5: "Change, freedom, unexpected opportunities",
      6: "Responsibility, home, family focus",
      7: "Introspection, spiritual growth",
      8: "Achievement, material success",
      9: "Completion, letting go, humanitarian service"
    };
    
    return {
      number: personalYear,
      meaning: meanings[personalYear] || "Transformative year energy",
      currentYear
    };
  }
  
  /**
   * Reduce number to single digit (or keep master numbers)
   */
  reduceToMaster(num: number): number {
    const masterNumbers = [11, 22, 33];
    
    while (num > 9 && !masterNumbers.includes(num)) {
      num = String(num).split('').reduce((sum, digit) => sum + parseInt(digit), 0);
    }
    
    return num;
  }
  
  /**
   * Simple reduction to single digit
   */
  reduce(num: number): number {
    while (num > 9) {
      num = String(num).split('').reduce((sum, digit) => sum + parseInt(digit), 0);
    }
    return num;
  }
}

// Export singleton
export const pythagoreanNumerology = new PythagoreanNumerology();
export default pythagoreanNumerology;
