import { spawn } from "child_process";
import { supabase } from "../db/supabase";

export async function runRealScan(
  scanId: string,
  target: string,
  scanType: string,
) {
  try {
    await supabase.from("scans").update({ status: "running" }).eq("id", scanId);

    const scannerPath = `${process.env.HOME}/src`;
    const compiledScanner = `${scannerPath}/discovery/scanner.js`;

    return new Promise((resolve, reject) => {
      const child = spawn("node", [compiledScanner, target], {
        cwd: scannerPath,
        env: {
          ...process.env,
          DATABASE_URL:
            "postgresql://scanner_user:scanner_pass_123@localhost:5432/governapi_scanner",
          TENANT_ID: scanId,
        },
      });

      let results = "";
      child.stdout.on("data", (data) => {
        results += data.toString();
      });

      child.on("exit", async (code) => {
        if (code === 0) {
          const scanResults = JSON.parse(results);
          await supabase
            .from("scans")
            .update({
              status: "completed",
              results: scanResults,
              completed_at: new Date().toISOString(),
            })
            .eq("id", scanId);
          resolve(scanResults);
        } else {
          reject(new Error("Scanner failed"));
        }
      });
    });
  } catch (error) {
    await supabase
      .from("scans")
      .update({
        status: "failed",
        results: { error: error.message },
      })
      .eq("id", scanId);
    throw error;
  }
}
