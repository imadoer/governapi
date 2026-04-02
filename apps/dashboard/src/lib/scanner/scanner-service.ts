import { spawn } from "child_process";
import { supabase } from "../db/supabase";

export async function runGovernAPIScanner(
  scanId: string,
  target: string,
  scanType: string,
) {
  try {
    // Update scan status
    await supabase.from("scans").update({ status: "running" }).eq("id", scanId);

    // Create a Node.js script that loads your scanner properly
    const scannerScript = `
      // Set up environment
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_NAME = 'apiguard';
      process.env.DB_USER = 'postgres';
      process.env.DB_PASSWORD = 'password';
      
      const path = require('path');
      const scannerPath = '${process.env.HOME}/src';
      
      // This would normally load your compiled scanner
      // For now, run basic checks
      const https = require('https');
      const http = require('http');
      const { URL } = require('url');
      
      async function scan() {
        const url = new URL('${target}');
        const results = {
          target: '${target}',
          scanType: '${scanType}',
          timestamp: new Date().toISOString(),
          endpoints: [],
          vulnerabilities: []
        };
        
        // Basic endpoint discovery
        const commonPaths = ['/api', '/api/v1', '/api/v2', '/graphql', '/rest'];
        for (const path of commonPaths) {
          try {
            const testUrl = url.origin + path;
            const res = await fetch(testUrl);
            if (res.status < 400) {
              results.endpoints.push({
                path: path,
                status: res.status,
                contentType: res.headers.get('content-type')
              });
            }
          } catch (e) {
            // Path doesn't exist
          }
        }
        
        // Basic security checks
        try {
          const res = await fetch('${target}');
          const headers = res.headers;
          
          if (!headers.get('x-frame-options')) {
            results.vulnerabilities.push({
              type: 'Missing X-Frame-Options',
              severity: 'medium',
              cwe: 'CWE-1021'
            });
          }
          
          if (!headers.get('strict-transport-security')) {
            results.vulnerabilities.push({
              type: 'Missing HSTS',
              severity: 'high',
              cwe: 'CWE-523'
            });
          }
        } catch (e) {
          console.error('Security check failed:', e);
        }
        
        return results;
      }
      
      scan().then(r => console.log(JSON.stringify(r))).catch(e => console.error(e));
    `;

    return new Promise((resolve, reject) => {
      const child = spawn("node", ["-e", scannerScript], {
        env: { ...process.env, HOME: process.env.HOME },
      });

      let output = "";
      let error = "";

      child.stdout.on("data", (data) => (output += data.toString()));
      child.stderr.on("data", (data) => (error += data.toString()));

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
          reject(new Error(error));
          return;
        }

        try {
          const results = JSON.parse(output);

          // Save results
          await supabase
            .from("scans")
            .update({
              status: "completed",
              results: results,
              completed_at: new Date().toISOString(),
            })
            .eq("id", scanId);

          // Create violations if vulnerabilities found
          if (results.vulnerabilities?.length > 0) {
            const { data: scan } = await supabase
              .from("scans")
              .select("api_id")
              .eq("id", scanId)
              .single();

            for (const vuln of results.vulnerabilities) {
              await supabase.from("violations").insert({
                api_id: scan.api_id,
                policy_name: vuln.type,
                severity: vuln.severity,
                details: vuln,
              });
            }
          }

          resolve(results);
        } catch (e) {
          reject(new Error("Failed to parse results"));
        }
      });
    });
  } catch (error) {
    throw error;
  }
}
