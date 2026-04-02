"use client";

import React, { useState, useEffect } from "react";
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Typography,
  Space,
  Button,
  Tag,
  message,
} from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  DollarOutlined,
  LineChartOutlined,
  SettingOutlined,
  ApiOutlined,
  SecurityScanOutlined,
  LogoutOutlined,
  BellOutlined,
  SearchOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

export default function AdminLayout({
  children,
  currentPage = "dashboard",
}: {
  children: any;
  currentPage?: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("admin_authenticated");
    if (!isAuthenticated) {
      router.push("/admin/login");
    }
  }, [router]);

  const menuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard Overview",
    },
    { key: "customers", icon: <UserOutlined />, label: "Customer Management" },
    { key: "revenue", icon: <DollarOutlined />, label: "Revenue Analytics" },
    { key: "billing", icon: <LineChartOutlined />, label: "Billing Overview" },
    {
      key: "analytics",
      icon: <LineChartOutlined />,
      label: "System Analytics",
    },
    { key: "api-keys", icon: <ApiOutlined />, label: "API Key Management" },
    {
      key: "blocked-users",
      icon: <SecurityScanOutlined />,
      label: "Blocked Users",
    },
    { key: "settings", icon: <SettingOutlined />, label: "System Settings" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("admin_authenticated");
    message.success("Logged out successfully");
    router.push("/admin/login");
  };

  const userMenu = {
    items: [
      {
        key: "profile",
        icon: <UserOutlined />,
        label: "Admin Profile",
      },
      {
        key: "notifications",
        icon: <BellOutlined />,
        label: "Notifications",
      },
      {
        type: "divider" as any,
      },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Logout",
        onClick: handleLogout,
      },
    ],
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case "dashboard":
        router.push("/admin/dashboard");
        break;
      case "customers":
        router.push("/admin/customers");
        break;
      case "revenue":
        router.push("/admin/revenue");
        break;
      case "billing":
        router.push("/admin/billing");
        break;
      case "analytics":
        router.push("/admin/analytics");
        break;
      case "api-keys":
        router.push("/admin/api-keys");
        break;
      case "blocked-users":
        router.push("/admin/blocked-users");
        break;
      case "settings":
        router.push("/admin/settings");
        break;
      default:
        console.log(`Navigate to admin ${key}`);
        break;
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={280}
        style={{
          background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
          boxShadow: "2px 0 8px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            padding: collapsed ? "16px 8px" : "20px 24px",
            textAlign: "center",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            marginBottom: 16,
          }}
        >
          {!collapsed ? (
            <>
              <Title
                level={3}
                style={{ color: "white", margin: 0, fontSize: 18 }}
              >
                GovernAPI Admin
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                Enterprise Control Center
              </Text>
              <div style={{ marginTop: 8 }}>
                <Tag color="red">ADMIN ACCESS</Tag>
              </div>
            </>
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                color: "white",
                fontWeight: "bold",
                fontSize: 14,
              }}
            >
              A
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[currentPage]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            background: "transparent",
            border: "none",
          }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: "white",
            padding: "0 24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0, color: "#1f2937" }}>
              {menuItems.find((item) => item.key === currentPage)?.label ||
                "Admin Dashboard"}
            </Title>
          </div>

          <Space>
            <Button icon={<BellOutlined />} type="text">
              <Tag style={{ backgroundColor: "#ff4d4f" }} />
            </Button>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#1f2937", fontWeight: 500 }}>
                System Administrator
              </div>
              <div style={{ color: "#64748b", fontSize: 12 }}>
                All Permissions • Super Admin
              </div>
            </div>
            <Dropdown menu={userMenu} placement="bottomRight">
              <Button
                type="text"
                style={{ border: "none", padding: "4px 8px" }}
              >
                <Avatar
                  style={{
                    backgroundColor: "#dc2626",
                    cursor: "pointer",
                  }}
                >
                  A
                </Avatar>
              </Button>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: "24px",
            padding: "24px",
            background: "#f8fafc",
            borderRadius: "12px",
            minHeight: "calc(100vh - 112px)",
            overflow: "auto",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
