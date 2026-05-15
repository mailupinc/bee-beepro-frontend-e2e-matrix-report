import fs from 'node:fs'
import path from 'node:path'

let cachedOwners: string[] | null = null

const getCodeowners = (): string[] => {
  if (cachedOwners) return cachedOwners
  const filePath = path.join(process.cwd(), '.github', 'CODEOWNERS')
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const ownerLine = content.split('\n').find(l => l.trim().startsWith('*'))
    if (ownerLine) {
      cachedOwners = ownerLine.trim().split(/\s+/).filter(u => u.startsWith('@')).map(u => u.substring(1)).sort()
      return cachedOwners
    }
  } catch { /* ignore */ }
  cachedOwners = []
  return cachedOwners
}

export const assignOwner = (filePath: string): string => {
  const owners = getCodeowners()
  if (owners.length === 0) return 'unknown'
  const hash = Array.from(filePath).reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return owners[hash % owners.length]
}
