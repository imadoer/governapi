"use client";

import { Modal, Form, Input, Select, Row, Col, Space, Button } from "antd";

interface ScanModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => void;
  loading?: boolean;
}

export default function ScanModal({
  visible,
  onCancel,
  onSubmit,
  loading,
}: ScanModalProps) {
  const [form] = Form.useForm();

  return (
    <Modal
      title="Configure API Security Scan"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          name="target"
          label="API Endpoint URL"
          rules={[
            { required: true, message: "Please enter the API endpoint URL" },
          ]}
        >
          <Input placeholder="https://api.example.com" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="apiType"
              label="API Type"
              rules={[{ required: true }]}
            >
              <Select placeholder="Select API type">
                <Select.Option value="rest">REST API</Select.Option>
                <Select.Option value="graphql">GraphQL</Select.Option>
                <Select.Option value="grpc">gRPC</Select.Option>
                <Select.Option value="soap">SOAP</Select.Option>
                <Select.Option value="websocket">WebSocket</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="environment"
              label="Environment"
              rules={[{ required: true }]}
            >
              <Select placeholder="Select environment">
                <Select.Option value="production">Production</Select.Option>
                <Select.Option value="staging">Staging</Select.Option>
                <Select.Option value="development">Development</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="scanType"
              label="Scan Type"
              rules={[{ required: true }]}
            >
              <Select placeholder="Select scan type">
                <Select.Option value="discovery">API Discovery</Select.Option>
                <Select.Option value="security">Security Scan</Select.Option>
                <Select.Option value="compliance">
                  Compliance Check
                </Select.Option>
                <Select.Option value="full">Full Audit</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="authType"
              label="Authentication"
              rules={[{ required: true }]}
            >
              <Select placeholder="Select auth type">
                <Select.Option value="none">No Authentication</Select.Option>
                <Select.Option value="apikey">API Key</Select.Option>
                <Select.Option value="bearer">Bearer Token</Select.Option>
                <Select.Option value="oauth2">OAuth 2.0</Select.Option>
                <Select.Option value="basic">Basic Auth</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="schedule"
          label="Schedule"
          rules={[{ required: true }]}
        >
          <Select placeholder="Select schedule">
            <Select.Option value="now">Run Now</Select.Option>
            <Select.Option value="hourly">Hourly</Select.Option>
            <Select.Option value="daily">Daily</Select.Option>
            <Select.Option value="weekly">Weekly</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item className="mb-0">
          <Space className="w-full justify-end">
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Start Scan
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
