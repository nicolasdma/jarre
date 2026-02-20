/**
 * Jarre - Voice Tutor Tool Handler
 *
 * Dispatches tool calls from Gemini Live into typed UI actions.
 * Returns the response object to send back to Gemini.
 */

import type { FunctionCall } from '@google/genai';

// ============================================================================
// Action types dispatched to the UI
// ============================================================================

export type ToolAction =
  | { type: 'SCROLL_TO'; conceptId: string }
  | { type: 'SHOW_DEFINITION'; conceptId: string; highlight?: boolean }
  | { type: 'END_SESSION'; reason: 'completed' | 'student_request' | 'time_limit' }
  | { type: 'MARK_DISCUSSED'; conceptId: string; understood: boolean };

export type ToolDispatch = (action: ToolAction) => void;

// ============================================================================
// Handler
// ============================================================================

/**
 * Process a single Gemini function call, dispatch the UI action,
 * and return the response payload to send back to Gemini.
 */
export function handleToolCall(
  call: FunctionCall,
  dispatch: ToolDispatch,
): Record<string, unknown> {
  const args = (call.args ?? {}) as Record<string, unknown>;

  switch (call.name) {
    case 'scroll_to_concept':
      dispatch({ type: 'SCROLL_TO', conceptId: args.conceptId as string });
      return { success: true };

    case 'show_definition':
      dispatch({
        type: 'SHOW_DEFINITION',
        conceptId: args.conceptId as string,
        highlight: args.highlight as boolean | undefined,
      });
      return { success: true };

    case 'end_session':
      dispatch({
        type: 'END_SESSION',
        reason: args.reason as 'completed' | 'student_request' | 'time_limit',
      });
      return { success: true };

    case 'mark_discussed':
      dispatch({
        type: 'MARK_DISCUSSED',
        conceptId: args.conceptId as string,
        understood: args.understood as boolean,
      });
      return { success: true };

    default:
      return { error: `Unknown tool: ${call.name}` };
  }
}
