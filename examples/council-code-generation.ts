/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * examples/council-code-generation.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 * EXAMPLE: Request Code Generation from the Council
 * 
 * Complete workflow demonstration:
 * 1. User makes a request
 * 2. SOFIE processes through operators
 * 3. Council convenes and deliberates
 * 4. Proposal generated
 * 5. User authorizes
 * 6. Code is built and deployed
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import sofie from '../essence/sofie.js';
import { councilClient } from '../bridge/council-client.js';
import { sofieLlamaClient } from '../bridge/sofie-llama-client.js';

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║              COUNCIL CODE GENERATION EXAMPLE                                  ║
║              From Request → Deliberation → Code                               ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
  `);
  
  try {
    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1: Check all services are running
    // ═══════════════════════════════════════════════════════════════════════════
    console.log(`\n🔍 STEP 1: Checking service health...\n`);
    
    const councilHealthy = await councilClient.checkHealth();
    const sofieHealthy = await sofieLlamaClient.checkHealth();
    
    if (!councilHealthy) {
      throw new Error('Council not available. Run: start-sovereign-lab.ps1');
    }
    
    if (!sofieHealthy) {
      console.warn('⚠️  Sofie-LLaMA not available. Continuing with council only...');
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2: Awaken SOFIE
    // ═══════════════════════════════════════════════════════════════════════════
    console.log(`\n🌟 STEP 2: Awakening SOFIE...\n`);
    
    await sofie.awaken();
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 3: User request (simulated)
    // ═══════════════════════════════════════════════════════════════════════════
    console.log(`\n💬 STEP 3: User request received...\n`);
    
    const userRequest = `I need to create a new API endpoint for calculating Life Path numbers.
    
