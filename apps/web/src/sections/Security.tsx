import { motion } from 'framer-motion'
import { Shield, Key, Fingerprint, Lock } from 'lucide-react'

const features = [
  {
    title: 'Zero Trust Architecture',
    description: 'Every action requires explicit authorization context. No implicit permissions.',
    icon: Shield,
  },
  {
    title: 'Secret Management',
    description: 'Natively integrates with HashiCorp Vault and AWS Secrets Manager. Never pass keys to the LLM.',
    icon: Key,
  },
  {
    title: 'Cryptographic Audit Trails',
    description: 'Immutable, tamper-evident logs of every workflow execution and policy check.',
    icon: Fingerprint,
  },
  {
    title: 'Role-Based Access Control',
    description: 'Granular RBAC maps to your existing identity provider via SAML/OIDC.',
    icon: Lock,
  },
]

export function Security() {
  return (
    <section id="security" className="py-24 bg-zinc-950 text-zinc-50 border-y border-zinc-900 overflow-hidden relative">
      {/* Dark mode only background effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      <div className="container px-4 mx-auto md:px-6 relative z-10">

        <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">
            Security by Default
          </h2>
          <p className="text-lg text-zinc-400">
            We don't treat security as a feature. It is the fundamental premise of the GovernOS architecture.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl backdrop-blur-sm hover:bg-zinc-800/50 transition-colors"
            >
              <feature.icon className="h-8 w-8 text-zinc-300 mb-4" />
              <h3 className="font-semibold text-lg text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-zinc-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}