/**
 * Headless Browser Detection Module
 * Detects Playwright, Puppeteer, Selenium, and other automation tools
 */

export interface HeadlessDetectionResult {
  isHeadless: boolean;
  automationTool: 'playwright' | 'puppeteer' | 'selenium' | 'phantomjs' | 'unknown' | null;
  confidence: number; // 0-100
  signals: string[];
}

/**
 * Detect headless browser from user agent and headers
 */
export function detectHeadlessBrowser(
  userAgent: string | null,
  headers: Record<string, string>
): HeadlessDetectionResult {
  const signals: string[] = [];
  let isHeadless = false;
  let automationTool: HeadlessDetectionResult['automationTool'] = null;
  let confidence = 0;

  if (!userAgent) {
    return { isHeadless: false, automationTool: null, confidence: 0, signals: [] };
  }

  const ua = userAgent.toLowerCase();

  // Direct headless indicators in UA
  if (ua.includes('headless')) {
    isHeadless = true;
    confidence += 40;
    signals.push('headless_in_ua');
  }

  // Playwright detection
  if (ua.includes('playwright') || headers['user-agent']?.includes('Playwright')) {
    isHeadless = true;
    automationTool = 'playwright';
    confidence += 50;
    signals.push('playwright_detected');
  }

  // Puppeteer detection
  if (ua.includes('puppeteer') || ua.includes('chrome-headless-shell')) {
    isHeadless = true;
    automationTool = 'puppeteer';
    confidence += 50;
    signals.push('puppeteer_detected');
  }

  // Selenium detection
  if (ua.includes('selenium') || ua.includes('webdriver')) {
    isHeadless = true;
    automationTool = 'selenium';
    confidence += 50;
    signals.push('selenium_detected');
  }

  // PhantomJS detection
  if (ua.includes('phantom')) {
    isHeadless = true;
    automationTool = 'phantomjs';
    confidence += 50;
    signals.push('phantomjs_detected');
  }

  // Chrome DevTools Protocol indicators
  if (ua.includes('chrome') && ua.includes('headless')) {
    isHeadless = true;
    if (!automationTool) automationTool = 'puppeteer';
    confidence += 30;
    signals.push('chrome_headless');
  }

  // Check for missing browser hints (modern browsers should have these)
  const secChUa = headers['sec-ch-ua'] || headers['Sec-CH-UA'];
  const secChUaMobile = headers['sec-ch-ua-mobile'] || headers['Sec-CH-UA-Mobile'];
  const secChUaPlatform = headers['sec-ch-ua-platform'] || headers['Sec-CH-UA-Platform'];

  // Modern Chrome should have sec-ch-ua headers
  if (ua.includes('chrome') && !secChUa) {
    confidence += 15;
    signals.push('missing_sec_ch_ua');
  }

  // Check for automation-specific headers
  if (headers['chrome-lighthouse']) {
    isHeadless = true;
    confidence += 20;
    signals.push('lighthouse_detected');
  }

  // Suspicious user agent patterns
  if (/chrome\/\d+\.0\.0\.0/.test(ua)) {
    confidence += 10;
    signals.push('suspicious_chrome_version');
  }

  // Very short user agent (automation tools often have minimal UAs)
  if (userAgent.length < 50) {
    confidence += 10;
    signals.push('short_user_agent');
  }

  // Missing accept-language (real browsers always send this)
  const acceptLang = headers['accept-language'] || headers['Accept-Language'];
  if (!acceptLang && ua.includes('mozilla')) {
    confidence += 15;
    signals.push('missing_accept_language');
  }

  // If we detected specific tool but low confidence, boost it
  if (automationTool && confidence < 50) {
    confidence = 50;
  }

  // If we have strong signals but no specific tool identified
  if (isHeadless && !automationTool && confidence >= 30) {
    automationTool = 'unknown';
  }

  return {
    isHeadless,
    automationTool,
    confidence: Math.min(100, confidence),
    signals,
  };
}

/**
 * Calculate headless bot score (0-100)
 */
export function calculateHeadlessScore(detection: HeadlessDetectionResult): number {
  if (!detection.isHeadless) return 0;

  let score = 0;

  // Base score for headless detection
  score += 40;

  // Known automation tools = higher score
  if (detection.automationTool && detection.automationTool !== 'unknown') {
    score += 30;
  }

  // Add confidence-based score
  score += detection.confidence * 0.3;

  return Math.min(100, Math.round(score));
}

/**
 * Get headless browser statistics
 */
export async function getHeadlessStatistics(
  database: any,
  tenantId: number,
  hours: number = 24
): Promise<any> {
  try {
    const stats = await database.queryOne(
      `SELECT
        COUNT(*) as total_headless,
        COUNT(CASE WHEN automation_tool = 'playwright' THEN 1 END) as playwright_count,
        COUNT(CASE WHEN automation_tool = 'puppeteer' THEN 1 END) as puppeteer_count,
        COUNT(CASE WHEN automation_tool = 'selenium' THEN 1 END) as selenium_count,
        COUNT(CASE WHEN automation_tool = 'phantomjs' THEN 1 END) as phantomjs_count,
        COUNT(CASE WHEN automation_tool = 'unknown' THEN 1 END) as unknown_count,
        COUNT(CASE WHEN blocked = true THEN 1 END) as blocked_count
       FROM bot_detection_events
       WHERE 1=1
         AND headless_detected = true
         AND created_at >= NOW() - INTERVAL '${hours} hours'`,
      []
    );

    return stats || {
      total_headless: 0,
      playwright_count: 0,
      puppeteer_count: 0,
      selenium_count: 0,
      phantomjs_count: 0,
      unknown_count: 0,
      blocked_count: 0,
    };
  } catch (error) {
    console.error('Error fetching headless statistics:', error);
    return {
      total_headless: 0,
      playwright_count: 0,
      puppeteer_count: 0,
      selenium_count: 0,
      phantomjs_count: 0,
      unknown_count: 0,
      blocked_count: 0,
    };
  }
}

/**
 * Get hourly headless detection trends
 */
export async function getHeadlessTrends(
  database: any,
  tenantId: number,
  hours: number = 24
): Promise<any[]> {
  try {
    const results = await database.queryMany(
      `SELECT
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(*) as detections,
        COUNT(CASE WHEN blocked = true THEN 1 END) as blocked
       FROM bot_detection_events
       WHERE 1=1
         AND headless_detected = true
         AND created_at >= NOW() - INTERVAL '${hours} hours'
       GROUP BY hour
       ORDER BY hour ASC`,
      []
    );

    return results;
  } catch (error) {
    console.error('Error fetching headless trends:', error);
    return [];
  }
}
