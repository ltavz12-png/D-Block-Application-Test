'use client';

import React, { useState } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  Avatar,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '@/components/PageHeader';
import { UserRole, UserStatus } from '@/lib/auth';

// ─── Types ─────────────────────────────────────────────────────────

interface UserRow {
  key: string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: string | null;
  profileImageUrl: string | null;
  createdAt: string;
}

// ─── Placeholder Data ──────────────────────────────────────────────

const placeholderUsers: UserRow[] = [
  {
    key: '1',
    id: 'usr-001',
    firstName: 'Giorgi',
    lastName: 'Beridze',
    email: 'giorgi@dblock.ge',
    phone: '+995 555 123 456',
    role: UserRole.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
    lastLoginAt: '2024-12-20T10:30:00Z',
    profileImageUrl: null,
    createdAt: '2024-01-15T08:00:00Z',
  },
  {
    key: '2',
    id: 'usr-002',
    firstName: 'Nino',
    lastName: 'Kapanadze',
    email: 'nino@dblock.ge',
    phone: '+995 555 234 567',
    role: UserRole.LOCATION_MANAGER,
    status: UserStatus.ACTIVE,
    lastLoginAt: '2024-12-19T16:45:00Z',
    profileImageUrl: null,
    createdAt: '2024-02-20T08:00:00Z',
  },
  {
    key: '3',
    id: 'usr-003',
    firstName: 'David',
    lastName: 'Tsiklauri',
    email: 'david@company.ge',
    phone: '+995 555 345 678',
    role: UserRole.COMPANY_ADMIN,
    status: UserStatus.ACTIVE,
    lastLoginAt: '2024-12-18T09:15:00Z',
    profileImageUrl: null,
    createdAt: '2024-03-10T08:00:00Z',
  },
  {
    key: '4',
    id: 'usr-004',
    firstName: 'Ana',
    lastName: 'Lomidze',
    email: 'ana.lomidze@gmail.com',
    phone: '+995 555 456 789',
    role: UserRole.MEMBER,
    status: UserStatus.ACTIVE,
    lastLoginAt: '2024-12-20T08:00:00Z',
    profileImageUrl: null,
    createdAt: '2024-04-05T08:00:00Z',
  },
  {
    key: '5',
    id: 'usr-005',
    firstName: 'Lasha',
    lastName: 'Gogichaishvili',
    email: 'lasha@example.com',
    phone: null,
    role: UserRole.MEMBER,
    status: UserStatus.PENDING_VERIFICATION,
    lastLoginAt: null,
    profileImageUrl: null,
    createdAt: '2024-12-19T14:00:00Z',
  },
  {
    key: '6',
    id: 'usr-006',
    firstName: 'Tamari',
    lastName: 'Javakhishvili',
    email: 'tamari@dblock.ge',
    phone: '+995 555 567 890',
    role: UserRole.FINANCE_ADMIN,
    status: UserStatus.ACTIVE,
    lastLoginAt: '2024-12-20T11:00:00Z',
    profileImageUrl: null,
    createdAt: '2024-01-20T08:00:00Z',
  },
  {
    key: '7',
    id: 'usr-007',
    firstName: 'Irakli',
    lastName: 'Mgeladze',
    email: 'irakli@dblock.ge',
    phone: '+995 555 678 901',
    role: UserRole.RECEPTION_STAFF,
    status: UserStatus.ACTIVE,
    lastLoginAt: '2024-12-20T07:55:00Z',
    profileImageUrl: null,
    createdAt: '2024-05-15T08:00:00Z',
  },
  {
    key: '8',
    id: 'usr-008',
    firstName: 'Mariam',
    lastName: 'Kvaratskhelia',
    email: 'mariam@example.com',
    phone: '+995 555 789 012',
    role: UserRole.MEMBER,
    status: UserStatus.SUSPENDED,
    lastLoginAt: '2024-11-15T10:00:00Z',
    profileImageUrl: null,
    createdAt: '2024-06-01T08:00:00Z',
  },
  {
    key: '9',
    id: 'usr-009',
    firstName: 'Salome',
    lastName: 'Kipiani',
    email: 'salome@dblock.ge',
    phone: '+995 555 890 123',
    role: UserRole.MARKETING_ADMIN,
    status: UserStatus.ACTIVE,
    lastLoginAt: '2024-12-20T09:30:00Z',
    profileImageUrl: null,
    createdAt: '2024-02-01T08:00:00Z',
  },
  {
    key: '10',
    id: 'usr-010',
    firstName: 'Nikoloz',
    lastName: 'Basilashvili',
    email: 'niko@company2.ge',
    phone: '+995 555 901 234',
    role: UserRole.COMPANY_EMPLOYEE,
    status: UserStatus.ACTIVE,
    lastLoginAt: '2024-12-19T17:00:00Z',
    profileImageUrl: null,
    createdAt: '2024-07-10T08:00:00Z',
  },
];

