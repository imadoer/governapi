import { Pool } from 'pg'

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'governapi',
  user: 'governapi_user',
  password: 'newpassword123'
})

export class ThreatService {
  async saveBlockedIP(ip: string, reason: string, duration: number, threatLevel: string, threats: string[]) {
    try {
      const expiresAt = new Date(Date.now() + duration)
      
      await pool.query(`
        INSERT INTO blocked_ips (ip, reason, expires_at, duration_ms, threat_level, threats)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (ip) DO UPDATE SET
          reason = EXCLUDED.reason,
          expires_at = EXCLUDED.expires_at,
          duration_ms = EXCLUDED.duration_ms,
          threat_level = EXCLUDED.threat_level,
          threats = EXCLUDED.threats,
          created_at = NOW()
      `, [ip, reason, expiresAt, duration, threatLevel, JSON.stringify(threats)])
      
      await pool.query(`
        INSERT INTO security_events (ip, event_type, threat_level, details, blocked)
        VALUES ($1, $2, $3, $4, $5)
      `, [ip, 'THREAT_BLOCKED', threatLevel, JSON.stringify({reason, duration, threats}), true])
      
      console.log('THREAT SERVICE: IP saved to database:', ip)
    } catch (error) {
      console.error('THREAT SERVICE: Database save failed:', error.message)
      throw error
    }
  }

  async getBlockedIPs() {
    try {
      const result = await pool.query(`
        SELECT ip, reason, expires_at, threat_level, threats,
               EXTRACT(EPOCH FROM (expires_at - NOW())) * 1000 as remaining_ms
        FROM blocked_ips 
        WHERE expires_at > NOW()
        ORDER BY created_at DESC
      `)
      
      return result.rows.map(row => {
        let parsedThreats = []
        try {
          if (typeof row.threats === 'string') {
            parsedThreats = JSON.parse(row.threats)
          } else if (Array.isArray(row.threats)) {
            parsedThreats = row.threats
          }
        } catch (e) {
          parsedThreats = [row.threats || 'UNKNOWN']
        }

        return {
          ip: row.ip,
          reason: row.reason,
          expiresAt: new Date(row.expires_at).getTime(),
          remainingMs: Math.max(0, Math.floor(row.remaining_ms || 0)),
          threatLevel: row.threat_level,
          threats: parsedThreats
        }
      })
    } catch (error) {
      console.error('THREAT SERVICE: Failed to get blocked IPs:', error.message)
      return []
    }
  }

  async unblockIP(ip: string) {
    try {
      await pool.query('DELETE FROM blocked_ips WHERE ip = $1', [ip])
      
      await pool.query(`
        INSERT INTO security_events (ip, event_type, threat_level, details, blocked)
        VALUES ($1, $2, $3, $4, $5)
      `, [ip, 'IP_UNBLOCKED', 'INFO', JSON.stringify({action: 'manual_unblock'}), false])
      
      console.log('THREAT SERVICE: IP unblocked from database:', ip)
    } catch (error) {
      console.error('THREAT SERVICE: Failed to unblock IP:', error.message)
      throw error
    }
  }

  async getStats() {
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE expires_at > NOW()) as active_blocks,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as threats_today,
          COUNT(*) FILTER (WHERE threat_level = 'CRITICAL' AND expires_at > NOW()) as critical_blocks
        FROM blocked_ips
      `)
      
      const stats = result.rows[0]
      return {
        totalThreatPatterns: 8,
        blockedIPs: parseInt(stats?.active_blocks || '0'),
        threatsToday: parseInt(stats?.threats_today || '0'),
        criticalBlocks: parseInt(stats?.critical_blocks || '0'),
        reputationEntries: 0
      }
    } catch (error) {
      console.error('THREAT SERVICE: Failed to get stats:', error.message)
      return {
        totalThreatPatterns: 8,
        blockedIPs: 0,
        threatsToday: 0,
        criticalBlocks: 0,
        reputationEntries: 0
      }
    }
  }
}

export const threatService = new ThreatService()
