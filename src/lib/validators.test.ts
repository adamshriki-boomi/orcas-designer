import { isValidUrl, validateUrl, isValidFigmaUrl, isFieldFilled, MAX_FILE_SIZE, MAX_PROJECT_SIZE } from './validators'

describe('isValidUrl', () => {
  it('returns false for empty string', () => {
    expect(isValidUrl('')).toBe(false)
  })

  it('returns false for whitespace-only string', () => {
    expect(isValidUrl('   ')).toBe(false)
  })

  it('returns true for valid http URL', () => {
    expect(isValidUrl('http://example.com')).toBe(true)
  })

  it('returns true for valid https URL', () => {
    expect(isValidUrl('https://example.com/path?q=1')).toBe(true)
  })

  it('returns false for a plain string without protocol', () => {
    expect(isValidUrl('example.com')).toBe(false)
  })

  it('returns false for an invalid string', () => {
    expect(isValidUrl('not a url at all')).toBe(false)
  })
})

describe('validateUrl', () => {
  it('returns error message for empty string', () => {
    expect(validateUrl('')).toBe('URL is required')
  })

  it('returns error message for whitespace-only string', () => {
    expect(validateUrl('   ')).toBe('URL is required')
  })

  it('returns null for valid URL', () => {
    expect(validateUrl('https://example.com')).toBeNull()
  })

  it('returns invalid URL message for string without protocol', () => {
    expect(validateUrl('example.com')).toBe('Please enter a valid URL')
  })

  it('returns invalid URL message for garbage input', () => {
    expect(validateUrl('abc def')).toBe('Please enter a valid URL')
  })
})

describe('isValidFigmaUrl', () => {
  it('returns true for figma.com URL', () => {
    expect(isValidFigmaUrl('https://figma.com/design/abc/My-File')).toBe(true)
  })

  it('returns true for www.figma.com URL', () => {
    expect(isValidFigmaUrl('https://www.figma.com/design/abc/My-File')).toBe(true)
  })

  it('returns false for non-Figma URL', () => {
    expect(isValidFigmaUrl('https://google.com')).toBe(false)
  })

  it('returns false for invalid URL', () => {
    expect(isValidFigmaUrl('not-a-url')).toBe(false)
  })
})

describe('isFieldFilled', () => {
  it('returns true for url type with non-empty urlValue', () => {
    expect(isFieldFilled({ inputType: 'url', urlValue: 'https://example.com', textValue: '', files: [] })).toBe(true)
  })

  it('returns false for url type with empty urlValue', () => {
    expect(isFieldFilled({ inputType: 'url', urlValue: '', textValue: 'something', files: [] })).toBe(false)
  })

  it('returns true for text type with non-empty textValue', () => {
    expect(isFieldFilled({ inputType: 'text', urlValue: '', textValue: 'hello', files: [] })).toBe(true)
  })

  it('returns false for text type with whitespace-only textValue', () => {
    expect(isFieldFilled({ inputType: 'text', urlValue: '', textValue: '   ', files: [] })).toBe(false)
  })

  it('returns true for file type with files present', () => {
    expect(isFieldFilled({ inputType: 'file', urlValue: '', textValue: '', files: [{ id: '1' }] })).toBe(true)
  })

  it('returns false for file type with no files', () => {
    expect(isFieldFilled({ inputType: 'file', urlValue: '', textValue: '', files: [] })).toBe(false)
  })

  it('returns false for unknown inputType', () => {
    expect(isFieldFilled({ inputType: 'other', urlValue: 'x', textValue: 'x', files: [{}] })).toBe(false)
  })
})

describe('constants', () => {
  it('MAX_FILE_SIZE is 10MB', () => {
    expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024)
  })

  it('MAX_PROJECT_SIZE is 50MB', () => {
    expect(MAX_PROJECT_SIZE).toBe(50 * 1024 * 1024)
  })
})
