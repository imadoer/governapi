-- Custom Rules Engine Tables
CREATE TABLE IF NOT EXISTS custom_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  rule_type VARCHAR(50) NOT NULL,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 100,
  triggered_count INTEGER DEFAULT 0,
  last_triggered TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Compliance Reports Table
CREATE TABLE IF NOT EXISTS compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  framework_id VARCHAR(50) NOT NULL,
  framework_name VARCHAR(255) NOT NULL,
  overall_score INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL,
  assessment_date TIMESTAMP NOT NULL,
  next_assessment TIMESTAMP,
  findings JSONB,
  recommendations TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Webhook Events Table
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  webhook_id UUID REFERENCES webhook_configurations(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  retry_count INTEGER DEFAULT 0,
  last_attempt TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- API Discovery Results Table
CREATE TABLE IF NOT EXISTS api_discovery_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  endpoint_id UUID REFERENCES api_endpoints(id) ON DELETE CASCADE,
  discovery_method VARCHAR(100) NOT NULL,
  security_score INTEGER,
  vulnerabilities JSONB,
  compliance_issues JSONB,
  recommendations TEXT[],
  discovered_at TIMESTAMP DEFAULT NOW()
);

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  endpoint_id UUID REFERENCES api_endpoints(id),
  timestamp TIMESTAMP DEFAULT NOW(),
  response_time_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,
  source_ip VARCHAR(45),
  user_agent TEXT
);

-- Bot Detection Events Table
CREATE TABLE IF NOT EXISTS bot_detection_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  source_ip VARCHAR(45) NOT NULL,
  user_agent TEXT,
  bot_type VARCHAR(100),
  confidence INTEGER,
  risk_level VARCHAR(20),
  blocked BOOLEAN DEFAULT false,
  evidence JSONB,
  detected_at TIMESTAMP DEFAULT NOW()
);

-- Threat Intelligence Cache Table
CREATE TABLE IF NOT EXISTS threat_intelligence_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  indicator_type VARCHAR(50) NOT NULL, -- IP, domain, hash, etc
  indicator_value VARCHAR(255) NOT NULL,
  threat_type VARCHAR(100),
  severity VARCHAR(20),
  confidence INTEGER,
  source VARCHAR(100),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, indicator_type, indicator_value)
);

-- Enterprise Analytics Table
CREATE TABLE IF NOT EXISTS enterprise_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  metric_type VARCHAR(100) NOT NULL,
  metric_name VARCHAR(255) NOT NULL,
  metric_value NUMERIC,
  dimensions JSONB,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_rules_tenant_active ON custom_rules(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_tenant_framework ON compliance_reports(tenant_id, framework_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_tenant_status ON webhook_events(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_api_discovery_tenant ON api_discovery_results(tenant_id, discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_tenant_time ON performance_metrics(tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_bot_detection_tenant_time ON bot_detection_events(tenant_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_threat_intel_cache_tenant_expires ON threat_intelligence_cache(tenant_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_enterprise_analytics_tenant_type ON enterprise_analytics(tenant_id, metric_type, recorded_at DESC);

-- Update extended database functions
CREATE OR REPLACE FUNCTION update_tenant_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tenants 
    SET updated_at = NOW() 
    WHERE id = NEW.tenant_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update tenant activity
CREATE TRIGGER trigger_update_tenant_activity_requests
    AFTER INSERT ON customer_requests
    FOR EACH ROW EXECUTE FUNCTION update_tenant_last_activity();

CREATE TRIGGER trigger_update_tenant_activity_threats
    AFTER INSERT ON threat_events
    FOR EACH ROW EXECUTE FUNCTION update_tenant_last_activity();

CREATE TRIGGER trigger_update_tenant_activity_scans
    AFTER INSERT ON security_scans
    FOR EACH ROW EXECUTE FUNCTION update_tenant_last_activity();
