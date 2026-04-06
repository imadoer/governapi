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
  UsersIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-slate-800/50 border border-white/[0.06] rounded-2xl ${className}`}>{children}</div>;
}

const TABS = [
  { key: "profile", label: "Profile", icon: UserCircleIcon },
  { key: "team", label: "Team", icon: UsersIcon },
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

  // Team state
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [inviting, setInviting] = useState(false);

  // Notification state
  const [weeklyReport, setWeeklyReport] = useState(true);

  // Billing state
  const [plan, setPlan] = useState("free");
  const [annual, setAnnual] = useState(false);

  const flash = (text: string, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, profileRes, teamRes] = await Promise.all([
        fetch("/api/customer/enterprise-settings", { headers: { "x-tenant-id": companyId, ...(typeof window !== "undefined" && sessionStorage.getItem("sessionToken") ? { "Authorization": `Bearer ${sessionStorage.getItem("sessionToken")}` } : {}) }, credentials: "include" }),
        fetch("/api/auth/session", { credentials: "include" }),
        fetch("/api/customer/team", { headers: { "x-tenant-id": companyId, ...(typeof window !== "undefined" && sessionStorage.getItem("sessionToken") ? { "Authorization": `Bearer ${sessionStorage.getItem("sessionToken")}` } : {}) }, credentials: "include" }),
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
      const teamData = await teamRes.json().catch(() => ({}));
      if (teamData.success) setTeamMembers(teamData.members || []);
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
        headers: { "Content-Type": "application/json", "x-tenant-id": companyId, ...(typeof window !== "undefined" && sessionStorage.getItem("sessionToken") ? { "Authorization": `Bearer ${sessionStorage.getItem("sessionToken")}` } : {}) },
        credentials: "include",
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
        headers: { "Content-Type": "application/json", "x-tenant-id": companyId, ...(typeof window !== "undefined" && sessionStorage.getItem("sessionToken") ? { "Authorization": `Bearer ${sessionStorage.getItem("sessionToken")}` } : {}) },
        credentials: "include",
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

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    try {
      const r = await fetch("/api/customer/team", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": companyId, ...(typeof window !== "undefined" && sessionStorage.getItem("sessionToken") ? { "Authorization": `Bearer ${sessionStorage.getItem("sessionToken")}` } : {}) },
        credentials: "include",
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const d = await r.json();
      if (d.success) {
        flash("Invite sent");
        setInviteModal(false);
        setInviteEmail("");
        setInviteRole("viewer");
        fetchSettings();
      } else flash(d.error || "Failed", false);
    } catch { flash("Failed to invite", false); }
    setInviting(false);
  };

  const handleRemoveMember = async (id: number) => {
    try {
      await fetch(`/api/customer/team?id=${id}`, { method: "DELETE", headers: { "x-tenant-id": companyId, ...(typeof window !== "undefined" && sessionStorage.getItem("sessionToken") ? { "Authorization": `Bearer ${sessionStorage.getItem("sessionToken")}` } : {}) }, credentials: "include" });
      flash("Member removed");
      setTeamMembers((prev) => prev.filter((m) => m.id !== id));
    } catch { flash("Failed to remove", false); }
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

              {/* ─── Team ─── */}
              {tab === "team" && (
                <div className="space-y-6">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-[15px] font-semibold text-white">Team Members</h3>
                        <p className="text-[12px] text-gray-500 mt-0.5">{teamMembers.length + 1} member{teamMembers.length !== 0 ? "s" : ""} (including you)</p>
                      </div>
                      <button onClick={() => setInviteModal(true)}
                        className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white text-black hover:bg-gray-200 transition-colors flex items-center gap-1.5">
                        <PlusIcon className="w-3.5 h-3.5" /> Invite Member
                      </button>
                    </div>

                    {/* You (owner) */}
                    <div className="flex items-center justify-between py-3 px-3 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-[12px] font-bold text-cyan-400">
                          {(email || "U")[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[13px] text-white font-medium">{email || "You"}</div>
                          <div className="text-[11px] text-gray-500">Account owner</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-cyan-500/15 text-cyan-400">Admin</span>
                    </div>

                    {/* Team members */}
                    {teamMembers.map((m) => (
                      <div key={m.id} className="flex items-center justify-between py-3 px-3 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-[12px] font-bold text-gray-400">
                            {m.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-[13px] text-white font-medium">{m.email}</div>
                            <div className="text-[11px] text-gray-500">
                              {m.status === "pending" ? "Pending invite" : "Active"} · {m.role}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                            m.role === "admin" ? "bg-cyan-500/15 text-cyan-400" :
                            m.role === "editor" ? "bg-amber-500/15 text-amber-400" :
                            "bg-gray-500/15 text-gray-400"
                          }`}>{m.role}</span>
                          <button onClick={() => handleRemoveMember(m.id)} className="p-1 text-gray-600 hover:text-red-400 transition-colors">
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {teamMembers.length === 0 && (
                      <div className="text-center py-6 text-[12px] text-gray-600">
                        No team members yet. Invite your first team member.
                      </div>
                    )}
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-[15px] font-semibold text-white mb-4">Roles</h3>
                    <div className="space-y-3">
                      {[
                        { role: "Admin", desc: "Full access — manage team, billing, and all settings", color: "text-cyan-400" },
                        { role: "Editor", desc: "Can scan, manage APIs, view reports — can't manage billing or delete account", color: "text-amber-400" },
                        { role: "Viewer", desc: "Read-only — view dashboards and reports, can't scan or change anything", color: "text-gray-400" },
                      ].map((r) => (
                        <div key={r.role} className="flex items-start gap-3 text-[12px]">
                          <span className={`font-medium ${r.color} w-12`}>{r.role}</span>
                          <span className="text-gray-500">{r.desc}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Invite Modal */}
                  <AnimatePresence>
                    {inviteModal && (
                      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setInviteModal(false)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }}
                          className="relative z-10 bg-[#111318] rounded-2xl border border-white/[0.06] shadow-2xl w-[420px] max-w-[92vw]">
                          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                            <h3 className="text-[15px] font-semibold text-white">Invite Team Member</h3>
                            <button onClick={() => setInviteModal(false)} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="px-6 py-5 space-y-4">
                            <div>
                              <label className="block text-[12px] text-gray-400 mb-1.5">Email</label>
                              <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@company.com"
                                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[13px] text-white placeholder-gray-600 focus:outline-none focus:border-white/[0.12]" />
                            </div>
                            <div>
                              <label className="block text-[12px] text-gray-400 mb-1.5">Role</label>
                              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[13px] text-white focus:outline-none appearance-none cursor-pointer">
                                <option value="admin">Admin — Full access</option>
                                <option value="editor">Editor — Can scan and manage APIs</option>
                                <option value="viewer">Viewer — Read-only access</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
                            <button onClick={() => setInviteModal(false)} className="px-3 py-1.5 rounded-lg text-[12px] text-gray-400 hover:bg-white/5 transition-colors">Cancel</button>
                            <button onClick={handleInvite} disabled={inviting || !inviteEmail}
                              className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50">
                              {inviting ? "Inviting..." : "Send Invite"}
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
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
                  {/* Annual toggle */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold text-white">Plans & Pricing</h3>
                    <div className="flex items-center gap-2 text-[12px]">
                      <span className={!annual ? "text-white" : "text-gray-500"}>Monthly</span>
                      <button onClick={() => setAnnual(!annual)}
                        className={`relative w-10 rounded-full transition-colors ${annual ? "bg-emerald-500" : "bg-gray-700"}`} style={{ height: 22 }}>
                        <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform ${annual ? "left-[20px]" : "left-[3px]"}`} />
                      </button>
                      <span className={annual ? "text-white" : "text-gray-500"}>Annual <span className="text-emerald-400 text-[10px]">Save 17%</span></span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { id: "free", name: "Free", price: 0, annual: 0, features: [
                        "1 API endpoint", "3 scans/month", "Quick scan only", "Vulnerability list", "Basic security headers check"
                      ], missing: ["Fix guides", "Compliance reports", "Scheduled scans", "AI Advisor", "CI/CD", "Team members"] },
                      { id: "starter", name: "Starter", price: 19, annual: 190, features: [
                        "5 API endpoints", "Unlimited quick scans", "5 full scans/week", "Fix guides with code", "OWASP compliance", "Slack notifications", "Security badge", "Weekly email reports"
                      ], missing: ["AI Advisor", "CI/CD integration", "Team members", "Scheduled scans"] },
                      { id: "professional", name: "Professional", price: 49, annual: 490, features: [
                        "Unlimited endpoints", "Unlimited scans", "Scheduled scans", "All 5 compliance frameworks", "PDF export", "AI Security Advisor (20/day)", "CI/CD integration", "5 team members", "Security policies", "API keys", "Custom webhooks"
                      ], missing: [] },
                    ].map((tier) => {
                      const isCurrent = plan === tier.id;
                      const displayPrice = annual ? Math.round(tier.annual / 12) : tier.price;
                      return (
                        <Card key={tier.id} className={`p-5 ${isCurrent ? "border-cyan-500/30 ring-1 ring-cyan-500/20" : ""}`}>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[14px] font-semibold text-white">{tier.name}</h4>
                            {isCurrent && <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">Current</span>}
                          </div>
                          <div className="mb-4">
                            <span className="text-2xl font-bold text-white">${displayPrice}</span>
                            <span className="text-[12px] text-gray-500">{tier.price > 0 ? "/mo" : ""}</span>
                            {annual && tier.annual > 0 && <div className="text-[10px] text-gray-600">${tier.annual}/year billed annually</div>}
                          </div>
                          <div className="space-y-1.5 mb-4">
                            {tier.features.map((f) => (
                              <div key={f} className="flex items-start gap-2 text-[11px] text-gray-400">
                                <CheckIcon className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />{f}
                              </div>
                            ))}
                            {tier.missing.map((f) => (
                              <div key={f} className="flex items-start gap-2 text-[11px] text-gray-600">
                                <span className="w-3 text-center shrink-0">—</span>{f}
                              </div>
                            ))}
                          </div>
                          {!isCurrent ? (
                            <button className="w-full py-2 rounded-lg text-[12px] font-medium bg-white/[0.06] text-gray-300 hover:bg-white/[0.1] border border-white/[0.06] transition-colors">
                              {tier.price > (plan === "free" ? 0 : plan === "starter" ? 19 : 49) ? "Upgrade" : "Downgrade"}
                            </button>
                          ) : (
                            <button className="w-full py-2 rounded-lg text-[12px] font-medium bg-white/[0.04] text-gray-600 border border-white/[0.04] cursor-default">
                              Current Plan
                            </button>
                          )}
                        </Card>
                      );
                    })}
                  </div>
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
