/**
 * Velocity Scoring Module
 * Tracks request frequency and detects abnormal patterns
 */

export interface VelocityMetrics {
  requestCount: number;
  requestsPerSecond: number;
  requestsPerMinute: number;
  timeWindow: number; // seconds
  uniquePaths: number;
  burstDetected: boolean;
}

export interface VelocityScore {
  score: number; // 0-100
  metrics: VelocityMetrics;
  anomalyDetected: boolean;
  reason: string;
}

/**
 * Calculate velocity score from request metrics
 */
export function calculateVelocityScore(metrics: VelocityMetrics): VelocityScore {
  let score = 0;
  let anomalyDetected = false;
  let reason = 'Normal request rate';

  const { requestsPerSecond, requestsPerMinute, uniquePaths, burstDetected } = metrics;

  // High requests per second
  if (requestsPerSecond > 10) {
    score += 50;
    anomalyDetected = true;
    reason = `Excessive RPS: ${requestsPerSecond.toFixed(1)}`;
  } else if (requestsPerSecond > 5) {
    score += 30;
    anomalyDetected = true;
    reason = `High RPS: ${requestsPerSecond.toFixed(1)}`;
  } else if (requestsPerSecond > 2) {
    score += 15;
    reason = `Elevated RPS: ${requestsPerSecond.toFixed(1)}`;
  }

  // High requests per minute
  if (requestsPerMinute > 200) {
    score += 30;
    anomalyDetected = true;
  } else if (requestsPerMinute > 100) {
    score += 20;
  } else if (requestsPerMinute > 50) {
    score += 10;
  }

  // Burst detection (many requests in short time)
  if (burstDetected) {
    score += 20;
    anomalyDetected = true;
    reason = 'Request burst detected';
  }

  // Low path diversity (hitting same path repeatedly)
  if (metrics.requestCount > 10 && uniquePaths === 1) {
    score += 15;
    reason = 'Repeated identical requests';
  }

  return {
    score: Math.min(100, score),
    metrics,
    anomalyDetected,
    reason,
  };
}

/**
 * Get velocity metrics for an IP from database
 */
export async function getVelocityMetrics(
  database: any,
  sourceIp: string,
  timeWindowSeconds: number = 60
): Promise<VelocityMetrics> {
  try {
    const result = await database.queryOne(
      `SELECT
        COUNT(*) as request_count,
        COUNT(DISTINCT user_agent) as unique_agents,
        MIN(created_at) as first_request,
        MAX(created_at) as last_request
       FROM bot_detection_events
       WHERE source_ip = $1
         AND created_at >= NOW() - INTERVAL '${timeWindowSeconds} seconds'`,
      [sourceIp]
    );

    const requestCount = parseInt(result?.request_count || 0);
    const requestsPerMinute = (requestCount / timeWindowSeconds) * 60;
    const requestsPerSecond = requestCount / timeWindowSeconds;

    // Detect burst: more than 5 requests in 1 second
    const burstCheck = await database.queryOne(
      `SELECT COUNT(*) as burst_count
       FROM bot_detection_events
       WHERE source_ip = $1
         AND created_at >= NOW() - INTERVAL '1 second'`,
      [sourceIp]
    );

    const burstDetected = parseInt(burstCheck?.burst_count || 0) > 5;

    return {
      requestCount,
      requestsPerSecond: parseFloat(requestsPerSecond.toFixed(2)),
      requestsPerMinute: parseFloat(requestsPerMinute.toFixed(2)),
      timeWindow: timeWindowSeconds,
      uniquePaths: 1, // TODO: track unique paths
      burstDetected,
    };
  } catch (error) {
    console.error('Error fetching velocity metrics:', error);
    return {
      requestCount: 0,
      requestsPerSecond: 0,
      requestsPerMinute: 0,
      timeWindow: timeWindowSeconds,
      uniquePaths: 0,
      burstDetected: false,
    };
  }
}

/**
 * Get velocity anomaly statistics
 */
export async function getVelocityAnomalies(
  database: any,
  tenantId: number,
  hours: number = 24
): Promise<any[]> {
  try {
    const results = await database.queryMany(
      `SELECT
        source_ip,
        recent_request_count,
        velocity_score,
        COUNT(*) as detection_count,
        MAX(created_at) as last_seen,
        COUNT(CASE WHEN blocked = true THEN 1 END) as blocked_count
       FROM bot_detection_events
       WHERE 1=1
         AND velocity_score > 40
         AND created_at >= NOW() - INTERVAL '${hours} hours'
       GROUP BY source_ip, recent_request_count, velocity_score
       ORDER BY velocity_score DESC, detection_count DESC
       LIMIT 20`,
      []
    );

    return results;
  } catch (error) {
    console.error('Error fetching velocity anomalies:', error);
    return [];
  }
}

/**
 * Get top IPs by request frequency
 */
export async function getTopRequesters(
  database: any,
  tenantId: number,
  hours: number = 24,
  limit: number = 10
): Promise<any[]> {
  try {
    const results = await database.queryMany(
      `SELECT
        source_ip,
        COUNT(*) as total_requests,
        AVG(velocity_score) as avg_velocity_score,
        MAX(recent_request_count) as peak_request_count,
        COUNT(CASE WHEN blocked = true THEN 1 END) as blocked_count,
        MAX(created_at) as last_seen
       FROM bot_detection_events
       WHERE 1=1
         AND created_at >= NOW() - INTERVAL '${hours} hours'
       GROUP BY source_ip
       ORDER BY total_requests DESC
       LIMIT $2`,
      [tenantId, limit]
    );

    return results;
  } catch (error) {
    console.error('Error fetching top requesters:', error);
    return [];
  }
}

/**
 * Get velocity trends over time
 */
export async function getVelocityTrends(
  database: any,
  tenantId: number,
  hours: number = 24
): Promise<any[]> {
  try {
    const results = await database.queryMany(
      `SELECT
        DATE_TRUNC('hour', created_at) as hour,
        AVG(velocity_score) as avg_velocity_score,
        MAX(velocity_score) as max_velocity_score,
        COUNT(CASE WHEN velocity_score > 50 THEN 1 END) as high_velocity_count
       FROM bot_detection_events
       WHERE 1=1
         AND velocity_score IS NOT NULL
         AND created_at >= NOW() - INTERVAL '${hours} hours'
       GROUP BY hour
       ORDER BY hour ASC`,
      []
    );

    return results;
  } catch (error) {
    console.error('Error fetching velocity trends:', error);
    return [];
  }
}
