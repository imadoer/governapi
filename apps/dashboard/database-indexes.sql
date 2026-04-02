-- Performance Indexes for API Security Platform
-- Run these after initial schema setup for optimal query performance

-- API Keys table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_tenant_active 
ON api_keys (tenant_id, is_active) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_hash_lookup 
ON api_keys (key_hash) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_usage_tracking 
ON api_keys (last_used DESC, usage_count DESC) WHERE is_active = true;

-- Threat Events Enhanced indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_threat_events_tenant_time 
ON threat_events_enhanced (tenant_id, detected_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_threat_events_risk_analysis 
ON threat_events_enhanced (risk_score DESC, detected_at DESC) WHERE risk_score >= 50;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_threat_events_source_tracking 
ON threat_events_enhanced (source_ip, detected_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_threat_events_blocking 
ON threat_events_enhanced (blocked, detected_at DESC) WHERE blocked = true;

-- Request Logs indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_request_logs_tenant_analytics 
ON request_logs (tenant_id, created_at DESC, status_code);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_request_logs_ip_analysis 
ON request_logs (ip_address, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_request_logs_endpoint_performance 
ON request_logs (endpoint, created_at DESC, response_time);

-- API Requests (rate limiting) indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_requests_rate_limiting 
ON api_requests (tenant_id, ip_address, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_requests_cleanup 
ON api_requests (created_at) WHERE created_at < NOW() - INTERVAL '24 hours';

-- IP Blocks indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ip_blocks_active_lookup 
ON ip_blocks (ip_address, blocked_until) WHERE blocked_until > NOW();

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ip_blocks_tenant_management 
ON ip_blocks (tenant_id, created_at DESC);

-- Scan Results indexes for analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scan_results_tenant_analytics 
ON scan_results (tenant_id, created_at DESC, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scan_results_security_scores 
ON scan_results (tenant_id, security_score DESC, created_at DESC);

-- Companies table optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_active_lookup 
ON companies (id) WHERE status = 'active';

-- Users table optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_company_lookup 
ON users (company_id, role) WHERE is_active = true;

-- Composite indexes for complex analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_threat_analytics_composite 
ON threat_events_enhanced (tenant_id, event_type, detected_at DESC, risk_score DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_analytics_composite 
ON request_logs (tenant_id, endpoint, created_at DESC, response_time, status_code);
