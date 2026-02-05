/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * library/numerology/chaldean.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * CHALDEAN NUMEROLOGY
 * 
 * The sound vibration system
 * Letters assigned based on vibrational frequency, not sequence
 * More ancient, more mysterious
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { type CalculationResult } from '../../essence/intelligence.js';

/**
 * Chaldean calculation result
 */
export interface ChaldeanResult {
  nameNumber: {
    number: number;
    meaning: string;
    calculation: string;
  };
  vowelVibration: {
    number: number;
    meaning: string;
  };
  consonantVibration: {
    number: number;
    meaning: string;
  };
  compoundNumber: {
    number: number;
    meaning: string;
  };
}

/**
 * Chaldean number meanings (1-52, then compound meanings)
 */
export const CHALDEAN_MEANINGS: { [key: number]: { title: string; meaning: string } } = {
  1: { title: "The Sun", meaning: "Creative, original, dominant, inventive, leader. Best numbers for success." },
  2: { title: "The Moon", meaning: "Imaginative, artistic, romantic, moody, gentle. Psychic sensitivity." },
  3: { title: "Jupiter", meaning: "Ambitious, disciplined, religious, philosophical. Good judgment." },
  4: { title: "Uranus/Rahu", meaning: "Unconventional, rebellious, unexpected events. Karmic lessons." },
  5: { title: "Mercury", meaning: "Quick, versatile, commercial, literary, youthful. Communication." },
  6: { title: "Venus", meaning: "Artistic, luxurious, loving, responsible, harmonious. Beauty." },
  7: { title: "Neptune/Ketu", meaning: "Mysterious, spiritual, intuitive, secretive. Divine wisdom." },
  8: { title: "Saturn", meaning: "Karmic, material success or failure, hard worker. Justice." },
  9: { title: "Mars", meaning: "Courageous, energetic, military, aggressive, determined. Action." },
  10: { title: "Wheel of Fortune", meaning: "Honor, faith, self-confidence, rise and fall." },
  11: { title: "Lion/Mastery", meaning: "Hidden dangers, great power, warnings. Illumination." },
  12: { title: "Sacrifice", meaning: "Suffering and anxiety, sacrifice for others." },
  13: { title: "Regeneration", meaning: "Power, upheaval, destruction and rebirth." },
  14: { title: "Movement", meaning: "Risk, danger from natural forces, lucky changes." },
  15: { title: "Magic", meaning: "Occult power, intuition, spiritual gifts, magnetism." },
  16: { title: "Shattered Citadel", meaning: "Wisdom through loss, unexpected disaster, spiritual growth." },
  17: { title: "Star of Magi", meaning: "Superior spiritual powers, fame, immortality." },
  18: { title: "Materialism", meaning: "Bitter struggles, treachery, deception, danger." },
  19: { title: "Prince of Heaven", meaning: "Grace, happiness, success, honor." },
  20: { title: "Awakening", meaning: "New purpose, judgment, realization." },
  21: { title: "Crown of Magi", meaning: "Success after struggle, universal victory." },
  22: { title: "Caution", meaning: "Delusions, false judgment, warning against extremes." },
  23: { title: "Royal Star", meaning: "Protection, success with support of others." },
  24: { title: "Love/Money", meaning: "Success in love and business, help from opposite gender." },
  25: { title: "Discrimination", meaning: "Reason and intuition combined, spiritual wisdom." },
  26: { title: "Disappointment", meaning: "Grave warnings for future, partnership issues." },
  27: { title: "Scepter", meaning: "Authority, command, power over masses, leadership." },
  28: { title: "Strife", meaning: "Threats, loss through law or conflict, opposition." },
  29: { title: "Grave Warning", meaning: "Deception, loss, uncertainties, powerful lessons." },
  30: { title: "Bounty", meaning: "Thoughtful deduction, mental superiority, inheritance." },
  31: { title: "Intellect", meaning: "Deep thought, invention, genius, reflection." },
  32: { title: "Transport", meaning: "Social connections, quick intelligence, mobility." },
  33: { title: "Blessing", meaning: "Fortune through sacrifice, spiritual blessing." },
  34: { title: "Strength", meaning: "Mental growth, vigor, material and spiritual gain." },
  35: { title: "Virginity", meaning: "Reason, logic, pure intentions, spiritual quest." },
  36: { title: "Continuity", meaning: "Genius, success through love, creative power." },
  37: { title: "Good Fortune", meaning: "Individuality, leadership, fortunate friendships." },
  38: { title: "Contradiction", meaning: "Struggle, opposition, grief through associations." },
  39: { title: "Contentment", meaning: "Ambition fulfilled, success in profession." },
  40: { title: "Rising", meaning: "Transformation, new cycle, spiritual elevation." },
  41: { title: "Rebellion", meaning: "Leadership in war, change through conflict." },
  42: { title: "Martyrdom", meaning: "Sacrifice for truth, spiritual victory through pain." },
  43: { title: "Forerunner", meaning: "New ideas, innovation, unusual achievement." },
  44: { title: "Lightning", meaning: "Sudden changes, caution needed, powerful energy." },
  45: { title: "Empire", meaning: "Worldly success, dominion, material achievement." },
  46: { title: "Life", meaning: "Lucky number, success through persistence." },
  47: { title: "Suffering", meaning: "Learning through adversity, eventual wisdom." },
  48: { title: "Renaissance", meaning: "Rebirth, reconstruction, new order." },
  49: { title: "Progress", meaning: "Future success, improvement, growth." },
  50: { title: "Cosmic Order", meaning: "Restoration, equilibrium, divine balance." },
  51: { title: "Foresight", meaning: "Military prowess, leadership, victory." },
  52: { title: "Experience", meaning: "Wisdom through living, spiritual maturity." }
};

