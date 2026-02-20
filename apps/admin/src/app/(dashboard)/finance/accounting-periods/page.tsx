'use client';

import React from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Card,
  Row,
  Col,
  Statistic,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  LockOutlined,
  UnlockOutlined,
  EyeOutlined,
  AccountBookOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '@/components/PageHeader';

// ─── Types ─────────────────────────────────────────────────────────

type PeriodStatus = 'open' | 'closed' | 'reopened';

interface AccountingPeriodRow {
  key: string;
  periodName: string;
  startDate: string;
  endDate: string;
  status: PeriodStatus;
  totalRevenue: number;
  entryCount: number;
  closedAt: string | null;
  closedBy: string | null;
}

// ─── Placeholder Data ──────────────────────────────────────────────

const placeholderPeriods: AccountingPeriodRow[] = [
  {
    key: '1',
    periodName: 'January 2025',
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    status: 'open',
    totalRevenue: 78000,
    entryCount: 342,
    closedAt: null,
    closedBy: null,
  },
  {
    key: '2',
    periodName: 'December 2024',
    startDate: '2024-12-01',
    endDate: '2024-12-31',
    status: 'closed',
    totalRevenue: 89000,
    entryCount: 418,
    closedAt: '2025-01-05T10:00:00Z',
    closedBy: 'Tamari Javakhishvili',
  },
  {
    key: '3',
    periodName: 'November 2024',
    startDate: '2024-11-01',
    endDate: '2024-11-30',
    status: 'reopened',
    totalRevenue: 76000,
    entryCount: 389,
    closedAt: '2024-12-04T09:30:00Z',
    closedBy: 'Tamari Javakhishvili',
  },
  {
    key: '4',
    periodName: 'October 2024',
    startDate: '2024-10-01',
    endDate: '2024-10-31',
    status: 'closed',
    totalRevenue: 82000,
    entryCount: 401,
    closedAt: '2024-11-03T11:00:00Z',
    closedBy: 'Giorgi Beridze',
  },
  {
    key: '5',
    periodName: 'September 2024',
    startDate: '2024-09-01',
    endDate: '2024-09-30',
    status: 'closed',
    totalRevenue: 68000,
    entryCount: 356,
    closedAt: '2024-10-04T14:00:00Z',
    closedBy: 'Tamari Javakhishvili',
  },
  {
    key: '6',
    periodName: 'August 2024',
    startDate: '2024-08-01',
    endDate: '2024-08-31',
    status: 'closed',
    totalRevenue: 65000,
    entryCount: 312,
    closedAt: '2024-09-03T10:30:00Z',
    closedBy: 'Giorgi Beridze',
  },
  {
    key: '7',
    periodName: 'July 2024',
    startDate: '2024-07-01',
    endDate: '2024-07-31',
    status: 'closed',
    totalRevenue: 72000,
    entryCount: 378,
    closedAt: '2024-08-05T09:00:00Z',
    closedBy: 'Tamari Javakhishvili',
  },
  {
    key: '8',
    periodName: 'June 2024',
    startDate: '2024-06-01',
    endDate: '2024-06-30',
    status: 'closed',
    totalRevenue: 58000,
    entryCount: 298,
    closedAt: '2024-07-03T11:15:00Z',
    closedBy: 'Giorgi Beridze',
  },
  {
    key: '9',
    periodName: 'May 2024',
    startDate: '2024-05-01',
    endDate: '2024-05-31',
    status: 'closed',
    totalRevenue: 62000,
    entryCount: 334,
    closedAt: '2024-06-04T10:00:00Z',
    closedBy: 'Tamari Javakhishvili',
  },
  {
    key: '10',
    periodName: 'April 2024',
    startDate: '2024-04-01',
    endDate: '2024-04-30',
    status: 'closed',
    totalRevenue: 51000,
    entryCount: 276,
    closedAt: '2024-05-03T09:45:00Z',
    closedBy: 'Giorgi Beridze',
  },
];

// ─── Status Colors ─────────────────────────────────────────────────

const statusColors: Record<PeriodStatus, string> = {
  open: 'green',
  closed: 'default',
  reopened: 'orange',
};

export default function AccountingPeriodsPage() {
  const { t } = useTranslation();

  const openPeriods = placeholderPeriods.filter(
    (p) => p.status === 'open' || p.status === 'reopened',
  );
  const lastClosedPeriod = placeholderPeriods.find(
    (p) => p.status === 'closed',
  );
  const currentPeriod = placeholderPeriods.find((p) => p.status === 'open');

  const columns: ColumnsType<AccountingPeriodRow> = [
    {
      title: t('finance.periodName'),
      dataIndex: 'periodName',
      key: 'periodName',
      width: 170,
      render: (name: string) => (
        <span style={{ fontWeight: 500 }}>{name}</span>
      ),
    },
    {
      title: t('finance.startDate'),
      dataIndex: 'startDate',
      key: 'startDate',
      width: 130,
      render: (date: string) =>
        new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
    },
    {
      title: t('finance.endDate'),
      dataIndex: 'endDate',
      key: 'endDate',
      width: 130,
      render: (date: string) =>
        new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
    },
    {
      title: t('finance.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: PeriodStatus) => (
        <Tag color={statusColors[status]}>{status}</Tag>
      ),
    },
    {
      title: t('finance.totalRevenue'),
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      width: 150,
      align: 'right',
      render: (amount: number) => (
        <span style={{ fontWeight: 500 }}>
          {amount.toLocaleString()} GEL
        </span>
      ),
    },
    {
      title: t('finance.entryCount'),
      dataIndex: 'entryCount',
      key: 'entryCount',
      width: 110,
      align: 'center',
    },
    {
      title: t('finance.closedAt'),
      dataIndex: 'closedAt',
      key: 'closedAt',
      width: 170,
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
      title: t('finance.closedBy'),
      dataIndex: 'closedBy',
      key: 'closedBy',
      width: 180,
      render: (name: string | null) => name || '-',
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 160,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('finance.viewEntries')}>
            <Button type="text" size="small" icon={<EyeOutlined />} />
          </Tooltip>
          {(record.status === 'open' || record.status === 'reopened') && (
            <Tooltip title={t('finance.closePeriod')}>
              <Button
                type="text"
                size="small"
                icon={<LockOutlined />}
                style={{ color: '#ff4d4f' }}
              />
            </Tooltip>
          )}
          {record.status === 'closed' && (
            <Tooltip title={t('finance.reopenPeriod')}>
              <Button
                type="text"
                size="small"
                icon={<UnlockOutlined />}
                style={{ color: '#faad14' }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('finance.accountingPeriodsTitle')}
        actions={
          <Button type="primary" icon={<PlusOutlined />}>
            {t('finance.createPeriod')}
          </Button>
        }
      />

      {/* ─── Summary Cards ───────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('finance.currentPeriod')}
              value={currentPeriod?.periodName || '-'}
              prefix={<CalendarOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('finance.totalOpenPeriods')}
              value={openPeriods.length}
              prefix={<AccountBookOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('finance.lastClosedPeriod')}
              value={lastClosedPeriod?.periodName || '-'}
              prefix={<CheckCircleOutlined style={{ color: '#1A1A2E' }} />}
              valueStyle={{ fontSize: 20 }}
            />
          </Card>
        </Col>
      </Row>

      {/* ─── Periods Table ───────────────────────────────────────── */}
      <Table
        columns={columns}
        dataSource={placeholderPeriods}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} periods`,
        }}
        scroll={{ x: 1400 }}
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
