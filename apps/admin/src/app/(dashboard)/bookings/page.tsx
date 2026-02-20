'use client';

import React, { useState } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Tabs,
  DatePicker,
  Select,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '@/components/PageHeader';

const { RangePicker } = DatePicker;

// ─── Types ─────────────────────────────────────────────────────────

type BookingStatus =
  | 'held'
  | 'confirmed'
  | 'checked_in'
  | 'completed'
  | 'cancelled'
  | 'no_show';

interface BookingRow {
  key: string;
  id: string;
  user: string;
  resource: string;
  resourceType: string;
  location: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalAmount: string;
  currency: string;
}

// ─── Placeholder Data ──────────────────────────────────────────────

const placeholderBookings: BookingRow[] = [
  {
    key: '1',
    id: 'BK-2024-001',
    user: 'Giorgi Beridze',
    resource: 'Meeting Room A',
    resourceType: 'meeting_room',
    location: 'Vera',
    startTime: '2024-12-20T10:00:00Z',
    endTime: '2024-12-20T12:00:00Z',
    status: 'confirmed',
    totalAmount: '120',
    currency: 'GEL',
  },
  {
    key: '2',
    id: 'BK-2024-002',
    user: 'Nino Kapanadze',
    resource: 'Hot Desk #12',
    resourceType: 'hot_desk',
    location: 'Vake',
    startTime: '2024-12-20T09:00:00Z',
    endTime: '2024-12-20T18:00:00Z',
    status: 'checked_in',
    totalAmount: '45',
    currency: 'GEL',
  },
  {
    key: '3',
    id: 'BK-2024-003',
    user: 'David Tsiklauri',
    resource: 'Office Box 3',
    resourceType: 'box',
    location: 'Saburtalo',
    startTime: '2024-12-20T14:00:00Z',
    endTime: '2024-12-20T18:00:00Z',
    status: 'held',
    totalAmount: '280',
    currency: 'GEL',
  },
  {
    key: '4',
    id: 'BK-2024-004',
    user: 'Ana Lomidze',
    resource: 'Phone Booth 2',
    resourceType: 'phone_booth',
    location: 'Vera',
    startTime: '2024-12-20T11:30:00Z',
    endTime: '2024-12-20T12:30:00Z',
    status: 'confirmed',
    totalAmount: '30',
    currency: 'GEL',
  },
  {
    key: '5',
    id: 'BK-2024-005',
    user: 'Lasha Gogichaishvili',
    resource: 'Event Space',
    resourceType: 'event_space',
    location: 'Old Tbilisi',
    startTime: '2024-12-21T18:00:00Z',
    endTime: '2024-12-21T22:00:00Z',
    status: 'confirmed',
    totalAmount: '850',
    currency: 'GEL',
  },
  {
    key: '6',
    id: 'BK-2024-006',
    user: 'Tamari Javakhishvili',
    resource: 'Fixed Desk #5',
    resourceType: 'fixed_desk',
    location: 'Vera',
    startTime: '2024-12-19T09:00:00Z',
    endTime: '2024-12-19T18:00:00Z',
    status: 'completed',
    totalAmount: '55',
    currency: 'GEL',
  },
  {
    key: '7',
    id: 'BK-2024-007',
    user: 'Irakli Mgeladze',
    resource: 'Meeting Room B',
    resourceType: 'meeting_room',
    location: 'Vake',
    startTime: '2024-12-18T15:00:00Z',
    endTime: '2024-12-18T16:00:00Z',
    status: 'cancelled',
    totalAmount: '60',
    currency: 'GEL',
  },
  {
    key: '8',
    id: 'BK-2024-008',
    user: 'Mariam Kvaratskhelia',
    resource: 'Hot Desk #8',
    resourceType: 'hot_desk',
    location: 'Saburtalo',
    startTime: '2024-12-17T09:00:00Z',
    endTime: '2024-12-17T18:00:00Z',
    status: 'no_show',
    totalAmount: '45',
    currency: 'GEL',
  },
  {
    key: '9',
    id: 'BK-2024-009',
    user: 'Salome Kipiani',
    resource: 'Parking Spot P3',
    resourceType: 'parking',
    location: 'Vera',
    startTime: '2024-12-22T08:00:00Z',
    endTime: '2024-12-22T20:00:00Z',
    status: 'confirmed',
    totalAmount: '15',
    currency: 'GEL',
  },
  {
    key: '10',
    id: 'BK-2024-010',
    user: 'Nikoloz Basilashvili',
    resource: 'Locker L12',
    resourceType: 'locker',
    location: 'Vake',
    startTime: '2024-12-01T00:00:00Z',
    endTime: '2024-12-31T23:59:00Z',
    status: 'confirmed',
    totalAmount: '40',
    currency: 'GEL',
  },
];

