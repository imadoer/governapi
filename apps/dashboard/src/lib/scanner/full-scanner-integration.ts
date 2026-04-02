import { spawn } from "child_process";
import { supabase } from "../db/supabase";

export async function runFullGovernAPIScanner(
  scanId: string,
  target: string,
  scanType: string,
) {
  // This runs YOUR FULL SCANNER with all features
  const scannerScript = `
    process.env.DB_HOST = 'localhost';
    process.env.DB_NAME = 'apiguard';
    process.env.DB_USER = 'postgres';
    process.env.DB_PASSWORD = 'password';
    
    require('ts-node').register();
    const { initializeDiscovery, performManualScan } = require('${process.env.HOME}/src/discovery/scanner');
    const { scanEndpointForVulnerabilities } = require('${process.env.HOME}/src/security/scanner');
    const { PolicyEngine } = require('${process.env.HOME}/src/policy/engine');
    const { ThreatDetector } = require('${process.env.HOME}/src/security/threats');
    const { CostCalculator } = require('${process.env.HOME}/src/analytics/cost-calculator');
    const { MaturityScorer } = require('${process.env.HOME}/src/analytics/maturity-scorer');
    
    async function runCompleteScan() {
      const tenantId = '${scanId}';
      
      // Initialize all components
      await initializeDiscovery(tenantId);
      const policyEngine = new PolicyEngine();
      const threatDetector = new ThreatDetector();
      const costCalculator = new CostCalculator();
      const maturityScorer = new MaturityScorer();
      
      // Run full discovery
      const scanTarget = {
        host: '${target}',
        portRange: [1, 65535],
        protocols: ['http', 'https', 'tcp', 'udp']
      };
      
      const discoveryResults = await performManualScan(tenantId, [scanTarget]);
      
      // Run security scans on discovered endpoints
      const vulnerabilities = [];
      for (const endpoint of discoveryResults.endpoints || []) {
        const vulns = await scanEndpointForVulnerabilities(endpoint);
        vulnerabilities.push(...vulns);
      }
      
      // Run threat detection
      const threats = await threatDetector.analyze(discoveryResults);
      
      // Run policy checks
      const policyViolations = await policyEngine.evaluate(discoveryResults);
      
      // Calculate costs
      const costAnalysis = await costCalculator.analyze(discoveryResults);
      
      // Calculate maturity score
      const maturityScore = await maturityScorer.calculate(tenantId);
      
      return {
        discovery: discoveryResults,
        vulnerabilities: vulnerabilities,
        threats: threats,
        policyViolations: policyViolations,
        costAnalysis: costAnalysis,
        maturityScore: maturityScore
      };
    }
    
    runCompleteScan()
      .then(results => console.log(JSON.stringify(results)))
      .catch(err => console.error(JSON.stringify({error: err.message})));
  `;

  return new Promise((resolve, reject) => {
    const child = spawn("node", ["-e", scannerScript], {
      cwd: process.env.HOME,
      env: process.env,
    });

    let output = "";
    child.stdout.on("data", (data) => (output += data));
    child.stderr.on("data", (data) =>
      console.error("Scanner:", data.toString()),
    );

    child.on("close", async (code) => {
      try {
        const results = JSON.parse(output);

        // Save ALL results to Supabase
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
        reject(e);
      }
    });
  });
}
