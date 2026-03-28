import type { Country, Indicator, DataPoint } from '../api/types.js'

const SPARKLINE_CHARS = '▁▂▃▄▅▆▇█'

export class WorldBankFormatter {
  static formatLargeNumber(n: number): string {
    const abs = Math.abs(n)
    if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
    if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
    if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`
    if (abs >= 1e3) return n.toLocaleString('en-US')
    return n.toFixed(2)
  }

  static formatValue(value: number | null, indicator?: string): string {
    if (value === null) return '—'
    const id = indicator?.toLowerCase() ?? ''
    // Percentage indicators
    if (id.includes('.zs') || id.includes('.zg')) {
      return `${value.toFixed(1)}%`
    }
    // GDP/monetary — current US$
    if (id.includes('mktp.cd') || id.includes('gdp') || id.includes('gnp')) {
      return WorldBankFormatter.formatLargeNumber(value)
    }
    // Population
    if (id.includes('pop.totl')) {
      const abs = Math.abs(value)
      if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`
      if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`
      return value.toLocaleString('en-US')
    }
    // Per-capita monetary
    if (id.includes('pcap')) {
      return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    }
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
  }

  static formatSparkline(values: number[]): string {
    if (values.length === 0) return ''
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    return values
      .map((v) => {
        const idx = Math.round(((v - min) / range) * (SPARKLINE_CHARS.length - 1))
        return SPARKLINE_CHARS[idx]
      })
      .join('')
  }

  static formatPercentChange(current: number, previous: number): string {
    if (previous === 0) return 'N/A'
    const change = ((current - previous) / Math.abs(previous)) * 100
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  static formatCountryProfile(country: Country, quickStats?: DataPoint[]): string {
    const lines = [
      `Country Profile: ${country.name} (${country.id})`,
      `  Region: ${country.region.value}`,
      `  Income Level: ${country.incomeLevel.value}`,
      `  Lending Type: ${country.lendingType.value}`,
      `  Capital: ${country.capitalCity || '—'}`,
    ]
    if (country.longitude && country.latitude) {
      lines.push(`  Longitude: ${country.longitude}  Latitude: ${country.latitude}`)
    }
    if (quickStats && quickStats.length > 0) {
      lines.push('')
      lines.push('Quick Stats (most recent):')
      for (const dp of quickStats) {
        if (dp.value !== null) {
          lines.push(
            `  ${dp.indicator.value}: ${WorldBankFormatter.formatValue(dp.value, dp.indicator.id)} (${dp.date})`,
          )
        }
      }
    }
    return lines.join('\n')
  }

  static formatIndicator(indicator: Indicator): string {
    const topics = indicator.topics.map((t) => t.value).join(', ') || '—'
    return [
      `Indicator: ${indicator.id}`,
      `Name: ${indicator.name}`,
      `Source: ${indicator.source.value} (ID: ${indicator.source.id})`,
      `Topic: ${topics}`,
      '',
      indicator.sourceNote || '',
    ]
      .filter(Boolean)
      .join('\n')
  }

  static formatDataTable(data: DataPoint[], indicatorId?: string): string {
    if (data.length === 0) return 'No data available.'

    const sorted = [...data]
      .filter((d) => d.value !== null)
      .sort((a, b) => parseInt(b.date) - parseInt(a.date))

    if (sorted.length === 0) return 'No non-null data available.'

    const header = `${sorted[0].indicator.value} — ${sorted[0].country.value}`
    const sep = '━'.repeat(Math.min(header.length, 50))

    const lines = [header, sep, '']
    lines.push('Year     Value               Change')

    for (let i = 0; i < sorted.length; i++) {
      const dp = sorted[i]
      const val = WorldBankFormatter.formatValue(dp.value, indicatorId ?? dp.indicator.id)
      let change = ''
      if (i < sorted.length - 1 && sorted[i + 1].value !== null) {
        change = WorldBankFormatter.formatPercentChange(dp.value!, sorted[i + 1].value!)
      }
      lines.push(`${dp.date.padEnd(9)}${val.padEnd(20)}${change}`)
    }

    // Sparkline
    const values = sorted
      .filter((d) => d.value !== null)
      .reverse()
      .map((d) => d.value!)
    if (values.length > 1) {
      const trend = values[values.length - 1] > values[0] ? 'growing' : 'declining'
      lines.push('')
      lines.push(`Trend: ${WorldBankFormatter.formatSparkline(values)} (${trend})`)
    }

    return lines.join('\n')
  }

  static formatComparison(
    data: Array<{ country: string; value: number | null; countryName: string }>,
    indicatorName: string,
    year?: string,
  ): string {
    const valid = data.filter((d) => d.value !== null).sort((a, b) => b.value! - a.value!)
    if (valid.length === 0) return 'No data available for comparison.'

    const maxVal = valid[0].value!
    const barWidth = 20

    const lines = [`${indicatorName}${year ? ` — ${year}` : ''}`, '']
    lines.push('Country          Value       Rank    Bar')
    lines.push('─'.repeat(50))

    for (let i = 0; i < valid.length; i++) {
      const d = valid[i]
      const name = d.countryName.padEnd(17).substring(0, 17)
      const val = WorldBankFormatter.formatValue(d.value, '').padEnd(12)
      const rank = `${i + 1}${ordinalSuffix(i + 1)}`.padEnd(8)
      const barLen = Math.round((d.value! / maxVal) * barWidth)
      const bar = '█'.repeat(barLen)
      lines.push(`${name}${val}${rank}${bar}`)
    }

    return lines.join('\n')
  }

  static formatTopics(topics: Array<{ id: string; value: string; sourceNote: string }>): string {
    const lines = ['Available Topics:', '']
    for (const t of topics) {
      lines.push(`  [${t.id}] ${t.value}`)
    }
    return lines.join('\n')
  }

  static formatIndicatorList(indicators: Indicator[]): string {
    if (indicators.length === 0) return 'No indicators found.'
    const lines: string[] = []
    for (const ind of indicators) {
      lines.push(`${ind.id} — ${ind.name}`)
    }
    return lines.join('\n')
  }

  static formatCountryList(countries: Country[]): string {
    if (countries.length === 0) return 'No countries found.'
    const lines: string[] = []
    for (const c of countries) {
      lines.push(`${c.iso2Code} (${c.id}) — ${c.name} | ${c.region.value} | ${c.incomeLevel.value}`)
    }
    return lines.join('\n')
  }
}

function ordinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}
