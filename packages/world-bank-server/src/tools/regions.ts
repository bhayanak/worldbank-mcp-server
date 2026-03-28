import { z } from 'zod'
import type { WorldBankClient } from '../api/client.js'
import { WorldBankFormatter } from '../utils/formatter.js'

export const getRegionalDataSchema = z.object({
  region: z
    .string()
    .describe("Region code (e.g., 'EAS' East Asia, 'SSF' Sub-Saharan Africa, 'WLD' World)"),
  indicatorCode: z.string().describe('Indicator code'),
  startYear: z.number().optional(),
  endYear: z.number().optional(),
})

export async function handleGetRegionalData(
  client: WorldBankClient,
  args: z.infer<typeof getRegionalDataSchema>,
): Promise<string> {
  const data = await client.getData(args.region, args.indicatorCode, {
    startYear: args.startYear,
    endYear: args.endYear,
    mrv: 5,
  })
  return WorldBankFormatter.formatDataTable(data, args.indicatorCode)
}
