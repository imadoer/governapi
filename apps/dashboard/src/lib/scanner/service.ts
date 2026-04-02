import { spawn } from "child_process";
import { supabase } from "../db/supabase";

export async function runRealScan(
  scanId: string,
  target: string,
  scanType: string,
) {
  try {
    // Update scan status to running
    await supabase.from("scans").update({ status: "running" }).eq("id", scanId);

    // Create a script to run your actual scanner
    const scannerScript = `
const { initializeDiscovery, performManualScan } = require('${process.env.HOME}/src/discovery/scanner');
const { scanEndpointForVulnerabilities } = require('${process.env.HOME}/src/security/scanner');

async function run() {
  try {
    const tenantId = '${scanId}';
    await initializeDiscovery(tenantId);
    
    const scanTarget = {
      host: '${target}',
      portRange: [80, 443],
      protocols: ['http', 'https']
    };
    
    // Run discovery
    const discoveryResults = await performManualScan(tenantId, [scanTarget]);
    
    // Run security scan on discovered endpoints
    const vulnerabilities = [];
    for (const endpoint of discoveryResults.endpoints || []) {
      const vulns = await scanEndpointForVulnerabilities(endpoint);
      vulnerabilities.push(...vulns);
    }
    
    return {
      discoveredEndpoints: discoveryResults.endpoints?.length || 0,
      endpoints: discoveryResults.endpoints || [],
      vulnerabilities: {
        critical: vulnerabilities.filter(v => v.severity === 'critical').length,
        high: vulnerabilities.filter(v => v.severity === 'high').length,
        medium: vulnerabilities.filter(v => v.severity === 'medium').length,
        low: vulnerabilities.filter(v => v.severity === 'low').length,
        details: vulnerabilities
      }
    };
  } catch (error) {
    throw error;
  }
}

run().then(results => {
  console.log(JSON.stringify(results));
}).catch(err => {
  console.error(JSON.stringify({ error: err.message }));
});
`;

    return new Promise((resolve, reject) => {
      const child = spawn("node", ["-e", scannerScript], {
        cwd: process.env.HOME,
        env: { ...process.env, NODE_PATH: `${process.env.HOME}/src` },
      });

      let output = "";
      let error = "";

      child.stdout.on("data", (data) => {
        output += data.toString();
      });

      child.stderr.on("data", (data) => {
        error += data.toString();
      });

      child.on("close", async (code) => {
        if (code !== 0) {
          await supabase
            .from("scans")
            .update({
              status: "failed",
              results: { error: error || "Scanner failed" },
              completed_at: new Date().toISOString(),
            })
            .eq("id", scanId);

          reject(new Error(error || "Scanner failed"));
          return;
        }

        try {
          const results = JSON.parse(output.trim());

          await supabase
            .from("scans")
            .update({
              status: "completed",
              results: results,
              completed_at: new Date().toISOString(),
            })
            .eq("id", scanId);

          resolve(results);
        } catch (e) {
          reject(new Error("Failed to parse scanner output"));
        }
      });
    });
  } catch (error) {
    await supabase
      .from("scans")
      .update({
        status: "failed",
        results: { error: error.message },
        completed_at: new Date().toISOString(),
      })
      .eq("id", scanId);

    throw error;
  }
}
