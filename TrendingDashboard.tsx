'use client'

import { Card, Row, Col, Statistic, Spin, Table } from 'antd'
import { useState, useEffect } from 'react'

export function TrendingDashboard() {
  const [trendData, setTrendData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrendData()
  }, [])

  const fetchTrendData = async () => {
    try {
      const response = await fetch('/api/trends')
      const data = await response.json()
      setTrendData(data)
    } catch (error) {
      console.error('Failed to fetch trend data:', error)
    }
    setLoading(false)
  }

  if (loading) {
    return <Card><Spin size="large" /></Card>
  }

  if (!trendData || trendData.trends.length === 0) {
    return (
      <Card title="Security Trends">
        <p>No historical data available. Run more security scans to see trends over time.</p>
      </Card>
    )
  }

  const { trends, summary } = trendData
  
  const getTrendIcon = () => {
    if (summary.risk_trend === 'increasing') return '↗️'
    if (summary.risk_trend === 'decreasing') return '↘️'
    return '➖'
  }

  const columns = [
    {
      title: 'Scan Date',
      dataIndex: 'timestamp',
      render: (timestamp) => new Date(timestamp).toLocaleString()
    },
    {
      title: 'Target',
      dataIndex: 'target',
      render: (target) => target.length > 30 ? target.substring(0, 30) + '...' : target
    },
    {
      title: 'Risk Level',
      dataIndex: 'overall_risk',
      render: (risk) => (
        <span style={{ 
          color: risk === 'CRITICAL' ? '#ff4d4f' : 
                 risk === 'HIGH' ? '#ff7a45' : 
                 risk === 'MEDIUM' ? '#faad14' : '#52c41a',
          fontWeight: 'bold'
        }}>
          {risk}
        </span>
      )
    },
    {
      title: 'Total Vulnerabilities',
      dataIndex: 'vulnerability_count'
    },
    {
      title: 'Critical',
      dataIndex: 'critical_count',
      render: (count) => <span style={{ color: count > 0 ? '#ff4d4f' : '#666' }}>{count}</span>
    },
    {
      title: 'High',
      dataIndex: 'high_count',
      render: (count) => <span style={{ color: count > 0 ? '#ff7a45' : '#666' }}>{count}</span>
    },
    {
      title: 'Medium',
      dataIndex: 'medium_count',
      render: (count) => <span style={{ color: count > 0 ? '#faad14' : '#666' }}>{count}</span>
    },
    {
      title: 'Response Time',
      dataKey: 'response_time',
      render: (time) => time ? `${time}ms` : 'N/A'
    }
  ]

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Statistic
            title="Total Scans"
            value={summary.total_scans}
            prefix={getTrendIcon()}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Avg Vulnerabilities"
            value={summary.avg_vulnerabilities}
            valueStyle={{ color: summary.avg_vulnerabilities > 5 ? '#ff4d4f' : '#52c41a' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Risk Trend"
            value={summary.risk_trend.toUpperCase()}
            valueStyle={{ 
              color: summary.risk_trend === 'increasing' ? '#ff4d4f' : 
                     summary.risk_trend === 'decreasing' ? '#52c41a' : '#faad14' 
            }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Latest Risk Level"
            value={trends[trends.length - 1]?.overall_risk || 'Unknown'}
            valueStyle={{ 
              color: trends[trends.length - 1]?.overall_risk === 'CRITICAL' ? '#ff4d4f' : 
                     trends[trends.length - 1]?.overall_risk === 'HIGH' ? '#ff7a45' : 
                     trends[trends.length - 1]?.overall_risk === 'MEDIUM' ? '#faad14' : '#52c41a'
            }}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Security Scan History">
            <Table 
              dataSource={trends}
              columns={columns}
              rowKey="timestamp"
              pagination={{ pageSize: 10 }}
              scroll={{ x: true }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="Vulnerability Trend Analysis">
            {trends.length > 1 && (
              <div>
                <p><strong>Scan Progression:</strong></p>
                <ul>
                  <li>First Scan: {trends[0].vulnerability_count} vulnerabilities ({trends[0].overall_risk})</li>
                  <li>Latest Scan: {trends[trends.length - 1].vulnerability_count} vulnerabilities ({trends[trends.length - 1].overall_risk})</li>
                  <li>Change: {trends[trends.length - 1].vulnerability_count - trends[0].vulnerability_count > 0 ? '+' : ''}{trends[trends.length - 1].vulnerability_count - trends[0].vulnerability_count} vulnerabilities</li>
                </ul>
              </div>
            )}
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Security Insights">
            <div>
              <p><strong>Most Common Issues:</strong></p>
              <ul>
                <li>Security Headers: Missing security headers are consistently found</li>
                <li>Authentication: APIs often lack proper authentication</li>
                <li>Server Configuration: Version disclosure is common</li>
              </ul>
              
              {summary.risk_trend === 'increasing' && (
                <div style={{ color: '#ff4d4f', marginTop: 16 }}>
                  <strong>⚠ Alert:</strong> Security risk is increasing over time. Review recent changes.
                </div>
              )}
              
              {summary.risk_trend === 'decreasing' && (
                <div style={{ color: '#52c41a', marginTop: 16 }}>
                  <strong>✓ Good:</strong> Security risk is decreasing. Keep up the good work!
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
