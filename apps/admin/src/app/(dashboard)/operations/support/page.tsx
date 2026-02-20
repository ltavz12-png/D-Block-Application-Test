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
  Tabs,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '@/components/PageHeader';

// ─── Types ─────────────────────────────────────────────────────────

type TicketCategory =
  | 'billing'
  | 'technical'
  | 'access'
  | 'general'
  | 'complaint';

type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

interface TicketRow {
  key: string;
  id: string;
  subject: string;
  user: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo: string;
  createdAt: string;
  lastUpdatedAt: string;
}

// ─── Placeholder Data ──────────────────────────────────────────────

const placeholderTickets: TicketRow[] = [
  {
    key: '1',
    id: 'TK-1001',
    subject: 'Cannot access meeting room booking system',
    user: 'Giorgi Beridze',
    category: 'technical',
    priority: 'high',
    status: 'open',
    assignedTo: 'Irakli Mgeladze',
    createdAt: '2025-01-20T08:15:00Z',
    lastUpdatedAt: '2025-01-20T08:15:00Z',
  },
  {
    key: '2',
    id: 'TK-1002',
    subject: 'Invoice discrepancy for December billing',
    user: 'Nino Kapanadze',
    category: 'billing',
    priority: 'medium',
    status: 'in_progress',
    assignedTo: 'Tamari Javakhishvili',
    createdAt: '2025-01-19T14:30:00Z',
    lastUpdatedAt: '2025-01-20T09:00:00Z',
  },
  {
    key: '3',
    id: 'TK-1003',
    subject: 'Wi-Fi connectivity issues on 3rd floor',
    user: 'David Tsiklauri',
    category: 'technical',
    priority: 'urgent',
    status: 'in_progress',
    assignedTo: 'Lasha Gogichaishvili',
    createdAt: '2025-01-20T07:45:00Z',
    lastUpdatedAt: '2025-01-20T10:30:00Z',
  },
  {
    key: '4',
    id: 'TK-1004',
    subject: 'Request for additional parking spot',
    user: 'Ana Lomidze',
    category: 'general',
    priority: 'low',
    status: 'resolved',
    assignedTo: 'Salome Kipiani',
    createdAt: '2025-01-18T11:00:00Z',
    lastUpdatedAt: '2025-01-19T16:00:00Z',
  },
  {
    key: '5',
    id: 'TK-1005',
    subject: 'Keycard not working for Office 301',
    user: 'Lasha Gogichaishvili',
    category: 'access',
    priority: 'high',
    status: 'open',
    assignedTo: 'Irakli Mgeladze',
    createdAt: '2025-01-20T09:20:00Z',
    lastUpdatedAt: '2025-01-20T09:20:00Z',
  },
  {
    key: '6',
    id: 'TK-1006',
    subject: 'Noise complaint from adjacent office',
    user: 'Mariam Kvaratskhelia',
    category: 'complaint',
    priority: 'medium',
    status: 'open',
    assignedTo: 'Salome Kipiani',
    createdAt: '2025-01-19T16:45:00Z',
    lastUpdatedAt: '2025-01-20T08:00:00Z',
  },
  {
    key: '7',
    id: 'TK-1007',
    subject: 'Refund request for cancelled booking',
    user: 'Nikoloz Basilashvili',
    category: 'billing',
    priority: 'medium',
    status: 'resolved',
    assignedTo: 'Tamari Javakhishvili',
    createdAt: '2025-01-17T10:00:00Z',
    lastUpdatedAt: '2025-01-18T14:30:00Z',
  },
  {
    key: '8',
    id: 'TK-1008',
    subject: 'Projector malfunction in Summit Room',
    user: 'Tornike Gvenetadze',
    category: 'technical',
    priority: 'high',
    status: 'in_progress',
    assignedTo: 'Lasha Gogichaishvili',
    createdAt: '2025-01-20T10:00:00Z',
    lastUpdatedAt: '2025-01-20T11:15:00Z',
  },
  {
    key: '9',
    id: 'TK-1009',
    subject: 'Need access to Radio City coworking area',
    user: 'Natia Rurua',
    category: 'access',
    priority: 'low',
    status: 'closed',
    assignedTo: 'Irakli Mgeladze',
    createdAt: '2025-01-15T09:00:00Z',
    lastUpdatedAt: '2025-01-16T11:00:00Z',
  },
  {
    key: '10',
    id: 'TK-1010',
    subject: 'Air conditioning not working in Batumi office',
    user: 'Dmitri Petrov',
    category: 'complaint',
    priority: 'urgent',
    status: 'open',
    assignedTo: 'Salome Kipiani',
    createdAt: '2025-01-20T11:30:00Z',
    lastUpdatedAt: '2025-01-20T11:30:00Z',
  },
];

// ─── Tag Colors ────────────────────────────────────────────────────

const priorityColors: Record<TicketPriority, string> = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
};

const statusColors: Record<TicketStatus, string> = {
  open: 'orange',
  in_progress: 'blue',
  resolved: 'green',
  closed: 'default',
};

