import type { NextApiRequest, NextApiResponse } from 'next';
import { callControlPlane } from '../../server/control-plane-client';
import {
  applyRateLimit,
  assertMethod,
  getRequestId,
  requireApiToken,
  resolveUserId,
  sendError,
  sendOk,
} from '../../server/api-utils';

interface ExecuteBody {
  userId?: string;
  workflow?: { id?: string };
  workflowId?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  const requestId = getRequestId(req);

  if (!assertMethod(req, res, 'POST', requestId)) {
    return;
  }

  if (!requireApiToken(req, res, requestId)) {
    return;
  }

  if (!applyRateLimit(req, res, requestId, 'execute', 30, 60_000)) {
    return;
  }

  try {
    const body = req.body as ExecuteBody;
    const workflowId = body.workflow?.id || body.workflowId;
    const userId = resolveUserId(req, body.userId);

    if (!workflowId) {
      sendError(res, 400, requestId, 'workflow.id is required');
      return;
    }

    const upstream = await callControlPlane({
      req,
      requestId,
      method: 'POST',
      path: '/api/v1/execute',
      body: {
        userId,
        workflowId,
      },
    });

    sendOk(res, upstream.status, requestId, upstream.body);
  } catch (error) {
    sendError(res, 502, requestId, 'Execution failed', {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
