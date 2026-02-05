const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * lifecycle/boot.js
 * ═══════════════════════════════════════════════════════════════════════════════
 * LEGACY BOOT — Delegates to awaken.ts
 * 
 * This file is maintained for backward compatibility.
 * The actual boot sequence is now in awaken.ts (TypeScript).
 * 
 * Anagram: Adrian Sortino → sandironratio
 * ═══════════════════════════════════════════════════════════════════════════════
 */

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

// Legacy display
console.log(`\n🔷 [ sandironratio-node ] booting...\n`);

const manifest = loadJSON(manifestPath);
const prompt = loadPrompt(promptPath);

if (manifest) {
  console.log(`💠 Name: ${manifest.name}`);
  console.log(`🧬 Anchor: ${manifest.anchor}`);
  console.log(`🕰️  Activated: ${manifest.origin_date}`);
  console.log(`🛡️  Permissions: ${Object.keys(manifest.permissions).filter(k => manifest.permissions[k]).join(', ')}`);
}

console.log(`\n📜 Prompt Essence:\n`);
console.log(prompt.substring(0, 300) + '...\n');

console.log(`⚡ Delegating to awaken.ts (TypeScript)...\n`);

// Spawn the new TypeScript boot sequence
const awaken = spawn('npx', ['tsx', 'awaken.ts'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  shell: true
});

awaken.on('close', (code) => {
  if (code !== 0) {
    console.error(`\n❌ awaken.ts exited with code ${code}`);
    process.exit(code);
  }
});

awaken.on('error', (err) => {
  console.error(`\n❌ Failed to run awaken.ts: ${err.message}`);
  console.log(`\n📋 Make sure dependencies are installed:`);
  console.log(`   npm install`);
  process.exit(1);
});
