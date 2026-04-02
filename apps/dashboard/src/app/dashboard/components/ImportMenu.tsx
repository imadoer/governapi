import { useState } from "react";
import { Button, Upload, Dropdown, Menu, message } from "antd";
import {
  ImportOutlined,
  FileTextOutlined,
  ApiOutlined,
} from "@ant-design/icons";

export function ImportMenu() {
  const [loading, setLoading] = useState(false);

  const handleOpenAPIImport = async (file: File) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/import/openapi", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        message.success(`Imported ${data.imported} APIs successfully`);
      } else {
        message.error("Import failed");
      }
    } catch (error) {
      message.error("Failed to import OpenAPI spec");
    } finally {
      setLoading(false);
    }

    return false; // Prevent default upload
  };

  const menu = (
    <Menu>
      <Menu.Item key="openapi" icon={<FileTextOutlined />}>
        <Upload
          accept=".json,.yaml,.yml"
          showUploadList={false}
          beforeUpload={handleOpenAPIImport}
        >
          Import OpenAPI/Swagger
        </Upload>
      </Menu.Item>
      <Menu.Item key="postman" icon={<ApiOutlined />} disabled>
        Import from Postman
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={menu} placement="bottomLeft">
      <Button icon={<ImportOutlined />} loading={loading}>
        Import APIs
      </Button>
    </Dropdown>
  );
}
