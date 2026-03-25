import { describe, it, expect } from 'vitest';
import { mergeMcpConfigs, removeServersFromConfig } from '../config-writer.js';
import type { McpConfig } from '../types.js';

describe('config-writer', () => {
  describe('mergeMcpConfigs', () => {
    it('should merge two configs', () => {
      const existing: McpConfig = {
        mcpServers: {
          server1: { command: 'node', args: ['/path/1'] },
        },
      };
      const incoming: McpConfig = {
        mcpServers: {
          server2: { command: 'npx', args: ['/path/2'] },
        },
      };
      const result = mergeMcpConfigs(existing, incoming);
      expect(Object.keys(result.mcpServers)).toHaveLength(2);
      expect(result.mcpServers['server1']).toBeDefined();
      expect(result.mcpServers['server2']).toBeDefined();
    });

    it('should shallow merge existing server config (env is replaced)', () => {
      const existing: McpConfig = {
        mcpServers: {
          server1: { command: 'node', args: ['/old/path'], env: { OLD_VAR: 'old' } },
        },
      };
      const incoming: McpConfig = {
        mcpServers: {
          server1: { command: 'npx', env: { NEW_VAR: 'new' } },
        },
      };
      const result = mergeMcpConfigs(existing, incoming, false);
      expect(result.mcpServers['server1']!.command).toBe('npx');
      expect(result.mcpServers['server1']!.args).toEqual(['/old/path']);
      // Note: env is shallow merged, so the new env replaces the old one
      expect(result.mcpServers['server1']!.env).toEqual({ NEW_VAR: 'new' });
    });

    it('should replace when replace=true', () => {
      const existing: McpConfig = {
        mcpServers: {
          server1: { command: 'node', args: ['/old/path'] },
        },
      };
      const incoming: McpConfig = {
        mcpServers: {
          server1: { command: 'npx' },
        },
      };
      const result = mergeMcpConfigs(existing, incoming, true);
      expect(result.mcpServers['server1']!.command).toBe('npx');
      expect(result.mcpServers['server1']!.args).toBeUndefined();
    });

    it('should add new servers in replace mode', () => {
      const existing: McpConfig = {
        mcpServers: {
          server1: { command: 'node' },
        },
      };
      const incoming: McpConfig = {
        mcpServers: {
          server2: { command: 'npx' },
        },
      };
      const result = mergeMcpConfigs(existing, incoming, true);
      expect(Object.keys(result.mcpServers)).toHaveLength(2);
    });

    it('should handle empty existing config', () => {
      const existing: McpConfig = { mcpServers: {} };
      const incoming: McpConfig = {
        mcpServers: {
          server1: { command: 'node' },
        },
      };
      const result = mergeMcpConfigs(existing, incoming);
      expect(result.mcpServers['server1']).toBeDefined();
    });

    it('should handle empty incoming config', () => {
      const existing: McpConfig = {
        mcpServers: {
          server1: { command: 'node' },
        },
      };
      const incoming: McpConfig = { mcpServers: {} };
      const result = mergeMcpConfigs(existing, incoming);
      expect(result.mcpServers['server1']).toBeDefined();
      expect(Object.keys(result.mcpServers)).toHaveLength(1);
    });
  });

  describe('removeServersFromConfig', () => {
    it('should remove a single server', () => {
      const config: McpConfig = {
        mcpServers: {
          server1: { command: 'node' },
          server2: { command: 'npx' },
        },
      };
      const result = removeServersFromConfig(config, ['server1']);
      expect(result.mcpServers['server1']).toBeUndefined();
      expect(result.mcpServers['server2']).toBeDefined();
    });

    it('should remove multiple servers', () => {
      const config: McpConfig = {
        mcpServers: {
          server1: { command: 'node' },
          server2: { command: 'npx' },
          server3: { command: 'deno' },
        },
      };
      const result = removeServersFromConfig(config, ['server1', 'server3']);
      expect(result.mcpServers['server1']).toBeUndefined();
      expect(result.mcpServers['server2']).toBeDefined();
      expect(result.mcpServers['server3']).toBeUndefined();
    });

    it('should handle removing non-existent server', () => {
      const config: McpConfig = {
        mcpServers: {
          server1: { command: 'node' },
        },
      };
      const result = removeServersFromConfig(config, ['non-existent']);
      expect(result.mcpServers['server1']).toBeDefined();
      expect(Object.keys(result.mcpServers)).toHaveLength(1);
    });

    it('should handle empty server names array', () => {
      const config: McpConfig = {
        mcpServers: {
          server1: { command: 'node' },
        },
      };
      const result = removeServersFromConfig(config, []);
      expect(result.mcpServers['server1']).toBeDefined();
    });

    it('should not modify original config', () => {
      const config: McpConfig = {
        mcpServers: {
          server1: { command: 'node' },
        },
      };
      removeServersFromConfig(config, ['server1']);
      expect(config.mcpServers['server1']).toBeDefined();
    });
  });
});
