/**
 * IntentGraph API — Control Plane
 *
 * Responsibilities:
 * - Accept natural language goals
 * - Compile goals into WorkflowSpecs
 * - Manage workflow runs, approvals, and audit events
 * - Serve the web dashboard API
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { getControlPlane } from './control-plane';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const MAX_BODY_SIZE_BYTES = 1024 * 1024;

interface PlanBody {
  userId?: string;
  intent?: string;
}

interface ExecuteBody {
  userId?: string;
  workflow?: { id?: string };
  workflowId?: string;
}

interface ApproveBody {
  approverId?: string;
}

function sendJson(res: ServerResponse, status: number, payload: Record<string, unknown>): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function sendError(
  res: ServerResponse,
  status: number,
  requestId: string,
  error: string,
  details?: Record<string, unknown>,
): void {
  sendJson(res, status, {
    success: false,
    requestId,
    error,
    ...(details ? { details } : {}),
  });
}

function sendOk(
  res: ServerResponse,
  status: number,
  requestId: string,
  payload: Record<string, unknown>,
): void {
  sendJson(res, status, {
    ...payload,
    requestId,
  });
}

function getRequestId(req: IncomingMessage): string {
  const header = req.headers['x-request-id'];
  if (typeof header === 'string' && header.trim()) {
    return header.trim();
  }

  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function resolveUserId(req: IncomingMessage, bodyUserId?: string): string {
  const headerUserId = req.headers['x-user-id'];
  const fromHeader = typeof headerUserId === 'string' ? headerUserId : undefined;
  const candidate = (fromHeader || bodyUserId || 'current-user').trim();
  return candidate.slice(0, 128);
}

function isAuthorized(req: IncomingMessage): boolean {
  const configuredToken = process.env.INTENTGRAPH_API_TOKEN;
  if (!configuredToken) {
    return true;
  }

  return req.headers.authorization === `Bearer ${configuredToken}`;
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    const chunkBuffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += chunkBuffer.length;

    if (size > MAX_BODY_SIZE_BYTES) {
      throw new Error('Request body exceeds size limit');
    }

    chunks.push(chunkBuffer);
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    return {};
  }

  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Request body must be a JSON object');
  }

  return parsed as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function getUrl(req: IncomingMessage): URL {
  const host = req.headers.host || `127.0.0.1:${PORT}`;
  return new URL(req.url || '/', `http://${host}`);
}

function methodNotAllowed(
  res: ServerResponse,
  requestId: string,
  allowedMethod: string,
): void {
  res.setHeader('Allow', allowedMethod);
  sendError(res, 405, requestId, 'Method not allowed');
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const requestId = getRequestId(req);
  const method = (req.method || 'GET').toUpperCase();
  const url = getUrl(req);
  const pathname = url.pathname;

  if (pathname === '/health' || pathname === '/healthz') {
    sendJson(res, 200, {
      status: 'ok',
      service: 'intentgraph-api',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (pathname === '/ready' || pathname === '/readyz') {
    sendJson(res, 200, { ready: true });
    return;
  }

  if (pathname === '/api/v1/version') {
    sendJson(res, 200, { version: '0.1.0', name: 'IntentGraph API', requestId });
    return;
  }

  if (!isAuthorized(req)) {
    sendError(res, 401, requestId, 'Unauthorized');
    return;
  }

  const controlPlane = getControlPlane();

  try {
    if (pathname === '/api/v1/plan') {
      if (method !== 'POST') {
        methodNotAllowed(res, requestId, 'POST');
        return;
      }

      const body = (await readJsonBody(req)) as PlanBody;
      const userId = resolveUserId(req, asString(body.userId));
      const intent = asString(body.intent)?.trim();

      if (!intent) {
        sendError(res, 400, requestId, 'intent is required');
        return;
      }

      const result = await controlPlane.planIntent(userId, intent);
      sendOk(res, result.success ? 200 : 400, requestId, result as unknown as Record<string, unknown>);
      return;
    }

    if (pathname === '/api/v1/execute') {
      if (method !== 'POST') {
        methodNotAllowed(res, requestId, 'POST');
        return;
      }

      const body = (await readJsonBody(req)) as ExecuteBody;
      const workflowFromNested =
        body.workflow && typeof body.workflow === 'object'
          ? asString((body.workflow as { id?: unknown }).id)
          : undefined;
      const workflowId = workflowFromNested || asString(body.workflowId);
      const userId = resolveUserId(req, asString(body.userId));

      if (!workflowId) {
        sendError(res, 400, requestId, 'workflow.id is required');
        return;
      }

      const execution = await controlPlane.executeWorkflow(workflowId, userId);
      const statusCode =
        execution.status === 'failed' ? 400 : execution.status === 'waiting-approval' ? 202 : 200;
      sendOk(res, statusCode, requestId, execution as unknown as Record<string, unknown>);
      return;
    }

    if (pathname === '/api/v1/workflows') {
      if (method !== 'GET') {
        methodNotAllowed(res, requestId, 'GET');
        return;
      }

      sendOk(res, 200, requestId, {
        workflows: controlPlane.listWorkflowSummaries(),
      });
      return;
    }

    if (pathname === '/api/v1/approvals') {
      if (method !== 'GET') {
        methodNotAllowed(res, requestId, 'GET');
        return;
      }

      const approvals = controlPlane.listPendingApprovals().map((approval) => ({
        id: approval.id,
        workflowId: approval.workflowRunId,
        status: approval.status,
        approvers: [approval.requestedOf],
      }));

      sendOk(res, 200, requestId, { approvals });
      return;
    }

    const approveMatch = pathname.match(/^\/api\/v1\/approvals\/([^/]+)\/approve$/);
    if (approveMatch) {
      if (method !== 'POST') {
        methodNotAllowed(res, requestId, 'POST');
        return;
      }

      const approvalId = decodeURIComponent(approveMatch[1]);
      const body = (await readJsonBody(req)) as ApproveBody;
      const approverId = resolveUserId(req, asString(body.approverId));

      const result = await controlPlane.approveRequest(approvalId, approverId);
      sendOk(res, 200, requestId, result as unknown as Record<string, unknown>);
      return;
    }

    if (pathname === '/api/v1/actions') {
      if (method !== 'GET') {
        methodNotAllowed(res, requestId, 'GET');
        return;
      }

      sendOk(res, 200, requestId, {
        actions: controlPlane.listActions(),
      });
      return;
    }

    if (pathname === '/api/v1/runs') {
      if (method !== 'GET') {
        methodNotAllowed(res, requestId, 'GET');
        return;
      }

      sendOk(res, 200, requestId, {
        runs: controlPlane.listRuns(),
      });
      return;
    }

    sendError(res, 404, requestId, 'Not found');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes('size limit') || message.includes('JSON') ? 400 : 500;
    sendError(res, status, requestId, 'Request failed', { message });
  }
}

const server = createServer((req, res) => {
  void handleRequest(req, res);
});

server.listen(PORT, () => {
  console.log(`IntentGraph API listening on port ${PORT}`);
});

export { server };
