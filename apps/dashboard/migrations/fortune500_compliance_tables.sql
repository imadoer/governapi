-- ============================================================================
-- FORTUNE 500 COMPLIANCE HUB - DATABASE MIGRATION
-- Complete schema for enterprise-grade compliance management
-- Run this against your Supabase/PostgreSQL database
-- ============================================================================

-- ============================================================================
-- 1. ATTESTATION SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_attestations (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
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
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255),
  
  CONSTRAINT valid_attestation_status CHECK (attestation_status IN ('pending', 'attested', 'rejected', 'expired', 'overdue'))
);

CREATE INDEX IF NOT EXISTS idx_attestations_tenant ON compliance_attestations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attestations_status ON compliance_attestations(attestation_status);
CREATE INDEX IF NOT EXISTS idx_attestations_due_date ON compliance_attestations(due_date);

-- ============================================================================
-- 2. ATTESTATION CAMPAIGNS
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_attestation_campaigns (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  
  campaign_name VARCHAR(255) NOT NULL,
  campaign_type VARCHAR(50) NOT NULL DEFAULT 'quarterly',
  description TEXT,
  
  framework_ids JSONB DEFAULT '[]',
  control_count INTEGER DEFAULT 0,
  
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  
  total_attestations INTEGER DEFAULT 0,
  completed_attestations INTEGER DEFAULT 0,
  
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255)
);

