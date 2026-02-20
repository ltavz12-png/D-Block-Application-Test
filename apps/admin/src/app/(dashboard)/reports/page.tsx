'use client';

import React, { useState } from 'react';
import {
  Tabs,
  Card,
  Row,
  Col,
  Button,
  DatePicker,
  Select,
  Space,
  Typography,
  Table,
  Tag,
  Dropdown,
  Statistic,
  Divider,
} from 'antd';
import type { MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  DollarOutlined,
  CalendarOutlined,
  AuditOutlined,
  BarChartOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  BankOutlined,
  EnvironmentOutlined,
  AppstoreOutlined,
  FundOutlined,
  HeatMapOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import PageHeader from '@/components/PageHeader';

const { RangePicker } = DatePicker;
const { Text } = Typography;

// ─── Placeholder Data ───────────────────────────────────────────────

const monthlyRevenueData = [
  { month: 'Jan', revenue: 42000, target: 45000 },
  { month: 'Feb', revenue: 48000, target: 45000 },
  { month: 'Mar', revenue: 55000, target: 50000 },
  { month: 'Apr', revenue: 51000, target: 50000 },
  { month: 'May', revenue: 62000, target: 55000 },
  { month: 'Jun', revenue: 68000, target: 60000 },
  { month: 'Jul', revenue: 72000, target: 65000 },
  { month: 'Aug', revenue: 65000, target: 65000 },
  { month: 'Sep', revenue: 78000, target: 70000 },
  { month: 'Oct', revenue: 82000, target: 75000 },
  { month: 'Nov', revenue: 76000, target: 75000 },
  { month: 'Dec', revenue: 89000, target: 80000 },
];

const revenueByLocationData = [
  { location: 'Vera', revenue: 324000, percentage: 35 },
  { location: 'Vake', revenue: 258000, percentage: 28 },
  { location: 'Saburtalo', revenue: 198000, percentage: 22 },
  { location: 'Old Tbilisi', revenue: 138000, percentage: 15 },
];

const revenueByProductData = [
  { name: 'Meeting Rooms', value: 285000, color: '#1A1A2E' },
  { name: 'Hot Desks', value: 198000, color: '#E94560' },
  { name: 'Fixed Desks', value: 156000, color: '#0F3460' },
  { name: 'Office Boxes', value: 134000, color: '#16213E' },
  { name: 'Parking', value: 72000, color: '#533483' },
  { name: 'Events', value: 68000, color: '#E94560' },
  { name: 'Other', value: 45000, color: '#bfbfbf' },
];

const bookingVolumeData = [
  { month: 'Jan', bookings: 320, cancellations: 28 },
  { month: 'Feb', bookings: 380, cancellations: 32 },
  { month: 'Mar', bookings: 420, cancellations: 35 },
  { month: 'Apr', bookings: 390, cancellations: 30 },
  { month: 'May', bookings: 450, cancellations: 38 },
  { month: 'Jun', bookings: 510, cancellations: 42 },
  { month: 'Jul', bookings: 540, cancellations: 45 },
  { month: 'Aug', bookings: 480, cancellations: 40 },
  { month: 'Sep', bookings: 590, cancellations: 48 },
  { month: 'Oct', bookings: 620, cancellations: 52 },
  { month: 'Nov', bookings: 570, cancellations: 47 },
  { month: 'Dec', bookings: 650, cancellations: 55 },
];

const utilizationData = [
  { resource: 'Meeting Rooms', utilization: 78, capacity: 100 },
  { resource: 'Hot Desks', utilization: 65, capacity: 100 },
  { resource: 'Fixed Desks', utilization: 92, capacity: 100 },
  { resource: 'Office Boxes', utilization: 88, capacity: 100 },
  { resource: 'Phone Booths', utilization: 54, capacity: 100 },
  { resource: 'Event Space', utilization: 42, capacity: 100 },
  { resource: 'Parking', utilization: 71, capacity: 100 },
];

const peakHoursData = [
  { hour: '08:00', bookings: 12 },
  { hour: '09:00', bookings: 45 },
  { hour: '10:00', bookings: 68 },
  { hour: '11:00', bookings: 72 },
  { hour: '12:00', bookings: 38 },
  { hour: '13:00', bookings: 42 },
  { hour: '14:00', bookings: 65 },
  { hour: '15:00', bookings: 58 },
  { hour: '16:00', bookings: 48 },
  { hour: '17:00', bookings: 32 },
  { hour: '18:00', bookings: 18 },
  { hour: '19:00', bookings: 8 },
];

interface InvoiceAgingRow {
  key: string;
  range: string;
  count: number;
  amount: number;
  percentage: number;
}

const invoiceAgingData: InvoiceAgingRow[] = [
  { key: '1', range: '0-30 days', count: 24, amount: 45200, percentage: 38 },
  { key: '2', range: '31-60 days', count: 12, amount: 28400, percentage: 24 },
  { key: '3', range: '61-90 days', count: 8, amount: 18600, percentage: 16 },
  { key: '4', range: '91-120 days', count: 5, amount: 14200, percentage: 12 },
  { key: '5', range: '120+ days', count: 4, amount: 12300, percentage: 10 },
];

interface PaymentSummaryRow {
  key: string;
  method: string;
  transactions: number;
  amount: number;
  percentage: number;
}

const paymentSummaryData: PaymentSummaryRow[] = [
  { key: '1', method: 'BOG Card', transactions: 1245, amount: 456200, percentage: 48 },
  { key: '2', method: 'TBC Card', transactions: 856, amount: 312800, percentage: 33 },
  { key: '3', method: 'Bank Transfer', transactions: 124, amount: 98400, percentage: 10 },
  { key: '4', method: 'Apple Pay', transactions: 89, amount: 52600, percentage: 6 },
  { key: '5', method: 'Google Pay', transactions: 46, amount: 28200, percentage: 3 },
];

const occupancyTrendData = [
  { month: 'Jan', vera: 72, vake: 65, saburtalo: 58, oldTbilisi: 45 },
  { month: 'Feb', vera: 75, vake: 68, saburtalo: 61, oldTbilisi: 48 },
  { month: 'Mar', vera: 78, vake: 72, saburtalo: 65, oldTbilisi: 52 },
  { month: 'Apr', vera: 74, vake: 69, saburtalo: 62, oldTbilisi: 49 },
  { month: 'May', vera: 82, vake: 75, saburtalo: 68, oldTbilisi: 55 },
  { month: 'Jun', vera: 85, vake: 78, saburtalo: 72, oldTbilisi: 58 },
  { month: 'Jul', vera: 88, vake: 80, saburtalo: 74, oldTbilisi: 60 },
  { month: 'Aug', vera: 82, vake: 76, saburtalo: 70, oldTbilisi: 56 },
  { month: 'Sep', vera: 90, vake: 83, saburtalo: 76, oldTbilisi: 62 },
  { month: 'Oct', vera: 92, vake: 85, saburtalo: 78, oldTbilisi: 65 },
  { month: 'Nov', vera: 87, vake: 80, saburtalo: 74, oldTbilisi: 60 },
  { month: 'Dec', vera: 94, vake: 88, saburtalo: 82, oldTbilisi: 68 },
];

interface VisitorStatsRow {
  key: string;
  location: string;
  totalVisitors: number;
  avgDaily: number;
  checkedIn: number;
  noShows: number;
  noShowRate: string;
}

const visitorStatsData: VisitorStatsRow[] = [
  { key: '1', location: 'Vera', totalVisitors: 1240, avgDaily: 41, checkedIn: 1180, noShows: 60, noShowRate: '4.8%' },
  { key: '2', location: 'Vake', totalVisitors: 980, avgDaily: 33, checkedIn: 940, noShows: 40, noShowRate: '4.1%' },
  { key: '3', location: 'Saburtalo', totalVisitors: 720, avgDaily: 24, checkedIn: 685, noShows: 35, noShowRate: '4.9%' },
  { key: '4', location: 'Old Tbilisi', totalVisitors: 540, avgDaily: 18, checkedIn: 520, noShows: 20, noShowRate: '3.7%' },
];

interface AccessLogSummaryRow {
  key: string;
  location: string;
  totalAccesses: number;
  granted: number;
  denied: number;
  uniqueUsers: number;
  peakHour: string;
}

const accessLogSummaryData: AccessLogSummaryRow[] = [
  { key: '1', location: 'Vera', totalAccesses: 8450, granted: 8320, denied: 130, uniqueUsers: 342, peakHour: '09:00-10:00' },
  { key: '2', location: 'Vake', totalAccesses: 6280, granted: 6190, denied: 90, uniqueUsers: 278, peakHour: '09:00-10:00' },
  { key: '3', location: 'Saburtalo', totalAccesses: 4560, granted: 4480, denied: 80, uniqueUsers: 198, peakHour: '10:00-11:00' },
  { key: '4', location: 'Old Tbilisi', totalAccesses: 3120, granted: 3080, denied: 40, uniqueUsers: 145, peakHour: '09:00-10:00' },
];

// ─── Export Dropdown Items ──────────────────────────────────────────

const exportMenuItems: MenuProps['items'] = [
  {
    key: 'excel',
    icon: <FileExcelOutlined style={{ color: '#217346' }} />,
    label: 'Export as Excel',
  },
  {
    key: 'pdf',
    icon: <FilePdfOutlined style={{ color: '#FF4D4F' }} />,
    label: 'Export as PDF',
  },
  {
    key: 'csv',
    icon: <FileTextOutlined style={{ color: '#1677ff' }} />,
    label: 'Export as CSV',
  },
];

// ─── Report Card Component ──────────────────────────────────────────

interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  extra?: React.ReactNode;
}

