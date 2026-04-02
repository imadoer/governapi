"use client";

import { message } from "antd";
import { startScan } from "../../../lib/services/scanner";

export async function handleScanSubmit(
  values: any,
  category: "api" | "infrastructure",
) {
  try {
    message.loading("Initializing scan...", 0);

    const scanRequest = {
      target: category === "api" ? values.target : values.provider,
      scanType: values.scanType || "full",
      apiType: values.apiType,
      environment: values.environment || "production",
    };

    const result = await startScan(scanRequest);

    message.destroy();

    if (result.status === "completed") {
      message.success(
        `Scan completed! Found ${result.results?.length || 0} endpoints.`,
        5,
      );
    } else if (result.status === "failed") {
      message.error("Scan failed. Please check the target and try again.", 5);
    } else {
      message.info("Scan started. Results will appear in the table below.", 5);
    }

    // In a real app, you'd update the table with new scan results
    return result;
  } catch (error: any) {
    message.destroy();
    message.error(error.message || "Failed to start scan", 5);
    throw error;
  }
}
