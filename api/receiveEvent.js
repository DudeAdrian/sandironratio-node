// api/receiveEvent.js
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const input = process.argv[2];

if (!input) {
  console.error('❌ No input provided.');
  process.exit(1);
}

try {
  const event = JSON.parse(input);

  // Log to pulse
  const pulsePath = path.join(__dirname, '..', 'lifecycle', 'pulse.log');
  fs.appendFileSync(pulsePath, `[${new Date().toISOString()}] Event: ${input}\n`);

  // Respond using cognition
  if (event.type === 'question') {
    const response = spawnSync('node', ['cognition/respond.js', event.payload], { encoding: 'utf-8' });
    console.log(response.stdout);
  } else {
    console.log('⚠️ Unknown event type.');
  }
} catch (err) {
  console.error('❌ Error parsing input or running response:', err.message);
}
