import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'
import { Building2, Users, Network, Globe } from 'lucide-react'

export function EnterpriseFeatures() {
  const features = [
    {
      title: 'Multi-Tenant Architecture',
      description: 'Strict logical isolation between teams, projects, and environments with scoped memory.',
      icon: Building2
    },
    {
      title: 'Custom Integrations',
      description: 'Build proprietary action plugins for internal APIs using our typed Action SDK.',
      icon: Network
    },
    {
      title: 'SSO & Identity',
      description: 'SAML, OIDC, and SCIM provisioning for seamless identity lifecycle management.',
      icon: Users
    },
    {
      title: 'VPC Peering',
      description: 'Deploy GovernOS agents directly within your secure network boundaries.',
      icon: Globe
    }
  ]

  return (
    <section className="py-24 bg-muted/30">
      <div className="container px-4 mx-auto md:px-6">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Enterprise Ready
          </h2>
          <p className="text-lg text-muted-foreground">
            Capabilities designed for large organizations with complex compliance requirements.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="h-full border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <feature.icon className="h-6 w-6 text-primary mb-2" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}