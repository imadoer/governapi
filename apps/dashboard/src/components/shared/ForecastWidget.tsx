import React from 'react';
import { Card, Space, Progress, Tag } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';

interface ForecastWidgetProps {
  title: string;
  currentValue: number;
  predictedValue: number;
  unit?: string;
  confidence: number;
  loading?: boolean;
  trend: 'up' | 'down' | 'stable';
}

export const ForecastWidget: React.FC<ForecastWidgetProps> = ({
  title,
  currentValue,
  predictedValue,
  unit = '',
  confidence,
  loading = false,
  trend,
}) => {
  const change = predictedValue - currentValue;
  const changePercent = ((change / currentValue) * 100).toFixed(1);
  
  const trendColor = trend === 'up' ? '#52c41a' : trend === 'down' ? '#ff4d4f' : '#1890ff';

  return (
    <Card loading={loading} size="small">
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', fontWeight: 500 }}>{title}</span>
          <ThunderboltOutlined style={{ color: '#faad14', fontSize: '16px' }} />
        </div>
        
        <div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Current</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {currentValue}{unit}
          </div>
        </div>

        <div style={{ 
          background: '#f5f5f5', 
          padding: '8px', 
          borderRadius: '4px',
          border: `1px solid ${trendColor}20`
        }}>
          <div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: '4px' }}>
            Predicted (7 days)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: trendColor }}>
              {predictedValue}{unit}
            </span>
            <Tag color={trendColor}>
              {change > 0 ? '+' : ''}{changePercent}%
            </Tag>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: '4px' }}>
            Confidence
          </div>
          <Progress 
            percent={confidence} 
            size="small" 
            strokeColor={confidence > 80 ? '#52c41a' : confidence > 60 ? '#faad14' : '#ff4d4f'}
            showInfo={true}
          />
        </div>
      </Space>
    </Card>
  );
};
