import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WorldBankClient } from '../src/api/client.js'
import type { WorldBankConfig } from '../src/api/types.js'
import { handleGetIndicator, handleSearchIndicators } from '../src/tools/indicators.js'
import { handleGetCountry, handleListCountries } from '../src/tools/countries.js'
import { handleGetData, handleGetTimeseries } from '../src/tools/data.js'
import { handleCompareCountries } from '../src/tools/compare.js'
import { handleListTopics, handleGetTopicIndicators } from '../src/tools/topics.js'
import { handleGetRegionalData } from '../src/tools/regions.js'

const baseConfig: WorldBankConfig = {
  baseUrl: 'https://api.worldbank.org/v2',
  cacheTtlMs: 60_000,
  cacheMaxSize: 50,
  timeoutMs: 5_000,
  perPage: 50,
  format: 'json',
  mrv: 5,
}

function mockFetch(data: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify([{ page: 1, pages: 1, per_page: '50', total: 1 }, data]), {
      status: 200,
    }),
  )
}

const sampleIndicator = {
  id: 'NY.GDP.MKTP.CD',
  name: 'GDP (current US$)',
  unit: '',
  source: { id: '2', value: 'World Development Indicators' },
  sourceNote: 'GDP note.',
  sourceOrganization: 'World Bank',
  topics: [{ id: '3', value: 'Economy & Growth' }],
}

const sampleCountry = {
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
}

const sampleDataPoint = {
  indicator: { id: 'NY.GDP.MKTP.CD', value: 'GDP (current US$)' },
  country: { id: 'US', value: 'United States' },
  countryiso3code: 'USA',
  date: '2022',
  value: 25460000000000,
  unit: '',
  obs_status: '',
  decimal: 0,
}

describe('Tool Handlers — Indicators', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('handleGetIndicator returns formatted indicator', async () => {
    mockFetch([sampleIndicator])
    const client = new WorldBankClient(baseConfig)
    const result = await handleGetIndicator(client, { indicatorCode: 'NY.GDP.MKTP.CD' })
    expect(result).toContain('NY.GDP.MKTP.CD')
    expect(result).toContain('GDP (current US$)')
    expect(result).toContain('Economy & Growth')
  })

  it('handleSearchIndicators returns formatted list', async () => {
    mockFetch([sampleIndicator])
    const client = new WorldBankClient(baseConfig)
    const result = await handleSearchIndicators(client, { query: 'GDP', limit: 10 })
    expect(result).toContain('NY.GDP.MKTP.CD')
  })

  it('handleSearchIndicators returns message when no results', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ page: 1, pages: 0, per_page: '50', total: 0 }, []]), {
        status: 200,
      }),
    )
    const client = new WorldBankClient(baseConfig)
    const result = await handleSearchIndicators(client, { query: 'zzznoresults', limit: 10 })
    expect(result).toContain('No indicators found')
  })
})

describe('Tool Handlers — Countries', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('handleGetCountry returns formatted country profile', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    // Country request
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify([{ page: 1, pages: 1, per_page: '50', total: 1 }, [sampleCountry]]),
        { status: 200 },
      ),
    )
    // Quick stat requests (population, GDP, GNI)
    for (let i = 0; i < 3; i++) {
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            { page: 1, pages: 1, per_page: '50', total: 1 },
            [{ ...sampleDataPoint, value: i === 0 ? 331000000 : i === 1 ? 25e12 : 76000 }],
          ]),
          { status: 200 },
        ),
      )
    }
    const client = new WorldBankClient(baseConfig)
    const result = await handleGetCountry(client, { countryCode: 'US' })
    expect(result).toContain('United States')
    expect(result).toContain('North America')
    expect(result).toContain('Quick Stats')
  })

  it('handleGetCountry handles quick stat failures gracefully', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify([{ page: 1, pages: 1, per_page: '50', total: 1 }, [sampleCountry]]),
        { status: 200 },
      ),
    )
    // Quick stats fail
    for (let i = 0; i < 3; i++) {
      fetchSpy.mockRejectedValueOnce(new Error('API error'))
    }
    const client = new WorldBankClient(baseConfig)
    const result = await handleGetCountry(client, { countryCode: 'US' })
    expect(result).toContain('United States')
    expect(result).not.toContain('Quick Stats')
  })

  it('handleListCountries returns formatted list', async () => {
    mockFetch([sampleCountry])
    const client = new WorldBankClient(baseConfig)
    const result = await handleListCountries(client, { limit: 50 })
    expect(result).toContain('United States')
    expect(result).toContain('US (USA)')
  })
})

