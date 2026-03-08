/** Provider abstraction interfaces for LLM backends (Anthropic, Ollama, etc.). */

import type { AgentResult } from '../models/session.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  maxTokens: number;
  /** Optional AbortSignal for cancellation. */
  signal?: AbortSignal;
}

export interface ChatCompletionResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

export interface AgentExecuteParams {
  taskId: string;
  prompt: string;
  systemPrompt: string;
  onOutput: (taskId: string, content: string) => Promise<void>;
  workingDir: string;
  model: string;
  maxTurns: number;
  mcpServers?: Array<{ name: string; command: string; args?: string[]; env?: Record<string, string> }>;
  allowedTools?: string[];
  abortController?: AbortController;
}

export interface LLMProvider {
  readonly name: string;

  /** Send a chat completion request. */
  chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;

  /** Execute an agentic tool-calling loop. */
  executeAgent(params: AgentExecuteParams): Promise<AgentResult>;

  /** Verify the provider is reachable and configured. */
  healthCheck(): Promise<{ apiKey: 'valid' | 'invalid' | 'missing'; agentSdk: 'available' | 'not_found'; error?: string }>;
}
