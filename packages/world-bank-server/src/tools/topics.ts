import { z } from 'zod'
import type { WorldBankClient } from '../api/client.js'
import { WorldBankFormatter } from '../utils/formatter.js'

export const listTopicsSchema = z.object({})

export const getTopicIndicatorsSchema = z.object({
  topicId: z.number().describe('Topic ID from wb_list_topics'),
  limit: z.number().optional().default(20),
})

export async function handleListTopics(client: WorldBankClient): Promise<string> {
  const topics = await client.listTopics()
  return WorldBankFormatter.formatTopics(topics)
}

export async function handleGetTopicIndicators(
  client: WorldBankClient,
  args: z.infer<typeof getTopicIndicatorsSchema>,
): Promise<string> {
  const indicators = await client.getTopicIndicators(args.topicId, args.limit)
  if (indicators.length === 0) {
    return `No indicators found for topic ${args.topicId}.`
  }
  return WorldBankFormatter.formatIndicatorList(indicators)
}
