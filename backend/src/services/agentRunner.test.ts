import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentRunner } from './agentRunner.js';

const mockExecuteAgent = vi.fn();
const mockChat = vi.fn();
const mockHealthCheck = vi.fn();

vi.mock('../providers/index.js', () => ({
  getLLMProvider: () => ({
    name: 'anthropic',
    executeAgent: mockExecuteAgent,
    chat: mockChat,
    healthCheck: mockHealthCheck,
  }),
}));

vi.mock('../providers/models.js', () => ({
  getCodeModel: () => 'claude-opus-4-6',
}));

describe('AgentRunner', () => {
  beforeEach(() => {
    mockExecuteAgent.mockReset();
  });

  it('delegates to provider.executeAgent with correct params', async () => {
    mockExecuteAgent.mockResolvedValue({
      success: true,
      summary: 'Done',
      costUsd: 0.05,
      inputTokens: 100,
      outputTokens: 50,
    });

    const runner = new AgentRunner();
    const result = await runner.execute({
      taskId: 'test-1',
      prompt: 'hello',
      systemPrompt: 'you are a bot',
      onOutput: vi.fn().mockResolvedValue(undefined),
      workingDir: '/tmp/test',
    });

    expect(mockExecuteAgent).toHaveBeenCalledOnce();
    const callArgs = mockExecuteAgent.mock.calls[0][0];
    expect(callArgs.prompt).toBe('hello');
    expect(callArgs.systemPrompt).toBe('you are a bot');
    expect(callArgs.model).toBe('claude-opus-4-6');
    expect(callArgs.maxTurns).toBe(25);
    expect(callArgs.workingDir).toBe('/tmp/test');

    expect(result.success).toBe(true);
    expect(result.costUsd).toBe(0.05);
    expect(result.inputTokens).toBe(100);
    expect(result.outputTokens).toBe(50);
  });

  it('passes MCP servers to provider', async () => {
    mockExecuteAgent.mockResolvedValue({
      success: true,
      summary: 'Done',
      costUsd: 0,
      inputTokens: 0,
      outputTokens: 0,
    });

    const runner = new AgentRunner();
    await runner.execute({
      taskId: 'test-1',
      prompt: 'hello',
      systemPrompt: 'you are a bot',
      onOutput: vi.fn().mockResolvedValue(undefined),
      workingDir: '/tmp/test',
      mcpServers: [
        { name: 'myserver', command: 'node', args: ['server.js'], env: { FOO: 'bar' } },
      ],
    });

    const callArgs = mockExecuteAgent.mock.calls[0][0];
    expect(callArgs.mcpServers).toEqual([
      { name: 'myserver', command: 'node', args: ['server.js'], env: { FOO: 'bar' } },
    ]);
  });

  it('returns timeout failure when agent exceeds time limit', async () => {
    mockExecuteAgent.mockImplementation(() => new Promise(() => {})); // Never resolves

    const runner = new AgentRunner();
    const result = await runner.execute({
      taskId: 'test-1',
      prompt: 'hello',
      systemPrompt: 'you are a bot',
      onOutput: vi.fn().mockResolvedValue(undefined),
      workingDir: '/tmp/test',
      timeout: 0.01, // 10ms
    });

    expect(result.success).toBe(false);
    expect(result.summary).toContain('timed out');
  });

  it('catches thrown errors and returns failure', async () => {
    mockExecuteAgent.mockRejectedValue(new Error('SDK connection failed'));

    const runner = new AgentRunner();
    const result = await runner.execute({
      taskId: 'test-1',
      prompt: 'hello',
      systemPrompt: 'you are a bot',
      onOutput: vi.fn().mockResolvedValue(undefined),
      workingDir: '/tmp/test',
    });

    expect(result.success).toBe(false);
    expect(result.summary).toContain('SDK connection failed');
  });
});
