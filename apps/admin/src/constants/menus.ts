import { UserRole } from '@/lib/auth';

// ─── Types ─────────────────────────────────────────────────────────

export interface MenuItem {
  key: string;
  label: string;
  icon: string;
  path: string;
  roles: UserRole[];
  children?: MenuItem[];
}

// ─── Admin Roles (all staff-level roles) ───────────────────────────

const ALL_ADMIN_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.FINANCE_ADMIN,
  UserRole.LOCATION_MANAGER,
  UserRole.RECEPTION_STAFF,
  UserRole.MARKETING_ADMIN,
  UserRole.SUPPORT_AGENT,
];

// ─── Menu Items ────────────────────────────────────────────────────

export const menuItems: MenuItem[] = [
  {
    key: 'dashboard',
    label: 'nav.dashboard',
    icon: 'DashboardOutlined',
    path: '/dashboard',
    roles: ALL_ADMIN_ROLES,
  },
  {
    key: 'users',
    label: 'nav.users',
    icon: 'TeamOutlined',
    path: '/users',
    roles: [UserRole.SUPER_ADMIN, UserRole.LOCATION_MANAGER],
  },
  {
    key: 'bookings',
    label: 'nav.bookings',
    icon: 'CalendarOutlined',
    path: '/bookings',
    roles: ALL_ADMIN_ROLES,
  },
  {
    key: 'finance',
    label: 'nav.finance',
    icon: 'DollarOutlined',
    path: '/finance',
    roles: [UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN],
    children: [
      {
        key: 'finance-revenue',
        label: 'nav.revenue',
        icon: 'RiseOutlined',
        path: '/finance/revenue',
        roles: [UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN],
      },
      {
        key: 'finance-invoices',
        label: 'nav.invoices',
        icon: 'FileTextOutlined',
        path: '/finance/invoices',
        roles: [UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN],
      },
      {
        key: 'finance-payments',
        label: 'nav.payments',
        icon: 'CreditCardOutlined',
        path: '/finance/payments',
        roles: [UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN],
      },
      {
        key: 'finance-accounting',
        label: 'nav.accountingPeriods',
        icon: 'AccountBookOutlined',
        path: '/finance/accounting-periods',
        roles: [UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN],
      },
      {
        key: 'finance-tax',
        label: 'nav.taxReports',
        icon: 'AuditOutlined',
        path: '/finance/tax-reports',
        roles: [UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN],
      },
    ],
  },
  {
    key: 'b2b',
    label: 'nav.b2b',
    icon: 'BankOutlined',
    path: '/b2b',
    roles: [
      UserRole.SUPER_ADMIN,
      UserRole.FINANCE_ADMIN,
      UserRole.LOCATION_MANAGER,
    ],
  },
  {
    key: 'operations',
    label: 'nav.operations',
    icon: 'ToolOutlined',
    path: '/operations',
    roles: ALL_ADMIN_ROLES,
    children: [
      {
        key: 'operations-visitors',
        label: 'nav.visitors',
        icon: 'UserSwitchOutlined',
        path: '/operations/visitors',
        roles: ALL_ADMIN_ROLES,
      },
      {
        key: 'operations-occupancy',
        label: 'nav.occupancy',
        icon: 'HeatMapOutlined',
        path: '/operations/occupancy',
        roles: ALL_ADMIN_ROLES,
      },
      {
        key: 'operations-resources',
        label: 'nav.resources',
        icon: 'AppstoreOutlined',
        path: '/operations/resources',
        roles: ALL_ADMIN_ROLES,
      },
      {
        key: 'operations-support',
        label: 'nav.supportTickets',
        icon: 'CustomerServiceOutlined',
        path: '/operations/support',
        roles: ALL_ADMIN_ROLES,
      },
    ],
  },
  {
    key: 'reports',
    label: 'nav.reports',
    icon: 'BarChartOutlined',
    path: '/reports',
    roles: [
      UserRole.SUPER_ADMIN,
      UserRole.FINANCE_ADMIN,
      UserRole.MARKETING_ADMIN,
    ],
  },
  {
    key: 'settings',
    label: 'nav.settings',
    icon: 'SettingOutlined',
    path: '/settings',
    roles: [UserRole.SUPER_ADMIN, UserRole.MARKETING_ADMIN],
    children: [
      {
        key: 'settings-general',
        label: 'nav.general',
        icon: 'SettingOutlined',
        path: '/settings',
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        key: 'settings-notifications',
        label: 'nav.notifications',
        icon: 'BellOutlined',
        path: '/settings/notifications',
        roles: [UserRole.SUPER_ADMIN, UserRole.MARKETING_ADMIN],
      },
      {
        key: 'settings-promotions',
        label: 'nav.promotions',
        icon: 'GiftOutlined',
        path: '/settings/promotions',
        roles: [UserRole.SUPER_ADMIN, UserRole.MARKETING_ADMIN],
      },
      {
        key: 'settings-analytics',
        label: 'nav.analytics',
        icon: 'LineChartOutlined',
        path: '/settings/analytics',
        roles: [UserRole.SUPER_ADMIN, UserRole.MARKETING_ADMIN],
      },
    ],
  },
];

// ─── Helper: Filter menu items by role ─────────────────────────────

export function getMenuItemsByRole(role: UserRole): MenuItem[] {
  return menuItems
    .filter((item) => item.roles.includes(role))
    .map((item) => ({
      ...item,
      children: item.children?.filter((child) => child.roles.includes(role)),
    }));
}
