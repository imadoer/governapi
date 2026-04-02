'use client'

import { useState } from 'react'
import { Layout, Menu, Button, Card, Row, Col, Tabs, Space, Statistic, Progress, Typography, Dropdown, Avatar, message, Modal, Form, Input } from 'antd'
import {
  DashboardOutlined,
  SecurityScanOutlined,
  SettingOutlined,
  PlusOutlined,
  ApiOutlined,
  FileTextOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { BotDetection } from './components/BotDetection'
import { ComplianceDashboard } from './components/ComplianceDashboard'
import { APIHealthScore } from './components/APIHealthScore'
import { SlackIntegration } from './components/SlackIntegration'
import { PDFReportGenerator } from './components/PDFReportGenerator'
import { DependencyMap } from './components/DependencyMap'
import { LiveAPIMonitoring } from './components/LiveAPIMonitoring'
import { SecurityScanResults } from './components/SecurityScanResults'
import { TrendAnalysis } from './components/TrendAnalysis'
import { RiskAssessment } from './components/RiskAssessment'
import { SecurityAlerts } from './components/SecurityAlerts'
import { PerformanceMetrics } from './components/PerformanceMetrics'

const { Sider, Header, Content } = Layout
const { Title } = Typography
const { TextArea } = Input

export default function DashboardPage() {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [scanModalVisible, setScanModalVisible] = useState(false)
  const [addAPIModalVisible, setAddAPIModalVisible] = useState(false)
  const [createPolicyModalVisible, setCreatePolicyModalVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [scanResults, setScanResults] = useState(null)
  const [scanTarget, setScanTarget] = useState('')

  const handleGenerateReport = async (type: string) => {
    setLoading(true)
    try {
      message.success("Report generated successfully")
    } catch (error) {
      message.error("Failed to generate report")
    } finally {
      setLoading(false)
    }
  }

  const handleStartScan = async () => {
    setLoading(true)
    try {
      if (!scanTarget) {
        message.error("Please enter a target URL")
        setLoading(false)
        return
      }

      const response = await fetch("/api/security-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_url: scanTarget })
      })

      const result = await response.json()

      if (result.success) {
        message.success("Security scan completed successfully")
        setScanModalVisible(false)
        setScanResults(result.results)
        setScanTarget('')
      } else {
        message.error(`Scan failed: ${result.error}`)
      }
    } catch (error) {
      message.error("Failed to perform security scan")
    } finally {
      setLoading(false)
    }
  }

  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <APIHealthScore />
          </Col>
          <Col xs={24}>
            <LiveAPIMonitoring />
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Quick Actions">
              <Space wrap>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setScanModalVisible(true)}>
                  New Security Scan
                </Button>
                <Button icon={<ApiOutlined />} onClick={() => setAddAPIModalVisible(true)}>
                  Add API
                </Button>
                <Button icon={<FileTextOutlined />} onClick={() => handleGenerateReport("compliance")}>
                  Generate Report
                </Button>
              </Space>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="System Status">
              <p>Your API governance platform is operational.</p>
              <p>All systems running normally.</p>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <TrendAnalysis />
          </Col>
          <Col xs={24} lg={12}>
            <RiskAssessment />
          </Col>
          <Col xs={24} lg={12}>
            <SecurityAlerts />
          </Col>
          <Col xs={24} lg={12}>
            <PerformanceMetrics />
          </Col>
        </Row>
      )
    },
    {
      key: 'security',
      label: 'Security Scans',
      children: (
        <div>
          <Card title="Security Scans" extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setScanModalVisible(true)}>
              New Security Scan
            </Button>
          }>
            <p>Security scanning functionality active.</p>
          </Card>
          <SecurityScanResults results={scanResults} />
        </div>
      )
    },
    {
      key: 'policies',
      label: 'Policy Engine',
      children: (
        <Card title="Policy Management" extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreatePolicyModalVisible(true)}>
            Create Policy
          </Button>
        }>
          <p>Policy management system ready.</p>
        </Card>
      )
    },
    {
      key: 'compliance',
      label: 'Compliance',
      children: (
        <Card title="Compliance Status">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={6}>
              <Statistic title="SOC2" value={92} suffix="%" />
              <Progress percent={92} showInfo={false} strokeColor="#52c41a" />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic title="GDPR" value={88} suffix="%" />
              <Progress percent={88} showInfo={false} strokeColor="#1890ff" />
            </Col>
          </Row>
        </Card>
      )
    },
    {
      key: 'bots',
      label: 'Bot Detection',
      children: <BotDetection />
    },
    {
      key: 'reports',
      label: 'Compliance Reports',
      children: <ComplianceDashboard />
    },
    {
      key: 'enterprise',
      label: 'Enterprise',
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <SlackIntegration />
          </Col>
          <Col xs={24} lg={12}>
            <PDFReportGenerator />
          </Col>
          <Col xs={24}>
            <DependencyMap />
          </Col>
        </Row>
      )
    }
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div className="p-4">
          <Title level={4} style={{ color: 'white', margin: 0 }}>
            {collapsed ? 'GA' : 'GovernAPI'}
          </Title>
        </div>
        <Menu
          theme="dark"
          selectedKeys={[activeTab]}
          mode="inline"
          items={[
            { key: "overview", icon: <DashboardOutlined />, label: "Overview" },
            { key: "security", icon: <SecurityScanOutlined />, label: "Security Scans" },
            { key: "policies", icon: <SettingOutlined />, label: "Policies" },
            { key: "compliance", icon: <FileTextOutlined />, label: "Compliance" },
            { key: "bots", icon: <SecurityScanOutlined />, label: "Bot Detection" },
            { key: "reports", icon: <FileTextOutlined />, label: "Reports" },
            { key: "enterprise", icon: <ApiOutlined />, label: "Enterprise" }
          ]}
          onClick={({ key }) => setActiveTab(key)}
        />
      </Sider>

      <Layout>
        <Header style={{ background: '#001529', padding: '0 24px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ float: 'right' }}>
            <Dropdown
              menu={{
                items: [
                  { key: 'profile', label: 'Profile', icon: <UserOutlined /> },
                  { key: 'logout', label: 'Logout', icon: <LogoutOutlined /> }
                ]
              }}
            >
              <Space>
                <Avatar icon={<UserOutlined />} />
                <span style={{ color: 'white' }}>Admin User</span>
              </Space>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ margin: '16px', background: '#f0f2f5', minHeight: 'calc(100vh - 112px)' }}>
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            items={tabItems}
            style={{ background: '#fff', padding: '24px', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          />
        </Content>
      </Layout>

      <Modal
        title="New Security Scan"
        open={scanModalVisible}
        onCancel={() => setScanModalVisible(false)}
        onOk={handleStartScan}
        confirmLoading={loading}
      >
        <p>Configure security scan parameters:</p>
        <Form layout="vertical">
          <Form.Item label="Scan Target">
            <Input 
              placeholder="e.g., https://api.yourdomain.com"
              value={scanTarget}
              onChange={(e) => setScanTarget(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Add API"
        open={addAPIModalVisible}
        onCancel={() => setAddAPIModalVisible(false)}
        onOk={() => { message.success("API added successfully"); setAddAPIModalVisible(false); }}
      >
        <Form layout="vertical">
          <Form.Item label="API Name">
            <Input placeholder="e.g., Payment API, User Service" />
          </Form.Item>
          <Form.Item label="Base URL">
            <Input placeholder="e.g., https://api.mycompany.com/v1" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Create Policy"
        open={createPolicyModalVisible}
        onCancel={() => setCreatePolicyModalVisible(false)}
        onOk={() => { message.success("Policy created successfully"); setCreatePolicyModalVisible(false); }}
      >
        <Form layout="vertical">
          <Form.Item label="Policy Name">
            <Input placeholder="e.g., Rate Limiting Policy" />
          </Form.Item>
          <Form.Item label="Description">
            <TextArea placeholder="Policy description" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}
