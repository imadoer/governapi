-- Create scheduled_scans table for automated scanning
CREATE TABLE IF NOT EXISTS scheduled_scans (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  target_url VARCHAR(2000) NOT NULL,
  scan_type VARCHAR(100) NOT NULL, -- 'security', 'performance', 'availability', 'compliance'
  frequency VARCHAR(50) NOT NULL, -- 'hourly', 'daily', 'weekly', 'monthly'
  is_active BOOLEAN DEFAULT true,
  next_run TIMESTAMP,
  last_run TIMESTAMP,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create threat_blocking_rules table for threat management
CREATE TABLE IF NOT EXISTS threat_blocking_rules (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(100), -- 'ip_blocking', 'pattern_matching', 'behavioral'
  conditions JSONB NOT NULL,
  action VARCHAR(50) DEFAULT 'block', -- 'block', 'allow', 'monitor'
  priority INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  triggered_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create enterprise_settings table for enterprise configuration
CREATE TABLE IF NOT EXISTS enterprise_settings (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) UNIQUE,
  sso_enabled BOOLEAN DEFAULT false,
  sso_provider VARCHAR(100),
  sso_config JSONB,
  api_rate_limit INTEGER DEFAULT 1000,
  max_users INTEGER DEFAULT 100,
  data_retention_days INTEGER DEFAULT 365,
  compliance_reporting BOOLEAN DEFAULT true,
  custom_branding JSONB,
  audit_logging BOOLEAN DEFAULT true,
  ip_whitelisting JSONB,
  advanced_analytics BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create companies table for subscription management
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  subscription_plan VARCHAR(100) DEFAULT 'basic', -- 'basic', 'professional', 'enterprise'
  subscription_status VARCHAR(50) DEFAULT 'active', -- 'active', 'suspended', 'cancelled'
  billing_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create alerts table for alert management
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  rule_id INTEGER,
  alert_type VARCHAR(100), -- 'security', 'performance', 'compliance', 'system'
  severity VARCHAR(20) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'acknowledged', 'resolved', 'closed'
  title VARCHAR(500) NOT NULL,
  description TEXT,
  source_data JSONB,
  acknowledged_by VARCHAR(255),
  acknowledged_at TIMESTAMP,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create alert_rules table for alert configuration
CREATE TABLE IF NOT EXISTS alert_rules (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  rule_name VARCHAR(255) NOT NULL,
  conditions JSONB NOT NULL,
  alert_type VARCHAR(100),
  severity VARCHAR(20) DEFAULT 'MEDIUM',
  is_active BOOLEAN DEFAULT true,
  notification_channels JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to existing apis table for api-endpoints functionality
ALTER TABLE apis ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE apis ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- Create comprehensive indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_scans_tenant_active ON scheduled_scans(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_scheduled_scans_next_run ON scheduled_scans(next_run);

CREATE INDEX IF NOT EXISTS idx_threat_blocking_rules_tenant ON threat_blocking_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_threat_blocking_rules_active ON threat_blocking_rules(is_active);

CREATE INDEX IF NOT EXISTS idx_enterprise_settings_tenant ON enterprise_settings(tenant_id);

CREATE INDEX IF NOT EXISTS idx_companies_subscription ON companies(subscription_plan, subscription_status);

CREATE INDEX IF NOT EXISTS idx_alerts_tenant_status ON alerts(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);

CREATE INDEX IF NOT EXISTS idx_alert_rules_tenant_active ON alert_rules(tenant_id, is_active);

-- Insert sample enterprise company for testing
INSERT INTO companies (id, company_name, subscription_plan, subscription_status) VALUES 
(1, 'Test Enterprise', 'enterprise', 'active') 
ON CONFLICT (id) DO UPDATE SET 
subscription_plan = 'enterprise', 
subscription_status = 'active';
