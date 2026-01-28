import { describe, it, expect, vi, beforeEach } from 'vitest';
import { homedir } from 'os';
import { expandPath, safeParseJson, formatServerConfig, CYAN, DIM, RESET } from '../utils.js';

describe('utils', () => {
  describe('expandPath', () => {
    it('should expand ~ to home directory', () => {
      const result = expandPath('~/test/path');
      expect(result).toBe(`${homedir()}/test/path`);
    });

    it('should not modify absolute paths', () => {
      const result = expandPath('/absolute/path');
      expect(result).toBe('/absolute/path');
    });

    it('should not modify relative paths without ~', () => {
      const result = expandPath('relative/path');
      expect(result).toBe('relative/path');
    });

    it('should handle ~ alone', () => {
      const result = expandPath('~');
      expect(result).toBe(homedir());
    });
  });

  describe('safeParseJson', () => {
    it('should parse valid JSON', () => {
      const result = safeParseJson<{ name: string }>('{"name": "test"}');
      expect(result).toEqual({ name: 'test' });
    });

    it('should return null for invalid JSON', () => {
      const result = safeParseJson('not valid json');
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = safeParseJson('');
      expect(result).toBeNull();
    });

    it('should parse arrays', () => {
      const result = safeParseJson<number[]>('[1, 2, 3]');
      expect(result).toEqual([1, 2, 3]);
    });

    it('should parse nested objects', () => {
      const result = safeParseJson<{ a: { b: number } }>('{"a": {"b": 1}}');
      expect(result).toEqual({ a: { b: 1 } });
    });
  });

  describe('formatServerConfig', () => {
    it('should format basic config', () => {
      const result = formatServerConfig('my-server', { command: 'node' });
      expect(result).toContain('my-server');
      expect(result).toContain('node');
    });

    it('should format config with args', () => {
      const result = formatServerConfig('my-server', {
        command: 'node',
        args: ['/path/to/server.js', '--port', '3000'],
      });
      expect(result).toContain('my-server');
      expect(result).toContain('node');
      expect(result).toContain('/path/to/server.js');
      expect(result).toContain('--port');
      expect(result).toContain('3000');
    });

    it('should handle missing command', () => {
      const result = formatServerConfig('my-server', {});
      expect(result).toContain('my-server');
      expect(result).toContain('unknown');
    });

    it('should handle empty args', () => {
      const result = formatServerConfig('my-server', { command: 'npm', args: [] });
      expect(result).toContain('my-server');
      expect(result).toContain('npm');
    });
  });
});
