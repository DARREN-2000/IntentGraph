import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'
import { Activity, Clock, CheckCircle } from 'lucide-react'

export function Workflow() {
  return (
    <section className="py-24 bg-background border-t border-border/50">
      <div className="container px-4 mx-auto md:px-6">

        <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Live Execution Feed
          </h2>
          <p className="text-lg text-muted-foreground">
            Monitor real-time workflow progression, policy checks, and human approvals across your organization.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="overflow-hidden border-border/50 shadow-lg">
            <CardHeader className="bg-muted/30 border-b border-border/50 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center">
                <Activity className="w-4 h-4 mr-2 text-primary" /> Active Workflows
              </CardTitle>
              <div className="flex items-center space-x-2">
                 <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Live</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">

                <div className="p-4 sm:px-6 flex items-center justify-between hover:bg-muted/20 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Provision Staging Environment</p>
                      <p className="text-xs text-muted-foreground">Triggered by @sarah • aws:rds, aws:eks</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">Completed</span>
                    <p className="text-xs text-muted-foreground mt-1">2m ago</p>
                  </div>
                </div>

                <div className="p-4 sm:px-6 flex items-center justify-between hover:bg-muted/20 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Drop Legacy Database Table</p>
                      <p className="text-xs text-muted-foreground">Triggered by @alex • postgres:drop</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Pending Approval</span>
                    <p className="text-xs text-muted-foreground mt-1">Requires Security Lead</p>
                  </div>
                </div>

                <div className="p-4 sm:px-6 flex items-center justify-between hover:bg-muted/20 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Sync Customer Data to CRM</p>
                      <p className="text-xs text-muted-foreground">Automated Schedule • hubspot:sync</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">Executing</span>
                    <p className="text-xs text-muted-foreground mt-1">Step 2 of 4</p>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </section>
  )
}