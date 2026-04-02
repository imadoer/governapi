import { theme } from 'antd';

export const governTheme = {
  algorithm: theme.defaultAlgorithm, // Use light theme for professional look
  token: {
    colorPrimary: '#1677FF',
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#F5F7FA',
    colorTextBase: '#262626',
    colorTextSecondary: '#8C8C8C',
    borderRadiusLG: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    colorSuccess: '#00C853',
    colorError: '#FF5252',
    colorWarning: '#FFC107',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Card: {
      borderRadiusLG: 16,
      paddingLG: 24,
      boxShadowTertiary: '0 6px 16px rgba(0,0,0,0.08)',
    },
    Button: {
      borderRadius: 8,
      controlHeight: 40,
      fontWeight: 500,
    },
    Table: {
      borderRadiusLG: 12,
    },
  },
};

export const governThemeDark = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#1677FF',
    colorBgContainer: '#141414',
    colorBgLayout: '#0A0A0A',
    colorTextBase: '#E6E6E6',
    colorTextSecondary: '#999999',
    borderRadiusLG: 16,
    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
    colorSuccess: '#00C853',
    colorError: '#FF5252',
    colorWarning: '#FFC107',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Card: {
      borderRadiusLG: 16,
      paddingLG: 24,
    },
    Button: {
      borderRadius: 8,
      controlHeight: 40,
      fontWeight: 500,
    },
  },
};
