import { get, run } from '../db.js';
import { executePlan } from '../temporal/activities.js';

export async function runFallbackWorker() {
  console.log("Fallback DB worker started");
  while (true) {
    try {
        const workflow: any = await get("SELECT * FROM workflows WHERE status = 'approved' LIMIT 1");
        if (workflow) {
            console.log(`Executing fallback workflow ${workflow.id}`);
            await run("UPDATE workflows SET status = 'executing' WHERE id = ?", [workflow.id]);
            const intent: any = await get("SELECT description FROM intents WHERE id = ?", [workflow.intent_id]);
            if (intent) {
                 await executePlan(workflow.id, intent.description);
            }
        }
    } catch (e) {
        console.error("Fallback worker error", e);
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}
