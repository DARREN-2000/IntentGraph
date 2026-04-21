#!/usr/bin/env node

import process from 'node:process';
import { createApprovalsService } from '@intentgraph/approvals-service';
import { AuditService } from '@intentgraph/audit-service';
import { createExecutorService, type ExecutionResponse } from '@intentgraph/executor-service';
import { createMemoryService } from '@intentgraph/memory-service';
import {
  createPlannerService,
  type ActionDefinition,
  type PlanningResult,
} from '@intentgraph/planner-service';

interface RuntimeContext {
  planner: ReturnType<typeof createPlannerService>;
  approvals: ReturnType<typeof createApprovalsService>;
  executor: ReturnType<typeof createExecutorService>;
}

interface ParsedInput {
  command: string;
  subcommand?: string;
  flags: Map<string, string | boolean>;
  positionals: string[];
}

interface GlobalOptions {
  json: boolean;
  noColor: boolean;
  userId: string;
  workspaceId: string;
}

interface DoctorCheck {
  name: string;
  status: 'ok' | 'warn' | 'fail';
  details: string;
}

let colorsEnabled = true;

process.stdout.on('error', (error) => {
  if ((error as NodeJS.ErrnoException).code === 'EPIPE') {
    process.exit(0);
  }
});

process.stderr.on('error', (error) => {
  if ((error as NodeJS.ErrnoException).code === 'EPIPE') {
    process.exit(0);
  }
});

function createRuntime(): RuntimeContext {
  const approvals = createApprovalsService();
  const audit = new AuditService();
  const memory = createMemoryService();
  const executor = createExecutorService(approvals, audit, memory);

  return {
    planner: createPlannerService(),
    approvals,
    executor,
  };
}

function parseInput(argv: string[]): ParsedInput {
  const command = argv[0] || 'help';
  let subcommand: string | undefined;
  let fromIndex = 1;

  if (['actions'].includes(command)) {
    subcommand = argv[1];
    fromIndex = 2;
  }

  const flags = new Map<string, string | boolean>();
  const positionals: string[] = [];

  for (let i = fromIndex; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === '-j') {
      flags.set('json', true);
      continue;
    }

    if (token === '-h') {
      flags.set('help', true);
      continue;
    }

    if (token.startsWith('--')) {
      const withoutPrefix = token.slice(2);
      const equalsIndex = withoutPrefix.indexOf('=');

      if (equalsIndex >= 0) {
        const key = withoutPrefix.slice(0, equalsIndex);
        const value = withoutPrefix.slice(equalsIndex + 1);
        flags.set(key, value);
        continue;
      }

      const next = argv[i + 1];
      if (next && !next.startsWith('-')) {
        flags.set(withoutPrefix, next);
        i += 1;
      } else {
        flags.set(withoutPrefix, true);
      }
      continue;
    }

    positionals.push(token);
  }

  return {
    command,
    subcommand,
    flags,
    positionals,
  };
}

function getFlagBoolean(flags: Map<string, string | boolean>, key: string): boolean {
  const value = flags.get(key);
  return value === true || value === 'true';
}

function getFlagString(
  flags: Map<string, string | boolean>,
  key: string,
): string | undefined {
  const value = flags.get(key);
  return typeof value === 'string' ? value : undefined;
}

function getGlobalOptions(flags: Map<string, string | boolean>): GlobalOptions {
  const noColor = getFlagBoolean(flags, 'no-color');
  colorsEnabled = !noColor;

  return {
    json: getFlagBoolean(flags, 'json'),
    noColor,
    userId: getFlagString(flags, 'user') || process.env.INTENTGRAPH_USER_ID || 'current-user',
    workspaceId:
      getFlagString(flags, 'workspace') ||
      process.env.INTENTGRAPH_WORKSPACE_ID ||
      'default-workspace',
  };
}

function color(text: string, code: string): string {
  if (!colorsEnabled) {
    return text;
  }
  return `\u001b[${code}m${text}\u001b[0m`;
}

function header(text: string): string {
  return color(text, '1;36');
}

function ok(text: string): string {
  return color(text, '32');
}

function warn(text: string): string {
  return color(text, '33');
}

function fail(text: string): string {
  return color(text, '31');
}

