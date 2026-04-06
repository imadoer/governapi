"use client";

import { ShieldCheckIcon } from "@heroicons/react/24/outline";

const PLAN_NAMES: Record<string, string> = { free: "Free", starter: "Starter", professional: "Professional" };
const PLAN_PRICES: Record<string, string> = { starter: "$19/mo", professional: "$49/mo" };

export function UpgradeGate({ feature, requiredPlan, currentPlan }: { feature: string; requiredPlan: string; currentPlan: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center max-w-sm">
        <ShieldCheckIcon className="w-10 h-10 text-gray-600 mx-auto mb-4" />
        <h3 className="text-[16px] font-semibold text-white mb-2">{feature}</h3>
        <p className="text-[13px] text-gray-500 mb-4">
          This feature requires the <span className="text-white font-medium">{PLAN_NAMES[requiredPlan] || requiredPlan}</span> plan
          {PLAN_PRICES[requiredPlan] ? ` (${PLAN_PRICES[requiredPlan]})` : ""}.
          You&apos;re currently on <span className="text-gray-400">{PLAN_NAMES[currentPlan] || currentPlan}</span>.
        </p>
        <button className="px-5 py-2 rounded-xl text-[13px] font-medium bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 transition-opacity">
          Upgrade to {PLAN_NAMES[requiredPlan]}
        </button>
      </div>
    </div>
  );
}

/** Check if plan meets requirement */
export function planHasAccess(currentPlan: string, requiredPlan: string): boolean {
  const levels: Record<string, number> = { free: 0, starter: 1, professional: 2, enterprise: 3 };
  return (levels[currentPlan] ?? 0) >= (levels[requiredPlan] ?? 0);
}
