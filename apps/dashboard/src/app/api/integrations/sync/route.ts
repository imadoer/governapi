import { NextRequest, NextResponse } from "next/server";

/**
 * DISABLED FOR V1
 * 
 * This route previously synced data FROM customer systems (GitHub, Jira, Slack)
 * using stored credentials. This violates our Architecture Promise:
 * 
 * "GovernAPI is an out-of-band security intelligence platform. We receive 
 * telemetry from your infrastructure — we never sit in your traffic path.
 * We do not proxy requests, store cloud credentials, or become a point of 
 * failure for your systems."
 * 
 * Re-enable only as Enterprise/Self-Hosted feature with proper OAuth + scoping.
 */

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: "This endpoint is disabled in v1",
      message: "Integration sync functionality is not available in the current version.",
      code: "FEATURE_DISABLED"
    },
    { status: 410 }
  );
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      error: "This endpoint is disabled in v1",
      message: "Integration sync functionality is not available in the current version.",
      code: "FEATURE_DISABLED"
    },
    { status: 410 }
  );
}
