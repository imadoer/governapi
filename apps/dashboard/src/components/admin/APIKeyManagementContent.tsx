"use client";

import React, { useState, useEffect } from "react";
import { Table, Card, Button, Space, Typography, Tag, message } from "antd";
import { KeyOutlined, CopyOutlined } from "@ant-design/icons";
import AdminLayout from "./AdminLayout";

const { Title, Text } = Typography;

function APIKeyManagementContent() {
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState([]);

  useEffect(() => {
    loadRealAPIKeys();
  }, []);

  const loadRealAPIKeys = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/api-keys");
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.apiKeys);
      }
    } catch (error) {
      console.error("Failed to load API keys:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = (keyId: string) => {
    navigator.clipboard.writeText(keyId);
    message.success("API Key copied to clipboard");
  };

  const columns = [
    {
      title: "API Key",
      dataIndex: "id",
      key: "id",
      render: (id: string) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Text code style={{ fontFamily: "monospace" }}>
            {id}
          </Text>
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopyKey(id)}
          />
        </div>
      ),
    },
    {
      title: "Company",
      dataIndex: "company",
      key: "company",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "Active" ? "green" : "red"}>{status}</Tag>
      ),
    },
    {
      title: "Last Used",
      dataIndex: "lastUsed",
      key: "lastUsed",
    },
  ];

  return (
    <AdminLayout currentPage="api-keys">
      <div>
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>API Key Management</Title>
          <Text type="secondary">
            Live API keys from your customer database
          </Text>
        </div>

        <Card>
          <Table
            columns={columns}
            dataSource={apiKeys}
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>
    </AdminLayout>
  );
}

export default APIKeyManagementContent;
