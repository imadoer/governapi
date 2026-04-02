import { database } from "../infrastructure/database";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

export async function checkRateLimit(
  apiKey: string,
  ip: string,
): Promise<RateLimitResult> {
  try {
    // Get rate limit config for API key
    const config = await database.queryOne(
      "SELECT * FROM rate_limit_config WHERE api_key = $1 AND enabled = true",
      [apiKey],
    );

    if (!config) {
      return { allowed: true, remaining: 1000, resetTime: Date.now() + 60000 };
    }

    // Check current usage
    const usage = await database.queryOne(
      `SELECT COUNT(*) as count FROM api_requests 
       WHERE api_key = $1 AND ip_address = $2 AND created_at >= NOW() - INTERVAL '1 minute'`,
      [apiKey, ip],
    );

    const requestCount = parseInt(usage?.count || "0");
    const limit = config.requests_per_minute;
    const remaining = Math.max(0, limit - requestCount);

    return {
      allowed: requestCount < limit,
      remaining,
      resetTime: Date.now() + 60000,
    };
  } catch {
    return { allowed: true, remaining: 1000, resetTime: Date.now() + 60000 };
  }
}

export async function logRequest(
  apiKey: string,
  ip: string,
  endpoint: string,
  method: string,
) {
  try {
    await database.query(
      `INSERT INTO api_requests (api_key, ip_address, endpoint, method, created_at) 
       VALUES ($1, $2, $3, $4, NOW())`,
      [apiKey, ip, endpoint, method],
    );
  } catch (error) {
    console.error("Failed to log request:", error);
  }
}
