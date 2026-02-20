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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  SearchOutlined,
  TeamOutlined,
  FileTextOutlined,
  DollarOutlined,
  UserAddOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '@/components/PageHeader';

// ─── Types ─────────────────────────────────────────────────────────

type CompanyStatus = 'active' | 'suspended' | 'deactivated';

interface CompanyRow {
  key: string;
  id: string;
  companyName: string;
  registrationNumber: string;
  contactEmail: string;
  contactPhone: string;
  status: CompanyStatus;
  employeeCount: number;
  activeContracts: number;
  totalContractValue: number;
  createdAt: string;
}

// ─── Placeholder Data ──────────────────────────────────────────────

const placeholderCompanies: CompanyRow[] = [
  {
    key: '1',
    id: 'comp-001',
    companyName: 'Caucasus Digital LLC',
    registrationNumber: '404876321',
    contactEmail: 'info@caucasusdigital.ge',
    contactPhone: '+995 322 123 456',
    status: 'active',
    employeeCount: 24,
    activeContracts: 3,
    totalContractValue: 18500,
    createdAt: '2024-03-15T08:00:00Z',
  },
  {
    key: '2',
    id: 'comp-002',
    companyName: 'TBC Bank',
    registrationNumber: '204378910',
    contactEmail: 'workspace@tbcbank.com.ge',
    contactPhone: '+995 322 272 727',
    status: 'active',
    employeeCount: 56,
    activeContracts: 5,
    totalContractValue: 42000,
    createdAt: '2024-01-10T08:00:00Z',
  },
  {
    key: '3',
    id: 'comp-003',
    companyName: 'Silknet JSC',
    registrationNumber: '204125890',
    contactEmail: 'office@silknet.com',
    contactPhone: '+995 322 100 100',
    status: 'active',
    employeeCount: 18,
    activeContracts: 2,
    totalContractValue: 12800,
    createdAt: '2024-05-20T08:00:00Z',
  },
  {
    key: '4',
    id: 'comp-004',
    companyName: 'Georgian Railway LLC',
    registrationNumber: '204567123',
    contactEmail: 'admin@railway.ge',
    contactPhone: '+995 322 219 219',
    status: 'suspended',
    employeeCount: 12,
    activeContracts: 0,
    totalContractValue: 0,
    createdAt: '2024-02-28T08:00:00Z',
  },
  {
    key: '5',
    id: 'comp-005',
    companyName: 'Wissol Group',
    registrationNumber: '204890456',
    contactEmail: 'corporate@wissol.ge',
    contactPhone: '+995 322 505 050',
    status: 'active',
    employeeCount: 32,
    activeContracts: 4,
    totalContractValue: 28500,
    createdAt: '2024-04-12T08:00:00Z',
  },
  {
    key: '6',
    id: 'comp-006',
    companyName: 'Nikora Trade',
    registrationNumber: '404321987',
    contactEmail: 'office@nikora.ge',
    contactPhone: '+995 322 440 440',
    status: 'active',
    employeeCount: 15,
    activeContracts: 2,
    totalContractValue: 9600,
    createdAt: '2024-06-01T08:00:00Z',
  },
  {
    key: '7',
    id: 'comp-007',
    companyName: 'Magticom LLC',
    registrationNumber: '204654321',
    contactEmail: 'business@magticom.ge',
    contactPhone: '+995 322 171 717',
    status: 'active',
    employeeCount: 42,
    activeContracts: 3,
    totalContractValue: 31200,
    createdAt: '2024-02-05T08:00:00Z',
  },
  {
    key: '8',
    id: 'comp-008',
    companyName: 'Bank of Georgia',
    registrationNumber: '204112233',
    contactEmail: 'coworking@bog.ge',
    contactPhone: '+995 322 444 444',
    status: 'deactivated',
    employeeCount: 0,
    activeContracts: 0,
    totalContractValue: 0,
    createdAt: '2024-01-20T08:00:00Z',
  },
  {
    key: '9',
    id: 'comp-009',
    companyName: 'Crystal Technologies',
    registrationNumber: '404998877',
    contactEmail: 'hello@crystaltech.ge',
    contactPhone: '+995 555 987 654',
    status: 'active',
    employeeCount: 8,
    activeContracts: 1,
    totalContractValue: 4800,
    createdAt: '2024-08-10T08:00:00Z',
  },
  {
    key: '10',
    id: 'comp-010',
    companyName: 'Tegeta Motors',
    registrationNumber: '204776655',
    contactEmail: 'it@tegeta.ge',
    contactPhone: '+995 322 264 264',
    status: 'active',
    employeeCount: 20,
    activeContracts: 2,
    totalContractValue: 15400,
    createdAt: '2024-07-15T08:00:00Z',
  },
];

