/**
 * Unified Bot Score Calculator
 * Combines all detection methods into a final bot score
 */

export interface ScoreComponents {
  baseConfidenceScore: number;  // Existing score
  asnScore: number;
  headlessScore: number;
  velocityScore: number;
  jsChallengeScore: number;
  crawlerScore: number;
  behaviorScore?: number;       // From Layer 1 (optional)
  reputationScore?: number;     // From Layer 2 (optional)
  fingerprintScore?: number;    // From Layer 6 (optional)
}

export interface UnifiedBotScore {
  finalScore: number;           // 0-100
  components: ScoreComponents;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE';
  recommendedAction: 'BLOCK' | 'CHALLENGE' | 'MONITOR' | 'ALLOW';
  reasoning: string[];
}

/**
 * Calculate unified bot score
 * Combines all detection layers with appropriate weighting
 */
export function calculateUnifiedScore(components: ScoreComponents): UnifiedBotScore {
  const {
    baseConfidenceScore,
    asnScore,
    headlessScore,
    velocityScore,
    jsChallengeScore,
    crawlerScore,
    behaviorScore = 0,
    reputationScore = 0,
    fingerprintScore = 0,
  } = components;

  // Weighted scoring
  const weights = {
    base: 0.20,          // 20% - existing confidence score
    asn: 0.15,           // 15% - ASN intelligence
    headless: 0.20,      // 20% - headless browser detection
    velocity: 0.15,      // 15% - request velocity
    jsChallenge: 0.10,   // 10% - JS challenge
    crawler: 0.20,       // 20% - crawler verification
    behavior: 0.00,      // Optional - only if Layer 1 active
    reputation: 0.00,    // Optional - only if Layer 2 active
    fingerprint: 0.00,   // Optional - only if Layer 6 active
  };

  // If optional layers are present, redistribute weights
  if (behaviorScore > 0 || reputationScore > 0 || fingerprintScore > 0) {
    weights.behavior = 0.05;
    weights.reputation = 0.05;
    weights.fingerprint = 0.05;
    // Reduce others proportionally
    weights.base = 0.15;
    weights.asn = 0.10;
    weights.headless = 0.15;
    weights.velocity = 0.10;
    weights.jsChallenge = 0.10;
    weights.crawler = 0.15;
  }

  // Calculate weighted final score
  const finalScore = Math.round(
    baseConfidenceScore * weights.base +
    asnScore * weights.asn +
    headlessScore * weights.headless +
    velocityScore * weights.velocity +
    jsChallengeScore * weights.jsChallenge +
    crawlerScore * weights.crawler +
    behaviorScore * weights.behavior +
    reputationScore * weights.reputation +
    fingerprintScore * weights.fingerprint
  );

  // Determine risk level
  const riskLevel = determineRiskLevel(finalScore);

  // Determine recommended action
  const recommendedAction = determineAction(finalScore);

  // Generate reasoning
  const reasoning = generateReasoning(components, finalScore);

  return {
    finalScore: Math.min(100, finalScore),
    components,
    riskLevel,
    recommendedAction,
    reasoning,
  };
}

/**
 * Determine risk level from score
 */
function determineRiskLevel(score: number): UnifiedBotScore['riskLevel'] {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  if (score >= 20) return 'LOW';
  return 'SAFE';
}

/**
 * Determine recommended action
 */
function determineAction(score: number): UnifiedBotScore['recommendedAction'] {
  if (score >= 80) return 'BLOCK';
  if (score >= 60) return 'CHALLENGE';
  if (score >= 40) return 'MONITOR';
  return 'ALLOW';
}

/**
 * Generate human-readable reasoning
 */
function generateReasoning(components: ScoreComponents, finalScore: number): string[] {
  const reasons: string[] = [];

  // Check each component
  if (components.headlessScore > 50) {
    reasons.push('Headless browser or automation tool detected');
  }

  if (components.asnScore > 40) {
    reasons.push('Traffic from datacenter or VPN network');
  }

  if (components.velocityScore > 50) {
    reasons.push('Abnormal request velocity detected');
  }

  if (components.crawlerScore > 60) {
    reasons.push('Fake search engine crawler detected');
  }

  if (components.jsChallengeScore > 50) {
    reasons.push('Failed JavaScript challenge verification');
  }

  if (components.behaviorScore && components.behaviorScore > 50) {
    reasons.push('Suspicious behavioral patterns');
  }

  if (components.reputationScore && components.reputationScore > 50) {
    reasons.push('Poor IP reputation');
  }

  if (components.fingerprintScore && components.fingerprintScore > 50) {
    reasons.push('Suspicious device fingerprint');
  }

  // Add overall assessment
  if (finalScore >= 80) {
    reasons.push('CRITICAL THREAT - Immediate blocking recommended');
  } else if (finalScore >= 60) {
    reasons.push('HIGH RISK - Challenge or additional verification required');
  } else if (finalScore >= 40) {
    reasons.push('MEDIUM RISK - Enhanced monitoring recommended');
  } else if (finalScore >= 20) {
    reasons.push('LOW RISK - Normal monitoring sufficient');
  } else {
    reasons.push('Legitimate traffic pattern');
  }

  // If no specific reasons, add default
  if (reasons.length === 1 && finalScore < 20) {
    reasons.unshift('All detection checks passed');
  }

  return reasons;
}

/**
 * Calculate JS challenge score
 * Returns high score if challenge failed or not attempted
 */
export function calculateJsChallengeScore(
  jsChallengeRequired: boolean,
  jsChallengePassed: boolean | null
): number {
  // If challenge not required, return 0
  if (!jsChallengeRequired) {
    return 0;
  }

  // If challenge passed, return 0
  if (jsChallengePassed === true) {
    return 0;
  }

  // If challenge failed or not attempted, return high score
  if (jsChallengePassed === false) {
    return 70; // Failed challenge
  }

  // Challenge required but not attempted
  return 50;
}

/**
 * Get score distribution statistics
 */
export async function getScoreDistribution(
  database: any,
  tenantId: number,
  hours: number = 24
): Promise<any> {
  try {
    const stats = await database.queryOne(
      `SELECT
        COUNT(CASE WHEN final_score >= 80 THEN 1 END) as critical_count,
        COUNT(CASE WHEN final_score >= 60 AND final_score < 80 THEN 1 END) as high_count,
        COUNT(CASE WHEN final_score >= 40 AND final_score < 60 THEN 1 END) as medium_count,
        COUNT(CASE WHEN final_score >= 20 AND final_score < 40 THEN 1 END) as low_count,
        COUNT(CASE WHEN final_score < 20 THEN 1 END) as safe_count,
        AVG(final_score) as avg_score,
        MAX(final_score) as max_score
       FROM bot_detection_events
       WHERE final_score IS NOT NULL
         AND created_at >= NOW() - INTERVAL '${hours} hours'`,
      []
    );

    return stats || {
      critical_count: 0,
      high_count: 0,
      medium_count: 0,
      low_count: 0,
      safe_count: 0,
      avg_score: 0,
      max_score: 0,
    };
  } catch (error) {
    console.error('Error fetching score distribution:', error);
    return {
      critical_count: 0,
      high_count: 0,
      medium_count: 0,
      low_count: 0,
      safe_count: 0,
      avg_score: 0,
      max_score: 0,
    };
  }
}
