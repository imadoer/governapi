// API Management page content
case 'api-management':
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>API Key & Endpoint Management</Title>
        <Button type="primary" icon={<KeyOutlined />}>
          Generate New API Key
        </Button>
      </div>

      {/* API Key Management */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={8}>
          <Card title="Create New API Key">
            <Form layout="vertical">
              <Form.Item label="Key Name" required>
                <Input placeholder="Production API Key" />
              </Form.Item>
              <Form.Item label="Daily Request Limit">
                <Select defaultValue={5000}>
                  <Option value={1000}>1,000 requests/day</Option>
                  <Option value={5000}>5,000 requests/day</Option>
                  <Option value={25000}>25,000 requests/day</Option>
                  <Option value={100000}>100,000 requests/day</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Permissions">
                <Select mode="multiple" defaultValue={['read', 'scan']}>
                  <Option value="read">Read Access</Option>
                  <Option value="scan">Security Scanning</Option>
                  <Option value="block">Threat Blocking</Option>
                  <Option value="admin">Admin Functions</Option>
                </Select>
              </Form.Item>
              <Button type="primary" block>Create API Key</Button>
            </Form>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title="Your API Keys">
            <Table
              dataSource={apiKeys}
              columns={[
                { title: 'Name', dataIndex: 'keyName', key: 'keyName' },
                { 
                  title: 'API Key', 
                  dataIndex: 'apiKey', 
                  key: 'apiKey',
                  render: (key) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Text code copyable={{ text: key }}>
                        {key.substring(0, 20)}...
                      </Text>
                    </div>
                  )
                },
                { 
                  title: 'Usage', 
                  key: 'usage',
                  render: () => `${Math.floor(Math.random() * 1000)} / 5,000`
                },
                { 
                  title: 'Status', 
                  dataIndex: 'isActive', 
                  key: 'status',
                  render: (active) => (
                    <Tag color={active ? 'green' : 'red'}>
                      {active ? 'Active' : 'Disabled'}
                    </Tag>
                  )
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: () => (
                    <Space>
                      <Button size="small">Edit</Button>
                      <Button size="small" danger>Revoke</Button>
                    </Space>
                  )
                }
              ]}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      {/* API Endpoint Discovery */}
      <Card title="Discovered API Endpoints" style={{ marginBottom: 24 }}>
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
            { title: 'Requests', dataIndex: 'requestCount', key: 'requestCount' },
            { title: 'Avg Response', dataIndex: 'avgResponseTime', key: 'avgResponseTime', render: (time) => `${time}ms` }
          ]}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
