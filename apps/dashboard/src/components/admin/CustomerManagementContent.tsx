"use client";
import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Input,
  Button,
  Space,
  Tag,
  Dropdown,
  Modal,
  Form,
  Select,
  message,
  Row,
  Col,
  Statistic,
  Typography,
  Avatar,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  StopOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownOutlined,
  ExportOutlined,
  PlusOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import AdminLayout from "./AdminLayout";

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

interface Customer {
  key: string;
  company: string;
  email: string;
  contactName: string;
  plan: string;
  status: string;
  monthlyRevenue: number;
  joinDate: string;
  lastActive: string;
  apiUsage?: number;
}

export default function CustomerManagementContent() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);

      // Mock customer data - replace with real API call
      const mockCustomers: Customer[] = [
        {
          key: "1",
          company: "Department of Health",
          email: "admin@health.gov",
          contactName: "John Smith",
          plan: "Enterprise",
          status: "active",
          monthlyRevenue: 2500,
          joinDate: "2024-01-15",
          lastActive: "2024-10-01",
          apiUsage: 95000,
        },
        {
          key: "2",
          company: "Department of Transportation",
          email: "api@transport.gov",
          contactName: "Sarah Johnson",
          plan: "Professional",
          status: "active",
          monthlyRevenue: 1200,
          joinDate: "2024-03-22",
          lastActive: "2024-09-30",
          apiUsage: 42000,
        },
        {
          key: "3",
          company: "Environmental Protection Agency",
          email: "data@epa.gov",
          contactName: "Mike Wilson",
          plan: "Basic",
          status: "suspended",
          monthlyRevenue: 500,
          joinDate: "2024-02-10",
          lastActive: "2024-09-15",
          apiUsage: 18000,
        },
      ];

      setCustomers(mockCustomers);
      setFilteredCustomers(mockCustomers);
    } catch (error) {
      console.error("Error loading customers:", error);
      message.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    const filtered = customers.filter(
      (customer) =>
        customer.company.toLowerCase().includes(value.toLowerCase()) ||
        customer.email.toLowerCase().includes(value.toLowerCase()),
    );
    setFilteredCustomers(filtered);
  };

  const handleCustomerAction = async (action: string, customer: Customer) => {
    try {
      switch (action) {
        case "edit":
          setSelectedCustomer(customer);
          form.setFieldsValue(customer);
          setEditModalVisible(true);
          break;
        case "suspend":
          message.success(`Suspended ${customer.company}`);
          break;
        case "activate":
          message.success(`Activated ${customer.company}`);
          break;
        case "delete":
          message.success(`Deleted ${customer.company}`);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Customer action error:", error);
      message.error("Action failed");
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: "green",
      suspended: "red",
      trial: "orange",
      expired: "gray",
    };
    return colors[status as keyof typeof colors] || "default";
  };

  const getPlanColor = (plan: string) => {
    const colors = {
      Enterprise: "purple",
      Professional: "blue",
      Basic: "green",
      Trial: "orange",
    };
    return colors[plan as keyof typeof colors] || "default";
  };

  const columns = [
    {
      title: "Company",
      dataIndex: "company",
      key: "company",
      render: (company: string, record: Customer) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: "bold" }}>{company}</div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              {record.email}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Contact",
      dataIndex: "contactName",
      key: "contactName",
    },
    {
      title: "Plan",
      dataIndex: "plan",
      key: "plan",
      render: (plan: string) => <Tag color={getPlanColor(plan)}>{plan}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Monthly Revenue",
      dataIndex: "monthlyRevenue",
      key: "monthlyRevenue",
      render: (revenue: number) => `$${revenue.toLocaleString()}`,
    },
    {
      title: "API Usage",
      dataIndex: "apiUsage",
      key: "apiUsage",
      render: (usage: number) => (usage ? usage.toLocaleString() : "N/A"),
    },
    {
      title: "Last Active",
      dataIndex: "lastActive",
      key: "lastActive",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Customer) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "edit",
                icon: <EditOutlined />,
                label: "Edit",
                onClick: () => handleCustomerAction("edit", record),
              },
              {
                key: "suspend",
                icon: <StopOutlined />,
                label: record.status === "active" ? "Suspend" : "Activate",
                onClick: () =>
                  handleCustomerAction(
                    record.status === "active" ? "suspend" : "activate",
                    record,
                  ),
              },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                label: "Delete",
                danger: true,
                onClick: () => handleCustomerAction("delete", record),
              },
            ],
          }}
        >
          <Button>
            Actions <DownOutlined />
          </Button>
        </Dropdown>
      ),
    },
  ];

  const totalRevenue = customers.reduce(
    (sum, customer) => sum + customer.monthlyRevenue,
    0,
  );
  const activeCustomers = customers.filter((c) => c.status === "active").length;

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Customers"
              value={customers.length}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Active Customers"
              value={activeCustomers}
              valueStyle={{ color: "#52c41a" }}
              prefix={<PlayCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Monthly Revenue"
              value={totalRevenue}
              prefix={<DollarOutlined />}
              formatter={(value) => `$${value?.toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Growth Rate"
              value={15.3}
              suffix="%"
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Customer Management"
        extra={
          <Space>
            <Search
              placeholder="Search customers"
              onSearch={handleSearch}
              style={{ width: 200 }}
            />
            <Button type="primary" icon={<PlusOutlined />}>
              Add Customer
            </Button>
            <Button icon={<ExportOutlined />}>Export</Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredCustomers}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      <Modal
        title="Edit Customer"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Company Name" name="company">
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="email">
            <Input />
          </Form.Item>
          <Form.Item label="Contact Name" name="contactName">
            <Input />
          </Form.Item>
          <Form.Item label="Plan" name="plan">
            <Select>
              <Option value="Basic">Basic</Option>
              <Option value="Professional">Professional</Option>
              <Option value="Enterprise">Enterprise</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary">Update Customer</Button>
              <Button onClick={() => setEditModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
