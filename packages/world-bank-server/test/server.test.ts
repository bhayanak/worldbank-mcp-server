import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { createServer } from '../src/server.js'
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

function mockApiResponse(data: unknown) {
  return new Response(JSON.stringify([{ page: 1, pages: 1, per_page: '50', total: 1 }, data]), {
    status: 200,
  })
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

async function createTestClient() {
  const server = createServer(baseConfig)
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  await server.connect(serverTransport)
  const client = new Client({ name: 'test-client', version: '1.0.0' })
  await client.connect(clientTransport)
  return { client, server }
}

describe('createServer', () => {
  it('should create an MCP server without errors', () => {
    const server = createServer(baseConfig)
    expect(server).toBeDefined()
  })

  it('should reject invalid base URL', () => {
    expect(() => createServer({ ...baseConfig, baseUrl: 'https://evil.example.com/v2' })).toThrow(
      'Base URL must use api.worldbank.org',
    )
  })
})

describe('MCP Server Integration — Tool Calls', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('wb_get_indicator returns data via MCP', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockApiResponse([sampleIndicator]))
    const { client } = await createTestClient()
    const result = await client.callTool({
      name: 'wb_get_indicator',
      arguments: { indicatorCode: 'NY.GDP.MKTP.CD' },
    })
    const text = (result.content as Array<{ type: string; text: string }>)[0].text
    expect(text).toContain('NY.GDP.MKTP.CD')
  })

  it('wb_get_indicator returns error on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network failure'))
    const { client } = await createTestClient()
    const result = await client.callTool({
      name: 'wb_get_indicator',
      arguments: { indicatorCode: 'BAD' },
    })
    expect(result.isError).toBe(true)
    const text = (result.content as Array<{ type: string; text: string }>)[0].text
    expect(text).toContain('Error')
  })

  it('wb_search_indicators returns data via MCP', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockApiResponse([sampleIndicator]))
    const { client } = await createTestClient()
    const result = await client.callTool({
      name: 'wb_search_indicators',
      arguments: { query: 'GDP' },
    })
    const text = (result.content as Array<{ type: string; text: string }>)[0].text
    expect(text).toContain('GDP')
  })

  it('wb_search_indicators returns error on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fail'))
    const { client } = await createTestClient()
    const result = await client.callTool({
      name: 'wb_search_indicators',
      arguments: { query: 'X' },
    })
    expect(result.isError).toBe(true)
  })

  it('wb_get_country returns data via MCP', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy.mockResolvedValueOnce(mockApiResponse([sampleCountry]))
    for (let i = 0; i < 3; i++) {
      fetchSpy.mockResolvedValueOnce(mockApiResponse([{ ...sampleDataPoint, value: 1e9 }]))
    }
    const { client } = await createTestClient()
    const result = await client.callTool({
      name: 'wb_get_country',
      arguments: { countryCode: 'US' },
    })
    const text = (result.content as Array<{ type: string; text: string }>)[0].text
    expect(text).toContain('United States')
  })

  it('wb_get_country returns error on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fail'))
    const { client } = await createTestClient()
    const result = await client.callTool({
      name: 'wb_get_country',
      arguments: { countryCode: 'XX' },
    })
    expect(result.isError).toBe(true)
  })

  it('wb_list_countries returns data via MCP', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockApiResponse([sampleCountry]))
    const { client } = await createTestClient()
    const result = await client.callTool({ name: 'wb_list_countries', arguments: {} })
    const text = (result.content as Array<{ type: string; text: string }>)[0].text
    expect(text).toContain('United States')
  })

  it('wb_list_countries returns error on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fail'))
    const { client } = await createTestClient()
    const result = await client.callTool({ name: 'wb_list_countries', arguments: {} })
    expect(result.isError).toBe(true)
  })

  it('wb_get_data returns data via MCP', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockApiResponse([sampleDataPoint]))
    const { client } = await createTestClient()
    const result = await client.callTool({
      name: 'wb_get_data',
      arguments: { countryCode: 'US', indicatorCode: 'NY.GDP.MKTP.CD' },
    })
    const text = (result.content as Array<{ type: string; text: string }>)[0].text
    expect(text).toContain('GDP')
  })

  it('wb_get_data returns error on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fail'))
    const { client } = await createTestClient()
    const result = await client.callTool({
      name: 'wb_get_data',
      arguments: { countryCode: 'US', indicatorCode: 'X' },
    })
    expect(result.isError).toBe(true)
  })

  it('wb_get_timeseries returns data via MCP', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockApiResponse([sampleDataPoint]))
    const { client } = await createTestClient()
    const result = await client.callTool({
      name: 'wb_get_timeseries',
      arguments: { countryCode: 'US', indicatorCode: 'NY.GDP.MKTP.CD' },
    })
    const text = (result.content as Array<{ type: string; text: string }>)[0].text
    expect(text).toContain('GDP')
  })

  it('wb_get_timeseries returns error on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fail'))
    const { client } = await createTestClient()
    const result = await client.callTool({
      name: 'wb_get_timeseries',
      arguments: { countryCode: 'US', indicatorCode: 'X' },
    })
    expect(result.isError).toBe(true)
  })

  it('wb_compare_countries returns data via MCP', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy.mockResolvedValueOnce(mockApiResponse([{ ...sampleDataPoint, value: 76329 }]))
    fetchSpy.mockResolvedValueOnce(
      mockApiResponse([
        {
          ...sampleDataPoint,
          value: 2389,
          country: { id: 'IN', value: 'India' },
          countryiso3code: 'IND',
        },
      ]),
    )
    const { client } = await createTestClient()
    const result = await client.callTool({
      name: 'wb_compare_countries',
      arguments: { countryCodes: ['US', 'IN'], indicatorCode: 'NY.GDP.PCAP.CD' },
    })
    const text = (result.content as Array<{ type: string; text: string }>)[0].text
    expect(text).toContain('United States')
  })

  it('wb_compare_countries returns error on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fail'))
    const { client } = await createTestClient()
    const result = await client.callTool({
      name: 'wb_compare_countries',
      arguments: { countryCodes: ['US', 'IN'], indicatorCode: 'X' },
    })
    // Even on failure, compare catches errors per-country and returns comparison
    expect(result.content).toBeDefined()
  })

  it('wb_list_topics returns data via MCP', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockApiResponse([{ id: '1', value: 'Agriculture', sourceNote: '' }]),
    )
    const { client } = await createTestClient()
    const result = await client.callTool({ name: 'wb_list_topics', arguments: {} })
    const text = (result.content as Array<{ type: string; text: string }>)[0].text
    expect(text).toContain('Agriculture')
  })

  it('wb_list_topics returns error on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fail'))
    const { client } = await createTestClient()
    const result = await client.callTool({ name: 'wb_list_topics', arguments: {} })
    expect(result.isError).toBe(true)
  })

  it('wb_get_topic_indicators returns data via MCP', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockApiResponse([sampleIndicator]))
    const { client } = await createTestClient()
    const result = await client.callTool({
      name: 'wb_get_topic_indicators',
      arguments: { topicId: 3 },
    })
    const text = (result.content as Array<{ type: string; text: string }>)[0].text
    expect(text).toContain('GDP')
  })

  it('wb_get_topic_indicators returns error on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fail'))
    const { client } = await createTestClient()
    const result = await client.callTool({
      name: 'wb_get_topic_indicators',
      arguments: { topicId: 3 },
    })
    expect(result.isError).toBe(true)
  })

  it('wb_get_regional_data returns data via MCP', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockApiResponse([sampleDataPoint]))
    const { client } = await createTestClient()
    const result = await client.callTool({
      name: 'wb_get_regional_data',
      arguments: { region: 'WLD', indicatorCode: 'NY.GDP.MKTP.CD' },
    })
    const text = (result.content as Array<{ type: string; text: string }>)[0].text
    expect(text).toContain('GDP')
  })

  it('wb_get_regional_data returns error on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fail'))
    const { client } = await createTestClient()
    const result = await client.callTool({
      name: 'wb_get_regional_data',
      arguments: { region: 'WLD', indicatorCode: 'X' },
    })
    expect(result.isError).toBe(true)
  })
})
