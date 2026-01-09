import { v4 as uuidv4 } from 'uuid'

export function generateDisplayKey() {
  const uuid = uuidv4()
  const shortId = uuid.slice(0, 6)
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `${date}-${shortId}`
}

export function generateTitle(content: string) {
  return content.length > 30 ? content.slice(0, 30) + '…' : content
}
