import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WorldBankClient } from '../src/api/client.js'
import type { WorldBankConfig } from '../src/api/types.js'
import indicatorFixture from './fixtures/indicator-gdp.json'

const baseConfig: WorldBankConfig = {
  baseUrl: 'https://api.worldbank.org/v2',
  cacheTtlMs: 60_000,
  cacheMaxSize: 50,
  timeoutMs: 5_000,
  perPage: 50,
  format: 'json',
  mrv: 5,
}

describe('wb_get_indicator / wb_search_indicators', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should fetch indicator metadata', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(indicatorFixture), { status: 200 }),
    )

    const client = new WorldBankClient(baseConfig)
    const indicator = await client.getIndicator('NY.GDP.MKTP.CD')

    expect(indicator.id).toBe('NY.GDP.MKTP.CD')
    expect(indicator.name).toBe('GDP (current US$)')
    expect(indicator.source.value).toBe('World Development Indicators')
  })

  it('should throw on indicator not found', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify([{ page: 1, pages: 0, per_page: '50', total: 0 }, null]), {
        status: 200,
      }),
    )

    const client = new WorldBankClient(baseConfig)
    await expect(client.getIndicator('INVALID')).rejects.toThrow()
  })

  it('should search indicators with client-side filtering', async () => {
    const searchResponse = [
      { page: 1, pages: 1, per_page: '50', total: 1 },
      [
        {
          id: 'NY.GDP.MKTP.CD',
          name: 'GDP (current US$)',
          unit: '',
          source: { id: '2', value: 'World Development Indicators' },
          sourceNote: '',
          sourceOrganization: '',
          topics: [],
        },
        {
          id: 'NY.GDP.PCAP.CD',
          name: 'GDP per capita (current US$)',
          unit: '',
          source: { id: '2', value: 'World Development Indicators' },
          sourceNote: '',
          sourceOrganization: '',
          topics: [],
        },
      ],
    ]

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(searchResponse), { status: 200 }),
    )

    const client = new WorldBankClient(baseConfig)
    const results = await client.searchIndicators('GDP', undefined, 10)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name).toContain('GDP')
  })
})
