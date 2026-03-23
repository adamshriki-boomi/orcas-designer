import { generateId } from './id'

describe('generateId', () => {
  it('returns a non-empty string', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('returns unique values on successive calls', () => {
    const a = generateId()
    const b = generateId()
    expect(a).not.toBe(b)
  })
})
