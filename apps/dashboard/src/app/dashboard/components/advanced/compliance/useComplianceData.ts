import { useState, useCallback, useEffect } from "react";
import {
  Framework, Control, Evidence, Attestation, RemediationTask,
  Vendor, Violation, AuditLogEntry, Policy, DashboardData, AuditReadiness
} from "./types";

export function useComplianceData(tenantId: string) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error" | "info" | "loading"; text: string } | null>(null);

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [controlEvidence, setControlEvidence] = useState<Evidence[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [attestationStats, setAttestationStats] = useState<any>({});
  const [remediationTasks, setRemediationTasks] = useState<RemediationTask[]>([]);
  const [remediationStats, setRemediationStats] = useState<any>({});
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorStats, setVendorStats] = useState<any>({});
  const [violations, setViolations] = useState<Violation[]>([]);
  const [violationStats, setViolationStats] = useState<any>({});
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditReadiness, setAuditReadiness] = useState<AuditReadiness[]>([]);

  const headers = { "x-tenant-id": tenantId };

  const showToast = (type: "success" | "error" | "info" | "loading", text: string) => {
    setToastMessage({ type, text });
    if (type !== "loading") {
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch("/api/compliance/executive-dashboard", { headers });
      const data = await res.json();
      if (data.success) setDashboardData(data.dashboard);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    }
  }, [tenantId]);

  const fetchFrameworks = useCallback(async () => {
    try {
      const res = await fetch("/api/compliance/frameworks", { headers });
      const data = await res.json();
      if (data.success) setFrameworks(data.frameworks || []);
    } catch (error) {
      console.error("Error fetching frameworks:", error);
    }
  }, [tenantId]);

  const fetchControls = useCallback(async (frameworkId?: string) => {
    try {
      const url = frameworkId ? `/api/compliance/frameworks/${frameworkId}/controls` : "/api/compliance/controls";
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.success) setControls(data.controls || []);
    } catch (error) {
      console.error("Error fetching controls:", error);
    }
  }, [tenantId]);

  const fetchControlEvidence = useCallback(async (controlId: number) => {
    try {
      const res = await fetch(`/api/compliance/evidence?controlId=${controlId}`, { headers });
      const data = await res.json();
      if (data.success) setControlEvidence(data.evidence || []);
    } catch (error) {
      console.error("Error fetching evidence:", error);
    }
  }, [tenantId]);

  const fetchPolicies = useCallback(async () => {
    try {
      const res = await fetch("/api/compliance/policies", { headers });
      const data = await res.json();
      if (data.success) setPolicies(data.policies || []);
    } catch (error) {
      console.error("Error fetching policies:", error);
    }
  }, [tenantId]);

  const fetchAttestations = useCallback(async (filter: string = "all") => {
    try {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const res = await fetch(`/api/compliance/attestations${params}`, { headers });
      const data = await res.json();
      if (data.success) {
        setAttestations(data.attestations || []);
        setAttestationStats(data.stats || {});
      }
    } catch (error) {
      console.error("Error fetching attestations:", error);
    }
  }, [tenantId]);

  const fetchRemediation = useCallback(async (filters: { status: string; priority: string }) => {
    try {
      const params = new URLSearchParams();
      if (filters.status !== "all") params.append("status", filters.status);
      if (filters.priority !== "all") params.append("priority", filters.priority);
      const res = await fetch(`/api/compliance/remediation?${params}`, { headers });
      const data = await res.json();
      if (data.success) {
        setRemediationTasks(data.tasks || []);
        setRemediationStats(data.stats || {});
      }
    } catch (error) {
      console.error("Error fetching remediation:", error);
    }
  }, [tenantId]);

  const fetchVendors = useCallback(async () => {
    try {
      const res = await fetch("/api/compliance/vendors", { headers });
      const data = await res.json();
      if (data.success) {
        setVendors(data.vendors || []);
        setVendorStats(data.stats || {});
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  }, [tenantId]);

  const fetchViolations = useCallback(async (filters: { status: string; severity: string }) => {
    try {
      const params = new URLSearchParams();
      if (filters.status !== "all") params.append("status", filters.status);
      if (filters.severity !== "all") params.append("severity", filters.severity);
      const res = await fetch(`/api/compliance/violations?${params}`, { headers });
      const data = await res.json();
      if (data.success) {
        setViolations(data.violations || []);
        setViolationStats(data.stats || {});
      }
    } catch (error) {
      console.error("Error fetching violations:", error);
    }
  }, [tenantId]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/compliance/audit-log?limit=100", { headers });
      const data = await res.json();
      if (data.success) setAuditLogs(data.logs || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    }
  }, [tenantId]);

  const fetchAuditReadiness = useCallback(async () => {
    try {
      const res = await fetch("/api/compliance/audit-readiness", { headers });
      const data = await res.json();
      if (data.success) setAuditReadiness(Array.isArray(data.readiness) ? data.readiness : [data.readiness].filter(Boolean));
    } catch (error) {
      console.error("Error fetching audit readiness:", error);
    }
  }, [tenantId]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDashboardData(),
        fetchFrameworks(),
        fetchPolicies(),
        fetchAttestations(),
        fetchRemediation({ status: "all", priority: "all" }),
        fetchVendors(),
        fetchViolations({ status: "all", severity: "all" }),
        fetchAuditLogs(),
        fetchAuditReadiness(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardData, fetchFrameworks, fetchPolicies, fetchAttestations, fetchRemediation, fetchVendors, fetchViolations, fetchAuditLogs, fetchAuditReadiness]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    showToast("success", "Data refreshed");
  };

  // Actions
  const submitAttestation = async (attestationId: number, values: any, actorInfo: any) => {
    const res = await fetch("/api/compliance/attestations", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ id: attestationId, attestationStatus: "attested", ...values, ...actorInfo }),
    });
    const data = await res.json();
    if (data.success) {
      showToast("success", "Attestation submitted successfully");
      fetchAttestations();
      fetchDashboardData();
    } else {
      showToast("error", data.error || "Failed to submit attestation");
    }
    return data;
  };

  const createRemediation = async (values: any) => {
    const res = await fetch("/api/compliance/remediation", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (data.success) {
      showToast("success", "Remediation task created");
      fetchRemediation({ status: "all", priority: "all" });
    } else {
      showToast("error", data.error || "Failed to create task");
    }
    return data;
  };

  const updateRemediationStatus = async (taskId: number, status: string) => {
    const res = await fetch("/api/compliance/remediation", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ id: taskId, status }),
    });
    const data = await res.json();
    if (data.success) {
      showToast("success", `Task ${status}`);
      fetchRemediation({ status: "all", priority: "all" });
    }
    return data;
  };

  const createVendor = async (values: any) => {
    const res = await fetch("/api/compliance/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (data.success) {
      showToast("success", "Vendor added successfully");
      fetchVendors();
    } else {
      showToast("error", data.error || "Failed to add vendor");
    }
    return data;
  };

  const uploadEvidence = async (values: any) => {
    const res = await fetch("/api/compliance/evidence", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (data.success) {
      showToast("success", "Evidence uploaded successfully");
      if (values.controlId) fetchControlEvidence(values.controlId);
    } else {
      showToast("error", data.error || "Failed to upload evidence");
    }
    return data;
  };

  const createPolicy = async (values: any) => {
    const res = await fetch("/api/compliance/policies", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (data.success) {
      showToast("success", "Policy created successfully");
      fetchPolicies();
    } else {
      showToast("error", data.error || "Failed to create policy");
    }
    return data;
  };

  const resolveViolation = async (violationId: number, resolvedBy: string, notes: string) => {
    const res = await fetch("/api/compliance/violations", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ id: violationId, status: "resolved", resolvedBy, resolutionNotes: notes }),
    });
    const data = await res.json();
    if (data.success) {
      showToast("success", "Violation resolved");
      fetchViolations({ status: "all", severity: "all" });
      fetchDashboardData();
    }
    return data;
  };

  const generateReport = async (reportType: string, format: string = "pdf") => {
    showToast("loading", `Generating ${reportType} report...`);
    try {
      const res = await fetch(`/api/compliance/reports/generate?type=${reportType}&format=${format}`, { headers });
      if (!res.ok) throw new Error("Failed to generate report");
      if (format === "pdf") {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${reportType}_report_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else if (format === "json") {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${reportType}_report_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      showToast("success", "Report generated successfully!");
    } catch (error) {
      showToast("error", "Failed to generate report");
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    loading, refreshing, handleRefresh, toastMessage,
    dashboardData, frameworks, controls, controlEvidence, policies,
    attestations, attestationStats, remediationTasks, remediationStats,
    vendors, vendorStats, violations, violationStats, auditLogs, auditReadiness,
    fetchControls, fetchControlEvidence, fetchAttestations, fetchRemediation, fetchViolations,
    submitAttestation, createRemediation, updateRemediationStatus, createVendor,
    uploadEvidence, createPolicy, resolveViolation, generateReport,
  };
}
