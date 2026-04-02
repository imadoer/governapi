"use client";

import { Card, Row, Col, Progress, Alert, List, Statistic } from "antd";
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
    pci_dss: {
      score: 0,
      issues: [],
      requirements_met: 0,
      total_requirements: 0,
    },
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
      const criticalVulns = vulnerabilities.filter(
        (v: any) => v.severity === "CRITICAL",
      ).length;
      const highVulns = vulnerabilities.filter(
        (v: any) => v.severity === "HIGH",
      ).length;
      const hasHttps = scanResults.ssl_analysis?.certificate_valid !== false;
      const securityHeaders =
        scanResults.headers_analysis?.security_headers_present?.length || 0;
      const missingHeaders =
        scanResults.headers_analysis?.security_headers_missing?.length || 0;

      const soc2Assessment = assessSOC2(
        hasHttps,
        securityHeaders,
        criticalVulns,
        1,
      );
      const gdprAssessment = assessGDPR(
        vulnerabilities,
        hasHttps,
        securityHeaders,
      );
      const pciAssessment = assessPCIDSS(
        hasHttps,
        vulnerabilities,
        securityHeaders,
      );
      const hipaaAssessment = assessHIPAA(
        hasHttps,
        vulnerabilities,
        securityHeaders,
        missingHeaders,
      );

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

  const assessSOC2 = (
    hasHttps: boolean,
    securityHeaders: number,
    criticalVulns: number,
    alertsConfigured: number,
  ) => {
    let score = 0;
    let requirementsMet = 0;
    const totalRequirements = 5;
    const issues: string[] = [];

    if (hasHttps) {
      score += 20;
      requirementsMet += 1;
    } else {
      issues.push("CC6.1: Implement HTTPS for secure data transmission");
    }

    if (criticalVulns === 0) {
      score += 20;
      requirementsMet += 1;
    } else {
      issues.push("CC6.2: Resolve critical authentication vulnerabilities");
    }

    if (alertsConfigured > 0) {
      score += 20;
      requirementsMet += 1;
    } else {
      issues.push("CC6.7: Configure security monitoring and alerting");
    }

    if (securityHeaders >= 3) {
      score += 20;
      requirementsMet += 1;
    } else {
      issues.push("CC6.8: Implement security headers for incident prevention");
    }

    if (criticalVulns === 0 && hasHttps) {
      score += 20;
      requirementsMet += 1;
    } else {
      issues.push("CC7.1: Maintain secure system operations");
    }

    return {
      score,
      issues,
      requirements_met: requirementsMet,
      total_requirements: totalRequirements,
    };
  };

  const assessGDPR = (
    vulnerabilities: any[],
    hasHttps: boolean,
    securityHeaders: number,
  ) => {
    let score = 0;
    let requirementsMet = 0;
    const totalRequirements = 4;
    const issues: string[] = [];

    if (hasHttps && securityHeaders >= 2) {
      score += 25;
      requirementsMet += 1;
    } else {
      issues.push(
        "Article 32: Implement appropriate technical security measures",
      );
    }

    if (vulnerabilities.length === 0) {
      score += 25;
      requirementsMet += 1;
    } else {
      issues.push(
        "Article 25: Address security vulnerabilities for data protection by design",
      );
    }

    if (
      vulnerabilities.filter((v: any) => v.category === "Data Exposure")
        .length === 0
    ) {
      score += 25;
      requirementsMet += 1;
    } else {
      issues.push("Article 32: Prevent data exposure vulnerabilities");
    }

    if (hasHttps && securityHeaders >= 3) {
      score += 25;
      requirementsMet += 1;
    } else {
      issues.push(
        "Article 5: Demonstrate accountability through comprehensive security measures",
      );
    }

    return {
      score,
      issues,
      requirements_met: requirementsMet,
      total_requirements: totalRequirements,
    };
  };

  const assessPCIDSS = (
    hasHttps: boolean,
    vulnerabilities: any[],
    securityHeaders: number,
  ) => {
    let score = 0;
    let requirementsMet = 0;
    const totalRequirements = 6;
    const issues: string[] = [];

    if (hasHttps) {
      score += 17;
      requirementsMet += 1;
    } else {
      issues.push(
        "PCI-DSS 4.1: Encrypt cardholder data transmission with HTTPS",
      );
    }

    if (vulnerabilities.length <= 2) {
      score += 17;
      requirementsMet += 1;
    } else {
      issues.push("PCI-DSS 6.1: Address security vulnerabilities in systems");
    }

    if (
      vulnerabilities.filter((v: any) => v.category === "Authentication")
        .length === 0
    ) {
      score += 16;
      requirementsMet += 1;
    } else {
      issues.push("PCI-DSS 8.2: Implement proper authentication controls");
    }

    if (securityHeaders >= 2) {
      score += 17;
      requirementsMet += 1;
    } else {
      issues.push("PCI-DSS 10.1: Implement logging and monitoring controls");
    }

    if (
      vulnerabilities.filter((v: any) => v.severity === "CRITICAL").length === 0
    ) {
      score += 16;
      requirementsMet += 1;
    } else {
      issues.push("PCI-DSS 11.2: Address critical security vulnerabilities");
    }

    if (hasHttps && securityHeaders >= 4) {
      score += 17;
      requirementsMet += 1;
    } else {
      issues.push("PCI-DSS 12.1: Establish comprehensive security policies");
    }

    return {
      score,
      issues,
      requirements_met: requirementsMet,
      total_requirements: totalRequirements,
    };
  };

  const assessHIPAA = (
    hasHttps: boolean,
    vulnerabilities: any[],
    securityHeaders: number,
    missingHeaders: number,
  ) => {
    let score = 0;
    let requirementsMet = 0;
    const totalRequirements = 4;
    const issues: string[] = [];

    if (
      vulnerabilities.filter((v: any) => v.category === "Authentication")
        .length === 0
    ) {
      score += 25;
      requirementsMet += 1;
    } else {
      issues.push(
        "Administrative: Implement proper access controls and authentication",
      );
    }

    if (hasHttps) {
      score += 25;
      requirementsMet += 1;
    } else {
      issues.push("Physical: Ensure secure data transmission with encryption");
    }

    if (securityHeaders >= 4) {
      score += 25;
      requirementsMet += 1;
    } else {
      issues.push("Technical: Implement comprehensive security controls");
    }

    if (vulnerabilities.length <= 1 && hasHttps) {
      score += 25;
      requirementsMet += 1;
    } else {
      issues.push(
        "Organizational: Maintain secure systems and address vulnerabilities",
      );
    }

    return {
      score,
      issues,
      requirements_met: requirementsMet,
      total_requirements: totalRequirements,
    };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#52c41a";
    if (score >= 60) return "#faad14";
    return "#ff4d4f";
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Alert
            message={`Compliance Assessment Status: ${complianceData.overall_status}`}
            description={
              complianceData.last_assessment
                ? `Based on security scan performed on ${new Date(complianceData.last_assessment).toLocaleString()}`
                : "Run a security scan to generate real compliance assessment data"
            }
            type={complianceData.last_assessment ? "info" : "warning"}
            showIcon
            style={{ marginBottom: 16 }}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="SOC2"
              value={complianceData.soc2.score}
              suffix="%"
              valueStyle={{ color: getScoreColor(complianceData.soc2.score) }}
            />
            <Progress
              percent={complianceData.soc2.score}
              strokeColor={getScoreColor(complianceData.soc2.score)}
              showInfo={false}
            />
            <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
              {complianceData.soc2.requirements_met}/
              {complianceData.soc2.total_requirements} controls met
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="GDPR"
              value={complianceData.gdpr.score}
              suffix="%"
              valueStyle={{ color: getScoreColor(complianceData.gdpr.score) }}
            />
            <Progress
              percent={complianceData.gdpr.score}
              strokeColor={getScoreColor(complianceData.gdpr.score)}
              showInfo={false}
            />
            <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
              {complianceData.gdpr.requirements_met}/
              {complianceData.gdpr.total_requirements} articles addressed
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="PCI-DSS"
              value={complianceData.pci_dss.score}
              suffix="%"
              valueStyle={{
                color: getScoreColor(complianceData.pci_dss.score),
              }}
            />
            <Progress
              percent={complianceData.pci_dss.score}
              strokeColor={getScoreColor(complianceData.pci_dss.score)}
              showInfo={false}
            />
            <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
              {complianceData.pci_dss.requirements_met}/
              {complianceData.pci_dss.total_requirements} requirements met
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="HIPAA"
              value={complianceData.hipaa.score}
              suffix="%"
              valueStyle={{ color: getScoreColor(complianceData.hipaa.score) }}
            />
            <Progress
              percent={complianceData.hipaa.score}
              strokeColor={getScoreColor(complianceData.hipaa.score)}
              showInfo={false}
            />
            <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
              {complianceData.hipaa.requirements_met}/
              {complianceData.hipaa.total_requirements} safeguards implemented
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="SOC2 Compliance Issues" size="small">
            {complianceData.soc2.issues.length > 0 ? (
              <List
                size="small"
                dataSource={complianceData.soc2.issues}
                renderItem={(item: string) => <List.Item>{item}</List.Item>}
              />
            ) : (
              <div style={{ color: "#52c41a" }}>All SOC2 requirements met</div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="GDPR Compliance Issues" size="small">
            {complianceData.gdpr.issues.length > 0 ? (
              <List
                size="small"
                dataSource={complianceData.gdpr.issues}
                renderItem={(item: string) => <List.Item>{item}</List.Item>}
              />
            ) : (
              <div style={{ color: "#52c41a" }}>All GDPR requirements met</div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="PCI-DSS Compliance Issues" size="small">
            {complianceData.pci_dss.issues.length > 0 ? (
              <List
                size="small"
                dataSource={complianceData.pci_dss.issues}
                renderItem={(item: string) => <List.Item>{item}</List.Item>}
              />
            ) : (
              <div style={{ color: "#52c41a" }}>
                All PCI-DSS requirements met
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="HIPAA Compliance Issues" size="small">
            {complianceData.hipaa.issues.length > 0 ? (
              <List
                size="small"
                dataSource={complianceData.hipaa.issues}
                renderItem={(item: string) => <List.Item>{item}</List.Item>}
              />
            ) : (
              <div style={{ color: "#52c41a" }}>
                All HIPAA safeguards implemented
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
