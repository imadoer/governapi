import React from 'react';
import { Alert, Button, Space, Tag, Avatar } from 'antd';
import { 
  FireOutlined, 
  TeamOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined 
} from '@ant-design/icons';

interface Incident {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium';
  startedAt: string;
  responders: string[];
  status: 'active' | 'investigating' | 'resolving';
}

interface IncidentBannerProps {
  incident: Incident;
  onResolve: () => void;
  onViewDetails: () => void;
}

export const IncidentBanner: React.FC<IncidentBannerProps> = ({
  incident,
  onResolve,
  onViewDetails,
}) => {
  const severityConfig = {
    critical: { color: '#ff4d4f', icon: <FireOutlined /> },
    high: { color: '#fa8c16', icon: <FireOutlined /> },
    medium: { color: '#faad14', icon: <FireOutlined /> },
  };

  const config = severityConfig[incident.severity];

  return (
    <Alert
      type="error"
      showIcon
      icon={config.icon}
      message={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Space size="large" style={{ flex: 1 }}>
            <div>
              <Tag color={config.color} style={{ marginRight: 8 }}>
                {incident.severity.toUpperCase()}
              </Tag>
              <strong style={{ fontSize: '15px' }}>{incident.title}</strong>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TeamOutlined />
              <span style={{ fontSize: '13px' }}>Responders:</span>
              <Avatar.Group maxCount={3} size="small">
                {incident.responders.map((name, idx) => (
                  <Avatar key={idx} size="small" style={{ backgroundColor: '#1890ff' }}>
                    {name[0]}
                  </Avatar>
                ))}
              </Avatar.Group>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClockCircleOutlined />
              <span style={{ fontSize: '13px' }}>
                Started: {new Date(incident.startedAt).toLocaleTimeString()}
              </span>
            </div>

            <Tag color="processing">{incident.status.toUpperCase()}</Tag>
          </Space>

          <Space>
            <Button size="small" onClick={onViewDetails}>
              View Details
            </Button>
            <Button 
              size="small" 
              type="primary" 
              icon={<CheckCircleOutlined />}
              onClick={onResolve}
            >
              Mark Resolved
            </Button>
          </Space>
        </div>
      }
      style={{ marginBottom: '16px' }}
      banner
    />
  );
};
