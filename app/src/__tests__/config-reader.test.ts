import { describe, it, expect } from 'vitest';
import { parseMcpConfigString } from '../config-reader.js';

describe('config-reader', () => {
  describe('parseMcpConfigString', () => {
    it('should parse valid MCP config with mcpServers key', () => {
      const input = JSON.stringify({
        mcpServers: {
          'my-server': {
            command: 'node',
            args: ['/path/to/server.js'],
          },
        },
      });
      const result = parseMcpConfigString(input);
      expect(result).not.toBeNull();
      expect(result?.mcpServers['my-server']).toBeDefined();
      expect(result?.mcpServers['my-server']!.command).toBe('node');
      expect(result?.mcpServers['my-server']!.args).toEqual(['/path/to/server.js']);
    });

    it('should parse config with multiple servers', () => {
      const input = JSON.stringify({
        mcpServers: {
          server1: { command: 'node', args: ['/path/1'] },
          server2: { command: 'npx', args: ['-y', 'some-package'] },
        },
      });
      const result = parseMcpConfigString(input);
      expect(result).not.toBeNull();
      expect(Object.keys(result?.mcpServers || {})).toHaveLength(2);
      expect(result?.mcpServers['server1']!.command).toBe('node');
      expect(result?.mcpServers['server2']!.command).toBe('npx');
    });

    it('should parse config with env variables', () => {
      const input = JSON.stringify({
        mcpServers: {
          'my-server': {
            command: 'node',
            args: ['/path/to/server.js'],
            env: {
              API_KEY: 'secret-key',
              DEBUG: 'true',
            },
          },
        },
      });
      const result = parseMcpConfigString(input);
      expect(result).not.toBeNull();
      expect(result?.mcpServers['my-server']!.env).toBeDefined();
      expect(result?.mcpServers['my-server']!.env?.API_KEY).toBe('secret-key');
      expect(result?.mcpServers['my-server']!.env?.DEBUG).toBe('true');
    });

    it('should parse direct servers object (without mcpServers wrapper)', () => {
      const input = JSON.stringify({
        'my-server': {
          command: 'node',
          args: ['/path/to/server.js'],
        },
      });
      const result = parseMcpConfigString(input);
      expect(result).not.toBeNull();
      expect(result?.mcpServers['my-server']).toBeDefined();
      expect(result?.mcpServers['my-server']!.command).toBe('node');
    });

    it('should return null for invalid JSON', () => {
      const result = parseMcpConfigString('not valid json');
      expect(result).toBeNull();
    });

    it('should return null for empty object', () => {
      const result = parseMcpConfigString('{}');
      expect(result).toBeNull();
    });

    it('should return null for non-object mcpServers', () => {
      const result = parseMcpConfigString('{"mcpServers": "not an object"}');
      expect(result).toBeNull();
    });

    it('should handle empty mcpServers object', () => {
      const result = parseMcpConfigString('{"mcpServers": {}}');
      expect(result).not.toBeNull();
      expect(result?.mcpServers).toEqual({});
    });
  });
});
