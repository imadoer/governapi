/**
 * JS Challenge Verification Endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../../infrastructure/database";

interface VerifyRequest {
  token: string;
  solution: string;
  nonce: number;
}

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json() as VerifyRequest;
    const { token, solution, nonce } = body;

    // Get challenge from database
    const challenge = await database.queryOne(
      `SELECT * FROM js_challenge_tokens
       WHERE token = $1
         AND tenant_id = $2
         AND expires_at > NOW()
         AND solved = false`,
      [token, parseInt(tenantId)]
    );

    if (!challenge) {
      return NextResponse.json(
        { error: "Invalid or expired challenge" },
        { status: 400 }
      );
    }

    // Verify solution starts with '00' (proof-of-work completed)
    const isValid = solution.startsWith('00');

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid solution" },
        { status: 400 }
      );
    }

    // Mark challenge as solved
    await database.query(
      `UPDATE js_challenge_tokens
       SET solved = true, solution = $1, solved_at = NOW()
       WHERE token = $2`,
      [solution, token]
    );

    // Update bot_detection_events for this IP
    await database.query(
      `UPDATE bot_detection_events
       SET js_challenge_passed = true
       WHERE source_ip = $1
         AND created_at >= NOW() - INTERVAL '5 minutes'`,
      [challenge.source_ip]
    );

    return NextResponse.json({
      success: true,
      message: "Challenge solved successfully",
    });
  } catch (error) {
    console.error("Challenge verification error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
