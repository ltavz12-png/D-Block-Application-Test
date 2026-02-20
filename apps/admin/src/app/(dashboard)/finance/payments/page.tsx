'use client';

import React, { useState } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Card,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Tooltip,
} from 'antd';
import {
  CreditCardOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RollbackOutlined,
  EyeOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '@/components/PageHeader';

const { RangePicker } = DatePicker;

// ─── Types ─────────────────────────────────────────────────────────

type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
type PaymentGateway = 'BOG iPay' | 'TBC TPay' | 'mock';

interface PaymentRow {
  key: string;
  paymentId: string;
  user: string;
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  status: PaymentStatus;
  bookingId: string;
  createdAt: string;
}

// ─── Placeholder Data ──────────────────────────────────────────────

const placeholderPayments: PaymentRow[] = [
  {
    key: '1',
    paymentId: 'PAY-20250115-001',
    user: 'Giorgi Beridze',
    amount: 120,
    currency: 'GEL',
    gateway: 'BOG iPay',
    status: 'completed',
    bookingId: 'BK-2025-001',
    createdAt: '2025-01-15T10:30:00Z',
  },
  {
    key: '2',
    paymentId: 'PAY-20250115-002',
    user: 'Nino Kapanadze',
    amount: 850,
    currency: 'GEL',
    gateway: 'TBC TPay',
    status: 'completed',
    bookingId: 'BK-2025-002',
    createdAt: '2025-01-15T11:15:00Z',
  },
  {
    key: '3',
    paymentId: 'PAY-20250114-003',
    user: 'David Tsiklauri',
    amount: 45,
    currency: 'GEL',
    gateway: 'BOG iPay',
    status: 'pending',
    bookingId: 'BK-2025-003',
    createdAt: '2025-01-14T09:00:00Z',
  },
  {
    key: '4',
    paymentId: 'PAY-20250114-004',
    user: 'Ana Lomidze',
    amount: 2500,
    currency: 'GEL',
    gateway: 'TBC TPay',
    status: 'completed',
    bookingId: 'BK-2025-004',
    createdAt: '2025-01-14T14:20:00Z',
  },
  {
    key: '5',
    paymentId: 'PAY-20250113-005',
    user: 'Tamari Javakhishvili',
    amount: 380,
    currency: 'GEL',
    gateway: 'BOG iPay',
    status: 'failed',
    bookingId: 'BK-2025-005',
    createdAt: '2025-01-13T16:45:00Z',
  },
  {
    key: '6',
    paymentId: 'PAY-20250112-006',
    user: 'Irakli Mgeladze',
    amount: 60,
    currency: 'GEL',
    gateway: 'mock',
    status: 'refunded',
    bookingId: 'BK-2025-006',
    createdAt: '2025-01-12T10:00:00Z',
  },
  {
    key: '7',
    paymentId: 'PAY-20250111-007',
    user: 'Mariam Kvaratskhelia',
    amount: 45,
    currency: 'GEL',
    gateway: 'TBC TPay',
    status: 'completed',
    bookingId: 'BK-2025-007',
    createdAt: '2025-01-11T08:30:00Z',
  },
  {
    key: '8',
    paymentId: 'PAY-20250110-008',
    user: 'Salome Kipiani',
    amount: 1200,
    currency: 'GEL',
    gateway: 'BOG iPay',
    status: 'completed',
    bookingId: 'BK-2025-008',
    createdAt: '2025-01-10T13:00:00Z',
  },
  {
    key: '9',
    paymentId: 'PAY-20250109-009',
    user: 'Nikoloz Basilashvili',
    amount: 280,
    currency: 'GEL',
    gateway: 'TBC TPay',
    status: 'failed',
    bookingId: 'BK-2025-009',
    createdAt: '2025-01-09T17:30:00Z',
  },
  {
    key: '10',
    paymentId: 'PAY-20250108-010',
    user: 'Lasha Gogichaishvili',
    amount: 650,
    currency: 'GEL',
    gateway: 'BOG iPay',
    status: 'refunded',
    bookingId: 'BK-2025-010',
    createdAt: '2025-01-08T11:45:00Z',
  },
  {
    key: '11',
    paymentId: 'PAY-20250107-011',
    user: 'Ketevan Datunashvili',
    amount: 30,
    currency: 'GEL',
    gateway: 'mock',
    status: 'completed',
    bookingId: 'BK-2025-011',
    createdAt: '2025-01-07T09:15:00Z',
  },
  {
    key: '12',
    paymentId: 'PAY-20250106-012',
    user: 'Zurab Menteshashvili',
    amount: 95,
    currency: 'GEL',
    gateway: 'TBC TPay',
    status: 'pending',
    bookingId: 'BK-2025-012',
    createdAt: '2025-01-06T15:00:00Z',
  },
];

// ─── Status Colors ─────────────────────────────────────────────────

const statusColors: Record<PaymentStatus, string> = {
  pending: 'orange',
  completed: 'green',
  failed: 'red',
  refunded: 'blue',
};

export default function PaymentsPage() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );
  const [gatewayFilter, setGatewayFilter] = useState<string | undefined>(
    undefined,
  );

  const filteredPayments = placeholderPayments.filter((payment) => {
    const matchesStatus = !statusFilter || payment.status === statusFilter;
    const matchesGateway = !gatewayFilter || payment.gateway === gatewayFilter;
    return matchesStatus && matchesGateway;
  });

  const completedCount = placeholderPayments.filter(
    (p) => p.status === 'completed',
  ).length;
  const refundedCount = placeholderPayments.filter(
    (p) => p.status === 'refunded',
  ).length;
  const failedCount = placeholderPayments.filter(
    (p) => p.status === 'failed',
  ).length;

  const totalAmount = placeholderPayments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const columns: ColumnsType<PaymentRow> = [
    {
      title: t('finance.paymentId'),
      dataIndex: 'paymentId',
      key: 'paymentId',
      width: 190,
      render: (id: string) => (
        <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{id}</span>
      ),
    },
    {
      title: t('finance.user'),
      dataIndex: 'user',
      key: 'user',
      width: 180,
    },
    {
      title: t('finance.amount'),
      key: 'amount',
      width: 130,
      align: 'right',
      render: (_, record) => (
        <span style={{ fontWeight: 500 }}>
          {record.amount.toLocaleString()} {record.currency}
        </span>
      ),
    },
    {
      title: t('finance.gateway'),
      dataIndex: 'gateway',
      key: 'gateway',
      width: 130,
      render: (gateway: PaymentGateway) => {
        const gatewayColors: Record<PaymentGateway, string> = {
          'BOG iPay': 'blue',
          'TBC TPay': 'cyan',
          mock: 'default',
        };
        return <Tag color={gatewayColors[gateway]}>{gateway}</Tag>;
      },
    },
    {
      title: t('finance.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: PaymentStatus) => (
        <Tag color={statusColors[status]}>{status}</Tag>
      ),
    },
    {
      title: t('finance.bookingId'),
      dataIndex: 'bookingId',
      key: 'bookingId',
      width: 150,
      render: (id: string) => (
        <span style={{ fontFamily: 'monospace', color: '#1677ff' }}>{id}</span>
      ),
    },
    {
      title: t('finance.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (date: string) =>
        new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('common.view')}>
            <Button type="text" size="small" icon={<EyeOutlined />} />
          </Tooltip>
          {record.status === 'completed' && (
            <Tooltip title={t('finance.refund')}>
              <Button
                type="text"
                size="small"
                danger
                icon={<RollbackOutlined />}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t('finance.paymentsTitle')} />

      {/* ─── Stat Cards ──────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('finance.totalPayments')}
              value={totalAmount}
              precision={0}
              prefix={<CreditCardOutlined style={{ color: '#1A1A2E' }} />}
              suffix={
                <span style={{ fontSize: 14 }}>
                  GEL
                  <span
                    style={{ fontSize: 12, color: '#52c41a', marginLeft: 8 }}
                  >
                    <ArrowUpOutlined /> 12%
                  </span>
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('finance.successful')}
              value={completedCount}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('finance.refunded')}
              value={refundedCount}
              prefix={<RollbackOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('finance.failed')}
              value={failedCount}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* ─── Filter Bar ──────────────────────────────────────────── */}
      <div className="filter-bar">
        <Select
          placeholder={t('finance.status')}
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
          style={{ width: 160 }}
          options={[
            { value: 'pending', label: 'Pending' },
            { value: 'completed', label: 'Completed' },
            { value: 'failed', label: 'Failed' },
            { value: 'refunded', label: 'Refunded' },
          ]}
        />
        <Select
          placeholder={t('finance.gateway')}
          value={gatewayFilter}
          onChange={setGatewayFilter}
          allowClear
          style={{ width: 160 }}
          options={[
            { value: 'BOG iPay', label: 'BOG iPay' },
            { value: 'TBC TPay', label: 'TBC TPay' },
            { value: 'mock', label: 'Mock' },
          ]}
        />
        <RangePicker
          placeholder={['Start Date', 'End Date']}
          style={{ width: 280 }}
          suffixIcon={<CalendarOutlined />}
        />
      </div>

      {/* ─── Payments Table ──────────────────────────────────────── */}
      <Table
        columns={columns}
        dataSource={filteredPayments}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} payments`,
        }}
        scroll={{ x: 1300 }}
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
