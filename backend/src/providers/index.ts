/** Provider factory — singleton LLMProvider based on LLM_PROVIDER env var. */

import type { LLMProvider } from './types.js';
import { AnthropicProvider } from './anthropic.js';
import { OllamaProvider } from './ollama.js';
import { GeminiProvider } from './gemini.js';

let instance: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (!instance) {
    const providerName = (process.env.LLM_PROVIDER || 'anthropic').toLowerCase();
    switch (providerName) {
      case 'ollama':
        instance = new OllamaProvider();
        break;
      case 'gemini':
        instance = new GeminiProvider();
        break;
      default:
        instance = new AnthropicProvider();
    }
  }
  return instance;
}

/** Reset singleton (for tests). */
export function resetLLMProvider(): void {
  instance = null;
}

export type { LLMProvider } from './types.js';
