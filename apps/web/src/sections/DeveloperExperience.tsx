import { motion } from 'framer-motion'
import { Terminal } from 'lucide-react'

export function DeveloperExperience() {
  return (
    <section id="developers" className="py-24 bg-background">
      <div className="container px-4 mx-auto md:px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
              Developer First
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              GovernOS was built by engineers, for engineers. Our Action SDK makes it trivial to expose your existing APIs and scripts to autonomous agents safely.
            </p>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mr-3" />
                Write plugins in TypeScript, Python, or Go.
              </li>
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mr-3" />
                Test locally with the GovernOS CLI.
              </li>
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mr-3" />
                Declarative permissions via code.
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-xl border border-border/50 bg-[#0d1117] overflow-hidden shadow-2xl"
          >
            <div className="flex items-center px-4 py-2 border-b border-white/10 bg-[#161b22]">
              <Terminal className="h-4 w-4 text-zinc-400 mr-2" />
              <span className="text-xs text-zinc-400 font-mono">my_action.py</span>
            </div>
            <div className="p-4 overflow-x-auto text-sm font-mono text-zinc-300">
              <pre>
<code>{`from governos import Action, Context
from pydantic import BaseModel

class InputArgs(BaseModel):
    user_id: str
    role: str

class PromoteUser(Action[InputArgs]):
    id = "iam:promote_user"
    risk_level = "high"

    def preview(self, args: InputArgs, ctx: Context):
        return f"Will promote user {args.user_id} to {args.role}"

    def execute(self, args: InputArgs, ctx: Context):
        # Your internal API call here
        pass`}</code>
              </pre>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}