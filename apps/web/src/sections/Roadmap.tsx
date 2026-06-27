import { motion } from 'framer-motion'
import { Badge } from '@/components/Badge'

export function Roadmap() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container px-4 mx-auto md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight">Product Roadmap</h2>
          <p className="mt-4 text-muted-foreground">See what we're working on and what's shipping next.</p>
        </div>

        <div className="max-w-3xl mx-auto relative border-l border-border/50 pl-8 ml-4 md:ml-auto space-y-12">

          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
            <div className="absolute -left-[41px] top-1 h-5 w-5 rounded-full border-4 border-background bg-primary" />
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold">Q3 2024</h3>
              <Badge variant="default">Current</Badge>
            </div>
            <ul className="space-y-2 text-muted-foreground list-disc list-inside">
              <li>API-first control plane wiring</li>
              <li>Durable persistence for workflows & audit logs</li>
              <li>Multi-tenant RBAC policies</li>
            </ul>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
            <div className="absolute -left-[41px] top-1 h-5 w-5 rounded-full border-4 border-background bg-muted-foreground/30" />
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold">Q4 2024</h3>
              <Badge variant="outline">Planned</Badge>
            </div>
            <ul className="space-y-2 text-muted-foreground list-disc list-inside">
              <li>Reliability hardening (automatic compensation)</li>
              <li>Advanced observability & metrics exporting</li>
              <li>Terraform provider</li>
            </ul>
          </motion.div>

        </div>
      </div>
    </section>
  )
}