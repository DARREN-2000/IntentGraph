import { Hero } from '@/sections/Hero'
import { TrustedTechnologies } from '@/sections/TrustedTechnologies'
import { Problem } from '@/sections/Problem'
import { Solution } from '@/sections/Solution'
import { Features } from '@/sections/Features'
import { Architecture } from '@/sections/Architecture'
import { HowItWorks } from '@/sections/HowItWorks'
import { Workflow } from '@/sections/Workflow'
import { Screenshots } from '@/sections/Screenshots'
import { Performance } from '@/sections/Performance'
import { Security } from '@/sections/Security'
import { EnterpriseFeatures } from '@/sections/EnterpriseFeatures'
import { DeveloperExperience } from '@/sections/DeveloperExperience'
import { API } from '@/sections/API'
import { Documentation } from '@/sections/Documentation'
import { Roadmap } from '@/sections/Roadmap'
import { FAQ } from '@/sections/FAQ'
import { CTA } from '@/sections/CTA'

export function Home() {
  return (
    <>
      <Hero />
      <TrustedTechnologies />
      <Problem />
      <Solution />
      <Features />
      <Architecture />
      <HowItWorks />
      <Workflow />
      <Screenshots />
      <Performance />
      <Security />
      <EnterpriseFeatures />
      <DeveloperExperience />
      <API />
      <Documentation />
      <Roadmap />
      <FAQ />
      <CTA />
    </>
  )
}