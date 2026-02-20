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
  Input,
  Tabs,
  Tooltip,
} from 'antd';
import {
  FileTextOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  DollarOutlined,
  SearchOutlined,
  CalendarOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '@/components/PageHeader';

const { RangePicker } = DatePicker;

// ─── Types ─────────────────────────────────────────────────────────

type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'credited';

interface InvoiceRow {
  key: string;
  invoiceNumber: string;
  companyName: string;
  amount: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
}

// ─── Placeholder Data ──────────────────────────────────────────────

const placeholderInvoices: InvoiceRow[] = [
  {
    key: '1',
    invoiceNumber: 'INV-20250115-0001',
    companyName: 'TBC Bank',
    amount: 4200,
    tax: 756,
    total: 4956,
    status: 'paid',
    dueDate: '2025-02-15',
    createdAt: '2025-01-15',
  },
  {
    key: '2',
    invoiceNumber: 'INV-20250115-0002',
    companyName: 'Bank of Georgia',
    amount: 8500,
    tax: 1530,
    total: 10030,
    status: 'sent',
    dueDate: '2025-02-15',
    createdAt: '2025-01-15',
  },
  {
    key: '3',
    invoiceNumber: 'INV-20250112-0003',
    companyName: 'Wissol Group',
    amount: 2800,
    tax: 504,
    total: 3304,
    status: 'overdue',
    dueDate: '2025-01-12',
    createdAt: '2025-01-02',
  },
  {
    key: '4',
    invoiceNumber: 'INV-20250110-0004',
    companyName: 'Magticom',
    amount: 3600,
    tax: 648,
    total: 4248,
    status: 'draft',
    dueDate: '2025-02-10',
    createdAt: '2025-01-10',
  },
  {
    key: '5',
    invoiceNumber: 'INV-20250108-0005',
    companyName: 'Silknet',
    amount: 5200,
    tax: 936,
    total: 6136,
    status: 'paid',
    dueDate: '2025-02-08',
    createdAt: '2025-01-08',
  },
  {
    key: '6',
    invoiceNumber: 'INV-20250107-0006',
    companyName: 'Georgian Railway',
    amount: 1900,
    tax: 342,
    total: 2242,
    status: 'cancelled',
    dueDate: '2025-02-07',
    createdAt: '2025-01-07',
  },
  {
    key: '7',
    invoiceNumber: 'INV-20250105-0007',
    companyName: 'Liberty Bank',
    amount: 6700,
    tax: 1206,
    total: 7906,
    status: 'sent',
    dueDate: '2025-02-05',
    createdAt: '2025-01-05',
  },
  {
    key: '8',
    invoiceNumber: 'INV-20250104-0008',
    companyName: 'Tegeta Motors',
    amount: 3100,
    tax: 558,
    total: 3658,
    status: 'credited',
    dueDate: '2025-02-04',
    createdAt: '2025-01-04',
  },
  {
    key: '9',
    invoiceNumber: 'INV-20250103-0009',
    companyName: 'PSP Group',
    amount: 4800,
    tax: 864,
    total: 5664,
    status: 'paid',
    dueDate: '2025-02-03',
    createdAt: '2025-01-03',
  },
  {
    key: '10',
    invoiceNumber: 'INV-20250102-0010',
    companyName: 'Nikora',
    amount: 2200,
    tax: 396,
    total: 2596,
    status: 'overdue',
    dueDate: '2025-01-15',
    createdAt: '2025-01-02',
  },
  {
    key: '11',
    invoiceNumber: 'INV-20250101-0011',
    companyName: 'Geocell',
    amount: 7400,
    tax: 1332,
    total: 8732,
    status: 'draft',
    dueDate: '2025-02-01',
    createdAt: '2025-01-01',
  },
  {
    key: '12',
    invoiceNumber: 'INV-20241228-0012',
    companyName: 'Cartu Bank',
    amount: 5500,
    tax: 990,
    total: 6490,
    status: 'paid',
    dueDate: '2025-01-28',
    createdAt: '2024-12-28',
  },
];

// ─── Status Colors ─────────────────────────────────────────────────

const statusColors: Record<InvoiceStatus, string> = {
  draft: 'default',
  sent: 'processing',
  paid: 'green',
  overdue: 'red',
  cancelled: 'default',
  credited: 'purple',
};

export default function InvoicesPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );
  const [searchText, setSearchText] = useState('');

  const filteredInvoices = placeholderInvoices.filter((invoice) => {
    let matchesTab = true;
    switch (activeTab) {
      case 'draft':
        matchesTab = invoice.status === 'draft';
        break;
      case 'sent':
        matchesTab = invoice.status === 'sent';
        break;
      case 'paid':
        matchesTab = invoice.status === 'paid';
        break;
      case 'overdue':
        matchesTab = invoice.status === 'overdue';
        break;
      default:
        matchesTab = true;
    }

    const matchesStatus = !statusFilter || invoice.status === statusFilter;
    const matchesSearch =
      !searchText ||
      invoice.companyName.toLowerCase().includes(searchText.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchText.toLowerCase());

    return matchesTab && matchesStatus && matchesSearch;
  });

  const paidCount = placeholderInvoices.filter(
    (i) => i.status === 'paid',
  ).length;
  const overdueCount = placeholderInvoices.filter(
    (i) => i.status === 'overdue',
  ).length;
  const draftCount = placeholderInvoices.filter(
    (i) => i.status === 'draft',
  ).length;

  const columns: ColumnsType<InvoiceRow> = [
    {
      title: t('finance.invoiceNumber'),
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 200,
      render: (id: string) => (
        <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{id}</span>
      ),
    },
    {
      title: t('finance.companyName'),
      dataIndex: 'companyName',
      key: 'companyName',
      width: 180,
    },
    {
      title: t('finance.amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (amount: number) => (
        <span>{amount.toLocaleString()} GEL</span>
      ),
    },
    {
      title: t('finance.tax'),
      dataIndex: 'tax',
      key: 'tax',
      width: 110,
      align: 'right',
      render: (tax: number) => (
        <span style={{ color: '#666' }}>{tax.toLocaleString()} GEL</span>
      ),
    },
    {
      title: t('finance.total'),
      key: 'total',
      dataIndex: 'total',
      width: 130,
      align: 'right',
      render: (total: number) => (
        <span style={{ fontWeight: 600 }}>{total.toLocaleString()} GEL</span>
      ),
    },
    {
      title: t('finance.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: InvoiceStatus) => (
        <Tag color={statusColors[status]}>{status}</Tag>
      ),
    },
    {
      title: t('finance.dueDate'),
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 130,
      render: (date: string) =>
        new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
    },
    {
      title: t('finance.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (date: string) =>
        new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 160,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('common.view')}>
            <Button type="text" size="small" icon={<EyeOutlined />} />
          </Tooltip>
          {record.status === 'draft' && (
            <Tooltip title={t('finance.send')}>
              <Button type="text" size="small" icon={<SendOutlined />} />
            </Tooltip>
          )}
          {record.status === 'sent' && (
            <Tooltip title={t('finance.markPaid')}>
              <Button
                type="text"
                size="small"
                icon={<CheckCircleOutlined />}
                style={{ color: '#52c41a' }}
              />
            </Tooltip>
          )}
          {(record.status === 'paid' || record.status === 'sent') && (
            <Tooltip title={t('finance.credit')}>
              <Button
                type="text"
                size="small"
                icon={<ExclamationCircleOutlined />}
                style={{ color: '#722ed1' }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'all',
      label: `${t('common.all')} (${placeholderInvoices.length})`,
    },
    {
      key: 'draft',
      label: `${t('finance.draft')} (${draftCount})`,
    },
    {
      key: 'sent',
      label: `${t('finance.sent')} (${placeholderInvoices.filter((i) => i.status === 'sent').length})`,
    },
    {
      key: 'paid',
      label: `${t('finance.paid')} (${paidCount})`,
    },
    {
      key: 'overdue',
      label: `${t('finance.overdue')} (${overdueCount})`,
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('finance.invoicesTitle')}
        actions={
          <Button type="primary" icon={<PlusOutlined />}>
            {t('finance.generateMonthlyB2B')}
          </Button>
        }
      />

      {/* ─── Stat Cards ──────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('finance.totalInvoices')}
              value={placeholderInvoices.length}
              prefix={<FileTextOutlined style={{ color: '#1A1A2E' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('finance.paid')}
              value={paidCount}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('finance.overdue')}
              value={overdueCount}
              prefix={
                <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('finance.draft')}
              value={draftCount}
              prefix={<DollarOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* ─── Tab Navigation ──────────────────────────────────────── */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ marginBottom: 16 }}
      />

      {/* ─── Filter Bar ──────────────────────────────────────────── */}
      <div className="filter-bar">
        <Input
          placeholder={t('finance.searchInvoices')}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Select
          placeholder={t('finance.status')}
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
          style={{ width: 160 }}
          options={[
            { value: 'draft', label: 'Draft' },
            { value: 'sent', label: 'Sent' },
            { value: 'paid', label: 'Paid' },
            { value: 'overdue', label: 'Overdue' },
            { value: 'cancelled', label: 'Cancelled' },
            { value: 'credited', label: 'Credited' },
          ]}
        />
        <RangePicker
          placeholder={['Start Date', 'End Date']}
          style={{ width: 280 }}
          suffixIcon={<CalendarOutlined />}
        />
      </div>

      {/* ─── Invoices Table ──────────────────────────────────────── */}
      <Table
        columns={columns}
        dataSource={filteredInvoices}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} invoices`,
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
