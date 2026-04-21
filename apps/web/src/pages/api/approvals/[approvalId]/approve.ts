import type { NextApiRequest, NextApiResponse } from 'next';
import { callControlPlane } from '../../../../server/control-plane-client';
import {
  applyRateLimit,
  assertMethod,
  getRequestId,
  requireApiToken,
  resolveUserId,
  sendError,
  sendOk,
} from '../../../../server/api-utils';

interface ApproveBody {
  approverId?: string;
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

  if (!applyRateLimit(req, res, requestId, 'approve', 60, 60_000)) {
    return;
  }

  try {
    const approvalId = req.query.approvalId;
    if (typeof approvalId !== 'string' || approvalId.length === 0) {
      sendError(res, 400, requestId, 'approvalId is required');
      return;
    }

    const body = req.body as ApproveBody;
    const approverId = resolveUserId(req, body.approverId);

    const upstream = await callControlPlane({
      req,
      requestId,
      method: 'POST',
      path: `/api/v1/approvals/${encodeURIComponent(approvalId)}/approve`,
      body: {
        approverId,
      },
    });

    sendOk(res, upstream.status, requestId, upstream.body);
  } catch (error) {
    sendError(res, 502, requestId, 'Approval failed', {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
