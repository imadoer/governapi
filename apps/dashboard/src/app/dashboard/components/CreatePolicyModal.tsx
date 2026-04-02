import { Modal, Form, Input, Select, Button, Switch } from "antd";
import { handleCreatePolicy } from "../actions";

export function CreatePolicyModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    try {
      await handleCreatePolicy(values);
      form.resetFields();
      onClose();
    } catch (error) {
      // Error handled in action
    }
  };

  return (
    <Modal
      title="Create New Policy"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="name" label="Policy Name" rules={[{ required: true }]}>
          <Input placeholder="e.g., Require Authentication" />
        </Form.Item>
        <Form.Item name="type" label="Policy Type" rules={[{ required: true }]}>
          <Select placeholder="Select policy type">
            <Select.Option value="security">Security</Select.Option>
            <Select.Option value="rate-limiting">Rate Limiting</Select.Option>
            <Select.Option value="authentication">Authentication</Select.Option>
            <Select.Option value="data-validation">
              Data Validation
            </Select.Option>
            <Select.Option value="compliance">Compliance</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="severity"
          label="Severity"
          rules={[{ required: true }]}
        >
          <Select placeholder="Select severity">
            <Select.Option value="critical">Critical</Select.Option>
            <Select.Option value="high">High</Select.Option>
            <Select.Option value="medium">Medium</Select.Option>
            <Select.Option value="low">Low</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="rules" label="Policy Rules (JSON)">
          <Input.TextArea
            rows={6}
            placeholder='{"require": "authentication", "methods": ["POST", "PUT", "DELETE"]}'
          />
        </Form.Item>
        <Form.Item name="enabled" label="Enable Policy" valuePropName="checked">
          <Switch defaultChecked />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Create Policy
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