// ─── Status Colors ─────────────────────────────────────────────────

const statusColors: Record<BookingStatus, string> = {
  held: 'orange',
  confirmed: 'green',
  checked_in: 'blue',
  completed: 'default',
  cancelled: 'red',
  no_show: 'volcano',
};

export default function BookingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string | undefined>(
    undefined,
  );

  // Filter bookings based on active tab
  const filteredBookings = placeholderBookings.filter((booking) => {
    const now = new Date();
    const startTime = new Date(booking.startTime);

    let matchesTab = true;
    switch (activeTab) {
      case 'upcoming':
        matchesTab =
          startTime > now &&
          booking.status !== 'cancelled' &&
          booking.status !== 'completed';
        break;
      case 'past':
        matchesTab =
          booking.status === 'completed' || booking.status === 'no_show';
        break;
      case 'cancelled':
        matchesTab = booking.status === 'cancelled';
        break;
      default:
        matchesTab = true;
    }

    const matchesLocation =
      !locationFilter || booking.location === locationFilter;

    return matchesTab && matchesLocation;
  });

  const columns: ColumnsType<BookingRow> = [
    {
      title: t('bookings.id'),
      dataIndex: 'id',
      key: 'id',
      width: 140,
      render: (id: string) => (
        <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{id}</span>
      ),
    },
    {
      title: t('bookings.user'),
      dataIndex: 'user',
      key: 'user',
      width: 180,
    },
    {
      title: t('bookings.resource'),
      dataIndex: 'resource',
      key: 'resource',
      width: 160,
    },
    {
      title: t('bookings.location'),
      dataIndex: 'location',
      key: 'location',
      width: 120,
    },
    {
      title: t('bookings.startTime'),
      dataIndex: 'startTime',
      key: 'startTime',
      width: 160,
      render: (date: string) =>
        new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
    },
    {
      title: t('bookings.endTime'),
      dataIndex: 'endTime',
      key: 'endTime',
      width: 160,
      render: (date: string) =>
        new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
    },
    {
      title: t('bookings.status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: BookingStatus) => (
        <Tag color={statusColors[status]}>
          {t(`bookings.statuses.${status}`)}
        </Tag>
      ),
    },
    {
      title: t('bookings.total'),
      key: 'total',
      width: 110,
      align: 'right',
      render: (_, record) => (
        <span style={{ fontWeight: 500 }}>
          {record.totalAmount} {record.currency}
        </span>
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
            <Button type="text" size="small" icon={<EyeOutlined />} />
          </Tooltip>
          <Tooltip title={t('common.edit')}>
            <Button type="text" size="small" icon={<EditOutlined />} />
          </Tooltip>
          {record.status !== 'cancelled' && record.status !== 'completed' && (
            <Tooltip title={t('common.cancel')}>
              <Button
                type="text"
                size="small"
                danger
                icon={<CloseCircleOutlined />}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const tabItems = [
    { key: 'all', label: `${t('common.all')} (${placeholderBookings.length})` },
    {
      key: 'upcoming',
      label: `${t('bookings.upcoming')} (${placeholderBookings.filter((b) => new Date(b.startTime) > new Date() && b.status !== 'cancelled' && b.status !== 'completed').length})`,
    },
    {
      key: 'past',
      label: `${t('bookings.past')} (${placeholderBookings.filter((b) => b.status === 'completed' || b.status === 'no_show').length})`,
    },
    {
      key: 'cancelled',
      label: `${t('bookings.cancelled')} (${placeholderBookings.filter((b) => b.status === 'cancelled').length})`,
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('bookings.title')}
        actions={
          <Button type="primary" icon={<PlusOutlined />}>
            {t('bookings.createBooking')}
          </Button>
        }
      />

      {/* ─── Tab Navigation ─────────────────────────────────────── */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ marginBottom: 16 }}
      />

      {/* ─── Filter Bar ─────────────────────────────────────────── */}
      <div className="filter-bar">
        <RangePicker
          placeholder={['Start Date', 'End Date']}
          style={{ width: 280 }}
          suffixIcon={<CalendarOutlined />}
        />
        <Select
          placeholder={t('bookings.location')}
          value={locationFilter}
          onChange={setLocationFilter}
          allowClear
          style={{ width: 160 }}
          options={[
            { value: 'Vera', label: 'Vera' },
            { value: 'Vake', label: 'Vake' },
            { value: 'Saburtalo', label: 'Saburtalo' },
            { value: 'Old Tbilisi', label: 'Old Tbilisi' },
          ]}
        />
      </div>

      {/* ─── Bookings Table ─────────────────────────────────────── */}
      <Table
        columns={columns}
        dataSource={filteredBookings}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} ${t('bookings.title').toLowerCase()}`,
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
