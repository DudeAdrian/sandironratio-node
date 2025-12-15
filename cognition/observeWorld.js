// cognition/observeWorld.js
const fs = require('fs');
const path = require('path');

const worldPath = path.join(__dirname, 'world.json');
let world = {};

try {
  const raw = fs.readFileSync(worldPath, 'utf-8');
  world = JSON.parse(raw);
} catch (err) {
  console.error("🌐 Error loading world:", err.message);
  process.exit(1);
}

console.log(`\n🌍 [ sandironratio-node observes its world ]`);
console.log(`📍 Location: ${world.location}`);
console.log(`🧘 State: ${world.state}`);
console.log(`🗺️ Known Places: ${world.knownPlaces.join(', ')}`);
console.log(`🧑‍🤝‍🧑 Visitors: ${world.visitors.length === 0 ? 'None' : world.visitors.join(', ')}`);
console.log(`\nThe node feels ${world.state === 'reflecting' ? 'quiet and present' : 'restless or alert'}...`);
