"use client";

interface ScanResult {
  target: string;
  timestamp: string;
  overall_risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  vulnerabilities: Array<{
    category: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    finding: string;
    description: string;
    recommendation: string;
  }>;
  owasp_findings: Array<{
    owasp_category: string;
    vulnerable: boolean;
    details: string;
  }>;
}

interface SecurityScanResultsProps {
  results: ScanResult | null;
}

const severityColors: Record<string, string> = {
  CRITICAL: "bg-red-500/15 text-red-400",
  HIGH: "bg-orange-500/15 text-orange-400",
  MEDIUM: "bg-amber-500/15 text-amber-400",
  LOW: "bg-emerald-500/15 text-emerald-400",
};

export function SecurityScanResults({ results }: SecurityScanResultsProps) {
  if (!results) return null;

  return (
    <div className="mt-6 bg-slate-800/30 backdrop-blur border border-white/10 rounded-2xl p-6 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-3">Security Scan Results</h3>
        <div className="text-sm text-slate-400 space-y-1">
          <p><span className="text-slate-500">Target:</span> <span className="text-white">{results.target}</span></p>
          <p><span className="text-slate-500">Scan Time:</span> {new Date(results.timestamp).toLocaleString()}</p>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-2">Overall Risk Assessment</h4>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 text-sm font-bold rounded-full ${severityColors[results.overall_risk] || "bg-slate-500/15 text-slate-400"}`}>
            {results.overall_risk} RISK
          </span>
          <span className="text-sm text-slate-400">{results.vulnerabilities.length} vulnerabilities found</span>
        </div>
      </div>

      <div className="border-t border-white/10" />

      {/* Vulnerabilities */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-4">Vulnerabilities ({results.vulnerabilities.length})</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {["Category", "Severity", "Finding", "Recommendation"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.vulnerabilities.map((v, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-300">{v.category}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${severityColors[v.severity] || "bg-slate-500/15 text-slate-400"}`}>
                      {v.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{v.finding}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{v.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-t border-white/10" />

      {/* OWASP */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-4">OWASP API Security Top 10 Analysis</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {["OWASP Category", "Status", "Details"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.owasp_findings.map((f, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-300">{f.owasp_category}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${f.vulnerable ? "text-red-400" : "text-emerald-400"}`}>
                      <span className={`w-2 h-2 rounded-full ${f.vulnerable ? "bg-red-400" : "bg-emerald-400"}`} />
                      {f.vulnerable ? "Vulnerable" : "Secure"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">{f.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
