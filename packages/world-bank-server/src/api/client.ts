import type {
  WorldBankConfig,
  Country,
  Indicator,
  DataPoint,
  Topic,
  CountryFilter,
  DataQuery,
} from './types.js'
import { LRUCache } from './cache.js'

const ALLOWED_HOST = 'api.worldbank.org'

export class WorldBankClient {
  private readonly config: WorldBankConfig
  private readonly cache: LRUCache<unknown>

  constructor(config: WorldBankConfig) {
    // SSRF prevention: restrict base URL to known domain
    const parsed = new URL(config.baseUrl)
    if (parsed.hostname !== ALLOWED_HOST) {
      throw new Error(`Base URL must use ${ALLOWED_HOST}`)
    }
    this.config = config
    this.cache = new LRUCache(config.cacheMaxSize, config.cacheTtlMs)
  }

  private buildUrl(path: string, params: Record<string, string | number> = {}): string {
    const url = new URL(`${this.config.baseUrl}${path}`)
    url.searchParams.set('format', this.config.format)
    url.searchParams.set('per_page', String(params.per_page ?? this.config.perPage))
    for (const [k, v] of Object.entries(params)) {
      if (k !== 'per_page') {
        url.searchParams.set(k, String(v))
      }
    }
    return url.toString()
  }

  private async request<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
    const url = this.buildUrl(path, params)

    const cached = this.cache.get(url)
    if (cached !== undefined) return cached as T

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs)

    try {
      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) {
        throw new Error(`World Bank API error: ${res.status} ${res.statusText}`)
      }
      const json = await res.json()

      // World Bank API returns [pagination, data] for most endpoints
      if (!Array.isArray(json) || json.length < 2) {
        throw new Error('Unexpected World Bank API response format')
      }

      const data = json[1] as T
      this.cache.set(url, data)
      return data
    } finally {
      clearTimeout(timeout)
    }
  }

  async getCountry(code: string): Promise<Country> {
    const data = await this.request<Country[]>(`/country/${encodeURIComponent(code)}`)
    if (!data || data.length === 0) {
      throw new Error(`Country not found: ${code}`)
    }
    return data[0]
  }

  async listCountries(filter?: CountryFilter): Promise<Country[]> {
    const params: Record<string, string | number> = {}
    if (filter?.region) params.region = filter.region
    if (filter?.incomeLevel) params.incomeLevel = filter.incomeLevel
    if (filter?.limit) params.per_page = filter.limit

    return this.request<Country[]>('/country', params)
  }

  async getIndicator(code: string): Promise<Indicator> {
    const data = await this.request<Indicator[]>(`/indicator/${encodeURIComponent(code)}`)
    if (!data || data.length === 0) {
      throw new Error(`Indicator not found: ${code}`)
    }
    return data[0]
  }

  async searchIndicators(query: string, topic?: string, limit = 10): Promise<Indicator[]> {
    const params: Record<string, string | number> = { per_page: limit }
    let path = `/indicator`
    if (topic) {
      path = `/topic/${encodeURIComponent(topic)}/indicator`
    }
    // The World Bank search param filters by name
    const url = this.buildUrl(path, params)
    const searchUrl = `${url}&source=2`

    const cached = this.cache.get(`search:${query}:${topic}:${limit}`)
    if (cached !== undefined) return cached as Indicator[]

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs)

    try {
      const res = await fetch(searchUrl, { signal: controller.signal })
      if (!res.ok) {
        throw new Error(`World Bank API error: ${res.status} ${res.statusText}`)
      }
      const json = await res.json()
      if (!Array.isArray(json) || json.length < 2 || !json[1]) {
        return []
      }

      const indicators = json[1] as Indicator[]
      // Client-side filter by query string
      const q = query.toLowerCase()
      const filtered = indicators.filter(
        (ind) => ind.name.toLowerCase().includes(q) || ind.id.toLowerCase().includes(q),
      )
      const result = filtered.slice(0, limit)
      this.cache.set(`search:${query}:${topic}:${limit}`, result)
      return result
    } finally {
      clearTimeout(timeout)
    }
  }

  async getData(country: string, indicator: string, query?: DataQuery): Promise<DataPoint[]> {
    const params: Record<string, string | number> = {}
    if (query?.startYear && query?.endYear) {
      params.date = `${query.startYear}:${query.endYear}`
    }
    if (query?.mrv) params.mrv = query.mrv
    if (query?.perPage) params.per_page = query.perPage

    const path = `/country/${encodeURIComponent(country)}/indicator/${encodeURIComponent(indicator)}`
    return this.request<DataPoint[]>(path, params)
  }

  async listTopics(): Promise<Topic[]> {
    return this.request<Topic[]>('/topic')
  }

  async getTopicIndicators(topicId: number, limit = 20): Promise<Indicator[]> {
    const params: Record<string, string | number> = { per_page: limit }
    return this.request<Indicator[]>(`/topic/${topicId}/indicator`, params)
  }
}
