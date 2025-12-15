const fs = require('fs');
const path = require('path');

// Load manifest
const manifestPath = path.join(__dirname, '..', 'manifest.json');
const promptPath = path.join(__dirname, '..', 'cognition', 'prompt-core.txt');

function loadJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading JSON:', err.message);
    return null;
  }
}

function loadPrompt(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.error('Error loading prompt:', err.message);
    return '';
  }
}

// Init
const manifest = loadJSON(manifestPath);
const prompt = loadPrompt(promptPath);

// Display
console.log(`\n🔷 [ sandironratio-node ] booting...\n`);
if (manifest) {
  console.log(`💠 Name: ${manifest.name}`);
  console.log(`🧬 Anchor: ${manifest.anchor}`);
  console.log(`🕰️  Activated: ${manifest.origin_date}`);
  console.log(`🛡️  Permissions: ${Object.keys(manifest.permissions).filter(k => manifest.permissions[k]).join(', ')}`);
}

console.log(`\n📜 Prompt Essence:\n`);
console.log(prompt.substring(0, 300) + '...\n'); // preview only

console.log(`✅ Boot complete — ${new Date().toISOString()}\n`);
