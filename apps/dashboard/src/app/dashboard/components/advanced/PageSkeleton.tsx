"use client";

/** Shared loading skeleton for dashboard pages. */
export function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-700/30 rounded-xl ${className}`} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Sk className="h-7 w-48 mb-2" />
        <Sk className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-800/50 border border-white/[0.06] rounded-2xl p-5 space-y-3">
            <Sk className="h-3 w-20" />
            <Sk className="h-7 w-16" />
          </div>
        ))}
      </div>
      <div className="bg-slate-800/50 border border-white/[0.06] rounded-2xl p-6 space-y-3">
        <Sk className="h-3 w-32" />
        <Sk className="h-48" />
      </div>
    </div>
  );
}

/** Smooth fade-in when data arrives. Wraps page content after skeleton. */
import { useEffect, useState } from "react";

export function FadeIn({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(true); }, []);
  return (
    <div
      className="transition-opacity duration-200 ease-out"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {children}
    </div>
  );
}
