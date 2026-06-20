# IntentGraph: Brand & Product Experience Strategy

*This document defines the premium product positioning, visual identity, and user experience for the IntentGraph launch, mirroring the craftsmanship of tools like Linear, Vercel, and Raycast.*

---

## PART 1: PRODUCT BRAND

**Product Name:** **IntentGraph** (Keep the name. It accurately reflects the technical foundation—graphs of intent—while sounding authoritative and enterprise-ready. It feels like a foundational piece of infrastructure).

**Tagline:** The orchestration engine for enterprise AI agents.

**Elevator Pitch:** IntentGraph bridges the gap between natural language goals and trusted execution. It is a multi-tenant action OS that gives AI agents the ability to plan, seek human approval, and execute complex workflows securely across your entire infrastructure.

**One Sentence:** Turn agentic intent into deterministic, observable, and policy-gated workflows.

**Three Sentence Story:** AI agents are brilliant at reasoning, but dangerous when handed the keys to production. IntentGraph provides the missing trust layer: an orchestration engine that turns raw LLM outputs into typed, previewable workflows. With built-in human-in-the-loop approvals, scoped memory, and immutable audit trails, you can finally let AI execute safely at enterprise scale.

**Brand Personality:**
*   **Authoritative:** We understand distributed systems, security, and the reality of enterprise infrastructure.
*   **Precise:** No magic, no black boxes. Everything is deterministic, typed, and observable.
*   **Restrained:** We let the technology speak for itself. Minimalist, uncluttered, high signal-to-noise ratio.
*   **Empowering:** We give engineers the confidence to build agentic systems without fear of catastrophic side effects.

**Voice:** Direct, technical, confident, and clear.
**Tone:** Like a senior staff engineer explaining a highly elegant architectural solution. Zero hype, zero fluff. We use terms like "deterministic," "idempotent," and "schema-validated."

---

## PART 2: LANDING PAGE STRUCTURE

### 1. Hero
*   **Purpose:** Immediate value proposition and technical credibility. Hook the visitor in 3 seconds.
*   **Headline:** Ship agentic workflows. Safely.
*   **Copy Direction:** Focus on the "trust layer" and "orchestration." It's not about making the AI smarter; it's about making the execution safe.
*   **Visual Idea:** A high-fidelity, animated, dark-mode terminal window overlapping a beautiful node-based graph. The terminal shows a natural language prompt, instantly expanding into a structured JSON workflow, hitting a "WAITING_APPROVAL" state.

### 2. Social Proof & Trust
*   **Purpose:** Establish immediate enterprise credibility.
*   **Headline:** (Hidden visually, structural only)
*   **Copy Direction:** "Trusted by engineering teams at..."
*   **Visual Idea:** A subtle, grayscale, slowly scrolling marquee of top-tier engineering logos (e.g., Vercel, Stripe, Supabase style).

### 3. The Problem
*   **Purpose:** Resonate with the pain of engineers building AI apps.
*   **Headline:** AI is non-deterministic. Infrastructure is not.
*   **Copy Direction:** Explain the gap. Agents hallucinate API calls. They lack context. They do irreversible things. The current stack forces you to build fragile wrappers.
*   **Visual Idea:** A split screen. On the left, a chaotic, unmanaged "spaghetti" diagram of LLM API calls. On the right, the clean, ordered, gated IntentGraph pipeline.

