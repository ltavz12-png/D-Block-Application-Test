'use client';

import React from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Typography, Spin } from 'antd';
import {
  TeamOutlined,
  CalendarOutlined,
  DollarOutlined,
  RiseOutlined,
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
import {
  useDashboardStats,
  useDashboardRecentBookings,
  useDashboardBookingsByLocation,
} from '@/lib/api-hooks';

const { Title, Text } = Typography;

// Static chart data (revenue trend doesn't have a dedicated endpoint yet)
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

const statusColors: Record<string, string> = {
  confirmed: 'green',
  checked_in: 'blue',
  held: 'orange',
  completed: 'default',
  cancelled: 'red',
  no_show: 'volcano',
};

interface RecentBookingRow {
  key: string;
  id: string;
  user: string;
  resource: string;
  location: string;
  date: string;
  status: string;
  amount: string;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentBookingsRaw, isLoading: bookingsLoading } =
    useDashboardRecentBookings(5);
  const { data: bookingsByLocation } = useDashboardBookingsByLocation();

  const recentBookings: RecentBookingRow[] = (recentBookingsRaw ?? []).map(
    (b, i) => ({
      key: String(i),
      id: b.id.substring(0, 8),
      user: `${b.user?.firstName ?? ''} ${b.user?.lastName ?? ''}`.trim() || '-',
      resource: b.resource?.name ?? '-',
      location: b.resource?.location?.name ?? '-',
      date: new Date(b.startTime).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: b.status,
      amount: `${b.totalAmount} ${b.currency}`,
    }),
  );

  const locationData = (bookingsByLocation ?? []).map((bl) => ({
    location: bl.locationName,
    bookings: bl.count,
  }));

  const columns: ColumnsType<RecentBookingRow> = [
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
          {t(`bookings.statuses.${status}`, status)}
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
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          {t('dashboard.welcome')}, {user?.firstName}!
        </Title>
        <Text type="secondary">{t('dashboard.overview')}</Text>
      </div>

      <Spin spinning={statsLoading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card" bordered={false}>
              <Statistic
                title={t('dashboard.totalUsers')}
                value={stats?.totalUsers ?? 0}
                prefix={<TeamOutlined style={{ color: '#1A1A2E' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card" bordered={false}>
              <Statistic
                title={t('dashboard.totalBookings')}
                value={stats?.totalBookings ?? 0}
                prefix={<CalendarOutlined style={{ color: '#E94560' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card" bordered={false}>
              <Statistic
                title={t('dashboard.revenue')}
                value={stats?.totalRevenue ?? 0}
                precision={0}
                prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                suffix="GEL"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card" bordered={false}>
              <Statistic
                title={t('dashboard.totalResources')}
                value={stats?.totalResources ?? 0}
                prefix={<RiseOutlined style={{ color: '#faad14' }} />}
              />
            </Card>
          </Col>
        </Row>
      </Spin>

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

      <Card
        title={t('dashboard.recentBookings')}
        bordered={false}
        style={{ borderRadius: 12 }}
      >
        <Table
          columns={columns}
          dataSource={recentBookings}
          loading={bookingsLoading}
          pagination={false}
          size="middle"
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
}
