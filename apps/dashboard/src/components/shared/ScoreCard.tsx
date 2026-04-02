import React from 'react';
import { Card, Statistic, Space } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface ScoreCardProps {
  title: string;
  value: number | string;
  trend?: number;
  suffix?: string;
  prefix?: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
}

export function ScoreCard({ title, value, trend, suffix, prefix, onClick, loading }: ScoreCardProps) {
  const getTrendColor = () => {
    if (trend === undefined) return undefined;
    return trend >= 0 ? '#52c41a' : '#ff4d4f';
  };

  const getTrendIcon = () => {
    if (trend === undefined) return null;
    return trend >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />;
  };

  return (
    <Card 
      hoverable={!!onClick} 
      onClick={onClick}
      loading={loading}
      style={{ height: '100%' }}
    >
      <Statistic
        title={title}
        value={value}
        suffix={suffix}
        prefix={prefix}
        valueStyle={{ fontSize: '32px', fontWeight: 600 }}
      />
      {trend !== undefined && (
        <Space style={{ marginTop: 8 }}>
          <span style={{ color: getTrendColor(), fontSize: '14px' }}>
            {getTrendIcon()} {Math.abs(trend)}%
          </span>
          <span style={{ color: '#8c8c8c', fontSize: '12px' }}>vs last week</span>
        </Space>
      )}
    </Card>
  );
}
