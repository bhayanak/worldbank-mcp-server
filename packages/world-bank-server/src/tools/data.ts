import { z } from 'zod'
import type { WorldBankClient } from '../api/client.js'
import { WorldBankFormatter } from '../utils/formatter.js'

export const getDataSchema = z.object({
  countryCode: z.string().describe("ISO country code or 'all' for all countries"),
  indicatorCode: z.string().describe('World Bank indicator code'),
  startYear: z.number().optional().describe('Start year (e.g., 2000)'),
  endYear: z.number().optional().describe('End year (e.g., 2023)'),
  mrv: z.number().optional().describe('Most Recent Values to return'),
})

export const getTimeseriesSchema = z.object({
  countryCode: z.string().describe('ISO country code'),
  indicatorCode: z.string().describe('World Bank indicator code'),
  startYear: z.number().optional().default(1990),
  endYear: z.number().optional(),
  interval: z
    .enum(['annual', '5year', '10year'])
    .optional()
    .default('annual')
    .describe('Data interval'),
})

export async function handleGetData(
  client: WorldBankClient,
  args: z.infer<typeof getDataSchema>,
): Promise<string> {
  const data = await client.getData(args.countryCode, args.indicatorCode, {
    startYear: args.startYear,
    endYear: args.endYear,
    mrv: args.mrv ?? 5,
  })
  return WorldBankFormatter.formatDataTable(data, args.indicatorCode)
}

export async function handleGetTimeseries(
  client: WorldBankClient,
  args: z.infer<typeof getTimeseriesSchema>,
): Promise<string> {
  const currentYear = new Date().getFullYear()
  const data = await client.getData(args.countryCode, args.indicatorCode, {
    startYear: args.startYear,
    endYear: args.endYear ?? currentYear,
  })

  let filtered = data
  if (args.interval === '5year') {
    filtered = data.filter((d) => parseInt(d.date) % 5 === 0)
  } else if (args.interval === '10year') {
    filtered = data.filter((d) => parseInt(d.date) % 10 === 0)
  }

  return WorldBankFormatter.formatDataTable(filtered, args.indicatorCode)
}
