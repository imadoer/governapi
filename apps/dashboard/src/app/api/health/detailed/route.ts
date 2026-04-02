import { NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";

export async function GET() {
  const checks = {
    database: false,
    filesystem: false,
  };

  const startTime = Date.now();

  try {
    await database.testConnection();
    checks.database = true;
  } catch (error) {
    console.error("Database health check failed:", error);
  }

  try {
    const fs = require("fs");
    fs.accessSync("/tmp", fs.constants.W_OK);
    checks.filesystem = true;
  } catch (error) {
    console.error("Filesystem health check failed:", error);
  }

  const responseTime = Date.now() - startTime;
  const allHealthy = Object.values(checks).every((check) => check === true);

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      checks,
      timestamp: new Date().toISOString(),
    },
    {
      status: allHealthy ? 200 : 503,
    },
  );
}
