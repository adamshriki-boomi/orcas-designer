import { cn } from './utils'

describe('cn', () => {
  it('merges multiple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    const isActive = true
    const isDisabled = false
    expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active')
  })

  it('resolves Tailwind conflicts by keeping the last value', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })
})
