-- Multi-tenant schema for Supabase
-- Run this in Supabase SQL editor

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  api_key VARCHAR(64) UNIQUE NOT NULL,
  daily_limit INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- API endpoints table (extends your core schema)
CREATE TABLE IF NOT EXISTS api_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  method VARCHAR(10) NOT NULL,
  path TEXT NOT NULL,
  host VARCHAR(255) NOT NULL,
  port INTEGER NOT NULL,
  protocol VARCHAR(10) NOT NULL,
  service VARCHAR(255),
  version VARCHAR(50),
  data_classification VARCHAR(50) NOT NULL,
  risk_score INTEGER DEFAULT 0,
  discovery_source VARCHAR(50) NOT NULL,
  last_seen BIGINT DEFAULT 0,
  request_count BIGINT DEFAULT 0,
  avg_response_time FLOAT DEFAULT 0,
  error_rate FLOAT DEFAULT 0,
  auth_required BOOLEAN DEFAULT false,
  rate_limited BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL
);

-- Policies table
CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(50) NOT NULL,
  active BOOLEAN DEFAULT false,
  deployed_at BIGINT,
  compiled_policy JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL
);

-- Threat events table
CREATE TABLE IF NOT EXISTS threat_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  threat_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  endpoint_id UUID,
  source_ip VARCHAR(45) NOT NULL,
  description TEXT NOT NULL,
  confidence FLOAT NOT NULL,
  evidence_ids JSONB DEFAULT '[]',
  resolved BOOLEAN DEFAULT false,
  resolved_at BIGINT,
  resolved_by VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- API usage tracking
CREATE TABLE IF NOT EXISTS api_usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  endpoint_id UUID,
  timestamp BIGINT NOT NULL,
  request_count INTEGER DEFAULT 1,
  response_time FLOAT NOT NULL,
  status_code INTEGER NOT NULL,
  source_ip VARCHAR(45) NOT NULL,
  user_agent TEXT,
  auth_context JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_endpoints_tenant_id ON api_endpoints(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policies_tenant_active ON policies(tenant_id, active);
CREATE INDEX IF NOT EXISTS idx_threat_events_tenant_created ON threat_events(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_tenant_time ON api_usage_metrics(tenant_id, timestamp DESC);

-- Insert admin tenant
INSERT INTO tenants (id, name, email, api_key, daily_limit) 
VALUES ('00000000-0000-0000-0000-000000000000', 'System Admin', 'admin@governapi.com', 'admin_system_key', 999999)
ON CONFLICT (email) DO NOTHING;
