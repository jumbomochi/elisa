/** Runs individual AI agents via the configured LLM provider.
 *
 * Delegates to the active provider (Anthropic Claude Agent SDK or Ollama
 * custom tool-calling loop) for agentic execution.
 */

import type { AgentResult } from '../models/session.js';
import { withTimeout } from '../utils/withTimeout.js';
import { MAX_TURNS_DEFAULT } from '../utils/constants.js';
import { getLLMProvider } from '../providers/index.js';
import { getCodeModel } from '../providers/models.js';

export interface AgentRunnerParams {
  taskId: string;
  prompt: string;
  systemPrompt: string;
  onOutput: (taskId: string, content: string) => Promise<void>;
  onQuestion?: (
    taskId: string,
    payload: Record<string, any>,
  ) => Promise<Record<string, any>>;
  workingDir: string;
  timeout?: number;
  model?: string;
  maxTurns?: number;
  mcpServers?: Array<{ name: string; command: string; args?: string[]; env?: Record<string, string> }>;
  allowedTools?: string[];
  abortSignal?: AbortSignal;
}

export class AgentRunner {
  async execute(params: AgentRunnerParams): Promise<AgentResult> {
    const {
      taskId,
      prompt,
      systemPrompt,
      onOutput,
      workingDir,
      timeout = 300,
      model = getCodeModel(),
      maxTurns = MAX_TURNS_DEFAULT,
      mcpServers,
      allowedTools,
    } = params;

    const abortController = new AbortController();

    if (params.abortSignal) {
      if (params.abortSignal.aborted) {
        abortController.abort();
      } else {
        params.abortSignal.addEventListener('abort', () => abortController.abort(), { once: true });
      }
    }

    try {
      const provider = getLLMProvider();
      return await withTimeout(
        provider.executeAgent({
          taskId,
          prompt,
          systemPrompt,
          onOutput,
          workingDir,
          model,
          maxTurns,
          mcpServers,
          allowedTools,
          abortController,
        }),
        timeout * 1000,
      );
    } catch (err: any) {
      // Ensure the agent is aborted on timeout or any error
      abortController.abort();
      if (err.message === 'Timed out') {
        return {
          success: false,
          summary: `Agent timed out after ${timeout} seconds`,
          costUsd: 0,
          inputTokens: 0,
          outputTokens: 0,
        };
      }
      return {
        success: false,
        summary: String(err.message || err),
        costUsd: 0,
        inputTokens: 0,
        outputTokens: 0,
      };
    }
  }
}
