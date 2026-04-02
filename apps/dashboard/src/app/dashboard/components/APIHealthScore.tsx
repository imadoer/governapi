"use client";

import { useState, useEffect } from "react";
import { Card, Progress, Row, Col } from "antd";

export function APIHealthScore() {
  const [healthData, setHealthData] = useState({
    overallScore: 0,
    apis: [] as any[],
  });

  useEffect(() => {
    const fetchRealHealthData = async () => {
      try {
        const response = await fetch("/api/health/overview");
        const data = await response.json();
        setHealthData(data);
      } catch (error) {
        console.error("Failed to fetch health data:", error);
      }
    };

    fetchRealHealthData();
    const interval = setInterval(fetchRealHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card title="API Health Overview">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <div style={{ textAlign: "center" }}>
            <Progress
              type="circle"
              percent={healthData.overallScore}
              size={120}
              strokeColor="#52c41a"
              format={(percent) => `${percent}%`}
            />
            <div style={{ marginTop: 16, fontSize: 16, fontWeight: "bold" }}>
              Overall Health Score
            </div>
          </div>
        </Col>
        <Col xs={24} md={16}>
          {healthData.apis.map((api, index) => (
            <div
              key={index}
              style={{
                marginBottom: 12,
                padding: "8px",
                border: "1px solid #f0f0f0",
                borderRadius: "6px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{api.name}</span>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Progress
                    percent={api.health_score}
                    size="small"
                    style={{ width: 120 }}
                    strokeColor={
                      api.health_score > 80
                        ? "#52c41a"
                        : api.health_score > 60
                          ? "#faad14"
                          : "#ff4d4f"
                    }
                  />
                  <span
                    style={{
                      fontWeight: "bold",
                      color:
                        api.health_score > 80
                          ? "#52c41a"
                          : api.health_score > 60
                            ? "#faad14"
                            : "#ff4d4f",
                    }}
                  >
                    {api.health_score}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </Col>
      </Row>
    </Card>
  );
}
