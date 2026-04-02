"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Spin } from "antd";

export default function AdminAuthGuard({ children }) {
  const router = useRouter();

  // Check authentication IMMEDIATELY during render, not in useEffect
  if (typeof window !== "undefined") {
    const authenticated = localStorage.getItem("admin_authenticated");

    if (!authenticated) {
      // Redirect immediately and show loading
      router.replace("/admin/login");
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
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Redirecting to admin login...</div>
          </div>
        </div>
      );
    }
  } else {
    // Server-side rendering - show loading
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
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading admin panel...</div>
        </div>
      </div>
    );
  }

  // Only render children if authenticated
  return children;
}
