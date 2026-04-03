-- GovernAPI Consolidated Schema
-- All tables needed for the application, in dependency order
-- PostgreSQL 14+ compatible

-- ============================================================
-- 1. CORE TENANT / COMPANY TABLES
-- ============================================================

-- Legacy tenants table (referenced by many older SQL files)
CREATE TABLE IF NOT EXISTS tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  api_key VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Companies (UUID-based, used by auth flow)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  email VARCHAR(255),
  subscription_plan VARCHAR(100) DEFAULT 'starter',
  subscription_status VARCHAR(50) DEFAULT 'active',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  billing_email VARCHAR(255),
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,
  api_key VARCHAR(255) UNIQUE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. USER AUTHENTICATION
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  email_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_permissions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(100) NOT NULL,
  granted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_activity_log (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  tenant_id VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 3. API MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS apis (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(2000) NOT NULL,
  method VARCHAR(10) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  discovered_via VARCHAR(100),
  response_schema JSONB,
  request_schema JSONB,
  tags JSONB,
  version VARCHAR(50),
  authentication_type VARCHAR(100),
  rate_limit INTEGER,
  import_id INTEGER,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_imports (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  name VARCHAR(255),
  source_url TEXT,
  base_url TEXT,
  spec_version VARCHAR(50),
  import_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  endpoints_count INTEGER DEFAULT 0,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 4. API KEY MANAGEMENT (SHA256 hashed keys)
-- ============================================================

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
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_key_rotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  old_key_hash VARCHAR(255) NOT NULL,
  new_key_hash VARCHAR(255) NOT NULL,
  rotation_reason VARCHAR(100),
  rotated_by UUID REFERENCES users(id),
  rotated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_key_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  response_code INTEGER,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 5. THREAT DETECTION & SECURITY
-- ============================================================

CREATE TABLE IF NOT EXISTS threat_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name VARCHAR(255) NOT NULL,
  pattern_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium',
  pattern_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS threat_events (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  event_type VARCHAR(100) NOT NULL,
  source_ip VARCHAR(45),
  severity VARCHAR(20) DEFAULT 'medium',
  description TEXT,
  blocked BOOLEAN DEFAULT false,
  block_duration INTEGER DEFAULT 300,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS threat_events_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255),
  api_id INTEGER,
  threat_pattern_id UUID REFERENCES threat_patterns(id),
  event_type VARCHAR(100) NOT NULL,
  source_ip INET NOT NULL,
  target_endpoint VARCHAR(500),
  user_agent TEXT,
  request_path VARCHAR(500),
  request_method VARCHAR(10),
  payload_sample TEXT,
  risk_score INTEGER NOT NULL,
  confidence_level REAL NOT NULL,
  detection_method VARCHAR(50),
  action_taken VARCHAR(50) DEFAULT 'logged',
  blocked BOOLEAN DEFAULT false,
  false_positive BOOLEAN DEFAULT false,
  metadata JSONB,
  detected_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255),
  api_id INTEGER,
  baseline_type VARCHAR(50) NOT NULL,
  time_window VARCHAR(20) NOT NULL,
  baseline_value REAL NOT NULL,
  deviation_threshold REAL NOT NULL,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, api_id, baseline_type, time_window)
);

