import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { initDb, run, get, db } from './db.js';
import { Connection, Client } from '@temporalio/client';
import { intentExecutionWorkflow } from './temporal/workflows.js';
import { authenticate, generateToken } from './auth.js';
import { runFallbackWorker } from './workers/fallback-worker.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3001;

let temporalClient: Client | null = null;

async function initTemporal() {
  const connection = await Connection.connect({ address: 'localhost:7233' });
  temporalClient = new Client({ connection });
}

app.post('/api/v1/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
  }

  try {
      const user: any = await get('SELECT * FROM users WHERE email = ?', [email]);
      if (!user) {
          res.status(401).json({ error: 'Invalid email or password' });
          return;
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (isValid) {
          const token = generateToken(user);
          res.json({ token, user: { email: user.email, role: user.role } });
      } else {
          res.status(401).json({ error: 'Invalid credentials' });
      }
  } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/v1/intents', authenticate, async (req, res) => {
  const { description } = req.body;
  const user = (req as any).user;

  if (!description) {
    res.status(400).json({ error: 'Description is required' });
    return;
  }

  try {
        // Query the real Python API planner
        let planSteps = [];
        try {
            const response = await fetch('http://localhost:8000/api/v1/analyze', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ directory: '.' })
            });
            const analysis = await response.json();

            let actionStr = 'provision';
            if (description.toLowerCase().includes('github')) actionStr = 'create_issue';
            if (description.toLowerCase().includes('terminate')) actionStr = 'terminate';

            planSteps = [
                { id: 'step_1', action: 'analyze', description: `Analysis: Scanned ${analysis.data.nodes} files with ${analysis.data.edges} dependencies.` },
                { id: 'step_2', action: 'execute', description: `Execute: Call Action Plugin for ${actionStr}` }
            ];
        } catch (e) {
             console.error("Python API failed, using fallback plan");
             planSteps = [
                { id: 'step_1', action: 'execute', description: `Execute: Call Action Plugin for ${description}` }
             ];
        }

        const createWorkflowTx = db.transaction(() => {
            const intentRes = db.prepare('INSERT INTO intents (user_id, description) VALUES (?, ?)').run(user.id, description);
            const intentId = intentRes.lastInsertRowid;

            const workflowRes = db.prepare('INSERT INTO workflows (intent_id, plan_data) VALUES (?, ?)').run(intentId, JSON.stringify(planSteps));
            return workflowRes.lastInsertRowid;
        });

        const wfId = createWorkflowTx();
        const wfIdStr = wfId.toString();

        // Start Temporal Workflow
        if (temporalClient) {
            await temporalClient.workflow.start(intentExecutionWorkflow, {
              args: [wfIdStr, description],
              taskQueue: 'intent-execution',
              workflowId: `intent-workflow-${wfIdStr}`,
            });
        }

        res.json({ message: 'Workflow planned', plan: { id: `wf_${Math.random().toString(36).substr(2, 9)}`, db_id: wfIdStr, steps: planSteps, status: 'planned' } });
  } catch (e) {
      console.error("Workflow planning failed", e);
      res.status(500).json({ error: 'Failed to plan workflow' });
  }
});

app.post('/api/v1/intents/:id/approve', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
      if (temporalClient) {
          const handle = temporalClient.workflow.getHandle(`intent-workflow-${id}`);
          await handle.signal('approve');
          res.json({ message: 'Workflow approved and executing', id, status: 'approved' });
          return;
      } else {
          await run('UPDATE workflows SET status = ? WHERE id = ?', ['approved', id]);
          res.json({ message: 'Workflow approved and queued for fallback execution', id, status: 'approved' });
      }
  } catch (e) {
      console.error("Temporal signal failed", e);
      res.status(500).json({ error: 'Failed to approve workflow' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'GovernOS API' });
});

app.listen(port, async () => {
  initDb();
  try {
      await initTemporal();
      console.log('Temporal connected successfully.');
  } catch (e) {
      console.error("Temporal connection failed. Real execution requires temporal. (Will use fallback DB execution)", (e as any).message);
      runFallbackWorker().catch(err => console.error("Fallback worker crashed", err));
  }
  console.log(`GovernOS API listening at http://localhost:${port}`);
});
