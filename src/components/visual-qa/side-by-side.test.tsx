import { render, screen } from '@testing-library/react'
import { SideBySide } from './side-by-side'

describe('SideBySide', () => {
  it('renders two images with descriptive alt text', () => {
    render(
      <SideBySide
        designImageUrl="https://x/design.png"
        implImageUrl="https://x/impl.png"
        designFigmaUrl={null}
      />
    )
    expect(screen.getByAltText('Design')).toHaveAttribute('src', 'https://x/design.png')
    expect(screen.getByAltText('Implementation')).toHaveAttribute('src', 'https://x/impl.png')
  })

  it('shows the Figma URL link when designFigmaUrl is provided', () => {
    render(
      <SideBySide
        designImageUrl="https://x/design.png"
        implImageUrl="https://x/impl.png"
        designFigmaUrl="https://figma.com/design/abc?node-id=1-2"
      />
    )
    const link = screen.getByRole('link', { name: /open in figma/i })
    expect(link).toHaveAttribute('href', 'https://figma.com/design/abc?node-id=1-2')
  })

  it('omits the Figma link when designFigmaUrl is null', () => {
    render(
      <SideBySide
        designImageUrl="https://x/design.png"
        implImageUrl="https://x/impl.png"
        designFigmaUrl={null}
      />
    )
    expect(screen.queryByRole('link', { name: /open in figma/i })).toBeNull()
  })

  it('labels each panel as Design and Implementation', () => {
    render(
      <SideBySide
        designImageUrl="https://x/design.png"
        implImageUrl="https://x/impl.png"
        designFigmaUrl={null}
      />
    )
    expect(screen.getByText('Design')).toBeInTheDocument()
    expect(screen.getByText('Implementation')).toBeInTheDocument()
  })
})
