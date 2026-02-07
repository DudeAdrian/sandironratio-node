/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * db/hex-grid.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * HEXAGONAL GRID UTILITIES — Fibonacci Spiral & Concentric Rings
 * 
 * 144,000 chambers per Hive in hexagonal close packing
 * 6 neighbors per chamber (N, NE, SE, S, SW, NW)
 * Chamber addressing: [hive_id]:[life_path].[lat_hash].[lon_hash]
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { createHash } from 'crypto';

export interface HexCoord {
  q: number; // axial coordinate (column)
  r: number; // axial coordinate (row)
}

export interface ChamberAddress {
  hiveId: number;
  lifePath: number;
  latHash: string;
  lonHash: string;
  fullAddress: string;
}

export interface NeighborChambers {
  n: HexCoord;
  ne: HexCoord;
  se: HexCoord;
  s: HexCoord;
  sw: HexCoord;
  nw: HexCoord;
}

// Fibonacci numbers for ring capacities
const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946];

// Golden ratio
const PHI = (1 + Math.sqrt(5)) / 2;

/**
 * Hexagonal Grid Calculator
 */
export class HexGrid {
  private ringCapacities: number[] = [];
  private totalRings: number = 0;
  
  constructor(totalChambers: number = 144000) {
    this.calculateRingDistribution(totalChambers);
  }
  
  /**
   * Calculate ring distribution using Fibonacci sequence
   * Ring 0 (center): 1 chamber
   * Ring 1: 6 chambers
   * Ring 2: 12 chambers
   * Ring 3: 18 chambers
   * ... scaling by Fibonacci
   */
  private calculateRingDistribution(totalChambers: number): void {
    let remaining = totalChambers;
    let ring = 0;
    
    // Center chamber
    this.ringCapacities.push(1);
    remaining--;
    ring++;
    
    // Concentric rings (6 * ring chambers per ring, scaled by Fibonacci)
    while (remaining > 0 && ring < FIBONACCI.length) {
      const ringSize = Math.min(6 * ring * FIBONACCI[ring], remaining);
      this.ringCapacities.push(ringSize);
      remaining -= ringSize;
      ring++;
    }
    
    this.totalRings = ring;
    console.log(`[HEX-GRID] ${this.totalRings} rings, ${this.ringCapacities.reduce((a, b) => a + b, 0)} chambers`);
  }
  
  /**
   * Generate chamber address from coordinates and hive
   */
  static generateAddress(hiveId: number, lifePath: number, lat: number, lon: number): ChamberAddress {
    // Hash geographic coordinates for unique chamber identification
    const latStr = lat.toFixed(6);
    const lonStr = lon.toFixed(6);
    
    const latHash = createHash('sha256')
      .update(latStr)
      .digest('hex')
      .slice(0, 8);
    
    const lonHash = createHash('sha256')
      .update(lonStr)
      .digest('hex')
      .slice(0, 8);
    
    const fullAddress = `${hiveId}:${lifePath}.${latHash}.${lonHash}`;
    
    return {
      hiveId,
      lifePath,
      latHash,
      lonHash,
      fullAddress
    };
  }
  
  /**
   * Parse chamber address
   */
  static parseAddress(address: string): ChamberAddress | null {
    const match = address.match(/^(\d+):(\d+)\.([a-f0-9]{8})\.([a-f0-9]{8})$/);
    if (!match) return null;
    
    return {
      hiveId: parseInt(match[1]),
      lifePath: parseInt(match[2]),
      latHash: match[3],
      lonHash: match[4],
      fullAddress: address
    };
  }
  
  /**
   * Get hex coordinates from index using Fibonacci spiral
   */
  indexToHex(index: number): HexCoord {
    if (index === 0) return { q: 0, r: 0 }; // Center
    
    // Find which ring this index belongs to
    let ring = 0;
    let ringStart = 0;
    
    for (let i = 0; i < this.ringCapacities.length; i++) {
      if (index < ringStart + this.ringCapacities[i]) {
        ring = i;
        break;
      }
      ringStart += this.ringCapacities[i];
    }
    
    // Position within ring (0 to ringSize-1)
    const positionInRing = index - ringStart;
    const ringSize = this.ringCapacities[ring];
    
    // Golden angle for Fibonacci spiral (137.5 degrees)
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const angle = positionInRing * goldenAngle;
    
    // Radius scales with ring number
    const radius = ring * Math.sqrt(PHI);
    
    // Convert polar to axial hex coordinates
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    
    // Convert cartesian to axial hex
    return this.cartesianToHex(x, y);
  }
  
  /**
   * Get index from hex coordinates
   */
  hexToIndex(coord: HexCoord): number {
    // This is approximate - exact reverse is complex
    const ring = Math.max(Math.abs(coord.q), Math.abs(coord.r), Math.abs(coord.q + coord.r));
    
    if (ring === 0) return 0;
    
    // Sum of all previous rings
    let index = this.ringCapacities.slice(0, ring).reduce((a, b) => a + b, 0);
    
    // Position within ring (approximate)
    const angle = Math.atan2(coord.r, coord.q);
    const ringSize = this.ringCapacities[ring];
    const positionInRing = Math.floor(((angle + Math.PI) / (2 * Math.PI)) * ringSize);
    
    return index + positionInRing;
  }
  
  /**
   * Get the 6 neighboring hex coordinates
   */
  getNeighbors(coord: HexCoord): NeighborChambers {
    // Hexagonal neighbor offsets in axial coordinates
    return {
      n:  { q: coord.q,     r: coord.r - 1 },
      ne: { q: coord.q + 1, r: coord.r - 1 },
      se: { q: coord.q + 1, r: coord.r },
      s:  { q: coord.q,     r: coord.r + 1 },
      sw: { q: coord.q - 1, r: coord.r + 1 },
      nw: { q: coord.q - 1, r: coord.r }
    };
  }
  
