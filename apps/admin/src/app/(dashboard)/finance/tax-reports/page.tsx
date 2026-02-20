'use client';

import React from 'react';
import {
  Table,
  Button,
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
} from 'antd';
import {
  ExportOutlined,
  DollarOutlined,
  AuditOutlined,
  BankOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '@/components/PageHeader';

const { RangePicker } = DatePicker;

// ─── Types ─────────────────────────────────────────────────────────

interface TaxReportRow {
  key: string;
  period: string;
  taxableRevenue: number;
  vatRate: number;
  vatAmount: number;
  netRevenue: number;
}

// ─── Placeholder Data ──────────────────────────────────────────────

const placeholderTaxReports: TaxReportRow[] = [
  {
    key: '1',
    period: 'January 2025',
    taxableRevenue: 78000,
    vatRate: 18,
    vatAmount: 14040,
    netRevenue: 63960,
  },
  {
    key: '2',
    period: 'December 2024',
    taxableRevenue: 89000,
    vatRate: 18,
    vatAmount: 16020,
    netRevenue: 72980,
  },
  {
    key: '3',
    period: 'November 2024',
    taxableRevenue: 76000,
    vatRate: 18,
    vatAmount: 13680,
    netRevenue: 62320,
  },
  {
    key: '4',
    period: 'October 2024',
    taxableRevenue: 82000,
    vatRate: 18,
    vatAmount: 14760,
    netRevenue: 67240,
  },
  {
    key: '5',
    period: 'September 2024',
    taxableRevenue: 68000,
    vatRate: 18,
    vatAmount: 12240,
    netRevenue: 55760,
  },
  {
    key: '6',
    period: 'August 2024',
    taxableRevenue: 65000,
    vatRate: 18,
    vatAmount: 11700,
    netRevenue: 53300,
  },
  {
    key: '7',
    period: 'July 2024',
    taxableRevenue: 72000,
    vatRate: 18,
    vatAmount: 12960,
    netRevenue: 59040,
  },
  {
    key: '8',
    period: 'June 2024',
    taxableRevenue: 58000,
    vatRate: 18,
    vatAmount: 10440,
    netRevenue: 47560,
  },
  {
    key: '9',
    period: 'May 2024',
    taxableRevenue: 62000,
    vatRate: 18,
    vatAmount: 11160,
    netRevenue: 50840,
  },
  {
    key: '10',
    period: 'April 2024',
    taxableRevenue: 51000,
    vatRate: 18,
    vatAmount: 9180,
    netRevenue: 41820,
  },
  {
    key: '11',
    period: 'March 2024',
    taxableRevenue: 55000,
    vatRate: 18,
    vatAmount: 9900,
    netRevenue: 45100,
  },
  {
    key: '12',
    period: 'February 2024',
    taxableRevenue: 48000,
    vatRate: 18,
    vatAmount: 8640,
    netRevenue: 39360,
  },
];

export default function TaxReportsPage() {
  const { t } = useTranslation();

  const totalRevenue = placeholderTaxReports.reduce(
    (sum, r) => sum + r.taxableRevenue,
    0,
  );
  const totalVAT = placeholderTaxReports.reduce(
    (sum, r) => sum + r.vatAmount,
    0,
  );
  const totalNet = placeholderTaxReports.reduce(
    (sum, r) => sum + r.netRevenue,
    0,
  );

  const columns: ColumnsType<TaxReportRow> = [
    {
      title: t('finance.period'),
      dataIndex: 'period',
      key: 'period',
      width: 170,
      render: (period: string) => (
        <span style={{ fontWeight: 500 }}>{period}</span>
      ),
    },
    {
      title: t('finance.taxableRevenue'),
      dataIndex: 'taxableRevenue',
      key: 'taxableRevenue',
      width: 170,
      align: 'right',
      render: (amount: number) => (
        <span>{amount.toLocaleString()} GEL</span>
      ),
    },
    {
      title: t('finance.vatRate'),
      dataIndex: 'vatRate',
      key: 'vatRate',
      width: 100,
      align: 'center',
      render: (rate: number) => <span>{rate}%</span>,
    },
    {
      title: t('finance.vatAmount'),
      dataIndex: 'vatAmount',
      key: 'vatAmount',
      width: 160,
      align: 'right',
      render: (amount: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 500 }}>
          {amount.toLocaleString()} GEL
        </span>
      ),
    },
    {
      title: t('finance.netRevenue'),
      dataIndex: 'netRevenue',
      key: 'netRevenue',
      width: 170,
      align: 'right',
      render: (amount: number) => (
        <span style={{ fontWeight: 600, color: '#52c41a' }}>
          {amount.toLocaleString()} GEL
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('finance.taxReportsTitle')}
        actions={
          <Button type="primary" icon={<ExportOutlined />}>
            {t('finance.exportToExcel')}
          </Button>
        }
      />

      {/* ─── Summary Cards ───────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('finance.totalRevenue')}
              value={totalRevenue}
              precision={0}
              prefix={<DollarOutlined style={{ color: '#1A1A2E' }} />}
              suffix="GEL"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('finance.totalVATCollected')}
              value={totalVAT}
              precision={0}
              prefix={<AuditOutlined style={{ color: '#ff4d4f' }} />}
              suffix="GEL"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('finance.netRevenue')}
              value={totalNet}
              precision={0}
              prefix={<BankOutlined style={{ color: '#52c41a' }} />}
              suffix="GEL"
            />
          </Card>
        </Col>
      </Row>

      {/* ─── Filter Bar ──────────────────────────────────────────── */}
      <div className="filter-bar">
        <RangePicker
          placeholder={['Start Date', 'End Date']}
          style={{ width: 280 }}
          suffixIcon={<CalendarOutlined />}
          picker="month"
        />
      </div>

      {/* ─── Tax Reports Table ───────────────────────────────────── */}
      <Table
        columns={columns}
        dataSource={placeholderTaxReports}
        pagination={{
          pageSize: 12,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} periods`,
        }}
        scroll={{ x: 800 }}
        size="middle"
        style={{
          background: '#fff',
          borderRadius: 12,
          overflow: 'hidden',
        }}
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row
              style={{ background: '#fafafa', fontWeight: 600 }}
            >
              <Table.Summary.Cell index={0}>
                {t('finance.total')}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                {totalRevenue.toLocaleString()} GEL
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="center">
                18%
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} align="right">
                <span style={{ color: '#ff4d4f' }}>
                  {totalVAT.toLocaleString()} GEL
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="right">
                <span style={{ color: '#52c41a' }}>
                  {totalNet.toLocaleString()} GEL
                </span>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    </div>
  );
}
