import type { NextApiRequest } from 'next';

import { callDemoControlPlane } from './demo-control-plane';

const DEFAULT_CONTROL_PLANE_URL = 'http://127.0.0.1:3001';
const CONTROL_PLANE_TIMEOUT_MS = 10_000;
const DEMO_MODE_VALUES = new Set(['1', 'true', 'yes']);

interface CallControlPlaneOptions {
  req: NextApiRequest;
  requestId: string;
  method: 'GET' | 'POST';
  path: string;
  body?: Record<string, unknown>;
}

export interface ControlPlaneResponse {
  status: number;
  body: Record<string, unknown>;
}

export async function callControlPlane(
  options: CallControlPlaneOptions,
): Promise<ControlPlaneResponse> {
  if (isDemoModeEnabled()) {
    return callDemoControlPlane({
      method: options.method,
      path: options.path,
      body: options.body,
    });
  }

  const baseUrl = getControlPlaneBaseUrl();
  const url = `${baseUrl}${options.path}`;

  const headers: Record<string, string> = {
    'x-request-id': options.requestId,
  };

  const userIdHeader = options.req.headers['x-user-id'];
  if (typeof userIdHeader === 'string' && userIdHeader.trim()) {
    headers['x-user-id'] = userIdHeader.trim();
  }

  if (typeof options.req.headers.authorization === 'string') {
    headers.authorization = options.req.headers.authorization;
  } else if (process.env.INTENTGRAPH_API_TOKEN) {
    headers.authorization = `Bearer ${process.env.INTENTGRAPH_API_TOKEN}`;
  }

  let body: string | undefined;
  if (options.body) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, CONTROL_PLANE_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: options.method,
      headers,
      body,
      signal: controller.signal,
    });

    const parsed = await parseResponseBody(response);

    return {
      status: response.status,
      body: parsed,
    };
  } catch (error) {
    if (shouldFallbackToDemo()) {
      return callDemoControlPlane({
        method: options.method,
        path: options.path,
        body: options.body,
      });
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Control plane request failed: ${message}`);
  } finally {
    clearTimeout(timeout);
  }
}

function isDemoModeEnabled(): boolean {
  const value = process.env.INTENTGRAPH_DEMO_MODE;
  if (!value) {
    return false;
  }
  return DEMO_MODE_VALUES.has(value.toLowerCase());
}

function shouldFallbackToDemo(): boolean {
  return process.env.NODE_ENV !== 'production';
}

function getControlPlaneBaseUrl(): string {
  const configured = process.env.INTENTGRAPH_CONTROL_PLANE_URL || DEFAULT_CONTROL_PLANE_URL;
  return configured.replace(/\/$/, '');
}

async function parseResponseBody(response: Response): Promise<Record<string, unknown>> {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    return {
      success: false,
      error: 'Control plane responded with a non-JSON payload',
    };
  }

  const payload = (await response.json()) as unknown;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      success: false,
      error: 'Control plane response body must be a JSON object',
    };
  }

  return payload as Record<string, unknown>;
}
