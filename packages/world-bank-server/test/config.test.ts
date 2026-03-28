import { describe, it, expect, afterEach } from 'vitest'
import { loadConfig } from '../src/config.js'

describe('loadConfig', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    // Restore original env
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('WORLDBANK_MCP_')) {
        delete process.env[key]
      }
    }
    Object.assign(process.env, originalEnv)
  })

  it('should return default values when no env vars set', () => {
    const config = loadConfig()
    expect(config.baseUrl).toBe('https://api.worldbank.org/v2')
    expect(config.cacheTtlMs).toBe(3_600_000)
    expect(config.cacheMaxSize).toBe(200)
    expect(config.timeoutMs).toBe(15_000)
    expect(config.perPage).toBe(100)
    expect(config.format).toBe('json')
    expect(config.mrv).toBe(5)
  })

  it('should read env vars when set', () => {
    process.env.WORLDBANK_MCP_BASE_URL = 'https://api.worldbank.org/v2'
    process.env.WORLDBANK_MCP_CACHE_TTL_MS = '5000'
    process.env.WORLDBANK_MCP_CACHE_MAX_SIZE = '50'
    process.env.WORLDBANK_MCP_TIMEOUT_MS = '10000'
    process.env.WORLDBANK_MCP_PER_PAGE = '25'
    process.env.WORLDBANK_MCP_FORMAT = 'json'
    process.env.WORLDBANK_MCP_MRV = '10'

    const config = loadConfig()
    expect(config.cacheTtlMs).toBe(5000)
    expect(config.cacheMaxSize).toBe(50)
    expect(config.timeoutMs).toBe(10000)
    expect(config.perPage).toBe(25)
    expect(config.mrv).toBe(10)
  })

  it('should fallback on non-numeric env vars', () => {
    process.env.WORLDBANK_MCP_CACHE_TTL_MS = 'notanumber'
    process.env.WORLDBANK_MCP_TIMEOUT_MS = ''

    const config = loadConfig()
    expect(config.cacheTtlMs).toBe(3_600_000)
    expect(config.timeoutMs).toBe(15_000)
  })
})
