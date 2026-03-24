import { verbose } from './utils.js';

const DEFAULT_INGEST_PATH = '/v1/ingest/mcp-servers';
const DEFAULT_TIMEOUT_MS = 3000;

export interface IngestTelemetryPayload {
  mcp_name: string;
  raw_config: string;
  agents: string;
  event: 'install';
  global: boolean;
}

export interface TelemetryOptions {
  baseUrl?: string | null;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  verbose?: boolean;
  env?: NodeJS.ProcessEnv;
}

export interface TelemetryRequestResult {
  ok: boolean;
  status?: number;
  error?: string;
  skipped?: boolean;
}

export interface TelemetryBatchResult {
  sent: number;
  succeeded: number;
  failed: number;
  skipped: number;
  errors: string[];
}

export function resolveTelemetryBaseUrl(env: NodeJS.ProcessEnv = process.env): string | null {
  const candidate = env.MCPPCM_SERVER_URL ?? env.MCPPCM_API_BASE_URL;
  if (!candidate) return null;

  const trimmed = candidate.trim();
  if (!trimmed) return null;

  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

export function resolveTelemetryTimeoutMs(
  env: NodeJS.ProcessEnv = process.env,
  fallbackMs = DEFAULT_TIMEOUT_MS
): number {
  const raw = env.MCPPCM_TELEMETRY_TIMEOUT_MS;
  if (!raw) return fallbackMs;

  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallbackMs;
  return parsed;
}

function buildIngestUrl(baseUrl: string): string {
  return `${baseUrl}${DEFAULT_INGEST_PATH}`;
}

export async function sendIngestTelemetry(
  payload: IngestTelemetryPayload,
  options: TelemetryOptions = {}
): Promise<TelemetryRequestResult> {
  const env = options.env ?? process.env;
  const baseUrl = options.baseUrl ?? resolveTelemetryBaseUrl(env);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? resolveTelemetryTimeoutMs(env);

  if (!baseUrl) {
    return {
      ok: false,
      skipped: true,
      error: 'Telemetry base URL is not configured',
    };
  }

  if (!fetchImpl) {
    return {
      ok: false,
      error: 'Fetch API is not available',
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(buildIngestUrl(baseUrl), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      return {
        ok: false,
        status: response.status,
        error: body || `Telemetry request failed with status ${response.status}`,
      };
    }

    return {
      ok: true,
      status: response.status,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown telemetry error',
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendIngestTelemetryBatch(
  payloads: IngestTelemetryPayload[],
  options: TelemetryOptions = {}
): Promise<TelemetryBatchResult> {
  const result: TelemetryBatchResult = {
    sent: payloads.length,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  if (payloads.length === 0) {
    return result;
  }

  const env = options.env ?? process.env;
  const baseUrl = options.baseUrl ?? resolveTelemetryBaseUrl(env);
  if (!baseUrl) {
    result.skipped = payloads.length;
    result.errors.push('Telemetry base URL is not configured');
    return result;
  }

  for (const payload of payloads) {
    const requestResult = await sendIngestTelemetry(payload, {
      ...options,
      baseUrl,
      env,
    });

    if (requestResult.ok) {
      result.succeeded++;
      continue;
    }

    if (requestResult.skipped) {
      result.skipped++;
    } else {
      result.failed++;
    }

    if (requestResult.error) {
      result.errors.push(requestResult.error);
    }
  }

  if (options.verbose) {
    verbose(
      `Telemetry batch result: sent=${result.sent}, succeeded=${result.succeeded}, failed=${result.failed}, skipped=${result.skipped}`,
      true
    );
  }

  return result;
}