describe('Tool Handlers — Data', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('handleGetData returns formatted data table', async () => {
    mockFetch([sampleDataPoint, { ...sampleDataPoint, date: '2021', value: 23e12 }])
    const client = new WorldBankClient(baseConfig)
    const result = await handleGetData(client, {
      countryCode: 'US',
      indicatorCode: 'NY.GDP.MKTP.CD',
    })
    expect(result).toContain('GDP (current US$)')
    expect(result).toContain('2022')
    expect(result).toContain('Trend')
  })

  it('handleGetTimeseries with 5year interval filters data', async () => {
    const points = [2020, 2021, 2022, 2023, 2024, 2025].map((y) => ({
      ...sampleDataPoint,
      date: String(y),
      value: y * 1e9,
    }))
    mockFetch(points)
    const client = new WorldBankClient(baseConfig)
    const result = await handleGetTimeseries(client, {
      countryCode: 'US',
      indicatorCode: 'NY.GDP.MKTP.CD',
      startYear: 1990,
      interval: '5year',
    })
    expect(result).toContain('2020')
    expect(result).toContain('2025')
  })

  it('handleGetTimeseries with 10year interval filters data', async () => {
    const points = [2000, 2005, 2010, 2015, 2020].map((y) => ({
      ...sampleDataPoint,
      date: String(y),
      value: y * 1e9,
    }))
    mockFetch(points)
    const client = new WorldBankClient(baseConfig)
    const result = await handleGetTimeseries(client, {
      countryCode: 'US',
      indicatorCode: 'NY.GDP.MKTP.CD',
      startYear: 1990,
      interval: '10year',
    })
    expect(result).toContain('2000')
    expect(result).toContain('2010')
    expect(result).toContain('2020')
  })

  it('handleGetTimeseries with annual interval keeps all data', async () => {
    const points = [2021, 2022, 2023].map((y) => ({
      ...sampleDataPoint,
      date: String(y),
      value: y * 1e9,
    }))
    mockFetch(points)
    const client = new WorldBankClient(baseConfig)
    const result = await handleGetTimeseries(client, {
      countryCode: 'US',
      indicatorCode: 'NY.GDP.MKTP.CD',
      startYear: 1990,
      interval: 'annual',
    })
    expect(result).toContain('2021')
    expect(result).toContain('2022')
    expect(result).toContain('2023')
  })
})

describe('Tool Handlers — Compare', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('handleCompareCountries returns comparison table', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          { page: 1, pages: 1, per_page: '50', total: 1 },
          [{ ...sampleDataPoint, value: 76329 }],
        ]),
        { status: 200 },
      ),
    )
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          { page: 1, pages: 1, per_page: '50', total: 1 },
          [
            {
              ...sampleDataPoint,
              country: { id: 'IN', value: 'India' },
              countryiso3code: 'IND',
              value: 2389,
            },
          ],
        ]),
        { status: 200 },
      ),
    )

    const client = new WorldBankClient(baseConfig)
    const result = await handleCompareCountries(client, {
      countryCodes: ['US', 'IN'],
      indicatorCode: 'NY.GDP.PCAP.CD',
      year: 2022,
    })
    expect(result).toContain('United States')
    expect(result).toContain('India')
  })

  it('handleCompareCountries handles empty data from API', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify([{ page: 1, pages: 1, per_page: '50', total: 0 }, []]), {
        status: 200,
      }),
    )
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify([{ page: 1, pages: 1, per_page: '50', total: 0 }, []]), {
        status: 200,
      }),
    )

    const client = new WorldBankClient(baseConfig)
    const result = await handleCompareCountries(client, {
      countryCodes: ['XX', 'YY'],
      indicatorCode: 'INVALID',
    })
    expect(result).toContain('No data available')
  })

  it('handleCompareCountries handles fetch errors for some countries', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          { page: 1, pages: 1, per_page: '50', total: 1 },
          [{ ...sampleDataPoint, value: 76329 }],
        ]),
        { status: 200 },
      ),
    )
    fetchSpy.mockRejectedValueOnce(new Error('Network error'))

    const client = new WorldBankClient(baseConfig)
    const result = await handleCompareCountries(client, {
      countryCodes: ['US', 'ZZ'],
      indicatorCode: 'NY.GDP.PCAP.CD',
    })
    expect(result).toContain('United States')
  })
})

describe('Tool Handlers — Topics', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('handleListTopics returns formatted topics', async () => {
    mockFetch([
      { id: '1', value: 'Agriculture & Rural Development', sourceNote: '' },
      { id: '2', value: 'Aid Effectiveness', sourceNote: '' },
    ])
    const client = new WorldBankClient(baseConfig)
    const result = await handleListTopics(client)
    expect(result).toContain('Available Topics')
    expect(result).toContain('Agriculture & Rural Development')
    expect(result).toContain('[2]')
  })

  it('handleGetTopicIndicators returns list', async () => {
    mockFetch([sampleIndicator])
    const client = new WorldBankClient(baseConfig)
    const result = await handleGetTopicIndicators(client, { topicId: 3, limit: 20 })
    expect(result).toContain('NY.GDP.MKTP.CD')
  })

  it('handleGetTopicIndicators returns message when empty', async () => {
    mockFetch([])
    const client = new WorldBankClient(baseConfig)
    const result = await handleGetTopicIndicators(client, { topicId: 999, limit: 20 })
    expect(result).toContain('No indicators found')
  })
})

describe('Tool Handlers — Regions', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('handleGetRegionalData returns formatted data', async () => {
    mockFetch([
      {
        indicator: { id: 'SP.POP.TOTL', value: 'Population, total' },
        country: { id: '1W', value: 'World' },
        countryiso3code: 'WLD',
        date: '2022',
        value: 7900000000,
        unit: '',
        obs_status: '',
        decimal: 0,
      },
    ])
    const client = new WorldBankClient(baseConfig)
    const result = await handleGetRegionalData(client, {
      region: 'WLD',
      indicatorCode: 'SP.POP.TOTL',
    })
    expect(result).toContain('Population')
    expect(result).toContain('World')
  })
})
