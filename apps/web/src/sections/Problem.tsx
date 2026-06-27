import { motion } from 'framer-motion'
import { AlertTriangle, Lock, FileWarning } from 'lucide-react'

export function Problem() {
  return (
    <section className="py-24 bg-background">
      <div className="container px-4 mx-auto md:px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
              AI isn't ready for unstructured execution.
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Giving an LLM direct API access is a security nightmare. Untyped outputs, hallucinated parameters, and runaway loops have kept autonomous agents out of enterprise production environments.
            </p>
            <div className="space-y-4">
              <div className="flex items-start">
                <AlertTriangle className="h-6 w-6 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground"><strong className="text-foreground">Unpredictable Side Effects:</strong> Black-box execution leads to unintended infrastructure changes and data loss.</p>
              </div>
              <div className="flex items-start">
                <Lock className="h-6 w-6 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground"><strong className="text-foreground">Lack of Governance:</strong> No audit trails, no human-in-the-loop approvals, no policy enforcement.</p>
              </div>
              <div className="flex items-start">
                <FileWarning className="h-6 w-6 text-destructive mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground"><strong className="text-foreground">Context Collapse:</strong> Agents lack deep understanding of complex codebase dependencies and organizational state.</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="rounded-xl border border-border/50 bg-card p-6 shadow-2xl relative z-10">
              <div className="flex items-center space-x-2 mb-4 border-b border-border pb-4">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 text-xs font-bold">LLM</div>
                <div className="text-sm font-mono text-muted-foreground">Direct API Execution (Anti-pattern)</div>
              </div>
              <pre className="text-sm font-mono text-destructive/90 overflow-x-auto p-4 bg-muted/50 rounded-lg">
                <code>
{`POST /api/v1/infrastructure/rds
Authorization: Bearer <token>

{
  "action": "delete",
  "resource_id": "prod-db-cluster-01",
  "reason": "Free up space"
}`}
                </code>
              </pre>
              <div className="absolute -bottom-4 -right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg font-bold text-sm flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" /> Unsafe Operation
              </div>
            </div>

            {/* Background elements */}
            <div className="absolute inset-0 bg-gradient-to-tr from-destructive/10 to-transparent blur-2xl -z-10 rounded-full" />
          </motion.div>

        </div>
      </div>
    </section>
  )
}