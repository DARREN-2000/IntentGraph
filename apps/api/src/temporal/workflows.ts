import { proxyActivities, sleep, condition, setHandler, defineSignal } from '@temporalio/workflow';
import type * as activities from './activities.js';

const { parseIntent, executePlan } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export const approveSignal = defineSignal<[]>('approve');

export async function intentExecutionWorkflow(intentId: string, description: string): Promise<string> {
  const result = await parseIntent(description);

  let isApproved = false;
  setHandler(approveSignal, () => {
    isApproved = true;
  });

  // Wait for human approval
  await condition(() => isApproved);

  await executePlan(intentId, description);

  return 'completed';
}
