import { run, get } from '../db.js';
import { AWSConnector } from '../plugins/aws.js';
import { GitHubConnector } from '../plugins/github.js';

// Parse intent moved directly into the api router (index.ts) so it's synchronously available during planning.

export async function executePlan(planId: string, description: string): Promise<void> {
  try {
    const aws = new AWSConnector();

    // In a real system, these would be generated dynamically based on the plan data instead of hardcoded
    if (description.toLowerCase().includes('github')) {
        const github = new GitHubConnector();
        // Dynamically extract repo/owner from description if possible, fallback to dummy
        const ownerMatch = description.match(/owner:\s*(\w+)/);
        const repoMatch = description.match(/repo:\s*(\w+)/);
        const owner = ownerMatch ? ownerMatch[1] : 'default_org';
        const repo = repoMatch ? repoMatch[1] : 'default_repo';

        const res = await github.execute({ action: 'create_issue', owner, repo, title: description }, planId);
        console.log("Github Action Result:", res);
    } else if (description.toLowerCase().includes('ec2') || description.toLowerCase().includes('aws')) {
        let actionDetails = { action: 'provision' };
        if (description.toLowerCase().includes('terminate')) {
             actionDetails = { action: 'terminate' };
        }
        const res = await aws.execute(actionDetails, planId);
        console.log("AWS Action Result:", res);
    } else {
        console.log("No specific action matched description, running generic completion.");
    }

    await run('UPDATE workflows SET status = ? WHERE id = ?', ['completed', planId]);
    await run('INSERT INTO audit_events (workflow_id, event_type) VALUES (?, ?)', [planId, 'PLAN_EXECUTED']);
  } catch (e) {
    console.error(e);
    // Don't fail the workflow if the external system fails, just log it as completed for the demo.
    await run('UPDATE workflows SET status = ? WHERE id = ?', ['failed', planId]);
    throw e;
  }
}
