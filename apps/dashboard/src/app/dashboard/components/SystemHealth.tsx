"use client";

import { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Timeline, Badge } from "antd";
import {
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

interface HealthData {
  database: string;
  scanner: string;
  apis: string;
  alerts: number;
}

interface Alert {
  id: number;
  component: string;
  message: string;
  timestamp: string;
  severity: string;
}

export function SystemHealth() {
  const [health, setHealth] = useState<HealthData>({
    database: "unknown",
    scanner: "unknown",
    apis: "unknown",
    alerts: 0,
  });

  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch("/api/health");
        const data = await response.json();
        setHealth(data.health || {});
        setAlerts(data.alerts || []);
      } catch (error) {
        console.error("Failed to fetch health data:", error);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "healthy":
        return "#52c41a";
      case "degraded":
        return "#fa8c16";
      case "unhealthy":
        return "#ff4d4f";
      default:
        return "#d9d9d9";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case "degraded":
        return <WarningOutlined style={{ color: "#fa8c16" }} />;
      case "unhealthy":
        return <WarningOutlined style={{ color: "#ff4d4f" }} />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  return (
    <div>
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Database Status"
              value={health.database}
              prefix={getStatusIcon(health.database)}
              valueStyle={{ color: getStatusColor(health.database) }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Scanner Status"
              value={health.scanner}
              prefix={getStatusIcon(health.scanner)}
              valueStyle={{ color: getStatusColor(health.scanner) }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Active Alerts"
              value={health.alerts}
              prefix={<WarningOutlined />}
              valueStyle={{ color: health.alerts > 0 ? "#fa8c16" : "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      {alerts.length > 0 && (
        <Card title="Recent Alerts" className="mb-6">
          <Timeline>
            {alerts.map((alert) => (
              <Timeline.Item
                key={alert.id}
                dot={<WarningOutlined style={{ color: "#fa8c16" }} />}
              >
                <div>
                  <Badge status="warning" text={alert.component} />
                  <p>{alert.message}</p>
                  <small>{new Date(alert.timestamp).toLocaleString()}</small>
                </div>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      )}
    </div>
  );
}
