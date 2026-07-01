import { Worker } from '@temporalio/worker';
import * as activities from './activities.js';

async function run() {
  const worker = await Worker.create({
    workflowsPath: new URL('./workflows.js', import.meta.url).pathname,
    activities,
    taskQueue: 'intent-execution',
  });

  await worker.run();
}

run().catch((err) => {
  console.error('Worker failed', err);
  process.exit(1);
});
