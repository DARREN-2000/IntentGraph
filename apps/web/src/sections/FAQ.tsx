import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

const faqs = [
  {
    question: "How is GovernOS different from LangChain or AutoGPT?",
    answer: "GovernOS is not an agent framework; it is an orchestration and governance engine. While frameworks help you build agents, GovernOS provides the infrastructure to deploy them safely in enterprise environments by enforcing typed plans, human approvals, and cryptographic audit trails before execution."
  },
  {
    question: "Do I need to rewrite my existing agents to use this?",
    answer: "No. GovernOS acts as a middleware API. Your existing agents simply need to output their intended actions as JSON matching our workflow specification, rather than executing API calls directly."
  },
  {
    question: "How does the policy engine work?",
    answer: "Policies are written declaratively. You can define rules based on the user intent, the specific action being called, or the parameters of that action. If a plan violates a policy (e.g., spending >$50, or dropping a production database), the workflow halts and enters a pending_approval state."
  },
  {
    question: "Can I host this on-premise or in my VPC?",
    answer: "Yes. The enterprise tier of GovernOS can be deployed entirely within your own infrastructure (AWS EKS, GCP, Azure) to ensure sensitive data never leaves your network boundaries."
  }
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-24 bg-background">
      <div className="container px-4 mx-auto md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="border border-border/50 rounded-lg overflow-hidden bg-card"
            >
              <button
                className="w-full px-6 py-4 flex items-center justify-between font-medium text-left focus:outline-none"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                {faq.question}
                <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", openIndex === index && "rotate-180")} />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-6 pb-4 text-muted-foreground text-sm border-t border-border/50 pt-4">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}