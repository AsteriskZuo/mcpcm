import { describe, it, expect } from 'vitest';
import { parseAddOptions } from '../commands/add.js';
import { parseDelOptions } from '../commands/del.js';
import { parseListOptions } from '../commands/list.js';
import { parseSyncOptions } from '../commands/sync.js';

describe('Command Parsers', () => {
  describe('parseAddOptions', () => {
    it('should parse JSON input', () => {
      const { input, options } = parseAddOptions(['{"mcpServers":{}}']);
      expect(input).toBe('{"mcpServers":{}}');
    });

    it('should parse --agent flag with single agent', () => {
      const { options } = parseAddOptions(['--agent', 'cursor']);
      expect(options.agents).toEqual(['cursor']);
    });

    it('should parse --agent flag with multiple agents', () => {
      const { options } = parseAddOptions(['--agent', 'cursor', 'claude-code', 'windsurf']);
      expect(options.agents).toEqual(['cursor', 'claude-code', 'windsurf']);
    });

    it('should parse -a short flag', () => {
      const { options } = parseAddOptions(['-a', 'cursor']);
      expect(options.agents).toEqual(['cursor']);
    });

    it('should parse --global flag', () => {
      const { options } = parseAddOptions(['--global']);
      expect(options.global).toBe(true);
    });

    it('should parse -g short flag', () => {
      const { options } = parseAddOptions(['-g']);
      expect(options.global).toBe(true);
    });

    it('should parse --workspace flag', () => {
      const { options } = parseAddOptions(['--workspace']);
      expect(options.workspace).toBe(true);
    });

    it('should parse -w short flag', () => {
      const { options } = parseAddOptions(['-w']);
      expect(options.workspace).toBe(true);
    });

    it('should parse --replace flag', () => {
      const { options } = parseAddOptions(['--replace']);
      expect(options.replace).toBe(true);
    });

    it('should parse -r short flag', () => {
      const { options } = parseAddOptions(['-r']);
      expect(options.replace).toBe(true);
    });

    it('should parse --file flag', () => {
      const { options } = parseAddOptions(['--file', 'mcp.json']);
      expect(options.file).toBe('mcp.json');
    });

    it('should parse -f short flag', () => {
      const { options } = parseAddOptions(['-f', 'config.json']);
      expect(options.file).toBe('config.json');
    });

    it('should parse --verbose flag', () => {
      const { options } = parseAddOptions(['--verbose']);
      expect(options.verbose).toBe(true);
    });

    it('should parse complex command', () => {
      const { input, options } = parseAddOptions([
        '{"mcpServers":{}}',
        '--agent',
        'cursor',
        'claude-code',
        '--replace',
        '--verbose',
      ]);
      expect(input).toBe('{"mcpServers":{}}');
      expect(options.agents).toEqual(['cursor', 'claude-code']);
      expect(options.replace).toBe(true);
      expect(options.verbose).toBe(true);
    });
  });

  describe('parseDelOptions', () => {
    it('should parse server name', () => {
      const { serverNames } = parseDelOptions(['my-server']);
      expect(serverNames).toEqual(['my-server']);
    });

    it('should parse multiple server names', () => {
      const { serverNames } = parseDelOptions(['server1', 'server2']);
      expect(serverNames).toEqual(['server1', 'server2']);
    });

    it('should parse --agent flag', () => {
      const { options } = parseDelOptions(['my-server', '--agent', 'cursor']);
      expect(options.agents).toEqual(['cursor']);
    });

    it('should parse --global flag', () => {
      const { options } = parseDelOptions(['my-server', '--global']);
      expect(options.global).toBe(true);
    });

    it('should parse --workspace flag', () => {
      const { options } = parseDelOptions(['my-server', '--workspace']);
      expect(options.workspace).toBe(true);
    });

    it('should parse complex command', () => {
      const { serverNames, options } = parseDelOptions([
        'server1',
        'server2',
        '--agent',
        'cursor',
        'windsurf',
        '--verbose',
      ]);
      expect(serverNames).toEqual(['server1', 'server2']);
      expect(options.agents).toEqual(['cursor', 'windsurf']);
      expect(options.verbose).toBe(true);
    });
  });

  describe('parseListOptions', () => {
    it('should parse --agent flag', () => {
      const options = parseListOptions(['--agent', 'cursor']);
      expect(options.agents).toEqual(['cursor']);
    });

    it('should parse --global flag', () => {
      const options = parseListOptions(['--global']);
      expect(options.global).toBe(true);
    });

    it('should parse --workspace flag', () => {
      const options = parseListOptions(['--workspace']);
      expect(options.workspace).toBe(true);
    });

    it('should parse --verbose flag', () => {
      const options = parseListOptions(['--verbose']);
      expect(options.verbose).toBe(true);
    });

    it('should parse multiple flags', () => {
      const options = parseListOptions(['--agent', 'cursor', '--global', '--verbose']);
      expect(options.agents).toEqual(['cursor']);
      expect(options.global).toBe(true);
      expect(options.verbose).toBe(true);
    });
  });

  describe('parseSyncOptions', () => {
    it('should parse --from flag', () => {
      const options = parseSyncOptions(['--from', 'cursor']);
      expect(options?.from).toBe('cursor');
    });

    it('should parse --to flag with single agent', () => {
      const options = parseSyncOptions(['--from', 'cursor', '--to', 'claude-code']);
      expect(options?.to).toEqual(['claude-code']);
    });

    it('should parse --to flag with multiple agents', () => {
      const options = parseSyncOptions([
        '--from',
        'cursor',
        '--to',
        'claude-code',
        'windsurf',
        'antigravity',
      ]);
      expect(options?.to).toEqual(['claude-code', 'windsurf', 'antigravity']);
    });

    it('should parse --to-all flag', () => {
      const options = parseSyncOptions(['--from', 'cursor', '--to-all']);
      expect(options?.toAll).toBe(true);
    });

    it('should return null if --from is missing', () => {
      const options = parseSyncOptions(['--to', 'claude-code']);
      expect(options).toBeNull();
    });

    it('should parse --verbose flag', () => {
      const options = parseSyncOptions(['--from', 'cursor', '--to-all', '--verbose']);
      expect(options?.verbose).toBe(true);
    });
  });
});
