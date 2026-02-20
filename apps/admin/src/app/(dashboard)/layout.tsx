'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Button,
  Space,
  Typography,
  Breadcrumb,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  GlobalOutlined,
  DashboardOutlined,
  TeamOutlined,
  CalendarOutlined,
  DollarOutlined,
  RiseOutlined,
  FileTextOutlined,
  CreditCardOutlined,
  AccountBookOutlined,
  AuditOutlined,
  BankOutlined,
  ToolOutlined,
  UserSwitchOutlined,
  HeatMapOutlined,
  AppstoreOutlined,
  CustomerServiceOutlined,
  BarChartOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';
import { useAppStore } from '@/store/app.store';
import { getMenuItemsByRole, type MenuItem as MenuItemType } from '@/constants/menus';
import { authApi } from '@/lib/auth';
import { TokenStorage } from '@/lib/api';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

// ─── Icon Map ──────────────────────────────────────────────────────

const iconMap: Record<string, React.ReactNode> = {
  DashboardOutlined: <DashboardOutlined />,
  TeamOutlined: <TeamOutlined />,
  CalendarOutlined: <CalendarOutlined />,
  DollarOutlined: <DollarOutlined />,
  RiseOutlined: <RiseOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  CreditCardOutlined: <CreditCardOutlined />,
  AccountBookOutlined: <AccountBookOutlined />,
  AuditOutlined: <AuditOutlined />,
  BankOutlined: <BankOutlined />,
  ToolOutlined: <ToolOutlined />,
  UserSwitchOutlined: <UserSwitchOutlined />,
  HeatMapOutlined: <HeatMapOutlined />,
  AppstoreOutlined: <AppstoreOutlined />,
  CustomerServiceOutlined: <CustomerServiceOutlined />,
  BarChartOutlined: <BarChartOutlined />,
  SettingOutlined: <SettingOutlined />,
};

// ─── Helper: Convert menu items to Ant Design format ───────────────

function toAntMenuItems(
  items: MenuItemType[],
  t: (key: string) => string,
): MenuProps['items'] {
  return items.map((item) => ({
    key: item.key,
    icon: iconMap[item.icon],
    label: t(item.label),
    children: item.children
      ? item.children.map((child) => ({
          key: child.key,
          icon: iconMap[child.icon],
          label: t(child.label),
        }))
      : undefined,
  }));
}

// ─── Helper: Find active key and open keys from pathname ───────────

function findActiveKeys(
  items: MenuItemType[],
  pathname: string,
): { selectedKey: string; openKeys: string[] } {
  for (const item of items) {
    if (item.children) {
      for (const child of item.children) {
        if (pathname.startsWith(child.path)) {
          return { selectedKey: child.key, openKeys: [item.key] };
        }
      }
    }
    if (pathname.startsWith(item.path) && item.path !== '/') {
      return { selectedKey: item.key, openKeys: [] };
    }
  }
  return { selectedKey: 'dashboard', openKeys: [] };
}

// ─── Helper: Find path by key ──────────────────────────────────────

function findPathByKey(
  items: MenuItemType[],
  key: string,
): string | undefined {
  for (const item of items) {
    if (item.key === key) return item.path;
    if (item.children) {
      for (const child of item.children) {
        if (child.key === key) return child.path;
      }
    }
  }
  return undefined;
}

// ─── Helper: Generate breadcrumbs ──────────────────────────────────

function generateBreadcrumbs(
  pathname: string,
  t: (key: string) => string,
): { title: string }[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { title: string }[] = [];

  for (const segment of segments) {
    const translationKey = `nav.${segment}`;
    const translated = t(translationKey);
    crumbs.push({
      title: translated !== translationKey ? translated : segment,
    });
  }

  return crumbs;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, initialize, logout } =
    useAuthStore();
  const { sidebarCollapsed, language, toggleSidebar, setLanguage } =
    useAppStore();

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Build filtered menu items
  const filteredMenuItems = useMemo(() => {
    if (!user) return [];
    return getMenuItemsByRole(user.role);
  }, [user]);

  const antMenuItems = useMemo(
    () => toAntMenuItems(filteredMenuItems, t),
    [filteredMenuItems, t],
  );

  const { selectedKey, openKeys } = useMemo(
    () => findActiveKeys(filteredMenuItems, pathname),
    [filteredMenuItems, pathname],
  );

  const breadcrumbs = useMemo(
    () => generateBreadcrumbs(pathname, t),
    [pathname, t],
  );

  // Handle menu click navigation
  const onMenuClick: MenuProps['onClick'] = ({ key }) => {
    const path = findPathByKey(filteredMenuItems, key);
    if (path) {
      router.push(path);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      const refreshToken = TokenStorage.getRefreshToken();
      if (refreshToken) {
        await authApi.logout({ refreshToken });
      }
    } catch {
      // Logout even if API call fails
    }
    logout();
    router.push('/login');
  };

  // Handle language switch
  const handleLanguageSwitch = () => {
    const newLang = language === 'en' ? 'ka' : 'en';
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  // User dropdown menu
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: user ? `${user.firstName} ${user.lastName}` : '',
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('auth.logout'),
      danger: true,
      onClick: handleLogout,
    },
  ];

  // Show nothing while loading auth state
  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* ─── Sidebar ──────────────────────────────────────────────── */}
      <Sider
        trigger={null}
        collapsible
        collapsed={sidebarCollapsed}
        width={260}
        collapsedWidth={80}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <div className="sidebar-logo">
          <h2
            className={sidebarCollapsed ? 'sidebar-logo-collapsed' : ''}
            style={{
              color: '#fff',
              margin: 0,
              fontSize: sidebarCollapsed ? 16 : 20,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            {sidebarCollapsed ? 'DB' : 'D BLOCK'}
          </h2>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={openKeys}
          items={antMenuItems}
          onClick={onMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>

      {/* ─── Main Content Area ────────────────────────────────────── */}
      <Layout
        style={{
          marginLeft: sidebarCollapsed ? 80 : 260,
          transition: 'margin-left 0.2s',
        }}
      >
        {/* ─── Header ─────────────────────────────────────────────── */}
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <Space align="center">
            <Button
              type="text"
              icon={
                sidebarCollapsed ? (
                  <MenuUnfoldOutlined />
                ) : (
                  <MenuFoldOutlined />
                )
              }
              onClick={toggleSidebar}
              style={{ fontSize: 16 }}
            />
            <Breadcrumb items={breadcrumbs} />
          </Space>

          <Space size="middle">
            {/* Language Switcher */}
            <Button
              type="text"
              icon={<GlobalOutlined />}
              onClick={handleLanguageSwitch}
            >
              {language === 'en' ? 'EN' : 'KA'}
            </Button>

            {/* User Avatar Dropdown */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  src={user?.profileImageUrl}
                  style={{ backgroundColor: '#E94560' }}
                />
                <Text strong style={{ fontSize: 13 }}>
                  {user?.firstName}
                </Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* ─── Page Content ───────────────────────────────────────── */}
        <Content className="content-area">{children}</Content>
      </Layout>
    </Layout>
  );
}
