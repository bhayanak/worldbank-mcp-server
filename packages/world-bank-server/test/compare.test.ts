import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WorldBankClient } from '../src/api/client.js'
import type { WorldBankConfig } from '../src/api/types.js'

const baseConfig: WorldBankConfig = {
  baseUrl: 'https://api.worldbank.org/v2',
  cacheTtlMs: 60_000,
  cacheMaxSize: 50,
  timeoutMs: 5_000,
  perPage: 50,
  format: 'json',
  mrv: 5,
}

describe('wb_compare_countries', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should fetch data for multiple countries', async () => {
    const makeResponse = (code: string, name: string, value: number) => [
      { page: 1, pages: 1, per_page: '50', total: 1 },
      [
        {
          indicator: { id: 'NY.GDP.PCAP.CD', value: 'GDP per capita (current US$)' },
          country: { id: code.substring(0, 2), value: name },
          countryiso3code: code,
          date: '2022',
          value,
          unit: '',
          obs_status: '',
          decimal: 0,
        },
      ],
    ]

    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(makeResponse('USA', 'United States', 76329)), { status: 200 }),
    )
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(makeResponse('IND', 'India', 2389)), { status: 200 }),
    )

    const client = new WorldBankClient(baseConfig)
    const us = await client.getData('US', 'NY.GDP.PCAP.CD', { mrv: 1 })
    const ind = await client.getData('IN', 'NY.GDP.PCAP.CD', { mrv: 1 })

    expect(us[0].value).toBe(76329)
    expect(ind[0].value).toBe(2389)
  })
})
