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
