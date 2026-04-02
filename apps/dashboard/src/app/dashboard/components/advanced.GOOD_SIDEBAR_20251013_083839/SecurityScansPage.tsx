"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PlayIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { Input, Select, Modal, message, Spin, Table, Tag } from "antd";

interface SecurityScan {
  id: string;
  target: string;
  scanType: string;
  status: "pending" | "running" | "completed" | "failed";
  securityScore: number | null;
  vulnerabilityCount: number;
  createdAt: string;
  completedAt: string | null;
  duration: number | null;
}

export function SecurityScansPage({ companyId }: { companyId: string }) {
  const [scans, setScans] = useState<SecurityScan[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewScanModalOpen, setIsNewScanModalOpen] = useState(false);
  const [newScanTarget, setNewScanTarget] = useState("");
  const [newScanType, setNewScanType] = useState("comprehensive");
  const [submitting, setSubmitting] = useState(false);

  const fetchScans = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/customer/security-scans?${params}`, {
        headers: { "x-tenant-id": companyId },
      });
      const data = await response.json();

      if (data.success) {
        setScans(data.securityScans || []);
        setStats(data.statistics || {});
      }
    } catch (error) {
      console.error("Failed to fetch scans:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) fetchScans();
  }, [companyId, statusFilter]);

  const handleNewScan = async () => {
    if (!newScanTarget.trim()) {
      message.error("Please enter a target URL");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/customer/security-scans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": companyId,
        },
        body: JSON.stringify({
          target: newScanTarget,
          scanType: newScanType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success("Security scan started!");
        setIsNewScanModalOpen(false);
        setNewScanTarget("");
        fetchScans();
      } else {
        message.error(data.error || "Failed to start scan");
      }
    } catch (error) {
      message.error("Failed to start scan");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: "Target",
      dataIndex: "target",
      key: "target",
      render: (text: string) => (
        <span className="font-mono text-cyan-400">{text || "N/A"}</span>
      ),
      filteredValue: searchTerm ? [searchTerm] : null,
      onFilter: (value: any, record: SecurityScan) =>
        record.target?.toLowerCase().includes(value.toLowerCase()) || false,
    },
    {
      title: "Scan Type",
      dataIndex: "scanType",
      key: "scanType",
      render: (type: string) => (
        <Tag color="blue">{type?.replace("_", " ").toUpperCase() || "N/A"}</Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const colors: any = {
          completed: "green",
          running: "blue",
          failed: "red",
          pending: "orange",
        };
        return (
          <Tag color={colors[status] || "default"}>
            {status?.toUpperCase() || "UNKNOWN"}
          </Tag>
        );
      },
    },
    {
      title: "Security Score",
      dataIndex: "securityScore",
      key: "securityScore",
      render: (score: number | null) => {
        if (score === null) return <span className="text-slate-500">--</span>;
        const color =
          score >= 90
            ? "#10b981"
            : score >= 75
              ? "#06b6d4"
              : score >= 60
                ? "#f59e0b"
                : "#ef4444";
        return (
          <span className="font-bold text-2xl" style={{ color }}>
            {score}
          </span>
        );
      },
      sorter: (a: SecurityScan, b: SecurityScan) =>
        (a.securityScore || 0) - (b.securityScore || 0),
    },
    {
      title: "Vulnerabilities",
      dataIndex: "vulnerabilityCount",
      key: "vulnerabilityCount",
      render: (count: number) => (
        <span
          className={count > 0 ? "text-red-500 font-bold" : "text-green-500"}
        >
          {count}
        </span>
      ),
      sorter: (a: SecurityScan, b: SecurityScan) =>
        a.vulnerabilityCount - b.vulnerabilityCount,
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
      render: (duration: number | null) =>
        duration ? `${duration}s` : <span className="text-slate-500">--</span>,
    },
    {
      title: "Started",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleString(),
      sorter: (a: SecurityScan, b: SecurityScan) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
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
      {/* Stats Bar */}
      <div className="flex items-center justify-between gap-4 bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
        <div className="flex items-center gap-8">
          <div>
            <p className="text-sm text-slate-400">Total Scans</p>
            <p className="text-3xl font-bold text-white">{stats?.total || 0}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Running</p>
            <p className="text-3xl font-bold text-blue-500">
              {stats?.running || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Completed</p>
            <p className="text-3xl font-bold text-green-500">
              {stats?.completed || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Avg Score</p>
            <p className="text-3xl font-bold text-cyan-400">
              {stats?.averageSecurityScore || "--"}
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Input
            prefix={<MagnifyingGlassIcon className="w-4 h-4 text-slate-400" />}
            placeholder="Search targets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-40"
            options={[
              { value: "all", label: "All Status" },
              { value: "pending", label: "Pending" },
              { value: "running", label: "Running" },
              { value: "completed", label: "Completed" },
              { value: "failed", label: "Failed" },
            ]}
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsNewScanModalOpen(true)}
          className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold flex items-center gap-2"
        >
          <PlayIcon className="w-5 h-5" />
          Start New Scan
        </motion.button>
      </div>

      {/* Data Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        <Table
          columns={columns}
          dataSource={scans}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          className="custom-table"
        />
      </div>

      {/* New Scan Modal */}
      <Modal
        title="Start New Security Scan"
        open={isNewScanModalOpen}
        onOk={handleNewScan}
        onCancel={() => setIsNewScanModalOpen(false)}
        confirmLoading={submitting}
        okText="Start Scan"
      >
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-2">Target URL</label>
            <Input
              placeholder="https://api.example.com"
              value={newScanTarget}
              onChange={(e) => setNewScanTarget(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Scan Type</label>
            <Select
              value={newScanType}
              onChange={setNewScanType}
              className="w-full"
              options={[
                { value: "quick", label: "Quick Scan (5-10 min)" },
                { value: "comprehensive", label: "Comprehensive (15-30 min)" },
                { value: "deep", label: "Deep Scan (30-60 min)" },
                { value: "owasp_top10", label: "OWASP Top 10 (20-40 min)" },
              ]}
            />
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        .custom-table .ant-table {
          background: transparent;
        }
        .custom-table .ant-table-thead > tr > th {
          background: #1e293b;
          color: #94a3b8;
          border-bottom: 1px solid #334155;
        }
        .custom-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #334155;
          background: transparent;
          color: #e2e8f0;
        }
        .custom-table .ant-table-tbody > tr:hover > td {
          background: #334155;
        }
      `}</style>
    </div>
  );
}
