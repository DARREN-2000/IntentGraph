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

interface PlanBody {
  userId?: string;
  intent?: string;
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

  if (!applyRateLimit(req, res, requestId, 'plan', 60, 60_000)) {
    return;
  }

  try {
    const body = req.body as PlanBody;
    const userId = resolveUserId(req, body.userId);
    const intent = body.intent?.trim();

    if (!intent) {
      sendError(res, 400, requestId, 'intent is required');
      return;
    }

    const upstream = await callControlPlane({
      req,
      requestId,
      method: 'POST',
      path: '/api/v1/plan',
      body: {
        userId,
        intent,
      },
    });

    sendOk(res, upstream.status, requestId, upstream.body);
  } catch (error) {
    sendError(res, 502, requestId, 'Planning failed', {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
