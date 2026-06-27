import { motion } from 'framer-motion'
import { BookOpen, FileCode2, PlayCircle } from 'lucide-react'

export function Documentation() {
  const docs = [
    { title: 'Quickstart Guide', description: 'Get GovernOS running locally in 5 minutes.', icon: PlayCircle },
    { title: 'Architecture Overview', description: 'Deep dive into the Planner and Executor services.', icon: BookOpen },
    { title: 'Writing Action Plugins', description: 'Learn the Action SDK and context boundaries.', icon: FileCode2 },
  ]

  return (
    <section className="py-24 bg-background">
      <div className="container px-4 mx-auto md:px-6">
        <div className="flex flex-col items-center text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">Comprehensive Documentation</h2>
          <p className="mt-4 text-muted-foreground">Everything you need to build secure agentic workflows.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {docs.map((doc, i) => (
             <motion.a
               href="#"
               key={doc.title}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: i * 0.1 }}
               className="group flex flex-col p-6 rounded-xl border border-border/50 bg-card hover:border-primary/50 transition-all shadow-sm hover:shadow"
             >
                <doc.icon className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-lg mb-2">{doc.title}</h3>
                <p className="text-sm text-muted-foreground">{doc.description}</p>
             </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}