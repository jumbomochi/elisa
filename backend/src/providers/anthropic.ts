/** Anthropic provider — wraps @anthropic-ai/sdk and claude-agent-sdk behind LLMProvider. */

import Anthropic from '@anthropic-ai/sdk';
import { query } from '@anthropic-ai/claude-agent-sdk';
import type {
  LLMProvider,
  ChatCompletionRequest,
  ChatCompletionResponse,
  AgentExecuteParams,
} from './types.js';
import type { AgentResult } from '../models/session.js';
import { getAnthropicClient } from '../utils/anthropicClient.js';

export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic';

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const client = getAnthropicClient();

    // Separate system message from conversation messages
    const systemMessages = request.messages.filter(m => m.role === 'system');
    const conversationMessages = request.messages.filter(m => m.role !== 'system');
    const systemPrompt = systemMessages.map(m => m.content).join('\n\n') || undefined;

    const response = await client.messages.create(
      {
        model: request.model,
        system: systemPrompt,
        messages: conversationMessages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        max_tokens: request.maxTokens,
      },
      request.signal ? { signal: request.signal } : undefined,
    );

    const text = response.content.find(b => b.type === 'text');
    return {
      text: text?.text ?? '',
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
    };
  }

  async executeAgent(params: AgentExecuteParams): Promise<AgentResult> {
    const mcpConfig = params.mcpServers?.length
      ? Object.fromEntries(params.mcpServers.map(s => [s.name, {
          command: s.command,
          ...(s.args ? { args: s.args } : {}),
          ...(s.env ? { env: s.env } : {}),
        }]))
      : undefined;

    const conversation = query({
      prompt: params.prompt,
      options: {
        cwd: params.workingDir,
        model: params.model,
        maxTurns: params.maxTurns,
        permissionMode: 'bypassPermissions',
        systemPrompt: params.systemPrompt,
        ...(params.allowedTools ? { allowedTools: params.allowedTools } : {}),
        ...(mcpConfig ? { mcpServers: mcpConfig } : {}),
        ...(params.abortController ? { abortController: params.abortController } : {}),
      },
    });

    let costUsd = 0;
    let inputTokens = 0;
    let outputTokens = 0;
    let finalResult = '';
    let success = true;
    const accumulatedText: string[] = [];

    for await (const message of conversation) {
      if (message.type === 'assistant') {
        for (const block of (message as any).message?.content ?? []) {
          if (block.type === 'text') {
            accumulatedText.push(block.text);
            params.onOutput(params.taskId, block.text).catch(() => {});
          }
        }
      }

      if (message.type === 'result') {
        const result = message as any;
        costUsd = result.total_cost_usd ?? 0;
        inputTokens = result.usage?.input_tokens ?? 0;
        outputTokens = result.usage?.output_tokens ?? 0;

        if (result.subtype === 'success') {
          finalResult = result.result ?? '';
        } else {
          success = false;
          const errors: string[] = result.errors ?? [];
          finalResult = errors.join('; ')
            || accumulatedText.slice(-3).join('\n')
            || 'Unknown error';
        }
      }
    }

    const summary = finalResult || accumulatedText.slice(-3).join('\n') || 'No output';
    return { success, summary, costUsd, inputTokens, outputTokens };
  }

  async healthCheck() {
    // Check Agent SDK
    let agentSdk: 'available' | 'not_found' = 'not_found';
    try {
      await import('@anthropic-ai/claude-agent-sdk');
      agentSdk = 'available';
    } catch {
      // not installed
    }

    // Check API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return { apiKey: 'missing' as const, agentSdk };
    }

    try {
      await new Anthropic().models.list({ limit: 1 });
      return { apiKey: 'valid' as const, agentSdk };
    } catch (err: any) {
      return { apiKey: 'invalid' as const, agentSdk, error: err.message ?? String(err) };
    }
  }
}
