import { describe, it, expect } from 'vitest';
import { getAllAgentTypes, getAgentConfig, isValidAgentType, agents } from '../agents.js';

describe('agents', () => {
  describe('getAllAgentTypes', () => {
    it('should return all agent types', () => {
      const types = getAllAgentTypes();
      expect(types).toContain('cursor');
      expect(types).toContain('claude-code');
      expect(types).toContain('antigravity');
      expect(types).toContain('windsurf');
      expect(types).toContain('vscode');
      expect(types).toContain('codex');
      expect(types).toContain('opencode');
      expect(types).toContain('gemini-cli');
      expect(types).toContain('qoder');
      expect(types).toContain('qwen-code');
      expect(types).toContain('trae');
    });

    it('should return 11 agent types', () => {
      const types = getAllAgentTypes();
      expect(types).toHaveLength(11);
    });
  });

  describe('getAgentConfig', () => {
    it('should return cursor config', () => {
      const config = getAgentConfig('cursor');
      expect(config.name).toBe('cursor');
      expect(config.displayName).toBe('Cursor');
      expect(config.configFormat).toBe('json');
      expect(config.projectConfigPath).toBe('.cursor/mcp.json');
      expect(config.globalConfigPath).toContain('.cursor/mcp.json');
    });

    it('should return claude-code config', () => {
      const config = getAgentConfig('claude-code');
      expect(config.name).toBe('claude-code');
      expect(config.displayName).toBe('Claude Code');
      expect(config.projectConfigPath).toBe('.mcp.json');
      expect(config.globalConfigPath).toContain('.claude.json');
    });

    it('should return codex config with toml format', () => {
      const config = getAgentConfig('codex');
      expect(config.name).toBe('codex');
      expect(config.configFormat).toBe('toml');
      expect(config.mcpConfigKey).toBe('mcp_servers');
    });

    it('should return vscode config with servers key', () => {
      const config = getAgentConfig('vscode');
      expect(config.name).toBe('vscode');
      expect(config.mcpConfigKey).toBe('servers');
    });

    it('should return qoder config with null paths', () => {
      const config = getAgentConfig('qoder');
      expect(config.name).toBe('qoder');
      expect(config.projectConfigPath).toBeNull();
      expect(config.globalConfigPath).toBeNull();
      expect(config.mcpConfigKey).toBeNull();
    });
  });

  describe('isValidAgentType', () => {
    it('should return true for valid agent types', () => {
      expect(isValidAgentType('cursor')).toBe(true);
      expect(isValidAgentType('claude-code')).toBe(true);
      expect(isValidAgentType('antigravity')).toBe(true);
      expect(isValidAgentType('windsurf')).toBe(true);
      expect(isValidAgentType('vscode')).toBe(true);
      expect(isValidAgentType('codex')).toBe(true);
    });

    it('should return false for invalid agent types', () => {
      expect(isValidAgentType('invalid')).toBe(false);
      expect(isValidAgentType('')).toBe(false);
      expect(isValidAgentType('Cursor')).toBe(false); // case sensitive
      expect(isValidAgentType('cursor ')).toBe(false);
    });
  });

  describe('agents config structure', () => {
    it('should have required properties for all agents', () => {
      for (const [type, config] of Object.entries(agents)) {
        expect(config.name).toBe(type);
        expect(typeof config.displayName).toBe('string');
        expect(['json', 'toml']).toContain(config.configFormat);
        expect(typeof config.detectInstalled).toBe('function');
      }
    });
  });
});
