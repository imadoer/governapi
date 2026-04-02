import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";
import { logger } from "../../../../utils/logging/logger";

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const { sourceIp, action, duration = 86400000, reason } = await request.json();

    if (!sourceIp || !action) {
      return NextResponse.json(
        { error: "Missing sourceIp or action" },
        { status: 400 },
      );
    }

    if (action === 'block') {
      const blockedUntil = new Date(Date.now() + duration);

      const existing = await database.queryOne(
        `SELECT id, blocked_until FROM ip_blocks
         WHERE tenant_id = $1 AND ip_address = $2::inet`,
        [tenantId, sourceIp],
      );

      if (existing) {
        await database.query(
          `UPDATE ip_blocks
           SET blocked_until = $1, reason = $2, created_at = NOW()
           WHERE id = $3`,
          [blockedUntil, reason || 'Blocked from Threat Intelligence', existing.id],
        );
      } else {
        await database.query(
          `INSERT INTO ip_blocks (tenant_id, ip_address, reason, blocked_until, created_at)
           VALUES ($1, $2::inet, $3, $4, NOW())`,
          [tenantId, sourceIp, reason || 'Blocked from Threat Intelligence', blockedUntil],
        );
      }

      // Log to audit table
      try {
        await database.query(
          `INSERT INTO ip_block_audit (tenant_id, ip_address, action, performed_by, reason, created_at)
           VALUES ($1, $2::inet, $3, $4, $5, NOW())`,
          [tenantId, sourceIp, 'block', 'Dashboard User', reason || 'Manual block from threat intelligence']
        );
      } catch (auditError) {
        console.error("Failed to log audit:", auditError);
      }

      logger.info("IP blocked", { tenantId, sourceIp, blockedUntil });

      return NextResponse.json({
        success: true,
        message: `IP ${sourceIp} blocked until ${blockedUntil.toLocaleString()}`,
        isBlocked: true,
        blockedUntil,
      });
    } else if (action === 'unblock') {
      await database.query(
        `DELETE FROM ip_blocks WHERE tenant_id = $1 AND ip_address = $2::inet`,
        [tenantId, sourceIp],
      );

      // Log to audit table
      try {
        await database.query(
          `INSERT INTO ip_block_audit (tenant_id, ip_address, action, performed_by, reason, created_at)
           VALUES ($1, $2::inet, $3, $4, $5, NOW())`,
          [tenantId, sourceIp, 'unblock', 'Dashboard User', 'Manual unblock from threat intelligence']
        );
      } catch (auditError) {
        console.error("Failed to log audit:", auditError);
      }

      logger.info("IP unblocked", { tenantId, sourceIp });

      return NextResponse.json({
        success: true,
        message: `IP ${sourceIp} unblocked`,
        isBlocked: false,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    logger.error("Block IP error:", { error: error.message });
    return NextResponse.json(
      { error: "Failed to block/unblock IP" },
      { status: 500 },
    );
  }
}
