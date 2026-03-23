import { formatFileSize, fileToBase64, fileToAttachment } from './file-utils'
import { MAX_FILE_SIZE } from './validators'

vi.mock('./id', () => ({
  generateId: () => 'mock-id-123',
}))

describe('formatFileSize', () => {
  it('formats bytes below 1024 as B', () => {
    expect(formatFileSize(500)).toBe('500 B')
  })

  it('formats exactly 1024 bytes as 1.0 KB', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB')
  })

  it('formats kilobytes correctly', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB')
  })

  it('formats exactly 1MB as 1.0 MB', () => {
    expect(formatFileSize(1048576)).toBe('1.0 MB')
  })

  it('formats megabytes correctly', () => {
    expect(formatFileSize(5242880)).toBe('5.0 MB')
  })
})

describe('fileToBase64', () => {
  it('resolves with the base64 portion of a data URL', async () => {
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' })
    const result = await fileToBase64(file)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('fileToAttachment', () => {
  it('throws when file exceeds MAX_FILE_SIZE', async () => {
    const oversized = new File(['x'], 'big.bin', { type: 'application/octet-stream' })
    Object.defineProperty(oversized, 'size', { value: MAX_FILE_SIZE + 1 })
    await expect(fileToAttachment(oversized)).rejects.toThrow('exceeds the 10MB size limit')
  })

  it('returns a FileAttachment with correct shape for a valid file', async () => {
    const file = new File(['data'], 'photo.png', { type: 'image/png' })
    const attachment = await fileToAttachment(file)
    expect(attachment.id).toBe('mock-id-123')
    expect(attachment.name).toBe('photo.png')
    expect(attachment.mimeType).toBe('image/png')
    expect(attachment.size).toBe(file.size)
    expect(typeof attachment.base64Data).toBe('string')
    expect(typeof attachment.createdAt).toBe('string')
  })
})
