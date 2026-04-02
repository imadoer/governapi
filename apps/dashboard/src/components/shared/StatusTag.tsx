import React from 'react';
import { Tag } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';

interface StatusTagProps {
  status: 'critical' | 'high' | 'medium' | 'low' | 'info' | 'passed' | 'failed' | 'pending' | 'running' | 'completed';
  text?: string;
}

export function StatusTag({ status, text }: StatusTagProps) {
  const config = {
    critical: { color: 'red', icon: <CloseCircleOutlined /> },
    high: { color: 'orange', icon: <ExclamationCircleOutlined /> },
    medium: { color: 'gold', icon: <ExclamationCircleOutlined /> },
    low: { color: 'blue', icon: <MinusCircleOutlined /> },
    info: { color: 'default', icon: <MinusCircleOutlined /> },
    passed: { color: 'green', icon: <CheckCircleOutlined /> },
    failed: { color: 'red', icon: <CloseCircleOutlined /> },
    pending: { color: 'orange', icon: <ClockCircleOutlined /> },
    running: { color: 'blue', icon: <ClockCircleOutlined spin /> },
    completed: { color: 'green', icon: <CheckCircleOutlined /> },
  };

  const { color, icon } = config[status] || config.info;

  return (
    <Tag color={color} icon={icon}>
      {text || status.toUpperCase()}
    </Tag>
  );
}
