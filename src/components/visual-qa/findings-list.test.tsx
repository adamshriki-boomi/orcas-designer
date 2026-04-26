import { render, screen, fireEvent, within } from '@testing-library/react'
import { vi } from 'vitest'
import type { VisualQaFinding } from '@/lib/types'
import { FindingsList } from './findings-list'

const mk = (overrides: Partial<VisualQaFinding>): VisualQaFinding => ({
  id: overrides.id ?? Math.random().toString(36).slice(2),
  severity: 'medium',
  category: 'Layout',
  location: 'L',
  description: 'd',
  expected: 'e',
  actual: 'a',
  suggestedFix: 'f',
  ...overrides,
})

describe('FindingsList', () => {
  it('renders empty state when there are no findings', () => {
    render(<FindingsList findings={[]} onChange={() => {}} />)
    expect(screen.getByText(/no findings/i)).toBeInTheDocument()
  })

  it('groups findings by category and renders a heading per group', () => {
    const findings: VisualQaFinding[] = [
      mk({ id: 'a', category: 'Layout' }),
      mk({ id: 'b', category: 'Typography' }),
      mk({ id: 'c', category: 'Layout' }),
    ]
    render(<FindingsList findings={findings} onChange={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Layout' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Typography' })).toBeInTheDocument()
  })

  it('forwards an in-card edit to onChange with the patched finding in the same position', () => {
    const onChange = vi.fn()
    const findings = [
      mk({ id: 'a', location: 'A' }),
      mk({ id: 'b', location: 'B' }),
    ]
    render(<FindingsList findings={findings} onChange={onChange} />)

    fireEvent.change(screen.getByDisplayValue('A'), { target: { value: 'A-edited' } })

    expect(onChange).toHaveBeenCalledTimes(1)
    const [next] = onChange.mock.calls[0]
    expect(next).toHaveLength(2)
    expect(next[0].location).toBe('A-edited')
    expect(next[1].location).toBe('B')
  })

  it('removes the finding when its delete is clicked', () => {
    const onChange = vi.fn()
    const findings = [mk({ id: 'a', location: 'A' }), mk({ id: 'b', location: 'B' })]
    render(<FindingsList findings={findings} onChange={onChange} />)

    const cardA = screen.getByRole('group', { name: 'A' })
    fireEvent.click(within(cardA).getByRole('button', { name: /delete/i }))

    const [next] = onChange.mock.calls[0]
    expect(next).toHaveLength(1)
    expect(next[0].id).toBe('b')
  })

  it('Add finding button appends a new blank finding in that category', () => {
    const onChange = vi.fn()
    render(
      <FindingsList
        findings={[mk({ id: 'a', category: 'Color', location: 'A' })]}
        onChange={onChange}
      />
    )

    const colorSection = screen.getByRole('region', { name: /Color/i })
    fireEvent.click(within(colorSection).getByRole('button', { name: /add finding/i }))

    const [next] = onChange.mock.calls[0]
    expect(next).toHaveLength(2)
    expect(next[1].category).toBe('Color')
    expect(next[1].id).not.toBe('')
  })
})
