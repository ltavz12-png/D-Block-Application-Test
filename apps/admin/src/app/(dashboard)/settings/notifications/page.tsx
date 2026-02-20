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
  Input,
  Tooltip,
  Typography,
  Switch,
} from 'antd';
import {
  SendOutlined,
  SearchOutlined,
  EditOutlined,
  BellOutlined,
  MailOutlined,
  MobileOutlined,
  CheckCircleOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '@/components/PageHeader';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const { Text } = Typography;

// ─── Types ─────────────────────────────────────────────────────────

type NotificationType =
  | 'booking_confirmation'
  | 'payment_receipt'
  | 'pass_expiring'
  | 'system_announcement'
  | 'booking_reminder'
  | 'cancellation_notice'
  | 'welcome_message'
  | 'feedback_request'
  | 'promo_alert'
  | 'access_granted';

type ChannelType = 'push' | 'email' | 'sms' | 'in_app';

type TemplateStatus = 'active' | 'inactive';

interface NotificationTemplate {
  key: string;
  name: string;
  type: NotificationType;
  channels: ChannelType[];
  language: string;
  lastSent: string;
  status: TemplateStatus;
}

// ─── Placeholder Data ──────────────────────────────────────────────

const deliveryStatsData = [
  { day: 'Mon', sent: 185, delivered: 176, failed: 9 },
  { day: 'Tue', sent: 210, delivered: 198, failed: 12 },
  { day: 'Wed', sent: 195, delivered: 187, failed: 8 },
  { day: 'Thu', sent: 230, delivered: 215, failed: 15 },
  { day: 'Fri', sent: 178, delivered: 170, failed: 8 },
  { day: 'Sat', sent: 142, delivered: 135, failed: 7 },
  { day: 'Sun', sent: 107, delivered: 101, failed: 6 },
];

const placeholderTemplates: NotificationTemplate[] = [
  {
    key: '1',
    name: 'Booking Confirmation',
    type: 'booking_confirmation',
    channels: ['push', 'email'],
    language: 'EN/KA',
    lastSent: '2024-12-20T14:30:00Z',
    status: 'active',
  },
  {
    key: '2',
    name: 'Payment Receipt',
    type: 'payment_receipt',
    channels: ['email', 'in_app'],
    language: 'EN/KA',
    lastSent: '2024-12-20T13:15:00Z',
    status: 'active',
  },
  {
    key: '3',
    name: 'Pass Expiring Soon',
    type: 'pass_expiring',
    channels: ['push', 'email', 'sms'],
    language: 'EN/KA',
    lastSent: '2024-12-19T10:00:00Z',
    status: 'active',
  },
  {
    key: '4',
    name: 'System Announcement',
    type: 'system_announcement',
    channels: ['push', 'in_app'],
    language: 'EN',
    lastSent: '2024-12-18T09:00:00Z',
    status: 'active',
  },
  {
    key: '5',
    name: 'Booking Reminder',
    type: 'booking_reminder',
    channels: ['push', 'sms'],
    language: 'EN/KA',
    lastSent: '2024-12-20T08:00:00Z',
    status: 'active',
  },
  {
    key: '6',
    name: 'Cancellation Notice',
    type: 'cancellation_notice',
    channels: ['email', 'in_app'],
    language: 'EN/KA',
    lastSent: '2024-12-19T16:45:00Z',
    status: 'active',
  },
  {
    key: '7',
    name: 'Welcome Message',
    type: 'welcome_message',
    channels: ['email', 'push', 'in_app'],
    language: 'EN/KA',
    lastSent: '2024-12-20T11:20:00Z',
    status: 'active',
  },
  {
    key: '8',
    name: 'Feedback Request',
    type: 'feedback_request',
    channels: ['email', 'in_app'],
    language: 'EN',
    lastSent: '2024-12-17T15:00:00Z',
    status: 'inactive',
  },
  {
    key: '9',
    name: 'Promo Alert',
    type: 'promo_alert',
    channels: ['push', 'email', 'sms'],
    language: 'EN/KA',
    lastSent: '2024-12-18T12:30:00Z',
    status: 'active',
  },
  {
    key: '10',
    name: 'Access Granted',
    type: 'access_granted',
    channels: ['push', 'in_app'],
    language: 'EN/KA',
    lastSent: '2024-12-20T09:45:00Z',
    status: 'active',
  },
];

// ─── Tag Color Maps ────────────────────────────────────────────────

const typeTagColors: Record<NotificationType, string> = {
  booking_confirmation: 'green',
  payment_receipt: 'blue',
  pass_expiring: 'orange',
  system_announcement: 'purple',
  booking_reminder: 'cyan',
  cancellation_notice: 'red',
  welcome_message: 'geekblue',
  feedback_request: 'magenta',
  promo_alert: 'gold',
  access_granted: 'lime',
};

const channelTagColors: Record<ChannelType, string> = {
  push: 'blue',
  email: 'green',
  sms: 'orange',
  in_app: 'purple',
};

const statusTagColors: Record<TemplateStatus, string> = {
  active: 'green',
  inactive: 'default',
};

export default function NotificationsPage() {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [channelFilter, setChannelFilter] = useState<string | undefined>(
    undefined,
  );

  // Filter templates based on search and filters
  const filteredTemplates = placeholderTemplates.filter((template) => {
    const matchesSearch =
      !searchText ||
      template.name.toLowerCase().includes(searchText.toLowerCase());

    const matchesType = !typeFilter || template.type === typeFilter;
    const matchesChannel =
      !channelFilter || template.channels.includes(channelFilter as ChannelType);

    return matchesSearch && matchesType && matchesChannel;
  });

  const columns: ColumnsType<NotificationTemplate> = [
    {
      title: t('notifications.templateName'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string) => (
        <span style={{ fontWeight: 500 }}>{name}</span>
      ),
    },
    {
      title: t('notifications.type'),
      dataIndex: 'type',
      key: 'type',
      width: 180,
      render: (type: NotificationType) => (
        <Tag color={typeTagColors[type]}>
          {type.replace(/_/g, ' ')}
        </Tag>
      ),
    },
    {
      title: t('notifications.channels'),
      dataIndex: 'channels',
      key: 'channels',
      width: 200,
      render: (channels: ChannelType[]) => (
        <Space size={4} wrap>
          {channels.map((ch) => (
            <Tag key={ch} color={channelTagColors[ch]} style={{ fontSize: 11 }}>
              {ch}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: t('notifications.language'),
      dataIndex: 'language',
      key: 'language',
      width: 100,
      align: 'center',
    },
    {
      title: t('notifications.lastSent'),
      dataIndex: 'lastSent',
      key: 'lastSent',
      width: 160,
      render: (date: string) =>
        new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
    },
    {
      title: t('notifications.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TemplateStatus) => (
        <Tag color={statusTagColors[status]}>
          {t(`notifications.statuses.${status}`)}
        </Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('common.edit')}>
            <Button type="text" size="small" icon={<EditOutlined />} />
          </Tooltip>
          <Tooltip
            title={
              record.status === 'active'
                ? t('notifications.deactivate')
                : t('notifications.activate')
            }
          >
            <Switch
              size="small"
              checked={record.status === 'active'}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('notifications.title')}
        actions={
          <Button type="primary" icon={<SendOutlined />}>
            {t('notifications.sendBroadcast')}
          </Button>
        }
      />

      {/* ─── Stat Cards ──────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('notifications.totalSentToday')}
              value={1247}
              prefix={<SendOutlined style={{ color: '#1A1A2E' }} />}
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
              title={t('notifications.deliveryRate')}
              value={94.8}
              precision={1}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('notifications.pushEnabledUsers')}
              value={3842}
              prefix={<MobileOutlined style={{ color: '#E94560' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('notifications.unreadRate')}
              value={32.5}
              precision={1}
              prefix={<MailOutlined style={{ color: '#faad14' }} />}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      {/* ─── Filter Bar ──────────────────────────────────────────── */}
      <div className="filter-bar">
        <Input
          placeholder={t('notifications.searchPlaceholder')}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Select
          placeholder={t('notifications.type')}
          value={typeFilter}
          onChange={setTypeFilter}
          allowClear
          style={{ width: 200 }}
          options={[
            { value: 'booking_confirmation', label: 'Booking Confirmation' },
            { value: 'payment_receipt', label: 'Payment Receipt' },
            { value: 'pass_expiring', label: 'Pass Expiring' },
            { value: 'system_announcement', label: 'System Announcement' },
            { value: 'booking_reminder', label: 'Booking Reminder' },
            { value: 'cancellation_notice', label: 'Cancellation Notice' },
            { value: 'welcome_message', label: 'Welcome Message' },
            { value: 'feedback_request', label: 'Feedback Request' },
            { value: 'promo_alert', label: 'Promo Alert' },
            { value: 'access_granted', label: 'Access Granted' },
          ]}
        />
        <Select
          placeholder={t('notifications.channel')}
          value={channelFilter}
          onChange={setChannelFilter}
          allowClear
          style={{ width: 160 }}
          options={[
            { value: 'push', label: 'Push' },
            { value: 'email', label: 'Email' },
            { value: 'sms', label: 'SMS' },
            { value: 'in_app', label: 'In-App' },
          ]}
        />
      </div>

      {/* ─── Notification Templates Table ────────────────────────── */}
      <Table
        columns={columns}
        dataSource={filteredTemplates}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} ${t('notifications.templates').toLowerCase()}`,
        }}
        scroll={{ x: 1100 }}
        size="middle"
        style={{
          background: '#fff',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      />

      {/* ─── Delivery Stats Chart ────────────────────────────────── */}
      <Card
        title={t('notifications.deliveryStats')}
        bordered={false}
        style={{ borderRadius: 12, marginTop: 24 }}
        extra={
          <Space>
            <BellOutlined style={{ color: '#1A1A2E' }} />
            <Text type="secondary">{t('notifications.last7Days')}</Text>
          </Space>
        }
      >
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={deliveryStatsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <RechartsTooltip />
            <Legend />
            <Bar
              dataKey="sent"
              fill="#1A1A2E"
              radius={[4, 4, 0, 0]}
              name={t('notifications.sent')}
            />
            <Bar
              dataKey="delivered"
              fill="#52c41a"
              radius={[4, 4, 0, 0]}
              name={t('notifications.delivered')}
            />
            <Bar
              dataKey="failed"
              fill="#ff4d4f"
              radius={[4, 4, 0, 0]}
              name={t('notifications.failed')}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
