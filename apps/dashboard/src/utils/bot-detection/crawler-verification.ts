/**
 * Crawler Verification Module
 * Verifies legitimate search engine bots via reverse DNS
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CrawlerVerificationResult {
  isVerified: boolean;
  crawlerIdentity: 'Googlebot' | 'Bingbot' | 'DuckDuckBot' | 'Yandex' | 'Baiduspider' | 'Applebot' | 'Fake' | null;
  hostname: string | null;
  confidence: number; // 0-100
}

// Known legitimate crawler patterns
const CRAWLER_PATTERNS = {
  Googlebot: {
    userAgentPattern: /googlebot/i,
    reverseDnsDomain: '.googlebot.com',
    forwardDnsPattern: /^(crawl-|.*\.crawl\.google\.com$)/,
  },
  Bingbot: {
    userAgentPattern: /bingbot/i,
    reverseDnsDomain: '.search.msn.com',
    forwardDnsPattern: /\.search\.msn\.com$/,
  },
  DuckDuckBot: {
    userAgentPattern: /duckduckbot/i,
    reverseDnsDomain: '.duckduckgo.com',
    forwardDnsPattern: /\.duckduckgo\.com$/,
  },
  Yandex: {
    userAgentPattern: /yandex/i,
    reverseDnsDomain: '.yandex.com',
    forwardDnsPattern: /\.yandex\.(com|ru|net)$/,
  },
  Baiduspider: {
    userAgentPattern: /baiduspider/i,
    reverseDnsDomain: '.baidu.com',
    forwardDnsPattern: /\.baidu\.(com|jp)$/,
  },
  Applebot: {
    userAgentPattern: /applebot/i,
    reverseDnsDomain: '.applebot.apple.com',
    forwardDnsPattern: /\.applebot\.apple\.com$/,
  },
};

/**
 * Identify crawler from user agent
 */
export function identifyCrawlerFromUserAgent(userAgent: string | null): string | null {
  if (!userAgent) return null;

  const ua = userAgent.toLowerCase();

  for (const [name, pattern] of Object.entries(CRAWLER_PATTERNS)) {
    if (pattern.userAgentPattern.test(ua)) {
      return name;
    }
  }

  return null;
}

/**
 * Verify crawler via reverse DNS lookup
 * IMPORTANT: This is a simplified version. In production, use proper DNS libraries.
 */
export async function verifyCrawler(
  ip: string,
  userAgent: string | null
): Promise<CrawlerVerificationResult> {
  const claimedIdentity = identifyCrawlerFromUserAgent(userAgent);

  if (!claimedIdentity) {
    return {
      isVerified: false,
      crawlerIdentity: null,
      hostname: null,
      confidence: 0,
    };
  }

  try {
    // Step 1: Reverse DNS lookup (IP -> hostname)
    const reverseDns = await performReverseDns(ip);

    if (!reverseDns) {
      return {
        isVerified: false,
        crawlerIdentity: 'Fake',
        hostname: null,
        confidence: 90, // High confidence it's fake
      };
    }

    // Step 2: Check if hostname matches expected domain
    const pattern = CRAWLER_PATTERNS[claimedIdentity as keyof typeof CRAWLER_PATTERNS];
    const hostnameMatches = reverseDns.endsWith(pattern.reverseDnsDomain);

    if (!hostnameMatches) {
      return {
        isVerified: false,
        crawlerIdentity: 'Fake',
        hostname: reverseDns,
        confidence: 95, // Very high confidence it's fake
      };
    }

    // Step 3: Forward DNS lookup (hostname -> IP) to verify it matches
    const forwardIp = await performForwardDns(reverseDns);

    if (forwardIp !== ip) {
      return {
        isVerified: false,
        crawlerIdentity: 'Fake',
        hostname: reverseDns,
        confidence: 85,
      };
    }

    // All checks passed - legitimate crawler
    return {
      isVerified: true,
      crawlerIdentity: claimedIdentity as any,
      hostname: reverseDns,
      confidence: 100,
    };
  } catch (error) {
    console.error('Crawler verification error:', error);
    return {
      isVerified: false,
      crawlerIdentity: null,
      hostname: null,
      confidence: 0,
    };
  }
}

