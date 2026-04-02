import { NextRequest, NextResponse } from "next/server";
import { ExternalScanner } from "../../../../services/external-scanner";
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
    const { integrationType } = await request.json();

    if (!integrationType) {
      return NextResponse.json(
        { error: "Integration type required" },
        { status: 400 },
      );
    }

    const scanResult = await ExternalScanner.scanCustomerIntegration(
      tenantId,
      integrationType,
    );

    return NextResponse.json({
      success: true,
      result: scanResult,
    });
  } catch (error) {
    logger.error("External scan failed", {
      error: error instanceof Error ? error.message : String(error),
      tenantId,
    });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Scan failed",
      },
      { status: 500 },
    );
  }
}
