import { z } from 'zod'
import type { WorldBankClient } from '../api/client.js'
import { WorldBankFormatter } from '../utils/formatter.js'

export const compareCountriesSchema = z.object({
  countryCodes: z.array(z.string()).min(2).max(6).describe('ISO country codes to compare'),
  indicatorCode: z.string().describe('Indicator code to compare on'),
  year: z.number().optional().describe('Specific year (default: most recent)'),
})

export async function handleCompareCountries(
  client: WorldBankClient,
  args: z.infer<typeof compareCountriesSchema>,
): Promise<string> {
  const results: Array<{ country: string; value: number | null; countryName: string }> = []
  let indicatorName = args.indicatorCode
  let displayYear: string | undefined

  for (const code of args.countryCodes) {
    try {
      const data = await client.getData(code, args.indicatorCode, {
        ...(args.year ? { startYear: args.year, endYear: args.year } : { mrv: 1 }),
      })

      if (data && data.length > 0) {
        const point = data[0]
        indicatorName = point.indicator.value
        displayYear = displayYear ?? point.date
        results.push({
          country: point.countryiso3code || code,
          value: point.value,
          countryName: point.country.value,
        })
      } else {
        results.push({ country: code, value: null, countryName: code })
      }
    } catch {
      results.push({ country: code, value: null, countryName: code })
    }
  }

  return WorldBankFormatter.formatComparison(results, indicatorName, displayYear)
}
