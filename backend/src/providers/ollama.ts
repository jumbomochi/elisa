/** Ollama provider — uses OpenAI-compatible API for chat and a custom agent loop. */

import OpenAI from 'openai';
import type {
  LLMProvider,
  ChatCompletionRequest,
  ChatCompletionResponse,
  AgentExecuteParams,
} from './types.js';
import type { AgentResult } from '../models/session.js';
import { executeTool, TOOL_DEFINITIONS } from './tools.js';
import {
  DEFAULT_OLLAMA_URL,
  OLLAMA_TOOL_OUTPUT_CAP,
} from '../utils/constants.js';

function getOllamaUrl(): string {
  return process.env.OLLAMA_URL || DEFAULT_OLLAMA_URL;
}

function createClient(): OpenAI {
  return new OpenAI({
    baseURL: `${getOllamaUrl()}/v1`,
    apiKey: 'ollama', // Ollama doesn't need a real key but the SDK requires one
  });
}

/** Known tool names from TOOL_DEFINITIONS. */
const TOOL_NAMES = new Set(['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep']);

interface ParsedToolCall {
  name: string;
  arguments: Record<string, any>;
}

/**
 * Parse tool calls emitted as JSON text when the model doesn't use structured tool_calls.
 * Handles patterns like:
 *   {"name": "Write", "arguments": {...}}
 *   ```json\n{"name": "Write", "arguments": {...}}\n```
 * Returns parsed tool calls and any remaining non-tool text.
 */
function parseTextToolCalls(text: string): { calls: ParsedToolCall[]; remainingText: string } {
  const calls: ParsedToolCall[] = [];
  let remaining = text;

  // Match JSON objects that look like tool calls — both bare and inside code fences
  const jsonPattern = /```(?:json)?\s*\n?([\s\S]*?)```|\{[^{}]*"name"\s*:\s*"[^"]+?"[^{}]*"arguments"\s*:\s*\{[\s\S]*?\}\s*\}/g;

  const matches: { fullMatch: string; json: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = jsonPattern.exec(text)) !== null) {
    // If it's a fenced block, use the inner content; otherwise the whole match
    const json = m[1] ?? m[0];
    matches.push({ fullMatch: m[0], json });
  }

  for (const { fullMatch, json } of matches) {
    // The fenced block may contain multiple JSON objects separated by newlines
    const jsonObjects = json.split(/\n\s*\n|\n(?=\{)/).map(s => s.trim()).filter(Boolean);
    for (const obj of jsonObjects) {
      try {
        const parsed = JSON.parse(obj);
        if (parsed && typeof parsed.name === 'string' && TOOL_NAMES.has(parsed.name) && parsed.arguments) {
          calls.push({ name: parsed.name, arguments: parsed.arguments });
          remaining = remaining.replace(obj, '');
        }
      } catch {
        // Not valid JSON, skip
      }
    }
    // Also remove the code fence wrapper if we extracted calls from it
    if (calls.length > 0) {
      remaining = remaining.replace(fullMatch, '');
    }
  }

  // Clean up remaining text (remove empty fences, excessive whitespace)
  remaining = remaining.replace(/```(?:json)?\s*```/g, '').trim();

  return { calls, remainingText: remaining };
}

export class OllamaProvider implements LLMProvider {
  readonly name = 'ollama';

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const client = createClient();

    const messages: OpenAI.ChatCompletionMessageParam[] = request.messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    const response = await client.chat.completions.create(
      {
        model: request.model,
        messages,
        max_tokens: request.maxTokens,
      },
      request.signal ? { signal: request.signal } : undefined,
    );

