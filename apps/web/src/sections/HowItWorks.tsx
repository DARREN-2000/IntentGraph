import { motion } from 'framer-motion'
import { FileText, Cpu, CheckSquare, Rocket } from 'lucide-react'

const steps = [
  {
    title: 'Intent',
    description: 'User provides a natural-language goal via Web, CLI, or API.',
    icon: FileText,
  },
  {
    title: 'Plan',
    description: 'LLM translates the intent into a typed workflow specification.',
    icon: Cpu,
  },
  {
    title: 'Approve',
    description: 'Policies enforce human review for risky or high-impact actions.',
    icon: CheckSquare,
  },
  {
    title: 'Execute',
    description: 'The engine safely executes the actions and audits the results.',
    icon: Rocket,
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-muted/30">
      <div className="container px-4 mx-auto md:px-6">

        <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            From Intent to Execution
          </h2>
          <p className="text-lg text-muted-foreground">
            A structured, predictable pipeline ensures safety at every step.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 relative">
           <div className="hidden md:block absolute top-12 left-12 right-12 h-0.5 bg-border -z-10"></div>
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center text-center space-y-4"
            >
              <div className="w-24 h-24 rounded-full bg-background border border-border shadow-sm flex items-center justify-center relative">
                <step.icon className="w-10 h-10 text-primary" />
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
              </div>
              <h3 className="font-semibold text-xl">{step.title}</h3>
              <p className="text-muted-foreground text-sm max-w-xs">{step.description}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}