-- ============================================================================
-- 3. REMEDIATION WORKFLOW ENGINE
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_remediation_tasks (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  
  finding_id INTEGER REFERENCES compliance_findings(id),
  control_id INTEGER REFERENCES compliance_controls(id),
  framework_id INTEGER REFERENCES compliance_frameworks(id),
  violation_id INTEGER,
  
  title VARCHAR(500) NOT NULL,
  description TEXT,
  remediation_steps TEXT,
  
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  severity VARCHAR(20) NOT NULL DEFAULT 'medium',
  
  assigned_to VARCHAR(255),
  assigned_to_name VARCHAR(255),
  assigned_to_email VARCHAR(255),
  escalation_contact VARCHAR(255),
  
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  
  sla_hours INTEGER DEFAULT 72,
  sla_deadline TIMESTAMP,
  sla_breached BOOLEAN DEFAULT false,
  
  progress_percentage INTEGER DEFAULT 0,
  
  verification_required BOOLEAN DEFAULT true,
  verified_by VARCHAR(255),
  verified_at TIMESTAMP,
  verification_notes TEXT,
  
  external_ticket_id VARCHAR(255),
  external_ticket_url VARCHAR(500),
  external_system VARCHAR(100),
  
  due_date TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_remediation_tenant ON compliance_remediation_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_remediation_status ON compliance_remediation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_remediation_priority ON compliance_remediation_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_remediation_sla ON compliance_remediation_tasks(sla_deadline) WHERE sla_breached = false;

CREATE TABLE IF NOT EXISTS compliance_remediation_comments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES compliance_remediation_tasks(id) ON DELETE CASCADE,
  
  comment_type VARCHAR(50) DEFAULT 'comment',
  content TEXT NOT NULL,
  
  author_id VARCHAR(255) NOT NULL,
  author_name VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 4. VENDOR/THIRD-PARTY RISK MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_vendors (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  
  vendor_name VARCHAR(255) NOT NULL,
  vendor_type VARCHAR(100),
  description TEXT,
  
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  
  website VARCHAR(500),
  
  risk_tier VARCHAR(20) DEFAULT 'medium',
  risk_score INTEGER DEFAULT 50,
  
  data_shared JSONB DEFAULT '[]',
  data_classification VARCHAR(50),
  
  integration_type VARCHAR(100),
  api_endpoints JSONB DEFAULT '[]',
  
  contract_start_date DATE,
  contract_end_date DATE,
  contract_value DECIMAL(15,2),
  
  soc2_certified BOOLEAN DEFAULT false,
  iso27001_certified BOOLEAN DEFAULT false,
  hipaa_compliant BOOLEAN DEFAULT false,
  pci_compliant BOOLEAN DEFAULT false,
  gdpr_compliant BOOLEAN DEFAULT false,
  
  last_assessment_date TIMESTAMP,
  next_assessment_date TIMESTAMP,
  assessment_frequency_days INTEGER DEFAULT 365,
  
  status VARCHAR(50) DEFAULT 'active',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_vendors_tenant ON compliance_vendors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendors_risk ON compliance_vendors(risk_tier, risk_score DESC);

CREATE TABLE IF NOT EXISTS compliance_vendor_assessments (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  vendor_id INTEGER REFERENCES compliance_vendors(id) ON DELETE CASCADE,
  
  assessment_type VARCHAR(100) NOT NULL,
  assessment_date TIMESTAMP NOT NULL,
  
  risk_score INTEGER,
  previous_risk_score INTEGER,
  
  findings JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  
  assessed_by VARCHAR(255),
  
  questionnaire_responses JSONB DEFAULT '{}',
  evidence_collected JSONB DEFAULT '[]',
  
  status VARCHAR(50) DEFAULT 'completed',
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 5. EXCEPTION/RISK ACCEPTANCE MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_exceptions (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  
  control_id INTEGER REFERENCES compliance_controls(id),
  framework_id INTEGER REFERENCES compliance_frameworks(id),
  finding_id INTEGER REFERENCES compliance_findings(id),
  
  exception_type VARCHAR(50) NOT NULL,
  
  title VARCHAR(500) NOT NULL,
  description TEXT,
  business_justification TEXT NOT NULL,
  
  risk_level VARCHAR(20) NOT NULL,
  residual_risk_score INTEGER,
  
  compensating_controls TEXT,
  
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  
  requested_by VARCHAR(255) NOT NULL,
  requested_by_name VARCHAR(255),
  requested_at TIMESTAMP DEFAULT NOW(),
  
  approved_by VARCHAR(255),
  approved_by_name VARCHAR(255),
  approved_at TIMESTAMP,
  
  effective_date TIMESTAMP,
  expiration_date TIMESTAMP NOT NULL,
  
  review_frequency_days INTEGER DEFAULT 90,
  next_review_date TIMESTAMP,
  
  renewal_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exceptions_tenant ON compliance_exceptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_status ON compliance_exceptions(status);
CREATE INDEX IF NOT EXISTS idx_exceptions_expiration ON compliance_exceptions(expiration_date);

-- ============================================================================
-- 6. POLICY LIFECYCLE MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_policies (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  
  policy_name VARCHAR(255) NOT NULL,
  policy_type VARCHAR(100) NOT NULL,
  description TEXT,
  
  content TEXT,
  content_url VARCHAR(500),
  
  version VARCHAR(50) NOT NULL DEFAULT '1.0',
  version_history JSONB DEFAULT '[]',
  
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  
  owner_id VARCHAR(255),
  owner_name VARCHAR(255),
  
  framework_mappings JSONB DEFAULT '[]',
  control_mappings JSONB DEFAULT '[]',
  
  effective_date TIMESTAMP,
  review_date TIMESTAMP,
  expiration_date TIMESTAMP,
  
  review_frequency_days INTEGER DEFAULT 365,
  
  approved_by VARCHAR(255),
  approved_at TIMESTAMP,
  
  acknowledgment_required BOOLEAN DEFAULT false,
  acknowledgment_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_policies_tenant ON compliance_policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON compliance_policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_type ON compliance_policies(policy_type);

-- ============================================================================
-- 7. CROSS-FRAMEWORK CONTROL MAPPING
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_control_mappings (
  id SERIAL PRIMARY KEY,
  
  source_framework_id INTEGER REFERENCES compliance_frameworks(id),
  source_control_id INTEGER REFERENCES compliance_controls(id),
  
  target_framework_id INTEGER REFERENCES compliance_frameworks(id),
  target_control_id INTEGER REFERENCES compliance_controls(id),
  
  mapping_type VARCHAR(50) DEFAULT 'equivalent',
  mapping_strength VARCHAR(20) DEFAULT 'strong',
  
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255),
  
  UNIQUE(source_control_id, target_control_id)
);

CREATE INDEX IF NOT EXISTS idx_control_mappings_source ON compliance_control_mappings(source_control_id);
CREATE INDEX IF NOT EXISTS idx_control_mappings_target ON compliance_control_mappings(target_control_id);

-- ============================================================================
-- 8. AUDIT READINESS SCORING
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_audit_readiness (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  framework_id INTEGER REFERENCES compliance_frameworks(id),
  
  calculated_at TIMESTAMP DEFAULT NOW(),
  
  overall_score INTEGER NOT NULL,
  
  evidence_score INTEGER,
  evidence_fresh_count INTEGER DEFAULT 0,
  evidence_stale_count INTEGER DEFAULT 0,
  evidence_missing_count INTEGER DEFAULT 0,
  
  control_score INTEGER,
  controls_passed INTEGER DEFAULT 0,
  controls_failed INTEGER DEFAULT 0,
  controls_pending INTEGER DEFAULT 0,
  
  attestation_score INTEGER,
  attestations_current INTEGER DEFAULT 0,
  attestations_overdue INTEGER DEFAULT 0,
  
  policy_score INTEGER,
  policies_current INTEGER DEFAULT 0,
  policies_expired INTEGER DEFAULT 0,
  
  remediation_score INTEGER,
  open_findings INTEGER DEFAULT 0,
  overdue_findings INTEGER DEFAULT 0,
  
  risk_factors JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_audit_readiness_tenant ON compliance_audit_readiness(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_readiness_framework ON compliance_audit_readiness(framework_id);

-- ============================================================================
-- 9. COMPLIANCE CALENDAR/DEADLINES
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_calendar_events (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  
  event_type VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  
  framework_id INTEGER REFERENCES compliance_frameworks(id),
  
  event_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  
  all_day BOOLEAN DEFAULT true,
  recurring BOOLEAN DEFAULT false,
  recurrence_rule VARCHAR(255),
  
  reminder_days INTEGER DEFAULT 7,
  reminder_sent BOOLEAN DEFAULT false,
  
  status VARCHAR(50) DEFAULT 'upcoming',
  
  assigned_to JSONB DEFAULT '[]',
  
  related_entity_type VARCHAR(100),
  related_entity_id INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_calendar_tenant ON compliance_calendar_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_calendar_date ON compliance_calendar_events(event_date);

-- ============================================================================
-- 10. REGULATORY CHANGE TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_regulatory_changes (
  id SERIAL PRIMARY KEY,
  
  framework_id INTEGER REFERENCES compliance_frameworks(id),
  framework_name VARCHAR(100),
  
  change_type VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  
  source_url VARCHAR(500),
  source_name VARCHAR(255),
  
  published_date TIMESTAMP,
  effective_date TIMESTAMP,
  
  impact_level VARCHAR(20) DEFAULT 'medium',
  
  affected_controls JSONB DEFAULT '[]',
  required_actions JSONB DEFAULT '[]',
  
  status VARCHAR(50) DEFAULT 'new',
  
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_regulatory_framework ON compliance_regulatory_changes(framework_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_status ON compliance_regulatory_changes(status);

-- ============================================================================
-- 11. IMMUTABLE AUDIT LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_audit_log (
  id BIGSERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  
  event_type VARCHAR(100) NOT NULL,
  event_category VARCHAR(100) NOT NULL,
  
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  
  action VARCHAR(50) NOT NULL,
  
  actor_id VARCHAR(255) NOT NULL,
  actor_name VARCHAR(255),
  actor_email VARCHAR(255),
  actor_ip VARCHAR(45),
  
  old_value JSONB,
  new_value JSONB,
  
  metadata JSONB DEFAULT '{}',
  
  event_hash VARCHAR(64),
  previous_hash VARCHAR(64),
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON compliance_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON compliance_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON compliance_audit_log(created_at DESC);

-- ============================================================================
-- 12. ENHANCED EVIDENCE MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_evidence_enhanced (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  
  control_id INTEGER REFERENCES compliance_controls(id),
  framework_id INTEGER REFERENCES compliance_frameworks(id),
  
  evidence_type VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  
  source_type VARCHAR(100) NOT NULL,
  source_name VARCHAR(255),
  source_integration VARCHAR(100),
  
  file_url VARCHAR(500),
  file_name VARCHAR(255),
  file_size INTEGER,
  file_hash VARCHAR(64),
  
  content_preview TEXT,
  
  automated BOOLEAN DEFAULT false,
  
  freshness_status VARCHAR(50) DEFAULT 'fresh',
  freshness_days INTEGER DEFAULT 90,
  
  collected_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  
  validated BOOLEAN DEFAULT false,
  validated_by VARCHAR(255),
  validated_at TIMESTAMP,
  
  linked_attestation_id INTEGER REFERENCES compliance_attestations(id),
  
  metadata JSONB DEFAULT '{}',
  tags JSONB DEFAULT '[]',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_evidence_enhanced_tenant ON compliance_evidence_enhanced(tenant_id);
CREATE INDEX IF NOT EXISTS idx_evidence_enhanced_control ON compliance_evidence_enhanced(control_id);
CREATE INDEX IF NOT EXISTS idx_evidence_enhanced_freshness ON compliance_evidence_enhanced(freshness_status);

-- ============================================================================
-- 13. API VIOLATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_api_violations (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  
  endpoint_id VARCHAR(500),
  endpoint_path VARCHAR(500),
  endpoint_method VARCHAR(10),
  
  violation_type VARCHAR(100) NOT NULL,
  violation_category VARCHAR(100),
  
  title VARCHAR(500) NOT NULL,
  description TEXT,
  
  severity VARCHAR(20) NOT NULL DEFAULT 'medium',
  
  risk_score INTEGER DEFAULT 50,
  
  detected_at TIMESTAMP DEFAULT NOW(),
  
  status VARCHAR(50) DEFAULT 'open',
  
  remediation_task_id INTEGER REFERENCES compliance_remediation_tasks(id),
  
  auto_detected BOOLEAN DEFAULT true,
  detection_source VARCHAR(100),
  
  evidence JSONB DEFAULT '{}',
  
  resolved_at TIMESTAMP,
  resolved_by VARCHAR(255),
  resolution_notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_violations_tenant ON compliance_api_violations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_violations_status ON compliance_api_violations(status);
CREATE INDEX IF NOT EXISTS idx_api_violations_severity ON compliance_api_violations(severity);

-- ============================================================================
-- 14. SENSITIVE DATA DETECTION
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_sensitive_data_findings (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  
  endpoint_id VARCHAR(500),
  endpoint_path VARCHAR(500),
  
  data_type VARCHAR(100) NOT NULL,
  
  field_name VARCHAR(255),
  field_path VARCHAR(500),
  
  sample_masked VARCHAR(255),
  
  confidence_score DECIMAL(5,2),
  
  detected_at TIMESTAMP DEFAULT NOW(),
  
  status VARCHAR(50) DEFAULT 'active',
  
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by VARCHAR(255),
  acknowledged_at TIMESTAMP,
  
  false_positive BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sensitive_data_tenant ON compliance_sensitive_data_findings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sensitive_data_type ON compliance_sensitive_data_findings(data_type);

-- ============================================================================
-- 15. COMPLIANCE TRENDS (For dashboard charts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_score_history (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  framework_id INTEGER REFERENCES compliance_frameworks(id),
  
  score INTEGER NOT NULL,
  
  controls_passed INTEGER DEFAULT 0,
  controls_failed INTEGER DEFAULT 0,
  controls_pending INTEGER DEFAULT 0,
  
  open_findings INTEGER DEFAULT 0,
  
  recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_score_history_tenant ON compliance_score_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_score_history_date ON compliance_score_history(recorded_at DESC);

