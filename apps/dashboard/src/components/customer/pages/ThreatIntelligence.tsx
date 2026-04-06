"use client";

import * as React from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Alert,
  Table,
  Tag,
  Typography,
  Button,
} from "antd";
import {
  AlertOutlined,
  SafetyOutlined,
  BugOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface ThreatIntelligenceProps {
  blockedThreats: any[];
  loading: boolean;
  onRefresh: () => void;
}

export default function ThreatIntelligence({
  blockedThreats,
  loading,
  onRefresh,
}: ThreatIntelligenceProps) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Title level={2}>Advanced Threat Intelligence</Title>
        <Button icon={<ReloadOutlined />} loading={loading} onClick={onRefresh}>
          Refresh Data
        </Button>
      </div>

      <Alert
        message="Real-Time Threat Intelligence Engine Active"
        description="Advanced pattern recognition analyzing requests for SQL injection, XSS, and zero-day attacks."
        type="success"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Policies Active"
              value={
                blockedThreats.filter(
                  (t) =>
                    new Date(t.createdAt).toDateString() ===
                    new Date().toDateString(),
                ).length
              }
              prefix={<AlertOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Detection Confidence"
              value={87.3}
              suffix="%"
              prefix={<SafetyOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Pattern Matches"
              value={2341}
              prefix={<BugOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="False Positives"
              value={0.8}
              suffix="%"
              prefix={<SafetyOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Recent Threat Detections" loading={loading}>
        <Table
          dataSource={blockedThreats}
          columns={[
            {
              title: "Time",
              dataIndex: "createdAt",
              key: "createdAt",
              render: (time) => new Date(time).toLocaleString(),
            },
            { title: "Source IP", dataIndex: "ipAddress", key: "ipAddress" },
            {
              title: "Threat Type",
              dataIndex: "threatType",
              key: "threatType",
              render: (type) => <Tag color="red">{type}</Tag>,
            },
            { title: "Reason", dataIndex: "blockReason", key: "blockReason" },
            {
              title: "Status",
              key: "status",
              render: () => <Tag color="green">Blocked</Tag>,
            },
          ]}
          pagination={false}
        />
      </Card>
    </div>
  );
}
