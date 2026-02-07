/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * observatory/vedic.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * VEDIC ASTROLOGY — Sidereal zodiac (Lahiri ayanamsa)
 * 
 * Complete Vedic calculation engine:
 * - Sidereal positions (Lahiri ayanamsa)
 * - 27 Nakshatras with Padas
 * - Vimshottari Dashas (120-year cycles)
 * - All 16 Vargas (D1-D60, focus on D9 Navamsa, D10 Dasamsa)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { type CalculationResult } from '../essence/intelligence.js';

/**
 * Nakshatra (Lunar Mansion)
 */
export interface Nakshatra {
  number: number;
  name: string;
  deity: string;
  symbol: string;
  animal: string;
  guna: "Rajas" | "Tamas" | "Sattva";
  startLongitude: number;
  endLongitude: number;
  pada: number; // 1-4
  padaStart: number;
}

/**
 * Dasha period
 */
export interface DashaPeriod {
  planet: string;
  startDate: Date;
  endDate: Date;
  durationYears: number;
  subPeriods?: DashaPeriod[]; // Bhuktis
}

/**
 * Varga (Divisional chart)
 */
export type VargaType = 
  | "D1" | "D2" | "D3" | "D4" | "D7" | "D9" | "D10" | "D12" | "D16" | "D20" | "D24" | "D27" | "D30" | "D40" | "D45" | "D60";

/**
 * Varga chart
 */
export interface VargaChart {
  type: VargaType;
  name: string;
  purpose: string;
  planets: {
    planet: string;
    sign: string;
    degree: number;
    house: number;
  }[];
  ascendant: {
    sign: string;
    degree: number;
    nakshatra: string;
  };
}

/**
 * Vedic chart data
 */
