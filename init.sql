-- Production database schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Optimized indexes for production
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_apis_classification ON apis(classification);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scans_status_created ON scans(status, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_violations_severity ON violations(severity);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_policies_enabled ON policies(enabled);

-- Performance tuning
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
SELECT pg_reload_conf();
