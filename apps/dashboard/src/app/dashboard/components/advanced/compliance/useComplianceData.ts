import { useState, useCallback, useEffect } from "react";
import {
  Framework, Control, Evidence, Attestation, RemediationTask,
  Vendor, Violation, AuditLogEntry, Policy, DashboardData, AuditReadiness
} from "./types";

export function useComplianceData(tenantId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
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
    if (type !== "loading") setTimeout(() => setToastMessage(null), 3000);
  };

  // Safe fetch helper — never throws, returns fallback on error. 15s timeout.
  const safeFetch = async (url: string, fallback: any = null) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      return data.success ? data : fallback;
    } catch {
      return fallback;
    }
  };

  const fetchDashboardData = useCallback(async () => {
    const data = await safeFetch("/api/compliance/executive-dashboard");
    if (data) setDashboardData(data.dashboard);
    return data;
  }, [tenantId]);

  const fetchFrameworks = useCallback(async () => {
    const data = await safeFetch("/api/compliance/frameworks");
    if (data) setFrameworks(data.frameworks || []);
    return data;
  }, [tenantId]);

  const fetchControls = useCallback(async (frameworkId?: string) => {
    const url = frameworkId ? `/api/compliance/frameworks/${frameworkId}/controls` : "/api/compliance/controls";
    const data = await safeFetch(url);
    if (data) setControls(data.controls || []);
  }, [tenantId]);

  const fetchControlEvidence = useCallback(async (controlId: number) => {
    const data = await safeFetch(`/api/compliance/evidence?controlId=${controlId}`);
    if (data) setControlEvidence(data.evidence || []);
  }, [tenantId]);

  const fetchPolicies = useCallback(async () => {
    const data = await safeFetch("/api/compliance/policies");
    if (data) setPolicies(data.policies || []);
  }, [tenantId]);

  const fetchAttestations = useCallback(async (filter: string = "all") => {
    const params = filter !== "all" ? `?status=${filter}` : "";
    const data = await safeFetch(`/api/compliance/attestations${params}`);
    if (data) { setAttestations(data.attestations || []); setAttestationStats(data.stats || {}); }
  }, [tenantId]);

  const fetchRemediation = useCallback(async (filters: { status: string; priority: string }) => {
    const params = new URLSearchParams();
    if (filters.status !== "all") params.append("status", filters.status);
    if (filters.priority !== "all") params.append("priority", filters.priority);
    const data = await safeFetch(`/api/compliance/remediation?${params}`);
    if (data) { setRemediationTasks(data.tasks || []); setRemediationStats(data.stats || {}); }
  }, [tenantId]);

  const fetchVendors = useCallback(async () => {
    const data = await safeFetch("/api/compliance/vendors");
    if (data) { setVendors(data.vendors || []); setVendorStats(data.stats || {}); }
  }, [tenantId]);

  const fetchViolations = useCallback(async (filters: { status: string; severity: string }) => {
    const params = new URLSearchParams();
    if (filters.status !== "all") params.append("status", filters.status);
    if (filters.severity !== "all") params.append("severity", filters.severity);
    const data = await safeFetch(`/api/compliance/violations?${params}`);
    if (data) { setViolations(data.violations || []); setViolationStats(data.stats || {}); }
  }, [tenantId]);

  const fetchAuditLogs = useCallback(async () => {
    const data = await safeFetch("/api/compliance/audit-log?limit=50");
    if (data) setAuditLogs(data.logs || []);
  }, [tenantId]);

  const fetchAuditReadiness = useCallback(async () => {
    const data = await safeFetch("/api/compliance/audit-readiness");
    if (data) setAuditReadiness(Array.isArray(data.readiness) ? data.readiness : [data.readiness].filter(Boolean));
  }, [tenantId]);

  // Initial load: only dashboard + frameworks (2 calls instead of 9)
  const fetchInitial = useCallback(async () => {
    setLoading(true);
    setError(false);
    const [dash, fw] = await Promise.all([fetchDashboardData(), fetchFrameworks()]);
    // If both critical fetches returned nothing, mark as error
    if (!dash && !fw) setError(true);
    setLoading(false);
  }, [fetchDashboardData, fetchFrameworks]);

  // Background: load remaining data after initial render
  const fetchBackground = useCallback(async () => {
    // Fire all in parallel but don't block
    Promise.all([
      fetchPolicies(),
      fetchAttestations(),
      fetchRemediation({ status: "all", priority: "all" }),
      fetchVendors(),
      fetchViolations({ status: "all", severity: "all" }),
      fetchAuditLogs(),
      fetchAuditReadiness(),
    ]);
  }, [fetchPolicies, fetchAttestations, fetchRemediation, fetchVendors, fetchViolations, fetchAuditLogs, fetchAuditReadiness]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboardData(), fetchFrameworks()]);
    fetchBackground();
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
    if (data.success) { showToast("success", "Attestation submitted"); fetchAttestations(); fetchDashboardData(); }
    else showToast("error", data.error || "Failed to submit");
    return data;
  };

  const createRemediation = async (values: any) => {
    const res = await fetch("/api/compliance/remediation", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (data.success) { showToast("success", "Remediation task created"); fetchRemediation({ status: "all", priority: "all" }); }
    else showToast("error", data.error || "Failed to create task");
    return data;
  };

  const updateRemediationStatus = async (taskId: number, status: string) => {
    const res = await fetch("/api/compliance/remediation", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ id: taskId, status }),
    });
    const data = await res.json();
    if (data.success) { showToast("success", `Task ${status}`); fetchRemediation({ status: "all", priority: "all" }); }
    return data;
  };

  const createVendor = async (values: any) => {
    const res = await fetch("/api/compliance/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (data.success) { showToast("success", "Vendor added"); fetchVendors(); }
    else showToast("error", data.error || "Failed to add vendor");
    return data;
  };

  const uploadEvidence = async (values: any) => {
    const res = await fetch("/api/compliance/evidence", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (data.success) { showToast("success", "Evidence uploaded"); if (values.controlId) fetchControlEvidence(values.controlId); }
    else showToast("error", data.error || "Failed to upload");
    return data;
  };

  const createPolicy = async (values: any) => {
    const res = await fetch("/api/compliance/policies", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (data.success) { showToast("success", "Policy created"); fetchPolicies(); }
    else showToast("error", data.error || "Failed to create policy");
    return data;
  };

  const resolveViolation = async (violationId: number, resolvedBy: string, notes: string) => {
    const res = await fetch("/api/compliance/violations", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ id: violationId, status: "resolved", resolvedBy, resolutionNotes: notes }),
    });
    const data = await res.json();
    if (data.success) { showToast("success", "Violation resolved"); fetchViolations({ status: "all", severity: "all" }); fetchDashboardData(); }
    return data;
  };

  const generateReport = async (reportType: string, format: string = "pdf") => {
    showToast("loading", `Generating ${reportType} report...`);
    try {
      const res = await fetch(`/api/compliance/reports/generate?type=${reportType}&format=${format}`, { headers });
      if (!res.ok) throw new Error();
      if (format === "pdf") {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `${reportType}_report_${Date.now()}.pdf`;
        document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      } else {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `${reportType}_report_${Date.now()}.json`;
        document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      }
      showToast("success", "Report generated");
    } catch {
      showToast("error", "Report generation failed");
    }
  };

  useEffect(() => {
    fetchInitial().then(() => fetchBackground());
  }, [fetchInitial, fetchBackground]);

  return {
    loading, error, refreshing, handleRefresh, toastMessage,
    dashboardData, frameworks, controls, controlEvidence, policies,
    attestations, attestationStats, remediationTasks, remediationStats,
    vendors, vendorStats, violations, violationStats, auditLogs, auditReadiness,
    fetchControls, fetchControlEvidence, fetchAttestations, fetchRemediation, fetchViolations,
    submitAttestation, createRemediation, updateRemediationStatus, createVendor,
    uploadEvidence, createPolicy, resolveViolation, generateReport,
  };
}