// ─── Status Colors ─────────────────────────────────────────────────

const statusColors: Record<CompanyStatus, string> = {
  active: 'green',
  suspended: 'orange',
  deactivated: 'red',
};

// ─── Page Component ────────────────────────────────────────────────

export default function B2BPage() {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );

  // Compute stats
  const totalCompanies = placeholderCompanies.length;
  const activeContracts = placeholderCompanies.reduce(
    (sum, c) => sum + c.activeContracts,
    0,
  );
  const monthlyContractValue = placeholderCompanies
    .filter((c) => c.status === 'active')
    .reduce((sum, c) => sum + c.totalContractValue, 0);
  const activeEmployees = placeholderCompanies
    .filter((c) => c.status === 'active')
    .reduce((sum, c) => sum + c.employeeCount, 0);

  // Filter companies
  const filteredCompanies = placeholderCompanies.filter((company) => {
    const matchesSearch =
      !searchText ||
      company.companyName.toLowerCase().includes(searchText.toLowerCase()) ||
      company.contactEmail.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus = !statusFilter || company.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns: ColumnsType<CompanyRow> = [
    {
      title: t('b2b.companyName'),
      dataIndex: 'companyName',
      key: 'companyName',
      width: 200,
      render: (name: string) => (
        <span style={{ fontWeight: 500 }}>{name}</span>
      ),
    },
    {
      title: t('b2b.registrationNumber'),
      dataIndex: 'registrationNumber',
      key: 'registrationNumber',
      width: 150,
      render: (num: string) => (
        <span style={{ fontFamily: 'monospace' }}>{num}</span>
      ),
    },
    {
      title: t('b2b.contactEmail'),
      dataIndex: 'contactEmail',
      key: 'contactEmail',
      width: 220,
    },
    {
      title: t('b2b.contactPhone'),
      dataIndex: 'contactPhone',
      key: 'contactPhone',
      width: 160,
    },
    {
      title: t('b2b.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: CompanyStatus) => (
        <Tag color={statusColors[status]}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: t('b2b.employees'),
      dataIndex: 'employeeCount',
      key: 'employeeCount',
      width: 110,
      align: 'center',
    },
    {
      title: t('b2b.activeContracts'),
      dataIndex: 'activeContracts',
      key: 'activeContracts',
      width: 130,
      align: 'center',
    },
    {
      title: t('b2b.contractValue'),
      dataIndex: 'totalContractValue',
      key: 'totalContractValue',
      width: 150,
      align: 'right',
      render: (value: number) => (
        <span style={{ fontWeight: 500 }}>
          {value.toLocaleString()} GEL
        </span>
      ),
    },
    {
      title: t('b2b.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
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
          <Tooltip title={t('common.edit')}>
            <Button type="text" size="small" icon={<EditOutlined />} />
          </Tooltip>
          {record.status === 'active' ? (
            <Tooltip title={t('b2b.suspend')}>
              <Button
                type="text"
                size="small"
                icon={<PauseCircleOutlined />}
                style={{ color: '#faad14' }}
              />
            </Tooltip>
          ) : record.status === 'suspended' ? (
            <Tooltip title={t('b2b.activate')}>
              <Button
                type="text"
                size="small"
                icon={<PlayCircleOutlined />}
                style={{ color: '#52c41a' }}
              />
            </Tooltip>
          ) : null}
          <Tooltip title={t('b2b.addEmployee')}>
            <Button type="text" size="small" icon={<UserAddOutlined />} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('b2b.title')}
        subtitle={t('b2b.subtitle')}
        actions={
          <Button type="primary" icon={<PlusOutlined />}>
            {t('b2b.addCompany')}
          </Button>
        }
      />

      {/* ─── Stat Cards ──────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('b2b.totalCompanies')}
              value={totalCompanies}
              prefix={<BankOutlined style={{ color: '#1A1A2E' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('b2b.activeContractsTotal')}
              value={activeContracts}
              prefix={<FileTextOutlined style={{ color: '#E94560' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('b2b.monthlyContractValue')}
              value={monthlyContractValue}
              precision={0}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              suffix="GEL"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('b2b.activeEmployees')}
              value={activeEmployees}
              prefix={<TeamOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* ─── Filter Bar ─────────────────────────────────────────── */}
      <div className="filter-bar">
        <Input
          placeholder={t('b2b.searchPlaceholder')}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Select
          placeholder={t('b2b.status')}
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
          style={{ width: 180 }}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'suspended', label: 'Suspended' },
            { value: 'deactivated', label: 'Deactivated' },
          ]}
        />
      </div>

      {/* ─── Companies Table ─────────────────────────────────────── */}
      <Table
        columns={columns}
        dataSource={filteredCompanies}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} companies`,
        }}
        scroll={{ x: 1500 }}
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
