/**
 * Main Dashboard Page - IntentGraph Web UI
 */
'use client';

import React, { useEffect, useState } from 'react';

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

const ACTION_CATALOG = [
  {
    name: 'GitHub Issue',
    description: 'Create issues with required context and labels.',
    tone: 'sunset' as const,
  },
  {
    name: 'Slack Message',
    description: 'Post updates to channels with approval awareness.',
    tone: 'mint' as const,
  },
  {
    name: 'Email',
    description: 'Send structured outbound messages through Gmail.',
    tone: 'ocean' as const,
  },
  {
    name: 'Calendar Event',
    description: 'Coordinate meetings with reliable scheduling actions.',
    tone: 'sand' as const,
  },
  {
    name: 'Jira Issue',
    description: 'Create and route tickets into engineering backlogs.',
    tone: 'sunset' as const,
  },
  {
    name: 'Notion Page',
    description: 'Capture durable project notes and documentation.',
    tone: 'mint' as const,
  },
];

export default function Dashboard() {
  const [intent, setIntent] = useState('');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  const refreshData = async (silent = false) => {
    setRefreshing(true);

    try {
      const [workflowResponse, approvalResponse] = await Promise.all([
        fetch('/api/workflows'),
        fetch('/api/approvals'),
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
  };

  useEffect(() => {
    void refreshData(true);
  }, []);

  const handlePlan = async () => {
    const normalizedIntent = intent.trim();
    if (!normalizedIntent) {
      setFeedback({ tone: 'error', text: 'Error: intent is required before planning.' });
      return;
    }

    setBusy(true);
    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: normalizedIntent }),
      });
      const data = (await response.json()) as PlanApiResponse;

      if (response.ok) {
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
    try {
      const response = await fetch('/api/execute', {
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
    try {
      const response = await fetch(`/api/approvals/${approvalId}/approve`, {
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
    <div className="appShell">
      <div className="heroGlow heroGlowA" aria-hidden="true" />
      <div className="heroGlow heroGlowB" aria-hidden="true" />

      <header className="hero" role="banner">
        <p className="eyebrow">IntentGraph Action OS</p>
        <h1>IntentGraph Dashboard</h1>
        <p className="heroCopy">
          Turn natural-language goals into trustworthy workflows with policy checks, preview-first
          execution, and approval gates.
        </p>
      </header>

      <main className="layout" aria-busy={busy || refreshing}>
        <section className="panel composerPanel" aria-labelledby="intent-title">
          <div className="panelHeaderRow">
            <h2 id="intent-title">Create Workflow from Intent</h2>
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
            {feedback ? <p className={`feedback feedback-${feedback.tone}`}>{feedback.text}</p> : null}
          </div>
        </section>

        <section className="panel" aria-labelledby="workflows-title">
          <h2 id="workflows-title">My Workflows</h2>
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
                        <span className={`status status-${normalizeStatus(wf.status)}`}>{wf.status}</span>
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
        </section>

        <section className="panel" aria-labelledby="approvals-title">
          <h2 id="approvals-title">Pending Approvals</h2>
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
        </section>

        <section className="panel catalogPanel" aria-labelledby="actions-title">
          <h2 id="actions-title">Available Actions</h2>
          <div className="catalogGrid">
            {ACTION_CATALOG.map((action) => (
              <ActionCard
                key={action.name}
                name={action.name}
                description={action.description}
                tone={action.tone}
              />
            ))}
          </div>
        </section>
      </main>

      <style jsx>{`
        .appShell {
          position: relative;
          min-height: 100vh;
          padding: 28px 22px 48px;
          background:
            radial-gradient(circle at 12% 10%, rgba(255, 203, 134, 0.45) 0%, transparent 40%),
            radial-gradient(circle at 88% 18%, rgba(117, 212, 176, 0.35) 0%, transparent 42%),
            linear-gradient(160deg, #f4f8f7 0%, #f8f1e8 45%, #ebf1f5 100%);
          color: #162325;
          font-family: 'Space Grotesk', 'Trebuchet MS', 'Avenir Next', sans-serif;
          overflow: hidden;
        }

        .heroGlow {
          position: absolute;
          border-radius: 999px;
          filter: blur(20px);
          z-index: 0;
          opacity: 0.55;
          animation: drift 10s ease-in-out infinite;
        }

        .heroGlowA {
          width: 220px;
          height: 220px;
          background: rgba(255, 160, 79, 0.55);
          top: -50px;
          left: -40px;
        }

        .heroGlowB {
          width: 260px;
          height: 260px;
          background: rgba(84, 184, 190, 0.35);
          top: -70px;
          right: -80px;
          animation-delay: 1.4s;
        }

        .hero {
          position: relative;
          z-index: 1;
          max-width: 920px;
          margin: 0 auto 20px;
          animation: riseIn 520ms ease-out;
        }

        .eyebrow {
          margin: 0;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #2d5f61;
        }

        h1 {
          margin: 8px 0 10px;
          font-size: clamp(1.8rem, 3.3vw, 2.9rem);
          line-height: 1.05;
        }

        h2 {
          margin: 0 0 14px;
          font-size: clamp(1.05rem, 2.1vw, 1.35rem);
          letter-spacing: 0.01em;
        }

        .heroCopy {
          margin: 0;
          max-width: 720px;
          font-size: clamp(0.98rem, 1.8vw, 1.12rem);
          line-height: 1.5;
          color: #324b4d;
        }

        .layout {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 16px;
        }

        .panel {
          grid-column: span 12;
          padding: 18px;
          border-radius: 18px;
          border: 1px solid rgba(25, 61, 64, 0.12);
          background: rgba(255, 255, 255, 0.82);
          box-shadow:
            0 12px 24px rgba(28, 53, 57, 0.08),
            0 1px 1px rgba(28, 53, 57, 0.05);
          animation: riseIn 560ms ease-out;
        }

        .composerPanel {
          grid-column: span 12;
        }

        .catalogPanel {
          grid-column: span 12;
        }

        .panelHeaderRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }

        .inputLabel {
          display: inline-block;
          font-size: 0.92rem;
          font-weight: 650;
          margin-bottom: 8px;
          color: #183234;
        }

        .intentRow {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          align-items: center;
        }

        .intentInput {
          width: 100%;
          min-height: 46px;
          border-radius: 11px;
          border: 1px solid #99b9bb;
          background: #fcfefe;
          padding: 0 14px;
          font-size: 1rem;
          color: #112426;
          transition: box-shadow 180ms ease, border-color 180ms ease;
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
          color: #345356;
        }

        .feedbackWrap {
          min-height: 40px;
          margin-top: 12px;
        }

        .feedback {
          margin: 0;
          border-radius: 11px;
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
          color: #304547;
          font-size: 0.94rem;
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
          font-size: 0.8rem;
          letter-spacing: 0.06em;
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
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .status-completed {
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
        .status-draft {
          background: #edf4f8;
          color: #20526d;
        }

        .primaryButton,
        .secondaryButton {
          border: 1px solid transparent;
          border-radius: 11px;
          min-height: 42px;
          padding: 0 14px;
          font-size: 0.92rem;
          font-weight: 650;
          cursor: pointer;
          transition: transform 140ms ease, box-shadow 170ms ease, opacity 170ms ease;
        }

        .primaryButton {
          background: linear-gradient(135deg, #0a7f87, #165e69);
          color: #f8ffff;
          box-shadow: 0 6px 14px rgba(14, 86, 91, 0.2);
        }

        .secondaryButton {
          background: #fff;
          border-color: #9dbabd;
          color: #164649;
        }

        .primaryButton:hover:not(:disabled),
        .secondaryButton:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .primaryButton:focus,
        .secondaryButton:focus {
          outline: 3px solid rgba(59, 165, 167, 0.27);
          outline-offset: 2px;
        }

        .primaryButton:disabled,
        .secondaryButton:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .catalogGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
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

        @media (min-width: 900px) {
          .composerPanel {
            grid-column: span 12;
          }

          .panel:nth-child(2),
          .panel:nth-child(3) {
            grid-column: span 6;
          }

          .catalogPanel {
            grid-column: span 12;
          }
        }

        @media (max-width: 720px) {
          .appShell {
            padding: 18px 14px 34px;
          }

          .intentRow {
            grid-template-columns: 1fr;
          }

          table {
            min-width: 520px;
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

function ActionCard({
  name,
  description,
  tone,
}: {
  name: string;
  description: string;
  tone: 'sunset' | 'mint' | 'ocean' | 'sand';
}) {
  return (
    <article className={`actionCard tone-${tone}`}>
      <h3>{name}</h3>
      <p>{description}</p>
      <style jsx>{`
        .actionCard {
          border-radius: 14px;
          border: 1px solid rgba(18, 65, 69, 0.16);
          padding: 14px;
          background: #fff;
          transition: transform 140ms ease, box-shadow 170ms ease;
          box-shadow: 0 5px 12px rgba(20, 54, 57, 0.06);
        }

        .actionCard:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 18px rgba(20, 54, 57, 0.11);
        }

        h3 {
          margin: 0 0 7px;
          font-size: 1rem;
          color: #153436;
        }

        p {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.45;
          color: #34575a;
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
      `}</style>
    </article>
  );
}
