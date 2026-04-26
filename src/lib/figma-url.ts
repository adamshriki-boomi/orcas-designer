export type FigmaNodeRef = {
  fileKey: string
  nodeId: string
}

export function parseFigmaNodeUrl(input: string): FigmaNodeRef | null {
  if (!input) return null

  let url: URL
  try {
    url = new URL(input)
  } catch {
    return null
  }

  if (!/(^|\.)figma\.com$/i.test(url.hostname)) return null

  const rawNodeId = url.searchParams.get('node-id')
  if (!rawNodeId) return null
  const nodeId = rawNodeId.replace(/-/g, ':')

  const segments = url.pathname.split('/').filter(Boolean)
  if (segments.length < 2) return null
  if (segments[0] !== 'file' && segments[0] !== 'design') return null

  let fileKey = segments[1]
  if (segments[2] === 'branch' && segments[3]) {
    fileKey = segments[3]
  }
  if (!fileKey) return null

  return { fileKey, nodeId }
}
