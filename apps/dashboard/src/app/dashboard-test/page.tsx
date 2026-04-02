"use client";
import { useState, useEffect } from "react";
import { Card, Typography } from "antd";

const { Title, Text } = Typography;

export default function DashboardTest() {
  const [status, setStatus] = useState("Loading...");
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      console.log("Test component mounted");
      const key = sessionStorage.getItem("apiKey");
      const user = sessionStorage.getItem("user");

      setApiKey(key);
      setStatus(
        `API Key: ${key ? "Found" : "Not found"}, User: ${user ? "Found" : "Not found"}`,
      );

      console.log("SessionStorage check:", { key, user });
    } catch (error) {
      console.error("Test component error:", error);
      setStatus(`Error: ${error}`);
    }
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <Card>
        <Title level={3}>Dashboard Debug Test</Title>
        <Text>{status}</Text>
        <br />
        <Text>Check console for detailed logs</Text>
      </Card>
    </div>
  );
}
