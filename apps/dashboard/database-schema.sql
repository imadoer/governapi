
-- Rate limiting configuration
CREATE TABLE IF NOT EXISTS rate_limit_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  requests_per_minute INTEGER DEFAULT 100,
  requests_per_hour INTEGER DEFAULT 1000,
  requests_per_day INTEGER DEFAULT 10000,
  burst_limit INTEGER DEFAULT 200,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- IP blocking management
CREATE TABLE IF NOT EXISTS ip_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  ip_address VARCHAR(45) NOT NULL,
  blocked_until TIMESTAMP NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced threat events for enterprise monitoring
ALTER TABLE threat_events ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT false;
ALTER TABLE threat_events ADD COLUMN IF NOT EXISTS block_duration INTEGER DEFAULT 300;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rate_limit_config_tenant ON rate_limit_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ip_blocks_tenant_ip ON ip_blocks(tenant_id, ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_blocks_until ON ip_blocks(blocked_until);
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
-- API key management tables
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  key_name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  key_prefix VARCHAR(20) NOT NULL,
  permissions JSONB DEFAULT '[]',
  rate_limit_override INTEGER,
  ip_whitelist INET[],
  expires_at TIMESTAMP,
  last_used TIMESTAMP,
  usage_count BIGINT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_api_keys_hash (key_hash),
  INDEX idx_api_keys_tenant_active (tenant_id, is_active),
  INDEX idx_api_keys_prefix (key_prefix)
);

-- API key rotation history
CREATE TABLE IF NOT EXISTS api_key_rotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  old_key_hash VARCHAR(255) NOT NULL,
  new_key_hash VARCHAR(255) NOT NULL,
  rotation_reason VARCHAR(100),
  rotated_by UUID REFERENCES users(id),
  rotated_at TIMESTAMP DEFAULT NOW()
);

-- API key usage logs
CREATE TABLE IF NOT EXISTS api_key_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  response_code INTEGER,
  timestamp TIMESTAMP DEFAULT NOW(),
  INDEX idx_api_key_usage_key_time (api_key_id, timestamp),
  INDEX idx_api_key_usage_endpoint (endpoint, timestamp)
);
-- Advanced threat detection patterns
CREATE TABLE IF NOT EXISTS threat_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name VARCHAR(255) NOT NULL,
  pattern_type VARCHAR(50) NOT NULL, -- 'signature', 'behavioral', 'ml_model'
  severity VARCHAR(20) DEFAULT 'medium',
  pattern_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_threat_patterns_type (pattern_type, is_active)
);

-- Real-time threat events with enhanced detection
CREATE TABLE IF NOT EXISTS threat_events_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  api_id UUID REFERENCES apis(id) ON DELETE CASCADE,
  threat_pattern_id UUID REFERENCES threat_patterns(id),
  event_type VARCHAR(100) NOT NULL,
  source_ip INET NOT NULL,
  user_agent TEXT,
  request_path VARCHAR(500),
  request_method VARCHAR(10),
  payload_sample TEXT,
  risk_score INTEGER NOT NULL, -- 0-100
  confidence_level REAL NOT NULL, -- 0.0-1.0
  detection_method VARCHAR(50), -- 'pattern_match', 'anomaly', 'ml_inference'
  blocked BOOLEAN DEFAULT false,
  false_positive BOOLEAN DEFAULT false,
  metadata JSONB,
  detected_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_threat_events_tenant_time (tenant_id, detected_at),
  INDEX idx_threat_events_risk (risk_score, detected_at),
  INDEX idx_threat_events_source (source_ip, detected_at)
);

-- Behavioral baselines for anomaly detection
CREATE TABLE IF NOT EXISTS api_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  api_id UUID REFERENCES apis(id) ON DELETE CASCADE,
  baseline_type VARCHAR(50) NOT NULL, -- 'request_rate', 'payload_size', 'response_time'
  time_window VARCHAR(20) NOT NULL, -- 'hourly', 'daily', 'weekly'
  baseline_value REAL NOT NULL,
  deviation_threshold REAL NOT NULL,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, api_id, baseline_type, time_window)
);
