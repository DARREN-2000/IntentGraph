import type { NextApiRequest, NextApiResponse } from 'next';
import { callControlPlane } from '../../../server/control-plane-client';
import {
  assertMethod,
  getRequestId,
  requireApiToken,
  sendError,
  sendOk,
} from '../../../server/api-utils';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): void {
  const requestId = getRequestId(req);

  if (!assertMethod(req, res, 'GET', requestId)) {
    return;
  }

  if (!requireApiToken(req, res, requestId)) {
    return;
  }

  void callControlPlane({
    req,
    requestId,
    method: 'GET',
    path: '/api/v1/approvals',
  })
    .then((upstream) => {
      sendOk(res, upstream.status, requestId, upstream.body);
    })
    .catch((error) => {
      sendError(res, 502, requestId, 'Failed to list approvals', {
        message: error instanceof Error ? error.message : String(error),
      });
    });
}
