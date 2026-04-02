"use client";

import { useRouter } from "next/navigation";
import { Button, Layout, Typography, Card, Row, Col, Collapse, Table } from "antd";
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useState } from "react";

const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

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
      name: "Developer",
      price: "Free",
      period: "",
      annualPrice: "Free",
      description: "Perfect for testing and small projects",
      features: {
        "Security & Monitoring": [
          "3 endpoints monitored",
          "Threat alerts",
          "Basic monitoring",
          "7-day data retention",
        ],
        "API Discovery": ["Manual API catalog"],
        "Compliance": ["Basic compliance checks"],
        "Support": ["Community support"],
      },
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Professional",
      price: "$149",
      period: "/month",
      annualPrice: "$129",
      description: "Ideal for growing teams and mid-market companies",
      features: {
        "Security & Monitoring": [
          "25 endpoints monitored",
          "AI-powered insights",
          "Advanced threat detection",
          "Bot protection",
          "90-day data retention",
        ],
        "API Discovery": [
          "Automated API discovery",
          "OpenAPI import",
          "API catalog management",
        ],
        "Compliance": [
          "SOC2, GDPR, HIPAA, PCI-DSS reporting",
          "Automated compliance checks",
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
        "Support": ["Priority support (12x5)", "Email & chat support"],
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
        { key: "endpoints", name: "Endpoints Monitored", dev: "3", pro: "25", ent: "Unlimited" },
        { key: "threat", name: "Threat Detection", dev: "Basic", pro: "Advanced", ent: "AI-Powered" },
        { key: "bot", name: "Bot Protection", dev: false, pro: true, ent: true },
        { key: "rules", name: "Custom Security Rules", dev: false, pro: false, ent: true },
        { key: "retention", name: "Data Retention", dev: "7 days", pro: "90 days", ent: "2+ years" },
      ],
    },
    {
      category: "API Discovery",
      features: [
        { key: "auto-discovery", name: "Automated Discovery", dev: false, pro: true, ent: true },
        { key: "shadow", name: "Shadow API Detection", dev: false, pro: false, ent: true },
        { key: "openapi", name: "OpenAPI Import", dev: false, pro: true, ent: true },
      ],
    },
    {
      category: "Compliance",
      features: [
        { key: "frameworks", name: "Compliance Frameworks", dev: "Basic", pro: "4 major", ent: "25+" },
        { key: "reporting", name: "Automated Reporting", dev: false, pro: true, ent: true },
        { key: "policies", name: "Custom Policies", dev: false, pro: false, ent: true },
        { key: "audit", name: "Audit Logging", dev: false, pro: false, ent: true },
      ],
    },
    {
      category: "Support",
      features: [
        { key: "hours", name: "Support Hours", dev: "Community", pro: "12x5", ent: "24x7" },
        { key: "response", name: "Response Time", dev: "Best effort", pro: "4 hours", ent: "1 hour" },
        { key: "csm", name: "Dedicated CSM", dev: false, pro: false, ent: true },
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

  const renderFeatureValue = (value: any) => {
    if (typeof value === "boolean") {
      return value ? (
        <CheckOutlined className="text-green-500 text-lg" />
      ) : (
        <CloseOutlined className="text-gray-400 text-lg" />
      );
    }
    return <span className="text-gray-700">{value}</span>;
  };

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Header className="bg-slate-900 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-full">
          <button
            onClick={() => router.push("/")}
            className="text-white hover:text-blue-400 flex items-center gap-2"
          >
            <ArrowLeftOutlined />
            Back to Home
          </button>
        </div>
      </Header>

      <Content className="max-w-7xl mx-auto px-8 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <Title level={1} className="text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </Title>
          <Paragraph className="text-xl text-gray-600 mb-8">
            Choose the plan that fits your organization's API security needs
          </Paragraph>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={billingCycle === "monthly" ? "font-semibold" : "text-gray-600"}>
              Monthly
            </span>
            <button
              onClick={() =>
                setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")
              }
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              {billingCycle === "monthly" ? "→" : "←"}
            </button>
            <span className={billingCycle === "annual" ? "font-semibold" : "text-gray-600"}>
              Annual
              <span className="ml-2 text-green-600 text-sm">(Save 15%)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <Row gutter={[32, 32]} justify="center" className="mb-20">
          {plans.map((plan, index) => (
            <Col xs={24} lg={8} key={index}>
              <Card
                className={`h-full shadow-lg transition-all hover:shadow-xl ${
                  plan.popular ? "border-2 border-blue-500 transform scale-105" : ""
                }`}
                style={{ position: "relative" }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-6 pt-2">
                  <Title level={2} className="mb-2">
                    {plan.name}
                  </Title>
                  <div className="mb-2">
                    <span className="text-4xl font-bold">
                      {billingCycle === "annual" && plan.annualPrice !== plan.price
                        ? plan.annualPrice
                        : plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-gray-500">
                        {plan.period}
                        {billingCycle === "annual" && " (billed annually)"}
                      </span>
                    )}
                  </div>
                  <Paragraph className="text-gray-600">{plan.description}</Paragraph>
                </div>

                <div className="mb-8 space-y-6">
                  {Object.entries(plan.features).map(([category, features]) => (
                    <div key={category}>
                      <div className="font-semibold text-sm text-gray-700 mb-2 uppercase tracking-wide">
                        {category}
                      </div>
                      {(features as string[]).map((feature, idx) => (
                        <div key={idx} className="flex items-start mb-2 ml-2">
                          <CheckOutlined className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <Button
                  type={plan.popular ? "primary" : "default"}
                  size="large"
                  block
                  onClick={() => handleCTAClick(plan.name)}
                  className={plan.popular ? "bg-blue-500 hover:bg-blue-600" : ""}
                >
                  {plan.cta}
                </Button>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Feature Comparison Table */}
        <div className="mb-20">
          <Title level={2} className="text-center mb-8">
            Detailed Feature Comparison
          </Title>
          <Card className="shadow-lg">
            {comparisonFeatures.map((section, idx) => (
              <div key={idx} className="mb-8 last:mb-0">
                <Title level={4} className="mb-4 text-blue-600">
                  {section.category}
                </Title>
                <Table
                  dataSource={section.features}
                  pagination={false}
                  size="middle"
                  rowKey="key"
                  columns={[
                    {
                      title: "Feature",
                      dataIndex: "name",
                      key: "name",
                      width: "40%",
                      className: "font-medium",
                    },
                    {
                      title: "Developer",
                      dataIndex: "dev",
                      key: "dev",
                      align: "center",
                      render: renderFeatureValue,
                    },
                    {
                      title: "Professional",
                      dataIndex: "pro",
                      key: "pro",
                      align: "center",
                      render: renderFeatureValue,
                    },
                    {
                      title: "Enterprise",
                      dataIndex: "ent",
                      key: "ent",
                      align: "center",
                      render: renderFeatureValue,
                    },
                  ]}
                />
              </div>
            ))}
          </Card>
        </div>

        {/* Trust Indicators */}
        <div className="text-center mb-20">
          <Title level={2} className="mb-8">
            Enterprise-Grade Security & Compliance
          </Title>
          <Row gutter={[32, 32]} justify="center">
            <Col xs={12} md={6}>
              <Card className="text-center shadow-md hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-2">🔒</div>
                <div className="font-semibold">SOC 2 Type II</div>
                <div className="text-sm text-gray-600">Certified</div>
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card className="text-center shadow-md hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-2">✓</div>
                <div className="font-semibold">GDPR</div>
                <div className="text-sm text-gray-600">Compliant</div>
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card className="text-center shadow-md hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-2">⚡</div>
                <div className="font-semibold">99.9%</div>
                <div className="text-sm text-gray-600">Uptime SLA</div>
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card className="text-center shadow-md hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-2">🌍</div>
                <div className="font-semibold">Global</div>
                <div className="text-sm text-gray-600">Infrastructure</div>
              </Card>
            </Col>
          </Row>
        </div>

        {/* FAQ Section */}
        <div className="mb-20">
          <Title level={2} className="text-center mb-8">
            Frequently Asked Questions
          </Title>
          <Card className="shadow-lg">
            <Collapse
              accordion
              bordered={false}
              className="bg-transparent"
              items={faqs.map((faq) => ({
                key: faq.key,
                label: <span className="font-semibold text-base">{faq.question}</span>,
                children: <p className="text-gray-700 pl-6">{faq.answer}</p>,
              }))}
            />
          </Card>
        </div>

        {/* ROI Calculator CTA */}
        <div className="text-center mb-20 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-12">
          <Title level={2} className="mb-4">
            Calculate Your ROI
          </Title>
          <Paragraph className="text-lg text-gray-700 mb-6 max-w-2xl mx-auto">
            The average data breach costs $4.45M and takes 277 days to identify and contain.
            Our customers see 800%+ ROI annually by preventing breaches before they happen.
          </Paragraph>
          <Button
            size="large"
            type="primary"
            onClick={() => router.push("/customer/dashboard")}
            className="bg-blue-500 hover:bg-blue-600"
          >
            See ROI Calculator
          </Button>
        </div>

        {/* Contact Sales CTA */}
        <Card className="text-center shadow-lg bg-slate-900 text-white">
          <Title level={2} className="text-white mb-4">
            Still have questions?
          </Title>
          <Paragraph className="text-gray-300 text-lg mb-6">
            Our team is here to help you find the perfect plan for your organization.
          </Paragraph>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="large"
              onClick={() => (window.location.href = "mailto:sales@governapi.com")}
            >
              Contact Sales
            </Button>
            <Button
              size="large"
              type="primary"
              onClick={() => router.push("/login?mode=register&plan=professional")}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Start Free Trial
            </Button>
          </div>
        </Card>
      </Content>
    </Layout>
  );
}
