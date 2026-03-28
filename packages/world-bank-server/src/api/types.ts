export interface Country {
  id: string
  iso2Code: string
  name: string
  region: { id: string; iso2code: string; value: string }
  adminregion: { id: string; value: string }
  incomeLevel: { id: string; value: string }
  lendingType: { id: string; value: string }
  capitalCity: string
  longitude: string
  latitude: string
}

export interface Indicator {
  id: string
  name: string
  unit: string
  source: { id: string; value: string }
  sourceNote: string
  sourceOrganization: string
  topics: Array<{ id: string; value: string }>
}

export interface DataPoint {
  indicator: { id: string; value: string }
  country: { id: string; value: string }
  countryiso3code: string
  date: string
  value: number | null
  unit: string
  obs_status: string
  decimal: number
}

export interface Topic {
  id: string
  value: string
  sourceNote: string
}

export interface CountryFilter {
  region?: string
  incomeLevel?: string
  limit?: number
  offset?: number
}

export interface DataQuery {
  startYear?: number
  endYear?: number
  mrv?: number
  perPage?: number
  page?: number
}

export interface WorldBankConfig {
  baseUrl: string
  cacheTtlMs: number
  cacheMaxSize: number
  timeoutMs: number
  perPage: number
  format: string
  mrv: number
}

export interface PaginationInfo {
  page: number
  pages: number
  per_page: string
  total: number
}