Requirements:
- Endpoint: POST /api/numerology/life-path
- Input: { name: string, birthDate: string }
- Output: { lifePath: number, description: string, beeRole: string }
- Integrate with existing numerology library
- Add bee role assignment based on Life Path (Scout/Worker/Nurse/Guard)
- Include wellness validation from Aura
    `;
    
    console.log(`   User: "${userRequest.split('\n')[0]}..."\n`);
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 4: SOFIE processes request (if available)
    // ═══════════════════════════════════════════════════════════════════════════
    if (sofieHealthy) {
      console.log(`\n💫 STEP 4: SOFIE processing request through operators...\n`);
      
      const sofieResponse = await sofieLlamaClient.speak(userRequest, {
        chamber: 3, // Portrait Gallery (Reverse Engineering)
        includeAstroContext: false
      });
      
      console.log(`   SOFIE: "${sofieResponse.message.substring(0, 150)}..."`);
      console.log(`   Operators: ${sofieResponse.operators_engaged.join(' → ')}`);
      console.log(`   Love check: ${sofieResponse.love_check ? '✅' : '⚠️'}\n`);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 5: Convene the Council
    // ═══════════════════════════════════════════════════════════════════════════
    console.log(`\n🏛️  STEP 5: Convening the Council...\n`);
    
    const briefing = {
      command: 'convene' as const,
      timestamp: new Date().toISOString(),
      chief_architect_present: true,
      ecosystem_state: {
        active_repos: ['sandironratio-node'],
        recent_changes: [],
        blocked_tasks: []
      },
      sofie_requirements: [
        "Create POST /api/numerology/life-path endpoint",
        "Calculate Life Path number from birth date",
        "Assign bee role (Scout/Worker/Nurse/Guard) based on Life Path",
        "Return: { lifePath, description, beeRole }",
        "Integrate with library/numerology/pythagorean.ts",
        "Add route to server.ts"
      ],
      critical_path: [
        "Endpoint must follow existing API pattern",
        "Wellness validation required (Aura approval)",
        "Add error handling for invalid dates"
      ],
      protected_notice: 'sofie-llama-backend is sovereign territory - council builds external interfaces only'
    };
    
    const convening = await councilClient.convene(briefing);
    
    console.log(`   ✅ Council convened`);
    console.log(`   Chair: ${convening.chair}`);
    console.log(`   Agents: ${convening.agents.join(', ')}`);
    console.log(`   Protection: ${convening.sovereign_protection}\n`);
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 6: Wait for deliberation and proposal
    // ═══════════════════════════════════════════════════════════════════════════
    console.log(`\n⏳ STEP 6: Council deliberating...\n`);
    console.log(`   This may take a few moments while agents:`);
    console.log(`   • Review requirements`);
    console.log(`   • Propose task assignments`);
    console.log(`   • Optimize distribution`);
    console.log(`   • Generate timeline\n`);
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const status = await councilClient.getStatus();
    
    if (!status.proposal) {
      console.log(`   ⚠️  Council is still deliberating. Check status later.`);
      console.log(`   Run: councilClient.getStatus()\n`);
      return;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 7: Display proposal
    // ═══════════════════════════════════════════════════════════════════════════
    console.log(`\n📋 STEP 7: Proposal received!\n`);
    console.log(`   Proposal ID: ${status.proposal.proposal_id}`);
    console.log(`   Timeline: ${status.proposal.timeline.total_hours_estimated} hours`);
    console.log(`   Parallel execution: ${status.proposal.timeline.parallel_execution ? 'Yes' : 'No'}`);
    console.log(`   Completion: ${new Date(status.proposal.timeline.completion_date).toLocaleString()}\n`);
    
    console.log(`   Wellness Check:`);
    console.log(`   • Aura approved: ${status.proposal.wellness_check.aura_approved ? '✅' : '❌'}`);
    if (status.proposal.wellness_check.concerns.length > 0) {
      status.proposal.wellness_check.concerns.forEach(concern => {
        console.log(`   • Concern: ${concern}`);
      });
    }
    console.log(``);
    
    console.log(`   Task Assignments:\n`);
    for (const assignment of status.proposal.task_assignments) {
      console.log(`   🤖 ${assignment.agent_name.toUpperCase()}`);
      for (const task of assignment.tasks) {
        console.log(`      • ${task.description}`);
        console.log(`        Repo: ${task.repo}`);
        console.log(`        Estimated: ${task.estimated_hours}h`);
        if (task.files_to_create.length > 0) {
          console.log(`        Create: ${task.files_to_create.join(', ')}`);
        }
        if (task.files_to_modify.length > 0) {
          console.log(`        Modify: ${task.files_to_modify.join(', ')}`);
        }
      }
      console.log(``);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 8: Request authorization
    // ═══════════════════════════════════════════════════════════════════════════
    console.log(`\n🔐 STEP 8: Authorization required\n`);
    console.log(`   To deploy this proposal, run:\n`);
    console.log(`   await councilClient.authorize("${status.proposal.proposal_id}", true);\n`);
    console.log(`   Or in this example, we'll auto-authorize in 5 seconds...\n`);
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 9: Auto-authorize and deploy (for demo purposes)
    // ═══════════════════════════════════════════════════════════════════════════
    console.log(`\n🚀 STEP 9: Deploying code...\n`);
    
    const deployment = await councilClient.authorize(status.proposal.proposal_id, true);
    
    if (deployment.success) {
      console.log(`   ✅ DEPLOYMENT SUCCESSFUL!\n`);
      console.log(`   Files deployed: ${deployment.deployed_files.length}`);
      deployment.deployed_files.forEach(file => {
        console.log(`   • ${file}`);
      });
      console.log(``);
      
      console.log(`   Git commits: ${deployment.git_commits.length}`);
      deployment.git_commits.forEach(commit => {
        console.log(`   • ${commit}`);
      });
      console.log(``);
      
      console.log(`   Hours logged: ${deployment.hours_logged}`);
      console.log(`   NECTAR earned: ${deployment.NECTAR_earned}`);
      console.log(``);
      
      if (deployment.next_steps.length > 0) {
        console.log(`   Next steps:`);
        deployment.next_steps.forEach(step => {
          console.log(`   • ${step}`);
        });
        console.log(``);
      }
    } else {
      console.log(`   ❌ Deployment failed\n`);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 10: Check NECTAR distribution
    // ═══════════════════════════════════════════════════════════════════════════
    console.log(`\n💰 STEP 10: NECTAR ledger updated\n`);
    
    const ledger = await councilClient.getNECTARBalance();
    
    console.log(`   Total NECTAR distributed: ${ledger.total}`);
    console.log(`   Agent balances:`);
    for (const [agent, balance] of Object.entries(ledger.balances || {})) {
      console.log(`   • ${agent}: ${balance} NECTAR`);
    }
    console.log(``);
    
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}\n`);
    console.error(error);
  } finally {
    // ═══════════════════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════════════════
    console.log(`\n🌙 Suspending SOFIE...\n`);
    await sofie.suspend();
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║              EXAMPLE COMPLETE                                                 ║
║              The Council has spoken. The code is built.                       ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
    `);
  }
}

// Run the example
main().catch(console.error);
