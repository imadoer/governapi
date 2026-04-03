"use client";
import { useState, useEffect } from "react";

export default function DashboardTest() {
  const [status, setStatus] = useState("Loading...");
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      console.log("Test component mounted");
      const key = sessionStorage.getItem("apiKey");
      const user = sessionStorage.getItem("user");

      setApiKey(key);
      setStatus(
        `API Key: ${key ? "Found" : "Not found"}, User: ${user ? "Found" : "Not found"}`,
      );

      console.log("SessionStorage check:", { key, user });
    } catch (error) {
      console.error("Test component error:", error);
      setStatus(`Error: ${error}`);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-8">
      <div className="bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Dashboard Debug Test</h3>
        <p className="text-slate-300">{status}</p>
        <p className="text-slate-400 text-sm mt-2">Check console for detailed logs</p>
      </div>
    </div>
  );
}
