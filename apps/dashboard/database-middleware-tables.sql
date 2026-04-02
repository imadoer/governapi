-- API request tracking for rate limiting
CREATE TABLE IF NOT EXISTS api_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_api_requests_tenant_time (tenant_id, created_at),
  INDEX idx_api_requests_ip_time (ip_address, created_at)
);

-- Request logging for security monitoring
CREATE TABLE IF NOT EXISTS request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  response_time INTEGER, -- in milliseconds
  user_agent TEXT,
  request_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_request_logs_ip_status_time (ip_address, status_code, created_at),
  INDEX idx_request_logs_tenant_time (tenant_id, created_at)
);

-- IP blocking for security
CREATE TABLE IF NOT EXISTS ip_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  reason TEXT NOT NULL,
  blocked_until TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, ip_address),
  INDEX idx_ip_blocks_active (ip_address, blocked_until)
);

-- Session management
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  refresh_token VARCHAR(255) UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  last_accessed TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_sessions_token (session_token),
  INDEX idx_sessions_user_active (user_id, is_active),
  INDEX idx_sessions_expiry (expires_at)
);

-- Performance metrics tracking
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  response_time INTEGER NOT NULL, -- milliseconds
  status_code INTEGER NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  INDEX idx_perf_metrics_endpoint_time (endpoint, timestamp),
  INDEX idx_perf_metrics_tenant_time (tenant_id, timestamp)
);

-- Security events logging
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium',
  description TEXT NOT NULL,
  ip_address INET,
  user_id UUID,
  endpoint VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_security_events_type_time (event_type, created_at),
  INDEX idx_security_events_ip_time (ip_address, created_at),
  INDEX idx_security_events_severity (severity, created_at)
);

-- Webhook delivery tracking
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
  event VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  response_code INTEGER,
  response_body TEXT,
  response_time INTEGER, -- milliseconds
  error_message TEXT,
  attempt_count INTEGER DEFAULT 1,
  next_retry TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_webhook_deliveries_status (status, created_at),
  INDEX idx_webhook_deliveries_webhook (webhook_id, created_at)
);
