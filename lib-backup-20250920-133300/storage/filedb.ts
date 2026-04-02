import { promises as fs } from 'fs'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'data')

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

export async function saveSecurityScan(scanData: any) {
  await ensureDataDir()
  const filename = join(DATA_DIR, 'latest_scan.json')
  await fs.writeFile(filename, JSON.stringify(scanData, null, 2))
  
  // Also append to scan history
  const historyFile = join(DATA_DIR, 'scan_history.json')
  let history = []
  try {
    const data = await fs.readFile(historyFile, 'utf8')
    history = JSON.parse(data)
  } catch {}
  
  history.push(scanData)
  if (history.length > 100) history = history.slice(-100)
  await fs.writeFile(historyFile, JSON.stringify(history, null, 2))
}

export async function getLatestSecurityScan() {
  try {
    const data = await fs.readFile(join(DATA_DIR, 'latest_scan.json'), 'utf8')
    return JSON.parse(data)
  } catch {
    return null
  }
}

export async function saveTrafficLog(logData: any) {
  await ensureDataDir()
  const filename = join(DATA_DIR, 'traffic_logs.json')
  let logs = []
  
  try {
    const data = await fs.readFile(filename, 'utf8')
    logs = JSON.parse(data)
  } catch {}
  
  logs.push(logData)
  if (logs.length > 1000) logs = logs.slice(-1000)
  await fs.writeFile(filename, JSON.stringify(logs, null, 2))
}

export async function getTrafficStats() {
  try {
    const data = await fs.readFile(join(DATA_DIR, 'traffic_logs.json'), 'utf8')
    const logs = JSON.parse(data)
    const totalRequests = logs.length
    const botRequests = logs.filter(log => log.is_bot).length
    const blockedRequests = logs.filter(log => log.blocked).length
    
    return {
      total_requests: totalRequests,
      bot_requests_detected: botRequests,
      bots_blocked: blockedRequests,
      success_rate: totalRequests > 0 ? Math.round(((totalRequests - blockedRequests) / totalRequests) * 100) : 100,
      recent_bots: logs.filter(log => log.is_bot).slice(0, 10)
    }
  } catch {
    return {
      total_requests: 0,
      bot_requests_detected: 0,
      bots_blocked: 0,
      success_rate: 100,
      recent_bots: []
    }
  }
}

export async function saveUsers(users: any[]) {
  await ensureDataDir()
  const filename = join(DATA_DIR, 'users.json')
  await fs.writeFile(filename, JSON.stringify(users, null, 2))
}

export async function getUsers() {
  try {
    const data = await fs.readFile(join(DATA_DIR, 'users.json'), 'utf8')
    return JSON.parse(data)
  } catch {
    return [{
      id: '1',
      email: 'demo@governapi.com',
      name: 'Demo Admin',
      role: 'admin',
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      active: true
    }]
  }
}

export async function saveScheduledScan(scanData: any) {
  await ensureDataDir()
  const filename = join(DATA_DIR, 'scheduled_scans.json')
  let scans = []
  
  try {
    const data = await fs.readFile(filename, 'utf8')
    scans = JSON.parse(data)
  } catch {}
  
  scans.push(scanData)
  await fs.writeFile(filename, JSON.stringify(scans, null, 2))
}

export async function getScheduledScans() {
  try {
    const data = await fs.readFile(join(DATA_DIR, 'scheduled_scans.json'), 'utf8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

export async function updateScheduledScan(scanId: string, updates: any) {
  await ensureDataDir()
  const filename = join(DATA_DIR, 'scheduled_scans.json')
  
  try {
    const data = await fs.readFile(filename, 'utf8')
    const scans = JSON.parse(data)
    const index = scans.findIndex(scan => scan.id === scanId)
    
    if (index !== -1) {
      scans[index] = { ...scans[index], ...updates }
      await fs.writeFile(filename, JSON.stringify(scans, null, 2))
    }
  } catch (error) {
    console.error('Failed to update scheduled scan:', error)
  }
}
