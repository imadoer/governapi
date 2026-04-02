"use client";

import { useRouter } from "next/navigation";
import { Button, Layout, Typography, Space, Tag, Divider } from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

const { Header, Content } = Layout;
const { Title, Paragraph, Text } = Typography;

export default function BlogPost() {
  const router = useRouter();

  return (
    <Layout className="min-h-screen bg-white">
      <Header className="bg-slate-900 px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between h-full">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/blog")}
            className="text-white hover:text-blue-400"
          >
            Back to Blog
          </Button>
        </div>
      </Header>

      <Content className="max-w-4xl mx-auto px-8 py-12">
        <article>
          <header className="mb-8">
            <div className="mb-4">
              <Space wrap>
                <Tag color="blue">API Security</Tag>
                <Tag color="green">Trends</Tag>
                <Tag color="purple">Enterprise</Tag>
              </Space>
            </div>

            <Title level={1} className="text-4xl font-bold mb-4">
              API Security Trends 2025: What Enterprises Need to Know
            </Title>

            <div className="flex items-center space-x-6 text-gray-500 mb-6">
              <Space>
                <UserOutlined />
                <span>GovernAPI Team</span>
              </Space>
              <Space>
                <CalendarOutlined />
                <span>September 13, 2025</span>
              </Space>
              <Space>
                <ClockCircleOutlined />
                <span>8 min read</span>
              </Space>
            </div>
          </header>

          <div className="prose prose-lg max-w-none">
            <Paragraph className="text-xl text-gray-600 mb-8">
              The API security landscape is evolving rapidly as enterprises
              adopt API-first architectures. With 91% of organizations
              experiencing API-related security incidents in 2024, understanding
              emerging trends is critical for security leaders planning 2025
              strategies.
            </Paragraph>

            <Title level={2} className="text-2xl font-semibold mt-8 mb-4">
              Key Trends Reshaping API Security
            </Title>

            <Title level={3} className="text-xl font-semibold mt-6 mb-3">
              1. AI-Powered Bot Sophistication
            </Title>
            <Paragraph>
              Traditional rate limiting is no longer sufficient. Modern bots use
              machine learning to mimic human behavior patterns, making
              detection increasingly difficult. Organizations need behavioral
              analysis and real-time threat intelligence to stay ahead.
            </Paragraph>

            <Title level={3} className="text-xl font-semibold mt-6 mb-3">
              2. Shadow API Proliferation
            </Title>
            <Paragraph>
              The average enterprise now manages 15,000+ APIs, with 67% being
              "shadow APIs" unknown to security teams. Automated discovery has
              become essential as manual inventory management becomes impossible
              at scale.
            </Paragraph>

            <Title level={3} className="text-xl font-semibold mt-6 mb-3">
              3. Compliance Automation Mandate
            </Title>
            <Paragraph>
              With SOC2, GDPR, and PCI-DSS requirements becoming more stringent,
              manual compliance processes are creating significant business
              risk. Organizations spending $500K+ annually on audit preparation
              are seeking automated solutions.
            </Paragraph>

            <Title level={3} className="text-xl font-semibold mt-6 mb-3">
              4. Real-Time Protection Requirements
            </Title>
            <Paragraph>
              Static API testing tools can no longer meet enterprise security
              needs. Organizations require real-time threat detection and
              automatic policy enforcement to prevent breaches before they
              occur.
            </Paragraph>

            <Title level={3} className="text-xl font-semibold mt-6 mb-3">
              5. Business Context Integration
            </Title>
            <Paragraph>
              Security teams are under pressure to demonstrate business value.
              API security platforms must provide executive-level reporting
              showing ROI, risk reduction, and business impact metrics.
            </Paragraph>

            <Title level={2} className="text-2xl font-semibold mt-8 mb-4">
              Predictions for 2025
            </Title>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>API-first compliance frameworks</strong> will emerge
                from major standards bodies
              </li>
              <li>
                <strong>Zero-trust API architectures</strong> will become
                standard for enterprise deployments
              </li>
              <li>
                <strong>Business-context security platforms</strong> will
                replace purely technical solutions
              </li>
              <li>
                <strong>Automated threat response</strong> will eliminate the
                need for manual incident management
              </li>
            </ul>

            <Title level={2} className="text-2xl font-semibold mt-8 mb-4">
              Strategic Recommendations
            </Title>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <strong>Invest in unified platforms</strong> rather than point
                solutions to reduce complexity
              </li>
              <li>
                <strong>Prioritize automated discovery</strong> to eliminate
                shadow API risks
              </li>
              <li>
                <strong>Implement real-time protection</strong> to prevent
                rather than detect breaches
              </li>
              <li>
                <strong>Demand business context</strong> from security tools for
                executive visibility
              </li>
            </ol>
          </div>

          <Divider className="my-12" />

          <div className="text-center">
            <Title level={3} className="mb-4">
              Ready to Future-Proof Your API Security?
            </Title>
            <Paragraph className="text-lg text-gray-600 mb-6">
              GovernAPI provides the unified platform and real-time protection
              enterprises need for 2025 and beyond.
            </Paragraph>
            <Space size="large">
              <Button size="large" onClick={() => router.push("/dashboard")}>
                View Live Demo
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={() => router.push("/login")}
              >
                Start Free Trial
              </Button>
            </Space>
          </div>
        </article>
      </Content>
    </Layout>
  );
}
