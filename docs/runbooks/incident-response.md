# Incident Response Runbook

## Severity Levels

| Level | Description | Response Time | Example |
|-------|------------|---------------|---------|
| SEV-1 | Service down, data loss risk | 15 min | Database corruption, API unresponsive |
| SEV-2 | Major feature broken | 1 hour | Workflow execution failures |
| SEV-3 | Minor feature broken | 4 hours | UI glitch, non-critical connector down |
| SEV-4 | Cosmetic / improvement | Next sprint | Typo, minor UX improvement |

## Workflow Execution Failure

### Symptoms
- Workflow runs stuck in "running" status
- Step execution timeouts
- Compensation failures

### Investigation Steps

1. Check worker pod logs:
   ```bash
   kubectl logs -l component=worker -n intentgraph --tail=100
   ```

2. Check Temporal UI for workflow execution details:
   ```
   http://localhost:8080 (dev)
   ```

3. Check database for stuck workflow runs:
   ```sql
   SELECT * FROM workflow_runs WHERE status = 'running'
   AND started_at < NOW() - INTERVAL '30 minutes';
   ```

4. Check NATS JetStream for message backlog:
   ```bash
   nats stream info WORKFLOWS
   ```

### Resolution

1. For stuck workflows, trigger compensation manually
2. Restart worker pods if needed:
   ```bash
   kubectl rollout restart deployment/intentgraph-worker -n intentgraph
   ```

## API Service Degradation

### Investigation

1. Check API pod health:
   ```bash
   kubectl get pods -l component=api -n intentgraph
   curl http://intentgraph-api:3001/healthz
   ```

2. Check resource utilization:
   ```bash
   kubectl top pods -l app=intentgraph -n intentgraph
   ```

3. Check HPA status:
   ```bash
   kubectl get hpa -n intentgraph
   ```

### Resolution

1. Scale up if resource-constrained:
   ```bash
   kubectl scale deployment intentgraph-api --replicas=5 -n intentgraph
   ```

2. Check for memory leaks in recent deployments
3. Roll back if caused by recent release:
   ```bash
   kubectl rollout undo deployment/intentgraph-api -n intentgraph
   ```
