"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  BoltIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const handleCTAClick = (planName: string) => {
    if (planName === "Enterprise") {
      window.location.href = "mailto:sales@governapi.com";
    } else {
      const planParam = planName.toLowerCase();
      router.push(`/login?mode=register&plan=${planParam}`);
    }
  };

  const plans = [
    {
      name: "Starter",
      price: "Free",
      period: "",
      annualPrice: "Free",
      description: "Perfect for testing and small projects",
      features: {
        "Security & Monitoring": [
          "10 endpoints monitored",
          "Threat alerts",
          "Weekly security scans",
          "7-day data retention",
        ],
        "API Discovery": ["Manual API catalog"],
        "Compliance": ["Basic compliance checks"],
        "Support": ["Community support", "1 user seat"],
      },
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Growth",
      price: "$49",
      period: "/month",
      annualPrice: "$39",
      description: "For growing teams that need daily monitoring",
      features: {
        "Security & Monitoring": [
          "100 endpoints monitored",
          "Daily security scans",
          "Basic AI insights",
          "30-day data retention",
        ],
        "API Discovery": ["Automated API discovery", "OpenAPI import"],
        "Compliance": ["Compliance dashboards", "Email + Slack alerts"],
        "Support": ["Email support (48h response)", "3 user seats"],
      },
      cta: "Start Free Trial",
      popular: false,
    },
    {
      name: "Professional",
      price: "$199",
      period: "/month",
      annualPrice: "$169",
      description: "Ideal for mid-market companies with real-time needs",
      features: {
        "Security & Monitoring": [
          "1,000 endpoints monitored",
          "Real-time threat detection",
          "Advanced bot protection",
          "90-day data retention",
        ],
        "API Discovery": [
          "Automated API discovery",
          "OpenAPI import",
          "API catalog management",
        ],
        "Compliance": [
          "SOC2, GDPR, HIPAA, PCI-DSS tracking",
          "Automated compliance scoring",
          "Compliance dashboards",
        ],
        "Analytics & Monitoring": [
          "Performance metrics",
          "Traffic analysis",
          "Custom alerts",
        ],
        "Integrations": [
          "Slack/Teams integration",
          "Webhooks",
          "Email notifications",
        ],
        "Support": ["Priority support (24h response)", "10 user seats"],
      },
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      annualPrice: "Custom",
      description: "For large organizations with unlimited needs",
      features: {
        "Security & Monitoring": [
          "Unlimited endpoints",
          "AI-powered threat intelligence",
          "Custom security rules engine",
          "Real-time threat blocking",
          "2-year+ data retention",
        ],
        "API Discovery": [
          "Full automated discovery",
          "Shadow API detection",
          "API versioning tracking",
        ],
        "Compliance": [
          "All 25+ frameworks (SOX, ISO 27001, NIST, FISMA, etc.)",
          "Custom compliance policies",
          "Audit logging & trails",
          "Compliance automation",
        ],
        "Advanced Features": [
          "SSO integration (SAML, OAuth)",
          "Custom branding",
          "SIEM integration",
          "Custom policy engine",
          "IP whitelisting",
        ],
        "Analytics & Reporting": [
          "Advanced analytics",
          "Custom reporting",
          "Real-time dashboards",
          "Executive summaries",
        ],
        "Integrations": [
          "Custom integrations",
          "Full API access",
          "Dedicated webhook endpoints",
        ],
        "Support": [
          "Dedicated customer success manager",
          "24x7 premium support",
          "On-premise deployment option",
          "SLA guarantees (99.9% uptime)",
        ],
      },
      cta: "Contact Sales",
      popular: false,
    },
  ];

  const comparisonFeatures = [
    {
      category: "Security & Monitoring",
      features: [
        { name: "Endpoints Monitored", dev: "3", pro: "25", ent: "Unlimited" },
        { name: "Threat Detection", dev: "Basic", pro: "Advanced", ent: "AI-Powered" },
        { name: "Bot Protection", dev: false, pro: true, ent: true },
        { name: "Custom Security Rules", dev: false, pro: false, ent: true },
        { name: "Data Retention", dev: "7 days", pro: "90 days", ent: "2+ years" },
      ],
    },
    {
      category: "API Discovery",
      features: [
        { name: "Automated Discovery", dev: false, pro: true, ent: true },
        { name: "Shadow API Detection", dev: false, pro: false, ent: true },
        { name: "OpenAPI Import", dev: false, pro: true, ent: true },
      ],
    },
    {
      category: "Compliance",
      features: [
        { name: "Compliance Frameworks", dev: "Basic", pro: "4 major", ent: "25+" },
        { name: "Automated Reporting", dev: false, pro: true, ent: true },
        { name: "Custom Policies", dev: false, pro: false, ent: true },
        { name: "Audit Logging", dev: false, pro: false, ent: true },
      ],
    },
    {
      category: "Support",
      features: [
        { name: "Support Hours", dev: "Community", pro: "12x5", ent: "24x7" },
        { name: "Response Time", dev: "Best effort", pro: "4 hours", ent: "1 hour" },
        { name: "Dedicated CSM", dev: false, pro: false, ent: true },
      ],
    },
  ];

  const faqs = [
    {
      key: "endpoint-def",
      question: "What counts as an endpoint?",
      answer:
        "An endpoint is a unique combination of HTTP method and URL path (e.g., GET /api/users). Query parameters and different request bodies to the same endpoint count as one endpoint.",
    },
    {
      key: "upgrade",
      question: "Can I upgrade or downgrade my plan anytime?",
      answer:
        "Yes! You can upgrade instantly at any time. Downgrades take effect at the end of your current billing cycle. You'll receive a prorated credit for any unused time.",
    },
    {
      key: "exceed-limit",
      question: "What happens if I exceed my endpoint limit?",
      answer:
        "We'll notify you when you reach 80% and 100% of your limit. You can either upgrade your plan or we'll continue monitoring with a small overage fee of $10 per additional endpoint per month.",
    },
    {
      key: "discount",
      question: "Do you offer annual discounts?",
      answer:
        "Yes! Pay annually and save 15% on Professional plans. Enterprise customers can negotiate custom terms with volume discounts available.",
    },
    {
      key: "frameworks",
      question: "What compliance frameworks do you support?",
      answer:
        "Professional includes SOC2, GDPR, HIPAA, and PCI-DSS. Enterprise includes 25+ frameworks including SOX, ISO 27001, ISO 27002, NIST CSF, NIST 800-53, CIS Controls, FedRAMP, FISMA, NERC CIP, and many more.",
    },
    {
      key: "trial",
      question: "Is there a free trial for Professional?",
      answer:
        "Yes! We offer a 14-day free trial of the Professional plan with full access to all features. No credit card required to start.",
    },
    {
      key: "integrations",
      question: "What integrations do you support?",
      answer:
        "We integrate with Slack, Microsoft Teams, PagerDuty, Datadog, AWS, Azure, GitHub, and more. Enterprise customers get custom integration support and full API access.",
    },
    {
      key: "onprem",
      question: "Do you support on-premise deployment?",
      answer:
        "Yes, on-premise deployment is available for Enterprise customers. Contact our sales team to discuss your specific requirements.",
    },
  ];

  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <CheckIcon className="w-5 h-5 text-emerald-400 mx-auto" />
      ) : (
        <XMarkIcon className="w-5 h-5 text-slate-600 mx-auto" />
      );
    }
    return <span className="text-slate-300 text-sm">{value}</span>;
  };

  const trustBadges = [
    { icon: LockClosedIcon, label: "SOC 2 Type II", sub: "Certified" },
    { icon: ShieldCheckIcon, label: "GDPR", sub: "Compliant" },
    { icon: BoltIcon, label: "99.9%", sub: "Uptime SLA" },
    { icon: GlobeAltIcon, label: "Global", sub: "Infrastructure" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <div className="relative border-b border-white/5">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <button
            onClick={() => router.push("/")}
            className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-8 py-20">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            Simple, Transparent{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Pricing
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Choose the plan that fits your organization&apos;s API security needs
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-full p-1.5">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-white/10 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billingCycle === "annual"
                  ? "bg-white/10 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Annual
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                Save 15%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-24">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`relative rounded-2xl p-6 flex flex-col ${
                plan.popular
                  ? "bg-gradient-to-b from-cyan-500/10 to-violet-500/10 border-2 border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.15)]"
                  : "bg-slate-800/30 backdrop-blur-sm border border-white/10 hover:border-white/20"
              } transition-all`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-4 py-1 rounded-full text-xs font-semibold tracking-wide">
                  MOST POPULAR
                </div>
              )}

              <div className="mb-6 pt-2">
                <h2 className="text-xl font-bold text-white mb-2">{plan.name}</h2>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-white">
                    {billingCycle === "annual" && plan.annualPrice !== plan.price
                      ? plan.annualPrice
                      : plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-slate-500 ml-1">
                      {plan.period}
                      {billingCycle === "annual" && (
                        <span className="block text-xs text-slate-600 mt-1">billed annually</span>
                      )}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400">{plan.description}</p>
              </div>

              <div className="flex-1 space-y-5 mb-8">
                {Object.entries(plan.features).map(([category, features]) => (
                  <div key={category}>
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      {category}
                    </div>
                    <div className="space-y-2">
                      {(features as string[]).map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckIcon className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-slate-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleCTAClick(plan.name)}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                  plan.popular
                    ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-[1.02]"
                    : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                }`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-24"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-10">
            Detailed Feature{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Comparison
            </span>
          </h2>
          <div className="bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400 w-[40%]">
                      Feature
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-slate-400">
                      Developer
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-cyan-400">
                      Professional
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-slate-400">
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((section) => (
                    <>
                      <tr key={section.category}>
                        <td
                          colSpan={4}
                          className="px-6 py-3 text-xs font-bold text-cyan-400 uppercase tracking-wider bg-white/[0.02]"
                        >
                          {section.category}
                        </td>
                      </tr>
                      {section.features.map((feature) => (
                        <tr
                          key={feature.name}
                          className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-6 py-3.5 text-sm text-slate-300 font-medium">
                            {feature.name}
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            {renderFeatureValue(feature.dev)}
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            {renderFeatureValue(feature.pro)}
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            {renderFeatureValue(feature.ent)}
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-24"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-10">
            Enterprise-Grade Security & Compliance
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustBadges.map((badge, index) => {
              const Icon = badge.icon;
              return (
                <motion.div
                  key={badge.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:border-cyan-500/30 transition-all group"
                >
                  <div className="w-12 h-12 mx-auto mb-3 bg-cyan-500/10 rounded-xl flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                    <Icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="text-lg font-bold text-white">{badge.label}</div>
                  <div className="text-sm text-slate-400">{badge.sub}</div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-24"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq) => (
              <div
                key={faq.key}
                className="bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === faq.key ? null : faq.key)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="font-medium text-white">{faq.question}</span>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      openFaq === faq.key ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === faq.key && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="px-6 pb-4"
                  >
                    <p className="text-slate-400 text-sm leading-relaxed">{faq.answer}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* ROI Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-24"
        >
          <div className="bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-emerald-500/10 border border-white/10 rounded-2xl p-12 text-center backdrop-blur-sm">
            <h2 className="text-3xl font-bold text-white mb-4">Calculate Your ROI</h2>
            <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
              The average data breach costs $4.45M and takes 277 days to identify and contain.
              Our customers see 800%+ ROI annually by preventing breaches before they happen.
            </p>
            <button
              onClick={() => router.push("/customer/dashboard")}
              className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.02]"
            >
              See ROI Calculator
            </button>
          </div>
        </motion.div>

        {/* Contact Sales CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Still have questions?</h2>
            <p className="text-lg text-slate-400 mb-8">
              Our team is here to help you find the perfect plan for your organization.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => (window.location.href = "mailto:sales@governapi.com")}
                className="px-8 py-3.5 bg-white/5 border border-white/10 text-white rounded-xl font-semibold hover:bg-white/10 transition-all"
              >
                Contact Sales
              </button>
              <button
                onClick={() => router.push("/login?mode=register&plan=professional")}
                className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.02]"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
