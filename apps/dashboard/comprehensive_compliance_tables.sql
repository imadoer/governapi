-- Create comprehensive compliance_frameworks table
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

-- Create compliance_controls table for individual controls within frameworks
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

-- Create compliance_check_results table
CREATE TABLE IF NOT EXISTS compliance_check_results (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
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

-- Create compliance_findings table
CREATE TABLE IF NOT EXISTS compliance_findings (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  framework_name VARCHAR(100),
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

-- Create compliance_audits table
CREATE TABLE IF NOT EXISTS compliance_audits (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
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

-- Insert comprehensive compliance frameworks
INSERT INTO compliance_frameworks (framework_name, version, description, category, industry, mandatory) VALUES
-- Financial/Accounting
('SOX', '2023.1', 'Sarbanes-Oxley Act - Financial reporting controls', 'Financial', 'Public Companies', true),
('COSO', '2013', 'Committee of Sponsoring Organizations - Internal Control Framework', 'Financial', 'All', false),
('PCAOB', '2023', 'Public Company Accounting Oversight Board Standards', 'Financial', 'Public Companies', true),

-- Data Protection/Privacy
('GDPR', '2023.2', 'General Data Protection Regulation', 'Privacy', 'EU Operations', true),
('CCPA', '2023.1', 'California Consumer Privacy Act', 'Privacy', 'California Operations', true),
('PIPEDA', '2023', 'Personal Information Protection and Electronic Documents Act', 'Privacy', 'Canada', true),
('LGPD', '2023', 'Lei Geral de Proteção de Dados - Brazil Data Protection', 'Privacy', 'Brazil', true),

-- Healthcare
('HIPAA', '2023.1', 'Health Insurance Portability and Accountability Act', 'Healthcare', 'Healthcare', true),
('HITECH', '2023', 'Health Information Technology for Economic and Clinical Health', 'Healthcare', 'Healthcare', true),
('FDA 21 CFR Part 11', '2023', 'Electronic Records and Signatures in Healthcare', 'Healthcare', 'Healthcare', true),

-- Payment/Financial Services
('PCI DSS', '4.0', 'Payment Card Industry Data Security Standard', 'Payment', 'Payment Processing', true),
('GLBA', '2023', 'Gramm-Leach-Bliley Act - Financial Privacy', 'Financial', 'Financial Services', true),
('FFIEC', '2023', 'Federal Financial Institutions Examination Council', 'Financial', 'Financial Services', true),

-- Information Security
('ISO 27001', '2022', 'Information Security Management System', 'Security', 'All', false),
('ISO 27002', '2022', 'Information Security Controls', 'Security', 'All', false),
('NIST CSF', '2.0', 'NIST Cybersecurity Framework', 'Security', 'All', false),
('NIST 800-53', 'Rev 5', 'Security Controls for Federal Information Systems', 'Security', 'Government', false),
('CIS Controls', 'v8', 'Center for Internet Security Critical Security Controls', 'Security', 'All', false),

-- Cloud Security
('CSA CCM', '4.0', 'Cloud Security Alliance Cloud Controls Matrix', 'Cloud', 'Cloud Services', false),
('ISO 27017', '2015', 'Cloud Security Controls', 'Cloud', 'Cloud Services', false),
('ISO 27018', '2019', 'Cloud Privacy Controls', 'Cloud', 'Cloud Services', false),

-- Industry Specific
('NERC CIP', '2023', 'North American Electric Reliability Critical Infrastructure Protection', 'Energy', 'Energy/Utilities', true),
('FISMA', '2023', 'Federal Information Security Management Act', 'Government', 'Federal Government', true),
('FedRAMP', '2023', 'Federal Risk and Authorization Management Program', 'Government', 'Cloud Providers', false),
('ITAR', '2023', 'International Traffic in Arms Regulations', 'Defense', 'Defense Industry', true),

-- Operational
('COBIT', '2019', 'Control Objectives for Information Technologies', 'IT Governance', 'All', false),
('ITIL', '4', 'IT Infrastructure Library', 'IT Service Management', 'All', false),
('ISO 9001', '2015', 'Quality Management Systems', 'Quality', 'All', false),
('ISO 14001', '2015', 'Environmental Management Systems', 'Environmental', 'All', false)

ON CONFLICT (framework_name) DO NOTHING;
