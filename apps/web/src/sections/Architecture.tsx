import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/Card'

export function Architecture() {
  return (
    <section className="py-24 bg-background">
      <div className="container px-4 mx-auto md:px-6">

        <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Enterprise Architecture
          </h2>
          <p className="text-lg text-muted-foreground">
            Built on robust, scalable primitives designed for mission-critical operations.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative max-w-5xl mx-auto"
        >
          <Card className="bg-card/50 border-border/50 backdrop-blur-sm shadow-xl overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-3 gap-8 text-center relative">

                {/* Connecting Lines (Desktop) */}
                <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-border -z-10 -translate-y-1/2"></div>

                <div className="flex flex-col items-center space-y-4 bg-background p-6 rounded-xl border border-border shadow-sm">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                  <h3 className="font-semibold text-lg">Planner Service</h3>
                  <p className="text-sm text-muted-foreground">Transforms natural language intent into a structured workflow specification.</p>
                </div>

                <div className="flex flex-col items-center space-y-4 bg-background p-6 rounded-xl border border-border shadow-sm border-primary/20 ring-1 ring-primary/10">
                  <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">2</div>
                  <h3 className="font-semibold text-lg">Executor Service</h3>
                  <p className="text-sm text-muted-foreground">Handles policy checks, human approvals, and runtime execution of actions.</p>
                </div>

                <div className="flex flex-col items-center space-y-4 bg-background p-6 rounded-xl border border-border shadow-sm">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</div>
                  <h3 className="font-semibold text-lg">Action Plugins</h3>
                  <p className="text-sm text-muted-foreground">Perform the actual side-effects (preview, execute, compensate).</p>
                </div>

              </div>

              <div className="mt-12 grid md:grid-cols-2 gap-8 pt-8 border-t border-border/50">
                 <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-mono text-sm font-semibold mb-2">Audit Service</h4>
                    <p className="text-sm text-muted-foreground">Maintains an immutable event trail of all workflow runs and state transitions.</p>
                 </div>
                 <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-mono text-sm font-semibold mb-2">Memory Service</h4>
                    <p className="text-sm text-muted-foreground">Provides scoped context (personal, org, project) securely to the Planner.</p>
                 </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </section>
  )
}