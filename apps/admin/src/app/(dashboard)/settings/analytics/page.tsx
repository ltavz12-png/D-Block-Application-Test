'use client';

import React from 'react';
import {
  Table,
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Typography,
  Progress,
} from 'antd';
import {
  UserOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '@/components/PageHeader';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const { Text } = Typography;

// ─── Types ─────────────────────────────────────────────────────────

type EventCategory =
  | 'user'
  | 'booking'
  | 'payment'
  | 'access'
  | 'engagement'
  | 'system';

interface TopEvent {
  key: string;
  eventName: string;
  category: EventCategory;
  count: number;
  uniqueUsers: number;
  lastTriggered: string;
}

// ─── Placeholder Data ──────────────────────────────────────────────

const activeUsersData = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2024, 11, i + 1);
  const dayStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const base = 1400 + Math.round(Math.sin(i / 4) * 300 + Math.random() * 200);
  return { day: dayStr, users: base };
});

const platformData = [
  { name: 'iOS', value: 45 },
  { name: 'Android', value: 32 },
  { name: 'Web', value: 18 },
  { name: 'Admin', value: 5 },
];

const PLATFORM_COLORS = ['#1A1A2E', '#E94560', '#0088FE', '#faad14'];

const funnelSteps = [
  { label: 'appOpen', count: 5230, percent: 100, color: '#1890ff' },
  { label: 'signUp', count: 2100, percent: 40.2, color: '#13c2c2' },
  { label: 'firstBooking', count: 890, percent: 17.0, color: '#52c41a' },
  { label: 'firstPayment', count: 720, percent: 13.8, color: '#faad14' },
  { label: 'repeatBooking', count: 445, percent: 8.5, color: '#f5222d' },
];

const topEvents: TopEvent[] = [
  {
    key: '1',
    eventName: 'user.login',
    category: 'user',
    count: 8920,
    uniqueUsers: 3240,
    lastTriggered: '2024-12-20 14:58',
  },
  {
    key: '2',
    eventName: 'booking.viewed',
    category: 'booking',
    count: 5670,
    uniqueUsers: 2180,
    lastTriggered: '2024-12-20 14:55',
  },
  {
    key: '3',
    eventName: 'booking.created',
    category: 'booking',
    count: 2340,
    uniqueUsers: 1560,
    lastTriggered: '2024-12-20 14:52',
  },
  {
    key: '4',
    eventName: 'payment.completed',
    category: 'payment',
    count: 1890,
    uniqueUsers: 1340,
    lastTriggered: '2024-12-20 14:45',
  },
  {
    key: '5',
    eventName: 'user.signup',
    category: 'user',
    count: 1240,
    uniqueUsers: 1240,
    lastTriggered: '2024-12-20 14:40',
  },
  {
    key: '6',
    eventName: 'access.granted',
    category: 'access',
    count: 980,
    uniqueUsers: 720,
    lastTriggered: '2024-12-20 14:30',
  },
  {
    key: '7',
    eventName: 'booking.cancelled',
    category: 'booking',
    count: 450,
    uniqueUsers: 380,
    lastTriggered: '2024-12-20 13:20',
  },
  {
    key: '8',
    eventName: 'pass.purchased',
    category: 'payment',
    count: 380,
    uniqueUsers: 310,
    lastTriggered: '2024-12-20 12:15',
  },
  {
    key: '9',
    eventName: 'visitor.invited',
    category: 'engagement',
    count: 290,
    uniqueUsers: 210,
    lastTriggered: '2024-12-20 11:50',
  },
  {
    key: '10',
    eventName: 'resource.searched',
    category: 'engagement',
    count: 4120,
    uniqueUsers: 1890,
    lastTriggered: '2024-12-20 14:57',
  },
];

// ─── Category Color Map ────────────────────────────────────────────

const categoryColors: Record<EventCategory, string> = {
  user: 'blue',
  booking: 'green',
  payment: 'gold',
  access: 'purple',
  engagement: 'cyan',
  system: 'default',
};

