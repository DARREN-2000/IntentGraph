import { motion } from 'framer-motion'
import { Button } from '@/components/Button'
import { Terminal, ArrowRight, Sparkles } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10 bg-grid-white/[0.02] bg-[length:40px_40px]" />
      <div className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 blur-3xl xl:-top-6">
        <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
      </div>

      <div className="container px-4 mx-auto md:px-6">
        <div className="flex flex-col items-center text-center space-y-8">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center rounded-full border border-border/50 bg-background/50 px-3 py-1 text-sm backdrop-blur-md"
          >
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Announcing IntentGraph v1.0</span>
            <span className="mx-2 text-border">|</span>
            <a href="#" className="flex items-center text-primary hover:underline font-medium">
              Read the changelog <ArrowRight className="ml-1 h-3 w-3" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-4xl"
          >
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              The trust layer for <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50">
                autonomous agents.
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
              GovernOS (formerly IntentGraph) turns natural-language goals into trusted, orchestratable workflows. Preview, execute, and audit AI actions with enterprise-grade safety.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center gap-4 pt-4"
          >
            <Button size="lg" className="h-12 px-8 rounded-full text-base">
              Start Building Free
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 rounded-full text-base bg-background/50 backdrop-blur-md">
              Book a Demo
            </Button>
          </motion.div>

          {/* Interactive Terminal Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="w-full max-w-5xl mt-16 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent z-10 bottom-0 top-1/2 pointer-events-none" />

            <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden glass animate-float">
              <div className="flex items-center px-4 py-3 border-b border-border/50 bg-muted/30">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-destructive/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="mx-auto flex items-center text-xs text-muted-foreground font-mono">
                  <Terminal className="mr-2 h-3 w-3" /> intentgraph plan "deploy production"
                </div>
              </div>
              <div className="p-6 text-left font-mono text-sm leading-relaxed overflow-x-auto text-muted-foreground bg-black/40">
                <p><span className="text-blue-400">➜</span> <span className="text-primary/90">intentgraph</span> plan "Scale web tier to 5 replicas"</p>
                <p className="mt-2 text-green-400">✔ Analyzed intent</p>
                <p className="text-green-400">✔ Generated workflow spec</p>
                <p className="text-green-400">✔ Policy checks passed</p>
                <br />
                <p className="text-white/80">Proposed Plan:</p>
                <p>1. Update EKS deployment <span className="text-purple-400">`web-prod`</span></p>
                <p>2. Set replicas = 5</p>
                <br />
                <p className="text-yellow-400">⚠️ Risk Level: Medium (Requires Approval)</p>
                <p className="mt-2"><span className="text-blue-400">?</span> Execute this plan? (Y/n)</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}