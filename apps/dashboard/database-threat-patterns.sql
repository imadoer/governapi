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
