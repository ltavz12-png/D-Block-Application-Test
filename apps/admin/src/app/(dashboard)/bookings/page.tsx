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
  Modal,
  message,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '@/components/PageHeader';
import {
  useBookings,
  useConfirmBooking,
  useCancelBooking,
} from '@/lib/api-hooks';
import { useLocations } from '@/lib/api-hooks';

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const statusForTab =
    activeTab === 'cancelled'
      ? 'cancelled'
      : activeTab === 'completed'
        ? 'completed'
        : undefined;

  const { data, isLoading } = useBookings({
    location: locationFilter,
    status: statusForTab as any,
    page,
    limit: pageSize,
  });

  const { data: locationsData } = useLocations();

  const confirmBooking = useConfirmBooking();
  const cancelBooking = useCancelBooking();

  const bookings: BookingRow[] = (data?.data ?? []).map((b) => ({
    key: b.id,
    id: b.id.substring(0, 8),
    user: b.user
      ? `${b.user.firstName} ${b.user.lastName}`
      : '-',
    resource: b.resource?.name ?? '-',
    resourceType: b.resource?.resourceType ?? '-',
    location: b.resource?.location?.name ?? '-',
    startTime: b.startTime,
    endTime: b.endTime,
    status: b.status as BookingStatus,
    totalAmount: String(b.totalAmount),
    currency: b.currency,
  }));

  const total = data?.total ?? 0;

  function handleConfirm(id: string) {
    Modal.confirm({
      title: t('bookings.confirmBooking'),
      content: t('bookings.confirmMessage', 'Are you sure you want to confirm this booking?'),
      onOk: async () => {
        try {
          await confirmBooking.mutateAsync(id);
          message.success(t('common.success'));
        } catch {
          message.error(t('common.error'));
        }
      },
    });
  }

  function handleCancel(id: string) {
    Modal.confirm({
      title: t('common.cancel'),
      content: t('bookings.cancelMessage', 'Are you sure you want to cancel this booking?'),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await cancelBooking.mutateAsync({ id });
          message.success(t('common.success'));
        } catch {
          message.error(t('common.error'));
        }
      },
    });
  }

  const columns: ColumnsType<BookingRow> = [
    {
      title: t('bookings.id'),
      dataIndex: 'id',
      key: 'id',
      width: 100,
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
      width: 140,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('common.view')}>
            <Button type="text" size="small" icon={<EyeOutlined />} />
          </Tooltip>
          {record.status === 'held' && (
            <Tooltip title={t('bookings.confirm')}>
              <Button
                type="text"
                size="small"
                icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                onClick={() => handleConfirm(record.key)}
              />
            </Tooltip>
          )}
          {record.status !== 'cancelled' && record.status !== 'completed' && record.status !== 'no_show' && (
            <Tooltip title={t('common.cancel')}>
              <Button
                type="text"
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleCancel(record.key)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const tabItems = [
    { key: 'all', label: t('common.all') },
    { key: 'completed', label: t('bookings.past') },
    { key: 'cancelled', label: t('bookings.cancelled') },
  ];

  const locationOptions = (locationsData ?? []).map((loc) => ({
    value: loc.id,
    label: loc.name,
  }));

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
        onChange={(key) => {
          setActiveTab(key);
          setPage(1);
        }}
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
          onChange={(v) => {
            setLocationFilter(v);
            setPage(1);
          }}
          allowClear
          style={{ width: 200 }}
          options={locationOptions}
        />
      </div>

      {/* ─── Bookings Table ─────────────────────────────────────── */}
      <Table
        columns={columns}
        dataSource={bookings}
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
          showTotal: (tot, range) =>
            `${range[0]}-${range[1]} of ${tot} ${t('bookings.title').toLowerCase()}`,
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
