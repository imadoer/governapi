import { database } from "../infrastructure/database";

export async function isIPBlocked(
  tenantId: number,
  ip: string,
): Promise<boolean> {
  try {
    const blocked = await database.queryOne(
      `SELECT id FROM ip_blocks 
       WHERE tenant_id = $1 AND ip_address = $2 AND blocked_until > NOW()`,
      [tenantId, ip],
    );
    return !!blocked;
  } catch {
    return false;
  }
}

export async function blockIP(
  tenantId: number,
  ip: string,
  reason: string,
  duration: number = 3600,
) {
  try {
    await database.query(
      `INSERT INTO ip_blocks (tenant_id, ip_address, reason, blocked_until, created_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '${duration} seconds', NOW())
       ON CONFLICT (tenant_id, ip_address) 
       DO UPDATE SET blocked_until = NOW() + INTERVAL '${duration} seconds', reason = EXCLUDED.reason`,
      [tenantId, ip, reason],
    );
  } catch (error) {
    console.error("Failed to block IP:", error);
  }
}
