-- Complete enterprise schema extension for existing Supabase database

-- Customer API key management (multi-key per tenant)
CREATE TABLE IF NOT EXISTS customer_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  api_key VARCHAR(64) UNIQUE NOT NULL,
  key_name VARCHAR(255) NOT NULL DEFAULT 'Default Key',
  daily_limit INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Customer request tracking per API key
CREATE TABLE IF NOT EXISTS customer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  api_key VARCHAR(64) NOT NULL,
  request_url TEXT NOT NULL,
  method VARCHAR(10) NOT NULL,
  security_score INTEGER,
  threat_detected BOOLEAN DEFAULT false,
  threat_type VARCHAR(100),
  response_time_ms INTEGER,
  source_ip VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Threat blocking system
CREATE TABLE IF NOT EXISTS blocked_threats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  ip_address VARCHAR(45) NOT NULL,
  threat_type VARCHAR(100),
  block_reason TEXT,
  blocked_until TIMESTAMP,
  blocked_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Security scans
CREATE TABLE IF NOT EXISTS security_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  target_url TEXT NOT NULL,
  scan_type VARCHAR(50),
  status VARCHAR(50),
  security_score INTEGER,
  vulnerabilities_found INTEGER,
  scan_results JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Scheduled scans
CREATE TABLE IF NOT EXISTS scheduled_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255),
  target_url TEXT NOT NULL,
  schedule_cron VARCHAR(100),
  enabled BOOLEAN DEFAULT true,
  next_run TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Webhook configurations
CREATE TABLE IF NOT EXISTS webhook_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255),
  url TEXT NOT NULL,
  webhook_type VARCHAR(50),
  events TEXT[],
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_customer_api_keys_tenant ON customer_api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_api_keys_key ON customer_api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_customer_requests_tenant_key ON customer_requests(tenant_id, api_key);
CREATE INDEX IF NOT EXISTS idx_customer_requests_created ON customer_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_blocked_threats_tenant_ip ON blocked_threats(tenant_id, ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_threats_until ON blocked_threats(blocked_until);
CREATE INDEX IF NOT EXISTS idx_security_scans_tenant ON security_scans(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_scans_tenant ON scheduled_scans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_tenant ON webhook_configurations(tenant_id);
