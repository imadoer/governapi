-- Create rate_limit_log table for rate limiting analytics
CREATE TABLE IF NOT EXISTS rate_limit_log (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  source_ip INET,
  endpoint VARCHAR(500),
  is_rate_limited BOOLEAN DEFAULT false,
  requests_per_minute INTEGER DEFAULT 0,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create rate_limit_rules table for rate limiting configuration
CREATE TABLE IF NOT EXISTS rate_limit_rules (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  rule_name VARCHAR(255) NOT NULL,
  endpoint_pattern VARCHAR(500) NOT NULL,
  requests_per_minute INTEGER NOT NULL,
  requests_per_hour INTEGER,
  burst_limit INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create rate_limit_violations table for violation tracking
CREATE TABLE IF NOT EXISTS rate_limit_violations (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  source_ip INET,
  endpoint VARCHAR(500),
  requests_attempted INTEGER,
  limit_exceeded INTEGER,
  blocked_at TIMESTAMP DEFAULT NOW(),
  user_agent TEXT,
  violation_type VARCHAR(100)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_log_tenant_time ON rate_limit_log(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_rules_tenant_pattern ON rate_limit_rules(tenant_id, endpoint_pattern);
CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_tenant_time ON rate_limit_violations(tenant_id, blocked_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_source_ip ON rate_limit_violations(source_ip);
