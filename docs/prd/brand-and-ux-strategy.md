# Product Design & UX Strategy: Orchestration Engine for Enterprise AI

## Part 1: Product Brand

**Evaluation of Current Name:**
"IntentGraph" is technically descriptive but leans slightly academic. For a Series A stage, we want it to sound like enterprise infrastructure. It works as a core technology name, but as a premium product, it could be shortened or refined.
**Suggested Alternatives:**
- *Intent* (Simple, Apple-like)
- *GraphOS* (Infrastructure-focused)
- *Axiom* (Foundational)
- **Decision:** Let's elevate **IntentGraph** by styling it as a premium primitive, similar to how Vercel treats "Turborepo".

**Product Name:** IntentGraph
**Tagline:** The orchestration layer for enterprise AI.
**Elevator Pitch:** IntentGraph is the control plane for AI agents, transforming natural language goals into verifiable, deterministic, and approved enterprise workflows.
**One Sentence:** Deploy autonomous AI agents with human-in-the-loop approvals, deterministic execution, and enterprise-grade audit trails.

**Three Sentence Story:**
AI agents are moving from toys to enterprise tools, but they lack the reliability, security, and governance required for production. IntentGraph bridges this gap by providing an orchestration engine where every AI action is previewed, policy-checked, and approved before execution. We give teams the autonomy of AI with the security of enterprise infrastructure.

**Brand Personality:**
Authoritative, transparent, precise, quietly powerful, and elegant.
**Voice:**
Direct, technical yet accessible, confident, and human. We speak to engineers and CTOs without marketing fluff.
**Tone:**
Calm and restrained. Like an air traffic controller—never panicked, always in control.

---

## Part 2: Landing Page Structure

**1. Hero**
- *Purpose:* Immediately communicate value and product quality.
- *Headline:* Orchestrate AI with enterprise precision.
- *Copy Direction:* Focus on the transition from unpredictable LLM outputs to deterministic workflows.
- *Visual Idea:* A glowing, animated dependency graph resolving from a chaotic cloud of nodes into a clean, linear, executed pipeline.

**2. Problem**
- *Purpose:* Agitate the pain point of untrusted AI.
- *Headline:* Agents are powerful. Unbounded agents are dangerous.
- *Copy Direction:* Highlight the risks of letting AI execute without previews, memory, or human-in-the-loop.
- *Visual Idea:* A sleek terminal window showing an AI hallucinating an API call, overlaid with a red "Execution Blocked: Policy Violation" glassmorphic badge.

**3. Solution**
- *Purpose:* Introduce the orchestration engine.
- *Headline:* Deterministic execution for non-deterministic intelligence.
- *Copy Direction:* Explain the preview, approve, execute, and compensate lifecycle.
- *Visual Idea:* An interactive split-screen. Left: Natural language intent. Right: The generated, deterministic workflow graph.

**4. Features**
- *Purpose:* Detail the technical primitives.
- *Headline:* Primitives built for production.
- *Copy Direction:* Crisp, technically accurate descriptions of workflows, memory, and actions.
- *Visual Idea:* A bento box grid of 8 premium feature cards (detailed in Part 4).

