import { describe, it, expect } from 'vitest'
import { WorldBankFormatter } from '../src/utils/formatter.js'
import type { Country, Indicator, DataPoint } from '../src/api/types.js'

describe('WorldBankFormatter', () => {
  describe('formatLargeNumber', () => {
    it('should format trillions', () => {
      expect(WorldBankFormatter.formatLargeNumber(25.46e12)).toBe('$25.46T')
    })

    it('should format billions', () => {
      expect(WorldBankFormatter.formatLargeNumber(1.5e9)).toBe('$1.50B')
    })

    it('should format millions', () => {
      expect(WorldBankFormatter.formatLargeNumber(5.3e6)).toBe('5.3M')
    })

    it('should format thousands', () => {
      expect(WorldBankFormatter.formatLargeNumber(1500)).toBe('1,500')
    })

    it('should format small numbers', () => {
      expect(WorldBankFormatter.formatLargeNumber(42.5)).toBe('42.50')
    })
  })

  describe('formatSparkline', () => {
    it('should render ascending sparkline', () => {
      const result = WorldBankFormatter.formatSparkline([1, 2, 3, 4, 5])
      expect(result).toBe('▁▃▅▆█')
    })

    it('should return empty string for empty array', () => {
      expect(WorldBankFormatter.formatSparkline([])).toBe('')
    })

    it('should handle equal values', () => {
      const result = WorldBankFormatter.formatSparkline([5, 5, 5])
      // All values same, should be middle char or consistent
      expect(result.length).toBe(3)
    })
  })

  describe('formatPercentChange', () => {
    it('should format positive change', () => {
      expect(WorldBankFormatter.formatPercentChange(110, 100)).toBe('+10.0%')
    })

    it('should format negative change', () => {
      expect(WorldBankFormatter.formatPercentChange(90, 100)).toBe('-10.0%')
    })

    it('should handle zero previous value', () => {
      expect(WorldBankFormatter.formatPercentChange(100, 0)).toBe('N/A')
    })
  })

  describe('formatValue', () => {
    it('should format null as dash', () => {
      expect(WorldBankFormatter.formatValue(null)).toBe('—')
    })

    it('should format percentage indicators', () => {
      expect(WorldBankFormatter.formatValue(65.3, 'SE.ADT.LITR.ZS')).toBe('65.3%')
    })

    it('should format GDP values', () => {
      const result = WorldBankFormatter.formatValue(25.46e12, 'NY.GDP.MKTP.CD')
      expect(result).toBe('$25.46T')
    })

    it('should format population values', () => {
      const result = WorldBankFormatter.formatValue(331449281, 'SP.POP.TOTL')
      expect(result).toBe('331.4M')
    })

    it('should format billion population values', () => {
      const result = WorldBankFormatter.formatValue(1_400_000_000, 'SP.POP.TOTL')
      expect(result).toBe('1.40B')
    })

    it('should format small population values', () => {
      const result = WorldBankFormatter.formatValue(50000, 'SP.POP.TOTL')
      expect(result).toBe('50,000')
    })

    it('should format per-capita values', () => {
      const result = WorldBankFormatter.formatValue(76329, 'CUSTOM.PCAP.TEST')
      expect(result).toBe('$76,329')
    })

    it('should format generic numeric values', () => {
      const result = WorldBankFormatter.formatValue(42.567, 'SOME.OTHER.IND')
      expect(result).toBe('42.57')
    })
  })

  describe('formatCountryProfile', () => {
    it('should format a full country profile', () => {
      const country: Country = {
        id: 'USA',
        iso2Code: 'US',
        name: 'United States',
        region: { id: 'NAC', iso2code: 'XU', value: 'North America' },
        adminregion: { id: '', value: '' },
        incomeLevel: { id: 'HIC', value: 'High income' },
        lendingType: { id: 'LNX', value: 'Not classified' },
        capitalCity: 'Washington D.C.',
        longitude: '-77.032',
        latitude: '38.8895',
      }

      const result = WorldBankFormatter.formatCountryProfile(country)
      expect(result).toContain('United States')
      expect(result).toContain('North America')
      expect(result).toContain('High income')
      expect(result).toContain('Washington D.C.')
    })
  })

  describe('formatIndicator', () => {
    it('should format indicator metadata', () => {
      const indicator: Indicator = {
        id: 'NY.GDP.MKTP.CD',
        name: 'GDP (current US$)',
        unit: '',
        source: { id: '2', value: 'World Development Indicators' },
        sourceNote: 'GDP note here.',
        sourceOrganization: 'World Bank',
        topics: [{ id: '3', value: 'Economy & Growth' }],
      }

      const result = WorldBankFormatter.formatIndicator(indicator)
      expect(result).toContain('NY.GDP.MKTP.CD')
      expect(result).toContain('GDP (current US$)')
      expect(result).toContain('Economy & Growth')
    })
  })

  describe('formatDataTable', () => {
    it('should format data points into a table', () => {
      const data: DataPoint[] = [
        {
          indicator: { id: 'SP.POP.TOTL', value: 'Population, total' },
          country: { id: 'US', value: 'United States' },
          countryiso3code: 'USA',
          date: '2023',
          value: 334914895,
          unit: '',
          obs_status: '',
          decimal: 0,
        },
        {
          indicator: { id: 'SP.POP.TOTL', value: 'Population, total' },
          country: { id: 'US', value: 'United States' },
          countryiso3code: 'USA',
          date: '2022',
          value: 333271411,
          unit: '',
          obs_status: '',
          decimal: 0,
        },
      ]

      const result = WorldBankFormatter.formatDataTable(data, 'SP.POP.TOTL')
      expect(result).toContain('Population, total')
      expect(result).toContain('United States')
      expect(result).toContain('2023')
      expect(result).toContain('2022')
    })

    it('should handle empty data', () => {
      expect(WorldBankFormatter.formatDataTable([])).toBe('No data available.')
    })

    it('should handle all-null data', () => {
      const data: DataPoint[] = [
        {
          indicator: { id: 'SP.POP.TOTL', value: 'Population, total' },
          country: { id: 'US', value: 'United States' },
          countryiso3code: 'USA',
          date: '2023',
          value: null,
          unit: '',
          obs_status: '',
          decimal: 0,
        },
      ]
      expect(WorldBankFormatter.formatDataTable(data)).toBe('No non-null data available.')
    })
  })

  describe('formatComparison', () => {
    it('should format comparison data', () => {
      const data = [
        { country: 'USA', value: 76329, countryName: 'United States' },
        { country: 'IND', value: 2389, countryName: 'India' },
      ]

      const result = WorldBankFormatter.formatComparison(data, 'GDP per capita', '2022')
      expect(result).toContain('GDP per capita')
      expect(result).toContain('2022')
      expect(result).toContain('United States')
      expect(result).toContain('India')
    })

    it('should handle all null values', () => {
      const data = [
        { country: 'USA', value: null, countryName: 'United States' },
        { country: 'IND', value: null, countryName: 'India' },
      ]

      const result = WorldBankFormatter.formatComparison(data, 'Test', '2022')
      expect(result).toContain('No data available')
    })
  })

  describe('formatCountryList', () => {
    it('should format list of countries', () => {
      const countries: Country[] = [
        {
          id: 'USA',
          iso2Code: 'US',
          name: 'United States',
          region: { id: 'NAC', iso2code: 'XU', value: 'North America' },
          adminregion: { id: '', value: '' },
          incomeLevel: { id: 'HIC', value: 'High income' },
          lendingType: { id: 'LNX', value: 'Not classified' },
          capitalCity: 'Washington D.C.',
          longitude: '-77.032',
          latitude: '38.8895',
        },
      ]

      const result = WorldBankFormatter.formatCountryList(countries)
      expect(result).toContain('US (USA)')
      expect(result).toContain('United States')
    })

    it('should handle empty list', () => {
      expect(WorldBankFormatter.formatCountryList([])).toBe('No countries found.')
    })
  })
})
