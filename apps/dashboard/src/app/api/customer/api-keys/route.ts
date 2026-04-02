import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      error:
        "This endpoint has been deprecated. Use /api/customer/external-integrations instead.",
      migration:
        "Please update your integration to use external integrations for scanning your infrastructure.",
    },
    { status: 410 },
  );
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error:
        "This endpoint has been deprecated. Use /api/customer/external-integrations instead.",
      migration:
        "Please update your integration to use external integrations for scanning your infrastructure.",
    },
    { status: 410 },
  );
}
