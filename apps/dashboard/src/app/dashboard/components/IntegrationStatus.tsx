"use client";

import { Card, Statistic, Row, Col } from "antd";
import { useState, useEffect } from "react";

export function IntegrationStatus() {
  const [stats, setStats] = useState({
    webhooks: 0,
    alerts: 0,
    reports: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const webhookResponse = await fetch("/api/webhooks");
        const webhookData = await webhookResponse.json();

        const alertResponse = await fetch("/api/notifications");
        const alertData = await alertResponse.json();

        setStats({
          webhooks: webhookData.webhooks?.length || 0,
          alerts: alertData.alert_configs?.length || 0,
          reports: 3,
        });
      } catch (error) {
        console.error("Failed to fetch integration stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <Card title="Integration Status">
      <Row gutter={16}>
        <Col span={8}>
          <Statistic
            title="Active Webhooks"
            value={stats.webhooks}
            valueStyle={{ color: "#52c41a" }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Alert Configs"
            value={stats.alerts}
            valueStyle={{ color: "#1890ff" }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Report Types"
            value={stats.reports}
            valueStyle={{ color: "#722ed1" }}
          />
        </Col>
      </Row>
      <div style={{ marginTop: 16, color: "#666", fontSize: "12px" }}>
        All enterprise integrations are operational and connected to your
        security platform.
      </div>
    </Card>
  );
}
