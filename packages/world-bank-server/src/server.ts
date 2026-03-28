import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WorldBankClient } from './api/client.js'
import type { WorldBankConfig } from './api/types.js'
import {
  getIndicatorSchema,
  searchIndicatorsSchema,
  handleGetIndicator,
  handleSearchIndicators,
} from './tools/indicators.js'
import {
  getCountrySchema,
  listCountriesSchema,
  handleGetCountry,
  handleListCountries,
} from './tools/countries.js'
import {
  getDataSchema,
  getTimeseriesSchema,
  handleGetData,
  handleGetTimeseries,
} from './tools/data.js'
import { compareCountriesSchema, handleCompareCountries } from './tools/compare.js'
import {
  listTopicsSchema,
  getTopicIndicatorsSchema,
  handleListTopics,
  handleGetTopicIndicators,
} from './tools/topics.js'
import { getRegionalDataSchema, handleGetRegionalData } from './tools/regions.js'

export function createServer(config: WorldBankConfig): McpServer {
  const client = new WorldBankClient(config)

  const server = new McpServer({
    name: 'world-bank-mcp-server',
    version: '0.1.0',
  })

  // --- Indicator Management ---
  server.tool(
    'wb_get_indicator',
    'Retrieve metadata about a World Bank indicator including description, source, and topics.',
    getIndicatorSchema.shape,
    async (args) => {
      try {
        const text = await handleGetIndicator(client, args)
        return { content: [{ type: 'text', text }] }
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Error: ${(err as Error).message}` }],
          isError: true,
        }
      }
    },
  )

  server.tool(
    'wb_search_indicators',
    'Search for World Bank indicators by keyword. Returns matching indicator codes and names.',
    searchIndicatorsSchema.shape,
    async (args) => {
      try {
        const text = await handleSearchIndicators(client, args)
        return { content: [{ type: 'text', text }] }
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Error: ${(err as Error).message}` }],
          isError: true,
        }
      }
    },
  )

  // --- Country Information ---
  server.tool(
    'wb_get_country',
    'Get a comprehensive country profile with region, income level, and quick statistics.',
    getCountrySchema.shape,
    async (args) => {
      try {
        const text = await handleGetCountry(client, args)
        return { content: [{ type: 'text', text }] }
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Error: ${(err as Error).message}` }],
          isError: true,
        }
      }
    },
  )

  server.tool(
    'wb_list_countries',
    'List countries filtered by region and/or income level.',
    listCountriesSchema.shape,
    async (args) => {
      try {
        const text = await handleListCountries(client, args)
        return { content: [{ type: 'text', text }] }
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Error: ${(err as Error).message}` }],
          isError: true,
        }
      }
    },
  )

  // --- Data Queries ---
  server.tool(
    'wb_get_data',
    'Get indicator data for a country with year range or most recent values.',
    getDataSchema.shape,
    async (args) => {
      try {
        const text = await handleGetData(client, args)
        return { content: [{ type: 'text', text }] }
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Error: ${(err as Error).message}` }],
          isError: true,
        }
      }
    },
  )

  server.tool(
    'wb_get_timeseries',
    'Get long-range time-series data for trend analysis with configurable intervals.',
    getTimeseriesSchema.shape,
    async (args) => {
      try {
        const text = await handleGetTimeseries(client, args)
        return { content: [{ type: 'text', text }] }
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Error: ${(err as Error).message}` }],
          isError: true,
        }
      }
    },
  )

  // --- Comparison ---
  server.tool(
    'wb_compare_countries',
    'Compare 2-6 countries side-by-side on a specific indicator.',
    compareCountriesSchema.shape,
    async (args) => {
      try {
        const text = await handleCompareCountries(client, args)
        return { content: [{ type: 'text', text }] }
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Error: ${(err as Error).message}` }],
          isError: true,
        }
      }
    },
  )

  // --- Topics & Categories ---
  server.tool(
    'wb_list_topics',
    'List all available World Bank data topics (health, education, economy, etc.).',
    listTopicsSchema.shape,
    async () => {
      try {
        const text = await handleListTopics(client)
        return { content: [{ type: 'text', text }] }
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Error: ${(err as Error).message}` }],
          isError: true,
        }
      }
    },
  )

  server.tool(
    'wb_get_topic_indicators',
    'Get indicators available under a specific topic.',
    getTopicIndicatorsSchema.shape,
    async (args) => {
      try {
        const text = await handleGetTopicIndicators(client, args)
        return { content: [{ type: 'text', text }] }
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Error: ${(err as Error).message}` }],
          isError: true,
        }
      }
    },
  )

  // --- Regional Aggregates ---
  server.tool(
    'wb_get_regional_data',
    'Get aggregate data at regional or income-group level.',
    getRegionalDataSchema.shape,
    async (args) => {
      try {
        const text = await handleGetRegionalData(client, args)
        return { content: [{ type: 'text', text }] }
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Error: ${(err as Error).message}` }],
          isError: true,
        }
      }
    },
  )

  return server
}
