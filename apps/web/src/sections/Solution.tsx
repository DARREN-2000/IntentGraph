import { motion } from 'framer-motion'
import { CheckCircle2, Workflow, ShieldCheck } from 'lucide-react'

export function Solution() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container px-4 mx-auto md:px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center flex-row-reverse">

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative order-2 md:order-1"
          >
            <div className="rounded-xl border border-border/50 bg-card p-6 shadow-2xl relative z-10">
              <div className="flex items-center space-x-2 mb-4 border-b border-border pb-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">GOS</div>
                <div className="text-sm font-mono text-muted-foreground">GovernOS Orchestration Engine</div>
              </div>
              <pre className="text-sm font-mono text-primary overflow-x-auto p-4 bg-muted/50 rounded-lg">
                <code>
{`{
  "workflow_id": "wf_8a7b6c5d",
  "status": "pending_approval",
  "plan": [
    {
      "step": 1,
      "action": "aws:rds:snapshot",
      "target": "prod-db-cluster-01"
    },
    {
      "step": 2,
      "action": "slack:notify",
      "channel": "#ops-alerts"
    }
  ],
  "policy_checks": "passed"
}`}
                </code>
              </pre>
              <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg font-bold text-sm flex items-center">
                <ShieldCheck className="w-4 h-4 mr-2" /> Safe & Typed
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent blur-2xl -z-10 rounded-full" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="order-1 md:order-2"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
              Deterministic, typed orchestration.
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              GovernOS acts as a typed middleware between LLMs and your APIs. Instead of executing actions directly, agents generate standardized workflow plans that are validated, audited, and approved before execution.
            </p>
            <div className="space-y-4">
              <div className="flex items-start">
                <CheckCircle2 className="h-6 w-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground"><strong className="text-foreground">Typed Schemas:</strong> All LLM outputs are rigorously validated against Pydantic models.</p>
              </div>
              <div className="flex items-start">
                <Workflow className="h-6 w-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground"><strong className="text-foreground">Preview First:</strong> See exactly what an agent intends to do via a deterministic plan before any side effects occur.</p>
              </div>
              <div className="flex items-start">
                <ShieldCheck className="h-6 w-6 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground"><strong className="text-foreground">Granular Policies:</strong> Define organizational boundaries and require human sign-off based on risk levels.</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}