**5. Architecture**
- *Purpose:* Prove to engineers that we scale.
- *Headline:* Designed for scale and security.
- *Copy Direction:* Mention the Planner Service, Executor Service, and isolated Memory Scopes.
- *Visual Idea:* A beautifully crafted, isometric architecture diagram with animated data flows (like Vercel's edge network visuals).

**6. How it works**
- *Purpose:* Make the abstract concrete.
- *Headline:* From intent to impact in four steps.
- *Copy Direction:* 1. Plan. 2. Preview. 3. Approve. 4. Execute.
- *Visual Idea:* A horizontal scroll tracking a single task through the four stages, with UI micro-interactions for each.

**7. Demo**
- *Purpose:* Prove it's real.
- *Headline:* See IntentGraph in action.
- *Copy Direction:* "Watch how a complex cloud provisioning intent becomes an approved, executed workflow."
- *Visual Idea:* A 60-second, high-fidelity, highly polished screencast with smooth easing and cursor tracking (Cursor style).

**8. Use Cases**
- *Purpose:* Help visitors map the tool to their jobs.
- *Headline:* Built for the workflows that matter.
- *Copy Direction:* Focus on DevOps, FinOps, and Customer Success.
- *Visual Idea:* Tabbed interface switching between different IDE/Dashboard contexts.

**9. Performance**
- *Purpose:* Assure enterprise readiness.
- *Headline:* Low latency. High throughput.
- *Copy Direction:* Talk about our rust-based or Go-based executors (or just highly optimized TS/Python), sub-millisecond policy checks.
- *Visual Idea:* Subtle, elegant charts showing stable latency percentiles.

**10. Security**
- *Purpose:* Overcome the main objection to AI.
- *Headline:* Security by design. Not as an afterthought.
- *Copy Direction:* Emphasize local execution, scoped memory, and immutable audit logs.
- *Visual Idea:* A frosted glass lock icon over a stream of encrypted hex code.

**11. Developer Experience**
- *Purpose:* Win the engineers.
- *Headline:* A joy to integrate.
- *Copy Direction:* Highlight the Action SDK, strict typing, and CLI.
- *Visual Idea:* A code block with beautiful syntax highlighting showing a simple 5-line Action integration.

**12. Enterprise Features**
- *Purpose:* Speak to the buyer (CTO/VP).
- *Headline:* Scale your autonomy.
- *Copy Direction:* SSO, RBAC, SLA, and dedicated support.
- *Visual Idea:* A dense, organized grid of enterprise badges (SOC2, SAML, etc.).

**13. Roadmap**
- *Purpose:* Show momentum.
- *Headline:* The future of orchestration.
- *Copy Direction:* What we are building next (API control plane, durable execution).
- *Visual Idea:* A stylized, minimal timeline with glowing nodes for shipped features.

**14. Documentation**
- *Purpose:* Provide the "escape hatch" for deep technical evaluation.
- *Headline:* Dive into the docs.
- *Copy Direction:* "Comprehensive guides, API references, and Action SDK tutorials."
- *Visual Idea:* A preview of a beautiful, Nextra/Framer-style documentation page.

**15. FAQ**
- *Purpose:* Handle remaining objections.
- *Headline:* Frequently asked questions.
- *Copy Direction:* Direct, no-nonsense answers.
- *Visual Idea:* Clean, minimalist accordion list.

**16. CTA**
- *Purpose:* Convert.
- *Headline:* Start orchestrating today.
- *Copy Direction:* Simple push to try the open source or book a demo.
- *Visual Idea:* A large, glowing gradient background that draws the eye to the primary button.

**17. Footer**
- *Purpose:* Navigation and legal.
- *Headline:* (None)
- *Copy Direction:* Links to GitHub, Twitter, Docs, Status, Privacy, Terms.
- *Visual Idea:* Monospaced typography, stark and minimal.

---

## Part 3: Hero Section

**Small announcement badge:**
`[✨] Announcing IntentGraph v1.0 ->` (Pill shape, translucent background, subtle animated border glow)

**Headline:**
Orchestrate AI with Enterprise Precision.

**Supporting paragraph:**
The control plane that turns non-deterministic AI into verifiable, secure workflows. Preview every action, enforce strict policies, and require human approval for critical tasks—all before a single line of code executes.

**Primary CTA:**
`Start Building` (Solid primary color, slight drop shadow, micro-interaction on hover)

**Secondary CTA:**
`Read the Docs` (Ghost button, subtle background blur, minimal border)

**Background illustration ideas:**
A dark, deep-space background. Faint, elegant grid lines fade into the distance. A slowly rotating, abstract representation of a 3D dependency graph. Nodes occasionally pulse with light, sending data packets along the connecting lines.

**Animation ideas:**
The nodes in the background graph represent "Intents." They start chaotic and disorganized, then gracefully snap into a structured, linear pipeline, representing the transition from "chaos" to "orchestrated workflow."

**Mockup ideas:**
A floating, angled dashboard window intersecting the background graph. The dashboard shows a human-in-the-loop approval queue. The UI is dark mode, with severe contrasts and vivid accent colors (Linear style).

---

## Part 4: Feature Cards (Bento Box)

1. **Human-in-the-loop Approvals**
   - *Title:* Paused for Approval
   - *Description:* Risky actions automatically pause execution, awaiting cryptographic sign-off from authorized users.
   - *Business Value:* Zero unauthorized spend or destructive actions.
   - *Tech Value:* Asynchronous execution pausing via Temporal/durable queues.
   - *Suggested icon:* Lucide `ShieldAlert`
   - *Visual idea:* A pulsing "Approve / Reject" UI component over a blurred background.

2. **Deterministic Previews**
   - *Title:* Preview Before Execute
   - *Description:* See exactly what the AI plans to do, state changes included, before it happens.
   - *Business Value:* Predictability and trust in automated systems.
   - *Tech Value:* Dry-run execution context and diff generation.
   - *Suggested icon:* Lucide `Eye`
   - *Visual idea:* A Git-style diff showing "Before" and "After" states of a database record.

3. **Scoped Memory Engine**
   - *Title:* Context, Isolated
   - *Description:* Memory is strictly segregated by tenant, project, and session. No cross-contamination.
   - *Business Value:* Enterprise compliance and data privacy guaranteed.
   - *Tech Value:* Tenant-aware vector store and graph context retrieval.
   - *Suggested icon:* Lucide `Database`
   - *Visual idea:* Three distinct, glowing cubes isolated by translucent glass walls.

4. **Immutable Audit Trail**
   - *Title:* Cryptographic Auditing
   - *Description:* Every token, intent, and execution is logged immutably for compliance.
   - *Business Value:* Instant SOC2 compliance for AI operations.
   - *Tech Value:* Append-only event sourcing architecture.
   - *Suggested icon:* Lucide `ScrollText`
   - *Visual idea:* A scrolling terminal feed of JSON logs with green "verified" checkmarks.

5. **Strict Schema Validation**
   - *Title:* Typed Outputs Only
   - *Description:* LLM hallucinations are caught at the edge. We enforce strict Pydantic/Zod schemas.
   - *Business Value:* Eliminates downstream errors caused by bad AI output.
   - *Tech Value:* Runtime schema validation and automatic retry/repair.
   - *Suggested icon:* Lucide `Code2`
   - *Visual idea:* A visual representation of a JSON blob passing through a filter and becoming a typed object.

6. **Action SDK**
   - *Title:* Universal Connectors
   - *Description:* Wrap your existing internal APIs into safe, executable Agent Actions in minutes.
   - *Business Value:* Leverage existing infrastructure without writing new integration code.
   - *Tech Value:* Ergonomic SDK with built-in preview and compensate hooks.
   - *Suggested icon:* Lucide `PlugZap`
   - *Visual idea:* A code snippet showing `import { action } from '@intentgraph/sdk'`.

7. **Compensating Transactions**
   - *Title:* Graceful Rollbacks
   - *Description:* If step 4 fails, steps 1-3 automatically undo themselves.
   - *Business Value:* No corrupted states or manual cleanup required.
   - *Tech Value:* Saga pattern implementation for distributed rollbacks.
   - *Suggested icon:* Lucide `UndoDot`
   - *Visual idea:* An animated timeline where a progress bar hits an error and cleanly rewinds.

8. **Dynamic Policy Engine**
   - *Title:* Guardrails by Default
   - *Description:* Define custom OPA/Rego policies that agents must satisfy to execute.
   - *Business Value:* Enforce company rules (e.g., "Never deploy to prod on Fridays") on AI.
   - *Tech Value:* Policy-as-code evaluation layer intercepting all executor calls.
   - *Suggested icon:* Lucide `Scale`
   - *Visual idea:* A slider moving from "Strict" to "Lenient" with real-time rule updates.

---

## Part 5: Visual Design

- **Typography:**
  - *Headings:* Inter Tight or Geist (Tight tracking, geometric, high-tech).
  - *Body:* Inter (Highly readable, neutral).
  - *Code/Mono:* JetBrains Mono or Geist Mono (Crisp, developer-focused).
- **Spacing system:** Strict 4px/8px baseline grid. Large paddings (128px between major sections) to let the content breathe.
- **Color palette:**
  - *Background:* #000000 (Pure black, OLED friendly).
  - *Surface:* #0A0A0A (Slightly elevated).
  - *Border:* #1A1A1A or #222222 (Very subtle).
  - *Text Primary:* #EDEDED.
  - *Text Secondary:* #888888.
  - *Accent:* A vibrant, electric indigo (#5E6AD2) transitioning to cyan (#22D3EE).
- **Gradients:** Radial, subtle background meshes. Not overpowering. Used primarily to highlight the hero and CTA sections.
- **Shadows:** Deep, multi-layered, colored shadows. E.g., a card has a faint indigo glow rather than a black drop shadow.
- **Card design:** 1px translucent borders, very dark grey backgrounds, subtle inner noise/grain texture, slight glow on hover.
- **Button design:**
  - Primary: Solid background, stark white text, micro-scale down on click.
  - Secondary: Transparent, 1px border, subtle text glow on hover.
- **Animations:** Spring-based (Framer Motion defaults). Fast, snappy, never floaty. Elements fade and slide up slightly on scroll.
- **Glass effects:** Heavy background blur (`backdrop-filter: blur(24px)`) with low opacity white/grey fills. Used for navbars and floating UI elements.
- **Mode:** Dark mode only initially. It communicates "pro tool" and "terminal interface" best.

---

## Part 6: UI Components

We will build the interface using a modern React stack (Next.js) heavily leveraging the following ecosystem:

1. **shadcn/ui:**
   - *Why:* Unstyled, accessible primitives that we control entirely. Perfect for building a custom, premium design system without overriding bloated library styles.
2. **Magic UI:**
   - *Why:* For high-end marketing site animations (e.g., animated grid backgrounds, marquee logos, glowing borders). It saves days of custom SVG animation work.
3. **Aceternity UI:**
   - *Why:* For complex, interactive "hero" components like 3D cards, text reveals, and tracing beams. Elevates the visual feel to "Vercel-tier."
4. **21st.dev:**
   - *Why:* To source ultra-specific, micro-interactions and polished UI snippets from top designers.
5. **Framer Motion:**
   - *Why:* The engine powering all the above. Essential for layout transitions, exit animations, and complex orchestrated scrolls.
6. **Tailwind components:**
   - *Why:* Rapid layout composition using strict utility classes mapping to our design system.
7. **Lucide icons:**
   - *Why:* Clean, consistent, stroke-based icons that look excellent at 16px and 24px sizes. Highly customizable stroke widths.

---

## Part 7: User Journey

**Map of the ideal visitor flow:**

- **Engineer:**
  - *10 seconds:* Sees "Deterministic workflows" and a code snippet. Understands this isn't just an API wrapper.
  - *30 seconds:* Scans the Architecture and Dev Experience sections. Sees Action SDK.
  - *2 minutes:* Clicks "Read the Docs" or copies the `npm install` command.

- **CTO / VP Engineering:**
  - *10 seconds:* Sees "Orchestrate AI with Enterprise Precision" and the SOC2 badge. Understands it's safe.
  - *30 seconds:* Reads about Human-in-the-loop and Scoped Memory. Realizes this solves their governance problem.
  - *2 minutes:* Reviews the Security section and clicks "Book a Demo".

- **Founder (Startup):**
  - *10 seconds:* "Control plane for AI agents". Realizes this can accelerate their own product roadmap.
  - *30 seconds:* Watches the demo video. Sees how easy it is to build an agent.
  - *2 minutes:* Goes to the open-source repo to star it and try it locally.

- **Investor:**
  - *10 seconds:* Notes the premium design, clear problem statement (unbounded AI is dangerous), and enterprise focus.
  - *30 seconds:* Scans the logos, team/repo momentum, and reads the "Enterprise Features".
  - *2 minutes:* Understands the massive TAM (infrastructure for all AI) and reaches out via email.

- **Recruiter (or Candidate):**
  - *10 seconds:* Sees a beautiful, cutting-edge site. "This is a serious, well-funded team."
  - *30 seconds:* Looks at the stack and architecture. Thinks, "They are working on hard problems."
  - *2 minutes:* Checks the careers page or reaches out.

---

## Part 8: Content Strategy

- **Section headlines:** (See Part 2)
- **Micro-copy:**
  - Under input fields: `Press ⌘+K to search workflows`
  - On hover tooltips: `Cryptographically signed by [User]`
  - On loading states: `Verifying policy rules...`
- **Button text:** Action-oriented.
  - Not "Submit" -> "Approve Workflow"
  - Not "Next" -> "Preview Execution"
  - Not "Learn More" -> "Read the Architecture Docs"
- **Feature titles:** Short, noun-heavy. (e.g., "Scoped Memory Engine", "Immutable Audit Trail").
- **Call-to-actions:** Clear and deterministic. `Start Building`, `Book Enterprise Demo`, `View GitHub Repository`.
- **Marketing copy:** Avoid words like "Magic", "Revolutionary", "Next-Gen", "Seamless", "Synergy".
- **Technical copy:** Use precise terms. "Directed Acyclic Graph (DAG)", "Idempotency", "Event Sourcing", "Type Safety".

**Rule:** Everything should feel human, but built by an expert engineer. "We handle the DAG resolution, so you can focus on your business logic."

---

## Part 9: Social Proof

- **Metrics:**
  - `10ms avg latency overhead`
  - `99.99% policy evaluation uptime`
  - `Zero unauthorized executions`
- **Benchmarks:** A small, elegant table comparing IntentGraph to raw LLM execution (showing our 100% schema validation rate vs ~85% raw).
- **Badges:** SOC2 Type II (planned), GDPR Compliant, End-to-End Encrypted.
- **GitHub stars section:** Live counter fetching current stars. "Trusted by X developers."
- **Technology logos:** Displaying integrations. "Works with: GitHub, Slack, AWS, Postgres, Temporal." Minimalist, monochrome logos.
- **Enterprise trust indicators:** "Deployed in HIPAA-compliant environments." "VPC peering available."
- **Testimonials Structure:**
  - **The Metric:** "IntentGraph reduced our unauthorized API calls to zero."
  - **The Quote:** Brief description of the relief the product brought to the engineering team.
  - **The Person:** Avatar, Name, Title (e.g., Staff Engineer), Company Logo.

---

## Part 10: Assets to Create

**Dashboard screenshots:**
1. Intent Planner Interface (Dark mode, neon syntax highlighting).
2. Human-in-the-loop Approval Queue (Pending items, rich diffs).
3. Audit Log Stream (Dense information, monospace font).
4. Settings / Policy Editor.

**GIFs / Micro-videos:**
1. Typing an intent -> Graph generating in real-time.
2. Clicking "Approve" -> Workflow executing rapidly.

**CLI demos:**
1. SVG animation (using Asciinema/Termsvg) of `intentgraph plan "Deploy new database"` showing policy check output in terminal.

**Architecture diagrams:**
1. High-level data flow (User -> Planner -> Executor -> Actions). Isometric, glowing paths.

**Workflow diagrams:**
1. A zoomed-in view of a DAG with nodes lighting up as they execute.

**Animated SVGs:**
1. The background hero graphic.
2. Icon micro-interactions (hover states for the bento box).

**Icons:**
1. Custom, stroke-based iconography for the Action SDK connectors.

**Branding:**
1. **OpenGraph image:** Striking, dark background, the IntentGraph logo glowing, simple bold text.
2. **Logo:** A minimal, geometric mark (perhaps a stylized 'I' forming a node in a graph).
3. **Favicon:** Clean, legible at 16x16, white logo on black background.

---

## Part 11: Design System

- **Color tokens:**
  - `--bg-base`: `#000000`
  - `--bg-surface`: `#0A0A0A`
  - `--bg-elevated`: `#141414`
  - `--border-subtle`: `#222222`
  - `--text-primary`: `#EDEDED`
  - `--text-muted`: `#888888`
  - `--accent-primary`: `#5E6AD2`
  - `--accent-glow`: `rgba(94, 106, 210, 0.4)`
  - `--status-success`: `#10B981`
  - `--status-warning`: `#F59E0B`
  - `--status-danger`: `#EF4444`

- **Border radius:**
  - Small elements (buttons, inputs): `6px` (Slightly rounded, still sharp)
  - Containers (cards, modals): `12px`

- **Spacing:**
  - `4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px, 128px`

- **Typography scale:**
  - `xs`: 12px
  - `sm`: 14px
  - `base`: 16px
  - `lg`: 18px
  - `xl`: 24px
  - `2xl`: 32px
  - `3xl`: 48px
  - `4xl`: 64px
  - `5xl`: 80px (Hero only)

- **Grid:** 12-column CSS Grid. `gap-6` (24px) default.

- **Container widths:**
  - Main marketing wrapper: `max-w-7xl` (1280px)
  - Reading content: `max-w-3xl` (768px)

- **Responsive breakpoints:**
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px

- **Animation timings:**
  - Fast (micro-interactions): `150ms ease-out`
  - Medium (page transitions): `300ms cubic-bezier(0.4, 0, 0.2, 1)`
  - Slow (hero background): `20s linear infinite`

---

## Part 12: Output Synthesis

### Complete Sitemap
- `/` (Home)
- `/product` (Deep dive into architecture)
- `/pricing` (SaaS and Enterprise tiers)
- `/docs` (Technical documentation portal)
- `/changelog` (Product updates)
- `/company/about`
- `/company/careers`
- `/legal/privacy`
- `/legal/terms`

### Complete Landing Page Outline
1. Navigation Bar (Sticky, glass effect)
2. Hero Section (Badge, Headline, Actions, Abstract visualization)
3. Logos (Trusted by / Integrated with)
4. Problem Statement (The danger of untrusted AI)
5. Solution (The orchestration engine)
6. Feature Bento Box (8 Core Primitives)
7. How it Works (4-step scrollytelling)
8. CLI & Developer Experience (Terminal view, SDK)
9. Enterprise & Security (SOC2, RBAC, SSO)
10. Final CTA
11. Footer

### Component Hierarchy
```text
<Layout>
  <Navbar />
  <main>
    <Hero>
      <Badge />
      <Typography variant="h1" />
      <ButtonGroup>
        <Button variant="primary" />
        <Button variant="ghost" />
      </ButtonGroup>
      <HeroBackgroundAnimation />
    </Hero>
    <LogoMarquee />
    <SectionLayout id="problem"> ... </SectionLayout>
    <SectionLayout id="features">
      <BentoGrid>
        <BentoCard /> {/* x8 */}
      </BentoGrid>
    </SectionLayout>
    <SectionLayout id="how-it-works"> ... </SectionLayout>
    <SectionLayout id="dev-experience">
      <CodeBlockTabs />
    </SectionLayout>
    <SectionLayout id="cta"> ... </SectionLayout>
  </main>
  <Footer />
</Layout>
```

### Section Hierarchy
- H1: Orchestrate AI with Enterprise Precision
  - H2: Agents are powerful. Unbounded agents are dangerous.
  - H2: Deterministic execution for non-deterministic intelligence.
  - H2: Primitives built for production.
    - H3: Paused for Approval
    - H3: Preview Before Execute
    - H3: Scoped Memory Engine
    - H3: Immutable Audit Trail
    - H3: Typed Outputs Only
    - H3: Universal Connectors
    - H3: Graceful Rollbacks
    - H3: Guardrails by Default
  - H2: A joy to integrate.
  - H2: Scale your autonomy.
  - H2: Start orchestrating today.

### Wireframe Description
The page begins dark, almost entirely black, with a central glowing point of interaction in the hero. As the user scrolls, sections fade in from the bottom. The content is centrally aligned for narrative sections, and expands to full-width bento grids for features. Code snippets use a dark IDE theme. Buttons are pill-shaped but with minimal rounding (`radius-md`). The overall vibe is "Terminal meets high-end magazine."

### Design System & Brand Guide
See **Part 1**, **Part 5**, and **Part 11** for exact specifications. Strict adherence to the `Inter` font family and the monochromatic + indigo palette.

### Animation Plan
1. **On Load:** Navbar fades in. Hero text reveals line by line. Background graph softly illuminates.
2. **On Scroll:** Sections fade up (`translateY(20px)` to `0`, opacity `0` to `1`).
3. **Hover States:** Cards receive a 1px border glow. Buttons scale to `0.98`.
4. **Interactive:** Terminal typing effect loops on the CLI section. Code blocks allow one-click copy.

### Asset Checklist
- [ ] Logo (SVG, Dark/Light variants)
- [ ] Favicon (ico/png)
- [ ] OpenGraph Social Banner (1200x630)
- [ ] Hero Background Animation (Lottie/Rive or React Canvas)
- [ ] 8x Feature Icons (Lucide optimized)
- [ ] 3x Dashboard UI Mockup PNGs (Retina)
- [ ] 1x Demo Video (MP4, optimized, 60s max)
- [ ] Architecture Diagram (SVG)

### Developer Handoff Checklist
- [ ] Next.js boilerplate initialized with App Router.
- [ ] Tailwind CSS configured with custom color tokens and spacing.
- [ ] shadcn/ui initialized and customized to match border-radius/colors.
- [ ] Fonts (Inter/JetBrains Mono) loaded locally to prevent layout shift.
- [ ] Framer Motion installed.
- [ ] All SVGs optimized using SVGO.
- [ ] Mobile responsive testing strategy defined.
- [ ] Accessibility (a11y) pass on contrast ratios and aria-labels.