const categoryLabels: Record<TicketCategory, string> = {
  billing: 'Billing',
  technical: 'Technical',
  access: 'Access',
  general: 'General',
  complaint: 'Complaint',
};

// ─── Page Component ────────────────────────────────────────────────

export default function SupportPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>(
    undefined,
  );
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(
    undefined,
  );

  // Compute stats
  const openTickets = placeholderTickets.filter(
    (t) => t.status === 'open',
  ).length;
  const inProgressTickets = placeholderTickets.filter(
    (t) => t.status === 'in_progress',
  ).length;
  const resolvedToday = placeholderTickets.filter(
    (t) => t.status === 'resolved',
  ).length;

  // Filter tickets
  const filteredTickets = placeholderTickets.filter((ticket) => {
    const matchesSearch =
      !searchText ||
      ticket.subject.toLowerCase().includes(searchText.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus = !statusFilter || ticket.status === statusFilter;
    const matchesPriority =
      !priorityFilter || ticket.priority === priorityFilter;
    const matchesCategory =
      !categoryFilter || ticket.category === categoryFilter;

    let matchesTab = true;
    switch (activeTab) {
      case 'open':
        matchesTab = ticket.status === 'open';
        break;
      case 'in_progress':
        matchesTab = ticket.status === 'in_progress';
        break;
      case 'resolved':
        matchesTab = ticket.status === 'resolved';
        break;
      default:
        matchesTab = true;
    }

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority &&
      matchesCategory &&
      matchesTab
    );
  });

  const columns: ColumnsType<TicketRow> = [
    {
      title: t('support.ticketId'),
      dataIndex: 'id',
      key: 'id',
      width: 110,
      render: (id: string) => (
        <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{id}</span>
      ),
    },
    {
      title: t('support.subject'),
      dataIndex: 'subject',
      key: 'subject',
      width: 280,
      ellipsis: true,
    },
    {
      title: t('support.user'),
      dataIndex: 'user',
      key: 'user',
      width: 160,
    },
    {
      title: t('support.category'),
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: TicketCategory) => (
        <Tag>{categoryLabels[category]}</Tag>
      ),
    },
    {
      title: t('support.priority'),
      dataIndex: 'priority',
      key: 'priority',
      width: 110,
      render: (priority: TicketPriority) => (
        <Tag color={priorityColors[priority]}>
          {priority.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: t('support.status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: TicketStatus) => (
        <Tag color={statusColors[status]}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: t('support.assignedTo'),
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      width: 160,
    },
    {
      title: t('support.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) =>
        new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
    },
    {
      title: t('support.lastUpdated'),
      dataIndex: 'lastUpdatedAt',
      key: 'lastUpdatedAt',
      width: 150,
      render: (date: string) =>
        new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 100,
      align: 'center',
      render: () => (
        <Space size="small">
          <Tooltip title={t('common.view')}>
            <Button type="text" size="small" icon={<EyeOutlined />} />
          </Tooltip>
          <Tooltip title={t('common.edit')}>
            <Button type="text" size="small" icon={<EditOutlined />} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'all',
      label: `${t('common.all')} (${placeholderTickets.length})`,
    },
    {
      key: 'open',
      label: `${t('support.open')} (${openTickets})`,
    },
    {
      key: 'in_progress',
      label: `${t('support.inProgress')} (${inProgressTickets})`,
    },
    {
      key: 'resolved',
      label: `${t('support.resolved')} (${resolvedToday})`,
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('support.title')}
        subtitle={t('support.subtitle')}
      />

      {/* ─── Stat Cards ──────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('support.openTickets')}
              value={openTickets}
              prefix={
                <ExclamationCircleOutlined style={{ color: '#faad14' }} />
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('support.inProgressTickets')}
              value={inProgressTickets}
              prefix={<SyncOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('support.resolvedToday')}
              value={resolvedToday}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('support.avgResponseTime')}
              value="2.4h"
              prefix={<ClockCircleOutlined style={{ color: '#722ed1' }} />}
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

      {/* ─── Filter Bar ─────────────────────────────────────────── */}
      <div className="filter-bar">
        <Input
          placeholder={t('support.searchPlaceholder')}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 280 }}
          allowClear
        />
        <Select
          placeholder={t('support.status')}
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
          style={{ width: 160 }}
          options={[
            { value: 'open', label: 'Open' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'closed', label: 'Closed' },
          ]}
        />
        <Select
          placeholder={t('support.priority')}
          value={priorityFilter}
          onChange={setPriorityFilter}
          allowClear
          style={{ width: 140 }}
          options={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'urgent', label: 'Urgent' },
          ]}
        />
        <Select
          placeholder={t('support.category')}
          value={categoryFilter}
          onChange={setCategoryFilter}
          allowClear
          style={{ width: 160 }}
          options={Object.entries(categoryLabels).map(([value, label]) => ({
            value,
            label,
          }))}
        />
      </div>

      {/* ─── Tickets Table ───────────────────────────────────────── */}
      <Table
        columns={columns}
        dataSource={filteredTickets}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} tickets`,
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
