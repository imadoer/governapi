"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { handleAddAPI } from "../actions";

export function AddAPIModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [type, setType] = useState("REST");
  const [environment, setEnvironment] = useState("production");
  const [description, setDescription] = useState("");

  const resetForm = () => {
    setName("");
    setEndpoint("");
    setType("REST");
    setEnvironment("production");
    setDescription("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !endpoint) return;

    try {
      await handleAddAPI({ name, endpoint, type, environment, description });
      resetForm();
      onClose();
    } catch (error) {
      // Error handled in action
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => { resetForm(); onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-[#0a0a0f] border border-white/10 p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Add New API</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">API Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., User Service API"
                  required
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Endpoint URL</label>
                <input
                  type="url"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="https://api.example.com"
                  required
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">API Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
                >
                  <option value="REST" className="bg-[#0a0a0f]">REST</option>
                  <option value="GraphQL" className="bg-[#0a0a0f]">GraphQL</option>
                  <option value="SOAP" className="bg-[#0a0a0f]">SOAP</option>
                  <option value="gRPC" className="bg-[#0a0a0f]">gRPC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Environment</label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
                >
                  <option value="production" className="bg-[#0a0a0f]">Production</option>
                  <option value="staging" className="bg-[#0a0a0f]">Staging</option>
                  <option value="development" className="bg-[#0a0a0f]">Development</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={3}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Add API
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
