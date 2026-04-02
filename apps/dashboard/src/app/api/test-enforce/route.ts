import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../infrastructure/database";

export async function GET(req: NextRequest) {
  try {
    const testIP = "10.0.0.50";
    
    // Test IP blocking check
    const blockedIP = await database.queryOne(
      `SELECT * FROM ip_blocks 
       WHERE ip_address = $1::inet 
       AND blocked_until > NOW()`,
      [testIP]
    );

    return NextResponse.json({
      testIP,
      isBlocked: !!blockedIP,
      blockDetails: blockedIP || null,
      message: blockedIP ? `IP ${testIP} is blocked: ${blockedIP.reason}` : `IP ${testIP} is not blocked`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
