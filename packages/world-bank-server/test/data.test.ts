import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WorldBankClient } from '../src/api/client.js'
import type { WorldBankConfig } from '../src/api/types.js'
import timeseriesFixture from './fixtures/timeseries-pop.json'

const baseConfig: WorldBankConfig = {
  baseUrl: 'https://api.worldbank.org/v2',
  cacheTtlMs: 60_000,
  cacheMaxSize: 50,
  timeoutMs: 5_000,
  perPage: 50,
  format: 'json',
  mrv: 5,
}

describe('wb_get_data / wb_get_timeseries', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should fetch data for a country and indicator', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(timeseriesFixture), { status: 200 }),
    )

    const client = new WorldBankClient(baseConfig)
    const data = await client.getData('US', 'SP.POP.TOTL', { mrv: 5 })

    expect(data.length).toBe(5)
    expect(data[0].country.value).toBe('United States')
    expect(data[0].indicator.id).toBe('SP.POP.TOTL')
    expect(data[0].value).toBe(334914895)
  })

  it('should handle date range queries', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(timeseriesFixture), { status: 200 }),
    )

    const client = new WorldBankClient(baseConfig)
    const data = await client.getData('US', 'SP.POP.TOTL', {
      startYear: 2019,
      endYear: 2023,
    })

    expect(data.length).toBeGreaterThan(0)
  })

  it('should throw on HTTP error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Not Found', { status: 404, statusText: 'Not Found' }),
    )

    const client = new WorldBankClient(baseConfig)
    await expect(client.getData('XX', 'INVALID', {})).rejects.toThrow('World Bank API error')
  })

  it('should reject non-worldbank base URLs', () => {
    expect(
      () =>
        new WorldBankClient({
          ...baseConfig,
          baseUrl: 'https://evil.example.com/v2',
        }),
    ).toThrow('Base URL must use api.worldbank.org')
  })
})
