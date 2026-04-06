"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageSkeleton, FadeIn } from "./PageSkeleton";
import {
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-slate-800/50 border border-white/[0.06] rounded-2xl ${className}`}>{children}</div>;
}

const TABS = [
  { key: "profile", label: "Profile", icon: UserCircleIcon },
  { key: "notifications", label: "Notifications", icon: BellIcon },
  { key: "badge", label: "Security Badge", icon: ShieldCheckIcon },
  { key: "billing", label: "Billing", icon: CreditCardIcon },
  { key: "danger", label: "Danger Zone", icon: ExclamationTriangleIcon },
];

export function SettingsPage({ companyId }: { companyId: string }) {
  const [tab, setTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  // Profile state
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Notification state
  const [weeklyReport, setWeeklyReport] = useState(true);

  // Billing state
  const [plan, setPlan] = useState("starter");

  const flash = (text: string, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, profileRes] = await Promise.all([
        fetch("/api/customer/enterprise-settings", { headers: { "x-tenant-id": companyId } }),
        fetch("/api/auth/session", { credentials: "include" }),
      ]);
      const settingsData = await settingsRes.json();
      const profileData = await profileRes.json().catch(() => ({}));

      if (settingsData.success) {
        setCompanyName(settingsData.companyInfo?.name || "");
        setPlan(settingsData.companyInfo?.subscriptionPlan || "starter");
        setWeeklyReport(settingsData.enterpriseSettings?.weeklyReportEnabled ?? true);
      }
      if (profileData.user) {
        setEmail(profileData.user.email || "");
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { if (companyId) fetchSettings(); }, [companyId, fetchSettings]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      // Save company name
      const r = await fetch("/api/customer/enterprise-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": companyId },
        body: JSON.stringify({
          weeklyReportEnabled: weeklyReport,
          ssoEnabled: false,
          auditLogging: true,
          dataRetentionDays: 90,
          apiRateLimits: { requestsPerMinute: 1000, burstLimit: 100 },
          securityPolicies: { passwordPolicy: "standard", mfaRequired: false, sessionTimeout: 3600 },
        }),
      });
      const d = await r.json();
      if (d.success) flash("Settings saved");
      else flash(d.error || "Save failed", false);
    } catch { flash("Save failed", false); }
    setSaving(false);
  };

  const saveWeeklyReport = async (enabled: boolean) => {
    setWeeklyReport(enabled);
    try {
      await fetch("/api/customer/enterprise-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": companyId },
        body: JSON.stringify({
          weeklyReportEnabled: enabled,
          ssoEnabled: false,
          auditLogging: true,
          dataRetentionDays: 90,
          apiRateLimits: { requestsPerMinute: 1000, burstLimit: 100 },
          securityPolicies: { passwordPolicy: "standard", mfaRequired: false, sessionTimeout: 3600 },
        }),
      });
      flash(enabled ? "Weekly report enabled" : "Weekly report disabled");
    } catch { flash("Failed to update", false); }
  };

  const copyEmbed = () => {
    const snippet = `<a href="http://146.190.99.58:3000/report/${companyId}" target="_blank" rel="noopener">\n  <img src="http://146.190.99.58:3000/api/badge/${companyId}" alt="API Security Score" />\n</a>`;
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    flash("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <PageSkeleton />;

  const badgeUrl = `/api/badge/${companyId}`;
  const reportUrl = `http://146.190.99.58:3000/report/${companyId}`;
  const embedSnippet = `<a href="${reportUrl}" target="_blank" rel="noopener">\n  <img src="http://146.190.99.58:3000/api/badge/${companyId}" alt="API Security Score" />\n</a>`;
  const markdownSnippet = `[![API Security Score](http://146.190.99.58:3000/api/badge/${companyId})](${reportUrl})`;

  return (
    <FadeIn><div>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-5 right-5 z-[200] px-4 py-2 rounded-lg text-[13px] font-medium shadow-xl border border-white/[0.06] ${toast.ok ? "bg-emerald-600/90 text-white" : "bg-red-600/90 text-white"}`}>
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account, notifications, and preferences</p>
      </div>

      {/* Tabs + Content */}
      <div className="flex gap-8">
        {/* Sidebar tabs */}
        <div className="w-48 shrink-0 space-y-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors text-left ${
                tab === t.key
                  ? "bg-white/[0.06] text-white"
                  : t.key === "danger"
                  ? "text-red-400/60 hover:text-red-400 hover:bg-red-500/5"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>

              {/* ─── Profile ─── */}
              {tab === "profile" && (
                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-[15px] font-semibold text-white mb-6">Company Profile</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[12px] text-gray-400 mb-1.5">Company Name</label>
                        <input value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full max-w-md px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[13px] text-white focus:outline-none focus:border-white/[0.12]" />
                      </div>
                      <div>
                        <label className="block text-[12px] text-gray-400 mb-1.5">Account Email</label>
                        <input value={email} readOnly
                          className="w-full max-w-md px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[13px] text-gray-500 cursor-not-allowed" />
                        <p className="text-[11px] text-gray-600 mt-1">Contact support to change your email</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-[15px] font-semibold text-white mb-6">Change Password</h3>
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-[12px] text-gray-400 mb-1.5">Current Password</label>
                        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[13px] text-white focus:outline-none focus:border-white/[0.12]" />
                      </div>
                      <div>
                        <label className="block text-[12px] text-gray-400 mb-1.5">New Password</label>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[13px] text-white focus:outline-none focus:border-white/[0.12]" />
                      </div>
                      <button onClick={saveProfile} disabled={saving}
                        className="px-4 py-1.5 rounded-lg text-[12px] font-medium bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50">
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </Card>
                </div>
              )}

              {/* ─── Notifications ─── */}
              {tab === "notifications" && (
                <Card className="p-6">
                  <h3 className="text-[15px] font-semibold text-white mb-6">Email Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div>
                        <p className="text-[13px] text-white font-medium">Weekly Security Report</p>
                        <p className="text-[12px] text-gray-500 mt-0.5">
                          Send weekly security summary every Monday at 8:00 AM UTC to {email || "your email"}
                        </p>
                      </div>
                      <button
                        onClick={() => saveWeeklyReport(!weeklyReport)}
                        className={`relative w-10 h-5.5 rounded-full transition-colors shrink-0 ml-4 ${
                          weeklyReport ? "bg-emerald-500" : "bg-gray-700"
                        }`}
                        style={{ width: 40, height: 22 }}
                      >
                        <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          weeklyReport ? "left-[20px]" : "left-[3px]"
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div>
                        <p className="text-[13px] text-white font-medium">Scan Alerts</p>
                        <p className="text-[12px] text-gray-500 mt-0.5">
                          Receive alerts via Slack/PagerDuty when policies trigger
                        </p>
                      </div>
                      <span className="text-[11px] text-gray-600">Configured in Webhook Center</span>
                    </div>

                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <p className="text-[11px] text-gray-600">
                        Report includes: score comparison, new vulnerabilities, resolved vulns, compliance score, and top 3 priority fixes.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* ─── Security Badge ─── */}
              {tab === "badge" && (
                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-[15px] font-semibold text-white mb-2">Embeddable Security Badge</h3>
                    <p className="text-[12px] text-gray-500 mb-6">
                      Put this on your website or API docs to show your security posture. Links to a public report — no sensitive details exposed.
                    </p>

                    {/* Preview */}
                    <div className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center mb-6">
                      <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-3">Live Preview</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={badgeUrl} alt="Security Badge" style={{ display: "inline-block" }} />
                    </div>

                    {/* HTML Embed */}
                    <div className="mb-4">
                      <label className="block text-[12px] text-gray-400 mb-1.5">HTML Embed</label>
                      <div className="relative">
                        <textarea readOnly rows={3} value={embedSnippet}
                          className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[12px] text-cyan-400 font-mono focus:outline-none resize-none" />
                        <button onClick={copyEmbed}
                          className="absolute top-2 right-2 p-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] transition-colors">
                          {copied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <ClipboardDocumentIcon className="w-3.5 h-3.5 text-gray-400" />}
                        </button>
                      </div>
                    </div>

                    {/* Markdown */}
                    <div className="mb-4">
                      <label className="block text-[12px] text-gray-400 mb-1.5">Markdown (for README)</label>
                      <div className="relative">
                        <textarea readOnly rows={2} value={markdownSnippet}
                          className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[12px] text-cyan-400 font-mono focus:outline-none resize-none" />
                        <button onClick={() => { navigator.clipboard.writeText(markdownSnippet); flash("Copied"); }}
                          className="absolute top-2 right-2 p-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] transition-colors">
                          <ClipboardDocumentIcon className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                      <p className="text-[11px] text-cyan-400/80">
                        The badge links to a public report showing your overall score, last scan date, and compliance summary. No sensitive vulnerability details are exposed.
                      </p>
                    </div>
                  </Card>
                </div>
              )}

              {/* ─── Billing ─── */}
              {tab === "billing" && (
                <div className="space-y-6">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-[15px] font-semibold text-white">Current Plan</h3>
                        <p className="text-[12px] text-gray-500 mt-0.5">Manage your subscription</p>
                      </div>
                      <span className="px-3 py-1 text-[12px] font-semibold rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 capitalize">
                        {plan}
                      </span>
                    </div>

                    <div className="space-y-2 mb-6">
                      {[
                        "Unlimited security scans",
                        "All compliance frameworks (OWASP, PCI DSS, SOC 2, GDPR, HIPAA)",
                        "Scheduled scans (daily, weekly, every 6h)",
                        "Security policy engine with automated alerts",
                        "Slack, PagerDuty & webhook integrations",
                        "API Discovery scanner",
                        "Embeddable security badge",
                        "Weekly email reports",
                        "API key access for CI/CD",
                      ].map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-[12px] text-gray-400">
                          <CheckIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    <button className="px-4 py-2 rounded-lg text-[12px] font-medium bg-white/[0.06] text-gray-300 hover:bg-white/[0.1] border border-white/[0.06] transition-colors">
                      Manage Subscription
                    </button>
                  </Card>
                </div>
              )}

              {/* ─── Danger Zone ─── */}
              {tab === "danger" && (
                <Card className="p-6 border-red-500/20">
                  <h3 className="text-[15px] font-semibold text-red-400 mb-2">Danger Zone</h3>
                  <p className="text-[12px] text-gray-500 mb-6">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <button
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete your account? This cannot be undone.")) {
                        if (window.confirm("This will permanently delete all your scans, vulnerabilities, policies, and integrations. Type 'DELETE' to confirm.")) {
                          flash("Account deletion is not available in this version", false);
                        }
                      }
                    }}
                    className="px-4 py-2 rounded-lg text-[12px] font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                  >
                    Delete Account
                  </button>
                </Card>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div></FadeIn>
  );
}
