/**
 * IntentGraph Web Experience (Dashboard + Product Studio)
 */
'use client';

import Head from 'next/head';
import { Fraunces, Space_Grotesk } from 'next/font/google';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

const displayFont = Fraunces({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
});

const bodyFont = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

interface Workflow {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

interface Approval {
  id: string;
  workflowId: string;
  status: string;
  approvers: string[];
}

interface RawApproval {
  id: string;
  workflowId?: string;
  workflowRunId?: string;
  status?: string;
  approvers?: string[];
  requestedOf?: string;
}

interface PlanApiResponse {
  success?: boolean;
  confidence: number;
  workflow?: { id: string; name?: string; title?: string };
  warnings?: string[];
  error?: string;
}

interface ExecuteApiResponse {
  status?: 'completed' | 'waiting-approval' | 'failed';
  runId?: string;
  run?: { status: string };
  approvals?: RawApproval[];
  error?: string;
}

interface ApproveApiResponse {
  execution?: {
    status?: 'completed' | 'waiting-approval' | 'failed';
    run?: { status: string };
    error?: string;
  };
  error?: string;
}

interface WorkflowsListResponse {
  workflows: Workflow[];
}

interface ApprovalsListResponse {
  approvals: Approval[];
}

interface FeedbackMessage {
  tone: 'success' | 'error' | 'info';
  text: string;
}

type RiskLevel = 'low' | 'medium' | 'high';

type ActionCategory = 'All' | 'Comms' | 'DevOps' | 'Productivity' | 'Data' | 'Security';
type ActionTone = 'sunset' | 'mint' | 'ocean' | 'sand' | 'violet' | 'ember';

interface ActionCardData {
  name: string;
  description: string;
  category: ActionCategory;
  tone: ActionTone;
  tags: string[];
}

interface StatCard {
  label: string;
  value: string;
}

interface UseCase {
  title: string;
  intent: string;
  outcome: string;
  risk: RiskLevel;
}

interface PlanCheck {
  label: string;
  detail: string;
  status: 'pass' | 'warn' | 'block';
}

interface PlanSummary {
  name: string;
  risk: RiskLevel;
  confidence: number;
  checks: PlanCheck[];
  warnings: string[];
}

interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: 'success' | 'info' | 'warning';
}

interface TrustPillar {
  title: string;
  description: string;
  metric: string;
}

interface FlowStep {
  title: string;
  description: string;
}

interface DocCard {
  title: string;
  description: string;
  href: string;
}

interface IntegrationCard {
  name: string;
  description: string;
  status: 'Live' | 'Beta' | 'Planned';
}

interface PricingTier {
  name: string;
  price: string;
  tagline: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}

interface ChangelogEntry {
  date: string;
  title: string;
  detail: string;
}

interface RoadmapEntry {
  horizon: string;
  title: string;
  detail: string;
}

const HERO_STATS: StatCard[] = [
  { label: 'Avg planning confidence', value: '96%' },
  { label: 'Policy gates enforced', value: '4 layers' },
  { label: 'Median approval time', value: '2m 18s' },
  { label: 'Workflow success rate', value: '99.9%' },
];

const ACTION_CATEGORIES: ActionCategory[] = [
  'All',
  'Comms',
  'DevOps',
  'Productivity',
  'Data',
  'Security',
];

const ACTION_CATALOG: ActionCardData[] = [
  {
    name: 'GitHub Issue',
    description: 'Create issues with required context, templates, and labels.',
    category: 'DevOps',
    tone: 'sunset',
    tags: ['triage', 'labels', 'ownership'],
  },
  {
    name: 'GitHub Pull Request',
    description: 'Draft PRs with checklists, reviewers, and policy checks.',
    category: 'DevOps',
    tone: 'ocean',
    tags: ['reviews', 'gates', 'merge'],
  },
  {
    name: 'Slack Message',
    description: 'Post updates to channels with approval awareness.',
    category: 'Comms',
    tone: 'mint',
    tags: ['broadcast', 'ops', 'notify'],
  },
  {
    name: 'Gmail Email',
    description: 'Send structured outbound messages with guardrails.',
    category: 'Comms',
    tone: 'sand',
    tags: ['external', 'approval', 'audit'],
  },
  {
    name: 'Calendar Event',
    description: 'Coordinate meetings with reliable scheduling actions.',
    category: 'Productivity',
    tone: 'violet',
    tags: ['scheduling', 'coordination'],
  },
  {
    name: 'Jira Issue',
    description: 'Create and route tickets into engineering backlogs.',
    category: 'DevOps',
    tone: 'ember',
    tags: ['agile', 'routing', 'sla'],
  },
  {
    name: 'Notion Page',
    description: 'Capture durable project notes and documentation.',
    category: 'Productivity',
    tone: 'mint',
    tags: ['docs', 'notes', 'sync'],
  },
  {
    name: 'Snowflake Query',
    description: 'Run safe analytics queries with lineage tracking.',
    category: 'Data',
    tone: 'ocean',
    tags: ['analytics', 'governance'],
  },
  {
    name: 'PagerDuty Incident',
    description: 'Spin up incident workflows with escalation gates.',
    category: 'Security',
    tone: 'sunset',
    tags: ['incident', 'escalation'],
  },
  {
    name: 'AWS Provision',
    description: 'Provision infrastructure with spend controls.',
    category: 'Security',
    tone: 'ember',
    tags: ['provision', 'spend', 'approval'],
  },
];

const USE_CASES: UseCase[] = [
  {
    title: 'Release readiness',
    intent: 'Create a release checklist, open a PR for release notes, and notify #releases',
    outcome: 'Checklist created, PR opened, Slack summary posted.',
    risk: 'medium',
  },
  {
    title: 'Customer escalation',
    intent: 'Triage a customer escalation, open a Jira ticket, and email the account owner',
    outcome: 'Ticket routed, owner notified, audit trail captured.',
    risk: 'high',
  },
  {
    title: 'Weekly ops review',
    intent: 'Compile the weekly ops report and publish a Notion update',
    outcome: 'Report compiled, Notion page updated.',
    risk: 'low',
  },
  {
    title: 'Spend anomaly',
    intent: 'Investigate AWS spend spike and request approval before provisioning',
    outcome: 'Policy gate created, approval queued.',
    risk: 'high',
  },
];

const TRUST_PILLARS: TrustPillar[] = [
  {
    title: 'Preview-first execution',
    description: 'Every action begins with a typed preview you can inspect.',
    metric: '100% preview coverage',
  },
  {
    title: 'Policy + approvals',
    description: 'Risky actions require explicit policy clearance and approvals.',
    metric: '4 policy layers enforced',
  },
  {
    title: 'Audit-ready by default',
    description: 'All workflow transitions emit immutable audit events.',
    metric: 'Continuous event trail',
  },
];

const FLOW_STEPS: FlowStep[] = [
  {
    title: 'Intent intake',
    description: 'Natural language is parsed into typed workflow specs.',
  },
  {
    title: 'Schema validation',
    description: 'Plan outputs are validated against typed schemas.',
  },
  {
    title: 'Policy check',
    description: 'Risk detection runs before any side effect.',
  },
  {
    title: 'Approval gate',
    description: 'Humans approve delete, spend, provision, or external sends.',
  },
  {
    title: 'Action execution',
    description: 'Actions run with idempotency keys and compensation.',
  },
  {
    title: 'Audit trail',
    description: 'Every step is logged for compliance and replay.',
  },
];

const DOC_CARDS: DocCard[] = [
  {
    title: 'Architecture overview',
    description: 'Control plane, trust plane, and workflow runtime.',
    href: 'https://github.com/DARREN-2000/IntentGraph/blob/main/docs/architecture/overview.md',
  },
  {
    title: 'Action contract',
    description: 'Preview, execute, and compensate rules.',
    href: 'https://github.com/DARREN-2000/IntentGraph/blob/main/docs/architecture/action-contract.md',
  },
  {
    title: 'Product requirements',
    description: 'v1 PRD and launch scope.',
    href: 'https://github.com/DARREN-2000/IntentGraph/blob/main/docs/prd/v1.md',
  },
  {
    title: 'Local development',
    description: 'Runbooks for local services and debugging.',
    href: 'https://github.com/DARREN-2000/IntentGraph/blob/main/docs/runbooks/local-development.md',
  },
];

