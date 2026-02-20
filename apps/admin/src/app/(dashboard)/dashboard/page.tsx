'use client';

import React from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Typography } from 'antd';
import {
  TeamOutlined,
  CalendarOutlined,
  DollarOutlined,
  RiseOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useAuthStore } from '@/store/auth.store';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

// ─── Placeholder Data ──────────────────────────────────────────────

const revenueData = [
  { month: 'Jan', revenue: 42000, bookings: 320 },
  { month: 'Feb', revenue: 48000, bookings: 380 },
  { month: 'Mar', revenue: 55000, bookings: 420 },
  { month: 'Apr', revenue: 51000, bookings: 390 },
  { month: 'May', revenue: 62000, bookings: 450 },
  { month: 'Jun', revenue: 68000, bookings: 510 },
  { month: 'Jul', revenue: 72000, bookings: 540 },
  { month: 'Aug', revenue: 65000, bookings: 480 },
  { month: 'Sep', revenue: 78000, bookings: 590 },
  { month: 'Oct', revenue: 82000, bookings: 620 },
  { month: 'Nov', revenue: 76000, bookings: 570 },
  { month: 'Dec', revenue: 89000, bookings: 650 },
];

const locationData = [
  { location: 'Vera', bookings: 245, revenue: 32000 },
  { location: 'Vake', bookings: 198, revenue: 27000 },
  { location: 'Saburtalo', bookings: 167, revenue: 21000 },
  { location: 'Old Tbilisi', bookings: 134, revenue: 18000 },
];

interface RecentBooking {
  key: string;
  id: string;
  user: string;
  resource: string;
  location: string;
  date: string;
  status: string;
  amount: string;
}

const recentBookings: RecentBooking[] = [
  {
    key: '1',
    id: 'BK-001',
    user: 'Giorgi Beridze',
    resource: 'Meeting Room A',
    location: 'Vera',
    date: '2024-12-20 10:00',
    status: 'confirmed',
    amount: '120 GEL',
  },
  {
    key: '2',
    id: 'BK-002',
    user: 'Nino Kapanadze',
    resource: 'Hot Desk #12',
    location: 'Vake',
    date: '2024-12-20 09:00',
    status: 'checked_in',
    amount: '45 GEL',
  },
  {
    key: '3',
    id: 'BK-003',
    user: 'David Tsiklauri',
    resource: 'Office Box 3',
    location: 'Saburtalo',
    date: '2024-12-20 14:00',
    status: 'held',
    amount: '280 GEL',
  },
  {
    key: '4',
    id: 'BK-004',
    user: 'Ana Lomidze',
    resource: 'Phone Booth 2',
    location: 'Vera',
    date: '2024-12-20 11:30',
    status: 'confirmed',
    amount: '30 GEL',
  },
  {
    key: '5',
    id: 'BK-005',
    user: 'Lasha Gogichaishvili',
    resource: 'Event Space',
    location: 'Old Tbilisi',
    date: '2024-12-21 18:00',
    status: 'confirmed',
    amount: '850 GEL',
  },
];

const statusColors: Record<string, string> = {
  confirmed: 'green',
  checked_in: 'blue',
  held: 'orange',
  completed: 'default',
  cancelled: 'red',
  no_show: 'volcano',
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const columns: ColumnsType<RecentBooking> = [
    { title: t('bookings.id'), dataIndex: 'id', key: 'id', width: 100 },
    { title: t('bookings.user'), dataIndex: 'user', key: 'user' },
    { title: t('bookings.resource'), dataIndex: 'resource', key: 'resource' },
    { title: t('bookings.location'), dataIndex: 'location', key: 'location' },
    {
      title: t('bookings.startTime'),
      dataIndex: 'date',
      key: 'date',
      width: 160,
    },
    {
      title: t('bookings.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {t(`bookings.statuses.${status}`)}
        </Tag>
      ),
    },
    {
      title: t('bookings.total'),
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      align: 'right',
    },
  ];

  return (
    <div>
      {/* ─── Welcome Header ──────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          {t('dashboard.welcome')}, {user?.firstName}!
        </Title>
        <Text type="secondary">{t('dashboard.overview')}</Text>
      </div>

      {/* ─── Stat Cards ──────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('dashboard.totalUsers')}
              value={2847}
              prefix={<TeamOutlined style={{ color: '#1A1A2E' }} />}
              suffix={
                <Text
                  style={{ fontSize: 12, color: '#52c41a', marginLeft: 8 }}
                >
                  <ArrowUpOutlined /> 12%
                </Text>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('dashboard.totalBookings')}
              value={6520}
              prefix={<CalendarOutlined style={{ color: '#E94560' }} />}
              suffix={
                <Text
                  style={{ fontSize: 12, color: '#52c41a', marginLeft: 8 }}
                >
                  <ArrowUpOutlined /> 8%
                </Text>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('dashboard.revenue')}
              value={89000}
              precision={0}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              suffix="GEL"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('dashboard.occupancy')}
              value={73.5}
              precision={1}
              prefix={<RiseOutlined style={{ color: '#faad14' }} />}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      {/* ─── Charts ──────────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card
            title={t('dashboard.revenueTrend')}
            bordered={false}
            style={{ borderRadius: 12 }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1A1A2E"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Revenue (GEL)"
                />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="#E94560"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Bookings"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title={t('dashboard.bookingsByLocation')}
            bordered={false}
            style={{ borderRadius: 12 }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={locationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="location" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar
                  dataKey="bookings"
                  fill="#1A1A2E"
                  radius={[4, 4, 0, 0]}
                  name="Bookings"
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* ─── Recent Bookings Table ───────────────────────────────── */}
      <Card
        title={t('dashboard.recentBookings')}
        bordered={false}
        style={{ borderRadius: 12 }}
      >
        <Table
          columns={columns}
          dataSource={recentBookings}
          pagination={false}
          size="middle"
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
}
