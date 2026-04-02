// Add these cases to the renderEnterpriseContent switch statement

case 'compliance-hub':
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>Compliance Hub</Title>
        <Button type="primary" icon={<FileTextOutlined />}>
          Generate Compliance Report
        </Button>
      </div>

      <Alert
        message="Multi-Framework Compliance Monitoring Active"
        description="Your APIs are continuously monitored for compliance with SOC 2, HIPAA, PCI DSS, and GDPR requirements."
        type="success"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Overall Compliance Score"
              value={94}
              suffix="/100"
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Frameworks Monitored"
              value={complianceReports.length}
              prefix={<SafetyOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Critical Findings"
              value={complianceReports.reduce((sum, r) => sum + r.criticalFindings, 0)}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Next Audit"
              value="45"
              suffix="days"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Compliance Framework Status" style={{ marginBottom: 24 }}>
        <Table
          dataSource={complianceReports}
          columns={[
            { 
              title: 'Framework', 
              dataIndex: 'framework', 
              key: 'framework',
              render: (framework) => <Tag color="blue">{framework}</Tag>
            },
            { 
              title: 'Status', 
              dataIndex: 'status', 
              key: 'status',
              render: (status) => {
                const colors = {
                  'Compliant': 'green',
                  'Partial': 'orange',
                  'Non-Compliant': 'red',
                  'In Progress': 'blue'
                };
                return <Tag color={colors[status]}>{status}</Tag>;
              }
            },
            { 
              title: 'Score', 
              dataIndex: 'score', 
              key: 'score',
              render: (score) => (
                <Progress 
                  percent={score} 
                  strokeColor={score >= 90 ? '#52c41a' : score >= 70 ? '#faad14' : '#ff4d4f'}
                  size="small"
                />
              )
            },
            { title: 'Last Audit', dataIndex: 'lastAudit', key: 'lastAudit' },
            { title: 'Findings', dataIndex: 'findings', key: 'findings' },
            {
              title: 'Actions',
              key: 'actions',
              render: () => (
                <Space>
                  <Button size="small">View Report</Button>
                  <Button size="small" type="primary">Schedule Audit</Button>
                </Space>
              )
            }
          ]}
          pagination={false}
        />
      </Card>
    </div>
  );