function ReportCard({ title, description, icon, children, extra }: ReportCardProps) {
  return (
    <Card
      bordered={false}
      style={{ borderRadius: 12, height: '100%' }}
      title={
        <Space>
          {icon}
          <span>{title}</span>
        </Space>
      }
      extra={
        extra || (
          <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
            <Button icon={<DownloadOutlined />} size="small">
              Export
            </Button>
          </Dropdown>
        )
      }
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
        {description}
      </Text>
      {children}
    </Card>
  );
}

// ─── Report Page Component ──────────────────────────────────────────

export default function ReportsPage() {
  const { t } = useTranslation();
  const [locationFilter, setLocationFilter] = useState<string | undefined>(undefined);

  // ─── Invoice Aging Columns ──────────────────────────────────────

  const invoiceAgingColumns: ColumnsType<InvoiceAgingRow> = [
    { title: 'Aging Range', dataIndex: 'range', key: 'range', width: 140 },
    { title: 'Count', dataIndex: 'count', key: 'count', width: 80, align: 'right' },
    {
      title: 'Amount (GEL)',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      align: 'right',
      render: (v: number) => v.toLocaleString(),
    },
    {
      title: '% of Total',
      dataIndex: 'percentage',
      key: 'percentage',
      width: 100,
      align: 'right',
      render: (v: number) => (
        <Tag color={v > 15 ? 'red' : v > 10 ? 'orange' : 'green'}>{v}%</Tag>
      ),
    },
  ];

  // ─── Payment Summary Columns ────────────────────────────────────

  const paymentSummaryColumns: ColumnsType<PaymentSummaryRow> = [
    { title: 'Payment Method', dataIndex: 'method', key: 'method', width: 150 },
    {
      title: 'Transactions',
      dataIndex: 'transactions',
      key: 'transactions',
      width: 120,
      align: 'right',
      render: (v: number) => v.toLocaleString(),
    },
    {
      title: 'Amount (GEL)',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      align: 'right',
      render: (v: number) => v.toLocaleString(),
    },
    {
      title: '% of Total',
      dataIndex: 'percentage',
      key: 'percentage',
      width: 100,
      align: 'right',
      render: (v: number) => `${v}%`,
    },
  ];

  // ─── Visitor Stats Columns ──────────────────────────────────────

  const visitorStatsColumns: ColumnsType<VisitorStatsRow> = [
    { title: 'Location', dataIndex: 'location', key: 'location', width: 140 },
    {
      title: 'Total Visitors',
      dataIndex: 'totalVisitors',
      key: 'totalVisitors',
      width: 120,
      align: 'right',
      render: (v: number) => v.toLocaleString(),
    },
    { title: 'Avg / Day', dataIndex: 'avgDaily', key: 'avgDaily', width: 100, align: 'right' },
    {
      title: 'Checked In',
      dataIndex: 'checkedIn',
      key: 'checkedIn',
      width: 110,
      align: 'right',
      render: (v: number) => v.toLocaleString(),
    },
    { title: 'No Shows', dataIndex: 'noShows', key: 'noShows', width: 100, align: 'right' },
    {
      title: 'No Show Rate',
      dataIndex: 'noShowRate',
      key: 'noShowRate',
      width: 110,
      align: 'right',
      render: (v: string) => <Tag color="orange">{v}</Tag>,
    },
  ];

  // ─── Access Log Summary Columns ─────────────────────────────────

  const accessLogColumns: ColumnsType<AccessLogSummaryRow> = [
    { title: 'Location', dataIndex: 'location', key: 'location', width: 140 },
    {
      title: 'Total Accesses',
      dataIndex: 'totalAccesses',
      key: 'totalAccesses',
      width: 130,
      align: 'right',
      render: (v: number) => v.toLocaleString(),
    },
    {
      title: 'Granted',
      dataIndex: 'granted',
      key: 'granted',
      width: 100,
      align: 'right',
      render: (v: number) => <span style={{ color: '#52c41a' }}>{v.toLocaleString()}</span>,
    },
    {
      title: 'Denied',
      dataIndex: 'denied',
      key: 'denied',
      width: 100,
      align: 'right',
      render: (v: number) => <span style={{ color: '#ff4d4f' }}>{v}</span>,
    },
    {
      title: 'Unique Users',
      dataIndex: 'uniqueUsers',
      key: 'uniqueUsers',
      width: 120,
      align: 'right',
    },
    { title: 'Peak Hour', dataIndex: 'peakHour', key: 'peakHour', width: 130 },
  ];

  // ─── Tab: Revenue Reports ───────────────────────────────────────

  const revenueTab = (
    <Row gutter={[16, 16]}>
      {/* Monthly Revenue Summary */}
      <Col xs={24}>
        <ReportCard
          title={t('reports.monthlyRevenue')}
          description="Monthly revenue performance against targets. Shows actual collected revenue and planned targets for each month."
          icon={<DollarOutlined style={{ color: '#52c41a' }} />}
        >
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Statistic title="YTD Revenue" value={788000} prefix="GEL" />
            </Col>
            <Col span={6}>
              <Statistic title="YTD Target" value={695000} prefix="GEL" />
            </Col>
            <Col span={6}>
              <Statistic
                title="Achievement"
                value={113.4}
                suffix="%"
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic title="Avg Monthly" value={65667} prefix="GEL" />
            </Col>
          </Row>
          <Divider style={{ margin: '8px 0 16px' }} />
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#1A1A2E" radius={[4, 4, 0, 0]} name="Revenue (GEL)" />
              <Bar dataKey="target" fill="#E94560" radius={[4, 4, 0, 0]} name="Target (GEL)" opacity={0.4} />
            </BarChart>
          </ResponsiveContainer>
        </ReportCard>
      </Col>

      {/* Revenue by Location */}
      <Col xs={24} lg={12}>
        <ReportCard
          title={t('reports.revenueByLocation')}
          description="Revenue breakdown across all D Block locations. Helps identify top-performing and underperforming branches."
          icon={<EnvironmentOutlined style={{ color: '#1677ff' }} />}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueByLocationData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="location" type="category" tick={{ fontSize: 12 }} width={80} />
              <RechartsTooltip />
              <Bar dataKey="revenue" fill="#0F3460" radius={[0, 4, 4, 0]} name="Revenue (GEL)" />
            </BarChart>
          </ResponsiveContainer>
        </ReportCard>
      </Col>

      {/* Revenue by Product Type */}
      <Col xs={24} lg={12}>
        <ReportCard
          title={t('reports.revenueByProduct')}
          description="Revenue distribution by resource type. Identifies which products contribute the most to total revenue."
          icon={<AppstoreOutlined style={{ color: '#722ED1' }} />}
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={revenueByProductData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {revenueByProductData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </ReportCard>
      </Col>
    </Row>
  );

  // ─── Tab: Booking Reports ───────────────────────────────────────

  const bookingTab = (
    <Row gutter={[16, 16]}>
      {/* Booking Volume */}
      <Col xs={24}>
        <ReportCard
          title={t('reports.bookingVolume')}
          description="Monthly booking volume alongside cancellation trends. Useful for understanding demand patterns and cancellation rates."
          icon={<CalendarOutlined style={{ color: '#E94560' }} />}
        >
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Statistic title="Total Bookings" value={5920} />
            </Col>
            <Col span={6}>
              <Statistic title="Cancellations" value={492} />
            </Col>
            <Col span={6}>
              <Statistic
                title="Cancellation Rate"
                value={8.3}
                suffix="%"
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
            <Col span={6}>
              <Statistic title="Avg / Month" value={493} />
            </Col>
          </Row>
          <Divider style={{ margin: '8px 0 16px' }} />
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={bookingVolumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke="#1A1A2E"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Bookings"
              />
              <Line
                type="monotone"
                dataKey="cancellations"
                stroke="#ff4d4f"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Cancellations"
              />
            </LineChart>
          </ResponsiveContainer>
        </ReportCard>
      </Col>

      {/* Utilization Rates */}
      <Col xs={24} lg={12}>
        <ReportCard
          title={t('reports.utilizationRates')}
          description="Resource utilization percentages by type. Highlights capacity constraints and underutilized assets."
          icon={<RiseOutlined style={{ color: '#faad14' }} />}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={utilizationData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
              <YAxis dataKey="resource" type="category" tick={{ fontSize: 12 }} width={110} />
              <RechartsTooltip formatter={(value: number) => `${value}%`} />
              <Bar dataKey="utilization" radius={[0, 4, 4, 0]} name="Utilization %">
                {utilizationData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.utilization >= 80 ? '#52c41a' : entry.utilization >= 60 ? '#faad14' : '#ff4d4f'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ReportCard>
      </Col>

      {/* Peak Hours Analysis */}
      <Col xs={24} lg={12}>
        <ReportCard
          title={t('reports.peakHours')}
          description="Hourly booking distribution throughout the day. Helps optimize staffing, pricing, and resource allocation."
          icon={<ClockCircleOutlined style={{ color: '#13C2C2' }} />}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={peakHoursData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip />
              <Bar dataKey="bookings" fill="#16213E" radius={[4, 4, 0, 0]} name="Bookings">
                {peakHoursData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.bookings >= 60 ? '#E94560' : entry.bookings >= 40 ? '#1A1A2E' : '#16213E'}
                    opacity={entry.bookings >= 60 ? 1 : entry.bookings >= 40 ? 0.8 : 0.5}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ReportCard>
      </Col>
    </Row>
  );

  // ─── Tab: Financial Reports ─────────────────────────────────────

  const financialTab = (
    <Row gutter={[16, 16]}>
      {/* Invoice Aging */}
      <Col xs={24}>
        <ReportCard
          title={t('reports.invoiceAging')}
          description="Breakdown of outstanding invoices by aging period. Critical for monitoring cash flow and identifying collection risks."
          icon={<AuditOutlined style={{ color: '#FF4D4F' }} />}
        >
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Statistic title="Total Outstanding" value={118700} prefix="GEL" />
            </Col>
            <Col span={6}>
              <Statistic title="Open Invoices" value={53} />
            </Col>
            <Col span={6}>
              <Statistic
                title="Overdue (60+ days)"
                value={45100}
                prefix="GEL"
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Col>
            <Col span={6}>
              <Statistic title="Avg Collection (days)" value={34} />
            </Col>
          </Row>
          <Divider style={{ margin: '8px 0 16px' }} />
          <Table
            columns={invoiceAgingColumns}
            dataSource={invoiceAgingData}
            pagination={false}
            size="middle"
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <Text strong>Total</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong>53</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <Text strong>118,700</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <Text strong>100%</Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        </ReportCard>
      </Col>

      {/* Payment Summary */}
      <Col xs={24} lg={14}>
        <ReportCard
          title={t('reports.paymentSummary')}
          description="Payment volume and amounts by payment method. Shows preferred payment channels and transaction distributions."
          icon={<BankOutlined style={{ color: '#1677ff' }} />}
        >
          <Table
            columns={paymentSummaryColumns}
            dataSource={paymentSummaryData}
            pagination={false}
            size="middle"
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <Text strong>Total</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong>2,360</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <Text strong>948,200</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <Text strong>100%</Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        </ReportCard>
      </Col>

      {/* Outstanding Balances */}
      <Col xs={24} lg={10}>
        <ReportCard
          title={t('reports.outstandingBalances')}
          description="Company-level outstanding balances. Tracks unpaid invoices by B2B client for follow-up."
          icon={<FundOutlined style={{ color: '#EB2F96' }} />}
        >
          <Row gutter={[0, 16]}>
            {[
              { company: 'TechHub Georgia', amount: 28400, invoices: 4, overdue: 2 },
              { company: 'Creative Studio', amount: 18200, invoices: 3, overdue: 1 },
              { company: 'StartUp Factory', amount: 14600, invoices: 2, overdue: 1 },
              { company: 'Digital Agency', amount: 12400, invoices: 3, overdue: 0 },
              { company: 'Green Office LLC', amount: 8900, invoices: 2, overdue: 0 },
            ].map((item, index) => (
              <Col span={24} key={index}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <div>
                    <Text strong style={{ display: 'block', fontSize: 13 }}>
                      {item.company}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.invoices} invoices
                      {item.overdue > 0 && (
                        <Tag color="red" style={{ marginLeft: 8, fontSize: 11 }}>
                          {item.overdue} overdue
                        </Tag>
                      )}
                    </Text>
                  </div>
                  <Text strong style={{ fontSize: 14 }}>
                    {item.amount.toLocaleString()} GEL
                  </Text>
                </div>
              </Col>
            ))}
          </Row>
        </ReportCard>
      </Col>
    </Row>
  );

  // ─── Tab: Operational Reports ───────────────────────────────────

  const operationalTab = (
    <Row gutter={[16, 16]}>
      {/* Occupancy Trends */}
      <Col xs={24}>
        <ReportCard
          title={t('reports.occupancyTrends')}
          description="Monthly occupancy rate trends across all locations. Reveals seasonal patterns and helps forecast demand."
          icon={<HeatMapOutlined style={{ color: '#FA8C16' }} />}
        >
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={occupancyTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="%" domain={[30, 100]} />
              <RechartsTooltip formatter={(value: number) => `${value}%`} />
              <Legend />
              <Line type="monotone" dataKey="vera" stroke="#1A1A2E" strokeWidth={2} dot={{ r: 3 }} name="Vera" />
              <Line type="monotone" dataKey="vake" stroke="#E94560" strokeWidth={2} dot={{ r: 3 }} name="Vake" />
              <Line type="monotone" dataKey="saburtalo" stroke="#0F3460" strokeWidth={2} dot={{ r: 3 }} name="Saburtalo" />
              <Line type="monotone" dataKey="oldTbilisi" stroke="#533483" strokeWidth={2} dot={{ r: 3 }} name="Old Tbilisi" />
            </LineChart>
          </ResponsiveContainer>
        </ReportCard>
      </Col>

      {/* Visitor Statistics */}
      <Col xs={24} lg={14}>
        <ReportCard
          title={t('reports.visitorStatistics')}
          description="Visitor management metrics by location. Tracks visitor volume, check-in rates, and no-show patterns."
          icon={<TeamOutlined style={{ color: '#13C2C2' }} />}
        >
          <Table
            columns={visitorStatsColumns}
            dataSource={visitorStatsData}
            pagination={false}
            size="middle"
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <Text strong>Total</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong>3,480</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <Text strong>29</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <Text strong>3,325</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  <Text strong>155</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  <Text strong>4.5%</Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        </ReportCard>
      </Col>

      {/* Access Log Summary */}
      <Col xs={24} lg={10}>
        <ReportCard
          title={t('reports.accessLogSummary')}
          description="Access control activity by location. Monitors entry/exit patterns and denied access attempts."
          icon={<KeyOutlined style={{ color: '#722ED1' }} />}
        >
          <Table
            columns={accessLogColumns}
            dataSource={accessLogSummaryData}
            pagination={false}
            size="small"
            scroll={{ x: 600 }}
          />
        </ReportCard>
      </Col>
    </Row>
  );

  // ─── Main Tabs Config ───────────────────────────────────────────

  const tabItems = [
    {
      key: 'revenue',
      label: (
        <Space>
          <DollarOutlined />
          {t('reports.tabs.revenue')}
        </Space>
      ),
      children: revenueTab,
    },
    {
      key: 'bookings',
      label: (
        <Space>
          <CalendarOutlined />
          {t('reports.tabs.bookings')}
        </Space>
      ),
      children: bookingTab,
    },
    {
      key: 'financial',
      label: (
        <Space>
          <AuditOutlined />
          {t('reports.tabs.financial')}
        </Space>
      ),
      children: financialTab,
    },
    {
      key: 'operational',
      label: (
        <Space>
          <BarChartOutlined />
          {t('reports.tabs.operational')}
        </Space>
      ),
      children: operationalTab,
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('reports.title')}
        subtitle={t('reports.subtitle')}
        actions={
          <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
            <Button type="primary" icon={<DownloadOutlined />}>
              {t('reports.exportAll')}
            </Button>
          </Dropdown>
        }
      />

      {/* ─── Global Filters ──────────────────────────────────────── */}
      <div className="filter-bar">
        <RangePicker
          placeholder={['Start Date', 'End Date']}
          style={{ width: 280 }}
          suffixIcon={<CalendarOutlined />}
        />
        <Select
          placeholder={t('reports.selectLocation')}
          value={locationFilter}
          onChange={setLocationFilter}
          allowClear
          style={{ width: 180 }}
          options={[
            { value: 'all', label: 'All Locations' },
            { value: 'vera', label: 'Vera' },
            { value: 'vake', label: 'Vake' },
            { value: 'saburtalo', label: 'Saburtalo' },
            { value: 'old-tbilisi', label: 'Old Tbilisi' },
          ]}
        />
      </div>

      {/* ─── Report Tabs ─────────────────────────────────────────── */}
      <Tabs
        defaultActiveKey="revenue"
        items={tabItems}
        size="large"
        style={{ marginBottom: 16 }}
      />
    </div>
  );
}