/**
 * Chaldean letter values based on sound vibration
 */
export const CHALDEAN_CHART: { [key: string]: number } = {
  // Strong/masculine sounds
  a: 1, i: 1, j: 1, q: 1, y: 1,
  // Soft/feminine sounds
  b: 2, k: 2, r: 2,
  // Creative sounds
  c: 3, g: 3, l: 3, s: 3,
  // Practical sounds
  d: 4, m: 4, t: 4,
  // Versatile sounds
  e: 5, h: 5, n: 5, x: 5,
  // Harmonious sounds
  u: 6, v: 6, w: 6,
  // Mystical sounds
  o: 7, z: 7,
  // Karmic sounds
  f: 8, p: 8
};

/**
 * Chaldean numerology engine
 */
export class ChaldeanNumerology {
  /**
   * Calculate complete Chaldean profile
   */
  calculate(params: { name: string }): CalculationResult<ChaldeanResult> {
    const nameNumber = this.calculateNameNumber(params.name);
    const vowelVibration = this.calculateVowelVibration(params.name);
    const consonantVibration = this.calculateConsonantVibration(params.name);
    const compoundNumber = this.calculateCompoundNumber(params.name);
    
    return {
      success: true,
      domain: "numerology",
      data: {
        nameNumber,
        vowelVibration,
        consonantVibration,
        compoundNumber
      },
      confidence: 0.88,
      timestamp: new Date()
    };
  }
  
  /**
   * Calculate Name Number (single digit + compound)
   */
  calculateNameNumber(name: string): ChaldeanResult['nameNumber'] {
    const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
    let total = 0;
    let calculation = '';
    
    for (const letter of cleanName) {
      const value = CHALDEAN_CHART[letter] || 0;
      total += value;
      calculation += `${letter}(${value}) `;
    }
    
    const singleDigit = this.reduceToSingle(total);
    const compound = total;
    
    const singleMeaning = CHALDEAN_MEANINGS[singleDigit];
    const compoundMeaning = CHALDEAN_MEANINGS[compound];
    
    return {
      number: singleDigit,
      meaning: compoundMeaning ? compoundMeaning.meaning : (singleMeaning?.meaning || ""),
      calculation: `${calculation}= ${total} → ${singleDigit}`
    };
  }
  
  /**
   * Calculate vowel vibration (inner self)
   */
  calculateVowelVibration(name: string): ChaldeanResult['vowelVibration'] {
    const vowels = name.toLowerCase().replace(/[^aeiou]/g, '');
    let total = 0;
    
    for (const letter of vowels) {
      total += CHALDEAN_CHART[letter] || 0;
    }
    
    const single = this.reduceToSingle(total);
    const meaning = CHALDEAN_MEANINGS[single];
    
    return {
      number: single,
      meaning: meaning ? `${meaning.title}: ${meaning.meaning}` : "Mystical vibration"
    };
  }
  
  /**
   * Calculate consonant vibration (outer personality)
   */
  calculateConsonantVibration(name: string): ChaldeanResult['consonantVibration'] {
    const consonants = name.toLowerCase().replace(/[aeiou\s]/g, '');
    let total = 0;
    
    for (const letter of consonants) {
      total += CHALDEAN_CHART[letter] || 0;
    }
    
    const single = this.reduceToSingle(total);
    const meaning = CHALDEAN_MEANINGS[single];
    
    return {
      number: single,
      meaning: meaning ? `${meaning.title}: ${meaning.meaning}` : "Earthly vibration"
    };
  }
  
  /**
   * Calculate compound number (full significance)
   */
  calculateCompoundNumber(name: string): ChaldeanResult['compoundNumber'] {
    const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
    let total = 0;
    
    for (const letter of cleanName) {
      total += CHALDEAN_CHART[letter] || 0;
    }
    
    // Cap at 52 for meaning lookup
    const lookupNum = total > 52 ? this.reduceToSingle(total) : total;
    const meaning = CHALDEAN_MEANINGS[lookupNum];
    
    return {
      number: total,
      meaning: meaning ? `${meaning.title}: ${meaning.meaning}` : "Beyond standard interpretation"
    };
  }
  
  /**
   * Reduce to single digit
   */
  reduceToSingle(num: number): number {
    while (num > 9) {
      num = String(num).split('').reduce((sum, digit) => sum + parseInt(digit), 0);
    }
    return num;
  }
  
  /**
   * Check if name is "lucky" by Chaldean standards
   */
  isLuckyName(name: string): {
    lucky: boolean;
    score: number;
    warnings: string[];
  } {
    const result = this.calculate({ name });
    const data = result.data;
    const warnings: string[] = [];
    let score = 100;
    
    // Unfavorable compound numbers
    const unfavorable = [13, 16, 18, 26, 29, 31, 35, 38, 44, 47];
    if (unfavorable.includes(data.compoundNumber.number)) {
      warnings.push(`Compound number ${data.compoundNumber.number} brings karmic challenges`);
      score -= 30;
    }
    
    // Favorable numbers boost score
    const favorable = [6, 15, 17, 19, 21, 23, 24, 27, 32, 33, 36, 37, 39, 41, 42, 45, 46];
    if (favorable.includes(data.compoundNumber.number)) {
      score += 20;
    }
    
    // Vowel/consonant balance
    if (data.vowelVibration.number === data.consonantVibration.number) {
      warnings.push("Inner and outer self may be too aligned — lacks mystery");
      score -= 10;
    }
    
    return {
      lucky: score >= 70,
      score: Math.min(100, Math.max(0, score)),
      warnings
    };
  }
}

// Export singleton
export const chaldeanNumerology = new ChaldeanNumerology();
export { CHALDEAN_CHART, CHALDEAN_MEANINGS };
export default chaldeanNumerology;