case 'performance-monitor':
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>Performance Monitoring</Title>
        <Space>
          <RangePicker />
          <Button icon={<ReloadOutlined />} onClick={loadAllEnterpriseData}>Refresh</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Average Response Time"
              value={performanceMetrics?.overview?.averageResponseTime || 127}
              suffix="ms"
              prefix={<MonitorOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Uptime"
              value={performanceMetrics?.overview?.uptimePercentage || 99.97}
              suffix="%"
              prefix={<LineChartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Requests/Second"
              value={performanceMetrics?.overview?.requestsPerSecond || 1247}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Error Rate"
              value={performanceMetrics?.overview?.errorRate || 0.12}
              suffix="%"
              prefix={<AlertOutlined />}
              valueStyle={{ color: performanceMetrics?.overview?.errorRate > 1 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="Endpoint Performance">
            <Table
              dataSource={performanceMetrics?.endpointMetrics || []}
              columns={[
                { title: 'Endpoint', dataIndex: 'endpoint', key: 'endpoint' },
                { 
                  title: 'Avg Response Time', 
                  dataIndex: 'averageResponseTime', 
                  key: 'averageResponseTime',
                  render: (time) => `${time}ms`
                },
                { title: 'Requests', dataIndex: 'requestCount', key: 'requestCount' },
                { 
                  title: 'Error Rate', 
                  dataIndex: 'errorRate', 
                  key: 'errorRate',
                  render: (rate) => `${rate.toFixed(2)}%`
                },
                { 
                  title: 'Status', 
                  dataIndex: 'status', 
                  key: 'status',
                  render: (status) => {
                    const colors = {
                      'Healthy': 'green',
                      'Warning': 'orange',
                      'Critical': 'red'
                    };
                    return <Tag color={colors[status]}>{status}</Tag>;
                  }
                }
              ]}
              pagination={{ pageSize: 8 }}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Geographic Performance">
            {Object.entries(performanceMetrics?.geographicPerformance || {}).map(([region, data]) => (
              <div key={region} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>{region}</Text>
                  <Text>{data.latency}ms</Text>
                </div>
                <Progress 
                  percent={Math.max(0, 100 - data.latency / 2)} 
                  strokeColor={data.status === 'Optimal' ? '#52c41a' : data.status === 'Good' ? '#1890ff' : '#faad14'}
                  size="small"
                />
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );

case 'vulnerability-scanner':
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>Vulnerability Scanner</Title>
        <Button type="primary" icon={<BugOutlined />}>
          Start Deep Scan
        </Button>
      </div>

      <Alert
        message="Continuous Vulnerability Monitoring Active"
        description="Your API endpoints are continuously scanned for OWASP Top 10 vulnerabilities, CVEs, and security misconfigurations."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Vulnerabilities"
              value={vulnerabilities.length}
              prefix={<BugOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Critical"
              value={vulnerabilities.filter(v => v.severity === 'CRITICAL').length}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="High Severity"
              value={vulnerabilities.filter(v => v.severity === 'HIGH').length}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Resolved"
              value={vulnerabilities.filter(v => v.status === 'Resolved').length}
              prefix={<SafetyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Vulnerability Details" style={{ marginBottom: 24 }}>
        <Table
          dataSource={vulnerabilities}
          columns={[
            { 
              title: 'Title', 
              dataIndex: 'title', 
              key: 'title',
              width: 250
            },
            { 
              title: 'Severity', 
              dataIndex: 'severity', 
              key: 'severity',
              render: (severity) => {
                const colors = {
                  'CRITICAL': 'red',
                  'HIGH': 'orange',
                  'MEDIUM': 'yellow',
                  'LOW': 'green'
                };
                return <Tag color={colors[severity]}>{severity}</Tag>;
              }
            },
            { 
              title: 'CVSS Score', 
              dataIndex: 'cvssScore', 
              key: 'cvssScore',
              render: (score) => (
                <Tag color={score >= 9 ? 'red' : score >= 7 ? 'orange' : score >= 4 ? 'yellow' : 'green'}>
                  {score}
                </Tag>
              )
            },
            { title: 'Endpoint', dataIndex: 'endpoint', key: 'endpoint' },
            { 
              title: 'Status', 
              dataIndex: 'status', 
              key: 'status',
              render: (status) => (
                <Tag color={status === 'Resolved' ? 'green' : status === 'In Progress' ? 'blue' : 'red'}>
                  {status}
                </Tag>
              )
            },
            { 
              title: 'Discovered', 
              dataIndex: 'discoveredAt', 
              key: 'discoveredAt',
              render: (date) => new Date(date).toLocaleDateString()
            },
            {
              title: 'Actions',
              key: 'actions',
              render: () => (
                <Space>
                  <Button size="small">View Details</Button>
                  <Button size="small" type="primary">Fix</Button>
                </Space>
              )
            }
          ]}
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ padding: 16 }}>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Description:</Text> {record.description}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Impact:</Text> {record.impact}
                </div>
                <div>
                  <Text strong>Solution:</Text> {record.solution}
                </div>
              </div>
            ),
          }}
        />
      </Card>
    </div>
  );

case 'custom-rules':
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>Custom Rules Engine</Title>
        <Button type="primary" icon={<CodeOutlined />}>
          Create New Rule
        </Button>
      </div>

      <Alert
        message="Advanced Rule Engine Active"
        description="Custom security rules are automatically evaluated for every API request in real-time."
        type="success"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Active Rules"
              value={customRules.filter(r => r.isActive).length}
              prefix={<CodeOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Triggers"
              value={customRules.reduce((sum, r) => sum + r.triggeredCount, 0)}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Blocked Requests"
              value={Math.floor(customRules.reduce((sum, r) => sum + r.triggeredCount, 0) * 0.7)}
              prefix={<LockOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Rule Types"
              value={new Set(customRules.map(r => r.ruleType)).size}
              prefix={<SettingOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Active Security Rules">
            <Table
              dataSource={customRules}
              columns={[
                { title: 'Rule Name', dataIndex: 'name', key: 'name' },
                { 
                  title: 'Type', 
                  dataIndex: 'ruleType', 
                  key: 'ruleType',
                  render: (type) => <Tag color="blue">{type}</Tag>
                },
                { title: 'Priority', dataIndex: 'priority', key: 'priority' },
                { title: 'Triggers', dataIndex: 'triggeredCount', key: 'triggeredCount' },
                { 
                  title: 'Status', 
                  dataIndex: 'isActive', 
                  key: 'isActive',
                  render: (active) => (
                    <Switch checked={active} size="small" />
                  )
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: () => (
                    <Space>
                      <Button size="small">Edit</Button>
                      <Button size="small" danger>Delete</Button>
                    </Space>
                  )
                }
              ]}
              pagination={{ pageSize: 8 }}
              expandable={{
                expandedRowRender: (record) => (
                  <div style={{ padding: 16 }}>
                    <Text strong>Description:</Text> {record.description}
                  </div>
                ),
              }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Quick Rule Creation">
            <Form layout="vertical">
              <Form.Item label="Rule Name">
                <Input placeholder="Block High-Risk IPs" />
              </Form.Item>
              <Form.Item label="Rule Type">
                <Select>
                  <Option value="GeoBlocking">Geographic Blocking</Option>
                  <Option value="RateLimiting">Rate Limiting</Option>
                  <Option value="PatternMatching">Pattern Matching</Option>
                  <Option value="IPWhitelist">IP Whitelist</Option>
                  <Option value="UserAgentFilter">User Agent Filter</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Action">
                <Select>
                  <Option value="BLOCK">Block Request</Option>
                  <Option value="THROTTLE">Throttle</Option>
                  <Option value="ALERT">Send Alert</Option>
                  <Option value="LOG">Log Only</Option>
                </Select>
              </Form.Item>
              <Button type="primary" block>Create Rule</Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );

case 'webhook-center':
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>Webhook Integration Center</Title>
        <Button type="primary" icon={<BellOutlined />}>
          Add Webhook
        </Button>
      </div>

      <Alert
        message="Real-Time Webhook Delivery System Active"
        description="Security events and alerts are automatically delivered to your configured endpoints with retry logic and delivery confirmation."
        type="success"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Active Webhooks"
              value={webhooks.filter(w => w.enabled).length}
              prefix={<BellOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Deliveries Today"
              value={247}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Success Rate"
              value={98.7}
              suffix="%"
              prefix={<SafetyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Avg Response Time"
              value={234}
              suffix="ms"
              prefix={<MonitorOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Configured Webhooks">
            <Table
              dataSource={webhooks}
              columns={[
                { title: 'Name', dataIndex: 'name', key: 'name' },
                { 
                  title: 'URL', 
                  dataIndex: 'url', 
                  key: 'url',
                  render: (url) => <Text code>{url.substring(0, 40)}...</Text>
                },
                { 
                  title: 'Events', 
                  dataIndex: 'events', 
                  key: 'events',
                  render: (events) => <Tag>{events.length} events</Tag>
                },
                { 
                  title: 'Status', 
                  dataIndex: 'enabled', 
                  key: 'enabled',
                  render: (enabled) => (
                    <Tag color={enabled ? 'green' : 'red'}>
                      {enabled ? 'Active' : 'Disabled'}
                    </Tag>
                  )
                },
                { 
                  title: 'Last Delivery', 
                  dataIndex: 'lastDelivery', 
                  key: 'lastDelivery',
                  render: (date) => new Date(date).toLocaleString()
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: () => (
                    <Space>
                      <Button size="small">Test</Button>
                      <Button size="small">Edit</Button>
                      <Button size="small" danger>Delete</Button>
                    </Space>
                  )
                }
              ]}
              pagination={false}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Create Webhook">
            <Form layout="vertical">
              <Form.Item label="Webhook Name">
                <Input placeholder="Slack Security Alerts" />
              </Form.Item>
              <Form.Item label="Endpoint URL">
                <Input placeholder="https://hooks.slack.com/..." />
              </Form.Item>
              <Form.Item label="Events to Subscribe">
                <Select mode="multiple" placeholder="Select events">
                  <Option value="threat.detected">Threat Detected</Option>
                  <Option value="security_scan.completed">Security Scan Completed</Option>
                  <Option value="vulnerability.found">Vulnerability Found</Option>
                  <Option value="compliance.alert">Compliance Alert</Option>
                  <Option value="performance.degradation">Performance Issue</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Webhook Type">
                <Select defaultValue="generic">
                  <Option value="generic">Generic HTTP</Option>
                  <Option value="slack">Slack</Option>
                  <Option value="discord">Discord</Option>
                  <Option value="teams">Microsoft Teams</Option>
                  <Option value="pagerduty">PagerDuty</Option>
                </Select>
              </Form.Item>
              <Button type="primary" block>Create Webhook</Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );

case 'rate-limiting':
  return (
    <div>
      <Title level={2}>Rate Limiting & Traffic Control</Title>
      
      <Alert
        message="Advanced Rate Limiting Active"
        description="Intelligent traffic control protects your APIs from abuse while ensuring legitimate users maintain access."
        type="success"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Current RPS"
              value={rateLimits?.currentUsage?.requestsThisMinute || 0}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Daily Usage"
              value={rateLimits?.currentUsage?.percentageOfLimit || 47.8}
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Throttled Requests"
              value={156}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Blocked IPs"
              value={23}
              prefix={<LockOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Endpoint Rate Limits">
            <Table
              dataSource={rateLimits?.endpointLimits || []}
              columns={[
                { title: 'Endpoint', dataIndex: 'endpoint', key: 'endpoint' },
                { 
                  title: 'Limit', 
                  dataIndex: 'requestsPerMinute', 
                  key: 'requestsPerMinute',
                  render: (limit) => `${limit}/min`
                },
                { 
                  title: 'Current Usage', 
                  dataIndex: 'currentUsage', 
                  key: 'currentUsage',
                  render: (usage, record) => (
                    <Progress 
                      percent={Math.round((usage / record.requestsPerMinute) * 100)} 
                      size="small"
                      strokeColor={usage / record.requestsPerMinute > 0.8 ? '#ff4d4f' : '#52c41a'}
                    />
                  )
                },
                { 
                  title: 'Status', 
                  dataIndex: 'enabled', 
                  key: 'enabled',
                  render: (enabled) => (
                    <Switch checked={enabled} size="small" />
                  )
                }
              ]}
              pagination={false}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Global Rate Limit Settings">
            <Form layout="vertical">
              <Form.Item label="Requests per Second">
                <InputNumber 
                  defaultValue={rateLimits?.globalLimits?.requestsPerSecond || 100}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="Requests per Minute">
                <InputNumber 
                  defaultValue={rateLimits?.globalLimits?.requestsPerMinute || 5000}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="Burst Limit">
                <InputNumber 
                  defaultValue={rateLimits?.globalLimits?.burstLimit || 200}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="Enable Rate Limiting" valuePropName="checked">
                <Switch defaultChecked={rateLimits?.globalLimits?.enabled} />
              </Form.Item>
              <Button type="primary" block>Update Settings</Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );

case 'analytics-insights':
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>Analytics & Security Insights</Title>
        <Space>
          <RangePicker />
          <Button icon={<DownloadOutlined />}>Export Report</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Threat Trends" extra={<Badge status="processing" text="Live Data" />}>
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div>
                <Title level={4}>Threat Intelligence Dashboard</Title>
                <Text>Real-time threat analytics visualization</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Geographic Attack Distribution">
            <Table
              dataSource={threatTrends?.geographicThreats || []}
              columns={[
                { title: 'Country', dataIndex: 'country', key: 'country' },
                { title: 'Threats', dataIndex: 'threatCount', key: 'threatCount' },
                { 
                  title: 'Percentage', 
                  dataIndex: 'percentage', 
                  key: 'percentage',
                  render: (pct) => <Progress percent={pct} size="small" />
                }
              ]}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Card title="Security Analytics Summary" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={8}>
            <Statistic title="Total Threats Analyzed" value={threatTrends?.overview?.totalThreatsBlocked || 15420} />
          </Col>
          <Col xs={8}>
            <Statistic title="Threat Velocity" value={threatTrends?.overview?.threatVelocity || '+23%'} />
          </Col>
          <Col xs={8}>
            <Statistic title="Top Threat Type" value={threatTrends?.overview?.topThreatType || 'SQL Injection'} />
          </Col>
        </Row>
      </Card>
    </div>
  );

case 'api-discovery':
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>API Discovery & Inventory</Title>
        <Button type="primary" icon={<GlobalOutlined />}>
          Start Discovery Scan
        </Button>
      </div>

      <Alert
        message="Automated API Discovery Active"
        description="Our discovery engine continuously identifies new API endpoints, analyzes their security posture, and classifies data sensitivity."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Discovered Endpoints"
              value={apiEndpoints.length}
              prefix={<GlobalOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="High Risk"
              value={apiEndpoints.filter(e => e.riskScore > 70).length}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Sensitive Data"
              value={apiEndpoints.filter(e => ['sensitive', 'financial', 'personal'].includes(e.dataClassification)).length}
              prefix={<LockOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Compliance Issues"
              value={12}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="API Endpoint Inventory">
        <Table
          dataSource={apiEndpoints}
          columns={[
            { 
              title: 'Endpoint', 
              key: 'endpoint',
              render: (_, record) => (
                <Text code>{record.method} {record.url}</Text>
              )
            },
            { 
              title: 'Security Score', 
              dataIndex: 'securityScore', 
              key: 'securityScore',
              render: (score) => (
                <Progress 
                  percent={score} 
                  strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'}
                  size="small"
                />
              )
            },
            { 
              title: 'Data Classification', 
              dataIndex: 'dataClassification', 
              key: 'dataClassification',
              render: (classification) => {
                const colors = {
                  'public': 'green',
                  'personal': 'blue', 
                  'sensitive': 'orange',
                  'financial': 'red'
                };
                return <Tag color={colors[classification]}>{classification.toUpperCase()}</Tag>;
              }
            },
            { 
              title: 'Risk Score', 
              dataIndex: 'riskScore', 
              key: 'riskScore',
              render: (score) => (
                <Tag color={score > 70 ? 'red' : score > 40 ? 'orange' : 'green'}>
                  {score}
                </Tag>
              )
            },
            { title: 'Requests', dataIndex: 'requestCount', key: 'requestCount' },
            { 
              title: 'Discovered', 
              dataIndex: 'lastSeen', 
              key: 'lastSeen',
              render: (timestamp) => new Date(timestamp).toLocaleDateString()
            },
            {
              title: 'Actions',
              key: 'actions',
              render: () => (
                <Space>
                  <Button size="small">Analyze</Button>
                  <Button size="small">Monitor</Button>
                </Space>
              )
            }
          ]}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
