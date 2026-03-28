import { z } from 'zod'
import type { WorldBankClient } from '../api/client.js'
import { WorldBankFormatter } from '../utils/formatter.js'
import { QUICK_STAT_INDICATORS } from '../utils/constants.js'

export const getCountrySchema = z.object({
  countryCode: z
    .string()
    .describe("ISO 3166-1 alpha-2 or alpha-3 country code (e.g., 'US', 'USA', 'IN', 'IND')"),
})

export const listCountriesSchema = z.object({
  region: z.string().optional().describe("Filter by region (e.g., 'EAS', 'SSF', 'ECS', 'NAC')"),
  incomeLevel: z
    .enum(['LIC', 'LMC', 'UMC', 'HIC'])
    .optional()
    .describe('Low/Lower-middle/Upper-middle/High income'),
  limit: z.number().optional().default(50),
})

export async function handleGetCountry(
  client: WorldBankClient,
  args: z.infer<typeof getCountrySchema>,
): Promise<string> {
  const country = await client.getCountry(args.countryCode)

  // Fetch quick stats
  const quickStats = []
  for (const ind of QUICK_STAT_INDICATORS) {
    try {
      const data = await client.getData(country.iso2Code, ind, { mrv: 1 })
      if (data && data.length > 0) {
        quickStats.push(data[0])
      }
    } catch {
      // Skip if indicator data unavailable
    }
  }

  return WorldBankFormatter.formatCountryProfile(country, quickStats)
}

export async function handleListCountries(
  client: WorldBankClient,
  args: z.infer<typeof listCountriesSchema>,
): Promise<string> {
  const countries = await client.listCountries({
    region: args.region,
    incomeLevel: args.incomeLevel,
    limit: args.limit,
  })
  return WorldBankFormatter.formatCountryList(countries)
}
