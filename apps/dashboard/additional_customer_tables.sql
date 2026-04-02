-- Create rate_limit_stats table for rate limiting analytics
CREATE TABLE IF NOT EXISTS rate_limit_stats (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  source_ip INET,
  endpoint VARCHAR(500),
  is_rate_limited BOOLEAN DEFAULT false,
  requests_per_minute INTEGER DEFAULT 0,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create custom_rules table for governance rules
CREATE TABLE IF NOT EXISTS custom_rules (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(100), -- 'security', 'compliance', 'performance', etc.
  description TEXT,
  priority VARCHAR(20) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  action VARCHAR(50) DEFAULT 'alert', -- 'alert', 'block', 'throttle'
  conditions JSONB NOT NULL, -- rule conditions in JSON format
  is_active BOOLEAN DEFAULT true,
  triggered_count INTEGER DEFAULT 0,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_stats_tenant_time ON rate_limit_stats(tenant_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_rate_limit_stats_source_ip ON rate_limit_stats(source_ip);

CREATE INDEX IF NOT EXISTS idx_custom_rules_tenant_active ON custom_rules(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_custom_rules_type ON custom_rules(rule_type);
