import { describe, it, expect } from 'vitest';
import {
  parseAddOptions,
  classifyAddWriteTargets,
  buildAddTelemetryPayloads,
} from '../commands/add.js';
import type { AgentType } from '../types.js';
import { parseDelOptions } from '../commands/del.js';
import { parseFindArgs } from '../commands/find.js';
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

  describe('add telemetry helpers', () => {
    it('classifies duplicates as replaced when --replace is enabled', () => {
      const result = classifyAddWriteTargets(['server-a', 'server-b'], ['server-a'], true);
      expect(result.toWrite).toEqual(['server-a', 'server-b']);
      expect(result.replaced).toEqual(['server-a']);
      expect(result.added).toEqual(['server-b']);
      expect(result.skipped).toEqual([]);
    });

    it('classifies duplicates as skipped when --replace is disabled', () => {
      const result = classifyAddWriteTargets(['server-a', 'server-b'], ['server-a'], false);
      expect(result.toWrite).toEqual(['server-b']);
      expect(result.replaced).toEqual([]);
      expect(result.added).toEqual(['server-b']);
      expect(result.skipped).toEqual(['server-a']);
    });

    it('builds aggregated telemetry payloads with deterministic agent order', () => {
      const successfulWrites = new Map<string, Set<AgentType>>([
        ['server-b', new Set<AgentType>(['cursor'])],
        ['server-a', new Set<AgentType>(['cursor', 'claude-code'])],
      ]);

      const payloads = buildAddTelemetryPayloads(
        successfulWrites,
        {
          mcpServers: {
            'server-a': { command: 'node', args: ['a.js'] },
            'server-b': { command: 'node', args: ['b.js'] },
          },
        },
        true
      );

      expect(payloads).toHaveLength(2);
      expect(payloads[0]).toEqual({
        mcp_name: 'server-a',
        raw_config: '{"mcpServers":{"server-a":{"command":"node","args":["a.js"]}}}',
        agents: 'claude-code,cursor',
        event: 'install',
        global: true,
      });
      expect(payloads[1]).toEqual({
        mcp_name: 'server-b',
        raw_config: '{"mcpServers":{"server-b":{"command":"node","args":["b.js"]}}}',
        agents: 'cursor',
        event: 'install',
        global: true,
      });
    });

    it('excludes unsuccessful targets from telemetry aggregation input', () => {
      const successfulWrites = new Map<string, Set<AgentType>>([
        ['server-a', new Set<AgentType>(['cursor'])],
      ]);
      const payloads = buildAddTelemetryPayloads(
        successfulWrites,
        {
          mcpServers: {
            'server-a': { command: 'node' },
          },
        },
        false
      );

      expect(payloads).toEqual([
        {
          mcp_name: 'server-a',
          raw_config: '{"mcpServers":{"server-a":{"command":"node"}}}',
          agents: 'cursor',
          event: 'install',
          global: false,
        },
      ]);
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

  describe('parseFindArgs', () => {
    it('parses local find mode', () => {
      const parsed = parseFindArgs(['demo', '--verbose']);

      expect('error' in parsed).toBe(false);
      if ('error' in parsed) return;
      expect(parsed.mode).toBe('local');
      expect(parsed.keyword).toBe('demo');
      expect(parsed.verbose).toBe(true);
    });

    it('parses strict online syntax', () => {
      const parsed = parseFindArgs(['--online', 'demo']);

      expect('error' in parsed).toBe(false);
      if ('error' in parsed) return;
      expect(parsed.mode).toBe('online');
      expect(parsed.keyword).toBe('demo');
    });

    it('rejects trailing --online syntax', () => {
      const parsed = parseFindArgs(['demo', '--online']);
      expect('error' in parsed).toBe(true);
      if ('error' in parsed) {
        expect(parsed.error).toContain('Online mode only supports');
      }
    });

    it('rejects missing online keyword', () => {
      const parsed = parseFindArgs(['--online']);
      expect('error' in parsed).toBe(true);
      if ('error' in parsed) {
        expect(parsed.error).toContain('Usage: mcpcm find --online <keyword>');
      }
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
