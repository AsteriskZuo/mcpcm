import { homedir } from 'os';
import { join, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Terminal colors
export const RESET = '\x1b[0m';
export const BOLD = '\x1b[1m';
export const DIM = '\x1b[38;5;102m';
export const TEXT = '\x1b[38;5;145m';
export const GREEN = '\x1b[38;5;78m';
export const YELLOW = '\x1b[38;5;220m';
export const RED = '\x1b[38;5;196m';
export const CYAN = '\x1b[38;5;87m';

/**
 * Expand ~ to home directory
 */
export function expandPath(path: string): string {
  if (path.startsWith('~')) {
    return join(homedir(), path.slice(1));
  }
  return path;
}

/**
 * Ensure directory exists
 */
export function ensureDir(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Parse JSON safely
 */
export function safeParseJson<T>(content: string): T | null {
  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Format MCP server config for display
 */
export function formatServerConfig(name: string, config: Record<string, unknown>): string {
  const command = (config['command'] as string) || 'unknown';
  const args = (config['args'] as string[]) || [];
  const argsStr = args.length > 0 ? ` ${args.join(' ')}` : '';
  return `${CYAN}${name}${RESET}: ${DIM}${command}${argsStr}${RESET}`;
}

/**
 * Print success message
 */
export function success(message: string): void {
  console.log(`${GREEN}✓${RESET} ${message}`);
}

/**
 * Print error message
 */
export function error(message: string): void {
  console.log(`${RED}✗${RESET} ${message}`);
}

/**
 * Print warning message
 */
export function warn(message: string): void {
  console.log(`${YELLOW}!${RESET} ${message}`);
}

/**
 * Print info message
 */
export function info(message: string): void {
  console.log(`${DIM}${message}${RESET}`);
}

/**
 * Print verbose message (only if verbose mode)
 */
export function verbose(message: string, isVerbose: boolean): void {
  if (isVerbose) {
    console.log(`${DIM}[verbose] ${message}${RESET}`);
  }
}
