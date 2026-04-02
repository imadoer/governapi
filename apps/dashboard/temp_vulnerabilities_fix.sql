-- Check what we actually have in vulnerabilities table
SELECT * FROM vulnerabilities WHERE tenant_id = 1;
-- Check what we actually have in scan_results table  
SELECT column_name FROM information_schema.columns WHERE table_name = 'scan_results';
