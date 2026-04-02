'use client'
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { AuthProvider } from "@/components/SessionProvider";
import { App, ConfigProvider } from "antd";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AntdRegistry>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#06b6d4',
            },
          }}
        >
          <App>
            {children}
          </App>
        </ConfigProvider>
      </AntdRegistry>
    </AuthProvider>
  );
}
