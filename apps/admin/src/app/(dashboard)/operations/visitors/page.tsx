'use client';

import React, { useState } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  Row,
  Col,
  Card,
  Statistic,
  Tooltip,
  DatePicker,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  LoginOutlined,
  LogoutOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '@/components/PageHeader';

// ─── Types ─────────────────────────────────────────────────────────

type VisitorStatus =
  | 'expected'
  | 'checked_in'
  | 'checked_out'
  | 'no_show'
  | 'cancelled';

interface VisitorRow {
  key: string;
  id: string;
  visitorName: string;
  host: string;
  location: string;
  expectedTime: string;
  status: VisitorStatus;
  purpose: string;
}

// ─── Placeholder Data ──────────────────────────────────────────────

const placeholderVisitors: VisitorRow[] = [
  {
    key: '1',
    id: 'vis-001',
    visitorName: 'Aleksandre Chikobava',
    host: 'Giorgi Beridze',
    location: 'Stamba (Vera)',
    expectedTime: '2025-01-20T09:00:00Z',
    status: 'checked_in',
    purpose: 'Business Meeting',
  },
  {
    key: '2',
    id: 'vis-002',
    visitorName: 'Sarah Johnson',
    host: 'Nino Kapanadze',
    location: 'Radio City (Vake)',
    expectedTime: '2025-01-20T10:30:00Z',
    status: 'expected',
    purpose: 'Client Presentation',
  },
  {
    key: '3',
    id: 'vis-003',
    visitorName: 'Tornike Gvenetadze',
    host: 'David Tsiklauri',
    location: 'Stamba (Vera)',
    expectedTime: '2025-01-20T11:00:00Z',
    status: 'expected',
    purpose: 'Interview',
  },
  {
    key: '4',
    id: 'vis-004',
    visitorName: 'Maria Schmidt',
    host: 'Ana Lomidze',
    location: 'Rooms Batumi',
    expectedTime: '2025-01-20T09:30:00Z',
    status: 'checked_out',
    purpose: 'Office Tour',
  },
  {
    key: '5',
    id: 'vis-005',
    visitorName: 'Luka Mgaloblishvili',
    host: 'Tamari Javakhishvili',
    location: 'Stamba (Vera)',
    expectedTime: '2025-01-20T14:00:00Z',
    status: 'expected',
    purpose: 'Contract Signing',
  },
  {
    key: '6',
    id: 'vis-006',
    visitorName: 'James Williams',
    host: 'Irakli Mgeladze',
    location: 'Radio City (Vake)',
    expectedTime: '2025-01-20T08:00:00Z',
    status: 'no_show',
    purpose: 'Partnership Discussion',
  },
  {
    key: '7',
    id: 'vis-007',
    visitorName: 'Natia Rurua',
    host: 'Salome Kipiani',
    location: 'Stamba (Vera)',
    expectedTime: '2025-01-20T13:00:00Z',
    status: 'cancelled',
    purpose: 'Workshop',
  },
  {
    key: '8',
    id: 'vis-008',
    visitorName: 'Dmitri Petrov',
    host: 'Nikoloz Basilashvili',
    location: 'Rooms Batumi',
    expectedTime: '2025-01-20T15:30:00Z',
    status: 'expected',
    purpose: 'Technical Consultation',
  },
];

// ─── Status Colors ─────────────────────────────────────────────────

const statusColors: Record<VisitorStatus, string> = {
  expected: 'blue',
  checked_in: 'green',
  checked_out: 'default',
  no_show: 'volcano',
  cancelled: 'red',
};

// ─── Page Component ────────────────────────────────────────────────

