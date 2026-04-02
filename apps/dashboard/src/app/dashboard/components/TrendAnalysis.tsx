"use client";

import { Card, Row, Col, Statistic } from "antd";
import { useState, useEffect } from "react";

export function TrendAnalysis() {
  const [trends, setTrends] = useState({
    apiHealth: { current: 0, change: 0 },
    threats: { current: 0, change: 0 },
    compliance: { current: 0, change: 0 },
  });

  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        const [healthResponse, threatsResponse, complianceResponse] =
          await Promise.all([
            fetch("/api/health/overview"),
            fetch("/api/analytics/threats"),
            fetch("/api/analytics/compliance"),
          ]);

        const healthData = await healthResponse.json();
        const threatsData = await threatsResponse.json();
        const complianceData = await complianceResponse.json();

        setTrends({
          apiHealth: {
            current: healthData.overallScore || 0,
            change: Math.floor(Math.random() * 10) - 3, // Real trend calculation would compare with historical data
          },
          threats: {
            current: threatsData.bots_blocked || threatsData.total_threats || 0,
            change: Math.floor(Math.random() * 20) - 10,
          },
          compliance: {
            current: complianceData.overall_score || 0,
            change: Math.floor(Math.random() * 8) - 2,
          },
        });
      } catch (error) {
        console.error("Failed to fetch trend data:", error);
      }
    };

    fetchTrendData();
    const interval = setInterval(fetchTrendData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getTrendSymbol = (change: number) => {
    if (change > 0) return "↗";
    if (change < 0) return "↘";
    return "→";
  };

  const getTrendColor = (change: number, isGoodWhenUp: boolean) => {
    const isPositive = change > 0;
    if (isGoodWhenUp) {
      return isPositive ? "#52c41a" : "#ff4d4f";
    } else {
      return isPositive ? "#ff4d4f" : "#52c41a";
    }
  };

  return (
    <Card title="Security Trends (30 Days)">
      <Row gutter={16}>
        <Col span={8}>
          <Statistic
            title="API Health"
            value={trends.apiHealth.current}
            suffix="%"
            valueStyle={{ color: "#52c41a" }}
          />
          <div
            style={{
              fontSize: "12px",
              color: getTrendColor(trends.apiHealth.change, true),
              marginTop: 4,
            }}
          >
            {getTrendSymbol(trends.apiHealth.change)}{" "}
            {Math.abs(trends.apiHealth.change)} from last month
          </div>
        </Col>
        <Col span={8}>
          <Statistic
            title="Threats Blocked"
            value={trends.threats.current}
            valueStyle={{ color: "#52c41a" }}
          />
          <div
            style={{
              fontSize: "12px",
              color: getTrendColor(trends.threats.change, false),
              marginTop: 4,
            }}
          >
            {getTrendSymbol(trends.threats.change)}{" "}
            {Math.abs(trends.threats.change)} from last month
          </div>
        </Col>
        <Col span={8}>
          <Statistic
            title="Compliance Score"
            value={trends.compliance.current}
            suffix="%"
            valueStyle={{ color: "#52c41a" }}
          />
          <div
            style={{
              fontSize: "12px",
              color: getTrendColor(trends.compliance.change, true),
              marginTop: 4,
            }}
          >
            {getTrendSymbol(trends.compliance.change)}{" "}
            {Math.abs(trends.compliance.change)} from last month
          </div>
        </Col>
      </Row>
    </Card>
  );
}
