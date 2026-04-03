"use client";

import { useState, useEffect } from "react";

interface ComplianceData {
  soc2: {
    score: number;
    issues: string[];
    requirements_met: number;
    total_requirements: number;
  };
  gdpr: {
    score: number;
    issues: string[];
    requirements_met: number;
    total_requirements: number;
  };
  pci_dss: {
    score: number;
    issues: string[];
    requirements_met: number;
    total_requirements: number;
  };
  hipaa: {
    score: number;
    issues: string[];
    requirements_met: number;
    total_requirements: number;
  };
  overall_status: string;
  last_assessment: string | null;
}

export function RealComplianceDashboard() {
  const [complianceData, setComplianceData] = useState<ComplianceData>({
    soc2: { score: 0, issues: [], requirements_met: 0, total_requirements: 0 },
    gdpr: { score: 0, issues: [], requirements_met: 0, total_requirements: 0 },
    pci_dss: { score: 0, issues: [], requirements_met: 0, total_requirements: 0 },
    hipaa: { score: 0, issues: [], requirements_met: 0, total_requirements: 0 },
    overall_status: "No Data",
    last_assessment: null,
  });

  useEffect(() => {
    calculateRealCompliance();
  }, []);

  const calculateRealCompliance = async () => {
    try {
      const response = await fetch("/api/security-scan-results");
      let scanResults = null;

      if (response.ok) {
        const data = await response.json();
        scanResults = data.results;
      }

      if (!scanResults) {
        setComplianceData({
          ...complianceData,
          overall_status: "Run security scan for compliance assessment",
        });
        return;
      }

      const vulnerabilities = scanResults.vulnerabilities || [];
      const criticalVulns = vulnerabilities.filter((v: any) => v.severity === "CRITICAL").length;
      const highVulns = vulnerabilities.filter((v: any) => v.severity === "HIGH").length;
      const hasHttps = scanResults.ssl_analysis?.certificate_valid !== false;
      const securityHeaders = scanResults.headers_analysis?.security_headers_present?.length || 0;
      const missingHeaders = scanResults.headers_analysis?.security_headers_missing?.length || 0;

      const soc2Assessment = assessSOC2(hasHttps, securityHeaders, criticalVulns, 1);
      const gdprAssessment = assessGDPR(vulnerabilities, hasHttps, securityHeaders);
      const pciAssessment = assessPCIDSS(hasHttps, vulnerabilities, securityHeaders);
      const hipaaAssessment = assessHIPAA(hasHttps, vulnerabilities, securityHeaders, missingHeaders);

      setComplianceData({
        soc2: soc2Assessment,
        gdpr: gdprAssessment,
        pci_dss: pciAssessment,
        hipaa: hipaaAssessment,
        overall_status: "Assessment Complete",
        last_assessment: scanResults?.timestamp,
      });
    } catch (error) {
      console.error("Error calculating compliance:", error);
    }
  };

  const assessSOC2 = (hasHttps: boolean, securityHeaders: number, criticalVulns: number, alertsConfigured: number) => {
    let score = 0;
    let requirementsMet = 0;
    const totalRequirements = 5;
    const issues: string[] = [];

    if (hasHttps) { score += 20; requirementsMet += 1; } else { issues.push("CC6.1: Implement HTTPS for secure data transmission"); }
    if (criticalVulns === 0) { score += 20; requirementsMet += 1; } else { issues.push("CC6.2: Resolve critical authentication vulnerabilities"); }
    if (alertsConfigured > 0) { score += 20; requirementsMet += 1; } else { issues.push("CC6.7: Configure security monitoring and alerting"); }
    if (securityHeaders >= 3) { score += 20; requirementsMet += 1; } else { issues.push("CC6.8: Implement security headers for incident prevention"); }
    if (criticalVulns === 0 && hasHttps) { score += 20; requirementsMet += 1; } else { issues.push("CC7.1: Maintain secure system operations"); }

    return { score, issues, requirements_met: requirementsMet, total_requirements: totalRequirements };
  };

  const assessGDPR = (vulnerabilities: any[], hasHttps: boolean, securityHeaders: number) => {
    let score = 0;
    let requirementsMet = 0;
    const totalRequirements = 4;
    const issues: string[] = [];

    if (hasHttps && securityHeaders >= 2) { score += 25; requirementsMet += 1; } else { issues.push("Article 32: Implement appropriate technical security measures"); }
    if (vulnerabilities.length === 0) { score += 25; requirementsMet += 1; } else { issues.push("Article 25: Address security vulnerabilities for data protection by design"); }
    if (vulnerabilities.filter((v: any) => v.category === "Data Exposure").length === 0) { score += 25; requirementsMet += 1; } else { issues.push("Article 32: Prevent data exposure vulnerabilities"); }
    if (hasHttps && securityHeaders >= 3) { score += 25; requirementsMet += 1; } else { issues.push("Article 5: Demonstrate accountability through comprehensive security measures"); }

    return { score, issues, requirements_met: requirementsMet, total_requirements: totalRequirements };
  };

  const assessPCIDSS = (hasHttps: boolean, vulnerabilities: any[], securityHeaders: number) => {
    let score = 0;
    let requirementsMet = 0;
    const totalRequirements = 6;
    const issues: string[] = [];

    if (hasHttps) { score += 17; requirementsMet += 1; } else { issues.push("PCI-DSS 4.1: Encrypt cardholder data transmission with HTTPS"); }
    if (vulnerabilities.length <= 2) { score += 17; requirementsMet += 1; } else { issues.push("PCI-DSS 6.1: Address security vulnerabilities in systems"); }
    if (vulnerabilities.filter((v: any) => v.category === "Authentication").length === 0) { score += 16; requirementsMet += 1; } else { issues.push("PCI-DSS 8.2: Implement proper authentication controls"); }
    if (securityHeaders >= 2) { score += 17; requirementsMet += 1; } else { issues.push("PCI-DSS 10.1: Implement logging and monitoring controls"); }
    if (vulnerabilities.filter((v: any) => v.severity === "CRITICAL").length === 0) { score += 16; requirementsMet += 1; } else { issues.push("PCI-DSS 11.2: Address critical security vulnerabilities"); }
    if (hasHttps && securityHeaders >= 4) { score += 17; requirementsMet += 1; } else { issues.push("PCI-DSS 12.1: Establish comprehensive security policies"); }

    return { score, issues, requirements_met: requirementsMet, total_requirements: totalRequirements };
  };

  const assessHIPAA = (hasHttps: boolean, vulnerabilities: any[], securityHeaders: number, missingHeaders: number) => {
    let score = 0;
    let requirementsMet = 0;
    const totalRequirements = 4;
    const issues: string[] = [];

    if (vulnerabilities.filter((v: any) => v.category === "Authentication").length === 0) { score += 25; requirementsMet += 1; } else { issues.push("Administrative: Implement proper access controls and authentication"); }
    if (hasHttps) { score += 25; requirementsMet += 1; } else { issues.push("Physical: Ensure secure data transmission with encryption"); }
    if (securityHeaders >= 4) { score += 25; requirementsMet += 1; } else { issues.push("Technical: Implement comprehensive security controls"); }
    if (vulnerabilities.length <= 1 && hasHttps) { score += 25; requirementsMet += 1; } else { issues.push("Organizational: Maintain secure systems and address vulnerabilities"); }

    return { score, issues, requirements_met: requirementsMet, total_requirements: totalRequirements };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-red-400";
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return "bg-emerald-400";
    if (score >= 60) return "bg-amber-400";
    return "bg-red-400";
  };

  const frameworks = [
    { key: "soc2", label: "SOC2", data: complianceData.soc2, sublabel: "controls met" },
    { key: "gdpr", label: "GDPR", data: complianceData.gdpr, sublabel: "articles addressed" },
    { key: "pci_dss", label: "PCI-DSS", data: complianceData.pci_dss, sublabel: "requirements met" },
    { key: "hipaa", label: "HIPAA", data: complianceData.hipaa, sublabel: "safeguards implemented" },
  ];

  return (
    <div>
      {/* Status Banner */}
      <div className={`rounded-lg p-3 mb-4 ${complianceData.last_assessment ? "bg-cyan-500/10 border border-cyan-500/20" : "bg-amber-500/10 border border-amber-500/20"}`}>
        <p className={`text-sm font-medium ${complianceData.last_assessment ? "text-cyan-400" : "text-amber-400"}`}>
          Compliance Assessment Status: {complianceData.overall_status}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {complianceData.last_assessment
            ? `Based on security scan performed on ${new Date(complianceData.last_assessment).toLocaleString()}`
            : "Run a security scan to generate real compliance assessment data"}
        </p>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {frameworks.map((fw) => (
          <div key={fw.key} className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
            <div className="text-sm text-gray-400 mb-1">{fw.label}</div>
            <div className={`text-2xl font-bold ${getScoreColor(fw.data.score)}`}>{fw.data.score}%</div>
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
              <div className={`h-1.5 rounded-full ${getBarColor(fw.data.score)}`} style={{ width: `${fw.data.score}%` }} />
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {fw.data.requirements_met}/{fw.data.total_requirements} {fw.sublabel}
            </div>
          </div>
        ))}
      </div>

      {/* Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {frameworks.map((fw) => (
          <div key={fw.key} className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
            <h4 className="text-white font-medium text-sm mb-3">{fw.label} Compliance Issues</h4>
            {fw.data.issues.length > 0 ? (
              <ul className="space-y-2">
                {fw.data.issues.map((issue, idx) => (
                  <li key={idx} className="text-gray-400 text-sm border-b border-white/5 pb-2">{issue}</li>
                ))}
              </ul>
            ) : (
              <div className="text-emerald-400 text-sm">All {fw.label} requirements met</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
