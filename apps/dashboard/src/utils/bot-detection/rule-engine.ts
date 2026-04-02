/**
 * Bot Rules Engine
 * Evaluates configurable rules and executes actions
 */

interface BotRule {
  id: number;
  name: string;
  enabled: boolean;
  priority: number;
  conditions: any;
  action: 'BLOCK' | 'CHALLENGE' | 'MONITOR' | 'ALLOW';
  actionParams?: any;
}

interface DetectionContext {
  sourceIp: string;
  userAgent: string | null;
  path: string;
  asnType?: string;
  velocityScore?: number;
  finalScore?: number;
  headlessDetected?: boolean;
  crawlerVerified?: boolean;
  country?: string;
}

interface RuleEvaluationResult {
  matched: boolean;
  rule: BotRule | null;
  action: string | null;
  executionTimeMs: number;
  matchedConditions: string[];
}

/**
 * Evaluate all rules and return first matching action
 */
export async function evaluateRules(
  rules: BotRule[],
  context: DetectionContext
): Promise<RuleEvaluationResult> {
  const startTime = Date.now();
  
  // Sort by priority (highest first)
  const sortedRules = rules
    .filter(r => r.enabled)
    .sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    const matchResult = evaluateSingleRule(rule, context);
    
    if (matchResult.matched) {
      const executionTimeMs = Date.now() - startTime;
      
      return {
        matched: true,
        rule,
        action: rule.action,
        executionTimeMs,
        matchedConditions: matchResult.matchedConditions,
      };
    }
  }

  // No rules matched
  return {
    matched: false,
    rule: null,
    action: null,
    executionTimeMs: Date.now() - startTime,
    matchedConditions: [],
  };
}

/**
 * Evaluate a single rule against context
 */
function evaluateSingleRule(
  rule: BotRule,
  context: DetectionContext
): { matched: boolean; matchedConditions: string[] } {
  const conditions = rule.conditions;
  const matchedConditions: string[] = [];
  let allConditionsMet = true;

  // Check ASN type
  if (conditions.asnType !== undefined) {
    if (context.asnType === conditions.asnType) {
      matchedConditions.push(`asnType=${conditions.asnType}`);
    } else {
      allConditionsMet = false;
    }
  }

  // Check path
  if (conditions.path !== undefined) {
    if (context.path === conditions.path) {
      matchedConditions.push(`path=${conditions.path}`);
    } else {
      allConditionsMet = false;
    }
  }

  // Check path pattern (regex)
  if (conditions.pathPattern !== undefined) {
    try {
      const regex = new RegExp(conditions.pathPattern);
      if (regex.test(context.path)) {
        matchedConditions.push(`pathPattern=${conditions.pathPattern}`);
      } else {
        allConditionsMet = false;
      }
    } catch (error) {
      allConditionsMet = false;
    }
  }

  // Check velocity score range
  if (conditions.velocityScore !== undefined && context.velocityScore !== undefined) {
    const { min, max } = conditions.velocityScore;
    if ((min === undefined || context.velocityScore >= min) &&
        (max === undefined || context.velocityScore <= max)) {
      matchedConditions.push(`velocityScore in range`);
    } else {
      allConditionsMet = false;
    }
  }

  // Check final score range
  if (conditions.finalScore !== undefined && context.finalScore !== undefined) {
    const { min, max } = conditions.finalScore;
    if ((min === undefined || context.finalScore >= min) &&
        (max === undefined || context.finalScore <= max)) {
      matchedConditions.push(`finalScore in range`);
    } else {
      allConditionsMet = false;
    }
  }

  // Check headless detected
  if (conditions.headlessDetected !== undefined) {
    if (context.headlessDetected === conditions.headlessDetected) {
      matchedConditions.push(`headlessDetected=${conditions.headlessDetected}`);
    } else {
      allConditionsMet = false;
    }
  }

  // Check crawler verified
  if (conditions.crawlerVerified !== undefined) {
    if (context.crawlerVerified === conditions.crawlerVerified) {
      matchedConditions.push(`crawlerVerified=${conditions.crawlerVerified}`);
    } else {
      allConditionsMet = false;
    }
  }

  // Check country
  if (conditions.country !== undefined && context.country) {
    if (conditions.country.includes(context.country)) {
      matchedConditions.push(`country=${context.country}`);
    } else {
      allConditionsMet = false;
    }
  }

  return {
    matched: allConditionsMet && matchedConditions.length > 0,
    matchedConditions,
  };
}

/**
 * Log rule execution to database
 */
export async function logRuleExecution(
  database: any,
  tenantId: number,
  result: RuleEvaluationResult,
  context: DetectionContext
): Promise<void> {
  if (!result.matched || !result.rule) return;

  try {
    await database.query(
      `INSERT INTO bot_rule_executions
        (rule_id, tenant_id, source_ip, matched_conditions, action_taken, execution_time_ms)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        result.rule.id,
        tenantId,
        context.sourceIp,
        JSON.stringify(result.matchedConditions),
        result.action,
        result.executionTimeMs,
      ]
    );
  } catch (error) {
    console.error('Failed to log rule execution:', error);
  }
}

/**
 * Get rule execution statistics
 */
export async function getRuleExecutionStats(
  database: any,
  tenantId: number,
  hours: number = 24
): Promise<any[]> {
  try {
    const results = await database.queryMany(
      `SELECT
        r.id as rule_id,
        r.name as rule_name,
        COUNT(*) as execution_count,
        AVG(e.execution_time_ms) as avg_execution_time,
        e.action_taken,
        COUNT(DISTINCT e.source_ip) as unique_ips
       FROM bot_rule_executions e
       JOIN bot_rules r ON e.rule_id = r.id
       WHERE e.tenant_id = $1
         AND e.created_at >= NOW() - INTERVAL '${hours} hours'
       GROUP BY r.id, r.name, e.action_taken
       ORDER BY execution_count DESC`,
      [tenantId]
    );

    return results;
  } catch (error) {
    console.error('Error fetching rule execution stats:', error);
    return [];
  }
}
