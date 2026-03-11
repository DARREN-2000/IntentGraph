# Prompts

This directory contains versioned prompt templates used by the agent plane.

All prompts must be:
- Version controlled
- Parameterized (no hardcoded user data)
- Reviewed before deployment
- Tested via eval cases

## Structure

```
prompts/
  system/           # System prompts for different agent roles
  planner/          # Planner agent prompts
  risk-analysis/    # Risk classification prompts
  summarization/    # Output summarization prompts
```
