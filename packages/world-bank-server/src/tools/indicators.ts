import { z } from 'zod'
import type { WorldBankClient } from '../api/client.js'
import { WorldBankFormatter } from '../utils/formatter.js'

export const getIndicatorSchema = z.object({
  indicatorCode: z
    .string()
    .describe("Indicator code (e.g., 'NY.GDP.MKTP.CD' for GDP, 'SP.POP.TOTL' for population)"),
})

export const searchIndicatorsSchema = z.object({
  query: z
    .string()
    .describe("Search term (e.g., 'GDP per capita', 'CO2 emissions', 'literacy rate')"),
  topic: z
    .string()
    .optional()
    .describe("Filter by topic (e.g., 'Health', 'Education', 'Environment')"),
  limit: z.number().min(1).max(50).optional().default(10),
})

export async function handleGetIndicator(
  client: WorldBankClient,
  args: z.infer<typeof getIndicatorSchema>,
): Promise<string> {
  const indicator = await client.getIndicator(args.indicatorCode)
  return WorldBankFormatter.formatIndicator(indicator)
}

export async function handleSearchIndicators(
  client: WorldBankClient,
  args: z.infer<typeof searchIndicatorsSchema>,
): Promise<string> {
  const indicators = await client.searchIndicators(args.query, args.topic, args.limit)
  if (indicators.length === 0) {
    return `No indicators found matching "${args.query}".`
  }
  return WorldBankFormatter.formatIndicatorList(indicators)
}
