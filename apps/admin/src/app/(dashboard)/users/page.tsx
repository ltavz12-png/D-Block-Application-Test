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
import { useUsers } from '@/lib/api-hooks';

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useUsers({
    search: searchText || undefined,
    role: roleFilter as UserRole | undefined,
    status: statusFilter as UserStatus | undefined,
    page,
    limit: pageSize,
  });

  const users: UserRow[] = (data?.data ?? []).map((u) => ({
    key: u.id,
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: u.phone,
    role: u.role as UserRole,
    status: u.status as UserStatus,
    lastLoginAt: u.lastLoginAt,
    profileImageUrl: u.profileImageUrl,
    createdAt: u.createdAt,
  }));

  const total = data?.total ?? 0;

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
          onChange={(e) => {
            setSearchText(e.target.value);
            setPage(1);
          }}
          style={{ width: 300 }}
          allowClear
        />
        <Select
          placeholder={t('users.role')}
          value={roleFilter}
          onChange={(v) => {
            setRoleFilter(v);
            setPage(1);
          }}
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
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
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
        dataSource={users}
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
          showTotal: (tot, range) =>
            `${range[0]}-${range[1]} of ${tot} ${t('users.title').toLowerCase()}`,
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
