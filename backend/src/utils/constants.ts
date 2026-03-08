/** Shared constants for magic numbers used across the backend. */

/** Default Claude model used by agents and meta-planner. */
export const DEFAULT_MODEL = 'claude-opus-4-6';

/** Agent execution timeout in seconds. */
export const AGENT_TIMEOUT_SECONDS = 300;

/** Maximum concurrent agent tasks. */
export const MAX_CONCURRENT_TASKS = 3;

/** Test runner timeout in milliseconds. */
export const TEST_TIMEOUT_MS = 120_000;

/** Build step timeout in milliseconds. */
export const BUILD_TIMEOUT_MS = 120_000;

/** Flash timeout in milliseconds. */
export const FLASH_TIMEOUT_MS = 60_000;

/** Narrator debounce timeout in milliseconds. */
export const NARRATOR_TIMEOUT_MS = 4_000;

/** Rate limit delay in milliseconds. */
export const RATE_LIMIT_DELAY_MS = 15_000;

/** Session cleanup grace period in milliseconds. */
export const CLEANUP_DELAY_MS = 300_000;

/** Session max age in milliseconds. */
export const SESSION_MAX_AGE_MS = 3_600_000;

/** Session prune interval in milliseconds. */
export const PRUNE_INTERVAL_MS = 600_000;

/** Maximum predecessor word count for context. */
export const PREDECESSOR_WORD_CAP = 2000;

/** Default token budget per session. */
export const DEFAULT_TOKEN_BUDGET = 500_000;

/** Default max turns per agent invocation. */
export const MAX_TURNS_DEFAULT = 25;

/** Additional turns granted per retry attempt. */
export const MAX_TURNS_RETRY_INCREMENT = 10;

// -- Ollama (local model) defaults --

/** Default Ollama server URL. */
export const DEFAULT_OLLAMA_URL = 'http://localhost:11434';

/** Default Ollama model for code generation / planning. */
export const DEFAULT_OLLAMA_CODE_MODEL = 'qwen2.5-coder:14b';

/** Default Ollama model for narrator / teaching (lighter). */
export const DEFAULT_OLLAMA_CHAT_MODEL = DEFAULT_OLLAMA_CODE_MODEL;

/** Max characters of tool output to include in Ollama agent loop messages. */
export const OLLAMA_TOOL_OUTPUT_CAP = 10_000;

/** Bash command timeout for Ollama tool executor in milliseconds. */
export const OLLAMA_BASH_TIMEOUT_MS = 30_000;
