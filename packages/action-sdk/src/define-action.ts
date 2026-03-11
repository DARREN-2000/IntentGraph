import type {
  ActionContext,
  ActionResult,
  RiskLevel,
  EffectCategory,
} from '@intentgraph/workflow-spec';
import { ActionPlugin } from '@intentgraph/workflow-spec';

/**
 * Options for defining an action plugin.
 */
export interface DefineActionOptions<I, O> {
  /** Unique action key */
  key: string;
  /** Risk classification */
  risk: RiskLevel;
  /** Effect categories this action produces */
  effects: EffectCategory[];
  /** Human-readable description */
  description: string;
  /** Preview what the action would do */
  preview: (ctx: ActionContext, input: I) => Promise<ActionResult<O>>;
  /** Execute the action */
  execute: (ctx: ActionContext, input: I) => Promise<ActionResult<O>>;
  /** Reverse the action */
  compensate?: (ctx: ActionContext, payload: unknown) => Promise<void>;
}

/**
 * Create a type-safe action plugin.
 *
 * @example
 * ```ts
 * const sendEmail = defineAction<EmailInput, EmailOutput>({
 *   key: 'gmail.send_draft',
 *   risk: 'medium',
 *   effects: ['external-communication'],
 *   description: 'Send an email draft via Gmail',
 *   async preview(ctx, input) {
 *     return { ok: true, preview: { to: input.to, subject: input.subject } };
 *   },
 *   async execute(ctx, input) {
 *     const messageId = await gmail.send(input);
 *     return {
 *       ok: true,
 *       output: { messageId },
 *       compensation: { action: 'gmail.delete_message', payload: { messageId } },
 *     };
 *   },
 *   async compensate(ctx, payload) {
 *     await gmail.trash((payload as any).messageId);
 *   },
 * });
 * ```
 */
export function defineAction<I = unknown, O = unknown>(
  options: DefineActionOptions<I, O>,
): ActionPlugin<I, O> {
  return {
    key: options.key,
    risk: options.risk,
    effects: options.effects,
    description: options.description,
    preview: options.preview,
    execute: options.execute,
    compensate: options.compensate,
  };
}
