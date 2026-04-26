import { parseFigmaNodeUrl } from './figma-url'

describe('parseFigmaNodeUrl', () => {
  it('parses a design URL with a hyphen-form node id', () => {
    const result = parseFigmaNodeUrl(
      'https://www.figma.com/design/ABC123fileKey/Project-Name?node-id=12-345'
    )
    expect(result).toEqual({ fileKey: 'ABC123fileKey', nodeId: '12:345' })
  })

  it('parses a legacy /file/ URL with a percent-encoded node id', () => {
    const result = parseFigmaNodeUrl(
      'https://figma.com/file/XYZ789key/My-File?node-id=1%3A2'
    )
    expect(result).toEqual({ fileKey: 'XYZ789key', nodeId: '1:2' })
  })

  it('uses the branch key as the fileKey when the URL is a branch URL', () => {
    const result = parseFigmaNodeUrl(
      'https://www.figma.com/design/ABC123/branch/BRANCH456key/Project?node-id=99-1'
    )
    expect(result).toEqual({ fileKey: 'BRANCH456key', nodeId: '99:1' })
  })

  it('returns null when the node-id is missing', () => {
    expect(
      parseFigmaNodeUrl('https://www.figma.com/design/ABC123/Project-Name')
    ).toBeNull()
  })

  it('returns null for a non-figma host', () => {
    expect(
      parseFigmaNodeUrl('https://example.com/design/ABC123/Project?node-id=1-2')
    ).toBeNull()
  })

  it('returns null for a malformed URL', () => {
    expect(parseFigmaNodeUrl('not a url')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(parseFigmaNodeUrl('')).toBeNull()
  })

  it('preserves a node id that already contains a colon', () => {
    const result = parseFigmaNodeUrl(
      'https://www.figma.com/design/ABC/Project?node-id=4:7'
    )
    expect(result).toEqual({ fileKey: 'ABC', nodeId: '4:7' })
  })
})
