import { Modal, Form, Input, Select, Button } from "antd";
import { handleAddAPI } from "../actions";

export function AddAPIModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    try {
      await handleAddAPI(values);
      form.resetFields();
      onClose();
    } catch (error) {
      // Error handled in action
    }
  };

  return (
    <Modal title="Add New API" open={visible} onCancel={onClose} footer={null}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="name" label="API Name" rules={[{ required: true }]}>
          <Input placeholder="e.g., User Service API" />
        </Form.Item>
        <Form.Item
          name="endpoint"
          label="Endpoint URL"
          rules={[{ required: true, type: "url" }]}
        >
          <Input placeholder="https://api.example.com" />
        </Form.Item>
        <Form.Item name="type" label="API Type">
          <Select defaultValue="REST">
            <Select.Option value="REST">REST</Select.Option>
            <Select.Option value="GraphQL">GraphQL</Select.Option>
            <Select.Option value="SOAP">SOAP</Select.Option>
            <Select.Option value="gRPC">gRPC</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="environment" label="Environment">
          <Select defaultValue="production">
            <Select.Option value="production">Production</Select.Option>
            <Select.Option value="staging">Staging</Select.Option>
            <Select.Option value="development">Development</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea placeholder="Optional description" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Add API
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
