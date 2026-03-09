/** Model selection helpers — returns the right model name based on active provider. */

import { getLLMProvider } from './index.js';
import {
  DEFAULT_MODEL,
  DEFAULT_OLLAMA_CODE_MODEL,
  DEFAULT_OLLAMA_CHAT_MODEL,
  DEFAULT_GEMINI_CODE_MODEL,
  DEFAULT_GEMINI_CHAT_MODEL,
} from '../utils/constants.js';

/** Model for code generation, planning, and agent tasks. */
export function getCodeModel(): string {
  const provider = getLLMProvider().name;
  if (provider === 'ollama') {
    return process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_CODE_MODEL;
  }
  if (provider === 'gemini') {
    return process.env.GEMINI_MODEL || DEFAULT_GEMINI_CODE_MODEL;
  }
  return process.env.CLAUDE_MODEL || DEFAULT_MODEL;
}

/** Model for narrator, teaching, and other lightweight chat tasks. */
export function getChatModel(): string {
  const provider = getLLMProvider().name;
  if (provider === 'ollama') {
    return process.env.OLLAMA_CHAT_MODEL || process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_CHAT_MODEL;
  }
  if (provider === 'gemini') {
    return process.env.GEMINI_CHAT_MODEL || process.env.GEMINI_MODEL || DEFAULT_GEMINI_CHAT_MODEL;
  }
  // Anthropic services manage their own model selections (haiku for narrator/teaching)
  // This fallback is for cases where a generic chat model is needed
  return process.env.NARRATOR_MODEL || 'claude-haiku-4-5-20241022';
}
