import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import type { VisualQaFinding } from '@/lib/types'
import { FindingCard } from './finding-card'

const sample = (overrides: Partial<VisualQaFinding> = {}): VisualQaFinding => ({
  id: 'f1',
  severity: 'high',
  category: 'Component',
  exosphereComponent: 'ExButton',
  location: 'Primary CTA',
  description: 'CTA uses tertiary instead of primary',
  expected: 'Primary button',
  actual: 'Tertiary button',
  suggestedFix: 'Use ExButton type="primary"',
  ...overrides,
})

describe('FindingCard', () => {
  it('renders all fields', () => {
    render(<FindingCard finding={sample()} onChange={() => {}} onDelete={() => {}} />)
    expect(screen.getByDisplayValue('Primary CTA')).toBeInTheDocument()
    expect(screen.getByDisplayValue('CTA uses tertiary instead of primary')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Primary button')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Tertiary button')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Use ExButton type="primary"')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ExButton')).toBeInTheDocument()
  })

  it('changing severity fires onChange with the new severity', () => {
    const onChange = vi.fn()
    render(<FindingCard finding={sample()} onChange={onChange} onDelete={() => {}} />)
    fireEvent.change(screen.getByLabelText(/severity/i), { target: { value: 'low' } })
    expect(onChange).toHaveBeenCalledWith({ severity: 'low' })
  })

  it('changing category fires onChange with the new category', () => {
    const onChange = vi.fn()
    render(<FindingCard finding={sample()} onChange={onChange} onDelete={() => {}} />)
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'Typography' } })
    expect(onChange).toHaveBeenCalledWith({ category: 'Typography' })
  })

  it('editing the description fires onChange', () => {
    const onChange = vi.fn()
    render(<FindingCard finding={sample()} onChange={onChange} onDelete={() => {}} />)
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'New description' },
    })
    expect(onChange).toHaveBeenCalledWith({ description: 'New description' })
  })

  it('editing the location, expected, actual, suggested fix all fire onChange', () => {
    const onChange = vi.fn()
    render(<FindingCard finding={sample()} onChange={onChange} onDelete={() => {}} />)
    fireEvent.change(screen.getByLabelText(/location/i), { target: { value: 'New loc' } })
    fireEvent.change(screen.getByLabelText(/expected/i), { target: { value: 'New exp' } })
    fireEvent.change(screen.getByLabelText(/actual/i), { target: { value: 'New act' } })
    fireEvent.change(screen.getByLabelText(/suggested/i), { target: { value: 'New fix' } })
    expect(onChange).toHaveBeenCalledWith({ location: 'New loc' })
    expect(onChange).toHaveBeenCalledWith({ expected: 'New exp' })
    expect(onChange).toHaveBeenCalledWith({ actual: 'New act' })
    expect(onChange).toHaveBeenCalledWith({ suggestedFix: 'New fix' })
  })

  it('editing the Exosphere component pill fires onChange', () => {
    const onChange = vi.fn()
    render(<FindingCard finding={sample()} onChange={onChange} onDelete={() => {}} />)
    fireEvent.change(screen.getByLabelText(/exosphere component/i), {
      target: { value: 'ExBadge' },
    })
    expect(onChange).toHaveBeenCalledWith({ exosphereComponent: 'ExBadge' })
  })

  it('clicking Delete fires onDelete', () => {
    const onDelete = vi.fn()
    render(<FindingCard finding={sample()} onChange={() => {}} onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('omits the Exosphere component input value when not set on the finding', () => {
    render(
      <FindingCard
        finding={sample({ exosphereComponent: undefined })}
        onChange={() => {}}
        onDelete={() => {}}
      />
    )
    const input = screen.getByLabelText(/exosphere component/i) as HTMLInputElement
    expect(input.value).toBe('')
  })

  it('rejects an empty string when editing the Exosphere component (sets undefined)', () => {
    const onChange = vi.fn()
    render(<FindingCard finding={sample()} onChange={onChange} onDelete={() => {}} />)
    fireEvent.change(screen.getByLabelText(/exosphere component/i), { target: { value: '' } })
    expect(onChange).toHaveBeenCalledWith({ exosphereComponent: undefined })
  })

  it('exposes severity as an accessible group labeled by location', () => {
    render(<FindingCard finding={sample()} onChange={() => {}} onDelete={() => {}} />)
    expect(screen.getByRole('group', { name: /Primary CTA/i })).toBeInTheDocument()
  })
})
