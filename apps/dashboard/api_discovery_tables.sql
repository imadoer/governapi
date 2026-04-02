-- Create api_discovery_results table for discovery scans
CREATE TABLE IF NOT EXISTS api_discovery_results (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  target_domain VARCHAR(255) NOT NULL,
  scan_type VARCHAR(100) DEFAULT 'comprehensive',
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  discovered_endpoints JSONB,
  summary JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Create apis table for API catalog management  
CREATE TABLE IF NOT EXISTS apis (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(2000) NOT NULL,
  method VARCHAR(10) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'discovered', 'deprecated', 'inactive'
  discovered_via VARCHAR(100), -- 'api_discovery', 'manual', 'import'
  response_schema JSONB,
  request_schema JSONB,
  tags JSONB,
  version VARCHAR(50),
  authentication_type VARCHAR(100),
  rate_limit INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, url, method)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_discovery_tenant_domain ON api_discovery_results(tenant_id, target_domain);
CREATE INDEX IF NOT EXISTS idx_api_discovery_status ON api_discovery_results(status);
CREATE INDEX IF NOT EXISTS idx_api_discovery_created_at ON api_discovery_results(created_at);

CREATE INDEX IF NOT EXISTS idx_apis_tenant_id ON apis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_apis_status ON apis(status);
CREATE INDEX IF NOT EXISTS idx_apis_method ON apis(method);
CREATE INDEX IF NOT EXISTS idx_apis_discovered_via ON apis(discovered_via);
CREATE INDEX IF NOT EXISTS idx_apis_url_method ON apis(url, method);