export default function AnalyticsPage() {
  const { t } = useTranslation();

  const columns: ColumnsType<TopEvent> = [
    {
      title: t('analytics.eventName'),
      dataIndex: 'eventName',
      key: 'eventName',
      width: 200,
      render: (name: string) => (
        <Text code style={{ fontSize: 12 }}>
          {name}
        </Text>
      ),
    },
    {
      title: t('analytics.eventCategory'),
      dataIndex: 'category',
      key: 'category',
      width: 140,
      render: (category: EventCategory) => (
        <Tag color={categoryColors[category]}>
          {t(`analytics.categories.${category}`)}
        </Tag>
      ),
    },
    {
      title: t('analytics.eventCount'),
      dataIndex: 'count',
      key: 'count',
      width: 120,
      align: 'right',
      render: (count: number) => count.toLocaleString(),
    },
    {
      title: t('analytics.uniqueUsers'),
      dataIndex: 'uniqueUsers',
      key: 'uniqueUsers',
      width: 140,
      align: 'right',
      render: (count: number) => count.toLocaleString(),
    },
    {
      title: t('analytics.lastTriggered'),
      dataIndex: 'lastTriggered',
      key: 'lastTriggered',
      width: 160,
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('analytics.title')}
        subtitle={t('analytics.subtitle')}
      />

      {/* ─── Stat Cards ──────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('analytics.activeUsers7d')}
              value={1847}
              prefix={<UserOutlined style={{ color: '#1A1A2E' }} />}
              suffix={
                <Text
                  style={{ fontSize: 12, color: '#52c41a', marginLeft: 8 }}
                >
                  <ArrowUpOutlined /> 12.3%
                </Text>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('analytics.totalEvents')}
              value={45230}
              prefix={<ThunderboltOutlined style={{ color: '#E94560' }} />}
              groupSeparator=","
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('analytics.avgSessionDuration')}
              value="24m 35s"
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('analytics.conversionRate')}
              value={8.4}
              precision={1}
              prefix={<RiseOutlined style={{ color: '#52c41a' }} />}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      {/* ─── User Funnel ─────────────────────────────────────────── */}
      <Card
        title={t('analytics.userFunnel')}
        bordered={false}
        style={{ borderRadius: 12, marginBottom: 24 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {funnelSteps.map((step) => (
            <div key={step.label}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}
              >
                <Text strong>{t(`analytics.${step.label}`)}</Text>
                <Text type="secondary">
                  {step.count.toLocaleString()} ({step.percent}%)
                </Text>
              </div>
              <Progress
                percent={step.percent}
                strokeColor={step.color}
                showInfo={false}
                size="small"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* ─── Charts Row ──────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card
            title={t('analytics.activeUsersOverTime')}
            bordered={false}
            style={{ borderRadius: 12 }}
          >
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={activeUsersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#1A1A2E"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title={t('analytics.platformBreakdown')}
            bordered={false}
            style={{ borderRadius: 12 }}
          >
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {platformData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PLATFORM_COLORS[index % PLATFORM_COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* ─── Top Events Table ────────────────────────────────────── */}
      <Card
        title={t('analytics.topEvents')}
        bordered={false}
        style={{ borderRadius: 12, marginBottom: 24 }}
      >
        <Table
          columns={columns}
          dataSource={topEvents}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total}`,
          }}
          scroll={{ x: 800 }}
          size="middle"
          style={{
            borderRadius: 12,
            overflow: 'hidden',
          }}
        />
      </Card>

      {/* ─── GDPR Consent Card ───────────────────────────────────── */}
      <Card
        title={t('analytics.gdprConsent')}
        bordered={false}
        style={{ borderRadius: 12 }}
      >
        <Row gutter={[24, 24]} justify="center">
          <Col xs={24} sm={8} style={{ textAlign: 'center' }}>
            <Progress
              type="circle"
              percent={78}
              strokeColor="#1A1A2E"
              format={(percent) => `${percent}%`}
            />
            <div style={{ marginTop: 12 }}>
              <Text strong>{t('analytics.analyticsConsent')}</Text>
            </div>
          </Col>
          <Col xs={24} sm={8} style={{ textAlign: 'center' }}>
            <Progress
              type="circle"
              percent={45}
              strokeColor="#E94560"
              format={(percent) => `${percent}%`}
            />
            <div style={{ marginTop: 12 }}>
              <Text strong>{t('analytics.marketingConsent')}</Text>
            </div>
          </Col>
          <Col xs={24} sm={8} style={{ textAlign: 'center' }}>
            <Progress
              type="circle"
              percent={62}
              strokeColor="#faad14"
              format={(percent) => `${percent}%`}
            />
            <div style={{ marginTop: 12 }}>
              <Text strong>{t('analytics.personalizationConsent')}</Text>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
