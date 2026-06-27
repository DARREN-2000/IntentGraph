import { motion } from 'framer-motion'
import { Card } from '@/components/Card'

export function Screenshots() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container px-4 mx-auto md:px-6">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Designed for Operators
          </h2>
          <p className="text-lg text-muted-foreground">
            A premium interface for managing, reviewing, and auditing your agentic workflows.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative max-w-5xl mx-auto"
        >
          {/* Main Dashboard Mockup */}
          <Card className="overflow-hidden border-border/50 shadow-2xl bg-background">
            <div className="flex items-center px-4 py-3 border-b border-border/50 bg-muted/30">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-border" />
                <div className="w-3 h-3 rounded-full bg-border" />
                <div className="w-3 h-3 rounded-full bg-border" />
              </div>
            </div>

            <div className="p-0 grid grid-cols-1 md:grid-cols-4 min-h-[400px]">
              {/* Sidebar */}
              <div className="hidden md:flex flex-col border-r border-border/50 bg-muted/10 p-4 space-y-4">
                <div className="h-6 w-24 bg-muted rounded animate-pulse" />
                <div className="space-y-2 mt-8">
                  <div className="h-8 w-full bg-primary/10 rounded" />
                  <div className="h-8 w-full bg-muted rounded" />
                  <div className="h-8 w-full bg-muted rounded" />
                </div>
              </div>

              {/* Content Area */}
              <div className="col-span-3 p-6 md:p-8 space-y-8 bg-background relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold">Approval Queue</h3>
                    <p className="text-sm text-muted-foreground">3 actions require review</p>
                  </div>
                  <div className="h-10 w-32 bg-primary text-primary-foreground rounded-md flex items-center justify-center text-sm font-medium">
                    Run Workflow
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border border-border/50 rounded-lg flex items-center justify-between bg-card hover:bg-muted/20 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <div className="w-5 h-5 bg-border rounded-sm" />
                        </div>
                        <div>
                          <div className="h-4 w-48 bg-muted rounded mb-2" />
                          <div className="h-3 w-32 bg-muted rounded" />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="h-8 w-20 bg-destructive/10 text-destructive rounded text-xs flex items-center justify-center font-medium">Reject</div>
                        <div className="h-8 w-20 bg-primary/10 text-primary rounded text-xs flex items-center justify-center font-medium">Approve</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}