CREATE TABLE IF NOT EXISTS threat_intelligence (
  id SERIAL PRIMARY KEY,
  ip_address VARCHAR(45),
  threat_type VARCHAR(100),
  severity VARCHAR(20),
  source VARCHAR(100),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 6. IP BLOCKING & RATE LIMITING
-- ============================================================

CREATE TABLE IF NOT EXISTS ip_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255),
  ip_address INET NOT NULL,
  reason TEXT NOT NULL,
  blocked_until TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ip_block_audit (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  ip_address INET NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('block', 'unblock')),
  performed_by VARCHAR(255),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blocked_ips (
  ip VARCHAR(45) PRIMARY KEY,
  reason TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  duration_ms INTEGER NOT NULL,
  threat_level VARCHAR(20) DEFAULT 'MEDIUM',
  threats JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS blocked_threats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255),
  ip_address VARCHAR(45) NOT NULL,
  threat_type VARCHAR(100),
  block_reason TEXT,
  blocked_until TIMESTAMP,
  blocked_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rate_limit_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255),
  requests_per_minute INTEGER DEFAULT 100,
  requests_per_hour INTEGER DEFAULT 1000,
  requests_per_day INTEGER DEFAULT 10000,
  burst_limit INTEGER DEFAULT 200,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rate_limit_log (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  source_ip INET,
  endpoint VARCHAR(500),
  is_rate_limited BOOLEAN DEFAULT false,
  requests_per_minute INTEGER DEFAULT 0,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rate_limit_rules (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  rule_name VARCHAR(255) NOT NULL,
  endpoint_pattern VARCHAR(500) NOT NULL,
  requests_per_minute INTEGER NOT NULL,
  requests_per_hour INTEGER,
  burst_limit INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rate_limit_violations (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  source_ip INET,
  endpoint VARCHAR(500),
  requests_attempted INTEGER,
  limit_exceeded INTEGER,
  blocked_at TIMESTAMP DEFAULT NOW(),
  user_agent TEXT,
  violation_type VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS rate_limit_stats (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  source_ip INET,
  endpoint VARCHAR(500),
  is_rate_limited BOOLEAN DEFAULT false,
  requests_per_minute INTEGER DEFAULT 0,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 7. REQUEST TRACKING
-- ============================================================

CREATE TABLE IF NOT EXISTS api_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255),
  ip_address INET NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255),
  ip_address INET NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  response_time INTEGER,
  user_agent TEXT,
  request_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_usage (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  endpoint VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL,
  response_time INTEGER NOT NULL,
  status_code INTEGER NOT NULL,
  request_size INTEGER DEFAULT 0,
  response_size INTEGER DEFAULT 0,
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

CREATE TABLE IF NOT EXISTS request_analyses (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  request_url TEXT,
  request_method VARCHAR(10),
  request_headers JSONB,
  analysis_result JSONB,
  risk_score INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS live_traffic (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  endpoint VARCHAR(500),
  method VARCHAR(10),
  status_code INTEGER,
  response_time INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS traffic_analysis (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  endpoint VARCHAR(500),
  method VARCHAR(10),
  status_code INTEGER,
  response_time INTEGER,
  ip_address INET,
  country VARCHAR(100),
  threat_score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 8. SECURITY SCANNING
-- ============================================================

CREATE TABLE IF NOT EXISTS security_scans (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  url TEXT,
  target TEXT,
  target_url TEXT,
  scan_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  security_score INTEGER,
  vulnerabilities_found INTEGER DEFAULT 0,
  scan_results JSONB,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scan_results (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  scan_id INTEGER,
  target TEXT,
  target_endpoint TEXT,
  scan_type VARCHAR(50),
  priority VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(50) DEFAULT 'pending',
  security_score INTEGER,
  vulnerabilities_found INTEGER DEFAULT 0,
  risk_score INTEGER,
  analysis JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scan_queue (
  id SERIAL PRIMARY KEY,
  scan_id INTEGER,
  tenant_id VARCHAR(255),
  scan_type VARCHAR(50),
  priority VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(50) DEFAULT 'pending',
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scan_audit_log (
  id SERIAL PRIMARY KEY,
  scan_id INTEGER,
  tenant_id VARCHAR(255),
  action VARCHAR(100),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vulnerabilities (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  scan_id INTEGER,
  title VARCHAR(500),
  description TEXT,
  severity VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'open',
  owasp_category VARCHAR(100),
  endpoint VARCHAR(500),
  evidence TEXT,
  remediation TEXT,
  cvss_score DECIMAL(3,1),
  discovered_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheduled_scans (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  target_url VARCHAR(2000),
  target TEXT,
  scan_type VARCHAR(100) DEFAULT 'security',
  frequency VARCHAR(50) DEFAULT 'daily',
  is_active BOOLEAN DEFAULT true,
  next_run TIMESTAMP,
  last_run TIMESTAMP,
  enabled BOOLEAN DEFAULT true,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 9. WEBHOOKS
-- ============================================================

CREATE TABLE IF NOT EXISTS webhooks (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(2000) NOT NULL,
  events JSONB NOT NULL,
  type VARCHAR(100) DEFAULT 'generic',
  enabled BOOLEAN DEFAULT true,
  secret VARCHAR(255),
  secret_key VARCHAR(255),
  headers JSONB,
  timeout_seconds INTEGER DEFAULT 30,
  retry_count INTEGER DEFAULT 3,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id SERIAL PRIMARY KEY,
  webhook_id INTEGER REFERENCES webhooks(id) ON DELETE CASCADE,
  event VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  response_code INTEGER,
  response_body TEXT,
  response_headers JSONB,
  response_time INTEGER,
  error_message TEXT,
  attempt_count INTEGER DEFAULT 1,
  next_retry_at TIMESTAMP,
  next_retry TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  webhook_id INTEGER REFERENCES webhooks(id) ON DELETE SET NULL,
  event_type VARCHAR(100),
  payload_summary VARCHAR(500),
  success BOOLEAN,
  response_code INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id SERIAL PRIMARY KEY,
  event_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  payload_schema JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 10. COMPLIANCE
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_frameworks (
  id SERIAL PRIMARY KEY,
  framework_name VARCHAR(100) NOT NULL UNIQUE,
  version VARCHAR(50),
  description TEXT,
  category VARCHAR(100),
  industry VARCHAR(100),
  mandatory BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_controls (
  id SERIAL PRIMARY KEY,
  framework_id INTEGER REFERENCES compliance_frameworks(id),
  control_id VARCHAR(100) NOT NULL,
  control_name VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  risk_level VARCHAR(20) DEFAULT 'MEDIUM',
  testing_frequency VARCHAR(50) DEFAULT 'ANNUAL',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_check_results (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  framework_id INTEGER REFERENCES compliance_frameworks(id),
  control_id INTEGER REFERENCES compliance_controls(id),
  status VARCHAR(50) DEFAULT 'pending',
  compliance_percentage DECIMAL(5,2),
  last_assessment TIMESTAMP,
  next_assessment TIMESTAMP,
  findings_count INTEGER DEFAULT 0,
  assessed_by VARCHAR(255),
  evidence_url VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_findings (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  framework_name VARCHAR(100),
  framework_id INTEGER,
  control_id VARCHAR(100),
  control_name VARCHAR(255),
  finding_type VARCHAR(100),
  severity VARCHAR(20),
  status VARCHAR(50) DEFAULT 'open',
  description TEXT,
  remediation_steps TEXT,
  assigned_to VARCHAR(255),
  discovered_at TIMESTAMP DEFAULT NOW(),
  due_date TIMESTAMP,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_audits (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  framework_id INTEGER REFERENCES compliance_frameworks(id),
  framework_name VARCHAR(100),
  audit_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'planned',
  conducted_by VARCHAR(255),
  audit_firm VARCHAR(255),
  scope TEXT,
  findings_count INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  completion_date TIMESTAMP,
  report_url VARCHAR(500),
  executive_summary TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255),
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

CREATE TABLE IF NOT EXISTS compliance_attestations (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  framework_id INTEGER REFERENCES compliance_frameworks(id),
  control_id INTEGER REFERENCES compliance_controls(id),
  attestation_type VARCHAR(50) NOT NULL DEFAULT 'quarterly',
  attestation_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  control_owner_id VARCHAR(255) NOT NULL,
  control_owner_name VARCHAR(255) NOT NULL,
  control_owner_email VARCHAR(255),
  attestation_statement TEXT,
  evidence_reviewed JSONB DEFAULT '[]',
  comments TEXT,
  due_date TIMESTAMP NOT NULL,
  attested_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_evidence_enhanced (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  framework_id INTEGER REFERENCES compliance_frameworks(id),
  control_id INTEGER REFERENCES compliance_controls(id),
  evidence_type VARCHAR(100),
  title VARCHAR(500),
  description TEXT,
  file_url VARCHAR(1000),
  status VARCHAR(50) DEFAULT 'pending',
  uploaded_by VARCHAR(255),
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_audit_readiness (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  framework_id INTEGER,
  framework_name VARCHAR(100),
  readiness_score INTEGER,
  evidence_score INTEGER,
  control_score INTEGER,
  attestation_score INTEGER,
  gap_count INTEGER,
  findings JSONB,
  assessed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_audit_log (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  event_type VARCHAR(100),
  event_hash VARCHAR(255) UNIQUE,
  actor VARCHAR(255),
  action VARCHAR(255),
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_policies (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  policy_type VARCHAR(100),
  rules JSONB,
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_api_violations (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  policy_id INTEGER,
  endpoint VARCHAR(500),
  violation_type VARCHAR(100),
  severity VARCHAR(20),
  status VARCHAR(50) DEFAULT 'open',
  description TEXT,
  evidence JSONB,
  resolved_at TIMESTAMP,
  resolved_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_remediation_tasks (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  violation_id INTEGER,
  finding_id INTEGER,
  title VARCHAR(500),
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'open',
  assigned_to VARCHAR(255),
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_vendors (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  risk_level VARCHAR(20),
  status VARCHAR(50) DEFAULT 'active',
  last_assessment TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 11. SECURITY POLICIES
-- ============================================================

CREATE TABLE IF NOT EXISTS security_policies (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  policy_type VARCHAR(100),
  rules JSONB,
  severity VARCHAR(20) DEFAULT 'medium',
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS policy_violations (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  policy_id INTEGER REFERENCES security_policies(id) ON DELETE CASCADE,
  endpoint VARCHAR(500),
  description TEXT,
  severity VARCHAR(20),
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS violations (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  violation_type VARCHAR(100),
  severity VARCHAR(20),
  description TEXT,
  endpoint VARCHAR(500),
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_reports (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  name VARCHAR(255),
  report_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  parameters JSONB,
  report_data JSONB,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_generation_queue (
  id SERIAL PRIMARY KEY,
  report_id INTEGER,
  tenant_id VARCHAR(255),
  priority VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 12. BOT DETECTION
-- ============================================================

CREATE TABLE IF NOT EXISTS bot_detection_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255),
  source_ip VARCHAR(45) NOT NULL,
  user_agent TEXT,
  bot_type VARCHAR(100),
  confidence INTEGER,
  risk_level VARCHAR(20),
  blocked BOOLEAN DEFAULT false,
  evidence JSONB,
  detected_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bot_detection_log (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  bot_score INTEGER,
  is_bot BOOLEAN DEFAULT false,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bot_rules (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(100),
  conditions JSONB NOT NULL,
  action VARCHAR(50) DEFAULT 'block',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 50,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bot_rule_executions (
  id SERIAL PRIMARY KEY,
  rule_id INTEGER,
  tenant_id VARCHAR(255),
  matched BOOLEAN DEFAULT false,
  action_taken VARCHAR(50),
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bot_whitelist (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  bot_name VARCHAR(255),
  user_agent_pattern TEXT,
  category VARCHAR(100),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bot_challenges (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  challenge_type VARCHAR(50),
  token TEXT,
  ip_address VARCHAR(45),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS js_challenge_tokens (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  token TEXT UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- ============================================================
-- 13. INTEGRATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS external_integrations (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  integration_type VARCHAR(50) NOT NULL,
  integration_name VARCHAR(100) NOT NULL,
  credentials JSONB,
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integration_metrics (
  id SERIAL PRIMARY KEY,
  integration_id INTEGER REFERENCES external_integrations(id) ON DELETE CASCADE,
  tenant_id VARCHAR(255),
  metric_type VARCHAR(100),
  metric_value NUMERIC,
  open_vulnerabilities INTEGER DEFAULT 0,
  dependency_alerts INTEGER DEFAULT 0,
  stale_tickets INTEGER DEFAULT 0,
  security_mentions INTEGER DEFAULT 0,
  records_fetched INTEGER DEFAULT 0,
  sync_status VARCHAR(50) DEFAULT 'never',
  last_sync TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_intelligence_scores (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  security_score INTEGER,
  governance_score INTEGER,
  compliance_score INTEGER,
  trust_index INTEGER,
  calculated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 14. ENTERPRISE FEATURES
-- ============================================================

CREATE TABLE IF NOT EXISTS enterprise_settings (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) UNIQUE,
  sso_enabled BOOLEAN DEFAULT false,
  sso_provider VARCHAR(100),
  sso_config JSONB,
  api_rate_limit INTEGER DEFAULT 1000,
  max_users INTEGER DEFAULT 100,
  data_retention_days INTEGER DEFAULT 365,
  compliance_reporting BOOLEAN DEFAULT true,
  custom_branding JSONB,
  audit_logging BOOLEAN DEFAULT true,
  ip_whitelisting JSONB,
  advanced_analytics BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_rules (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(100),
  description TEXT,
  priority VARCHAR(20) DEFAULT 'MEDIUM',
  action VARCHAR(50) DEFAULT 'alert',
  conditions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  triggered_count INTEGER DEFAULT 0,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  rule_id INTEGER,
  alert_type VARCHAR(100),
  alert_source VARCHAR(100),
  source_id VARCHAR(255),
  severity VARCHAR(20) DEFAULT 'MEDIUM',
  status VARCHAR(50) DEFAULT 'open',
  title VARCHAR(500) NOT NULL,
  description TEXT,
  source_data JSONB,
  metadata JSONB,
  acknowledged_by VARCHAR(255),
  acknowledged_at TIMESTAMP,
  resolved_at TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_rules (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  rule_name VARCHAR(255) NOT NULL,
  conditions JSONB NOT NULL,
  alert_type VARCHAR(100),
  severity VARCHAR(20) DEFAULT 'MEDIUM',
  is_active BOOLEAN DEFAULT true,
  notification_channels JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS classifications (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  data_type VARCHAR(100),
  input_data TEXT,
  classification VARCHAR(100),
  confidence INTEGER,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS framework_interest (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  framework_name VARCHAR(100),
  interest_level VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS performance_metrics (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  endpoint VARCHAR(500),
  metric_type VARCHAR(50),
  metric_value DECIMAL(10,2),
  percentile VARCHAR(10),
  aggregation_period VARCHAR(20),
  time_bucket TIMESTAMP,
  method VARCHAR(10),
  response_time INTEGER,
  status_code INTEGER,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enterprise_analytics (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  metric_type VARCHAR(100) NOT NULL,
  metric_name VARCHAR(255) NOT NULL,
  metric_value NUMERIC,
  dimensions JSONB,
  recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS threat_intelligence_cache (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  indicator_type VARCHAR(50) NOT NULL,
  indicator_value VARCHAR(255) NOT NULL,
  threat_type VARCHAR(100),
  severity VARCHAR(20),
  confidence INTEGER,
  source VARCHAR(100),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, indicator_type, indicator_value)
);

CREATE TABLE IF NOT EXISTS security_events (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  ip VARCHAR(45),
  ip_address INET,
  event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium',
  threat_level VARCHAR(20),
  description TEXT,
  details JSONB,
  user_agent TEXT,
  target_url TEXT,
  user_id UUID,
  endpoint VARCHAR(255),
  metadata JSONB,
  blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_settings (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL UNIQUE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_discovery_results (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  target_domain VARCHAR(255),
  scan_type VARCHAR(100) DEFAULT 'comprehensive',
  status VARCHAR(50) DEFAULT 'pending',
  discovered_endpoints JSONB,
  summary JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS threat_blocking_rules (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(100),
  conditions JSONB NOT NULL,
  action VARCHAR(50) DEFAULT 'block',
  priority INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  triggered_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_api_keys (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  api_key VARCHAR(64) UNIQUE NOT NULL,
  key_name VARCHAR(255) NOT NULL DEFAULT 'Default Key',
  daily_limit INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_requests (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255),
  api_key VARCHAR(64),
  request_url TEXT NOT NULL,
  method VARCHAR(10) NOT NULL,
  security_score INTEGER,
  threat_detected BOOLEAN DEFAULT false,
  threat_type VARCHAR(100),
  response_time_ms INTEGER,
  source_ip VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 15. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_active ON api_keys(tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_threat_events_enhanced_tenant ON threat_events_enhanced(tenant_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_threat_events_enhanced_risk ON threat_events_enhanced(risk_score, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_threat_events_enhanced_source ON threat_events_enhanced(source_ip, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_threat_events_created ON threat_events(created_at);

CREATE INDEX IF NOT EXISTS idx_ip_blocks_active ON ip_blocks(ip_address, blocked_until);
CREATE INDEX IF NOT EXISTS idx_ip_block_audit_tenant ON ip_block_audit(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_requests_tenant_time ON api_requests(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_request_logs_tenant_time ON request_logs(tenant_id, created_at);

CREATE INDEX IF NOT EXISTS idx_api_usage_tenant_timestamp ON api_usage(tenant_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint_timestamp ON api_usage(endpoint, timestamp);

CREATE INDEX IF NOT EXISTS idx_security_scans_tenant ON security_scans(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_results_tenant ON scan_results(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_tenant ON vulnerabilities(tenant_id, severity);

CREATE INDEX IF NOT EXISTS idx_webhooks_tenant ON webhooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_check_results_tenant ON compliance_check_results(tenant_id, framework_id);
CREATE INDEX IF NOT EXISTS idx_compliance_findings_tenant ON compliance_findings(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_bot_detection_events_tenant ON bot_detection_events(tenant_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_rules_tenant ON bot_rules(tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_external_integrations_tenant ON external_integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_integration_metrics_integration ON integration_metrics(integration_id);

CREATE INDEX IF NOT EXISTS idx_alerts_tenant_status ON alerts(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_custom_rules_tenant ON custom_rules(tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_apis_tenant ON apis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_apis_status ON apis(status);

CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);

CREATE INDEX IF NOT EXISTS idx_companies_subscription ON companies(subscription_plan, subscription_status);
CREATE INDEX IF NOT EXISTS idx_rate_limit_log_tenant ON rate_limit_log(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_rules_tenant ON rate_limit_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_tenant ON rate_limit_violations(tenant_id, blocked_at);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_tenant ON performance_metrics(tenant_id, time_bucket);
CREATE INDEX IF NOT EXISTS idx_enterprise_analytics_tenant ON enterprise_analytics(tenant_id, metric_type);
CREATE INDEX IF NOT EXISTS idx_threat_intel_cache_tenant ON threat_intelligence_cache(tenant_id, expires_at);

-- ============================================================
-- 16. SEED DATA
-- ============================================================

-- Insert compliance frameworks
INSERT INTO compliance_frameworks (framework_name, version, description, category, industry, mandatory) VALUES
('SOX', '2023.1', 'Sarbanes-Oxley Act', 'Financial', 'Public Companies', true),
('GDPR', '2023.2', 'General Data Protection Regulation', 'Privacy', 'EU Operations', true),
('CCPA', '2023.1', 'California Consumer Privacy Act', 'Privacy', 'California Operations', true),
('HIPAA', '2023.1', 'Health Insurance Portability and Accountability Act', 'Healthcare', 'Healthcare', true),
('PCI DSS', '4.0', 'Payment Card Industry Data Security Standard', 'Payment', 'Payment Processing', true),
('ISO 27001', '2022', 'Information Security Management System', 'Security', 'All', false),
('NIST CSF', '2.0', 'NIST Cybersecurity Framework', 'Security', 'All', false),
('SOC 2', '2023', 'Service Organization Control 2', 'Security', 'SaaS/Cloud', false),
('CIS Controls', 'v8', 'Center for Internet Security Controls', 'Security', 'All', false),
('FedRAMP', '2023', 'Federal Risk and Authorization Management', 'Government', 'Cloud Providers', false)
ON CONFLICT (framework_name) DO NOTHING;

-- Insert webhook event types
INSERT INTO webhook_events (event_name, description) VALUES
('security.scan.completed', 'Security scan completed'),
('security.threat.detected', 'New threat detected'),
('security.vulnerability.found', 'Vulnerability discovered'),
('compliance.violation.detected', 'Compliance violation found'),
('performance.threshold.exceeded', 'Performance threshold exceeded'),
('api.endpoint.discovered', 'New API endpoint discovered'),
('policy.violation.detected', 'Policy violation detected')
ON CONFLICT (event_name) DO NOTHING;

-- Insert demo company
INSERT INTO companies (company_name, api_key, subscription_plan, subscription_status)
VALUES ('Demo Enterprise', 'gapi_demo_key_do_not_use', 'enterprise', 'active')
ON CONFLICT (api_key) DO NOTHING;
