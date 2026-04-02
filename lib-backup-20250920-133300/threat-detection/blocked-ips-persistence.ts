import { promises as fs } from 'fs'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'data')
const BLOCKED_IPS_FILE = join(DATA_DIR, 'blocked_ips.json')

export async function saveBlockedIPs(blockedIPs: Map<string, any>) {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
  
  const data = Array.from(blockedIPs.entries())
  await fs.writeFile(BLOCKED_IPS_FILE, JSON.stringify(data, null, 2))
}

export async function loadBlockedIPs(): Promise<Map<string, any>> {
  try {
    const data = await fs.readFile(BLOCKED_IPS_FILE, 'utf8')
    const entries = JSON.parse(data)
    return new Map(entries)
  } catch {
    return new Map()
  }
}
