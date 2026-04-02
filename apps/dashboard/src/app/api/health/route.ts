import { logger } from "../../../utils/logging/logger";
import { NextResponse } from "next/server";
import { database } from "../../../infrastructure/database";

export async function GET() {
  try {
    // Test database connection
    await database.testConnection();

    return NextResponse.json({
      status: "healthy",
      uptime: process.uptime(),
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
