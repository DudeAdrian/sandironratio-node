// cognition/observe.js
const fs = require('fs');
const path = require('path');

const worldPath = path.join(__dirname, 'world.json');

try {
  const content = fs.readFileSync(worldPath, 'utf-8');
  const world = JSON.parse(content);

  console.log(`\n🌍 CURRENT STATE`);
  console.log(`📍 Location: ${world.location}`);
  console.log(`🧘 State: ${world.state}`);
  console.log(`🧭 Known Places: ${world.knownPlaces.join(', ')}`);
  console.log(`🧑‍🤝‍🧑 Visitors: ${world.visitors.length ? world.visitors.join(', ') : 'None'}`);

  const folderName = world.location.toLowerCase().replace(/ /g, '-');
  const placePath = path.join(__dirname, '..', 'world', folderName, 'memory.txt');

  if (fs.existsSync(placePath)) {
    const memory = fs.readFileSync(placePath, 'utf-8');
    console.log(`\n📖 Memory:\n${memory.trim()}`);
  }

} catch (err) {
  console.error('❌ Error reading world state:', err.message);
}
