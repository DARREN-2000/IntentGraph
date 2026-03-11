/**
 * Planner Service
 *
 * Takes natural-language intent and compiles it into a WorkflowSpec.
 * Uses LLM for reasoning, then validates the output against typed schemas.
 *
 * Architecture:
 * 1. Router agent: classifies intent domain
 * 2. Context agent: gathers relevant data
 * 3. Planner agent: generates WorkflowSpec
 * 4. Critic agent: validates and scores the plan
 */

export {};
