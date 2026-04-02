import React, { useState } from 'react';
import { FloatButton, Drawer, Input, Button, Space, Card, Spin } from 'antd';
import { 
  RobotOutlined, 
  SendOutlined, 
  CloseOutlined,
  ThunderboltOutlined 
} from '@ant-design/icons';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CopilotChatProps {
  context: string; // e.g., "security-center", "compliance-hub"
  suggestions?: string[];
}

export const CopilotChat: React.FC<CopilotChatProps> = ({ 
  context, 
  suggestions = [] 
}) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/copilot/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: input,
          context,
          history: messages,
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || 'I apologize, but I encountered an error processing your request.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Copilot error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <>
      <FloatButton
        icon={<RobotOutlined />}
        type="primary"
        style={{ right: 24, bottom: 24 }}
        onClick={() => setOpen(true)}
        badge={{ dot: true, color: '#52c41a' }}
        tooltip="Ask GovernAPI Copilot"
      />

      <Drawer
        title={
          <Space>
            <ThunderboltOutlined style={{ color: '#1890ff' }} />
            <span>GovernAPI Copilot</span>
          </Space>
        }
        placement="right"
        width={450}
        onClose={() => setOpen(false)}
        open={open}
        extra={
          <Button 
            type="text" 
            icon={<CloseOutlined />} 
            onClick={() => setOpen(false)}
          />
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Suggestions */}
          {messages.length === 0 && suggestions.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '8px' }}>
                Try asking:
              </div>
              <Space direction="vertical" style={{ width: '100%' }}>
                {suggestions.map((suggestion, idx) => (
                  <Card
                    key={idx}
                    size="small"
                    hoverable
                    onClick={() => handleSuggestion(suggestion)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '13px' }}>{suggestion}</div>
                  </Card>
                ))}
              </Space>
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '12px',
                      borderRadius: '8px',
                      background: message.role === 'user' ? '#1890ff' : '#f5f5f5',
                      color: message.role === 'user' ? '#fff' : '#000',
                    }}
                  >
                    <div style={{ fontSize: '13px', whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </div>
                    <div 
                      style={{ 
                        fontSize: '11px', 
                        marginTop: '4px',
                        opacity: 0.7 
                      }}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '12px' }}>
                    <Spin size="small" />
                  </div>
                </div>
              )}
            </Space>
          </div>

          {/* Input */}
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={handleSend}
              disabled={loading}
            />
            <Button 
              type="primary" 
              icon={<SendOutlined />} 
              onClick={handleSend}
              loading={loading}
            />
          </Space.Compact>
        </div>
      </Drawer>
    </>
  );
};
