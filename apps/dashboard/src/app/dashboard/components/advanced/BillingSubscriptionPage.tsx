"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CreditCardIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  BoltIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { message, Spin, Tag, Tabs, Progress } from "antd";

interface UsageStats {
  apis_monitored: number;
  scans_performed: number;
  total_requests: number;
}

interface CostBreakdown {
  api_monitoring: number;
  security_scanning: number;
  api_requests: number;
}

export function BillingSubscriptionPage({ companyId }: { companyId: string }) {
  const [loading, setLoading] = useState(true);
  const [monthlyCost, setMonthlyCost] = useState(0);
  const [monthlySavings, setMonthlySavings] = useState(0);
  const [roiPercentage, setRoiPercentage] = useState(0);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(
    null,
  );
  const [currentPlan] = useState("professional");

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/analytics/costs", {
        headers: { "x-tenant-id": companyId },
      });
      const data = await response.json();

      if (data.success) {
        setMonthlyCost(data.monthly_cost || 0);
        setMonthlySavings(data.monthly_savings || 0);
        setRoiPercentage(data.roi_percentage || 0);
        setUsageStats(data.usage_stats);
        setCostBreakdown(data.breakdown);
      }
    } catch (error) {
      console.error("Failed to fetch billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) fetchBillingData();
  }, [companyId]);

  const handleUpgrade = async (planType: string) => {
    try {
      const response = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": companyId,
        },
        body: JSON.stringify({
          planType,
          billingCycle: "monthly",
        }),
      });

      const data = await response.json();

      if (data.success && data.checkout.url) {
        window.location.href = data.checkout.url;
      } else {
        message.error(data.error || "Failed to start checkout");
      }
    } catch (error) {
      message.error("Failed to upgrade plan");
    }
  };

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: 29,
      features: [
        "Up to 10 APIs",
        "100 scans/month",
        "Basic security monitoring",
        "Email support",
        "30-day data retention",
      ],
      color: "blue",
    },
    {
      id: "professional",
      name: "Professional",
      price: 99,
      features: [
        "Up to 50 APIs",
        "Unlimited scans",
        "Advanced threat detection",
        "Priority support",
        "90-day data retention",
        "Custom webhooks",
        "Compliance reports",
      ],
      color: "cyan",
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 299,
      features: [
        "Unlimited APIs",
        "Unlimited scans",
        "AI-powered security",
        "24/7 support",
        "Unlimited data retention",
        "Custom integrations",
        "Dedicated account manager",
        "SLA guarantee",
      ],
      color: "purple",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Billing & Subscription
          </h1>
          <p className="text-slate-400">
            Manage your plan and billing information
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchBillingData}
          className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors"
        >
          <ArrowPathIcon className="w-5 h-5 text-white" />
        </motion.button>
      </div>

      {/* Current Usage & Costs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <CurrencyDollarIcon className="w-10 h-10 text-cyan-500" />
            <div>
              <p className="text-sm text-slate-400">Monthly Cost</p>
              <p className="text-3xl font-bold text-white">
                ${monthlyCost.toFixed(2)}
              </p>
            </div>
          </div>
          <Progress percent={33} strokeColor="#06b6d4" showInfo={false} />
          <p className="text-xs text-slate-400 mt-2">33% of your budget</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheckIcon className="w-10 h-10 text-green-500" />
            <div>
              <p className="text-sm text-slate-400">Cost Savings</p>
              <p className="text-3xl font-bold text-green-500">
                ${monthlySavings.toFixed(2)}
              </p>
            </div>
          </div>
          <p className="text-sm text-green-400">From blocked threats</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <ChartBarIcon className="w-10 h-10 text-purple-500" />
            <div>
              <p className="text-sm text-slate-400">ROI</p>
              <p className="text-3xl font-bold text-purple-500">
                {roiPercentage}%
              </p>
            </div>
          </div>
          <p className="text-sm text-purple-400">Return on investment</p>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs
        defaultActiveKey="plans"
        items={[
          {
            key: "plans",
            label: "💳 Plans & Pricing",
            children: (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan, index) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative bg-slate-800/50 border ${
                        plan.popular ? "border-cyan-500" : "border-slate-700"
                      } rounded-2xl p-6 ${
                        currentPlan === plan.id ? "ring-2 ring-cyan-500" : ""
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                          <Tag color="cyan" className="px-4 py-1">
                            Most Popular
                          </Tag>
                        </div>
                      )}

                      {currentPlan === plan.id && (
                        <div className="absolute -top-4 right-4">
                          <Tag color="green" className="px-4 py-1">
                            Current Plan
                          </Tag>
                        </div>
                      )}

                      <h3 className="text-2xl font-bold text-white mb-2">
                        {plan.name}
                      </h3>
                      <div className="mb-6">
                        <span className="text-4xl font-bold text-white">
                          ${plan.price}
                        </span>
                        <span className="text-slate-400">/month</span>
                      </div>

                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-2 text-sm text-slate-400"
                          >
                            <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {currentPlan === plan.id ? (
                        <button
                          disabled
                          className="w-full px-6 py-3 bg-slate-700 text-slate-400 rounded-xl font-semibold cursor-not-allowed"
                        >
                          Current Plan
                        </button>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleUpgrade(plan.id)}
                          className={`w-full px-6 py-3 bg-${plan.color}-500 hover:bg-${plan.color}-600 text-white rounded-xl font-semibold`}
                        >
                          {plans.findIndex((p) => p.id === currentPlan) < index
                            ? "Upgrade"
                            : "Downgrade"}
                        </motion.button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            ),
          },
          {
            key: "usage",
            label: "📊 Usage & Breakdown",
            children: (
              <div className="space-y-6">
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-6">
                    Current Usage
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-900/50 rounded-xl">
                      <p className="text-slate-400 text-sm mb-2">
                        APIs Monitored
                      </p>
                      <p className="text-3xl font-bold text-white">
                        {usageStats?.apis_monitored || 0}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">of 50 limit</p>
                    </div>

                    <div className="p-4 bg-slate-900/50 rounded-xl">
                      <p className="text-slate-400 text-sm mb-2">
                        Scans Performed
                      </p>
                      <p className="text-3xl font-bold text-white">
                        {usageStats?.scans_performed || 0}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">unlimited</p>
                    </div>

                    <div className="p-4 bg-slate-900/50 rounded-xl">
                      <p className="text-slate-400 text-sm mb-2">
                        API Requests
                      </p>
                      <p className="text-3xl font-bold text-white">
                        {usageStats?.total_requests || 0}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">this month</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-6">
                    Cost Breakdown
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <BoltIcon className="w-6 h-6 text-cyan-500" />
                        <span className="text-white">API Monitoring</span>
                      </div>
                      <span className="text-white font-semibold">
                        ${costBreakdown?.api_monitoring?.toFixed(2) || "0.00"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <ShieldCheckIcon className="w-6 h-6 text-green-500" />
                        <span className="text-white">Security Scanning</span>
                      </div>
                      <span className="text-white font-semibold">
                        $
                        {costBreakdown?.security_scanning?.toFixed(2) || "0.00"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <ChartBarIcon className="w-6 h-6 text-purple-500" />
                        <span className="text-white">API Requests</span>
                      </div>
                      <span className="text-white font-semibold">
                        ${costBreakdown?.api_requests?.toFixed(2) || "0.00"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                      <span className="text-white font-bold">
                        Total Monthly Cost
                      </span>
                      <span className="text-2xl text-cyan-400 font-bold">
                        ${monthlyCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: "billing",
            label: "🧾 Billing History",
            children: (
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                <div className="text-center py-16">
                  <DocumentTextIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-xl text-white font-semibold mb-2">
                    No Billing History
                  </p>
                  <p className="text-slate-400">
                    Your invoices will appear here
                  </p>
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
