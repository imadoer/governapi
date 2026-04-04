"use client";
import React, { useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { ArrowPathIcon, ArrowDownTrayIcon, ChevronDownIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { PageSkeleton } from "../PageSkeleton";

const fetcher = (url: string, tid: string) =>
  fetch(url, { headers: { "x-tenant-id": tid } }).then((r) => r.json());

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-slate-800/50 border border-white/[0.06] rounded-2xl ${className}`}>{children}</div>;
}

export function ComplianceHubPage({ company }: { company?: any }) {
  const tenantId = company?.id || "1";
  const [tab, setTab] = useState("overview");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: raw, mutate, isLoading } = useSWR(
    [`/api/customer/compliance-assessment`, tenantId],
    ([u, id]: [string, string]) => fetcher(u, id),
    { refreshInterval: 120_000 },
  );

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "frameworks", label: "Frameworks" },
    { key: "report", label: "Report" },
  ];

  if (isLoading) return <PageSkeleton />;

  const d = raw?.success ? raw : null;
  const frameworks = d?.frameworks ?? [];
  const summary = d?.summary ?? {};
  const hasData = d?.hasData ?? false;

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Compliance Hub</h1>
          <p className="text-sm text-gray-500 mt-1">Automated compliance assessment from real scan data</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => mutate()} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <LayoutGroup>
        <div className="flex gap-6 border-b border-white/[0.06] mb-10">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`relative pb-3 text-[13px] font-medium transition-colors ${tab === t.key ? "text-white" : "text-gray-500 hover:text-gray-300"}`}>
              {t.label}
              {tab === t.key && (
                <motion.div layoutId="comp-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }} />
              )}
            </button>
          ))}
        </div>
      </LayoutGroup>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ShieldCheckIcon className="w-10 h-10 text-gray-700 mb-4" />
          <p className="text-[15px] text-gray-400 mb-1">No compliance data yet</p>
          <p className="text-[13px] text-gray-600">Run a security scan to generate your compliance assessment</p>
        </div>
      ) : (
        <>
          {tab === "overview" && (
            <OverviewTab frameworks={frameworks} summary={summary} overallScore={d?.overallScore ?? 0} disclaimer={d?.disclaimer} />
          )}
          {tab === "frameworks" && (
            <FrameworksTab frameworks={frameworks} expanded={expanded} setExpanded={setExpanded} />
          )}
          {tab === "report" && (
            <ReportTab companyName={d?.companyName} frameworks={frameworks} overallScore={d?.overallScore} summary={summary} disclaimer={d?.disclaimer} assessedAt={d?.assessedAt} />
          )}
        </>
      )}
    </div>
  );
}

export default ComplianceHubPage;

/* ── Overview Tab ── */

function OverviewTab({ frameworks, summary, overallScore, disclaimer }: any) {
  return (
    <div className="space-y-8">
      {/* Score + Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-5 col-span-2 lg:col-span-1 flex flex-col items-center justify-center">
          <div className="text-[11px] text-gray-500 uppercase tracking-widest mb-3">Overall</div>
          <ScoreRing score={overallScore} size={90} />
        </Card>
        {[
          { label: "Frameworks", value: summary.totalFrameworks },
          { label: "Requirements", value: summary.totalRequirements },
          { label: "Passing", value: summary.totalPassing },
          { label: "Failing", value: summary.totalFailing },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className="text-[12px] text-gray-500 mb-2">{s.label}</div>
            <div className="text-2xl font-semibold text-white">{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Framework cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {frameworks.map((f: any) => (
          <Card key={f.id} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[14px] font-medium text-white">{f.shortName}</div>
                <div className="text-[11px] text-gray-600">{f.category}</div>
              </div>
              <ScoreRing score={f.score} size={48} fontSize={14} />
            </div>
            <div className="flex gap-4 text-[12px]">
              <span className="text-emerald-400">{f.passing} pass</span>
              <span className="text-red-400">{f.failing} fail</span>
              <span className="text-gray-600">{f.totalRequirements} total</span>
            </div>
            {/* Mini bar */}
            <div className="h-1.5 rounded-full bg-white/[0.04] mt-3 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${f.score}%` }} />
            </div>
          </Card>
        ))}
      </div>

      {/* Disclaimer */}
      {disclaimer && (
        <p className="text-[11px] text-gray-600 border-t border-white/[0.04] pt-4">{disclaimer}</p>
      )}
    </div>
  );
}

/* ── Frameworks Detail Tab ── */

