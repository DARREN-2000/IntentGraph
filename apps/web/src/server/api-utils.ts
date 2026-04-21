import type { NextApiRequest, NextApiResponse } from 'next';

interface BucketState {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, BucketState>();

export function getRequestId(req: NextApiRequest): string {
  const header = req.headers['x-request-id'];
  if (typeof header === 'string' && header.trim()) {
    return header.trim();
  }
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function resolveUserId(req: NextApiRequest, bodyUserId?: string): string {
  const headerUserId = req.headers['x-user-id'];
  const fromHeader = typeof headerUserId === 'string' ? headerUserId : undefined;
  const candidate = (fromHeader || bodyUserId || 'current-user').trim();
  return candidate.slice(0, 128);
}

export function assertMethod(
  req: NextApiRequest,
  res: NextApiResponse,
  allowedMethod: string,
  requestId: string,
): boolean {
  if (req.method === allowedMethod) {
    return true;
  }

  res.setHeader('Allow', allowedMethod);
  sendError(res, 405, requestId, 'Method not allowed');
  return false;
}

export function requireApiToken(
  req: NextApiRequest,
  res: NextApiResponse,
  requestId: string,
): boolean {
  const configuredToken = process.env.INTENTGRAPH_API_TOKEN;
  if (!configuredToken) {
    return true;
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${configuredToken}`) {
    sendError(res, 401, requestId, 'Unauthorized');
    return false;
  }

  return true;
}

export function applyRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  requestId: string,
  key: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  const ip = getClientIp(req);
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  const existing = buckets.get(bucketKey);

  if (!existing || now >= existing.resetAt) {
    buckets.set(bucketKey, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  if (existing.count >= maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    res.setHeader('Retry-After', String(retryAfterSeconds));
    sendError(res, 429, requestId, 'Rate limit exceeded');
    return false;
  }

  existing.count += 1;
  buckets.set(bucketKey, existing);
  return true;
}

export function sendError(
  res: NextApiResponse,
  status: number,
  requestId: string,
  error: string,
  details?: Record<string, unknown>,
): void {
  res.status(status).json({
    success: false,
    requestId,
    error,
    ...(details ? { details } : {}),
  });
}

export function sendOk<T extends object>(
  res: NextApiResponse,
  status: number,
  requestId: string,
  payload: T,
): void {
  res.status(status).json({
    ...payload,
    requestId,
  });
}

function getClientIp(req: NextApiRequest): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor[0]) {
    return forwardedFor[0];
  }

  return req.socket.remoteAddress || 'unknown';
}
