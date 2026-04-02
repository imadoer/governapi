-- Create comprehensive api_usage table for real-time performance monitoring
CREATE TABLE IF NOT EXISTS api_usage (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  endpoint VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL,
  response_time INTEGER NOT NULL, -- milliseconds
  status_code INTEGER NOT NULL,
  request_size INTEGER DEFAULT 0, -- bytes
  response_size INTEGER DEFAULT 0, -- bytes
  user_agent TEXT,
  ip_address INET,
  request_headers JSONB,
  response_headers JSONB,
  error_message TEXT,
  trace_id VARCHAR(100),
  span_id VARCHAR(100),
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create performance_metrics table for aggregated statistics
CREATE TABLE IF NOT EXISTS performance_metrics (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  endpoint VARCHAR(500),
  metric_type VARCHAR(50), -- 'response_time', 'throughput', 'error_rate'
  metric_value DECIMAL(10,2),
  percentile VARCHAR(10), -- 'p50', 'p95', 'p99'
  aggregation_period VARCHAR(20), -- 'hour', 'day', 'week'
  time_bucket TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create comprehensive indexes for performance queries
CREATE INDEX IF NOT EXISTS idx_api_usage_tenant_timestamp ON api_usage(tenant_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint_timestamp ON api_usage(endpoint, timestamp);
CREATE INDEX IF NOT EXISTS idx_api_usage_response_time ON api_usage(response_time);
CREATE INDEX IF NOT EXISTS idx_api_usage_status_code ON api_usage(status_code);
CREATE INDEX IF NOT EXISTS idx_api_usage_method ON api_usage(method);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_tenant_time ON performance_metrics(tenant_id, time_bucket);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_endpoint ON performance_metrics(endpoint, metric_type);
