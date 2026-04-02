"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  BoltIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0.95]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: MagnifyingGlassIcon,
      title: "API Discovery",
      description:
        "Find every endpoint automatically across your entire infrastructure.",
      color: "cyan",
    },
    {
      icon: ShieldCheckIcon,
      title: "Threat Detection",
      description:
        "Detect and block attacks in real-time with AI-powered analysis.",
      color: "violet",
    },
    {
      icon: BoltIcon,
      title: "Policy Enforcement",
      description: "Enforce compliance at runtime with automated governance.",
      color: "blue",
    },
    {
      icon: ChartBarIcon,
      title: "AI Insights",
      description:
        "Explain risks in plain language with intelligent reporting.",
      color: "purple",
    },
  ];

  const integrations = [
    "Slack",
    "AWS",
    "Cloudflare",
    "GitHub",
    "Datadog",
    "Azure",
    "PagerDuty",
    "Notion",
  ];

  const testimonials = [
    {
      quote: "GovernAPI cut our API incident response time by 80%.",
      author: "Sarah Chen",
      role: "CTO, TechCorp",
      image: "👤",
    },
    {
      quote:
        "Finally, a security platform that developers actually want to use.",
      author: "Marcus Rodriguez",
      role: "Security Lead, DataFlow",
      image: "👤",
    },
    {
      quote: "The AI insights saved us from a critical vulnerability.",
      author: "Emily Watson",
      role: "VP Engineering, CloudScale",
      image: "👤",
    },
  ];

  const plans = [
    {
      name: "Developer",
      price: "Free",
      features: [
        "3 endpoints",
        "Threat alerts",
        "Basic monitoring",
        "7-day data retention",
      ],
    },
    {
      name: "Professional",
      price: "$149",
      period: "/mo",
      features: [
        "25 endpoints",
        "AI insights",
        "Advanced threats",
        "90-day retention",
        "Priority support",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      features: [
        "Unlimited endpoints",
        "Compliance suite",
        "SLA guarantee",
        "Dedicated support",
        "Custom integrations",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Enterprise Header */}
      <motion.header
        style={{ opacity: headerOpacity }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "backdrop-blur-[12px] bg-slate-900/80"
            : "backdrop-blur-[6px] bg-white/5"
        } border-b border-white/10`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-lg flex items-center justify-center">
                <ShieldCheckIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 drop-shadow-[0_0_10px_#00B3FF44]">
                GovernAPI
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <Link
                href="/products"
                className="text-slate-300 hover:text-white transition-colors font-medium"
              >
                Products
              </Link>
              <Link
                href="/solutions"
                className="text-slate-300 hover:text-white transition-colors font-medium"
              >
                Solutions
              </Link>
              <Link
                href="/docs"
                className="text-slate-300 hover:text-white transition-colors font-medium"
              >
                Docs
              </Link>
              <Link
                href="/pricing"
                className="text-slate-300 hover:text-white transition-colors font-medium"
              >
                Pricing
              </Link>
              <Link
                href="/company"
                className="text-slate-300 hover:text-white transition-colors font-medium"
              >
                Company
              </Link>
            </nav>

            {/* Auth Buttons */}
            <div className="hidden lg:flex items-center gap-4">
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white font-medium hover:bg-white/10 transition-all"
                >
                  Login
                </motion.button>
              </Link>
              <Link href="/login?mode=register">
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 0 20px rgba(108, 99, 255, 0.4)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-lg text-white font-semibold shadow-lg hover:shadow-[0_0_20px_#6C63FF55] transition-all"
                >
                  Sign Up
                </motion.button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-white"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden bg-slate-900/95 backdrop-blur-xl border-t border-white/10"
          >
            <div className="px-6 py-6 space-y-4">
              <Link
                href="/products"
                className="block text-slate-300 hover:text-white transition-colors py-2"
              >
                Products
              </Link>
              <Link
                href="/solutions"
                className="block text-slate-300 hover:text-white transition-colors py-2"
              >
                Solutions
              </Link>
              <Link
                href="/docs"
                className="block text-slate-300 hover:text-white transition-colors py-2"
              >
                Docs
              </Link>
              <Link
                href="/pricing"
                className="block text-slate-300 hover:text-white transition-colors py-2"
              >
                Pricing
              </Link>
              <Link
                href="/company"
                className="block text-slate-300 hover:text-white transition-colors py-2"
              >
                Company
              </Link>
              <div className="pt-4 space-y-3">
                <Link href="/login" className="block">
                  <button className="w-full px-6 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white font-medium">
                    Login
                  </button>
                </Link>
                <Link href="/login?mode=register" className="block">
                  <button className="w-full px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-lg text-white font-semibold">
                    Sign Up
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </motion.header>

      {/* Hero Section - Redesigned */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_140%_at_50%_0%,#1a1f3f_0%,#0c1224_80%)]">
          {/* Animated Orbs */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
            <div
              className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-[120px] animate-pulse"
              style={{ animationDelay: "1s" }}
            />
          </div>

          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)",
                backgroundSize: "50px 50px",
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column - Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                The Security Command Center for APIs
              </h1>

              <p className="text-xl md:text-2xl text-slate-300 mb-10 leading-relaxed">
                Discover, monitor, and secure every endpoint — with AI-driven
                insights and real-time protection.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
                <Link href="/login?mode=register">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all"
                  >
                    Start Free Trial
                  </motion.button>
                </Link>

                <Link href="/login">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/20 text-white rounded-xl font-semibold text-lg hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                    Login to Dashboard
                    <ArrowRightIcon className="w-5 h-5" />
                  </motion.button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-cyan-400" />
                  <span className="font-medium">SOC 2</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-cyan-400" />
                  <span className="font-medium">ISO 27001</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-cyan-400" />
                  <span className="font-medium">GDPR</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-cyan-400" />
                  <span className="font-medium">HIPAA</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column - Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(91,124,255,0.3)] border border-cyan-500/30">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 blur-3xl -z-10" />

                {/* Dashboard Mockup */}
                <div className="relative bg-slate-900/90 backdrop-blur-sm aspect-video flex items-center justify-center">
                  <Link href="/dashboard" className="relative group">
                    <div className="p-12 text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                        <ShieldCheckIcon className="w-12 h-12 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">
                        Live Dashboard Preview
                      </h3>
                      <p className="text-slate-400 mb-6">
                        See real-time threat detection in action
                      </p>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-lg text-white font-semibold"
                      >
                        Launch Dashboard
                        <ArrowRightIcon className="w-5 h-5" />
                      </motion.div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Floating Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="absolute -bottom-6 -left-6 bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-4 shadow-[0_0_30px_rgba(6,182,212,0.2)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                    <ShieldCheckIcon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">99.9%</p>
                    <p className="text-sm text-slate-400">Threat Detection</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="absolute -top-6 -right-6 bg-slate-900/90 backdrop-blur-xl border border-violet-500/30 rounded-2xl p-4 shadow-[0_0_30px_rgba(139,92,246,0.2)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center">
                    <BoltIcon className="w-6 h-6 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">&lt;10ms</p>
                    <p className="text-sm text-slate-400">Response Time</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6 bg-gradient-to-b from-[#0c1224] to-[#0a0e1a]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold text-white mb-6">
              Everything Starts With Visibility
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Govern every API call — from design to runtime
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-cyan-500/50 hover:shadow-[0_0_24px_rgba(6,182,212,0.2)] transition-all duration-300"
                >
                  <div
                    className={`w-14 h-14 bg-${feature.color}-500/10 rounded-xl flex items-center justify-center mb-6`}
                  >
                    <Icon className={`w-8 h-8 text-${feature.color}-400`} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-32 px-6 bg-gradient-to-b from-[#0a0e1a] to-[#0c1224]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold text-white mb-6">
              Connect in Minutes — Not Months
            </h2>
            <p className="text-xl text-slate-400">
              Integrate with your existing security stack
            </p>
          </motion.div>

          <div className="flex flex-wrap items-center justify-center gap-12">
            {integrations.map((name, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-2xl font-semibold text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                {name}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Insights Section */}
      <section className="py-32 px-6 bg-gradient-to-b from-[#0c1224] to-[#0a0e1a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="w-full aspect-square bg-gradient-to-br from-cyan-500/20 to-violet-500/20 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                <div className="text-9xl">🧠</div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 rounded-3xl blur-3xl -z-10" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl font-bold text-white mb-8">
                AI-Powered Threat Intelligence
              </h2>
              <p className="text-xl text-slate-400 leading-relaxed mb-8">
                GovernAPI's threat intelligence engine learns from millions of
                API events to predict and prevent attacks before they happen.
              </p>
              <Link href="/login?mode=register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/10 text-white rounded-xl font-semibold text-lg hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  See AI in Action
                  <ArrowRightIcon className="w-5 h-5" />
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Security Compliance */}
      <section className="py-32 px-6 bg-gradient-to-b from-[#0a0e1a] to-[#0c1224]">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-bold text-white mb-6">
              Built for Enterprise Standards
            </h2>
            <p className="text-xl text-slate-400 mb-16">
              Satisfy the most demanding compliance requirements
            </p>

            <div className="flex flex-wrap items-center justify-center gap-12">
              {["SOC 2", "ISO 27001", "GDPR", "HIPAA", "OWASP"].map(
                (cert, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="w-32 h-32 bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl flex items-center justify-center hover:border-cyan-500/50 transition-all"
                  >
                    <span className="text-lg font-bold text-cyan-400">
                      {cert}
                    </span>
                  </motion.div>
                ),
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 px-6 bg-gradient-to-b from-[#0c1224] to-[#0a0e1a]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold text-white mb-6">
              Trusted by Security Teams
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-cyan-500/50 transition-all"
              >
                <p className="text-lg text-slate-300 mb-6 leading-relaxed italic">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{testimonial.image}</div>
                  <div>
                    <p className="font-semibold text-white">
                      {testimonial.author}
                    </p>
                    <p className="text-sm text-slate-400">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-32 px-6 bg-gradient-to-b from-[#0a0e1a] to-[#0c1224]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold text-white mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-400">
              Choose the plan that fits your needs
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-slate-900/50 backdrop-blur-sm border ${
                  plan.popular ? "border-cyan-500" : "border-white/10"
                } rounded-2xl p-8 hover:border-cyan-500/50 transition-all ${
                  plan.popular ? "ring-2 ring-cyan-500/50" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full text-white text-sm font-semibold">
                    Most Popular
                  </div>
                )}

                <h3 className="text-2xl font-bold text-white mb-4">
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-white">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-slate-400 text-xl">
                      {plan.period}
                    </span>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 text-slate-300"
                    >
                      <CheckCircleIcon className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/login?mode=register">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-full px-6 py-3 ${
                      plan.popular
                        ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white"
                        : "bg-white/5 text-white border border-white/10"
                    } rounded-xl font-semibold transition-all`}
                  >
                    Get Started
                  </motion.button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-gradient-to-b from-[#0c1224] to-[#0a0e1a] border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-2">
                GovernAPI
              </h3>
              <p className="text-slate-400">Built for a safer internet.</p>
            </div>

            <div className="flex flex-wrap items-center gap-8">
              <Link
                href="/docs"
                className="text-slate-400 hover:text-cyan-400 transition-colors"
              >
                Docs
              </Link>
              <Link
                href="/blog"
                className="text-slate-400 hover:text-cyan-400 transition-colors"
              >
                Blog
              </Link>
              <Link
                href="/pricing"
                className="text-slate-400 hover:text-cyan-400 transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/terms"
                className="text-slate-400 hover:text-cyan-400 transition-colors"
              >
                Legal
              </Link>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 text-center text-slate-500 text-sm">
            © 2025 GovernAPI — The Security Command Center for APIs
          </div>
        </div>
      </footer>
    </div>
  );
}
