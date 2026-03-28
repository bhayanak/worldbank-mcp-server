import { describe, it, expect } from 'vitest'
import { LRUCache } from '../src/api/cache.js'

describe('LRUCache', () => {
  it('should store and retrieve values', () => {
    const cache = new LRUCache<string>(10, 60_000)
    cache.set('key1', 'value1')
    expect(cache.get('key1')).toBe('value1')
  })

  it('should return undefined for missing keys', () => {
    const cache = new LRUCache<string>(10, 60_000)
    expect(cache.get('nonexistent')).toBeUndefined()
  })

  it('should evict oldest entry when at capacity', () => {
    const cache = new LRUCache<string>(2, 60_000)
    cache.set('a', '1')
    cache.set('b', '2')
    cache.set('c', '3') // should evict 'a'
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBe('2')
    expect(cache.get('c')).toBe('3')
  })

  it('should refresh entry on access (LRU behavior)', () => {
    const cache = new LRUCache<string>(2, 60_000)
    cache.set('a', '1')
    cache.set('b', '2')
    cache.get('a') // refresh 'a'
    cache.set('c', '3') // should evict 'b' (least recently used)
    expect(cache.get('a')).toBe('1')
    expect(cache.get('b')).toBeUndefined()
    expect(cache.get('c')).toBe('3')
  })

  it('should expire entries after TTL', () => {
    const cache = new LRUCache<string>(10, 1) // 1ms TTL
    cache.set('key', 'value')
    // Wait for expiry
    const start = Date.now()
    while (Date.now() - start < 5) {
      /* spin */
    }
    expect(cache.get('key')).toBeUndefined()
  })

  it('should track size correctly', () => {
    const cache = new LRUCache<string>(10, 60_000)
    expect(cache.size).toBe(0)
    cache.set('a', '1')
    expect(cache.size).toBe(1)
    cache.set('b', '2')
    expect(cache.size).toBe(2)
    cache.clear()
    expect(cache.size).toBe(0)
  })

  it('should update existing key without increasing size', () => {
    const cache = new LRUCache<string>(10, 60_000)
    cache.set('a', '1')
    cache.set('a', '2')
    expect(cache.size).toBe(1)
    expect(cache.get('a')).toBe('2')
  })
})
