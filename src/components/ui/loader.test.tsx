import { render } from '@testing-library/react'
import { SectionLoader } from './loader'

// Mock next/dynamic to render a simple placeholder instead of the Lit Web Component
vi.mock('next/dynamic', () => ({
  default: () => {
    const MockExLoader = (props: Record<string, unknown>) => (
      <div data-testid="ex-loader" data-variant={props.variant} data-label={props.label} />
    )
    MockExLoader.displayName = 'MockExLoader'
    return MockExLoader
  },
}))

describe('SectionLoader', () => {
  it('renders without crashing', () => {
    const { container } = render(<SectionLoader />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders the ExLoader with default label', () => {
    const { getByTestId } = render(<SectionLoader />)
    const loader = getByTestId('ex-loader')
    expect(loader).toBeDefined()
    expect(loader.getAttribute('data-label')).toBe('Loading...')
  })

  it('passes custom label to ExLoader', () => {
    const { getByTestId } = render(<SectionLoader label="Loading memories..." />)
    expect(getByTestId('ex-loader').getAttribute('data-label')).toBe('Loading memories...')
  })

  it('applies custom className to wrapper div', () => {
    const { container } = render(<SectionLoader className="mt-8" />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('mt-8')
    expect(wrapper.className).toContain('flex')
    expect(wrapper.className).toContain('items-center')
    expect(wrapper.className).toContain('justify-center')
  })

  it('renders spinner variant', () => {
    const { getByTestId } = render(<SectionLoader />)
    expect(getByTestId('ex-loader').getAttribute('data-variant')).toBe('spinner')
  })
})
