import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'
import { Code2, Webhook } from 'lucide-react'

export function API() {
  return (
    <section className="py-24 bg-muted/30 border-y border-border/50">
      <div className="container px-4 mx-auto md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">REST & GraphQL APIs</h2>
          <p className="text-lg text-muted-foreground">Integrate the GovernOS engine directly into your own applications.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Card className="h-full border-border/50 bg-background hover:border-primary/50 transition-colors">
              <CardHeader>
                <Code2 className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Control Plane API</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Programmatically submit intents, retrieve generated plans, and poll for execution status.</p>
                <code className="text-xs bg-muted px-2 py-1 rounded block mb-2">POST /v1/intents</code>
                <code className="text-xs bg-muted px-2 py-1 rounded block">GET /v1/workflows/:id</code>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <Card className="h-full border-border/50 bg-background hover:border-primary/50 transition-colors">
              <CardHeader>
                <Webhook className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Webhooks & Events</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Subscribe to real-time events for policy approvals, workflow completion, and audit triggers.</p>
                <code className="text-xs bg-muted px-2 py-1 rounded block mb-2">workflow.pending_approval</code>
                <code className="text-xs bg-muted px-2 py-1 rounded block">action.execution.failed</code>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}