// ─── Status tag colors ─────────────────────────────────────────────

const statusTagColors: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: 'green',
  [UserStatus.SUSPENDED]: 'red',
  [UserStatus.DEACTIVATED]: 'default',
  [UserStatus.PENDING_VERIFICATION]: 'orange',
};

// ─── Role tag colors ───────────────────────────────────────────────

const roleTagColors: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'purple',
  [UserRole.FINANCE_ADMIN]: 'blue',
  [UserRole.LOCATION_MANAGER]: 'cyan',
  [UserRole.RECEPTION_STAFF]: 'geekblue',
  [UserRole.MARKETING_ADMIN]: 'magenta',
  [UserRole.SUPPORT_AGENT]: 'orange',
  [UserRole.COMPANY_ADMIN]: 'gold',
  [UserRole.COMPANY_EMPLOYEE]: 'lime',
  [UserRole.MEMBER]: 'default',
};

export default function UsersPage() {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );

  // Filter users based on search and filters
  const filteredUsers = placeholderUsers.filter((user) => {
    const matchesSearch =
      !searchText ||
      `${user.firstName} ${user.lastName}`
        .toLowerCase()
        .includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase());

    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const columns: ColumnsType<UserRow> = [
    {
      title: t('users.name'),
      key: 'name',
      width: 220,
      render: (_, record) => (
        <Space>
          <Avatar
            size="small"
            icon={<UserOutlined />}
            src={record.profileImageUrl}
            style={{ backgroundColor: '#E94560' }}
          />
          <span>
            {record.firstName} {record.lastName}
          </span>
        </Space>
      ),
    },
    {
      title: t('users.email'),
      dataIndex: 'email',
      key: 'email',
      width: 220,
    },
    {
      title: t('users.phone'),
      dataIndex: 'phone',
      key: 'phone',
      width: 160,
      render: (phone: string | null) => phone || '-',
    },
    {
      title: t('users.role'),
      dataIndex: 'role',
      key: 'role',
      width: 160,
      render: (role: UserRole) => (
        <Tag color={roleTagColors[role]}>{t(`users.roles.${role}`)}</Tag>
      ),
    },
    {
      title: t('users.status'),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: UserStatus) => (
        <Tag color={statusTagColors[status]}>
          {t(`users.statuses.${status}`)}
        </Tag>
      ),
    },
    {
      title: t('users.lastLogin'),
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 160,
      render: (date: string | null) =>
        date
          ? new Date(date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '-',
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 120,
      align: 'center',
      render: () => (
        <Space size="small">
          <Tooltip title={t('common.edit')}>
            <Button type="text" size="small" icon={<EyeOutlined />} />
          </Tooltip>
          <Tooltip title={t('common.edit')}>
            <Button type="text" size="small" icon={<EditOutlined />} />
          </Tooltip>
          <Tooltip title={t('common.delete')}>
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('users.title')}
        actions={
          <Button type="primary" icon={<PlusOutlined />}>
            {t('users.addUser')}
          </Button>
        }
      />

      {/* ─── Filter Bar ─────────────────────────────────────────── */}
      <div className="filter-bar">
        <Input
          placeholder={t('users.searchPlaceholder')}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Select
          placeholder={t('users.role')}
          value={roleFilter}
          onChange={setRoleFilter}
          allowClear
          style={{ width: 180 }}
          options={Object.values(UserRole).map((role) => ({
            value: role,
            label: t(`users.roles.${role}`),
          }))}
        />
        <Select
          placeholder={t('users.status')}
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
          style={{ width: 180 }}
          options={Object.values(UserStatus).map((status) => ({
            value: status,
            label: t(`users.statuses.${status}`),
          }))}
        />
      </div>

      {/* ─── Users Table ────────────────────────────────────────── */}
      <Table
        columns={columns}
        dataSource={filteredUsers}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} ${t('users.title').toLowerCase()}`,
        }}
        scroll={{ x: 1100 }}
        size="middle"
        style={{
          background: '#fff',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      />
    </div>
  );
}
