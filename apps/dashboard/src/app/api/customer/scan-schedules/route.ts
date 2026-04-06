import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";
import { nextRunTime } from "../../../../lib/scan-scheduler";

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

  try {
    const schedules = await database.queryMany(
      `SELECT id, url, frequency, next_run_at, last_run_at, last_score, is_active, created_at
       FROM scan_schedules
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [tenantId],
    );

    // Return as a map keyed by URL for easy lookup
    const scheduleMap: Record<string, any> = {};
    for (const s of schedules) {
      scheduleMap[s.url] = {
        id: s.id,
        frequency: s.frequency,
        nextRunAt: s.next_run_at,
        lastRunAt: s.last_run_at,
        lastScore: s.last_score,
        isActive: s.is_active,
      };
    }

    return NextResponse.json({ success: true, schedules: scheduleMap });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

  try {
    const { url, frequency } = await request.json();
    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

    const validFreqs = ["manual", "6h", "daily", "weekly"];
    if (!validFreqs.includes(frequency)) {
      return NextResponse.json({ error: "Invalid frequency" }, { status: 400 });
    }

    const nextRun = frequency === "manual" ? null : nextRunTime(frequency);

    // Get current score for this endpoint
    const latestScan = await database.queryOne(
      `SELECT security_score FROM security_scans
       WHERE tenant_id = $1 AND url = $2 AND status = 'completed'
       ORDER BY created_at DESC LIMIT 1`,
      [tenantId, url],
    );
    const lastScore = latestScan ? parseInt(latestScan.security_score || "0") : null;

    // Upsert
    await database.query(
      `INSERT INTO scan_schedules (tenant_id, url, frequency, next_run_at, last_score, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
       ON CONFLICT (tenant_id, url) DO UPDATE SET
         frequency = $3,
         next_run_at = $4,
         last_score = COALESCE($5, scan_schedules.last_score),
         is_active = true,
         updated_at = NOW()`,
      [tenantId, url, frequency, nextRun, lastScore],
    );

    return NextResponse.json({
      success: true,
      schedule: { url, frequency, nextRunAt: nextRun },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 });
  }
}
