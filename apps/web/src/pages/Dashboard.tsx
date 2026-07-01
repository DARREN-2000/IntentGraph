import { useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const [intent, setIntent] = useState('');
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    }
  }, [navigate]);

  const handlePlan = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/v1/intents', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ description: intent })
      });
      if (res.status === 401) {
          navigate('/login');
          return;
      }
      const data = await res.json();
      setWorkflow(data.plan);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleApprove = async () => {
    if (!workflow) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/v1/intents/${workflow.db_id}/approve`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
      });
      if (res.status === 401) {
          navigate('/login');
          return;
      }
      const data = await res.json();
      setWorkflow({ ...workflow, status: data.status });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-24 min-h-screen text-foreground bg-background">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold tracking-tight">Intent Execution Dashboard</h1>
            <Button variant="outline" onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}>Logout</Button>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Plan an Intent</h2>
          <textarea
            className="w-full bg-muted text-foreground p-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary mb-4"
            rows={4}
            placeholder="E.g., Provision a new S3 bucket for project Alpha"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
          />
          <Button onClick={handlePlan} disabled={!intent || loading} className="w-full">
            {loading ? 'Planning...' : 'Generate Plan'}
          </Button>
        </Card>

        {workflow && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="p-6 border-yellow-500/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${workflow.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {workflow.status.toUpperCase()}
                </span>
              </div>
              <h3 className="text-lg font-bold mb-2">Execution Plan</h3>
              <p className="text-sm text-muted-foreground mb-4">ID: {workflow.id} (DB ID: {workflow.db_id})</p>

              <div className="space-y-2 mb-6">
                {workflow.steps.map((step: any) => (
                  <div key={step.id} className="p-3 bg-muted/50 rounded flex items-center border border-white/5">
                    <span className="font-mono text-sm">{step.description}</span>
                  </div>
                ))}
              </div>

              {workflow.status !== 'completed' && (
                <Button onClick={handleApprove} disabled={loading} variant="outline" className="w-full bg-primary/10 hover:bg-primary/20 text-primary border-primary/50">
                  Approve & Execute
                </Button>
              )}
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
