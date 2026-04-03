"use client";

import { useState, useRef } from "react";

export function ImportMenu() {
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenAPIImport = async (file: File) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/import/openapi", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        console.log(`Imported ${data.imported} APIs successfully`);
      } else {
        console.log("Import failed");
      }
    } catch (error) {
      console.log("Failed to import OpenAPI spec");
    } finally {
      setLoading(false);
      setMenuOpen(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleOpenAPIImport(file);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        disabled={loading}
        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        {loading && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />}
        Import APIs
      </button>

      {menuOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 rounded-lg bg-[#0a0a0f] border border-white/10 shadow-xl z-50 overflow-hidden">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 transition-colors"
          >
            Import OpenAPI/Swagger
          </button>
          <button
            disabled
            className="w-full text-left px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
          >
            Import from Postman
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.yaml,.yml"
        onChange={handleFileChange}
        className="hidden"
      />

      {menuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
      )}
    </div>
  );
}
