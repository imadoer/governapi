"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("admin_authenticated");
    if (!isAuthenticated) {
      router.replace("/admin/login");
    } else {
      setAuthenticated(true);
    }
    setChecking(false);
  }, [router]);

  if (checking || !authenticated) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "#1e293b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}
      >
        <div style={{ textAlign: "center", color: "white" }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto" />
          <div style={{ marginTop: 16 }}>
            {checking ? "Loading admin panel..." : "Redirecting to admin login..."}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
