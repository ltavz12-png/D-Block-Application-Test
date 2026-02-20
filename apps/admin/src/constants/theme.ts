import type { ThemeConfig } from 'antd';

// ─── Color Palette ─────────────────────────────────────────────────

export const colors = {
  primary: '#1A1A2E',
  secondary: '#E94560',
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1677ff',
  background: '#f5f5f5',
  surface: '#ffffff',
  textPrimary: '#1A1A2E',
  textSecondary: '#666666',
  textDisabled: '#bfbfbf',
  border: '#d9d9d9',
  sidebarBg: '#1A1A2E',
  sidebarText: '#ffffff',
  headerBg: '#ffffff',
} as const;

// ─── Ant Design Theme Config ───────────────────────────────────────

export const adminTheme: ThemeConfig = {
  token: {
    colorPrimary: colors.primary,
    colorSuccess: colors.success,
    colorWarning: colors.warning,
    colorError: colors.error,
    colorInfo: colors.info,
    colorBgLayout: colors.background,
    colorBgContainer: colors.surface,
    colorText: colors.textPrimary,
    colorTextSecondary: colors.textSecondary,
    colorTextDisabled: colors.textDisabled,
    colorBorder: colors.border,
    borderRadius: 8,
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,
  },
  components: {
    Layout: {
      siderBg: colors.sidebarBg,
      headerBg: colors.headerBg,
      bodyBg: colors.background,
    },
    Menu: {
      darkItemBg: colors.sidebarBg,
      darkItemColor: 'rgba(255, 255, 255, 0.75)',
      darkItemHoverColor: '#ffffff',
      darkItemSelectedBg: colors.secondary,
      darkItemSelectedColor: '#ffffff',
      darkSubMenuItemBg: 'rgba(0, 0, 0, 0.2)',
    },
    Button: {
      primaryColor: '#ffffff',
      defaultBorderColor: colors.border,
    },
    Card: {
      borderRadiusLG: 12,
    },
    Table: {
      borderRadiusLG: 12,
      headerBg: '#fafafa',
    },
  },
};