/**
 * Perform reverse DNS lookup (simplified)
 */
async function performReverseDns(ip: string): Promise<string | null> {
  try {
    // Use host command for reverse DNS
    const { stdout } = await execAsync(`host ${ip}`, { timeout: 5000 });
    
    // Parse output: "1.2.3.4.in-addr.arpa domain name pointer crawl-66-249-66-1.googlebot.com."
    const match = stdout.match(/domain name pointer (.+)\./);
    
    return match ? match[1].trim() : null;
  } catch (error) {
    return null;
  }
}

/**
 * Perform forward DNS lookup (simplified)
 */
async function performForwardDns(hostname: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(`host ${hostname}`, { timeout: 5000 });
    
    // Parse output: "crawl-66-249-66-1.googlebot.com has address 66.249.66.1"
    const match = stdout.match(/has address (.+)/);
    
    return match ? match[1].trim() : null;
  } catch (error) {
    return null;
  }
}

/**
 * Calculate crawler score (0-100)
 * Returns 0 for verified crawlers, high score for fakes
 */
export function calculateCrawlerScore(verification: CrawlerVerificationResult): number {
  // Verified crawlers should be allowed
  if (verification.isVerified) {
    return 0;
  }

  // Fake crawlers get high score
  if (verification.crawlerIdentity === 'Fake') {
    return 80;
  }

  // Unknown/unverified gets moderate score
  return 40;
}

/**
 * Get crawler statistics
 */
export async function getCrawlerStatistics(
  database: any,
  tenantId: number,
  hours: number = 24
): Promise<any> {
  try {
    const stats = await database.queryOne(
      `SELECT
        COUNT(*) as total_crawlers,
        COUNT(CASE WHEN crawler_verified = true THEN 1 END) as verified_count,
        COUNT(CASE WHEN crawler_verified = false THEN 1 END) as fake_count,
        COUNT(CASE WHEN crawler_identity = 'Googlebot' THEN 1 END) as googlebot_count,
        COUNT(CASE WHEN crawler_identity = 'Bingbot' THEN 1 END) as bingbot_count,
        COUNT(CASE WHEN crawler_identity = 'DuckDuckBot' THEN 1 END) as duckduckbot_count,
        COUNT(CASE WHEN crawler_identity = 'Fake' THEN 1 END) as impostor_count
       FROM bot_detection_events
       WHERE 1=1
         AND crawler_identity IS NOT NULL
         AND created_at >= NOW() - INTERVAL '${hours} hours'`,
      []
    );

    return stats || {
      total_crawlers: 0,
      verified_count: 0,
      fake_count: 0,
      googlebot_count: 0,
      bingbot_count: 0,
      duckduckbot_count: 0,
      impostor_count: 0,
    };
  } catch (error) {
    console.error('Error fetching crawler statistics:', error);
    return {
      total_crawlers: 0,
      verified_count: 0,
      fake_count: 0,
      googlebot_count: 0,
      bingbot_count: 0,
      duckduckbot_count: 0,
      impostor_count: 0,
    };
  }
}

/**
 * Get fake crawler attempts
 */
export async function getFakeCrawlers(
  database: any,
  tenantId: number,
  hours: number = 24
): Promise<any[]> {
  try {
    const results = await database.queryMany(
      `SELECT
        source_ip,
        user_agent,
        crawler_identity,
        COUNT(*) as attempt_count,
        MAX(created_at) as last_seen,
        COUNT(CASE WHEN blocked = true THEN 1 END) as blocked_count
       FROM bot_detection_events
       WHERE 1=1
         AND crawler_verified = false
         AND crawler_identity = 'Fake'
         AND created_at >= NOW() - INTERVAL '${hours} hours'
       GROUP BY source_ip, user_agent, crawler_identity
       ORDER BY attempt_count DESC
       LIMIT 20`,
      []
    );

    return results;
  } catch (error) {
    console.error('Error fetching fake crawlers:', error);
    return [];
  }
}