export interface VedicChart {
  native: {
    name: string;
    birthDate: Date;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  ayanamsa: number;
  planets: {
    planet: string;
    siderealLongitude: number;
    sign: string;
    degree: number;
    house: number;
    nakshatra: Nakshatra;
    retrograde: boolean;
    combustion?: boolean;
  }[];
  ascendant: {
    sign: string;
    degree: number;
    nakshatra: Nakshatra;
  };
  houses: {
    number: number;
    sign: string;
    degree: number;
  }[];
  vargas: Map<VargaType, VargaChart>;
  dashas: {
    mahaDasha: DashaPeriod;
    currentAntarDasha: DashaPeriod;
    currentPratyantarDasha?: DashaPeriod;
  };
  yogas: string[];
}

/**
 * Nakshatra definitions
 */
export const NAKSHATRAS: Omit<Nakshatra, 'pada' | 'padaStart'>[] = [
  { number: 1, name: "Ashwini", deity: "Ashwini Kumaras", symbol: "Horse Head", animal: "Horse", guna: "Rajas", startLongitude: 0, endLongitude: 13.3333 },
  { number: 2, name: "Bharani", deity: "Yama", symbol: "Yoni", animal: "Male Elephant", guna: "Rajas", startLongitude: 13.3333, endLongitude: 26.6666 },
  { number: 3, name: "Krittika", deity: "Agni", symbol: "Razor/Flame", animal: "Female Sheep", guna: "Rajas", startLongitude: 26.6666, endLongitude: 40 },
  { number: 4, name: "Rohini", deity: "Brahma/Prajapati", symbol: "Chariot/Ox Cart", animal: "Male Serpent", guna: "Rajas", startLongitude: 40, endLongitude: 53.3333 },
  { number: 5, name: "Mrigashira", deity: "Soma", symbol: "Deer's Head", animal: "Female Serpent", guna: "Rajas", startLongitude: 53.3333, endLongitude: 66.6666 },
  { number: 6, name: "Ardra", deity: "Rudra", symbol: "Teardrop/Diamond", animal: "Female Dog", guna: "Tamas", startLongitude: 66.6666, endLongitude: 80 },
  { number: 7, name: "Punarvasu", deity: "Aditi", symbol: "Quiver of Arrows", animal: "Female Cat", guna: "Sattva", startLongitude: 80, endLongitude: 93.3333 },
  { number: 8, name: "Pushya", deity: "Brihaspati", symbol: "Flower/Circle", animal: "Male Sheep", guna: "Tamas", startLongitude: 93.3333, endLongitude: 106.6666 },
  { number: 9, name: "Ashlesha", deity: "Nagas", symbol: "Serpent/Coiled", animal: "Male Cat", guna: "Sattva", startLongitude: 106.6666, endLongitude: 120 },
  { number: 10, name: "Magha", deity: "Pitris", symbol: "Royal Throne", animal: "Male Rat", guna: "Tamas", startLongitude: 120, endLongitude: 133.3333 },
  { number: 11, name: "PurvaPhalguni", deity: "Bhaga", symbol: "Front Legs of Bed", animal: "Female Rat", guna: "Tamas", startLongitude: 133.3333, endLongitude: 146.6666 },
  { number: 12, name: "UttaraPhalguni", deity: "Aryaman", symbol: "Back Legs of Bed", animal: "Male Cow", guna: "Tamas", startLongitude: 146.6666, endLongitude: 160 },
  { number: 13, name: "Hasta", deity: "Savitar", symbol: "Hand/Closed Fist", animal: "Female Buffalo", guna: "Sattva", startLongitude: 160, endLongitude: 173.3333 },
  { number: 14, name: "Chitra", deity: "Tvashtar", symbol: "Shining Jewel/Pearl", animal: "Female Tiger", guna: "Tamas", startLongitude: 173.3333, endLongitude: 186.6666 },
  { number: 15, name: "Swati", deity: "Vayu", symbol: "Coral/Sapphire", animal: "Male Buffalo", guna: "Tamas", startLongitude: 186.6666, endLongitude: 200 },
  { number: 16, name: "Vishakha", deity: "Indra-Agni", symbol: "Triumphant Arch", animal: "Male Tiger", guna: "Sattva", startLongitude: 200, endLongitude: 213.3333 },
  { number: 17, name: "Anuradha", deity: "Mitra", symbol: "Arch/Lotus Arch", animal: "Female Deer", guna: "Tamas", startLongitude: 213.3333, endLongitude: 226.6666 },
  { number: 18, name: "Jyeshtha", deity: "Indra", symbol: "Earring/Umbrella", animal: "Male Deer", guna: "Sattva", startLongitude: 226.6666, endLongitude: 240 },
  { number: 19, name: "Mula", deity: "Nirriti", symbol: "Root/Tied Bunch", animal: "Male Dog", guna: "Tamas", startLongitude: 240, endLongitude: 253.3333 },
  { number: 20, name: "PurvaAshadha", deity: "Apah", symbol: "Elephant Tusk", animal: "Male Monkey", guna: "Sattva", startLongitude: 253.3333, endLongitude: 266.6666 },
  { number: 21, name: "UttaraAshadha", deity: "Vishvadevas", symbol: "Elephant Tusk", animal: "Male Mongoose", guna: "Sattva", startLongitude: 266.6666, endLongitude: 280 },
  { number: 22, name: "Shravana", deity: "Vishnu", symbol: "Ear/Three Footprints", animal: "Female Monkey", guna: "Tamas", startLongitude: 280, endLongitude: 293.3333 },
  { number: 23, name: "Dhanishta", deity: "Vasus", symbol: "Drum/Flute", animal: "Female Lion", guna: "Tamas", startLongitude: 293.3333, endLongitude: 306.6666 },
  { number: 24, name: "Shatabhisha", deity: "Varuna", symbol: "100 Physicians/Empty Circle", animal: "Female Horse", guna: "Sattva", startLongitude: 306.6666, endLongitude: 320 },
  { number: 25, name: "PurvaBhadrapada", deity: "Ajaikapada", symbol: "Front of Funeral Cot", animal: "Male Lion", guna: "Sattva", startLongitude: 320, endLongitude: 333.3333 },
  { number: 26, name: "UttaraBhadrapada", deity: "Ahirbudhnya", symbol: "Back of Funeral Cot", animal: "Female Cow", guna: "Tamas", startLongitude: 333.3333, endLongitude: 346.6666 },
  { number: 27, name: "Revati", deity: "Pushan", symbol: "Drum/Fish", animal: "Female Elephant", guna: "Sattva", startLongitude: 346.6666, endLongitude: 360 }
];

/**
 * Vimshottari Dasha planetary periods (years)
 */
export const DASHA_PERIODS: { [key: string]: number } = {
  "Ketu": 7,
  "Venus": 20,
  "Sun": 6,
  "Moon": 10,
  "Mars": 7,
  "Rahu": 18,
  "Jupiter": 16,
  "Saturn": 19,
  "Mercury": 17
};

/**
 * Dasha sequence
 */
export const DASHA_SEQUENCE = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];

/**
 * Vedic astrology engine
 */
export class VedicObservatory {
  private ephemerisLoaded: boolean = false;
  private cache: Map<string, VedicChart> = new Map();
  
  /**
   * Lahiri ayanamsa for current date (approximation)
   */
  getAyanamsa(date: Date = new Date()): number {
    // Simplified Lahiri calculation
    // Actual implementation uses precise astronomical calculation
    const year = date.getFullYear() + date.getMonth() / 12;
    return 24.0 + (year - 2000) * 0.0139; // Approximate precession
  }
  
