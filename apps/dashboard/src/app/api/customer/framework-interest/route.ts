import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";
import { logger } from "../../../../utils/logging/logger";

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const interests = await database.queryMany(
      `SELECT id, framework_name, reason, urgency, company_size, 
              email, company, status, created_at
       FROM framework_interest
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [tenantId]
    );

    return NextResponse.json({
      success: true,
      interests: interests || [],
    });
  } catch (error: any) {
    logger.error("Framework interest fetch error:", { error: error.message });
    return NextResponse.json({ error: "Failed to fetch interests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.framework || !data.reason) {
      return NextResponse.json(
        { error: "Framework and reason are required" },
        { status: 400 }
      );
    }

    await database.query(
      `INSERT INTO framework_interest
       (tenant_id, framework_name, reason, urgency, company_size, email, company)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        tenantId,
        data.framework,
        data.reason,
        data.urgency || 'normal',
        data.companySize || null,
        data.email || null,
        data.company || null
      ]
    );

    logger.info("New framework interest submitted", {
      tenantId,
      framework: data.framework,
      urgency: data.urgency,
      company: data.company,
    });

    return NextResponse.json({
      success: true,
      message: `Your interest in ${data.framework} has been recorded. We'll be in touch soon!`,
    });
  } catch (error: any) {
    logger.error("Framework interest submission error:", { error: error.message });
    return NextResponse.json(
      { error: "Failed to submit interest" },
      { status: 500 }
    );
  }
}
