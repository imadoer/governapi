-- ========================================
-- SECURITY SCANNER DATABASE SCHEMA FIX
-- ========================================

DROP TABLE IF EXISTS vulnerabilities CASCADE;
DROP TABLE IF EXISTS scan_queue CASCADE;
DROP TABLE IF EXISTS scan_results CASCADE;
DROP TABLE IF EXISTS security_scans CASCADE;

-- 1. SECURITY SCANS TABLE
CREATE TABLE security_scans (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  url VARCHAR(2000) NOT NULL,
  target VARCHAR(2000),
  scan_type VARCHAR(100) NOT NULL DEFAULT 'comprehensive',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  security_score INTEGER,
  vulnerability_count INTEGER DEFAULT 0,
  scan_duration INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_by VARCHAR(255)
);

-- 2. SCAN RESULTS TABLE
CREATE TABLE scan_results (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  scan_id INTEGER REFERENCES security_scans(id) ON DELETE CASCADE,
  target VARCHAR(2000) NOT NULL,
  scan_type VARCHAR(100) NOT NULL DEFAULT 'security',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  security_score INTEGER,
  analysis JSONB,
  preliminary_results JSONB,
  findings JSONB,
  recommendations JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- 3. SCAN QUEUE TABLE
CREATE TABLE scan_queue (
  id SERIAL PRIMARY KEY,
  scan_id INTEGER NOT NULL,
  tenant_id INTEGER NOT NULL,
  scan_type VARCHAR(100) DEFAULT 'security',
  priority VARCHAR(50) DEFAULT 'normal',
  status VARCHAR(50) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

-- 4. VULNERABILITIES TABLE
CREATE TABLE vulnerabilities (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  scan_id INTEGER REFERENCES security_scans(id) ON DELETE CASCADE,
  vulnerability_type VARCHAR(200) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  cwe_id VARCHAR(50),
  cvss_score DECIMAL(3,1),
  affected_url VARCHAR(2000),
  affected_parameter VARCHAR(500),
  evidence TEXT,
  remediation TEXT,
  status VARCHAR(50) DEFAULT 'open',
  acknowledged_by VARCHAR(255),
  acknowledged_at TIMESTAMP,
  resolved_by VARCHAR(255),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_security_scans_tenant_id ON security_scans(tenant_id);
CREATE INDEX idx_security_scans_status ON security_scans(status);
CREATE INDEX idx_security_scans_created_at ON security_scans(created_at DESC);
CREATE INDEX idx_scan_results_tenant_id ON scan_results(tenant_id);
CREATE INDEX idx_scan_results_scan_id ON scan_results(scan_id);
CREATE INDEX idx_scan_queue_status ON scan_queue(status);
CREATE INDEX idx_vulnerabilities_tenant_id ON vulnerabilities(tenant_id);
CREATE INDEX idx_vulnerabilities_scan_id ON vulnerabilities(scan_id);
CREATE INDEX idx_vulnerabilities_severity ON vulnerabilities(severity);

-- TRIGGER TO SYNC url AND target FIELDS
CREATE OR REPLACE FUNCTION sync_security_scan_url_target()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.url IS NOT NULL AND NEW.target IS NULL THEN
    NEW.target := NEW.url;
  ELSIF NEW.target IS NOT NULL AND NEW.url IS NULL THEN
    NEW.url := NEW.target;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_security_scan_fields
BEFORE INSERT OR UPDATE ON security_scans
FOR EACH ROW
EXECUTE FUNCTION sync_security_scan_url_target();
