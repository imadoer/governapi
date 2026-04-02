import { PLANS, PlanKey } from '@/config/plans';

export interface Usage {
  apiCalls: number;
  endpointsCount: number;
}

export function withinLimit(planKey: PlanKey, usage: Usage) {
  const caps = PLANS[planKey].limits;

  return {
    apiCalls: caps.apiCalls === Infinity || usage.apiCalls < caps.apiCalls,
    endpoints: caps.endpoints === Infinity || usage.endpointsCount <= caps.endpoints,
  };
}

export function warnThreshold(used: number, cap: number) {
  if (cap === Infinity) return false;
  return used >= cap * 0.8; // 80% threshold
}

export function getUsagePercentage(used: number, cap: number) {
  if (cap === Infinity) return 0;
  return Math.min(100, Math.round((used / cap) * 100));
}

export function getRemainingCalls(used: number, cap: number) {
  if (cap === Infinity) return Infinity;
  return Math.max(0, cap - used);
}
