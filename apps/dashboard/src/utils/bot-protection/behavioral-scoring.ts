/**
 * LAYER 1: Behavioral Heuristic Scoring
 * Analyzes request patterns to detect bot-like behavior
 * Score range: 0-100 (higher = more bot-like)
 */

export interface BehaviorSignals {
  requestVelocity: number;
  missingHeaders: string[];
  repeatedUrls: number;
  suspiciousParams: boolean;
  highError404Rate: number;
  highError403Rate: number;
  postWithoutCookies: number;
}

export interface RequestContext {
  sourceIp: string;
  userAgent: string | null;
  headers: Record<string, string>;
  method: string;
  url: string;
  hasCookies: boolean;
}

export function computeBehaviorScore(
  request: RequestContext,
  recentActivity?: BehaviorSignals
): number {
  let score = 0;

  const criticalHeaders = [
    'user-agent',
    'accept',
    'accept-language',
    'accept-encoding',
    'sec-ch-ua'
  ];
  
  const missingHeaders = criticalHeaders.filter(
    header => !request.headers[header] && !request.headers[header.toLowerCase()]
  );
  
  const headerPenalty = (missingHeaders.length / criticalHeaders.length) * 30;
  score += headerPenalty;

  if (recentActivity?.requestVelocity) {
    if (recentActivity.requestVelocity > 100) {
      score += 25;
    } else if (recentActivity.requestVelocity > 50) {
      score += 15;
    } else if (recentActivity.requestVelocity > 20) {
      score += 8;
    }
  }

  if (recentActivity?.repeatedUrls) {
    if (recentActivity.repeatedUrls > 50) {
      score += 15;
    } else if (recentActivity.repeatedUrls > 20) {
      score += 10;
    }
  }

  if (recentActivity?.suspiciousParams || hasSuspiciousParams(request.url)) {
    score += 15;
  }

  if (recentActivity) {
    const errorRate = recentActivity.highError404Rate + recentActivity.highError403Rate;
    if (errorRate > 50) {
      score += 10;
    } else if (errorRate > 25) {
      score += 5;
    }
  }

  if (request.method === 'POST' && !request.hasCookies) {
    score += 5;
  }

  return Math.min(100, Math.round(score));
}

function hasSuspiciousParams(url: string): boolean {
  const suspiciousPatterns = [
    /=\?/,
    /%00/,
    /%[0-9a-f]{2}/i,
    /\.\.\//,
    /<script/i,
    /union.*select/i,
    /exec\(/,
  ];

  return suspiciousPatterns.some(pattern => pattern.test(url));
}

export async function getRecentBehaviorSignals(
  sourceIp: string,
  database: any,
  tenantId: number
): Promise<BehaviorSignals> {
  try {
    const result = await database.queryOne(
      `SELECT 
        COUNT(*) as request_count,
        COUNT(CASE WHEN blocked = true THEN 1 END) as blocked_count,
        COUNT(DISTINCT user_agent) as unique_agents
      FROM bot_detection_events
      WHERE source_ip = $1 
        AND created_at >= NOW() - INTERVAL '5 minutes'`,
      [sourceIp]
    );

    const requestVelocity = (result?.request_count || 0) / 5;

    return {
      requestVelocity,
      missingHeaders: [],
      repeatedUrls: 0,
      suspiciousParams: false,
      highError404Rate: 0,
      highError403Rate: 0,
      postWithoutCookies: 0,
    };
  } catch (error) {
    console.error('Error fetching behavior signals:', error);
    return {
      requestVelocity: 0,
      missingHeaders: [],
      repeatedUrls: 0,
      suspiciousParams: false,
      highError404Rate: 0,
      highError403Rate: 0,
      postWithoutCookies: 0,
    };
  }
}