    const text = response.choices[0]?.message?.content ?? '';
    return {
      text,
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
    };
  }

  async executeAgent(params: AgentExecuteParams): Promise<AgentResult> {
    const client = createClient();
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    const accumulatedText: string[] = [];

    if (params.mcpServers?.length) {
      console.warn('[ollama] MCP servers are not supported with local models — ignoring');
    }

    // Build initial messages
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: params.systemPrompt },
      { role: 'user', content: params.prompt },
    ];

    try {
      for (let turn = 0; turn < params.maxTurns; turn++) {
        // Check abort
        if (params.abortController?.signal.aborted) {
          return {
            success: false,
            summary: 'Agent aborted',
            costUsd: 0,
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
          };
        }

        const response = await client.chat.completions.create(
          {
            model: params.model,
            messages,
            tools: TOOL_DEFINITIONS,
          },
          params.abortController?.signal ? { signal: params.abortController.signal } : undefined,
        );

        totalInputTokens += response.usage?.prompt_tokens ?? 0;
        totalOutputTokens += response.usage?.completion_tokens ?? 0;

        const choice = response.choices[0];
        if (!choice) break;

        const assistantMessage = choice.message;

        // Check for structured tool calls first
        const hasStructuredToolCalls = assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0;

        // If no structured tool calls, try parsing text-based tool calls
        let textToolCalls: ParsedToolCall[] = [];
        let displayText = assistantMessage.content ?? '';

        if (!hasStructuredToolCalls && assistantMessage.content) {
          const parsed = parseTextToolCalls(assistantMessage.content);
          textToolCalls = parsed.calls;
          displayText = parsed.remainingText;
        }

        // Emit any non-tool text content
        if (displayText) {
          accumulatedText.push(displayText);
          params.onOutput(params.taskId, displayText).catch(() => {});
        }

        // If neither structured nor text-based tool calls, we're done
        if (!hasStructuredToolCalls && textToolCalls.length === 0) {
          break;
        }

        // --- Execute structured tool calls (OpenAI format) ---
        if (hasStructuredToolCalls) {
          messages.push(assistantMessage);

          for (const toolCall of assistantMessage.tool_calls!) {
            if (toolCall.type !== 'function') continue;
            const fn = toolCall.function;
            let toolArgs: Record<string, any>;
            try {
              toolArgs = typeof fn.arguments === 'string'
                ? JSON.parse(fn.arguments)
                : fn.arguments;
            } catch {
              toolArgs = {};
            }

            const result = await executeTool(fn.name, toolArgs, params.workingDir);

            let output = result.output;
            if (output.length > OLLAMA_TOOL_OUTPUT_CAP) {
              output = output.slice(0, OLLAMA_TOOL_OUTPUT_CAP) + '\n... (truncated)';
            }

            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: output,
            });
          }
        }

        // --- Execute text-based tool calls (fallback) ---
        if (textToolCalls.length > 0) {
          // Add the original assistant message as-is
          messages.push({ role: 'assistant', content: assistantMessage.content ?? '' });

          const toolResults: string[] = [];
          for (const call of textToolCalls) {
            const result = await executeTool(call.name, call.arguments, params.workingDir);

            let output = result.output;
            if (output.length > OLLAMA_TOOL_OUTPUT_CAP) {
              output = output.slice(0, OLLAMA_TOOL_OUTPUT_CAP) + '\n... (truncated)';
            }

            toolResults.push(`[${call.name}] ${output}`);
          }

          // Feed tool results back as a user message so the model can continue
          messages.push({
            role: 'user',
            content: `Tool results:\n${toolResults.join('\n\n')}`,
          });
        }
      }

      const summary = accumulatedText.slice(-3).join('\n') || 'No output';
      return {
        success: true,
        summary,
        costUsd: 0,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
      };
    } catch (err: any) {
      const summary = accumulatedText.slice(-3).join('\n') || err.message || String(err);
      return {
        success: false,
        summary,
        costUsd: 0,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
      };
    }
  }

  async healthCheck() {
    const url = getOllamaUrl();
    try {
      const res = await fetch(`${url}/api/tags`);
      if (!res.ok) {
        return { apiKey: 'invalid' as const, agentSdk: 'available' as const, error: `Ollama returned ${res.status}` };
      }
      const data = await res.json() as { models?: unknown[] };
      if (!data.models || data.models.length === 0) {
        return { apiKey: 'invalid' as const, agentSdk: 'available' as const, error: 'No models pulled in Ollama. Run: ollama pull qwen2.5-coder:14b' };
      }
      return { apiKey: 'valid' as const, agentSdk: 'available' as const };
    } catch (err: any) {
      return { apiKey: 'missing' as const, agentSdk: 'available' as const, error: `Cannot reach Ollama at ${url}: ${err.message}` };
    }
  }
}
