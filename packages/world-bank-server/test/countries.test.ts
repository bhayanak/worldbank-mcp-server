import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WorldBankClient } from '../src/api/client.js'
import type { WorldBankConfig } from '../src/api/types.js'
import countryFixture from './fixtures/country-usa.json'

const baseConfig: WorldBankConfig = {
  baseUrl: 'https://api.worldbank.org/v2',
  cacheTtlMs: 60_000,
  cacheMaxSize: 50,
  timeoutMs: 5_000,
  perPage: 50,
  format: 'json',
  mrv: 5,
}

describe('wb_get_country / wb_list_countries', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should fetch country profile', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(countryFixture), { status: 200 }),
    )

    const client = new WorldBankClient(baseConfig)
    const country = await client.getCountry('US')

    expect(country.id).toBe('USA')
    expect(country.name).toBe('United States')
    expect(country.region.value).toBe('North America')
    expect(country.incomeLevel.value).toBe('High income')
    expect(country.capitalCity).toBe('Washington D.C.')
  })

  it('should list countries with filters', async () => {
    const listResponse = [
      { page: 1, pages: 1, per_page: '50', total: 2 },
      [
        {
          id: 'USA',
          iso2Code: 'US',
          name: 'United States',
          region: { id: 'NAC', iso2code: 'XU', value: 'North America' },
          adminregion: { id: '', value: '' },
          incomeLevel: { id: 'HIC', value: 'High income' },
          lendingType: { id: 'LNX', value: 'Not classified' },
          capitalCity: 'Washington D.C.',
          longitude: '-77.032',
          latitude: '38.8895',
        },
        {
          id: 'CAN',
          iso2Code: 'CA',
          name: 'Canada',
          region: { id: 'NAC', iso2code: 'XU', value: 'North America' },
          adminregion: { id: '', value: '' },
          incomeLevel: { id: 'HIC', value: 'High income' },
          lendingType: { id: 'LNX', value: 'Not classified' },
          capitalCity: 'Ottawa',
          longitude: '-75.6919',
          latitude: '45.4215',
        },
      ],
    ]

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(listResponse), { status: 200 }),
    )

    const client = new WorldBankClient(baseConfig)
    const countries = await client.listCountries({ region: 'NAC', incomeLevel: 'HIC' })
    expect(countries.length).toBe(2)
    expect(countries[0].name).toBe('United States')
  })

  it('should throw on invalid country code', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify([{ page: 1, pages: 0, per_page: '50', total: 0 }, null]), {
        status: 200,
      }),
    )

    const client = new WorldBankClient(baseConfig)
    await expect(client.getCountry('ZZZ')).rejects.toThrow()
  })
})