### 4. The Solution (How it Works)
*   **Purpose:** The "Aha!" moment. Explain the architecture.
*   **Headline:** The trust layer for autonomous execution.
*   **Copy Direction:** Walk through the pipeline: Intent -> Planner -> Schema Validation -> Policy Gate -> Executor -> Audit.
*   **Visual Idea:** An interactive, step-by-step animated diagram (similar to Stripe's payment flow graphics) where the user can scrub through a workflow's lifecycle.

### 5. Features (Bento Box Grid)
*   **Purpose:** Highlight the core primitives.
*   **Headline:** Primitives for production AI.
*   **Copy Direction:** Concise, technical, feature-focused.
*   **Visual Idea:** A clean "Bento Box" grid of 8 cards. Glassmorphism, subtle borders, high-contrast iconography.

### 6. Developer Experience (DX)
*   **Purpose:** Win over the engineers who will actually integrate this.
*   **Headline:** Designed for the command line and the IDE.
*   **Copy Direction:** Highlight the CLI, the TypeScript/Python SDKs, local Docker development, and robust type safety.
*   **Visual Idea:** A beautifully syntax-highlighted code snippet showing how easy it is to define a custom action with `preview()`, `execute()`, and `compensate()`. Tabbed interface for CLI vs. SDK.

### 7. Security & Compliance (Enterprise)
*   **Purpose:** Unblock procurement and CTO approval.
*   **Headline:** Enterprise-grade by default.
*   **Copy Direction:** Focus on multi-tenancy, immutable audit logs, RBAC, and policy-as-code.
*   **Visual Idea:** A dashboard mockup showing an "Approval Queue" with a detailed audit trail of an agent's proposed action (e.g., dropping a table), requiring an admin's cryptographic signature.

### 8. Use Cases
*   **Purpose:** Ground the abstract tech in reality.
*   **Headline:** What will you orchestrate?
*   **Copy Direction:** Infrastructure provisioning, autonomous customer support resolution, secure data pipelining.
*   **Visual Idea:** Interactive terminal simulations of different scenarios.

### 9. Documentation & Resources
*   **Purpose:** Show that the product is real and ready to use.
*   **Headline:** Read the docs.
*   **Copy Direction:** "Start building locally in 5 minutes."
*   **Visual Idea:** A sneak peek at beautifully structured documentation pages (mintlify or nextra style).

### 10. CTA (Call to Action)
*   **Purpose:** Conversion.
*   **Headline:** Start orchestrating today.
*   **Copy Direction:** Clear next steps.
*   **Visual Idea:** Clean, centered typography. A primary button and a secondary CLI copy-to-clipboard command.

### 11. Footer
*   **Purpose:** Navigation and secondary links.
*   **Visual Idea:** Minimalist, multi-column. GitHub, Discord, Twitter, Status, Privacy, Terms.

---

## PART 3: HERO SECTION

*   **Announcement Badge:** `[Pill] v1.0 is live: Introducing the IntentGraph CLI →`
*   **Headline:** The orchestration engine for enterprise AI.
*   **Supporting Paragraph:** Turn natural language goals into deterministic, policy-gated workflows. IntentGraph is the open-source trust layer that safely connects LLMs to your infrastructure with built-in human approvals and immutable audit trails.
*   **Primary CTA:** `[Button] Start Building`
*   **Secondary CTA:** `[Terminal Box] npm install @intentgraph/sdk [Copy Icon]`
*   **Background Illustration Ideas:** A deeply abstract, glowing, animated dependency graph. Nodes subtly pulse as "intents" travel through edges, passing through a "gate" (approval) before reaching the destination. The aesthetic is dark, with electric blue and sharp white highlights.
*   **Animation Ideas:** The headline text reveals with a subtle upward fade. The background graph draws itself on page load. The terminal box cursor blinks.
*   **Mockup Ideas:** A floating, slightly skewed perspective of the Web Dashboard (dark mode) overlapping a terminal window running the IntentGraph CLI. The dashboard shows a "Pending Approval" screen for a high-risk action.

---

## PART 4: FEATURE CARDS (BENTO BOX)

**Card 1: Preview-First Architecture**
*   **Title:** Preview Before Execution
*   **Description:** Every action computes a deterministic preview of its side effects before running.
*   **Business Value:** Zero surprises. Stakeholders know exactly what will change.
*   **Technical Value:** Implement `preview()` alongside `execute()` to guarantee dry-run capabilities.
*   **Icon:** `Eye` (Lucide)
*   **Visual:** A mini diff-view showing "Before" and "After" states of a JSON payload.

**Card 2: Policy & Approval Gates**
*   **Title:** Human-in-the-Loop Gates
*   **Description:** Pause execution for human sign-off on risky actions like spend or deletion.
*   **Business Value:** Mitigates risk of catastrophic AI failures.
*   **Technical Value:** Rules-engine integration for role-based access control (RBAC).
*   **Icon:** `ShieldCheck` (Lucide)
*   **Visual:** A pulsing yellow "Waiting for Approval" badge next to a user avatar.

**Card 3: Schema Validation**
*   **Title:** Strict Type Validation
*   **Description:** LLM outputs are cast into strict schemas. Invalid outputs are rejected before execution.
*   **Business Value:** Reliability. The system doesn't break when the AI hallucinates.
*   **Technical Value:** Pydantic/Zod integration at the runtime layer. No untyped blobs.
*   **Icon:** `Code2` (Lucide)
*   **Visual:** A glowing green checkmark next to a perfectly indented JSON schema.

**Card 4: Immutable Audit Trails**
*   **Title:** Cryptographic Audit Log
*   **Description:** Every state transition, approval, and execution is permanently recorded.
*   **Business Value:** Compliance (SOC2) ready. Total transparency.
*   **Technical Value:** Append-only event sourcing for all workflow runs.
*   **Icon:** `Database` (Lucide)
*   **Visual:** A scrolling timeline of terminal-style log entries with timestamps and event hashes.

**Card 5: Compensation Logic**
*   **Title:** Automated Rollbacks
*   **Description:** If a multi-step workflow fails, IntentGraph automatically runs compensation actions to revert state.
*   **Business Value:** Prevents broken infrastructure states and partial executions.
*   **Technical Value:** Saga pattern implemented natively. Just write `compensate()`.
*   **Icon:** `Undo2` (Lucide)
*   **Visual:** A progress bar hitting a red error, then smoothly reversing direction and turning gray.

**Card 6: Scoped Memory**
*   **Title:** Multi-Tenant Memory
*   **Description:** Agents access context scoped strictly to the user, organization, or project.
*   **Business Value:** Data privacy and isolation guaranteed.
*   **Technical Value:** Tenant-aware vector storage and graph context retrieval.
*   **Icon:** `Layers` (Lucide)
*   **Visual:** Three distinct, unconnected clusters of data nodes, highlighting isolation.

**Card 7: Idempotent Execution**
*   **Title:** Idempotent by Default
*   **Description:** Retries are safe. Executing the same workflow twice will never duplicate side effects.
*   **Business Value:** System resilience during network failures or API outages.
*   **Technical Value:** Built-in idempotency key generation and caching.
*   **Icon:** `RefreshCw` (Lucide)
*   **Visual:** A looping animation where a duplicate request hits a cache barrier and returns "Already Executed."

**Card 8: Bring Your Own Models**
*   **Title:** Model Agnostic
*   **Description:** Swap between OpenAI, Anthropic, or local OSS models without rewriting your workflows.
*   **Business Value:** Avoid vendor lock-in and optimize for cost/latency.
*   **Technical Value:** Standardized provider interfaces.
*   **Icon:** `Cpu` (Lucide)
*   **Visual:** Logos of major AI models morphing smoothly into one another.

---

## PART 5: VISUAL DESIGN

*   **Typography:**
    *   *Headings:* Geist (Vercel) or Inter. Tight tracking, strong weights.
    *   *Body:* Geist or Inter. High legibility.
    *   *Monospace:* JetBrains Mono or Geist Mono. Critical for a dev tool.
*   **Spacing System:** Strict 4px/8px baseline grid. Generous white space between sections. High density within technical components.
*   **Color Palette:**
    *   *Background:* Pitch Black (`#000000`) to Deep Charcoal (`#0A0A0A`).
    *   *Primary Text:* Pure White (`#FFFFFF`) or Off-White (`#EDEDED`).
    *   *Secondary Text:* Slate (`#888888`).
    *   *Accents:* Electric Blue (`#0070F3` - Vercel style) or a crisp, glowing Emerald Green (`#10B981`) for "success/execution."
    *   *Warnings:* Amber (`#F59E0B`) for "Pending Approval."
*   **Gradients:** Very subtle, large, blurred radial gradients in the background to create depth (e.g., a faint blue glow behind the hero section). Avoid loud, multi-color gradients.
*   **Shadows:** In dark mode, shadows are less about drop shadows and more about subtle inner borders (`1px solid rgba(255,255,255,0.1)`) and multi-layered glows.
*   **Card Design:** Glassmorphism. Dark translucent backgrounds (`rgba(20,20,20,0.6)`), blurred backdrops (`backdrop-blur-md`), and a crisp `1px` white semi-transparent border.
*   **Button Design:**
    *   *Primary:* Solid white background, black text. High contrast, impossible to miss.
    *   *Secondary:* Transparent background, `1px` border, subtle hover state (background fades to 10% white).
*   **Animations:** Linear, swift, physical. Use spring physics, not ease-in-out. Animations should feel like an operating system, not a cartoon. Staggered reveals on scroll.
*   **Glass Effects:** Used sparingly on navigation bars and floating elements to maintain context while scrolling.
*   **Dark/Light Mode:** Default to Dark Mode. It signals "developer tool." Light mode should be high-contrast (pure white background, pitch black text).

---

## PART 6: UI COMPONENTS

*   **shadcn/ui:** The foundational layer. Provides accessible, headless primitives (Radix) styled beautifully with Tailwind. Perfect for buttons, cards, dialogs, and form inputs. It ensures a premium, cohesive feel without writing CSS from scratch.
*   **Framer Motion:** Essential for the physical, spring-based animations, layout transitions (e.g., expanding a workflow card), and scroll-linked background effects.
*   **Magic UI / Aceternity UI:** Use sparingly for high-impact hero animations or complex background effects (like a glowing beam or animated grid). Do not overuse, or it will feel like a template. We only want their "Bento Grid" or "Terminal" components.
*   **Lucide Icons:** The industry standard for clean, consistent, readable SVG iconography. Matches the "Linear" aesthetic perfectly.
*   **Tailwind CSS:** The engine for the design system. Enforces the spacing, typography, and color tokens cleanly.

---

## PART 7: USER JOURNEY

**1. The Engineer (Primary Persona)**
*   *10 seconds:* Sees terminal, sees code, understands it's a developer tool for AI. Reads "deterministic."
*   *30 seconds:* Looks at the DX section. Sees the SDK. Realizes this solves the nightmare of writing brittle LLM orchestration code.
*   *2 minutes:* Reading the docs or running the `npm install` command. Checking GitHub stars.

**2. The CTO / VP of Engineering (Buyer)**
*   *10 seconds:* Sees "enterprise," "orchestration," and "safe." Validates it's not a toy.
*   *30 seconds:* Scrolls to Security & Policy gates. Sees "Audit Trails" and "Human-in-the-loop."
*   *2 minutes:* Looking at Architecture diagrams and Deployment Paths (VPC, K8s).

**3. The Founder (Visionary)**
*   *10 seconds:* Realizes this is the missing piece to launch their AI feature to enterprise customers.
*   *30 seconds:* Looks at Use Cases and Speed to Market.
*   *2 minutes:* Clicking the "Live Demo" to see the UX they can provide to their users.

**4. The Investor (Validator)**
*   *10 seconds:* Checks the design quality (looks like a unicorn). Reads the "Stripe for AI Orchestration" vibe.
*   *30 seconds:* Checks social proof (logos, GitHub stars).
*   *2 minutes:* Digging into the team's background (via GitHub profiles) and the open-source traction.

---

## PART 8: CONTENT STRATEGY

**Micro-copy:**
*   *Instead of "Loading...", use:* `Compiling workflow graph...`
*   *Instead of "Error", use:* `Policy violation: Unauthorized action.`
*   *Instead of "Submit", use:* `Initialize Intent`

**Button Text:**
*   Primary: `Read the Docs` or `Start Building`
*   Secondary: `View on GitHub`
*   Interactive: `Approve Execution`, `View Audit Log`, `Simulate Run`

**Marketing Copy:**
*   "Don't let your AI write checks your infrastructure can't cash."
*   "The missing OS for autonomous agents."
*   "Ship AI features that enterprise compliance teams will actually approve."

**Technical Copy:**
*   "IntentGraph leverages directed acyclic graphs (DAGs) to map natural language intents to strictly typed, idempotent execution paths."
*   "Built on a foundation of event sourcing and saga patterns for guaranteed compensation on failure."

---

## PART 9: SOCIAL PROOF

*   **Metrics (Above the fold):** `10M+ Workflows Executed` | `99.99% Uptime` | `<50ms Orchestration Overhead`
*   **GitHub Badges:** A clean, minimal component showing current GitHub Stars, Forks, and an active "pulse" indicator showing recent commits (demonstrates active maintenance).
*   **Technology Logos:** Show what IntentGraph integrates with easily: AWS, GitHub, Slack, Jira, Postgres, Docker, Kubernetes.
*   **Enterprise Trust:** Badges for SOC2 Type II, GDPR Compliant, HIPAA Ready (if applicable, otherwise "Built for Compliance").
*   **Testimonials (Structure):**
    *   *Format:* Avatar, Name, Title, Company Logo.
    *   *Quote:* Must focus on *relief* from a technical pain point.
    *   *Example Structure:* "We spent months building custom guardrails for our LLM features. We ripped it all out and replaced it with IntentGraph in a weekend. Our failure rate dropped to zero." - [Staff Engineer, Series C Startup]

---

## PART 10: ASSETS TO CREATE

**Visual Asset Checklist:**
1.  **Hero Animation (WebM/SVG):** The expanding node-graph animation.
2.  **Dashboard Screens (High-Res PNGs):**
    *   The "Intent Studio" planning view.
    *   The "Approval Queue" detail view.
    *   The "Audit Log" list view.
3.  **CLI Demos (Asciinema / GIF):** Showing a user running `intentgraph run` and stepping through an approval prompt in the terminal.
4.  **Architecture Diagram (SVG):** A beautifully styled version of the text diagram in the README.
5.  **Bento Box Icons (SVG):** 8 custom or carefully selected Lucide icons.
6.  **OpenGraph Image (PNG):** 1200x630. Dark background, IntentGraph logo, and the text "The orchestration engine for enterprise AI agents."
7.  **Logo (SVG):** Needs to be sharp, geometric. Perhaps a stylized node graph forming an 'I' or a shield.
8.  **Favicon (.ico/.png):** Simplified logo mark.

---

## PART 11: DESIGN SYSTEM

*   **Color Tokens:**
    *   `--background: 0 0% 0%;`
    *   `--foreground: 0 0% 98%;`
    *   `--primary: 0 0% 98%;`
    *   `--primary-foreground: 0 0% 9%;`
    *   `--muted: 0 0% 15%;`
    *   `--border: 0 0% 12%;`
*   **Border Radius:**
    *   Buttons: `6px` (slightly rounded, technical feel).
    *   Cards/Containers: `12px` (soft enough to look modern, sharp enough to look professional).
*   **Spacing Base:** `4px`. Variables: `space-1 (4px)`, `space-2 (8px)`, `space-4 (16px)`, `space-8 (32px)`, `space-16 (64px)`.
*   **Typography Scale:**
    *   H1: `4.5rem`, `-0.02em` tracking, 700 weight.
    *   H2: `3rem`, `-0.01em` tracking, 600 weight.
    *   Body: `1.125rem`, `normal` tracking, 400 weight, `1.6` line height.
    *   Code: `0.875rem`.
*   **Container Widths:** Max width `1200px` for main content. `800px` for text-heavy sections.
*   **Responsive Breakpoints:** `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`.
*   **Animation Timings:**
    *   Fast (Hover states): `150ms ease-out`.
    *   Medium (Modals/Dropdowns): `250ms cubic-bezier(0.16, 1, 0.3, 1)`.
    *   Slow (Page loads/Hero): `600ms cubic-bezier(0.16, 1, 0.3, 1)`.

---

## PART 12: OUTPUT STRUCTURE (DEVELOPER HANDOFF)

*This structure dictates how the marketing site repository should be organized when built.*

### Complete Sitemap
*   `/` (Home)
*   `/docs` (Redirects to Documentation)
*   `/enterprise` (Sales & Compliance)
*   `/changelog` (Product Updates)
*   `/pricing` (If applicable)

### Component Hierarchy (Next.js/React)
```text
src/
  components/
    hero/
      HeroSection.tsx
      TerminalAnimation.tsx
    features/
      BentoGrid.tsx
      FeatureCard.tsx
    architecture/
      InteractiveDiagram.tsx
    shared/
      Button.tsx
      Navbar.tsx
      Footer.tsx
      CodeSnippet.tsx
```

### Developer Handoff Checklist
- [ ] Initialize Next.js 14 (App Router) + Tailwind + TypeScript.
- [ ] Install shadcn/ui and configure base theme variables (Dark mode default).
- [ ] Install Framer Motion.
- [ ] Set up Geist font via `next/font`.
- [ ] Implement Navbar and Footer layouts.
- [ ] Build Hero section with placeholder video/animation.
- [ ] Implement Bento Grid with placeholder content.
- [ ] Drop in final copy and SVG assets.
- [ ] Audit for mobile responsiveness.
- [ ] Audit for accessibility (ARIA labels, contrast ratios).
- [ ] Deploy to Vercel.
