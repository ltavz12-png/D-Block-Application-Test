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
} from 'antd';
import {
  ExportOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '@/components/PageHeader';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const { RangePicker } = DatePicker;

// ─── Types ─────────────────────────────────────────────────────────

type SourceType = 'booking' | 'pass' | 'contract';
type EntryType = 'recognition' | 'reversal' | 'adjustment';

interface RevenueEntry {
  key: string;
  date: string;
  description: string;
  sourceType: SourceType;
  amount: number;
  entryType: EntryType;
  period: string;
  location: string;
}

// ─── Placeholder Data ──────────────────────────────────────────────

const revenueTrendData = [
  { month: 'Jan', recognized: 38000, deferred: 12000 },
  { month: 'Feb', recognized: 42000, deferred: 14000 },
  { month: 'Mar', recognized: 47000, deferred: 11000 },
  { month: 'Apr', recognized: 44000, deferred: 15000 },
  { month: 'May', recognized: 52000, deferred: 13000 },
  { month: 'Jun', recognized: 58000, deferred: 16000 },
  { month: 'Jul', recognized: 63000, deferred: 18000 },
  { month: 'Aug', recognized: 56000, deferred: 14000 },
  { month: 'Sep', recognized: 68000, deferred: 19000 },
  { month: 'Oct', recognized: 72000, deferred: 21000 },
  { month: 'Nov', recognized: 66000, deferred: 17000 },
  { month: 'Dec', recognized: 78000, deferred: 22000 },
];

const revenueBySourceData = [
  { name: 'Bookings', value: 485000 },
  { name: 'Passes', value: 198000 },
  { name: 'Contracts', value: 321000 },
];

const PIE_COLORS = ['#1A1A2E', '#E94560', '#52c41a'];

const placeholderRevenue: RevenueEntry[] = [
  {
    key: '1',
    date: '2025-01-15',
    description: 'Meeting Room A - Giorgi Beridze',
    sourceType: 'booking',
    amount: 120,
    entryType: 'recognition',
    period: 'January 2025',
    location: 'Stamba (Vera)',
  },
  {
    key: '2',
    date: '2025-01-14',
    description: 'Monthly Fixed Desk - Nino Kapanadze',
    sourceType: 'contract',
    amount: 850,
    entryType: 'recognition',
    period: 'January 2025',
    location: 'Radio City (Vake)',
  },
  {
    key: '3',
    date: '2025-01-13',
    description: 'Day Pass - David Tsiklauri',
    sourceType: 'pass',
    amount: 45,
    entryType: 'recognition',
    period: 'January 2025',
    location: 'Stamba (Vera)',
  },
  {
    key: '4',
    date: '2025-01-12',
    description: 'Event Space Booking Reversal - Ana Lomidze',
    sourceType: 'booking',
    amount: -850,
    entryType: 'reversal',
    period: 'January 2025',
    location: 'Rooms Batumi',
  },
  {
    key: '5',
    date: '2025-01-11',
    description: '10-Day Pass - Tamari Javakhishvili',
    sourceType: 'pass',
    amount: 380,
    entryType: 'recognition',
    period: 'January 2025',
    location: 'Stamba (Vera)',
  },
  {
    key: '6',
    date: '2025-01-10',
    description: 'Private Office Contract - Irakli Mgeladze',
    sourceType: 'contract',
    amount: 2500,
    entryType: 'recognition',
    period: 'January 2025',
    location: 'Radio City (Vake)',
  },
  {
    key: '7',
    date: '2025-01-09',
    description: 'Price Adjustment - Mariam Kvaratskhelia',
    sourceType: 'booking',
    amount: -30,
    entryType: 'adjustment',
    period: 'January 2025',
    location: 'Stamba (Vera)',
  },
  {
    key: '8',
    date: '2025-01-08',
    description: 'Hot Desk Booking - Salome Kipiani',
    sourceType: 'booking',
    amount: 45,
    entryType: 'recognition',
    period: 'January 2025',
    location: 'Rooms Batumi',
  },
  {
    key: '9',
    date: '2025-01-07',
    description: 'Annual Contract - Nikoloz Basilashvili',
    sourceType: 'contract',
    amount: 9600,
    entryType: 'recognition',
    period: 'January 2025',
    location: 'Radio City (Vake)',
  },
  {
    key: '10',
    date: '2025-01-06',
    description: 'Weekend Pass - Lasha Gogichaishvili',
    sourceType: 'pass',
    amount: 65,
    entryType: 'recognition',
    period: 'January 2025',
    location: 'Stamba (Vera)',
  },
  {
    key: '11',
    date: '2025-01-05',
    description: 'Phone Booth Booking - Ketevan Datunashvili',
    sourceType: 'booking',
    amount: 30,
    entryType: 'recognition',
    period: 'January 2025',
    location: 'Rooms Batumi',
  },
  {
    key: '12',
    date: '2025-01-04',
    description: 'Contract Reversal - Zurab Menteshashvili',
    sourceType: 'contract',
    amount: -1200,
    entryType: 'reversal',
    period: 'January 2025',
    location: 'Radio City (Vake)',
  },
];

// ─── Status Colors ─────────────────────────────────────────────────

const sourceTypeColors: Record<SourceType, string> = {
  booking: 'blue',
  pass: 'purple',
  contract: 'cyan',
};

const entryTypeColors: Record<EntryType, string> = {
  recognition: 'green',
  reversal: 'red',
  adjustment: 'orange',
};

export default function RevenuePage() {
  const { t } = useTranslation();
  const [sourceFilter, setSourceFilter] = useState<string | undefined>(
    undefined,
  );
  const [locationFilter, setLocationFilter] = useState<string | undefined>(
    undefined,
  );
  const [entryTypeFilter, setEntryTypeFilter] = useState<string | undefined>(
    undefined,
  );

  const filteredRevenue = placeholderRevenue.filter((entry) => {
    const matchesSource = !sourceFilter || entry.sourceType === sourceFilter;
    const matchesLocation =
      !locationFilter || entry.location === locationFilter;
    const matchesEntryType =
      !entryTypeFilter || entry.entryType === entryTypeFilter;
    return matchesSource && matchesLocation && matchesEntryType;
  });

  const columns: ColumnsType<RevenueEntry> = [
    {
      title: t('finance.date'),
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) =>
        new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
    },
    {
      title: t('finance.description'),
      dataIndex: 'description',
      key: 'description',
      width: 280,
    },
    {
      title: t('finance.sourceType'),
      dataIndex: 'sourceType',
      key: 'sourceType',
      width: 120,
      render: (type: SourceType) => (
        <Tag color={sourceTypeColors[type]}>{type}</Tag>
      ),
    },
    {
      title: t('finance.amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      align: 'right',
      render: (amount: number) => (
        <span
          style={{
            fontWeight: 500,
            color: amount < 0 ? '#ff4d4f' : '#52c41a',
          }}
        >
          {amount < 0 ? '-' : ''}
          {Math.abs(amount).toLocaleString()} GEL
        </span>
      ),
    },
    {
      title: t('finance.entryType'),
      dataIndex: 'entryType',
      key: 'entryType',
      width: 130,
      render: (type: EntryType) => (
        <Tag color={entryTypeColors[type]}>{type}</Tag>
      ),
    },
    {
      title: t('finance.period'),
      dataIndex: 'period',
      key: 'period',
      width: 140,
    },
    {
      title: t('finance.location'),
      dataIndex: 'location',
      key: 'location',
      width: 160,
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('finance.revenueTitle')}
        actions={
          <Button type="primary" icon={<ExportOutlined />}>
            {t('finance.export')}
          </Button>
        }
      />

      {/* ─── Stat Cards ──────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('finance.totalRecognizedRevenue')}
              value={684000}
              precision={0}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              suffix="GEL"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('finance.deferredRevenue')}
              value={192000}
              precision={0}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              suffix="GEL"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('finance.revenueThisMonth')}
              value={78000}
              precision={0}
              prefix={<RiseOutlined style={{ color: '#1A1A2E' }} />}
              suffix={
                <span style={{ fontSize: 12, color: '#52c41a', marginLeft: 4 }}>
                  <ArrowUpOutlined /> 8.2%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('finance.dailyAverage')}
              value={2516}
              precision={0}
              prefix={<CalendarOutlined style={{ color: '#E94560' }} />}
              suffix="GEL"
            />
          </Card>
        </Col>
      </Row>

      {/* ─── Charts ──────────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            title={t('finance.revenueTrend')}
            bordered={false}
            style={{ borderRadius: 12 }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="recognized"
                  stroke="#1A1A2E"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Recognized (GEL)"
                />
                <Line
                  type="monotone"
                  dataKey="deferred"
                  stroke="#E94560"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Deferred (GEL)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={t('finance.revenueBySource')}
            bordered={false}
            style={{ borderRadius: 12 }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueBySourceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {revenueBySourceData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) =>
                    `${value.toLocaleString()} GEL`
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* ─── Filter Bar ──────────────────────────────────────────── */}
      <div className="filter-bar">
        <RangePicker
          placeholder={['Start Date', 'End Date']}
          style={{ width: 280 }}
          suffixIcon={<CalendarOutlined />}
        />
        <Select
          placeholder={t('finance.sourceType')}
          value={sourceFilter}
          onChange={setSourceFilter}
          allowClear
          style={{ width: 160 }}
          options={[
            { value: 'booking', label: 'Booking' },
            { value: 'pass', label: 'Pass' },
            { value: 'contract', label: 'Contract' },
          ]}
        />
        <Select
          placeholder={t('finance.location')}
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
          placeholder={t('finance.entryType')}
          value={entryTypeFilter}
          onChange={setEntryTypeFilter}
          allowClear
          style={{ width: 160 }}
          options={[
            { value: 'recognition', label: 'Recognition' },
            { value: 'reversal', label: 'Reversal' },
            { value: 'adjustment', label: 'Adjustment' },
          ]}
        />
      </div>

      {/* ─── Revenue Table ───────────────────────────────────────── */}
      <Table
        columns={columns}
        dataSource={filteredRevenue}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} entries`,
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
