-- Create webhooks table for webhook endpoint management
CREATE TABLE IF NOT EXISTS webhooks (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(2000) NOT NULL,
  events JSONB NOT NULL, -- array of event types to subscribe to
  type VARCHAR(100) DEFAULT 'generic', -- webhook type categorization
  enabled BOOLEAN DEFAULT true,
  secret_key VARCHAR(255), -- for webhook signature verification
  headers JSONB, -- custom headers to send
  timeout_seconds INTEGER DEFAULT 30,
  retry_count INTEGER DEFAULT 3,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create webhook_deliveries table for delivery tracking
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id SERIAL PRIMARY KEY,
  webhook_id INTEGER REFERENCES webhooks(id) ON DELETE CASCADE,
  event VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'success', 'failed', 'pending', 'retrying'
  response_code INTEGER,
  response_body TEXT,
  response_headers JSONB,
  error_message TEXT,
  attempt_count INTEGER DEFAULT 1,
  next_retry_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create webhook_events table for event type definitions
CREATE TABLE IF NOT EXISTS webhook_events (
  id SERIAL PRIMARY KEY,
  event_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  payload_schema JSONB, -- JSON schema for event payload
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create comprehensive indexes for webhook queries
CREATE INDEX IF NOT EXISTS idx_webhooks_tenant_id ON webhooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_enabled ON webhooks(enabled);
CREATE INDEX IF NOT EXISTS idx_webhooks_type ON webhooks(type);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON webhook_deliveries(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event ON webhook_deliveries(event);

CREATE INDEX IF NOT EXISTS idx_webhook_events_name ON webhook_events(event_name);
CREATE INDEX IF NOT EXISTS idx_webhook_events_active ON webhook_events(is_active);

-- Insert standard webhook event types
INSERT INTO webhook_events (event_name, description) VALUES
('security.scan.completed', 'Security scan has been completed'),
('security.threat.detected', 'New security threat detected'),
('security.vulnerability.found', 'Vulnerability discovered in API'),
('compliance.violation.detected', 'Compliance violation found'),
('performance.threshold.exceeded', 'Performance threshold exceeded'),
('api.endpoint.discovered', 'New API endpoint discovered'),
('policy.violation.detected', 'Policy violation detected'),
('user.login', 'User login event'),
('user.logout', 'User logout event'),
('integration.connected', 'External integration connected'),
('integration.disconnected', 'External integration disconnected'),
('report.generated', 'Report generation completed')
ON CONFLICT (event_name) DO NOTHING;
