"use client";
import React, { useState } from "react";
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Typography,
  Space,
  Button,
  Tag,
} from "antd";
import {
  BarChartOutlined,
  KeyOutlined,
  SecurityScanOutlined,
  LockOutlined,
  RobotOutlined,
  FileTextOutlined,
  MonitorOutlined,
  BugOutlined,
  GlobalOutlined,
  CodeOutlined,
  BellOutlined,
  ThunderboltOutlined,
  LineChartOutlined,
  CreditCardOutlined,
  ExportOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  TeamOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

interface MenuItem {
  key: string;
  label: string;
  icon: string;
}

interface CustomerLayoutProps {
  user?: any;
  company?: any;
  currentPage: string;
  onMenuClick: (key: string) => void;
  onLogout: () => void;
  menuItems: MenuItem[];
  loading: boolean;
  children: React.ReactNode;
}

export default function CustomerLayout({
  user,
  company,
  currentPage,
  onMenuClick,
  onLogout,
  menuItems,
  loading,
  children,
}: CustomerLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  const iconMap: { [key: string]: React.ReactNode } = {
    DashboardOutlined: <DashboardOutlined />,
    KeyOutlined: <KeyOutlined />,
    SecurityScanOutlined: <SecurityScanOutlined />,
    LockOutlined: <LockOutlined />,
    RobotOutlined: <RobotOutlined />,
    FileTextOutlined: <FileTextOutlined />,
    MonitorOutlined: <MonitorOutlined />,
    BugOutlined: <BugOutlined />,
    GlobalOutlined: <GlobalOutlined />,
    CodeOutlined: <CodeOutlined />,
    BellOutlined: <BellOutlined />,
    ThunderboltOutlined: <ThunderboltOutlined />,
    LineChartOutlined: <LineChartOutlined />,
    CreditCardOutlined: <CreditCardOutlined />,
    ExportOutlined: <ExportOutlined />,
    SettingOutlined: <SettingOutlined />,
  };

  const menuItemsFormatted = menuItems.map((item) => ({
    key: item.key,
    icon: iconMap[item.icon] || <DashboardOutlined />,
    label: item.label,
    style:
      currentPage === item.key
        ? {
            margin: "4px 8px",
            borderRadius: "12px",
            height: "48px",
            background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
            color: "#fff",
            fontWeight: "600",
            boxShadow: "0 4px 12px rgba(24, 144, 255, 0.3)",
            border: "none",
            transform: "translateX(4px)",
            transition: "all 0.3s ease",
          }
        : {
            margin: "4px 8px",
            borderRadius: "12px",
            height: "48px",
            color: "#64748b",
            fontWeight: "500",
            transition: "all 0.3s ease",
          },
  }));

  const userMenu = {
    items: [
      { key: "profile", label: "Profile", icon: <UserOutlined /> },
      { key: "settings", label: "Settings", icon: <SettingOutlined /> },
      { type: "divider" as const },
      {
        key: "logout",
        label: "Logout",
        icon: <LogoutOutlined />,
        onClick: onLogout,
      },
    ],
  };

  return (
    <Layout
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f2f5 0%, #e6f7ff 100%)",
      }}
    >
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          borderRight: "1px solid #e8e8e8",
          boxShadow: "2px 0 8px rgba(0, 0, 0, 0.08)",
          overflow: "hidden",
        }}
        width={280}
        className="custom-sidebar"
      >
        {/* Header section */}
        <div
          style={{
            padding: collapsed ? "20px 12px" : "24px",
            borderBottom: "1px solid #f0f0f0",
            textAlign: "center",
            background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
            margin: "12px 12px 0 12px",
            borderRadius: "12px",
            color: "white",
            flexShrink: 0,
          }}
        >
          <Title
            level={collapsed ? 5 : 3}
            style={{
              margin: 0,
              color: "#fff",
              fontWeight: "700",
            }}
          >
            {collapsed ? "GA" : "GoverAPI"}
          </Title>
          {!collapsed && (
            <Text
              style={{
                fontSize: "13px",
                color: "rgba(255, 255, 255, 0.9)",
                fontWeight: "500",
              }}
            >
              Enterprise Security Platform
            </Text>
          )}
        </div>

        {/* Scrollable menu section */}
        <div
          style={{
            height: "calc(100vh - 140px)",
            overflowY: "auto",
            overflowX: "hidden",
            padding: "8px 0",
            // Custom scrollbar styling
            scrollbarWidth: "thin",
            scrollbarColor: "#1890ff transparent",
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[currentPage]}
            items={menuItemsFormatted}
            onClick={({ key }) => onMenuClick(key)}
            style={{
              border: "none",
              background: "transparent",
              height: "auto",
            }}
          />
        </div>
      </Sider>

      <Layout>
        <Header
          style={{
            padding: "0 32px",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid #e8e8e8",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "12px 12px 0 0",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "18px",
              width: 48,
              height: 48,
              borderRadius: "12px",
              background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
              color: "white",
              border: "none",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 6px 16px rgba(24, 144, 255, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />

          <Space size="large">
            {company && (
              <Tag
                style={{
                  background:
                    "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "16px",
                  padding: "4px 16px",
                  fontWeight: "600",
                }}
              >
                {company.subscription_plan?.toUpperCase() || "PROFESSIONAL"}{" "}
                PLAN
              </Tag>
            )}
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space
                style={{
                  cursor: "pointer",
                  background: "rgba(24, 144, 255, 0.1)",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(24, 144, 255, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(24, 144, 255, 0.1)";
                }}
              >
                <Avatar
                  style={{
                    background:
                      "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                  }}
                  icon={<UserOutlined />}
                />
                <Text style={{ fontWeight: "600" }}>
                  {user?.firstName || "Demo User"}
                </Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: "12px",
            padding: "24px",
            background: "#fff",
            borderRadius: "12px",
            minHeight: 280,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
            overflow: "auto",
          }}
        >
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px",
                background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                borderRadius: "12px",
                color: "white",
              }}
            >
              Loading Security Dashboard...
            </div>
          ) : (
            children
          )}
        </Content>
      </Layout>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-sidebar .ant-menu-item {
          white-space: nowrap !important;
          overflow: visible !important;
          text-overflow: unset !important;
          width: auto !important;
        }
        .custom-sidebar .ant-menu-item-title {
          white-space: nowrap !important;
          overflow: visible !important;
        }
        .ant-layout-sider .ant-menu::-webkit-scrollbar {
          width: 6px;
        }
        .ant-layout-sider .ant-menu::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        .ant-layout-sider .ant-menu::-webkit-scrollbar-thumb {
          background: #1890ff;
          border-radius: 3px;
        }
        .ant-layout-sider .ant-menu::-webkit-scrollbar-thumb:hover {
          background: #096dd9;
        }
      `}</style>
    </Layout>
  );
}
