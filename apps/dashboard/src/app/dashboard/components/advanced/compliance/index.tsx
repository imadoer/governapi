"use client";
import React, { useState, useEffect } from "react";
import { Typography, Button, Space, message, Spin, Tabs, Badge } from "antd";
import { SafetyCertificateOutlined, SyncOutlined, RiseOutlined, FileProtectOutlined, AlertOutlined, AuditOutlined } from "@ant-design/icons";
import { useComplianceData } from "./useComplianceData";
import { ExecutiveDashboardTab } from "./ExecutiveDashboardTab";
import { FrameworksControlsTab } from "./FrameworksControlsTab";
import { RiskViolationsTab } from "./RiskViolationsTab";
import { AuditReportsTab } from "./AuditReportsTab";
import { Framework } from "./types";

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

interface Props {
  company?: any;
}

export function ComplianceHubPage({ company }: Props) {
  const tenantId = company?.id || "1";
  const userName = company?.userName || "User";

  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(null);
  const [violationFilter, setViolationFilter] = useState({ status: "all", severity: "all" });
  const [remediationFilter, setRemediationFilter] = useState({ status: "all", priority: "all" });
  const [attestationFilter, setAttestationFilter] = useState("all");

  const data = useComplianceData(tenantId);

  useEffect(() => {
    data.fetchViolations(violationFilter);
  }, [violationFilter]);

  useEffect(() => {
    data.fetchRemediation(remediationFilter);
  }, [remediationFilter]);

  useEffect(() => {
    data.fetchAttestations(attestationFilter);
  }, [attestationFilter]);

  if (data.loading) {
    return (<div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}><Spin size="large" tip="Loading Compliance Hub..." /></div>);
  }

  return (
    <div style={{ padding: 0 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <Title level={2} style={{ margin: 0, display: "flex", alignItems: "center", gap: 12, color: "rgba(255, 255, 255, 0.9)" }}>
              <SafetyCertificateOutlined style={{ color: "#06b6d4" }} />
              Compliance Hub
            </Title>
            <Paragraph style={{ margin: "8px 0 0", color: "rgba(255, 255, 255, 0.5)" }}>
              Fortune 500-grade compliance management with continuous assurance
            </Paragraph>
          </div>
          <Space>
            <Button icon={<SyncOutlined spin={data.refreshing} />} onClick={data.handleRefresh} loading={data.refreshing}>Refresh</Button>
          </Space>
        </div>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} size="large" tabBarStyle={{ marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.1)" }} className="compliance-tabs">
        <TabPane tab={<span><RiseOutlined /> Executive Dashboard</span>} key="dashboard">
          <ExecutiveDashboardTab
            onExportPDF={() => data.generateReport("executive", "pdf")}
            onRunAssessment={() => message.info("Running compliance assessment...")}
           
            dashboardData={data.dashboardData}
            onViewAllLogs={() => setActiveTab("audit")}
            onViewViolations={() => setActiveTab("risk")}
          />
        </TabPane>

        <TabPane tab={<span><FileProtectOutlined /> Frameworks & Controls</span>} key="frameworks">
          <FrameworksControlsTab
            frameworks={data.frameworks}
            controls={data.controls}
            controlEvidence={data.controlEvidence}
            policies={data.policies}
            attestations={data.attestations}
            attestationStats={data.attestationStats}
            selectedFramework={selectedFramework}
            onSelectFramework={setSelectedFramework}
            onFetchControls={data.fetchControls}
            onFetchControlEvidence={data.fetchControlEvidence}
            onSubmitAttestation={(id, values) => data.submitAttestation(id, values, { actorId: company?.userId, actorName: userName })}
            onUploadEvidence={data.uploadEvidence}
            onCreatePolicy={data.createPolicy}
            attestationFilter={attestationFilter}
            onAttestationFilterChange={setAttestationFilter}
            userName={userName}
          />
        </TabPane>

        <TabPane tab={<Badge count={data.violationStats.bySeverity?.critical || 0} offset={[10, 0]}><span><AlertOutlined /> Risk & Violations</span></Badge>} key="risk">
          <RiskViolationsTab
            violations={data.violations}
            violationStats={data.violationStats}
            remediationTasks={data.remediationTasks}
            remediationStats={data.remediationStats}
            vendors={data.vendors}
            vendorStats={data.vendorStats}
            violationFilter={violationFilter}
            remediationFilter={remediationFilter}
            onViolationFilterChange={setViolationFilter}
            onRemediationFilterChange={setRemediationFilter}
            onCreateRemediation={data.createRemediation}
            onUpdateRemediationStatus={data.updateRemediationStatus}
            onCreateVendor={data.createVendor}
            onResolveViolation={data.resolveViolation}
            userName={userName}
          />
        </TabPane>

        <TabPane tab={<span><AuditOutlined /> Audit & Reports</span>} key="audit">
          <AuditReportsTab
            auditLogs={data.auditLogs}
            auditReadiness={data.auditReadiness}
            onGenerateReport={data.generateReport}
          />
        </TabPane>
      </Tabs>
    </div>
  );
}

export default ComplianceHubPage;