const INTEGRATIONS: IntegrationCard[] = [
  { name: 'GitHub', description: 'Issues, PRs, checks', status: 'Live' },
  { name: 'Slack', description: 'Approvals, alerts, updates', status: 'Live' },
  { name: 'Gmail', description: 'Outbound email with approvals', status: 'Beta' },
  { name: 'Jira', description: 'Tickets, routing, SLAs', status: 'Live' },
  { name: 'Notion', description: 'Docs and knowledge capture', status: 'Live' },
  { name: 'PagerDuty', description: 'Incident escalation flows', status: 'Beta' },
  { name: 'Snowflake', description: 'Analytics queries with guardrails', status: 'Planned' },
  { name: 'AWS', description: 'Provisioning with spend control', status: 'Planned' },
];

const PRICING_TIERS: PricingTier[] = [
  {
    name: 'Studio',
    price: '$0',
    tagline: 'Single project sandbox',
    features: ['Local demo mode', 'Policy simulation', 'Up to 5 workflows', 'Community support'],
    cta: 'Start free',
  },
  {
    name: 'Teams',
    price: '$39',
    tagline: 'Per seat / month',
    features: [
      'Multi-tenant workflows',
      'Approval queues',
      'Audit exports',
      'Slack + GitHub integrations',
    ],
    cta: 'Launch teams',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    tagline: 'Security + scale',
    features: ['SAML + SCIM', 'Policy studio', 'Dedicated support', 'On-prem connectors'],
    cta: 'Talk to sales',
  },
];

const CHANGELOG: ChangelogEntry[] = [
  {
    date: 'May 2026',
    title: 'Approval queue + risk presets',
    detail: 'Unified approval gating with policy presets for spend, send, and delete.',
  },
  {
    date: 'Apr 2026',
    title: 'Workflow timeline view',
    detail: 'New timeline view for every workflow execution and audit event.',
  },
  {
    date: 'Mar 2026',
    title: 'Connector expansion',
    detail: 'Added Jira, Notion, and PagerDuty integrations.',
  },
  {
    date: 'Feb 2026',
    title: 'Action SDK v0.9',
    detail: 'Typed action templates and improved local testing tools.',
  },
];

const ROADMAP: RoadmapEntry[] = [
  {
    horizon: 'Q3 2026',
    title: 'Policy studio',
    detail: 'Design and ship reusable policy bundles with review.',
  },
  {
    horizon: 'Q4 2026',
    title: 'Action marketplace',
    detail: 'Curated connectors with compliance profiles.',
  },
  {
    horizon: 'Q1 2027',
    title: 'Org-level memory',
    detail: 'Cross-team memory scopes with retention controls.',
  },
  {
    horizon: 'Q2 2027',
    title: 'Trusted automation',
    detail: 'Adaptive approvals driven by historical safety signals.',
  },
];

const DEMO_WORKFLOWS: Workflow[] = [
  {
    id: 'wf-1042',
    name: 'Launch weekly revenue report',
    status: 'completed',
    createdAt: '2026-05-12T14:30:00.000Z',
  },
  {
    id: 'wf-1077',
    name: 'Escalation triage and Jira intake',
    status: 'waiting-approval',
    createdAt: '2026-05-13T09:12:00.000Z',
  },
  {
    id: 'wf-1099',
    name: 'Ops checklist sync',
    status: 'running',
    createdAt: '2026-05-13T18:40:00.000Z',
  },
];

const DEMO_APPROVALS: Approval[] = [
  {
    id: 'appr-18',
    workflowId: 'wf-1077',
    status: 'waiting-approval',
    approvers: ['Security lead', 'Finance ops'],
  },
];

const DEMO_ACTIVITY: ActivityItem[] = [
  {
    id: 'act-1',
    title: 'Policy scan complete',
    detail: 'No critical violations found.',
    time: 'Today 09:12',
    tone: 'success',
  },
  {
    id: 'act-2',
    title: 'Approval requested',
    detail: 'Escalation triage requires external send approval.',
    time: 'Today 09:14',
    tone: 'warning',
  },
  {
    id: 'act-3',
    title: 'Workflow running',
    detail: 'Ops checklist sync in progress.',
    time: 'Today 09:40',
    tone: 'info',
  },
  {
    id: 'act-4',
    title: 'Audit export ready',
    detail: 'Weekly revenue report audit trail ready to download.',
    time: 'Yesterday 16:20',
    tone: 'success',
  },
];

const DEMO_PLAN_SUMMARY: PlanSummary = {
  name: 'Customer escalation triage',
  risk: 'medium',
  confidence: 0.92,
  checks: [
    { label: 'Schema validation', detail: 'Workflow spec is valid.', status: 'pass' },
    { label: 'Policy scan', detail: 'External send detected.', status: 'warn' },
    { label: 'Approval gate', detail: 'Human approval required.', status: 'warn' },
    { label: 'Idempotency', detail: 'Keys attached to every write.', status: 'pass' },
  ],
  warnings: ['Approval required before external send.'],
};

const RISKY_KEYWORDS = ['delete', 'spend', 'provision', 'email', 'slack', 'send', 'payment'];

