import React, { useState } from 'react';
import { Button, Dropdown, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

interface ExportButtonProps {
  endpoint: string;
  filename?: string;
  tenantId: string;
}

export function ExportButton({ endpoint, filename = 'export', tenantId }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: 'pdf' | 'csv' | 'json') => {
    setLoading(true);
    try {
      const response = await fetch(`${endpoint}?format=${format}`, {
        headers: { 'x-tenant-id': tenantId },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}_${Date.now()}.${format}`;
        a.click();
        message.success(`${format.toUpperCase()} exported successfully`);
      } else {
        message.error('Export failed');
      }
    } catch (error) {
      message.error('Export failed');
    } finally {
      setLoading(false);
    }
  };

  const items: MenuProps['items'] = [
    { key: 'pdf', label: 'Export as PDF', onClick: () => handleExport('pdf') },
    { key: 'csv', label: 'Export as CSV', onClick: () => handleExport('csv') },
    { key: 'json', label: 'Export as JSON', onClick: () => handleExport('json') },
  ];

  return (
    <Dropdown menu={{ items }} placement="bottomRight">
      <Button icon={<DownloadOutlined />} loading={loading}>
        Export Report
      </Button>
    </Dropdown>
  );
}
