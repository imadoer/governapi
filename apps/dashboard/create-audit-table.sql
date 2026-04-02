CREATE TABLE IF NOT EXISTS ip_block_audit (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  ip_address INET NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('block', 'unblock')),
  performed_by VARCHAR(255),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_tenant_created (tenant_id, created_at DESC)
);
