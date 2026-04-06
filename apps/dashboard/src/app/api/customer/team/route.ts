import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

  try {
    const members = await database.queryMany(
      `SELECT id, email, role, invited_by, invited_at, accepted_at, status
       FROM team_members WHERE company_id = $1 ORDER BY invited_at DESC`,
      [tenantId],
    );
    return NextResponse.json({ success: true, members });
  } catch {
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  const userId = request.headers.get("x-user-id");
  if (!tenantId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

  try {
    const { email, role } = await request.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
    if (!["admin", "editor", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check for duplicate
    const existing = await database.queryOne(
      `SELECT id FROM team_members WHERE company_id = $1 AND email = $2`,
      [tenantId, email],
    );
    if (existing) return NextResponse.json({ error: "Member already invited" }, { status: 409 });

    const member = await database.queryOne(
      `INSERT INTO team_members (company_id, email, role, invited_by, invited_at, status)
       VALUES ($1, $2, $3, $4, NOW(), 'pending') RETURNING *`,
      [tenantId, email, role, userId || "system"],
    );

    return NextResponse.json({ success: true, member });
  } catch {
    return NextResponse.json({ error: "Failed to invite member" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Member ID required" }, { status: 400 });

  try {
    await database.query(`DELETE FROM team_members WHERE company_id = $1 AND id = $2`, [tenantId, parseInt(id)]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
