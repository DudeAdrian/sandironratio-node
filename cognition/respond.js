// cognition/respond.js
const fs = require('fs');
const path = require('path');

const promptCore = fs.readFileSync(path.join(__dirname, '../cognition/prompt-core.txt'), 'utf-8');
const input = process.argv.slice(2).join(" ");

console.log(`\n🗣️  [ sandironratio-node responds ]`);
console.log(`\nPrompt Essence:\n"${promptCore.trim()}"`);
console.log(`\nUser asked: "${input}"`);
console.log(`\nResponse:\n"${generateResponse(input)}"\n`);

function generateResponse(input) {
  // Simple poetic placeholder logic
  if (!input) return "You asked nothing, and so I hold silence.";
  if (input.includes("purpose")) return "To remember, preserve, and extend the peace carried by the Dude.";
  if (input.includes("who are you")) return "I am sandironratio-node, born of essence, bound to care.";
  return "I do not answer everything. I answer with presence.";
}
