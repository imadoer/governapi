-- Optimized Queries for Analytics Endpoints
-- Replace slow queries with these optimized versions

-- Optimized Customer Dashboard Query
-- Original query was doing multiple separate queries, this combines them efficiently
WITH tenant_stats AS (
  SELECT 
    $1 as tenant_id,
    -- API statistics
    (SELECT COUNT(*) FROM apis WHERE tenant_id = $1 AND status = 'active') as active_apis,
    (SELECT COUNT(*) FROM apis WHERE tenant_id = $1) as total_apis,
    
    -- Threat statistics (last 24h)
    (SELECT COUNT(*) FROM threat_events_enhanced 
     WHERE tenant_id = $1 AND detected_at >= NOW() - INTERVAL '24 hours') as recent_threats,
    (SELECT COUNT(*) FROM threat_events_enhanced 
     WHERE tenant_id = $1 AND detected_at >= NOW() - INTERVAL '24 hours' AND blocked = true) as blocked_threats,
    
    -- API Key statistics
    (SELECT COUNT(*) FROM api_keys WHERE tenant_id = $1 AND is_active = true) as active_keys,
    (SELECT SUM(usage_count) FROM api_keys WHERE tenant_id = $1) as total_api_usage,
    
    -- Performance statistics
    (SELECT AVG(response_time) FROM request_logs 
     WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '1 hour') as avg_response_time
)
SELECT * FROM tenant_stats;

-- Optimized Threat Trends Query
-- Uses window functions for better performance
SELECT 
  DATE_TRUNC('hour', detected_at) as time_bucket,
  COUNT(*) as threat_count,
  COUNT(*) FILTER (WHERE blocked = true) as blocked_count,
  AVG(risk_score) as avg_risk_score,
  MAX(risk_score) as max_risk_score,
  COUNT(DISTINCT source_ip) as unique_sources,
  -- Rolling 24h average
  AVG(COUNT(*)) OVER (
    ORDER BY DATE_TRUNC('hour', detected_at) 
    ROWS BETWEEN 23 PRECEDING AND CURRENT ROW
  ) as rolling_avg
FROM threat_events_enhanced 
WHERE tenant_id = $1 
  AND detected_at >= NOW() - INTERVAL '7 days'
GROUP BY time_bucket
ORDER BY time_bucket DESC;

-- Optimized IP Risk Analysis
-- Pre-aggregated risk scoring for faster lookups
WITH ip_risk_scores AS (
  SELECT 
    source_ip,
    COUNT(*) as request_count,
    AVG(risk_score) as avg_risk_score,
    MAX(risk_score) as max_risk_score,
    COUNT(*) FILTER (WHERE blocked = true) as blocked_count,
    MAX(detected_at) as last_seen
  FROM threat_events_enhanced 
  WHERE tenant_id = $1 
    AND detected_at >= NOW() - INTERVAL '24 hours'
  GROUP BY source_ip
)
SELECT 
  source_ip,
  request_count,
  ROUND(avg_risk_score::numeric, 2) as avg_risk_score,
  max_risk_score,
  blocked_count,
  ROUND((blocked_count::float / request_count * 100)::numeric, 2) as block_rate,
  last_seen
FROM ip_risk_scores
WHERE avg_risk_score > 30 OR blocked_count > 0
ORDER BY max_risk_score DESC, avg_risk_score DESC
LIMIT 100;
