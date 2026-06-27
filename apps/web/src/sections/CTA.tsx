import { motion } from 'framer-motion'
import { Button } from '@/components/Button'

export function CTA() {
  return (
    <section className="relative py-24 overflow-hidden border-t border-border/50">
      <div className="absolute inset-0 bg-primary/5 -z-10" />
      <div className="absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 blur-3xl opacity-30">
        <div className="aspect-square w-[40rem] rounded-full bg-gradient-to-tr from-primary to-blue-500" />
      </div>

      <div className="container px-4 mx-auto md:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-8"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Ready to secure your autonomous agents?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Join forward-thinking engineering teams using GovernOS to bring AI workflows into production safely.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button size="lg" className="h-12 px-8 rounded-full text-base">
              Start Building Free
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 rounded-full text-base bg-background/50 backdrop-blur-md">
              Contact Sales
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}