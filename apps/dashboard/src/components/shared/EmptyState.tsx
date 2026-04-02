import React from 'react';
import { Empty, Button } from 'antd';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: {
    text: string;
    onClick: () => void;
  };
}

export function EmptyState({ title = 'No data', description, action }: EmptyStateProps) {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <Empty
        description={
          <div>
            <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: 8 }}>
              {title}
            </div>
            {description && (
              <div style={{ fontSize: '14px', color: '#8c8c8c' }}>
                {description}
              </div>
            )}
          </div>
        }
      >
        {action && (
          <Button type="primary" onClick={action.onClick}>
            {action.text}
          </Button>
        )}
      </Empty>
    </div>
  );
}
