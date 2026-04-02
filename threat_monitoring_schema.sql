-- Threat monitoring tables for PostgreSQL
CREATE TABLE IF NOT EXISTS blocked_ips (
  ip VARCHAR(45) PRIMARY KEY,
  reason TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  duration_ms INTEGER NOT NULL,
  threat_level VARCHAR(20) DEFAULT 'MEDIUM',
  threats JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS security_events (
  id SERIAL PRIMARY KEY,
  ip VARCHAR(45) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  threat_level VARCHAR(20) NOT NULL,
  details JSONB,
  user_agent TEXT,
  target_url TEXT,
  blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blocked_ips_expires ON blocked_ips(expires_at);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_created ON blocked_ips(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
