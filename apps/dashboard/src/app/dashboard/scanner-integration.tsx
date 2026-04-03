"use client";

import { startScan } from "../../../lib/services/scanner";

export async function handleScanSubmit(
  values: Record<string, string>,
  category: "api" | "infrastructure",
) {
  try {
    const scanRequest = {
      target: category === "api" ? values.target : values.provider,
      scanType: values.scanType || "full",
      apiType: values.apiType,
      environment: values.environment || "production",
    };

    const result = await startScan(scanRequest);

    if (result.status === "completed") {
      return result;
    } else if (result.status === "failed") {
      throw new Error("Scan failed. Please check the target and try again.");
    }

    return result;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to start scan";
    throw new Error(msg);
  }
}
