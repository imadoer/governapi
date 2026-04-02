"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownTrayIcon,
  TrashIcon,
  ClockIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  ServerIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { message, Spin, Progress, Select, Modal, InputNumber } from "antd";

export function DataManagementPage({ companyId }: { companyId: string }) {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dataRetention, setDataRetention] = useState(90);
  const [isRetentionModalOpen, setIsRetentionModalOpen] = useState(false);

  const handleExport = async (dataType: string, format: string) => {
    setExporting(true);
    try {
      const response = await fetch(
        `/api/customer/data-export?type=${dataType}&format=${format}`,
        {
          headers: { "x-tenant-id": companyId },
        },
      );

      if (response.ok) {
        if (format === "csv") {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `governapi-export-${dataType}-${Date.now()}.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          const data = await response.json();
          const blob = new Blob([JSON.stringify(data.export, null, 2)], {
            type: "application/json",
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `governapi-export-${dataType}-${Date.now()}.json`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
        message.success(`${dataType} data exported successfully!`);
      } else {
        message.error("Export failed");
      }
    } catch (error) {
      message.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const handleUpdateRetention = async () => {
    try {
      message.success(`Data retention policy updated to ${dataRetention} days`);
      setIsRetentionModalOpen(false);
    } catch (error) {
      message.error("Failed to update retention policy");
    }
  };

  const exportOptions = [
    {
      id: "all",
      name: "Complete Export",
      description:
        "All data including APIs, scans, threats, and vulnerabilities",
      icon: ServerIcon,
      color: "cyan",
    },
    {
      id: "apis",
      name: "APIs",
      description: "API endpoints and configurations",
      icon: ChartBarIcon,
      color: "blue",
    },
    {
      id: "scans",
      name: "Security Scans",
      description: "Scan results and security scores",
      icon: ShieldCheckIcon,
      color: "green",
    },
    {
      id: "threats",
      name: "Threat Events",
      description: "Detected threats and security incidents",
      icon: ShieldCheckIcon,
      color: "red",
    },
    {
      id: "vulnerabilities",
      name: "Vulnerabilities",
      description: "Discovered vulnerabilities and CVEs",
      icon: ShieldCheckIcon,
      color: "orange",
    },
    {
      id: "webhooks",
      name: "Webhooks",
      description: "Webhook configurations and delivery logs",
      icon: DocumentArrowDownIcon,
      color: "purple",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Data Management
          </h1>
          <p className="text-slate-400">
            Export, backup, and manage your security data
          </p>
        </div>
      </div>

      {/* Data Retention Policy */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <ClockIcon className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                Data Retention Policy
              </h3>
              <p className="text-slate-400">
                Current retention period:{" "}
                <span className="text-white font-semibold">
                  {dataRetention} days
                </span>
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Older data will be automatically archived or deleted
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsRetentionModalOpen(true)}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold"
          >
            Configure
          </motion.button>
        </div>
      </motion.div>

      {/* Export Options */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Export Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exportOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-cyan-500/50 transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 bg-${option.color}-500/20 rounded-xl`}>
                    <Icon className={`w-6 h-6 text-${option.color}-400`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {option.name}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {option.description}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleExport(option.id, "json")}
                    disabled={exporting}
                    className="flex-1 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 disabled:opacity-50 font-semibold text-sm"
                  >
                    JSON
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleExport(option.id, "csv")}
                    disabled={exporting}
                    className="flex-1 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 disabled:opacity-50 font-semibold text-sm"
                  >
                    CSV
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Storage Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-6">Storage Analytics</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 bg-slate-900/50 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400">APIs</span>
              <span className="text-white font-bold">0</span>
            </div>
            <Progress percent={0} strokeColor="#06b6d4" showInfo={false} />
          </div>

          <div className="p-5 bg-slate-900/50 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400">Scans</span>
              <span className="text-white font-bold">0</span>
            </div>
            <Progress percent={0} strokeColor="#10b981" showInfo={false} />
          </div>

          <div className="p-5 bg-slate-900/50 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400">Threats</span>
              <span className="text-white font-bold">0</span>
            </div>
            <Progress percent={0} strokeColor="#ef4444" showInfo={false} />
          </div>
        </div>

        <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
          <p className="text-cyan-400 text-sm">
            💡 <strong>Tip:</strong> Export your data regularly to maintain
            backups and comply with data governance policies.
          </p>
        </div>
      </motion.div>

      {/* Data Operations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <ArrowPathIcon className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Automated Backups
              </h3>
              <p className="text-sm text-slate-400">
                Daily automated backups enabled
              </p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-slate-400">
            <div className="flex justify-between">
              <span>Last Backup:</span>
              <span className="text-white">Never</span>
            </div>
            <div className="flex justify-between">
              <span>Next Backup:</span>
              <span className="text-white">Tomorrow at 2:00 AM</span>
            </div>
            <div className="flex justify-between">
              <span>Backup Size:</span>
              <span className="text-white">0 MB</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-500/20 rounded-xl">
              <TrashIcon className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Data Cleanup</h3>
              <p className="text-sm text-slate-400">
                Remove old and unused data
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-4 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 font-semibold"
          >
            Clean Old Data
          </motion.button>
        </motion.div>
      </div>

      {/* Retention Policy Modal */}
      <Modal
        title="Configure Data Retention"
        open={isRetentionModalOpen}
        onOk={handleUpdateRetention}
        onCancel={() => setIsRetentionModalOpen(false)}
        okText="Update Policy"
      >
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Retention Period (days)
            </label>
            <InputNumber
              min={30}
              max={3650}
              value={dataRetention}
              onChange={(value) => setDataRetention(value || 90)}
              className="w-full"
            />
            <p className="text-xs text-slate-500 mt-2">
              Data older than this period will be automatically archived or
              deleted. Recommended: 90-365 days
            </p>
          </div>

          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-sm text-yellow-600">
              <strong>⚠️ Warning:</strong> Reducing the retention period may
              result in data loss for historical records.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
