import { useState } from "react";
import {
  Card,
  Button,
  Select,
  Space,
  message,
  Row,
  Col,
  Progress,
  Tag,
} from "antd";
import {
  FileTextOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

export function ComplianceDashboard() {
  const [loading, setLoading] = useState(false);
  const [framework, setFramework] = useState("SOC2");

  const frameworks = {
    SOC2: { score: 92, color: "#52c41a" },
    GDPR: { score: 88, color: "#1890ff" },
    "PCI-DSS": { score: 79, color: "#fa8c16" },
    HIPAA: { score: 94, color: "#722ed1" },
    "ISO-27001": { score: 85, color: "#13c2c2" },
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/compliance/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ framework, format: "detailed" }),
      });
      const data = await response.json();

      if (data.success) {
        // Download report
        const blob = new Blob([JSON.stringify(data.report, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${framework}-compliance-report-${Date.now()}.json`;
        a.click();

        message.success("Compliance report generated successfully");
      }
    } catch (error) {
      message.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Compliance Management">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Space>
            <Select
              value={framework}
              onChange={setFramework}
              style={{ width: 200 }}
            >
              {Object.keys(frameworks).map((fw) => (
                <Select.Option key={fw} value={fw}>
                  {fw}
                </Select.Option>
              ))}
            </Select>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={generateReport}
              loading={loading}
            >
              Generate {framework} Report
            </Button>
          </Space>
        </Col>
        {Object.entries(frameworks).map(([fw, data]) => (
          <Col key={fw} xs={24} sm={12} md={8} lg={4}>
            <Card size="small">
              <div className="text-center">
                <Progress
                  type="circle"
                  percent={data.score}
                  strokeColor={data.color}
                  width={80}
                />
                <div className="mt-2 font-semibold">{fw}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
}
