import type { WorldBankConfig } from './api/types.js'

function envInt(key: string, fallback: number): number {
  const raw = process.env[key]
  if (raw === undefined) return fallback
  const parsed = parseInt(raw, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

function envStr(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

export function loadConfig(): WorldBankConfig {
  return {
    baseUrl: envStr('WORLDBANK_MCP_BASE_URL', 'https://api.worldbank.org/v2'),
    cacheTtlMs: envInt('WORLDBANK_MCP_CACHE_TTL_MS', 3_600_000),
    cacheMaxSize: envInt('WORLDBANK_MCP_CACHE_MAX_SIZE', 200),
    timeoutMs: envInt('WORLDBANK_MCP_TIMEOUT_MS', 15_000),
    perPage: envInt('WORLDBANK_MCP_PER_PAGE', 100),
    format: envStr('WORLDBANK_MCP_FORMAT', 'json'),
    mrv: envInt('WORLDBANK_MCP_MRV', 5),
  }
}