function printJson(payload: unknown): void {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

function printHelp(): void {
  process.stdout.write(`${header('IntentGraph CLI')}\n\n`);
  process.stdout.write('Compile intent into trusted workflows from the command line.\n\n');
  process.stdout.write('Usage:\n');
  process.stdout.write('  intentgraph <command> [options]\n\n');
  process.stdout.write('Commands:\n');
  process.stdout.write('  help                               Show this help message\n');
  process.stdout.write('  actions list                       List available action plugins\n');
  process.stdout.write('  plan --intent "..."                Compile natural language intent\n');
  process.stdout.write('  run --intent "..."                 Plan and execute a workflow\n');
  process.stdout.write('  doctor                             Validate local environment\n\n');
  process.stdout.write('Global options:\n');
  process.stdout.write('  --json, -j                         Output machine-readable JSON\n');
  process.stdout.write('  --user <id>                        Set user id (default: current-user)\n');
  process.stdout.write('  --workspace <id>                   Set workspace id\n');
  process.stdout.write('  --no-color                         Disable ANSI colors\n\n');
  process.stdout.write('run options:\n');
  process.stdout.write('  --auto-approve                     Auto-approve any gated step\n\n');
  process.stdout.write('Examples:\n');
  process.stdout.write('  intentgraph actions list\n');
  process.stdout.write('  intentgraph plan --intent "Create an issue in github repo: my-repo"\n');
  process.stdout.write('  intentgraph run --intent "Create a pull request in github repo: my-repo" --auto-approve\n');
  process.stdout.write('  intentgraph doctor --json\n');
}

function printActions(actions: ActionDefinition[]): void {
  process.stdout.write(`${header('Available Actions')}\n\n`);
  for (const action of actions) {
    process.stdout.write(`- ${color(action.key, '1;37')} (${action.risk})\n`);
    process.stdout.write(`  ${action.description}\n`);
    process.stdout.write(`  effects: ${action.effects.join(', ')}\n`);
  }
}

function printPlanningResult(result: PlanningResult): void {
  if (!result.success || !result.workflow) {
    process.stdout.write(`${fail('Planning failed')}\n`);
    if (result.error) {
      process.stdout.write(`reason: ${result.error}\n`);
    }
    return;
  }

  process.stdout.write(`${ok('Workflow planned successfully')}\n`);
  process.stdout.write(`confidence: ${Math.round(result.confidence * 100)}%\n`);
  process.stdout.write(`workflow: ${result.workflow.id}\n`);
  process.stdout.write(`name: ${result.workflow.name || result.workflow.title || result.workflow.id}\n`);
  process.stdout.write(`steps: ${result.workflow.steps.length}\n`);

  if (result.warnings && result.warnings.length > 0) {
    process.stdout.write(`${warn('warnings')}\n`);
    for (const warningText of result.warnings) {
      process.stdout.write(`- ${warningText}\n`);
    }
  }
}

function printExecutionResult(execution: ExecutionResponse): void {
  if (execution.status === 'completed') {
    process.stdout.write(`${ok('Workflow execution completed')}\n`);
    process.stdout.write(`run: ${execution.runId}\n`);
    process.stdout.write(`status: ${execution.run?.status || execution.status}\n`);
    return;
  }

  if (execution.status === 'waiting-approval') {
    process.stdout.write(`${warn('Workflow paused for approval')}\n`);
    process.stdout.write(`run: ${execution.runId}\n`);
    const approvals = execution.approvals || [];
    if (approvals.length > 0) {
      process.stdout.write('pending approvals:\n');
      for (const approval of approvals) {
        process.stdout.write(`- ${approval.id} (${approval.action}) requested of ${approval.requestedOf}\n`);
      }
    }
    return;
  }

  process.stdout.write(`${fail('Workflow execution failed')}\n`);
  process.stdout.write(`run: ${execution.runId}\n`);
  if (execution.error) {
    process.stdout.write(`reason: ${execution.error}\n`);
  }
}

function resolveIntent(
  flags: Map<string, string | boolean>,
  positionals: string[],
): string {
  const fromFlag = getFlagString(flags, 'intent');
  if (fromFlag && fromFlag.trim().length > 0) {
    return fromFlag.trim();
  }

  const joined = positionals.join(' ').trim();
  return joined;
}

async function commandActions(
  runtime: RuntimeContext,
  options: GlobalOptions,
): Promise<number> {
  const actions = runtime.planner.getAvailableActions();

  if (options.json) {
    printJson({ actions });
    return 0;
  }

  printActions(actions);
  return 0;
}

async function commandPlan(
  runtime: RuntimeContext,
  options: GlobalOptions,
  input: ParsedInput,
): Promise<number> {
  const intent = resolveIntent(input.flags, input.positionals);

  if (!intent) {
    process.stderr.write('Missing required intent. Use --intent "..."\n');
    return 1;
  }

  const result = await runtime.planner.plan({
    userId: options.userId,
    intent,
    context: {
      availableActions: runtime.executor.listActions(),
    },
  });

  if (options.json) {
    printJson(result);
    return result.success ? 0 : 1;
  }

  printPlanningResult(result);
  return result.success ? 0 : 1;
}

async function commandRun(
  runtime: RuntimeContext,
  options: GlobalOptions,
  input: ParsedInput,
): Promise<number> {
  const intent = resolveIntent(input.flags, input.positionals);
  const autoApprove = getFlagBoolean(input.flags, 'auto-approve');

  if (!intent) {
    process.stderr.write('Missing required intent. Use --intent "..."\n');
    return 1;
  }

  const planning = await runtime.planner.plan({
    userId: options.userId,
    intent,
    context: {
      availableActions: runtime.executor.listActions(),
    },
  });

  if (!planning.success || !planning.workflow) {
    if (options.json) {
      printJson({ planning, execution: null });
    } else {
      printPlanningResult(planning);
    }
    return 1;
  }

  let execution = await runtime.executor.execute({
    workflow: planning.workflow,
    userId: options.userId,
    workspaceId: options.workspaceId,
    sessionId: `cli_${Date.now()}`,
  });

  const approvalsHandled: string[] = [];

  if (autoApprove && execution.status === 'waiting-approval') {
    for (const approval of execution.approvals || []) {
      runtime.approvals.decide({
        approvalId: approval.id,
        approverId: options.userId,
        decision: 'approved',
        reason: 'Auto-approved by CLI flag',
      });
      approvalsHandled.push(approval.id);
    }

    execution = await runtime.executor.resumeRun(execution.runId);
  }

  if (options.json) {
    printJson({
      planning,
      execution,
      approvalsHandled,
      autoApprove,
    });
  } else {
    printPlanningResult(planning);
    process.stdout.write('\n');
    printExecutionResult(execution);

    if (execution.status === 'waiting-approval' && !autoApprove) {
      process.stdout.write(
        `${warn('tip')}: rerun with --auto-approve for local demos, or use the web approval queue.\n`,
      );
    }

    if (approvalsHandled.length > 0) {
      process.stdout.write(`${ok('auto-approved')}: ${approvalsHandled.join(', ')}\n`);
    }
  }

  if (execution.status === 'completed') {
    return 0;
  }

  return execution.status === 'waiting-approval' ? 2 : 1;
}

async function checkUrl(url: string, token?: string): Promise<DoctorCheck> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 2500);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        name: url,
        status: 'warn',
        details: `responded with status ${response.status}`,
      };
    }

    return {
      name: url,
      status: 'ok',
      details: `reachable (${response.status})`,
    };
  } catch (error) {
    return {
      name: url,
      status: 'warn',
      details: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function commandDoctor(options: GlobalOptions): Promise<number> {
  const checks: DoctorCheck[] = [];

  const major = Number(process.versions.node.split('.')[0] || 0);
  checks.push({
    name: 'node-version',
    status: major >= 20 ? 'ok' : 'fail',
    details: `detected ${process.versions.node}; requires >= 20`,
  });

  checks.push({
    name: 'intentgraph-api-token',
    status: process.env.INTENTGRAPH_API_TOKEN ? 'ok' : 'warn',
    details: process.env.INTENTGRAPH_API_TOKEN
      ? 'INTENTGRAPH_API_TOKEN is configured'
      : 'INTENTGRAPH_API_TOKEN not set (optional for local dev)',
  });

  checks.push(await checkUrl('http://127.0.0.1:3001/healthz'));
  checks.push(await checkUrl('http://127.0.0.1:3000/api/workflows', process.env.INTENTGRAPH_API_TOKEN));

  if (options.json) {
    printJson({ checks });
  } else {
    process.stdout.write(`${header('IntentGraph Doctor')}\n\n`);
    for (const check of checks) {
      const symbol = check.status === 'ok' ? ok('PASS') : check.status === 'warn' ? warn('WARN') : fail('FAIL');
      process.stdout.write(`${symbol} ${check.name}: ${check.details}\n`);
    }
  }

  return checks.some((check) => check.status === 'fail') ? 1 : 0;
}

async function main(): Promise<void> {
  const parsed = parseInput(process.argv.slice(2));

  if (parsed.flags.has('help') || parsed.command === 'help') {
    printHelp();
    process.exit(0);
  }

  const options = getGlobalOptions(parsed.flags);
  const runtime = createRuntime();

  let exitCode = 0;

  switch (parsed.command) {
    case 'actions': {
      if (parsed.subcommand && parsed.subcommand !== 'list') {
        process.stderr.write(`Unknown subcommand for actions: ${parsed.subcommand}\n`);
        process.exit(1);
      }
      exitCode = await commandActions(runtime, options);
      break;
    }
    case 'plan': {
      exitCode = await commandPlan(runtime, options, parsed);
      break;
    }
    case 'run': {
      exitCode = await commandRun(runtime, options, parsed);
      break;
    }
    case 'doctor': {
      exitCode = await commandDoctor(options);
      break;
    }
    default: {
      process.stderr.write(`Unknown command: ${parsed.command}\n\n`);
      printHelp();
      exitCode = 1;
      break;
    }
  }

  process.exit(exitCode);
}

void main();
