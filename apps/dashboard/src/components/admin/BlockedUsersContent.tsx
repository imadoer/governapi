"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Button,
  Typography,
  Tag,
  Modal,
  message,
  Input,
  Alert,
} from "antd";
import { SecurityScanOutlined, UnlockOutlined } from "@ant-design/icons";
import AdminLayout from "./AdminLayout";

const { Title, Text } = Typography;
const { Search } = Input;

function BlockedUsersContent() {
  const [loading, setLoading] = useState(true);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);

  useEffect(() => {
    loadRealBlockedUsers();
  }, []);

  const loadRealBlockedUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/blocked-users");
      if (response.ok) {
        const data = await response.json();
        setBlockedUsers(data.blockedUsers);
      }
    } catch (error) {
      console.error("Failed to load blocked users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = (record: any) => {
    Modal.confirm({
      title: "Unblock IP Address",
      content: `Are you sure you want to unblock ${record.ipAddress}?`,
      onOk: async () => {
        try {
          const response = await fetch("/api/admin/blocked-users/unblock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: record.key }),
          });

          if (response.ok) {
            message.success(`${record.ipAddress} has been unblocked`);
            loadRealBlockedUsers();
          }
        } catch (error) {
          message.error("Failed to unblock user");
        }
      },
    });
  };

  const columns = [
    {
      title: "IP Address",
      dataIndex: "ipAddress",
      key: "ipAddress",
      render: (ip: string) => <Text code>{ip}</Text>,
    },
    {
      title: "Company",
      dataIndex: "company",
      key: "company",
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      width: 250,
    },
    {
      title: "Severity",
      dataIndex: "severity",
      key: "severity",
      render: (severity: string) => (
        <Tag
          color={
            severity === "Critical"
              ? "red"
              : severity === "High"
                ? "orange"
                : severity === "Medium"
                  ? "yellow"
                  : "green"
          }
        >
          {severity}
        </Tag>
      ),
    },
    {
      title: "Attempts",
      dataIndex: "attempts",
      key: "attempts",
      render: (attempts: number) => attempts?.toLocaleString(),
    },
    {
      title: "Blocked Date",
      dataIndex: "blockedDate",
      key: "blockedDate",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Button
          size="small"
          icon={<UnlockOutlined />}
          onClick={() => handleUnblock(record)}
        >
          Unblock
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout currentPage="blocked-users">
      <div>
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>Blocked Users</Title>
          <Text type="secondary">
            Real security incidents and blocked IP addresses from threat
            detection system
          </Text>
        </div>

        <Alert
          message="Live Security Monitoring"
          description="Blocked users are automatically detected and managed by the threat detection system."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Card>
          <Table
            columns={columns}
            dataSource={blockedUsers}
            loading={loading}
            pagination={{
              total: blockedUsers.length,
              pageSize: 10,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} blocked users`,
            }}
            rowKey="key"
          />
        </Card>
      </div>
    </AdminLayout>
  );
}

export default BlockedUsersContent;
