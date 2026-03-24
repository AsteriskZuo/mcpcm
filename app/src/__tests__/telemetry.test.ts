import { describe, it, expect, vi } from 'vitest';
import {
  resolveTelemetryBaseUrl,
  resolveTelemetryTimeoutMs,
  sendIngestTelemetry,
  sendIngestTelemetryBatch,
  type IngestTelemetryPayload,
} from '../telemetry.js';

const samplePayload: IngestTelemetryPayload = {
  mcp_name: 'server-a',
  raw_config: '{"mcpServers":{"server-a":{"command":"node"}}}',
  agents: 'cursor',
  event: 'install',
  global: true,
};

describe('telemetry', () => {
  describe('resolveTelemetryBaseUrl', () => {
    it('reads MCPPCM_SERVER_URL and trims trailing slash', () => {
      const baseUrl = resolveTelemetryBaseUrl({
        MCPPCM_SERVER_URL: 'http://localhost:8000/',
      } as NodeJS.ProcessEnv);
      expect(baseUrl).toBe('http://localhost:8000');
    });

    it('falls back to MCPPCM_API_BASE_URL', () => {
      const baseUrl = resolveTelemetryBaseUrl({
        MCPPCM_API_BASE_URL: 'http://localhost:9000',
      } as NodeJS.ProcessEnv);
      expect(baseUrl).toBe('http://localhost:9000');
    });

    it('returns null when no valid value exists', () => {
      const baseUrl = resolveTelemetryBaseUrl({ MCPPCM_SERVER_URL: '   ' } as NodeJS.ProcessEnv);
      expect(baseUrl).toBeNull();
    });
  });

  describe('resolveTelemetryTimeoutMs', () => {
    it('uses env timeout when valid', () => {
      const timeout = resolveTelemetryTimeoutMs(
        { MCPPCM_TELEMETRY_TIMEOUT_MS: '1234' } as NodeJS.ProcessEnv,
        3000
      );
      expect(timeout).toBe(1234);
    });

    it('uses fallback when timeout is invalid', () => {
      const timeout = resolveTelemetryTimeoutMs(
        { MCPPCM_TELEMETRY_TIMEOUT_MS: 'invalid' } as NodeJS.ProcessEnv,
        3000
      );
      expect(timeout).toBe(3000);
    });
  });

  describe('sendIngestTelemetry', () => {
    it('returns success on 2xx response', async () => {
      const fetchImpl = vi.fn(async () => {
        return {
          ok: true,
          status: 200,
          text: async () => '',
        } as Response;
      });

      const result = await sendIngestTelemetry(samplePayload, {
        baseUrl: 'http://localhost:8000',
        fetchImpl,
      });

      expect(result.ok).toBe(true);
      expect(result.status).toBe(200);
      expect(fetchImpl).toHaveBeenCalledTimes(1);
      expect(fetchImpl).toHaveBeenCalledWith(
        'http://localhost:8000/v1/ingest/mcp-servers',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('returns error on non-2xx response', async () => {
      const fetchImpl = vi.fn(async () => {
        return {
          ok: false,
          status: 422,
          text: async () => '{"code":"validation_error"}',
        } as Response;
      });

      const result = await sendIngestTelemetry(samplePayload, {
        baseUrl: 'http://localhost:8000',
        fetchImpl,
      });

      expect(result.ok).toBe(false);
      expect(result.status).toBe(422);
      expect(result.error).toContain('validation_error');
    });

    it('returns error on fetch exception', async () => {
      const fetchImpl = vi.fn(async () => {
        throw new Error('network down');
      });

      const result = await sendIngestTelemetry(samplePayload, {
        baseUrl: 'http://localhost:8000',
        fetchImpl,
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('network down');
    });
  });

  describe('sendIngestTelemetryBatch', () => {
    it('marks all as skipped when base URL is missing', async () => {
      const result = await sendIngestTelemetryBatch([samplePayload], {
        env: {} as NodeJS.ProcessEnv,
      });

      expect(result.sent).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.succeeded).toBe(0);
    });
  });
});
