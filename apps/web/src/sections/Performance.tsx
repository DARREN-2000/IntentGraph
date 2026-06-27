import { motion } from 'framer-motion'
import { Zap, Server, Activity } from 'lucide-react'

export function Performance() {
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
              Lightning Fast Execution
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              GovernOS is built with high-performance Rust and Go microservices, ensuring minimal latency between plan generation and action execution.
            </p>
            <div className="grid grid-cols-2 gap-6 mt-8">
              <div>
                <div className="flex items-center space-x-2 text-primary mb-2">
                  <Zap className="h-5 w-5" />
                  <span className="font-semibold text-2xl">&lt; 50ms</span>
                </div>
                <p className="text-sm text-muted-foreground">Engine overhead per action execution.</p>
              </div>
              <div>
                <div className="flex items-center space-x-2 text-primary mb-2">
                  <Server className="h-5 w-5" />
                  <span className="font-semibold text-2xl">10k+</span>
                </div>
                <p className="text-sm text-muted-foreground">Concurrent workflows per cluster node.</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-card border border-border/50 rounded-xl p-8 shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity className="w-32 h-32" />
            </div>
            <h3 className="text-xl font-semibold mb-6 relative z-10">System Metrics</h3>
            <div className="space-y-6 relative z-10">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Policy Evaluation</span>
                  <span className="font-mono text-primary">12ms</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full w-[15%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Audit Log Write</span>
                  <span className="font-mono text-primary">8ms</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full w-[10%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">State Hydration</span>
                  <span className="font-mono text-primary">24ms</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full w-[25%]" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  )
}