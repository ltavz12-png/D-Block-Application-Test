'use client';

import React, { useState } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  SearchOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '@/components/PageHeader';

// ─── Types ─────────────────────────────────────────────────────────

type ResourceType =
  | 'hot_desk'
  | 'meeting_room'
  | 'office'
  | 'box'
  | 'parking'
  | 'locker'
  | 'phone_booth'
  | 'event_space';

type ResourceStatus = 'available' | 'occupied' | 'maintenance' | 'disabled';

interface ResourceRow {
  key: string;
  id: string;
  name: string;
  type: ResourceType;
  location: string;
  floor: string;
  capacity: number;
  hourlyRate: number;
  status: ResourceStatus;
  amenities: string[];
}

// ─── Placeholder Data ──────────────────────────────────────────────

const placeholderResources: ResourceRow[] = [
  {
    key: '1',
    id: 'res-001',
    name: 'Hot Desk A-12',
    type: 'hot_desk',
    location: 'Stamba (Vera)',
    floor: '2nd Floor',
    capacity: 1,
    hourlyRate: 5,
    status: 'available',
    amenities: ['Monitor', 'Power Outlet', 'USB-C Hub'],
  },
  {
    key: '2',
    id: 'res-002',
    name: 'Summit Meeting Room',
    type: 'meeting_room',
    location: 'Stamba (Vera)',
    floor: '3rd Floor',
    capacity: 12,
    hourlyRate: 60,
    status: 'occupied',
    amenities: ['Projector', 'Whiteboard', 'Video Conf', 'Sound System'],
  },
  {
    key: '3',
    id: 'res-003',
    name: 'Private Office 301',
    type: 'office',
    location: 'Stamba (Vera)',
    floor: '3rd Floor',
    capacity: 6,
    hourlyRate: 45,
    status: 'occupied',
    amenities: ['Standing Desks', 'AC', 'Printer Access'],
  },
  {
    key: '4',
    id: 'res-004',
    name: 'Focus Box B-2',
    type: 'box',
    location: 'Radio City (Vake)',
    floor: '1st Floor',
    capacity: 1,
    hourlyRate: 12,
    status: 'available',
    amenities: ['Soundproofing', 'Monitor', 'Webcam'],
  },
  {
    key: '5',
    id: 'res-005',
    name: 'Parking Spot P-15',
    type: 'parking',
    location: 'Stamba (Vera)',
    floor: 'Basement',
    capacity: 1,
    hourlyRate: 3,
    status: 'available',
    amenities: ['EV Charging'],
  },
  {
    key: '6',
    id: 'res-006',
    name: 'Locker L-42',
    type: 'locker',
    location: 'Radio City (Vake)',
    floor: '1st Floor',
    capacity: 1,
    hourlyRate: 1,
    status: 'occupied',
    amenities: ['Digital Lock'],
  },
  {
    key: '7',
    id: 'res-007',
    name: 'Phone Booth 3',
    type: 'phone_booth',
    location: 'Radio City (Vake)',
    floor: '2nd Floor',
    capacity: 1,
    hourlyRate: 8,
    status: 'maintenance',
    amenities: ['Soundproofing', 'Monitor'],
  },
  {
    key: '8',
    id: 'res-008',
    name: 'Horizon Event Space',
    type: 'event_space',
    location: 'Stamba (Vera)',
    floor: '4th Floor',
    capacity: 80,
    hourlyRate: 200,
    status: 'available',
    amenities: ['Stage', 'Sound System', 'Projector', 'Catering Kitchen'],
  },
  {
    key: '9',
    id: 'res-009',
    name: 'Hot Desk C-5',
    type: 'hot_desk',
    location: 'Rooms Batumi',
    floor: '1st Floor',
    capacity: 1,
    hourlyRate: 4,
    status: 'available',
    amenities: ['Monitor', 'Power Outlet'],
  },
  {
    key: '10',
    id: 'res-010',
    name: 'Boardroom Vake',
    type: 'meeting_room',
    location: 'Radio City (Vake)',
    floor: '3rd Floor',
    capacity: 20,
    hourlyRate: 80,
    status: 'available',
    amenities: ['Video Conf', 'Whiteboard', 'Sound System', 'Catering'],
  },
  {
    key: '11',
    id: 'res-011',
    name: 'Private Office 102',
    type: 'office',
    location: 'Radio City (Vake)',
    floor: '1st Floor',
    capacity: 4,
    hourlyRate: 35,
    status: 'disabled',
    amenities: ['AC', 'Printer Access'],
  },
  {
    key: '12',
    id: 'res-012',
    name: 'Focus Box A-1',
    type: 'box',
    location: 'Stamba (Vera)',
    floor: '2nd Floor',
    capacity: 2,
    hourlyRate: 15,
    status: 'occupied',
    amenities: ['Soundproofing', 'Dual Monitors', 'Webcam'],
  },
  {
    key: '13',
    id: 'res-013',
    name: 'Phone Booth 1',
    type: 'phone_booth',
    location: 'Rooms Batumi',
    floor: '1st Floor',
    capacity: 1,
    hourlyRate: 6,
    status: 'available',
    amenities: ['Soundproofing'],
  },
  {
    key: '14',
    id: 'res-014',
    name: 'Hot Desk B-8',
    type: 'hot_desk',
    location: 'Radio City (Vake)',
    floor: '2nd Floor',
    capacity: 1,
    hourlyRate: 5,
    status: 'occupied',
    amenities: ['Monitor', 'Power Outlet', 'Standing Desk'],
  },
  {
    key: '15',
    id: 'res-015',
    name: 'Batumi Event Hall',
    type: 'event_space',
    location: 'Rooms Batumi',
    floor: '2nd Floor',
    capacity: 50,
    hourlyRate: 150,
    status: 'available',
    amenities: ['Stage', 'Projector', 'Sound System'],
  },
];

