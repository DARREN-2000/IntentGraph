import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/Card'
import { ShieldCheck, Zap, Network, Eye } from 'lucide-react'

const features = [
  {
    title: 'Preview Before Execute',
    description: 'Every action generates a typed, deterministic plan. Review exactly what will happen before it does.',
    icon: Eye,
  },
  {
    title: 'Human-in-the-loop Approvals',
    description: 'Configure granular policies to require human approval for risky actions like destructive operations or external sends.',
    icon: ShieldCheck,
  },
  {
    title: 'Idempotent by Design',
    description: 'Built-in idempotency keys ensure workflows can be safely retried without unintended side-effects.',
    icon: Zap,
  },
  {
    title: 'Universal Context Graph',
    description: 'Our orchestration engine builds cross-file dependency graphs to provide machines with queryable context.',
    icon: Network,
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 bg-muted/50">
      <div className="container px-4 mx-auto md:px-6">

        <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Engineered for reliability.
          </h2>
          <p className="text-lg text-muted-foreground">
            GovernOS provides the critical safety rails needed to deploy autonomous systems in enterprise environments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full border-border/50 bg-background/50 hover:bg-muted transition-colors cursor-default group">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}