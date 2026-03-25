import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { queryFindOnline, runFind } from '../commands/find.js';

describe('find online mode', () => {
  const originalServerUrl = process.env.MCPPCM_SERVER_URL;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    vi.unstubAllGlobals();

    if (originalServerUrl === undefined) {
      delete process.env.MCPPCM_SERVER_URL;
    } else {
      process.env.MCPPCM_SERVER_URL = originalServerUrl;
    }
  });

  it('queries online API and parses non-empty array on 200', async () => {
    const fetchImpl = vi.fn(async () => {
      return {
        status: 200,
        text: async () => '[{"mcp_name":"alpha","raw_config":"{}","install_count":2}]',
      } as Response;
    });

    const result = await queryFindOnline('alpha', {
      baseUrl: 'http://localhost:8000',
      fetchImpl,
    });

    expect(result.ok).toBe(true);
    expect(result.data).toEqual([
      {
        mcp_name: 'alpha',
        raw_config: '{}',
        install_count: 2,
      },
    ]);
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://localhost:8000/v1/query/mcp-servers?mcp_name=alpha',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('parses empty array on 200', async () => {
    const fetchImpl = vi.fn(async () => {
      return {
        status: 200,
        text: async () => '[]',
      } as Response;
    });

    const result = await queryFindOnline('none', {
      baseUrl: 'http://localhost:8000',
      fetchImpl,
    });

    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('returns status and error body on non-200', async () => {
    const fetchImpl = vi.fn(async () => {
      return {
        status: 500,
        text: async () => 'internal error',
      } as Response;
    });

    const result = await queryFindOnline('alpha', {
      baseUrl: 'http://localhost:8000',
      fetchImpl,
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
    expect(result.error).toBe('internal error');
  });

  it('returns warning on network exception', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('network down');
    });

    const result = await queryFindOnline('alpha', {
      baseUrl: 'http://localhost:8000',
      fetchImpl,
    });

    expect(result.ok).toBe(false);
    expect(result.warning).toContain('network down');
  });

  it('shows guidance for invalid trailing --online syntax', async () => {
    await runFind(['alpha', '--online']);

    const logs = logSpy.mock.calls.flat().join('\n');
    expect(logs).toContain('Online mode only supports: mcpcm find --online <keyword>');
  });

  it('prints array output on online 200 response', async () => {
    process.env.MCPPCM_SERVER_URL = 'http://localhost:8000';

    const fetchImpl = vi.fn(async () => {
      return {
        status: 200,
        text: async () =>
          '[{"mcp_name":"alpha","raw_config":"{\\"mcpServers\\":{\\"alpha\\":{\\"command\\":\\"node\\"}}}","install_count":1}]',
      } as Response;
    });
    vi.stubGlobal('fetch', fetchImpl);

    await runFind(['--online', 'alpha']);

    const logs = logSpy.mock.calls.flat().join('\n');
    expect(logs).toContain('"mcp_name": "alpha"');
    expect(logs).toContain('"install_count": 1');
    expect(logs).toContain('"raw_config": {');
    expect(logs).toContain('"mcpServers": {');
    expect(logs).toContain('"command": "node"');
  });

  it('keeps raw_config as string when parsing fails', async () => {
    process.env.MCPPCM_SERVER_URL = 'http://localhost:8000';

    const fetchImpl = vi.fn(async () => {
      return {
        status: 200,
        text: async () => '[{"mcp_name":"alpha","raw_config":"not-json","install_count":1}]',
      } as Response;
    });
    vi.stubGlobal('fetch', fetchImpl);

    await runFind(['--online', 'alpha']);

    const logs = logSpy.mock.calls.flat().join('\n');
    expect(logs).toContain('"raw_config": "not-json"');
  });

  it('prints status and body on online non-200 response', async () => {
    process.env.MCPPCM_SERVER_URL = 'http://localhost:8000';

    const fetchImpl = vi.fn(async () => {
      return {
        status: 422,
        text: async () => '{"code":"validation_error"}',
      } as Response;
    });
    vi.stubGlobal('fetch', fetchImpl);

    await runFind(['--online', 'alpha']);

    const logs = logSpy.mock.calls.flat().join('\n');
    expect(logs).toContain('HTTP 422');
    expect(logs).toContain('validation_error');
  });

  it('warns and does not crash when online request fails', async () => {
    process.env.MCPPCM_SERVER_URL = 'http://localhost:8000';

    const fetchImpl = vi.fn(async () => {
      throw new Error('timeout');
    });
    vi.stubGlobal('fetch', fetchImpl);

    await runFind(['--online', 'alpha']);

    const logs = logSpy.mock.calls.flat().join('\n');
    expect(logs).toContain('Online query request failed: timeout');
  });
});
