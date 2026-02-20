'use client';

import React from 'react';
import {
  Row,
  Col,
  Card,
  Progress,
  Typography,
  Table,
  Tag,
  Space,
} from 'antd';
import {
  EnvironmentOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import PageHeader from '@/components/PageHeader';

const { Title, Text } = Typography;

// ─── Types ─────────────────────────────────────────────────────────

interface LocationOccupancy {
  name: string;
  shortName: string;
  totalCapacity: number;
  currentlyOccupied: number;
  available: number;
  occupancyPercent: number;
  color: string;
  breakdown: ResourceBreakdown[];
}

interface ResourceBreakdown {
  key: string;
  type: string;
  occupied: number;
  total: number;
}

// ─── Placeholder Data ──────────────────────────────────────────────

const locations: LocationOccupancy[] = [
  {
    name: 'Stamba (Vera)',
    shortName: 'Stamba',
    totalCapacity: 120,
    currentlyOccupied: 89,
    available: 31,
    occupancyPercent: 74.2,
    color: '#1A1A2E',
    breakdown: [
      { key: '1', type: 'Hot Desk', occupied: 32, total: 45 },
      { key: '2', type: 'Meeting Room', occupied: 6, total: 8 },
      { key: '3', type: 'Office', occupied: 14, total: 18 },
      { key: '4', type: 'Box', occupied: 37, total: 49 },
    ],
  },
  {
    name: 'Radio City (Vake)',
    shortName: 'Radio City',
    totalCapacity: 85,
    currentlyOccupied: 68,
    available: 17,
    occupancyPercent: 80.0,
    color: '#E94560',
    breakdown: [
      { key: '1', type: 'Hot Desk', occupied: 28, total: 35 },
      { key: '2', type: 'Meeting Room', occupied: 4, total: 5 },
      { key: '3', type: 'Office', occupied: 10, total: 12 },
      { key: '4', type: 'Box', occupied: 26, total: 33 },
    ],
  },
  {
    name: 'Rooms Batumi',
    shortName: 'Batumi',
    totalCapacity: 60,
    currentlyOccupied: 31,
    available: 29,
    occupancyPercent: 51.7,
    color: '#0F3460',
    breakdown: [
      { key: '1', type: 'Hot Desk', occupied: 12, total: 25 },
      { key: '2', type: 'Meeting Room', occupied: 2, total: 4 },
      { key: '3', type: 'Office', occupied: 6, total: 10 },
      { key: '4', type: 'Box', occupied: 11, total: 21 },
    ],
  },
];

// ─── Occupancy Trend Data (Last 7 days, hourly averages) ───────────

const occupancyTrendData = [
  { time: '08:00', stamba: 25, radioCity: 18, batumi: 10 },
  { time: '09:00', stamba: 52, radioCity: 42, batumi: 18 },
  { time: '10:00', stamba: 78, radioCity: 60, batumi: 25 },
  { time: '11:00', stamba: 92, radioCity: 72, batumi: 32 },
  { time: '12:00', stamba: 85, radioCity: 68, batumi: 30 },
  { time: '13:00', stamba: 70, radioCity: 55, batumi: 22 },
  { time: '14:00', stamba: 88, radioCity: 70, batumi: 28 },
  { time: '15:00', stamba: 95, radioCity: 75, batumi: 35 },
  { time: '16:00', stamba: 90, radioCity: 72, batumi: 30 },
  { time: '17:00', stamba: 65, radioCity: 50, batumi: 20 },
  { time: '18:00', stamba: 40, radioCity: 30, batumi: 12 },
  { time: '19:00', stamba: 20, radioCity: 15, batumi: 8 },
];

const breakdownColumns = [
  {
    title: 'Resource Type',
    dataIndex: 'type',
    key: 'type',
    width: 120,
  },
  {
    title: 'Occupied',
    dataIndex: 'occupied',
    key: 'occupied',
    width: 80,
    align: 'center' as const,
  },
  {
    title: 'Total',
    dataIndex: 'total',
    key: 'total',
    width: 70,
    align: 'center' as const,
  },
  {
    title: 'Usage',
    key: 'usage',
    width: 120,
    render: (_: unknown, record: ResourceBreakdown) => {
      const percent = Math.round((record.occupied / record.total) * 100);
      let color = '#52c41a';
      if (percent >= 90) color = '#ff4d4f';
      else if (percent >= 70) color = '#faad14';
      return (
        <Progress
          percent={percent}
          size="small"
          strokeColor={color}
          style={{ marginBottom: 0 }}
        />
      );
    },
  },
];

// ─── Page Component ────────────────────────────────────────────────

export default function OccupancyPage() {
  const { t } = useTranslation();

  // Calculate overall stats
  const totalCapacity = locations.reduce((s, l) => s + l.totalCapacity, 0);
  const totalOccupied = locations.reduce(
    (s, l) => s + l.currentlyOccupied,
    0,
  );
  const overallPercent = Math.round((totalOccupied / totalCapacity) * 100);

  return (
    <div>
      <PageHeader
        title={t('occupancy.title')}
        subtitle={t('occupancy.subtitle')}
      />

      {/* ─── Overall Summary ─────────────────────────────────────── */}
      <Card
        bordered={false}
        style={{ borderRadius: 12, marginBottom: 24 }}
      >
        <Row align="middle" gutter={24}>
          <Col>
            <Progress
              type="dashboard"
              percent={overallPercent}
              strokeColor={
                overallPercent >= 80
                  ? '#ff4d4f'
                  : overallPercent >= 60
                    ? '#faad14'
                    : '#52c41a'
              }
              format={(p) => `${p}%`}
              size={100}
            />
          </Col>
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              {t('occupancy.overallOccupancy')}
            </Title>
            <Text type="secondary">
              {totalOccupied} / {totalCapacity}{' '}
              {t('occupancy.spacesOccupied')}
            </Text>
          </Col>
          <Col flex="auto" />
          <Col>
            <Tag
              icon={<ThunderboltOutlined />}
              color="orange"
              style={{ padding: '4px 12px', fontSize: 13 }}
            >
              {t('occupancy.peakHours')}: 11:00 - 15:00
            </Tag>
          </Col>
        </Row>
      </Card>

      {/* ─── Location Cards ──────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {locations.map((location) => (
          <Col xs={24} lg={8} key={location.name}>
            <Card
              bordered={false}
              style={{ borderRadius: 12 }}
              title={
                <Space>
                  <EnvironmentOutlined style={{ color: location.color }} />
                  <span>{location.name}</span>
                </Space>
              }
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Progress
                  type="circle"
                  percent={location.occupancyPercent}
                  strokeColor={location.color}
                  format={(p) => (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>
                        {p}%
                      </div>
                      <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                        {t('occupancy.occupied')}
                      </div>
                    </div>
                  )}
                  size={100}
                />
              </div>

              <Row gutter={8} style={{ textAlign: 'center', marginBottom: 16 }}>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('occupancy.capacity')}
                  </Text>
                  <div style={{ fontWeight: 600 }}>
                    {location.totalCapacity}
                  </div>
                </Col>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('occupancy.occupied')}
                  </Text>
                  <div style={{ fontWeight: 600, color: location.color }}>
                    {location.currentlyOccupied}
                  </div>
                </Col>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('occupancy.available')}
                  </Text>
                  <div style={{ fontWeight: 600, color: '#52c41a' }}>
                    {location.available}
                  </div>
                </Col>
              </Row>

              {/* Resource Breakdown Mini-table */}
              <Table
                columns={breakdownColumns}
                dataSource={location.breakdown}
                pagination={false}
                size="small"
                bordered
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* ─── Occupancy Trend Chart ───────────────────────────────── */}
      <Card
        title={t('occupancy.occupancyTrend')}
        bordered={false}
        style={{ borderRadius: 12 }}
        extra={
          <Text type="secondary">{t('occupancy.last7DaysAvg')}</Text>
        }
      >
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={occupancyTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              label={{
                value: t('occupancy.occupancyPercent'),
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12 },
              }}
            />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="stamba"
              stroke="#1A1A2E"
              fill="#1A1A2E"
              fillOpacity={0.15}
              strokeWidth={2}
              name="Stamba (Vera)"
            />
            <Area
              type="monotone"
              dataKey="radioCity"
              stroke="#E94560"
              fill="#E94560"
              fillOpacity={0.15}
              strokeWidth={2}
              name="Radio City (Vake)"
            />
            <Area
              type="monotone"
              dataKey="batumi"
              stroke="#0F3460"
              fill="#0F3460"
              fillOpacity={0.15}
              strokeWidth={2}
              name="Rooms Batumi"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