function FrameworksTab({ frameworks, expanded, setExpanded }: any) {
  return (
    <div className="space-y-6">
      {frameworks.map((f: any) => (
        <Card key={f.id} className="overflow-hidden">
          <div className="p-5 border-b border-white/[0.04]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-medium text-white">{f.name}</h3>
                <p className="text-[12px] text-gray-500 mt-0.5">{f.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-semibold" style={{ color: f.score >= 70 ? "#10b981" : f.score >= 40 ? "#f59e0b" : "#ef4444" }}>{f.score}%</span>
              </div>
            </div>
          </div>
          <div>
            {f.requirements.map((req: any) => {
              const isOpen = expanded === `${f.id}-${req.id}`;
              return (
                <div key={req.id} className="border-b border-white/[0.03] last:border-0">
                  <button
                    onClick={() => setExpanded(isOpen ? null : `${f.id}-${req.id}`)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`shrink-0 text-[14px] ${req.status === "pass" ? "" : ""}`}>
                        {req.status === "pass" ? "✅" : req.status === "warn" ? "⚠️" : "❌"}
                      </span>
                      <div className="min-w-0">
                        <span className="text-[13px] text-white">{req.id} — {req.name}</span>
                        <div className="text-[11px] text-gray-600 truncate">{req.evidence}</div>
                      </div>
                    </div>
                    <ChevronDownIcon className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                        <div className="px-4 pb-4 pl-12 space-y-3">
                          <div>
                            <div className="text-[11px] font-medium text-gray-400 mb-1">What this requires</div>
                            <p className="text-[12px] text-gray-300">{req.description}</p>
                          </div>
                          <div>
                            <div className="text-[11px] font-medium text-gray-400 mb-1">Evidence from scan</div>
                            <p className="text-[12px] text-gray-300">{req.evidence}</p>
                          </div>
                          {req.status !== "pass" && (
                            <div>
                              <div className="text-[11px] font-medium text-gray-400 mb-1">How to fix</div>
                              <p className="text-[12px] text-gray-300">{req.remediation}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ── Report Tab ── */

function ReportTab({ companyName, frameworks, overallScore, summary, disclaimer, assessedAt }: any) {
  const generatePDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF();
    const now = new Date(assessedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    // Title
    doc.setFontSize(22);
    doc.setTextColor(6, 182, 212);
    doc.text("API Security Compliance Assessment", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Prepared for: ${companyName}`, 14, 30);
    doc.text(`Date: ${now}`, 14, 36);
    doc.text(`Prepared by: GovernAPI`, 14, 42);

    // Executive Summary
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Executive Summary", 14, 56);
    doc.setFontSize(10);
    doc.text(`Overall Compliance Score: ${overallScore}%`, 14, 64);
    doc.text(`Frameworks Assessed: ${summary.totalFrameworks}`, 14, 70);
    doc.text(`Requirements Passing: ${summary.totalPassing} of ${summary.totalRequirements}`, 14, 76);
    doc.text(`Requirements Failing: ${summary.totalFailing}`, 14, 82);

    let y = 96;

    // Framework-by-framework
    for (const f of frameworks) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(13);
      doc.setTextColor(0);
      doc.text(`${f.shortName} — ${f.score}%`, 14, y);
      y += 6;
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(f.description, 14, y);
      y += 8;

      (autoTable as any)(doc, {
        startY: y,
        head: [["Req", "Requirement", "Status", "Evidence"]],
        body: f.requirements.map((r: any) => [
          r.id,
          r.name,
          r.status.toUpperCase(),
          r.evidence.substring(0, 60),
        ]),
        theme: "grid",
        headStyles: { fillColor: [6, 182, 212], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        columnStyles: { 0: { cellWidth: 15 }, 2: { cellWidth: 18 } },
      });

      y = (doc as any).lastAutoTable.finalY + 12;
    }

    // Disclaimer
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("DISCLAIMER", 14, y);
    y += 5;
    const lines = doc.splitTextToSize(disclaimer, 180);
    doc.text(lines, 14, y);

    // Footer on all pages
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(180);
      doc.text(`GovernAPI Compliance Assessment — Page ${i}/${pages}`, 105, 290, { align: "center" });
    }

    doc.save(`Compliance-Assessment-${companyName}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[14px] font-medium text-white">Compliance Assessment Report</h3>
            <p className="text-[12px] text-gray-500 mt-0.5">Professional PDF with framework breakdown, evidence, and remediation roadmap</p>
          </div>
          <button onClick={generatePDF}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white text-black hover:bg-gray-200 transition-colors flex items-center gap-1.5">
            <ArrowDownTrayIcon className="w-3.5 h-3.5" /> Download PDF
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[12px]">
          <div><span className="text-gray-500">Company:</span> <span className="text-white ml-1">{companyName}</span></div>
          <div><span className="text-gray-500">Score:</span> <span className="text-white ml-1">{overallScore}%</span></div>
          <div><span className="text-gray-500">Frameworks:</span> <span className="text-white ml-1">{summary.totalFrameworks}</span></div>
          <div><span className="text-gray-500">Date:</span> <span className="text-white ml-1">{new Date(assessedAt).toLocaleDateString()}</span></div>
        </div>
      </Card>

      {/* Preview */}
      {frameworks.map((f: any) => (
        <Card key={f.id} className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-medium text-white">{f.shortName} — {f.score}%</h3>
            <span className="text-[11px] text-gray-600">{f.passing}/{f.totalRequirements} passing</span>
          </div>
          <div className="space-y-1">
            {f.requirements.map((r: any) => (
              <div key={r.id} className="flex items-center gap-2 text-[12px] py-1">
                <span>{r.status === "pass" ? "✅" : r.status === "warn" ? "⚠️" : "❌"}</span>
                <span className="text-gray-400">{r.id}</span>
                <span className="text-white">{r.name}</span>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {disclaimer && (
        <p className="text-[11px] text-gray-600 border-t border-white/[0.04] pt-4">{disclaimer}</p>
      )}
    </div>
  );
}

/* ── Score Ring ── */

function ScoreRing({ score, size = 80, fontSize = 18 }: { score: number; size?: number; fontSize?: number }) {
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  const r = size * 0.4;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - Math.min(score, 100) / 100);
  const vb = size;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${vb} ${vb}`} className="w-full h-full -rotate-90">
        <circle cx={vb / 2} cy={vb / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle cx={vb / 2} cy={vb / 2} r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ fontSize, color: "white" }} className="font-semibold">{score}%</span>
      </div>
    </div>
  );
}
