# IntentGraph

## Mission
Build a multi-tenant action OS that turns natural-language goals into trusted workflows.

## Architecture rules
- Every side-effecting action must implement preview(), execute(), and compensate().
- Never let an LLM call third-party APIs directly.
- All LLM outputs must be validated by typed schemas.
- All workflow runs must emit audit events.
- All risky actions must pass policy_check() before execution.
- Prefer direct APIs over browser automation.
- Browser automation is fallback only.
- Separate personal, org, and project memory scopes.
- Do not put authorization logic into prompts.
- Keep prompts versioned in /packages/prompts.

## Code quality rules
- Add unit tests for every action plugin.
- Add integration tests for every connector.
- No untyped JSON blobs in public interfaces.
- Use idempotency keys for every write action.
- Use feature flags for new connectors and automations.

## Product rules
- Preview before execute.
- Human approval for delete, spend, provision, or external send.
- Explain what will happen in plain language before acting.
