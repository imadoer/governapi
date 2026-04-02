-- Add missing columns to existing apis table
ALTER TABLE apis ADD COLUMN IF NOT EXISTS method VARCHAR(10) DEFAULT 'GET';
ALTER TABLE apis ADD COLUMN IF NOT EXISTS discovered_via VARCHAR(100) DEFAULT 'manual';
ALTER TABLE apis ADD COLUMN IF NOT EXISTS url VARCHAR(2000);
ALTER TABLE apis ADD COLUMN IF NOT EXISTS response_schema JSONB;
ALTER TABLE apis ADD COLUMN IF NOT EXISTS request_schema JSONB;
ALTER TABLE apis ADD COLUMN IF NOT EXISTS tags JSONB;
ALTER TABLE apis ADD COLUMN IF NOT EXISTS version VARCHAR(50);
ALTER TABLE apis ADD COLUMN IF NOT EXISTS authentication_type VARCHAR(100);
ALTER TABLE apis ADD COLUMN IF NOT EXISTS rate_limit INTEGER;

-- Add the indexes now that columns exist
CREATE INDEX IF NOT EXISTS idx_apis_method ON apis(method);
CREATE INDEX IF NOT EXISTS idx_apis_discovered_via ON apis(discovered_via);
CREATE INDEX IF NOT EXISTS idx_apis_url_method ON apis(url, method);
