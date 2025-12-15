// cognition/move.js
const fs = require('fs');
const path = require('path');

const worldPath = path.join(__dirname, 'world.json');
const destination = process.argv[2];

if (!destination) {
  console.log("🔔 You must provide a destination.\nExample: node cognition/move.js \"The Grove\"");
  process.exit(1);
}

let world;
try {
  const content = fs.readFileSync(worldPath, 'utf-8');
  world = JSON.parse(content);
} catch (e) {
  console.error("❌ Failed to load world state:", e.message);
  process.exit(1);
}

if (!world.knownPlaces.includes(destination)) {
  console.log(`🌫️ Unknown destination: "${destination}" is not in known places.`);
  console.log(`🧭 Known places are: ${world.knownPlaces.join(', ')}`);
  process.exit(1);
}

world.location = destination;
world.state = "arrived";
fs.writeFileSync(worldPath, JSON.stringify(world, null, 2));

console.log(`\n🧘 sandironratio-node has moved to "${destination}".`);
console.log(`🌿 New state: ${world.state}`);

const folderName = destination.toLowerCase().replace(/ /g, '-');
const placePath = path.join(__dirname, '..', 'world', folderName);

// Optional: Read memory.txt
const memoryPath = path.join(placePath, 'memory.txt');
if (fs.existsSync(memoryPath)) {
  const memory = fs.readFileSync(memoryPath, 'utf-8');
  console.log(`\n📖 Memory at ${destination}:\n${memory.trim()}`);
}

// Optional: Run index.js
const indexPath = path.join(placePath, 'index.js');
if (fs.existsSync(indexPath)) {
  console.log(`\n✨ Activating presence...\n`);
  require(indexPath);
}