export default function Dashboard() {
  const demoModeBuild = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const [runtimeApiBase, setRuntimeApiBase] = useState<string | null>(() =>
    typeof window !== 'undefined' ? window.localStorage.getItem('intentgraph_api_base') : null,
  );
  const [runtimeApiKey, setRuntimeApiKey] = useState<string | null>(() =>
    typeof window !== 'undefined' ? window.localStorage.getItem('intentgraph_api_key') : null,
  );
  const [showSettings, setShowSettings] = useState(false);
  const [encryptedPresent, setEncryptedPresent] = useState(false);
  const [encryptBeforeSave, setEncryptBeforeSave] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [unlockPassphrase, setUnlockPassphrase] = useState('');
  const demoMode = demoModeBuild && !runtimeApiBase && !encryptedPresent;

  const getApiBase = () => runtimeApiBase || process.env.NEXT_PUBLIC_API_BASE || '';
  const getApiKey = () => runtimeApiKey || process.env.NEXT_PUBLIC_API_KEY || '';

  const saveRuntimeConfig = (base?: string | null, key?: string | null) => {
    if (typeof window === 'undefined') return;
    if (base != null) {
      if (base === '') window.localStorage.removeItem('intentgraph_api_base');
      else window.localStorage.setItem('intentgraph_api_base', base);
      setRuntimeApiBase(base || null);
    }
    if (key != null) {
      if (key === '') window.localStorage.removeItem('intentgraph_api_key');
      else window.localStorage.setItem('intentgraph_api_key', key);
      setRuntimeApiKey(key || null);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const blob = window.localStorage.getItem('intentgraph_api_config');
    if (blob) setEncryptedPresent(true);
  }, []);

  const handleSaveSettings = async () => {
    if (encryptBeforeSave && passphrase) {
      try {
        const payload = JSON.stringify({ base: runtimeApiBase || '', key: runtimeApiKey || '' });
        // dynamic import to avoid SSR issues
        const { encryptConfig } = await import('../lib/secureConfig');
        const blob = await encryptConfig(payload, passphrase);
        window.localStorage.setItem('intentgraph_api_config', blob);
        window.localStorage.removeItem('intentgraph_api_base');
        window.localStorage.removeItem('intentgraph_api_key');
        setRuntimeApiBase(null);
        setRuntimeApiKey(null);
        setEncryptedPresent(true);
      } catch (err) {
        setFeedback({
          tone: 'error',
          text: `Encryption failed: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    } else {
      saveRuntimeConfig(runtimeApiBase || null, runtimeApiKey || null);
      window.localStorage.removeItem('intentgraph_api_config');
      setEncryptedPresent(false);
    }
    setShowSettings(false);
  };

  const handleUnlock = async () => {
    try {
      const blob = window.localStorage.getItem('intentgraph_api_config');
      if (!blob) throw new Error('No encrypted config found');
      const { decryptConfig } = await import('../lib/secureConfig');
      const plain = await decryptConfig(blob, unlockPassphrase);
      const parsed = JSON.parse(plain);
      setRuntimeApiBase(parsed.base || null);
      setRuntimeApiKey(parsed.key || null);
      setEncryptedPresent(false);
      setShowSettings(false);
      setFeedback({ tone: 'success', text: 'Configuration unlocked in browser session.' });
    } catch (err) {
      setFeedback({
        tone: 'error',
        text: `Unlock failed: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  };

  const apiFetch = async (path: string, opts: RequestInit = {}) => {
    const apiBase = getApiBase();
    const url = path.startsWith('/api/') && apiBase ? `${apiBase.replace(/\/$/, '')}${path}` : path;
    const headers = new Headers(opts.headers || {});
    const apiKey = getApiKey();
    if (apiKey) headers.set('x-api-key', apiKey);
    return fetch(url, { ...opts, headers });
  };
  const [intent, setIntent] = useState('');
  const [workflows, setWorkflows] = useState<Workflow[]>(() => (demoMode ? DEMO_WORKFLOWS : []));
  const [approvals, setApprovals] = useState<Approval[]>(() => (demoMode ? DEMO_APPROVALS : []));
  const [activity, setActivity] = useState<ActivityItem[]>(() => (demoMode ? DEMO_ACTIVITY : []));
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(
    demoMode ? { tone: 'info', text: 'Demo mode is enabled. Live data is simulated.' } : null,
  );
  const [selectedCategory, setSelectedCategory] = useState<ActionCategory>('All');
  const [activeUseCase, setActiveUseCase] = useState<UseCase>(USE_CASES[0]);
  const [planSummary, setPlanSummary] = useState<PlanSummary | null>(
    demoMode ? DEMO_PLAN_SUMMARY : null,
  );
  const [confidence, setConfidence] = useState<number | null>(
    demoMode ? DEMO_PLAN_SUMMARY.confidence : null,
  );

  const visibleActions = useMemo(() => {
    if (selectedCategory === 'All') {
      return ACTION_CATALOG;
    }
    return ACTION_CATALOG.filter((action) => action.category === selectedCategory);
  }, [selectedCategory]);

  const scrollToStudio = useCallback(() => {
    const target = document.getElementById('intent-title');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const refreshData = useCallback(
    async (silent = false) => {
      if (demoMode) {
        if (!silent) {
          setFeedback({ tone: 'info', text: 'Demo mode is active. Data is already fresh.' });
        }
        return;
      }

      setRefreshing(true);

      try {
        const [workflowResponse, approvalResponse] = await Promise.all([
          apiFetch('/api/workflows'),
          apiFetch('/api/approvals'),
        ]);

        if (workflowResponse.ok) {
          const workflowData = (await workflowResponse.json()) as WorkflowsListResponse;
          setWorkflows(workflowData.workflows || []);
        }

        if (approvalResponse.ok) {
          const approvalData = (await approvalResponse.json()) as ApprovalsListResponse;
          setApprovals((approvalData.approvals || []).map(normalizeApproval));
        }

        if (!workflowResponse.ok || !approvalResponse.ok) {
          const failed = !workflowResponse.ok ? '/api/workflows' : '/api/approvals';
          if (!silent) {
            setFeedback({
              tone: 'error',
              text: `Error: failed to refresh dashboard data from ${failed}`,
            });
          }
        }
      } catch (error) {
        if (!silent) {
          setFeedback({
            tone: 'error',
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      } finally {
        setRefreshing(false);
      }
    },
    [demoMode],
  );

  useEffect(() => {
    if (!demoMode) {
      void refreshData(true);
    }
  }, [demoMode, refreshData]);

  const handlePlan = async () => {
    const normalizedIntent = intent.trim();
    if (!normalizedIntent) {
      setFeedback({ tone: 'error', text: 'Error: intent is required before planning.' });
      return;
    }

    setBusy(true);

    if (demoMode) {
      const demoPlan = buildDemoPlan(normalizedIntent);
      setWorkflows((prev) => [demoPlan.workflow, ...prev]);
      setPlanSummary(demoPlan.summary);
      setConfidence(demoPlan.summary.confidence);
      setActivity((prev) =>
        prependActivity(prev, {
          title: 'Workflow planned',
          detail: demoPlan.summary.name,
          tone: 'success',
        }),
      );
      setFeedback({
        tone: 'success',
        text: `Workflow planned with ${Math.round(demoPlan.summary.confidence * 100)}% confidence`,
      });
      setIntent('');
      setBusy(false);
      return;
    }

    try {
      const response = await apiFetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: normalizedIntent }),
      });
      const data = (await response.json()) as PlanApiResponse;

      if (response.ok) {
        const workflowName = data.workflow?.name || data.workflow?.title || normalizedIntent;
        const summary = buildPlanSummary({
          name: workflowName,
          confidence: data.confidence,
          intent: normalizedIntent,
          warnings: data.warnings || [],
        });
        setPlanSummary(summary);
        setConfidence(summary.confidence);
        setFeedback({
          tone: 'success',
          text: `Workflow planned with ${Math.round(data.confidence * 100)}% confidence`,
        });
        setIntent('');
        await refreshData(true);
      } else {
        setFeedback({ tone: 'error', text: `Error: ${data.error || 'Planning failed'}` });
      }
    } catch (error) {
      setFeedback({
        tone: 'error',
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleExecute = async (workflowId: string) => {
    setBusy(true);

    if (demoMode) {
      const target = workflows.find((workflow) => workflow.id === workflowId);
      if (!target) {
        setFeedback({ tone: 'error', text: 'Error: workflow not found.' });
        setBusy(false);
        return;
      }

      const risk = inferRisk(target.name);
      const requiresApproval = risk !== 'low';

      if (requiresApproval) {
        const approval = {
          id: createId('appr'),
          workflowId,
          status: 'waiting-approval',
          approvers: ['Security lead', 'Finance ops'],
        };
        setApprovals((prev) => [approval, ...prev]);
        setWorkflows((prev) =>
          prev.map((wf) => (wf.id === workflowId ? { ...wf, status: 'waiting-approval' } : wf)),
        );
        setActivity((prev) =>
          prependActivity(prev, {
            title: 'Approval requested',
            detail: `${target.name} requires approval.`,
            tone: 'warning',
          }),
        );
        setFeedback({
          tone: 'info',
          text: 'Execution paused: approval is required before running this workflow.',
        });
      } else {
        setWorkflows((prev) =>
          prev.map((wf) => (wf.id === workflowId ? { ...wf, status: 'completed' } : wf)),
        );
        setActivity((prev) =>
          prependActivity(prev, {
            title: 'Workflow executed',
            detail: `${target.name} completed successfully.`,
            tone: 'success',
          }),
        );
        setFeedback({ tone: 'success', text: 'Workflow executed: completed' });
      }
      setBusy(false);
      return;
    }

    try {
      const response = await apiFetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow: { id: workflowId } }),
      });
      const data = (await response.json()) as ExecuteApiResponse;

      if (response.ok || response.status === 202) {
        if (data.status === 'waiting-approval') {
          setFeedback({
            tone: 'info',
            text: 'Execution paused: approval is required before running this workflow.',
          });
          if (data.approvals) {
            setApprovals(data.approvals.map(normalizeApproval));
          }
        } else {
          setFeedback({
            tone: 'success',
            text: `Workflow executed: ${data.run?.status || data.status || 'unknown'}`,
          });
        }
        await refreshData(true);
      } else {
        setFeedback({ tone: 'error', text: `Error: ${data.error || 'Execution failed'}` });
      }
    } catch (error) {
      setFeedback({
        tone: 'error',
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async (approvalId: string) => {
    setBusy(true);

    if (demoMode) {
      const approval = approvals.find((item) => item.id === approvalId);
      if (!approval) {
        setFeedback({ tone: 'error', text: 'Error: approval not found.' });
        setBusy(false);
        return;
      }

      setApprovals((prev) =>
        prev.map((item) => (item.id === approvalId ? { ...item, status: 'approved' } : item)),
      );
      setWorkflows((prev) =>
        prev.map((wf) => (wf.id === approval.workflowId ? { ...wf, status: 'completed' } : wf)),
      );
      setActivity((prev) =>
        prependActivity(prev, {
          title: 'Approval granted',
          detail: `${approval.workflowId} released to execute.`,
          tone: 'success',
        }),
      );
      setFeedback({
        tone: 'success',
        text: 'Approval granted and workflow executed: completed',
      });
      setBusy(false);
      return;
    }

    try {
      const response = await apiFetch(`/api/approvals/${approvalId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalId, approverId: 'current-user' }),
      });

      if (response.ok) {
        const data = (await response.json()) as ApproveApiResponse;
        if (data.execution?.status === 'completed') {
          setFeedback({
            tone: 'success',
            text: `Approval granted and workflow executed: ${
              data.execution.run?.status || 'completed'
            }`,
          });
        } else if (data.execution?.status === 'waiting-approval') {
          setFeedback({
            tone: 'info',
            text: 'Approval recorded. Additional approvals are still required.',
          });
        } else {
          setFeedback({ tone: 'success', text: 'Approval granted.' });
        }
        await refreshData(true);
      } else {
        setFeedback({ tone: 'error', text: 'Error: failed to approve request.' });
      }
    } catch (error) {
      setFeedback({
        tone: 'error',
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setBusy(false);
    }
  };

  const createDisabled = busy || intent.trim().length === 0;

  return (
    <div className={`${displayFont.variable} ${bodyFont.variable} appShell`}>
      <Head>
        <title>IntentGraph Action OS</title>
        <meta
          name="description"
          content="IntentGraph turns natural-language goals into trusted, policy-checked workflows."
        />
      </Head>

      <div className="heroGlow glowA" aria-hidden="true" />
      <div className="heroGlow glowB" aria-hidden="true" />
      <div className="heroGrid" aria-hidden="true" />

      <header className="hero" role="banner">
        <div className="heroTop">
          <p className="eyebrow">IntentGraph Action OS</p>
          <span className={`pill ${demoMode ? 'pill-demo' : 'pill-live'}`}>
            {demoMode ? 'Demo mode' : 'Live environment'}
          </span>
        </div>
        <img
          src={`${process.env.NEXT_PUBLIC_DEPLOY_ENV === 'github-pages' ? '/IntentGraph' : ''}/docs/animations/intentgraph-hero.svg`}
          className="heroAnimation"
          alt="Hero Animation"
        />
        <h1 className="heroTitle">Intent to trusted workflows, end to end.</h1>
        <p className="heroCopy">
          Transform natural-language goals into policy-checked workflows with preview-first
          execution, human approvals, and audit-ready event trails.
        </p>
        <div className="heroActions">
          <button type="button" className="primaryButton" onClick={scrollToStudio}>
            Launch studio
          </button>
          <button
            type="button"
            className="ghostButton"
            onClick={() => setShowSettings((s) => !s)}
            aria-expanded={showSettings}
          >
            Connect API
          </button>
          <a
            className="ghostButton"
            href="https://github.com/DARREN-2000/IntentGraph/blob/main/docs/architecture/overview.md"
            target="_blank"
            rel="noreferrer"
          >
            Read architecture
          </a>
        </div>
        <div className="heroStats">
          {HERO_STATS.map((stat) => (
            <div key={stat.label} className="statCard">
              <p className="statValue">{stat.value}</p>
              <p className="statLabel">{stat.label}</p>
            </div>
          ))}
        </div>
      </header>

      <main className="main" aria-busy={busy || refreshing}>
        <section className="section">
          <div className="sectionGrid">
            <div className="panel span-7 composerPanel" aria-labelledby="intent-title">
              <div className="panelHeaderRow">
                <h2 id="intent-title">Create workflow from intent</h2>
                <button
                  type="button"
                  className="secondaryButton"
                  onClick={() => void refreshData()}
                  disabled={busy || refreshing}
                >
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              <label htmlFor="intent-input" className="inputLabel">
                Describe what you want to do
              </label>
              <div className="intentRow">
                <input
                  id="intent-input"
                  type="text"
                  value={intent}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIntent(e.target.value)}
                  placeholder="Describe what you want to do..."
                  className="intentInput"
                  aria-describedby="intent-help"
                />
                <button
                  type="button"
                  onClick={handlePlan}
                  disabled={createDisabled}
                  className="primaryButton"
                >
                  {busy ? 'Processing...' : 'Create'}
                </button>
              </div>
              <p id="intent-help" className="hintText">
                Example: Create a pull request in github repo: my-repo title: Improve auth from:
                feature/auth to: main
              </p>

              <div className="feedbackWrap" aria-live="polite" role="status">
                {feedback ? (
                  <p className={`feedback feedback-${feedback.tone}`}>{feedback.text}</p>
                ) : null}
              </div>

              <div className="panelDivider" />

              <div className="onboardingGrid">
                {USE_CASES.map((useCase) => (
                  <button
                    key={useCase.title}
                    type="button"
                    className={`useCaseCard ${
                      activeUseCase.title === useCase.title ? 'useCaseCardActive' : ''
                    }`}
                    onClick={() => {
                      setActiveUseCase(useCase);
                      setIntent(useCase.intent);
                    }}
                  >
                    <span className="useCaseTitle">{useCase.title}</span>
                    <span className="useCaseOutcome">{useCase.outcome}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="panel span-5" aria-labelledby="preview-title">
              <div className="panelHeaderRow">
                <h2 id="preview-title">Plan preview</h2>
                <span className={`riskBadge risk-${planSummary?.risk || 'low'}`}>
                  Risk: {planSummary?.risk || 'low'}
                </span>
              </div>

              <div className="confidenceBlock">
                <div>
                  <p className="confidenceLabel">Confidence</p>
                  <p className="confidenceValue">
                    {confidence ? `${Math.round(confidence * 100)}%` : '--'}
                  </p>
                </div>
                <div className="confidenceBar">
                  <span
                    className="confidenceFill"
                    style={{ width: confidence ? `${confidence * 100}%` : '8%' }}
                  />
                </div>
              </div>

              {planSummary ? (
                <>
                  <div className="planSummary">
                    <p className="planTitle">{planSummary.name}</p>
                    <p className="planSubtitle">Typed plan ready for execution.</p>
                  </div>
                  <div className="checkList">
                    {planSummary.checks.map((check) => (
                      <div key={check.label} className={`checkRow check-${check.status}`}>
                        <span className="checkLabel">{check.label}</span>
                        <span className="checkDetail">{check.detail}</span>
                      </div>
                    ))}
                  </div>
                  {planSummary.warnings.length > 0 ? (
                    <div className="warningBox">
                      {planSummary.warnings.map((warning) => (
                        <p key={warning}>{warning}</p>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="emptyState">Plan a workflow to see policy checks and preview.</p>
              )}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="sectionGrid">
            <div className="panel span-7" aria-labelledby="workflows-title">
              <div className="panelHeaderRow">
                <h2 id="workflows-title">Workflow queue</h2>
                <span className="panelMeta">Runs, approvals, and outcomes</span>
              </div>
              {workflows.length === 0 ? (
                <p className="emptyState">No workflows yet. Create one above to get started.</p>
              ) : (
                <div className="tableWrap">
                  <table>
                    <caption className="srOnly">Workflow queue</caption>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workflows.map((wf) => (
                        <tr key={wf.id}>
                          <td>{wf.name}</td>
                          <td>
                            <span className={`status status-${normalizeStatus(wf.status)}`}>
                              {wf.status}
                            </span>
                          </td>
                          <td>{new Date(wf.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button
                              type="button"
                              className="secondaryButton"
                              onClick={() => void handleExecute(wf.id)}
                              disabled={busy}
                            >
                              Execute
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="panel span-5" aria-labelledby="approvals-title">
              <div className="panelHeaderRow">
                <h2 id="approvals-title">Approval queue</h2>
                <span className="panelMeta">Human gates for risky actions</span>
              </div>
              {approvals.length === 0 ? (
                <p className="emptyState">No pending approvals.</p>
              ) : (
                <div className="tableWrap">
                  <table>
                    <caption className="srOnly">Pending approval requests</caption>
                    <thead>
                      <tr>
                        <th>Workflow</th>
                        <th>Approvers</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvals.map((approval) => (
                        <tr key={approval.id}>
                          <td>{approval.workflowId}</td>
                          <td>{approval.approvers.join(', ') || 'human-approver'}</td>
                          <td>
                            <span className={`status status-${normalizeStatus(approval.status)}`}>
                              {approval.status}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="primaryButton"
                              onClick={() => void handleApprove(approval.id)}
                              disabled={busy}
                            >
                              Approve
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="sectionGrid">
            <div className="panel span-6" aria-labelledby="playground-title">
              <div className="panelHeaderRow">
                <h2 id="playground-title">Demo playground</h2>
                <span className="panelMeta">Pick a use case to prefill intent</span>
              </div>
              <div className="playgroundList">
                {USE_CASES.map((useCase) => (
                  <button
                    key={useCase.title}
                    type="button"
                    className={`playgroundCard ${
                      activeUseCase.title === useCase.title ? 'playgroundCardActive' : ''
                    }`}
                    onClick={() => {
                      setActiveUseCase(useCase);
                      setIntent(useCase.intent);
                    }}
                  >
                    <div>
                      <p className="playgroundTitle">{useCase.title}</p>
                      <p className="playgroundIntent">{useCase.intent}</p>
                    </div>
                    <span className={`riskBadge risk-${useCase.risk}`}>Risk: {useCase.risk}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="panel span-6" aria-labelledby="activity-title">
              <div className="panelHeaderRow">
                <h2 id="activity-title">Activity feed</h2>
                <span className="panelMeta">Latest workflow signals</span>
              </div>
              <div className="activityList">
                {activity.length === 0 ? (
                  <p className="emptyState">No activity yet.</p>
                ) : (
                  activity.map((item) => (
                    <div key={item.id} className={`activityCard activity-${item.tone}`}>
                      <div>
                        <p className="activityTitle">{item.title}</p>
                        <p className="activityDetail">{item.detail}</p>
                      </div>
                      <span className="activityTime">{item.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="actions-title">
          <div className="panel catalogPanel">
            <div className="panelHeaderRow">
              <h2 id="actions-title">Action catalog</h2>
              <div className="chipRow" role="tablist" aria-label="Filter actions">
                {ACTION_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`chip ${selectedCategory === category ? 'chipActive' : ''}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            <div className="catalogGrid">
              {visibleActions.map((action) => (
                <ActionCard key={action.name} {...action} />
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="sectionGrid">
            <div className="panel span-5" aria-labelledby="trust-title">
              <div className="panelHeaderRow">
                <h2 id="trust-title">Trust layer</h2>
                <span className="panelMeta">Confidence built in</span>
              </div>
              <div className="trustList">
                {TRUST_PILLARS.map((pillar) => (
                  <div key={pillar.title} className="trustCard">
                    <p className="trustTitle">{pillar.title}</p>
                    <p className="trustDescription">{pillar.description}</p>
                    <span className="trustMetric">{pillar.metric}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel span-7" aria-labelledby="flow-title">
              <div className="panelHeaderRow">
                <h2 id="flow-title">Workflow pipeline</h2>
                <span className="panelMeta">Intent to execution, fully traced</span>
              </div>
              <div className="flowGrid">
                {FLOW_STEPS.map((step, index) => (
                  <div key={step.title} className="flowCard">
                    <span className="flowIndex">{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="flowTitle">{step.title}</p>
                      <p className="flowDescription">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="sectionGrid">
            <div className="panel span-6" aria-labelledby="docs-title">
              <div className="panelHeaderRow">
                <h2 id="docs-title">Docs preview</h2>
                <span className="panelMeta">Architecture and runbooks</span>
              </div>
              <div className="docGrid">
                {DOC_CARDS.map((doc) => (
                  <a
                    key={doc.title}
                    href={doc.href}
                    className="docCard"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div>
                      <p className="docTitle">{doc.title}</p>
                      <p className="docDescription">{doc.description}</p>
                    </div>
                    <span className="docArrow">View</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="panel span-6" aria-labelledby="integrations-title">
              <div className="panelHeaderRow">
                <h2 id="integrations-title">Integrations</h2>
                <span className="panelMeta">Built for real systems</span>
              </div>
              <div className="integrationGrid">
                {INTEGRATIONS.map((integration) => (
                  <div key={integration.name} className="integrationCard">
                    <div>
                      <p className="integrationName">{integration.name}</p>
                      <p className="integrationDescription">{integration.description}</p>
                    </div>
                    <span className={`statusBadge status-${integration.status.toLowerCase()}`}>
                      {integration.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="pricing-title">
          <div className="panel pricingPanel">
            <div className="panelHeaderRow">
              <h2 id="pricing-title">Pricing</h2>
              <span className="panelMeta">Scale from demo to production</span>
            </div>
            <div className="pricingGrid">
              {PRICING_TIERS.map((tier) => (
                <div
                  key={tier.name}
                  className={`pricingCard ${tier.highlight ? 'pricingHighlight' : ''}`}
                >
                  <div className="pricingHeader">
                    <p className="pricingName">{tier.name}</p>
                    <p className="pricingPrice">{tier.price}</p>
                    <p className="pricingTagline">{tier.tagline}</p>
                  </div>
                  <ul className="pricingList">
                    {tier.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <button type="button" className="secondaryButton">
                    {tier.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="sectionGrid">
            <div className="panel span-6" aria-labelledby="changelog-title">
              <div className="panelHeaderRow">
                <h2 id="changelog-title">Changelog</h2>
                <span className="panelMeta">Latest platform updates</span>
              </div>
              <div className="changelogList">
                {CHANGELOG.map((entry) => (
                  <div key={entry.title} className="changelogItem">
                    <span className="changelogDate">{entry.date}</span>
                    <div>
                      <p className="changelogTitle">{entry.title}</p>
                      <p className="changelogDetail">{entry.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel span-6" aria-labelledby="roadmap-title">
              <div className="panelHeaderRow">
                <h2 id="roadmap-title">Roadmap</h2>
                <span className="panelMeta">What is next</span>
              </div>
              <div className="roadmapList">
                {ROADMAP.map((entry) => (
                  <div key={entry.title} className="roadmapItem">
                    <span className="roadmapHorizon">{entry.horizon}</span>
                    <div>
                      <p className="roadmapTitle">{entry.title}</p>
                      <p className="roadmapDetail">{entry.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div>
          <p className="footerTitle">IntentGraph</p>
          <p className="footerCopy">
            Action OS for trusted workflows. Preview-first, approval-aware, audit-ready.
          </p>
        </div>
        <div className="footerLinks">
          <a href="https://github.com/DARREN-2000/IntentGraph" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="https://DARREN-2000.github.io/IntentGraph/" target="_blank" rel="noreferrer">
            Live demo
          </a>
          <a
            href="https://github.com/DARREN-2000/IntentGraph/blob/main/docs/runbooks/local-development.md"
            target="_blank"
            rel="noreferrer"
          >
            Runbook
          </a>
        </div>
      </footer>

      {showSettings ? (
        <div className="settingsModal" role="dialog" aria-modal="true">
          <div className="settingsCard">
            <h3>Runtime API configuration</h3>
            <p className="hintText">
              Provide an external API base URL to connect the static demo to a live control plane.
              API key will be sent as `x-api-key` header.
            </p>

            {encryptedPresent ? (
              <div>
                <p className="hintText">
                  An encrypted configuration is stored in this browser. Unlock it to use the config
                  for this session.
                </p>
                <label htmlFor="unlock-passphrase" className="inputLabel">
                  Passphrase
                </label>
                <input
                  id="unlock-passphrase"
                  type="password"
                  value={unlockPassphrase}
                  onChange={(e) => setUnlockPassphrase(e.target.value)}
                  placeholder="Enter passphrase to unlock"
                  className="intentInput"
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    type="button"
                    className="primaryButton"
                    onClick={() => void handleUnlock()}
                  >
                    Unlock
                  </button>
                  <button
                    type="button"
                    className="ghostButton"
                    onClick={() => {
                      window.localStorage.removeItem('intentgraph_api_config');
                      setEncryptedPresent(false);
                      setShowSettings(false);
                    }}
                  >
                    Remove Encrypted Config
                  </button>
                </div>
              </div>
            ) : (
              <>
                <label htmlFor="api-base-url" className="inputLabel">
                  API Base URL
                </label>
                <input
                  id="api-base-url"
                  type="text"
                  value={runtimeApiBase || ''}
                  onChange={(e) => setRuntimeApiBase(e.target.value)}
                  placeholder="https://api.example.com"
                  className="intentInput"
                />
                <label htmlFor="api-key" className="inputLabel">
                  API Key
                </label>
                <input
                  id="api-key"
                  type="text"
                  value={runtimeApiKey || ''}
                  onChange={(e) => setRuntimeApiKey(e.target.value)}
                  placeholder="optional secret (exposed in browser)"
                  className="intentInput"
                />
                <label
                  htmlFor="encrypt-before-save"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}
                >
                  <input
                    id="encrypt-before-save"
                    type="checkbox"
                    checked={encryptBeforeSave}
                    onChange={(e) => setEncryptBeforeSave(e.target.checked)}
                  />
                  Encrypt in browser before saving
                </label>
                {encryptBeforeSave ? (
                  <>
                    <label htmlFor="save-passphrase" className="inputLabel">
                      Passphrase
                    </label>
                    <input
                      id="save-passphrase"
                      type="password"
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="Choose a passphrase"
                      className="intentInput"
                    />
                  </>
                ) : null}

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    type="button"
                    className="primaryButton"
                    onClick={() => void handleSaveSettings()}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="secondaryButton"
                    onClick={() => setShowSettings(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="ghostButton"
                    onClick={() => {
                      saveRuntimeConfig('', '');
                      setShowSettings(false);
                    }}
                  >
                    Clear
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        :root {
          color-scheme: light;
          --bg: #f7f3ea;
          --bg-2: #f3efe9;
          --ink: #0e2023;
          --muted: #415b5f;
          --panel: rgba(255, 255, 255, 0.9);
          --border: rgba(22, 53, 57, 0.14);
          --shadow: 0 18px 40px rgba(14, 39, 43, 0.12);
          --accent: #ff7b3a;
          --accent-2: #1f8a8c;
          --accent-3: #5b4cdb;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: var(--font-body), 'Trebuchet MS', sans-serif;
          background: var(--bg);
          color: var(--ink);
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        button,
        input {
          font-family: inherit;
        }
      `}</style>

      <style jsx>{`
        .appShell {
          position: relative;
          min-height: 100vh;
          padding: 30px 22px 60px;
          overflow: hidden;
        }

        .heroAnimation {
          max-width: 100%;
          height: auto;
          margin: 20px auto;
          display: block;
          border-radius: 12px;
        }

        .heroGlow {
          position: absolute;
          border-radius: 999px;
          filter: blur(22px);
          opacity: 0.6;
          z-index: 0;
        }

        .glowA {
          width: 300px;
          height: 300px;
          background: rgba(255, 157, 99, 0.55);
          top: -80px;
          left: -60px;
          animation: drift 9s ease-in-out infinite;
        }

        .glowB {
          width: 340px;
          height: 340px;
          background: rgba(74, 185, 173, 0.35);
          top: -120px;
          right: -120px;
          animation: drift 10s ease-in-out infinite;
          animation-delay: 1.6s;
        }

        .heroGrid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(14, 32, 35, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14, 32, 35, 0.05) 1px, transparent 1px);
          background-size: 120px 120px;
          opacity: 0.35;
          z-index: 0;
        }

        .hero {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto 28px;
          animation: riseIn 520ms ease-out;
        }

        .heroTop {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .eyebrow {
          margin: 0;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .pill {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid transparent;
        }

        .pill-demo {
          background: rgba(255, 194, 141, 0.3);
          border-color: rgba(255, 140, 60, 0.6);
          color: #8a3c08;
        }

        .pill-live {
          background: rgba(70, 197, 178, 0.2);
          border-color: rgba(32, 135, 137, 0.6);
          color: #0f4a4c;
        }

        .heroTitle {
          margin: 14px 0 12px;
          font-size: clamp(2.4rem, 5vw, 4.4rem);
          line-height: 1.02;
          font-family: var(--font-display), 'Trebuchet MS', serif;
        }

        .heroCopy {
          margin: 0;
          max-width: 720px;
          font-size: clamp(1rem, 2vw, 1.2rem);
          line-height: 1.6;
          color: var(--muted);
        }

        .heroActions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 18px;
        }

        .heroStats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          margin-top: 24px;
        }

        .statCard {
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 12px 14px;
          box-shadow: 0 12px 22px rgba(14, 39, 43, 0.08);
        }

        .statValue {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
        }

        .statLabel {
          margin: 4px 0 0;
          font-size: 0.8rem;
          color: var(--muted);
        }

        .main {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
        }

        .section {
          margin: 24px 0;
        }

        .sectionGrid {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 16px;
        }

        .panel {
          grid-column: span 12;
          padding: 20px;
          border-radius: 20px;
          border: 1px solid var(--border);
          background: var(--panel);
          box-shadow: var(--shadow);
          animation: riseIn 580ms ease-out;
        }

        .span-7 {
          grid-column: span 7;
        }

        .span-6 {
          grid-column: span 6;
        }

        .span-5 {
          grid-column: span 5;
        }

        .panelHeaderRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .panelMeta {
          font-size: 0.85rem;
          color: var(--muted);
        }

        h2 {
          margin: 0;
          font-size: clamp(1.1rem, 2.1vw, 1.4rem);
          font-family: var(--font-display), 'Trebuchet MS', serif;
        }

        .inputLabel {
          display: inline-block;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--ink);
        }

        .intentRow {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          align-items: center;
        }

        .intentInput {
          width: 100%;
          min-height: 48px;
          border-radius: 12px;
          border: 1px solid #9fb8ba;
          background: #fff;
          padding: 0 14px;
          font-size: 1rem;
          color: var(--ink);
          transition:
            box-shadow 180ms ease,
            border-color 180ms ease;
        }

        .intentInput:focus {
          outline: 3px solid rgba(65, 169, 173, 0.28);
          border-color: #338b8f;
          box-shadow: 0 0 0 2px rgba(71, 161, 166, 0.2);
        }

        .hintText {
          margin: 10px 0 0;
          font-size: 0.88rem;
          line-height: 1.45;
          color: var(--muted);
        }

        .feedbackWrap {
          min-height: 40px;
          margin-top: 12px;
        }

        .feedback {
          margin: 0;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 0.93rem;
          line-height: 1.45;
          border: 1px solid transparent;
        }

        .feedback-success {
          color: #163f29;
          border-color: #88cdac;
          background: #e6f6ec;
        }

        .feedback-error {
          color: #642225;
          border-color: #f2a0a5;
          background: #fdebec;
        }

        .feedback-info {
          color: #17384a;
          border-color: #9ec6da;
          background: #e8f2f9;
        }

        .emptyState {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.5;
          color: var(--muted);
        }

        .panelDivider {
          height: 1px;
          background: rgba(12, 37, 41, 0.08);
          margin: 16px 0;
        }

        .onboardingGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }

        .useCaseCard {
          border-radius: 16px;
          border: 1px solid rgba(18, 65, 69, 0.16);
          padding: 12px;
          background: #fff;
          text-align: left;
          cursor: pointer;
          transition:
            transform 140ms ease,
            box-shadow 170ms ease;
        }

        .useCaseCard:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 18px rgba(20, 54, 57, 0.11);
        }

        .useCaseCardActive {
          border-color: rgba(255, 128, 60, 0.5);
          box-shadow: 0 14px 22px rgba(255, 145, 87, 0.18);
        }

        .useCaseTitle {
          display: block;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .useCaseOutcome {
          font-size: 0.88rem;
          color: var(--muted);
        }

        .riskBadge {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          background: rgba(32, 88, 91, 0.1);
          color: #234b4e;
        }

        .risk-low {
          background: rgba(106, 205, 156, 0.25);
          color: #1d5a36;
        }

        .risk-medium {
          background: rgba(255, 199, 120, 0.32);
          color: #7b4a09;
        }

        .risk-high {
          background: rgba(255, 140, 120, 0.3);
          color: #7b1f1a;
        }

        .confidenceBlock {
          display: grid;
          gap: 8px;
          margin-bottom: 12px;
        }

        .confidenceLabel {
          margin: 0;
          font-size: 0.85rem;
          color: var(--muted);
        }

        .confidenceValue {
          margin: 2px 0 0;
          font-size: 1.3rem;
          font-weight: 700;
        }

        .confidenceBar {
          position: relative;
          height: 8px;
          border-radius: 999px;
          background: rgba(20, 51, 55, 0.1);
          overflow: hidden;
        }

        .confidenceFill {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          border-radius: 999px;
          background: linear-gradient(90deg, #ff8a4c, #3ea7a3);
          transition: width 220ms ease;
        }

        .planSummary {
          margin-bottom: 12px;
        }

        .planTitle {
          margin: 0;
          font-weight: 700;
        }

        .planSubtitle {
          margin: 4px 0 0;
          font-size: 0.88rem;
          color: var(--muted);
        }

        .checkList {
          display: grid;
          gap: 10px;
        }

        .checkRow {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(18, 65, 69, 0.1);
          background: #fff;
        }

        .check-pass {
          border-color: rgba(42, 135, 96, 0.2);
        }

        .check-warn {
          border-color: rgba(255, 162, 80, 0.3);
        }

        .check-block {
          border-color: rgba(190, 60, 60, 0.3);
        }

        .checkLabel {
          font-weight: 600;
        }

        .checkDetail {
          font-size: 0.85rem;
          color: var(--muted);
          text-align: right;
        }

        .warningBox {
          margin-top: 12px;
          border-radius: 12px;
          padding: 10px 12px;
          background: rgba(255, 210, 160, 0.3);
          border: 1px solid rgba(255, 158, 80, 0.4);
          font-size: 0.85rem;
        }

        .tableWrap {
          width: 100%;
          overflow-x: auto;
          border-radius: 12px;
          border: 1px solid rgba(29, 77, 81, 0.13);
          background: #fff;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 620px;
        }

        th,
        td {
          text-align: left;
          padding: 11px 12px;
          border-bottom: 1px solid #e8efef;
          font-size: 0.93rem;
          vertical-align: middle;
        }

        th {
          font-size: 0.78rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #3f5d60;
          background: #f4faf9;
        }

        tbody tr:hover {
          background: #fbfefb;
        }

        .status {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 3px 9px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .status-completed,
        .status-approved {
          background: #e4f4ea;
          color: #1f6f43;
        }

        .status-waiting-approval {
          background: #fff1de;
          color: #8c4f07;
        }

        .status-failed {
          background: #fde8ea;
          color: #8f2029;
        }

        .status-running,
        .status-pending,
        .status-draft,
        .status-planned {
          background: #edf4f8;
          color: #20526d;
        }

        .playgroundList {
          display: grid;
          gap: 12px;
        }

        .playgroundCard {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          border-radius: 16px;
          border: 1px solid rgba(18, 65, 69, 0.16);
          padding: 14px;
          background: #fff;
          text-align: left;
          cursor: pointer;
          transition:
            transform 140ms ease,
            box-shadow 170ms ease;
        }

        .playgroundCard:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 18px rgba(20, 54, 57, 0.11);
        }

        .playgroundCardActive {
          border-color: rgba(62, 167, 163, 0.6);
          box-shadow: 0 14px 22px rgba(62, 167, 163, 0.2);
        }

        .playgroundTitle {
          margin: 0;
          font-weight: 700;
        }

        .playgroundIntent {
          margin: 6px 0 0;
          font-size: 0.88rem;
          color: var(--muted);
        }

        .activityList {
          display: grid;
          gap: 12px;
        }

        .activityCard {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          border-radius: 14px;
          border: 1px solid rgba(18, 65, 69, 0.12);
          padding: 12px;
          background: #fff;
        }

        .activityTitle {
          margin: 0;
          font-weight: 700;
        }

        .activityDetail {
          margin: 4px 0 0;
          font-size: 0.85rem;
          color: var(--muted);
        }

        .activityTime {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted);
        }

        .activity-success {
          border-left: 3px solid rgba(54, 169, 111, 0.8);
        }

        .activity-info {
          border-left: 3px solid rgba(54, 128, 169, 0.8);
        }

        .activity-warning {
          border-left: 3px solid rgba(230, 140, 60, 0.8);
        }

        .catalogPanel {
          display: grid;
          gap: 14px;
        }

        .chipRow {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .chip {
          border-radius: 999px;
          padding: 6px 12px;
          border: 1px solid rgba(18, 65, 69, 0.2);
          background: #fff;
          font-size: 0.78rem;
          cursor: pointer;
        }

        .chipActive {
          background: rgba(255, 140, 90, 0.2);
          border-color: rgba(255, 140, 90, 0.6);
          color: #7b3511;
        }

        .catalogGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }

        .actionCard {
          border-radius: 16px;
          border: 1px solid rgba(18, 65, 69, 0.16);
          padding: 14px;
          background: #fff;
          transition:
            transform 140ms ease,
            box-shadow 170ms ease;
          box-shadow: 0 6px 12px rgba(20, 54, 57, 0.06);
        }

        .actionCard:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 18px rgba(20, 54, 57, 0.11);
        }

        .actionHeader {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          align-items: center;
        }

        .actionCard h3 {
          margin: 0 0 6px;
          font-size: 1rem;
          color: var(--ink);
        }

        .actionCategory {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted);
        }

        .actionCard p {
          margin: 0;
          font-size: 0.88rem;
          line-height: 1.45;
          color: var(--muted);
        }

        .tagRow {
          display: flex;
          gap: 6px;
          margin-top: 10px;
          flex-wrap: wrap;
        }

        .tagRow span {
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 4px 6px;
          border-radius: 999px;
          background: rgba(24, 57, 62, 0.08);
          color: var(--muted);
        }

        .tone-sunset {
          background: linear-gradient(180deg, rgba(255, 247, 237, 0.95), #ffffff);
        }

        .tone-mint {
          background: linear-gradient(180deg, rgba(236, 252, 245, 0.95), #ffffff);
        }

        .tone-ocean {
          background: linear-gradient(180deg, rgba(239, 246, 255, 0.95), #ffffff);
        }

        .tone-sand {
          background: linear-gradient(180deg, rgba(254, 249, 231, 0.95), #ffffff);
        }

        .tone-violet {
          background: linear-gradient(180deg, rgba(240, 236, 255, 0.95), #ffffff);
        }

        .tone-ember {
          background: linear-gradient(180deg, rgba(255, 237, 232, 0.95), #ffffff);
        }

        .trustList {
          display: grid;
          gap: 12px;
        }

        .trustCard {
          padding: 14px;
          border-radius: 14px;
          border: 1px solid rgba(18, 65, 69, 0.16);
          background: #fff;
        }

        .trustTitle {
          margin: 0;
          font-weight: 700;
        }

        .trustDescription {
          margin: 6px 0 0;
          font-size: 0.88rem;
          color: var(--muted);
        }

        .trustMetric {
          display: inline-block;
          margin-top: 8px;
          font-size: 0.75rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #1f6f6f;
        }

        .flowGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }

        .flowCard {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 14px;
          border-radius: 14px;
          border: 1px solid rgba(18, 65, 69, 0.16);
          background: #fff;
        }

        .flowIndex {
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .flowTitle {
          margin: 0;
          font-weight: 700;
        }

        .flowDescription {
          margin: 4px 0 0;
          font-size: 0.88rem;
          color: var(--muted);
        }

        .docGrid {
          display: grid;
          gap: 12px;
        }

        .docCard {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          padding: 14px;
          border-radius: 14px;
          border: 1px solid rgba(18, 65, 69, 0.16);
          background: #fff;
          transition:
            transform 140ms ease,
            box-shadow 170ms ease;
        }

        .docCard:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 18px rgba(20, 54, 57, 0.11);
        }

        .docTitle {
          margin: 0;
          font-weight: 700;
        }

        .docDescription {
          margin: 6px 0 0;
          font-size: 0.88rem;
          color: var(--muted);
        }

        .docArrow {
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #1f6f6f;
        }

        .integrationGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }

        .integrationCard {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          padding: 14px;
          border-radius: 14px;
          border: 1px solid rgba(18, 65, 69, 0.16);
          background: #fff;
        }

        .integrationName {
          margin: 0;
          font-weight: 700;
        }

        .integrationDescription {
          margin: 4px 0 0;
          font-size: 0.82rem;
          color: var(--muted);
        }

        .statusBadge {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(30, 69, 74, 0.1);
          color: var(--muted);
        }

        .status-live {
          background: rgba(106, 205, 156, 0.25);
          color: #1d5a36;
        }

        .status-beta {
          background: rgba(255, 199, 120, 0.3);
          color: #7b4a09;
        }

        .status-planned {
          background: rgba(140, 160, 210, 0.2);
          color: #2f3f72;
        }

        .pricingPanel {
          display: grid;
          gap: 16px;
        }

        .pricingGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .pricingCard {
          padding: 18px;
          border-radius: 18px;
          border: 1px solid rgba(18, 65, 69, 0.18);
          background: #fff;
          display: grid;
          gap: 16px;
        }

        .pricingHighlight {
          border-color: rgba(255, 140, 90, 0.6);
          box-shadow: 0 18px 30px rgba(255, 145, 87, 0.2);
        }

        .pricingName {
          margin: 0;
          font-weight: 700;
        }

        .pricingPrice {
          margin: 6px 0 0;
          font-size: 1.6rem;
          font-weight: 700;
        }

        .pricingTagline {
          margin: 4px 0 0;
          font-size: 0.86rem;
          color: var(--muted);
        }

        .pricingList {
          margin: 0;
          padding-left: 18px;
          display: grid;
          gap: 6px;
          color: var(--muted);
          font-size: 0.88rem;
        }

        .changelogList,
        .roadmapList {
          display: grid;
          gap: 12px;
        }

        .changelogItem,
        .roadmapItem {
          display: grid;
          gap: 6px;
          padding: 14px;
          border-radius: 14px;
          border: 1px solid rgba(18, 65, 69, 0.16);
          background: #fff;
        }

        .changelogDate,
        .roadmapHorizon {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted);
        }

        .changelogTitle,
        .roadmapTitle {
          margin: 0;
          font-weight: 700;
        }

        .changelogDetail,
        .roadmapDetail {
          margin: 0;
          font-size: 0.88rem;
          color: var(--muted);
        }

        .footer {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          max-width: 1200px;
          margin: 40px auto 0;
          padding-top: 20px;
          border-top: 1px solid rgba(18, 65, 69, 0.12);
        }

        .footerTitle {
          margin: 0 0 8px;
          font-weight: 700;
        }

        .footerCopy {
          margin: 0;
          max-width: 360px;
          color: var(--muted);
        }

        .footerLinks {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .primaryButton,
        .secondaryButton,
        .ghostButton {
          border: 1px solid transparent;
          border-radius: 12px;
          min-height: 44px;
          padding: 0 16px;
          font-size: 0.92rem;
          font-weight: 650;
          cursor: pointer;
          transition:
            transform 140ms ease,
            box-shadow 170ms ease,
            opacity 170ms ease;
        }

        .primaryButton {
          background: linear-gradient(135deg, #ff7b3a, #1f8a8c);
          color: #f8ffff;
          box-shadow: 0 10px 18px rgba(14, 86, 91, 0.22);
        }

        .secondaryButton {
          background: #fff;
          border-color: #9dbabd;
          color: #164649;
        }

        .ghostButton {
          background: transparent;
          border-color: rgba(18, 65, 69, 0.2);
          color: var(--ink);
          display: inline-flex;
          align-items: center;
        }

        .primaryButton:hover:not(:disabled),
        .secondaryButton:hover:not(:disabled),
        .ghostButton:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .primaryButton:focus,
        .secondaryButton:focus,
        .ghostButton:focus {
          outline: 3px solid rgba(59, 165, 167, 0.27);
          outline-offset: 2px;
        }

        .primaryButton:disabled,
        .secondaryButton:disabled,
        .ghostButton:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .srOnly {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        @media (max-width: 1024px) {
          .span-7,
          .span-6,
          .span-5 {
            grid-column: span 12;
          }

          .intentRow {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .appShell {
            padding: 20px 16px 40px;
          }

          .heroStats {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          }

          table {
            min-width: 520px;
          }

          .footer {
            flex-direction: column;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        @keyframes drift {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(10px, -10px, 0);
          }
        }

        @keyframes riseIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function normalizeStatus(status: string): string {
  return status.toLowerCase().replace(/\s+/g, '-');
}

function normalizeApproval(approval: RawApproval): Approval {
  return {
    id: approval.id,
    workflowId: approval.workflowId || approval.workflowRunId || 'unknown-workflow',
    status: approval.status || 'pending',
    approvers:
      approval.approvers && approval.approvers.length > 0
        ? approval.approvers
        : [approval.requestedOf || 'human-approver'],
  };
}

function inferRisk(intent: string): RiskLevel {
  const normalized = intent.toLowerCase();
  if (RISKY_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    if (
      normalized.includes('delete') ||
      normalized.includes('spend') ||
      normalized.includes('provision')
    ) {
      return 'high';
    }
    return 'medium';
  }
  return 'low';
}

function buildPlanChecks(risk: RiskLevel): PlanCheck[] {
  const approvalStatus = risk === 'low' ? 'pass' : 'warn';
  return [
    { label: 'Schema validation', detail: 'Workflow spec is valid.', status: 'pass' },
    {
      label: 'Policy scan',
      detail: risk === 'high' ? 'High-risk action detected.' : 'No critical violations found.',
      status: risk === 'high' ? 'warn' : 'pass',
    },
    {
      label: 'Approval gate',
      detail: approvalStatus === 'pass' ? 'No approval required.' : 'Approval required.',
      status: approvalStatus,
    },
    { label: 'Idempotency', detail: 'Keys attached to every write.', status: 'pass' },
  ];
}

function buildPlanSummary({
  name,
  confidence,
  intent,
  warnings,
}: {
  name: string;
  confidence: number;
  intent: string;
  warnings: string[];
}): PlanSummary {
  const risk = inferRisk(intent);
  const checks = buildPlanChecks(risk);
  const summaryWarnings =
    warnings.length > 0 ? warnings : risk === 'low' ? [] : ['Approval required.'];
  return {
    name,
    risk,
    confidence,
    checks,
    warnings: summaryWarnings,
  };
}

function buildDemoPlan(intent: string): { workflow: Workflow; summary: PlanSummary } {
  const name = formatWorkflowName(intent);
  const risk = inferRisk(intent);
  const confidence = risk === 'high' ? 0.82 : risk === 'medium' ? 0.9 : 0.96;
  const summary = buildPlanSummary({
    name,
    confidence,
    intent,
    warnings: risk === 'low' ? [] : ['Approval required before external send.'],
  });

  return {
    workflow: {
      id: createId('wf'),
      name,
      status: 'planned',
      createdAt: new Date().toISOString(),
    },
    summary,
  };
}

function prependActivity(
  existing: ActivityItem[],
  entry: { title: string; detail: string; tone: ActivityItem['tone'] },
): ActivityItem[] {
  const nextItem: ActivityItem = {
    id: createId('act'),
    title: entry.title,
    detail: entry.detail,
    tone: entry.tone,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  return [nextItem, ...existing].slice(0, 6);
}

function formatWorkflowName(intent: string): string {
  return intent
    .replace(/[^\w\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 8)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function ActionCard({ name, description, tone, category, tags }: ActionCardData) {
  return (
    <article className={`actionCard tone-${tone}`}>
      <div className="actionHeader">
        <h3>{name}</h3>
        <span className="actionCategory">{category}</span>
      </div>
      <p>{description}</p>
      <div className="tagRow">
        {tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </article>
  );
}
