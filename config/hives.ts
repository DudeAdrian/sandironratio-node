/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * config/hives.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * 10-HIVE GEOGRAPHIC CONSENSUS NETWORK
 * 
 * Genesis (Hive 1): Australia — activated
 * Hives 2-10: Dormant until migration threshold (143,000)
 * Each Hive: 144,000 chambers in hexagonal close packing
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export interface HiveConfig {
  id: number;
  name: string;
  region: string;
  lat: number;
  lon: number;
  status: 'active' | 'dormant' | 'migrating';
  capacity: number;
  current: number;
  genesisBlock?: string;
  validatorSet: string[];
}

export const HIVES: HiveConfig[] = [
  {
    id: 1,
    name: "Genesis",
    region: "Australia",
    lat: -25.2744,
    lon: 133.7751,
    status: 'active',
    capacity: 144000,
    current: 0,
    genesisBlock: "0x0000000000000000000000000000000000000000000000000000000000000001",
    validatorSet: [
      "0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f", // sandironratio-node
    ]
  },
  {
    id: 2,
    name: "Pacific",
    region: "NZ/Fiji",
    lat: -17.7134,
    lon: 178.0650,
    status: 'dormant',
    capacity: 144000,
    current: 0,
    validatorSet: []
  },
  {
    id: 3,
    name: "Asia",
    region: "Singapore",
    lat: 1.3521,
    lon: 103.8198,
    status: 'dormant',
    capacity: 144000,
    current: 0,
    validatorSet: []
  },
  {
    id: 4,
    name: "Europe",
    region: "Amsterdam",
    lat: 52.3676,
    lon: 4.9041,
    status: 'dormant',
    capacity: 144000,
    current: 0,
    validatorSet: []
  },
  {
    id: 5,
    name: "Africa",
    region: "Nairobi",
    lat: -1.2921,
    lon: 36.8219,
    status: 'dormant',
    capacity: 144000,
    current: 0,
    validatorSet: []
  },
  {
    id: 6,
    name: "NorthAmerica",
    region: "Vancouver",
    lat: 49.2827,
    lon: -123.1207,
    status: 'dormant',
    capacity: 144000,
    current: 0,
    validatorSet: []
  },
  {
    id: 7,
    name: "SouthAmerica",
    region: "Chile",
    lat: -35.6751,
    lon: -71.5430,
    status: 'dormant',
    capacity: 144000,
    current: 0,
    validatorSet: []
  },
  {
    id: 8,
    name: "MiddleEast",
    region: "Dubai",
    lat: 25.2048,
    lon: 55.2708,
    status: 'dormant',
    capacity: 144000,
    current: 0,
    validatorSet: []
  },
  {
    id: 9,
    name: "Arctic",
    region: "Iceland",
    lat: 64.9631,
    lon: -19.0208,
    status: 'dormant',
    capacity: 144000,
    current: 0,
    validatorSet: []
  },
  {
    id: 10,
    name: "Atlantic",
    region: "Bermuda",
    lat: 32.3078,
    lon: -64.7505,
    status: 'dormant',
    capacity: 144000,
    current: 0,
    validatorSet: []
  }
];

export const MIGRATION_THRESHOLD = 143000;
export const CHAMBERS_PER_HIVE = 144000;
export const CONSENSUS_THRESHOLD = 0.66; // 66% neighbor alignment
export const FIBONACCI_THRESHOLD = 89 / 144; // ~61.8% for ring alignment

/**
 * Get active hives
 */
export function getActiveHives(): HiveConfig[] {
  return HIVES.filter(h => h.status === 'active');
}

/**
 * Get hive by ID
 */
export function getHive(id: number): HiveConfig | undefined {
  return HIVES.find(h => h.id === id);
}

/**
 * Find nearest hive to geographic coordinates
 */
export function findNearestHive(lat: number, lon: number): HiveConfig {
  let nearest = HIVES[0];
  let minDistance = Infinity;
  
  for (const hive of HIVES) {
    if (hive.status === 'dormant') continue;
    
    const distance = haversineDistance(lat, lon, hive.lat, hive.lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = hive;
    }
  }
  
  return nearest;
}

/**
 * Calculate Haversine distance between two points (km)
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Check if migration should trigger
 */
export function shouldMigrate(hiveId: number = 1): boolean {
  const hive = getHive(hiveId);
  return hive ? hive.current >= MIGRATION_THRESHOLD : false;
}

/**
 * Activate dormant hives (The Great Migration trigger)
 */
export function activateDormantHives(): void {
  for (const hive of HIVES) {
    if (hive.status === 'dormant') {
      hive.status = 'active';
      console.log(`🌍 Hive ${hive.id} (${hive.name}) activated`);
    }
  }
}

/**
 * Get total agents across all hives
 */
export function getTotalAgents(): number {
  return HIVES.reduce((sum, h) => sum + h.current, 0);
}

/**
 * Get hive status summary
 */
export function getHiveStatusSummary() {
  return HIVES.map(h => ({
    id: h.id,
    name: h.name,
    region: h.region,
    status: h.status,
    capacity: h.capacity,
    current: h.current,
    utilization: (h.current / h.capacity * 100).toFixed(2) + '%'
  }));
}