// ─── Tag Colors ────────────────────────────────────────────────────

const typeColors: Record<ResourceType, string> = {
  hot_desk: 'blue',
  meeting_room: 'purple',
  office: 'cyan',
  box: 'geekblue',
  parking: 'lime',
  locker: 'default',
  phone_booth: 'magenta',
  event_space: 'gold',
};

const statusColors: Record<ResourceStatus, string> = {
  available: 'green',
  occupied: 'blue',
  maintenance: 'orange',
  disabled: 'red',
};

const typeLabels: Record<ResourceType, string> = {
  hot_desk: 'Hot Desk',
  meeting_room: 'Meeting Room',
  office: 'Office',
  box: 'Box',
  parking: 'Parking',
  locker: 'Locker',
  phone_booth: 'Phone Booth',
  event_space: 'Event Space',
};

// ─── Page Component ────────────────────────────────────────────────

export default function ResourcesPage() {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [locationFilter, setLocationFilter] = useState<string | undefined>(
    undefined,
  );
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );

  // Filter resources
  const filteredResources = placeholderResources.filter((resource) => {
    const matchesSearch =
      !searchText ||
      resource.name.toLowerCase().includes(searchText.toLowerCase());

    const matchesLocation =
      !locationFilter || resource.location === locationFilter;
    const matchesType = !typeFilter || resource.type === typeFilter;
    const matchesStatus = !statusFilter || resource.status === statusFilter;

    return matchesSearch && matchesLocation && matchesType && matchesStatus;
  });

  const columns: ColumnsType<ResourceRow> = [
    {
      title: t('resources.name'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string) => (
        <span style={{ fontWeight: 500 }}>{name}</span>
      ),
    },
    {
      title: t('resources.type'),
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (type: ResourceType) => (
        <Tag color={typeColors[type]}>{typeLabels[type]}</Tag>
      ),
    },
    {
      title: t('resources.location'),
      dataIndex: 'location',
      key: 'location',
      width: 160,
    },
    {
      title: t('resources.floor'),
      dataIndex: 'floor',
      key: 'floor',
      width: 110,
    },
    {
      title: t('resources.capacity'),
      dataIndex: 'capacity',
      key: 'capacity',
      width: 100,
      align: 'center',
    },
    {
      title: t('resources.hourlyRate'),
      dataIndex: 'hourlyRate',
      key: 'hourlyRate',
      width: 120,
      align: 'right',
      render: (rate: number) => (
        <span style={{ fontWeight: 500 }}>{rate} GEL</span>
      ),
    },
    {
      title: t('resources.status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: ResourceStatus) => (
        <Tag color={statusColors[status]}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: t('resources.amenities'),
      dataIndex: 'amenities',
      key: 'amenities',
      width: 260,
      render: (amenities: string[]) => (
        <Space size={[0, 4]} wrap>
          {amenities.map((amenity) => (
            <Tag key={amenity} style={{ fontSize: 11 }}>
              {amenity}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 120,
      align: 'center',
      render: () => (
        <Space size="small">
          <Tooltip title={t('common.view')}>
            <Button type="text" size="small" icon={<EyeOutlined />} />
          </Tooltip>
          <Tooltip title={t('common.edit')}>
            <Button type="text" size="small" icon={<EditOutlined />} />
          </Tooltip>
          <Tooltip title={t('common.delete')}>
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('resources.title')}
        subtitle={t('resources.subtitle')}
        actions={
          <Button type="primary" icon={<PlusOutlined />}>
            {t('resources.addResource')}
          </Button>
        }
      />

      {/* ─── Filter Bar ─────────────────────────────────────────── */}
      <div className="filter-bar">
        <Input
          placeholder={t('resources.searchPlaceholder')}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 260 }}
          allowClear
        />
        <Select
          placeholder={t('resources.location')}
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
          placeholder={t('resources.type')}
          value={typeFilter}
          onChange={setTypeFilter}
          allowClear
          style={{ width: 160 }}
          options={Object.entries(typeLabels).map(([value, label]) => ({
            value,
            label,
          }))}
        />
        <Select
          placeholder={t('resources.status')}
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
          style={{ width: 160 }}
          options={[
            { value: 'available', label: 'Available' },
            { value: 'occupied', label: 'Occupied' },
            { value: 'maintenance', label: 'Maintenance' },
            { value: 'disabled', label: 'Disabled' },
          ]}
        />
      </div>

      {/* ─── Resources Table ─────────────────────────────────────── */}
      <Table
        columns={columns}
        dataSource={filteredResources}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} resources`,
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
