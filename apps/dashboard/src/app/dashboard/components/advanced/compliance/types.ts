export interface Framework {
  id: string;
  name: string;
  description: string;
  score: number;
  totalControls: number;
  passedControls: number;
  failedControls: number;
  pendingControls: number;
  status: "compliant" | "partial" | "non-compliant";
  lastAssessed: string;
  nextAssessment: string;
  category?: string;
}

export interface Control {
  id: number;
  frameworkId: number;
  frameworkName?: string;
  controlId: string;
  controlName: string;
  description: string;
  category: string;
  status: string;
  lastTested: string;
  evidenceCount: number;
  evidenceFreshness: string;
  automatable: boolean;
  owner?: string;
  riskLevel?: string;
}

export interface Evidence {
  id: number;
  controlId: number;
  frameworkId: number;
  evidenceType: string;
  title: string;
  description: string;
  sourceType: string;
  sourceName: string;
  sourceIntegration: string;
  fileUrl: string;
  fileName: string;
  automated: boolean;
  freshnessStatus: string;
  collectedAt: string;
  expiresAt: string;
  validated: boolean;
  validatedBy: string;
  validatedAt: string;
}

export interface Attestation {
  id: number;
  framework_id: number;
  framework_name: string;
  control_id: number;
  control_code: string;
  control_name: string;
  attestation_type: string;
  attestation_status: string;
  control_owner_id: string;
  control_owner_name: string;
  control_owner_email: string;
  due_date: string;
  attested_at: string | null;
  expires_at: string | null;
  comments: string | null;
}

export interface RemediationTask {
  id: number;
  title: string;
  description: string;
  remediation_steps: string;
  priority: string;
  severity: string;
  status: string;
  assigned_to: string;
  assigned_to_name: string;
  sla_hours: number;
  sla_deadline: string;
  sla_breached: boolean;
  progress_percentage: number;
  due_date: string;
  created_at: string;
  framework_name: string;
  external_ticket_url?: string;
}

export interface Vendor {
  id: number;
  vendor_name: string;
  vendor_type: string;
  description: string;
  risk_tier: string;
  risk_score: number;
  data_classification: string;
  soc2_certified: boolean;
  iso27001_certified: boolean;
  hipaa_compliant: boolean;
  gdpr_compliant: boolean;
  pci_compliant: boolean;
  last_assessment_date: string;
  next_assessment_date: string;
  status: string;
  contact_name: string;
  contact_email: string;
}

export interface Violation {
  id: number;
  endpoint_id: string;
  endpoint_path: string;
  endpoint_method: string;
  violation_type: string;
  violation_category: string;
  title: string;
  description: string;
  severity: string;
  risk_score: number;
  status: string;
  detected_at: string;
  remediation_status?: string;
  remediation_assignee?: string;
}

export interface AuditLogEntry {
  id: number;
  event_type: string;
  event_category: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id: string;
  actor_name: string;
  old_value: any;
  new_value: any;
  created_at: string;
}

export interface Policy {
  id: number;
  policy_name: string;
  policy_type: string;
  description: string;
  version: string;
  status: string;
  owner_name: string;
  effective_date: string;
  review_date: string;
  expiration_date: string;
}

export interface DashboardData {
  kpis: {
    overallComplianceScore: number;
    frameworksCovered: number;
    frameworksCompliant: number;
    openViolations: number;
    criticalFindings: number;
    pendingAttestations: number;
    overdueAttestations: number;
    upcomingDeadlinesCount: number;
  };
  frameworkCoverage: any[];
  criticalViolations: Violation[];
  upcomingDeadlines: any[];
  recentActivity: AuditLogEntry[];
  complianceTrend: { month: string; avg_score: number }[];
  attestationStatus: {
    current: number;
    pending: number;
    overdue: number;
    total: number;
  };
  regulatoryAlerts: any[];
}

export interface AuditReadiness {
  frameworkId: number;
  frameworkName: string;
  overallScore: number;
  readyForAudit: boolean;
  scores: {
    evidence: number;
    controls: number;
    attestations: number;
    remediation: number;
  };
  stats: any;
  recommendations: string[];
  riskFactors: any[];
}

export interface ComplianceFilters {
  violationFilter: { status: string; severity: string };
  remediationFilter: { status: string; priority: string };
  attestationFilter: string;
}

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    compliant: "green", passed: "green", attested: "green", completed: "green", active: "green", fresh: "green", resolved: "green",
    partial: "orange", pending: "orange", in_progress: "orange", draft: "orange", stale: "orange",
    "non-compliant": "red", failed: "red", overdue: "red", expired: "red", open: "red", missing: "red", blocked: "red",
    critical: "red", high: "orange", medium: "gold", low: "blue",
  };
  return colors[status?.toLowerCase()] || "default";
};

export const getScoreColor = (score: number): string => {
  if (score >= 90) return "#52c41a";
  if (score >= 70) return "#faad14";
  if (score >= 50) return "#fa8c16";
  return "#ff4d4f";
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString();
};

export const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleString();
};
