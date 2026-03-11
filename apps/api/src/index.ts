/**
 * IntentGraph API — Control Plane
 *
 * Responsibilities:
 * - Accept natural language goals
 * - Compile goals into WorkflowSpecs
 * - Manage workflow runs, approvals, and audit events
 * - Serve the web dashboard API
 */

import { createServer } from 'http';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

const server = createServer((_req, res) => {
  const url = _req.url ?? '/';

  if (url === '/health' || url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'intentgraph-api', timestamp: new Date().toISOString() }));
    return;
  }

  if (url === '/ready' || url === '/readyz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ready: true }));
    return;
  }

  if (url === '/api/v1/version') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ version: '0.1.0', name: 'IntentGraph API' }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`IntentGraph API listening on port ${PORT}`);
});

export { server };
