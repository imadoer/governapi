"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPortal() {
  const router = useRouter();

  useEffect(() => {
    // Always redirect to login, let the layout handle auth
    router.push("/admin/login");
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1e293b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ color: "white" }}>Redirecting to admin login...</div>
    </div>
  );
}
