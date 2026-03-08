/** Tool executors for the Ollama agent loop — mirrors Claude Agent SDK tools. */

import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { OLLAMA_BASH_TIMEOUT_MS, OLLAMA_TOOL_OUTPUT_CAP } from '../utils/constants.js';

// -- Path validation --

function validatePath(filePath: string, cwd: string): string {
  const resolved = path.resolve(cwd, filePath);
  if (!resolved.startsWith(cwd + path.sep) && resolved !== cwd) {
    throw new Error(`Path escapes workspace: ${filePath}`);
  }
  return resolved;
}

// -- Tool implementations --

function toolRead(args: { file_path: string }, cwd: string): string {
  const resolved = validatePath(args.file_path, cwd);
  if (!fs.existsSync(resolved)) {
    return `Error: File not found: ${args.file_path}`;
  }
  const stat = fs.statSync(resolved);
  if (stat.isDirectory()) {
    return `Error: ${args.file_path} is a directory, not a file`;
  }
  const content = fs.readFileSync(resolved, 'utf-8');
  const lines = content.split('\n');
  return lines.map((line, i) => `${i + 1}\t${line}`).join('\n');
}

function toolWrite(args: { file_path: string; content: string }, cwd: string): string {
  const resolved = validatePath(args.file_path, cwd);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, args.content, 'utf-8');
  return `Wrote ${args.content.length} bytes to ${args.file_path}`;
}

function toolEdit(args: { file_path: string; old_string: string; new_string: string }, cwd: string): string {
  const resolved = validatePath(args.file_path, cwd);
  if (!fs.existsSync(resolved)) {
    return `Error: File not found: ${args.file_path}`;
  }
  const content = fs.readFileSync(resolved, 'utf-8');
  const count = content.split(args.old_string).length - 1;
  if (count === 0) {
    return `Error: old_string not found in ${args.file_path}`;
  }
  if (count > 1) {
    return `Error: old_string found ${count} times in ${args.file_path} (must be unique)`;
  }
  const updated = content.replace(args.old_string, args.new_string);
  fs.writeFileSync(resolved, updated, 'utf-8');
  return `Edited ${args.file_path}`;
}

function toolBash(args: { command: string }, cwd: string): Promise<string> {
  return new Promise((resolve) => {
    execFile('bash', ['-c', args.command], {
      cwd,
      timeout: OLLAMA_BASH_TIMEOUT_MS,
      maxBuffer: 1024 * 1024,
      env: { ...process.env, TERM: 'dumb' },
    }, (err, stdout, stderr) => {
      const output = (stdout || '') + (stderr ? `\nSTDERR: ${stderr}` : '');
      if (err) {
        resolve(`Error (exit ${err.code ?? 'unknown'}): ${output || err.message}`);
      } else {
        resolve(output || '(no output)');
      }
    });
  });
}

function toolGlob(args: { pattern: string; path?: string }, cwd: string): string {
  const searchDir = args.path ? validatePath(args.path, cwd) : cwd;
  const results: string[] = [];

  function walk(dir: string, depth: number): void {
    if (depth > 10 || results.length > 200) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(cwd, fullPath);
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      if (entry.isDirectory()) {
        walk(fullPath, depth + 1);
      } else if (matchGlob(relPath, args.pattern)) {
        results.push(relPath);
      }
    }
  }

  walk(searchDir, 0);
  return results.length > 0 ? results.join('\n') : 'No files matched';
}

/** Simple glob matching (supports *, **, ?) */
function matchGlob(filePath: string, pattern: string): boolean {
  const regexStr = pattern
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')
    .replace(/{{GLOBSTAR}}/g, '.*')
    .replace(/\./g, '\\.');
  return new RegExp(`^${regexStr}$`).test(filePath);
}

function toolGrep(args: { pattern: string; path?: string }, cwd: string): string {
  const searchDir = args.path ? validatePath(args.path, cwd) : cwd;
  const regex = new RegExp(args.pattern, 'i');
  const results: string[] = [];

  function walk(dir: string, depth: number): void {
    if (depth > 10 || results.length > 100) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, depth + 1);
      } else {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (regex.test(lines[i])) {
              results.push(`${path.relative(cwd, fullPath)}:${i + 1}: ${lines[i]}`);
              if (results.length >= 100) return;
            }
          }
        } catch {
          // skip binary / unreadable files
        }
      }
    }
  }

  walk(searchDir, 0);
  return results.length > 0 ? results.join('\n') : 'No matches found';
}

// -- Tool registry --

export interface ToolResult {
  success: boolean;
  output: string;
}

export async function executeTool(
  name: string,
  args: Record<string, any>,
  cwd: string,
): Promise<ToolResult> {
  try {
    let output: string;
    switch (name) {
      case 'Read':
        output = toolRead(args as any, cwd);
        break;
      case 'Write':
        output = toolWrite(args as any, cwd);
        break;
      case 'Edit':
        output = toolEdit(args as any, cwd);
        break;
      case 'Bash':
        output = await toolBash(args as any, cwd);
        break;
      case 'Glob':
        output = toolGlob(args as any, cwd);
        break;
      case 'Grep':
        output = toolGrep(args as any, cwd);
        break;
      default:
        return { success: false, output: `Unknown tool: ${name}` };
    }
    // Cap output length
    if (output.length > OLLAMA_TOOL_OUTPUT_CAP) {
      output = output.slice(0, OLLAMA_TOOL_OUTPUT_CAP) + '\n... (truncated)';
    }
    return { success: !output.startsWith('Error'), output };
  } catch (err: any) {
    return { success: false, output: `Tool error: ${err.message}` };
  }
}

/** OpenAI function-calling tool definitions for inclusion in Ollama requests. */
export const TOOL_DEFINITIONS = [
  {
    type: 'function' as const,
    function: {
      name: 'Read',
      description: 'Read a file and return its contents with line numbers.',
      parameters: {
        type: 'object',
        properties: {
          file_path: { type: 'string', description: 'Path to the file to read (relative to working directory)' },
        },
        required: ['file_path'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'Write',
      description: 'Write content to a file, creating parent directories as needed.',
      parameters: {
        type: 'object',
        properties: {
          file_path: { type: 'string', description: 'Path to the file to write' },
          content: { type: 'string', description: 'Content to write to the file' },
        },
        required: ['file_path', 'content'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'Edit',
      description: 'Replace a unique string in a file with a new string.',
      parameters: {
        type: 'object',
        properties: {
          file_path: { type: 'string', description: 'Path to the file to edit' },
          old_string: { type: 'string', description: 'The exact string to find (must be unique in the file)' },
          new_string: { type: 'string', description: 'The replacement string' },
        },
        required: ['file_path', 'old_string', 'new_string'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'Bash',
      description: 'Execute a bash command and return its output.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'The bash command to execute' },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'Glob',
      description: 'Find files matching a glob pattern.',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Glob pattern (e.g. "**/*.py", "src/**/*.ts")' },
          path: { type: 'string', description: 'Directory to search in (default: working directory)' },
        },
        required: ['pattern'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'Grep',
      description: 'Search file contents for a regex pattern.',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Regex pattern to search for' },
          path: { type: 'string', description: 'Directory to search in (default: working directory)' },
        },
        required: ['pattern'],
      },
    },
  },
];