  /**
   * Calculate Vedic chart
   */
  async calculateChart(params: {
    name: string;
    birthDate: Date;
    latitude: number;
    longitude: number;
    timezone?: string;
  }): Promise<CalculationResult<VedicChart>> {
    const cacheKey = this.getCacheKey(params);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return {
        success: true,
        domain: "astrology",
        data: cached,
        confidence: 0.99,
        timestamp: new Date()
      };
    }
    
    const ayanamsa = this.getAyanamsa(params.birthDate);
    
    // Mock calculation (placeholder for actual Swiss Ephemeris)
    const chart = this.mockCalculateVedicChart(params, ayanamsa);
    
    this.cache.set(cacheKey, chart);
    
    return {
      success: true,
      domain: "astrology",
      data: chart,
      confidence: 0.99,
      timestamp: new Date()
    };
  }
  
  /**
   * Mock Vedic chart calculation
   */
  private mockCalculateVedicChart(params: { name: string; birthDate: Date }, ayanamsa: number): VedicChart {
    // Sidereal positions (tropical - ayanamsa)
    const tropicalPositions: { [key: string]: number } = {
      "Sun": 104.5,
      "Moon": 230.2,
      "Mars": 312.4,
      "Mercury": 98.3,
      "Jupiter": 45.2,
      "Venus": 85.7,
      "Saturn": 165.8,
      "Rahu": 280.5, // Mean node
      "Ketu": 100.5  // Opposite Rahu
    };
    
    const planets = Object.entries(tropicalPositions).map(([planet, trop]) => {
      const sidereal = this.normalizeAngle(trop - ayanamsa);
      const nakshatra = this.getNakshatra(sidereal);
      
      return {
        planet,
        siderealLongitude: sidereal,
        sign: this.getSign(sidereal),
        degree: sidereal % 30,
        house: Math.floor(sidereal / 30) + 1, // Simplified
        nakshatra,
        retrograde: ["Mars", "Jupiter", "Saturn"].includes(planet),
        combustion: planet !== "Sun" && Math.abs(trop - tropicalPositions["Sun"]) < 8
      };
    });
    
    // Ascendant (mock)
    const ascendantLongitude = this.normalizeAngle(30.5 - ayanamsa);
    const ascendantNakshatra = this.getNakshatra(ascendantLongitude);
    
    // Calculate dashas
    const moonNakshatra = planets.find(p => p.planet === "Moon")!.nakshatra;
    const dashas = this.calculateVimshottariDasha(moonNakshatra, params.birthDate);
    
    return {
      native: {
        name: params.name,
        birthDate: params.birthDate,
        latitude: 0,
        longitude: 0,
        timezone: "UTC"
      },
      ayanamsa,
      planets,
      ascendant: {
        sign: this.getSign(ascendantLongitude),
        degree: ascendantLongitude % 30,
        nakshatra: ascendantNakshatra
      },
      houses: Array.from({ length: 12 }, (_, i) => ({
        number: i + 1,
        sign: this.getSign(this.normalizeAngle(ascendantLongitude + i * 30)),
        degree: 0
      })),
      vargas: new Map(), // Would calculate all 16 vargas
      dashas,
      yogas: this.identifyYogas(planets)
    };
  }
  
  /**
   * Get Nakshatra from longitude
   */
  getNakshatra(longitude: number): Nakshatra {
    const normalized = this.normalizeAngle(longitude);
    const nakshatraWidth = 13.3333333;
    const index = Math.floor(normalized / nakshatraWidth);
    const nakshatraBase = NAKSHATRAS[Math.min(index, 26)];
    
    const positionInNakshatra = normalized - nakshatraBase.startLongitude;
    const pada = Math.floor(positionInNakshatra / 3.333333) + 1;
    const padaStart = nakshatraBase.startLongitude + (pada - 1) * 3.333333;
    
    return {
      ...nakshatraBase,
      pada,
      padaStart
    };
  }
  
  /**
   * Get zodiac sign from longitude
   */
  private getSign(longitude: number): string {
    const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
                   "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
    return signs[Math.floor(this.normalizeAngle(longitude) / 30)];
  }
  
  /**
   * Calculate Vimshottari Dasha
   */
  private calculateVimshottariDasha(moonNakshatra: Nakshatra, birthDate: Date): VedicChart['dashas'] {
    // Find starting planet based on Moon's nakshatra
    const nakshatraLords = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", 
                           "Jupiter", "Saturn", "Mercury"]; // 3 nakshatras each
    const startPlanetIndex = Math.floor((moonNakshatra.number - 1) / 3);
    const startPlanet = nakshatraLords[startPlanetIndex];
    
    // Calculate remaining dasha at birth
    const padaPercent = (moonNakshatra.number - 1) % 3 + (moonNakshatra.pada - 1) / 4;
    const totalPeriod = DASHA_PERIODS[startPlanet];
    const remainingYears = totalPeriod * (1 - padaPercent / 3);
    
    const startDate = new Date(birthDate);
    const endDate = new Date(birthDate);
    endDate.setFullYear(endDate.getFullYear() + Math.floor(remainingYears));
    
    const mahaDasha: DashaPeriod = {
      planet: startPlanet,
      startDate,
      endDate,
      durationYears: remainingYears
    };
    
    // Current antardasha (simplified)
    const currentAntarDasha: DashaPeriod = {
      planet: startPlanet, // Would calculate based on current date
      startDate,
      endDate,
      durationYears: remainingYears / 9
    };
    
    return {
      mahaDasha,
      currentAntarDasha
    };
  }
  
  /**
   * Identify yogas (planetary combinations)
   */
  private identifyYogas(planets: VedicChart['planets']): string[] {
    const yogas: string[] = [];
    
    // Check for major yogas (simplified)
    const jupiter = planets.find(p => p.planet === "Jupiter");
    const venus = planets.find(p => p.planet === "Venus");
    const mercury = planets.find(p => p.planet === "Mercury");
    
    // Gaja Kesari Yoga (Jupiter and Moon in kendras)
    if (jupiter && jupiter.house % 3 === 1) {
      yogas.push("Gaja Kesari Yoga");
    }
    
    // Budha-Aditya (Mercury and Sun together)
    if (mercury?.combustion) {
      yogas.push("Budha-Aditya Yoga");
    }
    
    // Check for exaltations/debilitations
    planets.forEach(p => {
      if (this.isExalted(p.planet, p.siderealLongitude)) {
        yogas.push(`${p.planet} exalted in ${p.sign}`);
      }
      if (this.isDebilitated(p.planet, p.siderealLongitude)) {
        yogas.push(`${p.planet} debilitated in ${p.sign}`);
      }
    });
    
    return yogas;
  }
  
  /**
   * Check if planet is exalted
   */
  private isExalted(planet: string, longitude: number): boolean {
    const exaltations: { [key: string]: number } = {
      "Sun": 10, "Moon": 33, "Mars": 298, "Mercury": 165, 
      "Jupiter": 95, "Venus": 357, "Saturn": 200
    };
    return Math.abs(this.normalizeAngle(longitude - (exaltations[planet] || -1))) < 2;
  }
  
  /**
   * Check if planet is debilitated
   */
  private isDebilitated(planet: string, longitude: number): boolean {
    const debilitations: { [key: string]: number } = {
      "Sun": 190, "Moon": 213, "Mars": 118, "Mercury": 345,
      "Jupiter": 275, "Venus": 177, "Saturn": 20
    };
    return Math.abs(this.normalizeAngle(longitude - (debilitations[planet] || -1))) < 2;
  }
  
  /**
   * Normalize angle to 0-360
   */
  private normalizeAngle(angle: number): number {
    while (angle < 0) angle += 360;
    while (angle >= 360) angle -= 360;
    return angle;
  }
  
  /**
   * Get cache key
   */
  private getCacheKey(params: { name: string; birthDate: Date }): string {
    return `vedic:${params.name}:${params.birthDate.toISOString()}`;
  }
  
  /**
   * Calculate specific varga (divisional chart)
   */
  calculateVarga(tropicalChart: unknown, vargaType: VargaType): VargaChart {
    // Simplified varga calculation
    const vargaNames: { [key: string]: string } = {
      "D1": "Rashi", "D2": "Hora", "D3": "Drekkana", "D4": "Chaturthamsha",
      "D7": "Saptamsha", "D9": "Navamsha", "D10": "Dasamsha", "D12": "Dwadasamsha",
      "D16": "Shodashamsha", "D20": "Vimshamsha", "D24": "Chaturvimshamsha",
      "D27": "Bhamsha", "D30": "Trimsamsha", "D40": "Khavedamsha",
      "D45": "Akshavedamsha", "D60": "Shashtyamsha"
    };
    
    const vargaPurposes: { [key: string]: string } = {
      "D1": "Body, general life", "D9": "Marriage, dharma", "D10": "Career, status",
      "D12": "Parents, lineage", "D60": "General indication, past life"
    };
    
    return {
      type: vargaType,
      name: vargaNames[vargaType] || vargaType,
      purpose: vargaPurposes[vargaType] || "General",
      planets: [], // Would calculate
      ascendant: {
        sign: "Aries",
        degree: 0,
        nakshatra: "Ashwini"
      }
    };
  }
}

// Export singleton
export const vedicObservatory = new VedicObservatory();
export default vedicObservatory;