  /**
   * Convert cartesian coordinates to axial hex
   */
  private cartesianToHex(x: number, y: number): HexCoord {
    const q = (Math.sqrt(3) / 3 * x - 1.0 / 3 * y);
    const r = (2.0 / 3 * y);
    return this.hexRound({ q, r });
  }
  
  /**
   * Round fractional hex coordinates to nearest hex
   */
  private hexRound(hex: HexCoord): HexCoord {
    let q = Math.round(hex.q);
    let r = Math.round(hex.r);
    const s = Math.round(-hex.q - hex.r);
    
    const qDiff = Math.abs(q - hex.q);
    const rDiff = Math.abs(r - hex.r);
    const sDiff = Math.abs(s - (-hex.q - hex.r));
    
    if (qDiff > rDiff && qDiff > sDiff) {
      q = -r - s;
    } else if (rDiff > sDiff) {
      r = -q - s;
    }
    
    return { q, r };
  }
  
  /**
   * Calculate distance between two hex coordinates
   */
  static hexDistance(a: HexCoord, b: HexCoord): number {
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
  }
  
  /**
   * Get all hex coordinates in a ring
   */
  getRing(ring: number): HexCoord[] {
    if (ring === 0) return [{ q: 0, r: 0 }];
    
    const coords: HexCoord[] = [];
    const hex = { q: 0, r: -ring };
    
    // Walk around the ring in 6 directions
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < ring; j++) {
        coords.push({ ...hex });
        
        // Move in current direction
        switch (i) {
          case 0: hex.r += 1; break; // SE
          case 1: hex.q += 1; break; // E
          case 2: hex.q += 1; hex.r -= 1; break; // NE
          case 3: hex.r -= 1; break; // NW
          case 4: hex.q -= 1; break; // W
          case 5: hex.q -= 1; hex.r += 1; break; // SW
        }
      }
    }
    
    return coords;
  }
  
  /**
   * Get all hex coordinates within a radius
   */
  getHexesWithinRadius(center: HexCoord, radius: number): HexCoord[] {
    const results: HexCoord[] = [];
    
    for (let q = -radius; q <= radius; q++) {
      for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
        results.push({ q: center.q + q, r: center.r + r });
      }
    }
    
    return results;
  }
  
  /**
   * Calculate wall alignment between two chambers
   * Returns percentage of matching walls (0-100)
   */
  static calculateWallAlignment(walls1: string, walls2: string, direction: keyof NeighborChambers): number {
    if (walls1.length !== 6 || walls2.length !== 6) return 0;
    
    // Opposite wall mapping
    const opposites: Record<keyof NeighborChambers, number> = {
      n: 3,  // n <-> s
      ne: 4, // ne <-> sw
      se: 5, // se <-> nw
      s: 0,  // s <-> n
      sw: 1, // sw <-> ne
      nw: 2  // nw <-> se
    };
    
    const wall1 = walls1[opposites[direction]];
    const wall2 = walls2[direction as keyof NeighborChambers] === undefined 
      ? walls2[opposites[direction]] 
      : walls2[direction as keyof NeighborChambers];
    
    // Return 100 if both walls are open (1), 0 if either is closed
    return (wall1 === '1' && wall2 === '1') ? 100 : 0;
  }
  
  /**
   * Get total chambers
   */
  getTotalChambers(): number {
    return this.ringCapacities.reduce((a, b) => a + b, 0);
  }
  
  /**
   * Get ring count
   */
  getRingCount(): number {
    return this.totalRings;
  }
  
  /**
   * Get ring capacity
   */
  getRingCapacity(ring: number): number {
    return this.ringCapacities[ring] || 0;
  }
  
  /**
   * Generate visual hex grid representation
   */
  visualizeHexGrid(radius: number = 3): string {
    const lines: string[] = [];
    
    for (let r = -radius; r <= radius; r++) {
      let line = '';
      
      // Add leading spaces for hex alignment
      line += ' '.repeat(Math.abs(r));
      
      for (let q = -radius; q <= radius; q++) {
        const coord = { q, r };
        const distance = HexGrid.hexDistance({ q: 0, r: 0 }, coord);
        
        if (distance <= radius) {
          line += `(${q},${r}) `;
        } else {
          line += '      ';
        }
      }
      
      lines.push(line);
    }
    
    return lines.join('\n');
  }
}

/**
 * Calculate optimal chamber assignment based on geographic coordinates
 */
export function assignChamberByGeography(
  hiveId: number, 
  lifePath: number, 
  lat: number, 
  lon: number,
  grid: HexGrid
): { address: string; hex: HexCoord; index: number } {
  // Generate address
  const address = HexGrid.generateAddress(hiveId, lifePath, lat, lon);
  
  // Use coordinates to determine position in hex grid
  // Normalize coordinates to grid space
  const normalizedLat = (lat + 90) / 180; // 0 to 1
  const normalizedLon = (lon + 180) / 360; // 0 to 1
  
  // Map to hex grid index
  const totalChambers = grid.getTotalChambers();
  const index = Math.floor(normalizedLat * normalizedLon * totalChambers);
  
  // Get hex coordinates
  const hex = grid.indexToHex(index);
  
  return {
    address: address.fullAddress,
    hex,
    index
  };
}

// Export singleton with 144k chambers
export const hexGrid = new HexGrid(144000);
export default hexGrid;
