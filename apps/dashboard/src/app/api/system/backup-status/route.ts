import { NextRequest, NextResponse } from "next/server";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export async function GET(request: NextRequest) {
  try {
    const backupDir = join(homedir(), "backups");

    // Find latest backup file
    let files: string[];
    try {
      files = readdirSync(backupDir)
        .filter((f) => f.startsWith("governapi_") && f.endsWith(".sql.gz"))
        .sort()
        .reverse();
    } catch {
      return NextResponse.json({
        success: true,
        configured: false,
        message: "Backup directory not found",
      });
    }

    if (files.length === 0) {
      return NextResponse.json({
        success: true,
        configured: true,
        lastBackup: null,
        totalBackups: 0,
      });
    }

    const latestFile = files[0];
    const latestPath = join(backupDir, latestFile);
    const stat = statSync(latestPath);
    const sizeBytes = stat.size;
    const sizeFormatted =
      sizeBytes >= 1048576
        ? `${(sizeBytes / 1048576).toFixed(1)} MB`
        : `${(sizeBytes / 1024).toFixed(0)} KB`;

    // Parse timestamp from filename: governapi_2026-04-07_1228.sql.gz
    const match = latestFile.match(/governapi_(\d{4}-\d{2}-\d{2})_(\d{2})(\d{2})/);
    const timestamp = match
      ? `${match[1]}T${match[2]}:${match[3]}:00Z`
      : stat.mtime.toISOString();

    return NextResponse.json({
      success: true,
      configured: true,
      lastBackup: {
        filename: latestFile,
        timestamp,
        size: sizeFormatted,
        sizeBytes,
      },
      totalBackups: files.length,
      schedule: "Daily at 3:00 AM UTC",
      retention: "30 days",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to check backup status" },
      { status: 500 }
    );
  }
}