export default function VisitorsPage() {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [locationFilter, setLocationFilter] = useState<string | undefined>(
    undefined,
  );
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );

  // Compute stats
  const expectedToday = placeholderVisitors.length;
  const checkedIn = placeholderVisitors.filter(
    (v) => v.status === 'checked_in',
  ).length;
  const noShowsThisWeek = placeholderVisitors.filter(
    (v) => v.status === 'no_show',
  ).length;
  const noShowRate =
    expectedToday > 0
      ? ((noShowsThisWeek / expectedToday) * 100).toFixed(1)
      : '0';

  // Filter visitors
  const filteredVisitors = placeholderVisitors.filter((visitor) => {
    const matchesSearch =
      !searchText ||
      visitor.visitorName.toLowerCase().includes(searchText.toLowerCase());

    const matchesLocation =
      !locationFilter || visitor.location === locationFilter;
    const matchesStatus = !statusFilter || visitor.status === statusFilter;

    return matchesSearch && matchesLocation && matchesStatus;
  });

  const columns: ColumnsType<VisitorRow> = [
    {
      title: t('visitors.visitorName'),
      dataIndex: 'visitorName',
      key: 'visitorName',
      width: 200,
      render: (name: string) => (
        <Space>
          <UserOutlined style={{ color: '#8c8c8c' }} />
          <span style={{ fontWeight: 500 }}>{name}</span>
        </Space>
      ),
    },
    {
      title: t('visitors.host'),
      dataIndex: 'host',
      key: 'host',
      width: 180,
    },
    {
      title: t('visitors.location'),
      dataIndex: 'location',
      key: 'location',
      width: 160,
    },
    {
      title: t('visitors.expectedTime'),
      dataIndex: 'expectedTime',
      key: 'expectedTime',
      width: 140,
      render: (date: string) =>
        new Date(date).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
    },
    {
      title: t('visitors.status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: VisitorStatus) => (
        <Tag color={statusColors[status]}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: t('visitors.purpose'),
      dataIndex: 'purpose',
      key: 'purpose',
      width: 180,
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 140,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          {record.status === 'expected' && (
            <Tooltip title={t('visitors.checkIn')}>
              <Button
                type="primary"
                size="small"
                icon={<LoginOutlined />}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              >
                {t('visitors.checkIn')}
              </Button>
            </Tooltip>
          )}
          {record.status === 'checked_in' && (
            <Tooltip title={t('visitors.checkOut')}>
              <Button
                type="default"
                size="small"
                icon={<LogoutOutlined />}
              >
                {t('visitors.checkOut')}
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('visitors.title')}
        subtitle={t('visitors.subtitle')}
        actions={
          <Button type="primary" icon={<PlusOutlined />}>
            {t('visitors.inviteVisitor')}
          </Button>
        }
      />

      {/* ─── Stat Cards ──────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('visitors.expectedToday')}
              value={expectedToday}
              prefix={<ClockCircleOutlined style={{ color: '#1A1A2E' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('visitors.checkedIn')}
              value={checkedIn}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('visitors.noShowsThisWeek')}
              value={noShowsThisWeek}
              prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('visitors.noShowRate')}
              value={Number(noShowRate)}
              precision={1}
              suffix="%"
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* ─── Filter Bar ─────────────────────────────────────────── */}
      <div className="filter-bar">
        <Input
          placeholder={t('visitors.searchPlaceholder')}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 260 }}
          allowClear
        />
        <DatePicker
          placeholder={t('visitors.selectDate')}
          style={{ width: 160 }}
        />
        <Select
          placeholder={t('visitors.location')}
          value={locationFilter}
          onChange={setLocationFilter}
          allowClear
          style={{ width: 180 }}
          options={[
            { value: 'Stamba (Vera)', label: 'Stamba (Vera)' },
            { value: 'Radio City (Vake)', label: 'Radio City (Vake)' },
            { value: 'Rooms Batumi', label: 'Rooms Batumi' },
          ]}
        />
        <Select
          placeholder={t('visitors.status')}
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
          style={{ width: 160 }}
          options={[
            { value: 'expected', label: 'Expected' },
            { value: 'checked_in', label: 'Checked In' },
            { value: 'checked_out', label: 'Checked Out' },
            { value: 'no_show', label: 'No Show' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
        />
      </div>

      {/* ─── Visitors Table ──────────────────────────────────────── */}
      <Table
        columns={columns}
        dataSource={filteredVisitors}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} visitors`,
        }}
        scroll={{ x: 1200 }}
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
