export interface ScoringComponents {
  behaviorScore: number;
  reputationScore: number;
  headerScore: number;
  velocityScore: number;
  fingerprintScore: number;
}

export interface BotClassification {
  finalScore: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NORMAL';
  action: 'BLOCK' | 'CHALLENGE' | 'LOG' | 'ALLOW';
  confidence: number;
  reasoning: string[];
}

const SCORE_WEIGHTS = {
  behavior: 0.30,
  reputation: 0.30,
  header: 0.20,
  velocity: 0.10,
  fingerprint: 0.10,
};

const THRESHOLDS = {
  BLOCK: 90,
  CHALLENGE: 70,
  SUSPICIOUS: 50,
  NORMAL: 0,
};

export function computeFinalBotScore(
  components: ScoringComponents
): BotClassification {
  const finalScore = Math.round(
    components.behaviorScore * SCORE_WEIGHTS.behavior +
    components.reputationScore * SCORE_WEIGHTS.reputation +
    components.headerScore * SCORE_WEIGHTS.header +
    components.velocityScore * SCORE_WEIGHTS.velocity +
    components.fingerprintScore * SCORE_WEIGHTS.fingerprint
  );

  const { riskLevel, action } = classifyRisk(finalScore);
  const confidence = calculateConfidence(components, finalScore);
  const reasoning = generateReasoning(components, finalScore);

  return {
    finalScore,
    riskLevel,
    action,
    confidence,
    reasoning,
  };
}

function classifyRisk(score: number): {
  riskLevel: BotClassification['riskLevel'];
  action: BotClassification['action'];
} {
  if (score >= THRESHOLDS.BLOCK) {
    return { riskLevel: 'CRITICAL', action: 'BLOCK' };
  }

  if (score >= THRESHOLDS.CHALLENGE) {
    return { riskLevel: 'HIGH', action: 'CHALLENGE' };
  }

  if (score >= THRESHOLDS.SUSPICIOUS) {
    return { riskLevel: 'MEDIUM', action: 'LOG' };
  }

  if (score >= 25) {
    return { riskLevel: 'LOW', action: 'ALLOW' };
  }

  return { riskLevel: 'NORMAL', action: 'ALLOW' };
}

function calculateConfidence(
  components: ScoringComponents,
  finalScore: number
): number {
  const scores = [
    components.behaviorScore,
    components.reputationScore,
    components.headerScore,
    components.velocityScore,
    components.fingerprintScore,
  ];

  const highScores = scores.filter(s => s > 50).length;
  const mediumScores = scores.filter(s => s > 30 && s <= 50).length;

  let confidence = 50;

  if (highScores >= 4) confidence = 95;
  else if (highScores >= 3) confidence = 85;
  else if (highScores >= 2) confidence = 75;
  else if (highScores === 1 && mediumScores >= 2) confidence = 65;

  if (finalScore > 90 || finalScore < 10) {
    confidence = Math.min(100, confidence + 10);
  }

  return Math.min(100, Math.max(0, confidence));
}

function generateReasoning(
  components: ScoringComponents,
  finalScore: number
): string[] {
  const reasons: string[] = [];

  if (components.behaviorScore > 70) {
    reasons.push(`High-risk behavior patterns detected (score: ${components.behaviorScore})`);
  } else if (components.behaviorScore > 50) {
    reasons.push(`Suspicious behavior detected (score: ${components.behaviorScore})`);
  }

  if (components.reputationScore > 70) {
    reasons.push(`High-risk IP/network (score: ${components.reputationScore})`);
  } else if (components.reputationScore > 50) {
    reasons.push(`Moderate IP reputation risk (score: ${components.reputationScore})`);
  }

  if (components.headerScore > 70) {
    reasons.push(`Invalid or missing headers (score: ${components.headerScore})`);
  }

  if (components.velocityScore > 70) {
    reasons.push(`Abnormal request rate (score: ${components.velocityScore})`);
  }

  if (components.fingerprintScore > 70) {
    reasons.push(`Suspicious device fingerprint (score: ${components.fingerprintScore})`);
  }

  if (finalScore >= THRESHOLDS.BLOCK) {
    reasons.push('CRITICAL THREAT - Automatic block recommended');
  } else if (finalScore >= THRESHOLDS.CHALLENGE) {
    reasons.push('HIGH RISK - Challenge verification required');
  } else if (finalScore >= THRESHOLDS.SUSPICIOUS) {
    reasons.push('MEDIUM RISK - Monitoring recommended');
  }

  if (reasons.length === 0) {
    reasons.push('Normal traffic pattern detected');
  }

  return reasons;
}

export function computeHeaderScore(headers: Record<string, string>): number {
  let score = 0;

  const criticalHeaders = [
    'user-agent', 'accept', 'accept-language', 'accept-encoding',
  ];

  const missing = criticalHeaders.filter(h => 
    !headers[h] && !headers[h.toLowerCase()]
  );

  score += (missing.length / criticalHeaders.length) * 40;

  const ua = headers['user-agent'] || headers['User-Agent'] || '';
  if (ua.length === 0) score += 30;
  else if (ua.length < 20) score += 20;

  if (!headers['sec-ch-ua'] && !headers['Sec-CH-UA']) score += 15;

  const accept = headers['accept'] || headers['Accept'] || '';
  if (!accept.includes('text/html') && !accept.includes('application/json')) {
    score += 15;
  }

  return Math.min(100, Math.round(score));
}

export function computeVelocityScore(requestsPerMinute: number): number {
  if (requestsPerMinute > 200) return 100;
  if (requestsPerMinute > 100) return 85;
  if (requestsPerMinute > 50) return 70;
  if (requestsPerMinute > 30) return 50;
  if (requestsPerMinute > 20) return 30;
  if (requestsPerMinute > 10) return 15;
  return 0;
}

export { THRESHOLDS, SCORE_WEIGHTS };
