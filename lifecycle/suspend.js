const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, 'pulse.log');

const log = `⏸️ suspend — ${new Date().toISOString()}\n`;

fs.appendFileSync(logPath, log);

console.log(`\n🌑 sandironratio-node is now in rest mode.\n`);
