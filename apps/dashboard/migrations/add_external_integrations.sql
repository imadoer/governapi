-- External integrations table for customer API keys/credentials
CREATE TABLE IF NOT EXISTS external_integrations (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  integration_type VARCHAR(50) NOT NULL, -- aws, azure, gcp, stripe, etc
  integration_name VARCHAR(100) NOT NULL,
  credentials JSONB NOT NULL, -- encrypted API keys/secrets
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (tenant_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_external_integrations_tenant ON external_integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_external_integrations_type ON external_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_external_integrations_active ON external_integrations(is_active);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_external_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_external_integrations_updated_at
    BEFORE UPDATE ON external_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_external_integrations_updated_at();
