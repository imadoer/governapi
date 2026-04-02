"use client";

import { Card, Row, Col, Statistic, Table, Tag } from "antd";
import { useState, useEffect } from "react";

export function BotDetection() {
  const [botData, setBotData] = useState({
    total_requests: 0,
    bot_requests_detected: 0,
    bots_blocked: 0,
    success_rate: 0,
    recent_bots: [],
  });

  useEffect(() => {
    const fetchBotData = async () => {
      try {
        const response = await fetch("/api/bot-detection");
        const data = await response.json();
        setBotData(data);
      } catch (error) {
        console.error("Failed to fetch bot data:", error);
      }
    };

    fetchBotData();
    const interval = setInterval(fetchBotData, 10000);
    return () => clearInterval(interval);
  }, []);

  const columns = [
    {
      title: "Time",
      dataIndex: "timestamp",
      render: (timestamp: string) => new Date(timestamp).toLocaleTimeString(),
    },
    { title: "IP", dataIndex: "ip" },
    {
      title: "User Agent",
      dataIndex: "user_agent",
      render: (ua: string) => (ua ? ua.substring(0, 50) + "..." : "N/A"),
    },
    {
      title: "Confidence",
      dataIndex: "confidence",
      render: (confidence: number) => `${confidence}%`,
    },
    {
      title: "Status",
      dataIndex: "blocked",
      render: (blocked: boolean) => (
        <Tag color={blocked ? "red" : "green"}>
          {blocked ? "BLOCKED" : "ALLOWED"}
        </Tag>
      ),
    },
  ];

  return (
    <Card title="Bot Detection Analytics">
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Statistic
            title="Total Requests"
            value={botData.total_requests}
            valueStyle={{ color: "#1890ff" }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Bot Requests Detected"
            value={botData.bot_requests_detected}
            valueStyle={{ color: "#fa8c16" }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Bots Blocked"
            value={botData.bots_blocked}
            valueStyle={{ color: "#f5222d" }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Success Rate"
            value={botData.success_rate}
            suffix="%"
            valueStyle={{
              color: botData.success_rate > 90 ? "#52c41a" : "#fa8c16",
            }}
          />
        </Col>
      </Row>

      <div style={{ marginTop: 24 }}>
        <h4>Recent Bot Activity</h4>
        {botData.recent_bots.length > 0 ? (
          <Table
            dataSource={botData.recent_bots}
            columns={columns}
            pagination={false}
            size="small"
          />
        ) : (
          <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>
            No bot activity detected. Route API traffic through /api/proxy to
            see real data.
          </div>
        )}
      </div>
    </Card>
  );
}
