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
  Tabs,
  Progress,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  CopyOutlined,
  StopOutlined,
  GiftOutlined,
  DollarOutlined,
  FireOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '@/components/PageHeader';

const { Text } = Typography;

// ─── Types ─────────────────────────────────────────────────────────

type DiscountType = 'percentage' | 'fixed_amount';
type PromotionStatus = 'active' | 'expired' | 'draft';

interface Promotion {
  key: string;
  name: string;
  discountType: DiscountType;
  discountValue: string;
  validPeriod: string;
  used: number;
  limit: number | null;
  codes: number;
  locations: string[];
  status: PromotionStatus;
}

interface Redemption {
  key: string;
  code: string;
  user: string;
  promotion: string;
  discount: string;
  date: string;
}

// ─── Placeholder Data ──────────────────────────────────────────────

const placeholderPromotions: Promotion[] = [
  {
    key: '1',
    name: 'VISA x FLEX 50%',
    discountType: 'percentage',
    discountValue: '50%',
    validPeriod: 'Dec 1–31, 2024',
    used: 145,
    limit: 500,
    codes: 12,
    locations: ['Stamba', 'Radio City'],
    status: 'active',
  },
  {
    key: '2',
    name: 'New Year Day Pass',
    discountType: 'fixed_amount',
    discountValue: '20 GEL',
    validPeriod: 'Dec 20 – Jan 5',
    used: 89,
    limit: 200,
    codes: 5,
    locations: ['All'],
    status: 'active',
  },
  {
    key: '3',
    name: 'Early Bird Meeting',
    discountType: 'percentage',
    discountValue: '30%',
    validPeriod: 'Ongoing',
    used: 234,
    limit: null,
    codes: 3,
    locations: ['Stamba'],
    status: 'active',
  },
  {
    key: '4',
    name: 'TBC Card Bonus',
    discountType: 'percentage',
    discountValue: '15%',
    validPeriod: 'Nov 1 – Dec 31',
    used: 67,
    limit: 100,
    codes: 8,
    locations: ['All'],
    status: 'active',
  },
  {
    key: '5',
    name: 'First Month Free',
    discountType: 'percentage',
    discountValue: '100%',
    validPeriod: 'Ongoing',
    used: 12,
    limit: 50,
    codes: 1,
    locations: ['All'],
    status: 'active',
  },
  {
    key: '6',
    name: 'Summer Box Deal',
    discountType: 'fixed_amount',
    discountValue: '200 GEL',
    validPeriod: 'Jun–Aug 2024',
    used: 45,
    limit: 100,
    codes: 4,
    locations: ['Batumi'],
    status: 'expired',
  },
  {
    key: '7',
    name: 'Corporate Welcome',
    discountType: 'percentage',
    discountValue: '25%',
    validPeriod: 'Ongoing',
    used: 0,
    limit: null,
    codes: 0,
    locations: ['All'],
    status: 'draft',
  },
  {
    key: '8',
    name: 'Weekend Pass Promo',
    discountType: 'fixed_amount',
    discountValue: '15 GEL',
    validPeriod: 'Jan 1–31, 2025',
    used: 23,
    limit: 300,
    codes: 6,
    locations: ['Stamba', 'Fabrika'],
    status: 'active',
  },
  {
    key: '9',
    name: 'Student Discount',
    discountType: 'percentage',
    discountValue: '20%',
    validPeriod: 'Sep–Dec 2024',
    used: 178,
    limit: 500,
    codes: 10,
    locations: ['All'],
    status: 'expired',
  },
  {
    key: '10',
    name: 'Launch Special',
    discountType: 'percentage',
    discountValue: '40%',
    validPeriod: 'Feb 1–14, 2025',
    used: 0,
    limit: 100,
    codes: 2,
    locations: ['Radio City'],
    status: 'draft',
  },
];

const recentRedemptions: Redemption[] = [
  {
    key: '1',
    code: 'VISA50-A3K9',
    user: 'ნინო კვარაცხელია',
    promotion: 'VISA x FLEX 50%',
    discount: '50% (75 GEL)',
    date: '2024-12-20 14:32',
  },
  {
    key: '2',
    code: 'NEWYEAR-B7X2',
    user: 'გიორგი ბერიძე',
    promotion: 'New Year Day Pass',
    discount: '20 GEL',
    date: '2024-12-20 13:15',
  },
  {
    key: '3',
    code: 'EARLY30-C1M8',
    user: 'მარიამ ჯანელიძე',
    promotion: 'Early Bird Meeting',
    discount: '30% (45 GEL)',
    date: '2024-12-20 11:48',
  },
  {
    key: '4',
    code: 'TBC15-D4N6',
    user: 'ლაშა გელაშვილი',
    promotion: 'TBC Card Bonus',
    discount: '15% (22.5 GEL)',
    date: '2024-12-20 10:20',
  },
  {
    key: '5',
    code: 'VISA50-E9P3',
    user: 'ანა მაჭავარიანი',
    promotion: 'VISA x FLEX 50%',
    discount: '50% (60 GEL)',
    date: '2024-12-20 09:05',
  },
];

// ─── Tag Color Maps ────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  active: '#52c41a',
  expired: '#999',
  draft: '#faad14',
};

const discountTypeColors: Record<DiscountType, string> = {
  percentage: 'blue',
  fixed_amount: 'green',
};

export default function PromotionsPage() {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );
  const [locationFilter, setLocationFilter] = useState<string | undefined>(
    undefined,
  );
  const [activeTab, setActiveTab] = useState('all');

  // Filter promotions based on search, filters, and tab
  const filteredPromotions = placeholderPromotions.filter((promo) => {
    const matchesSearch =
      !searchText ||
      promo.name.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus = !statusFilter || promo.status === statusFilter;

    const matchesLocation =
      !locationFilter ||
      promo.locations.includes(locationFilter) ||
      promo.locations.includes('All');

    const matchesTab =
      activeTab === 'all' || promo.status === activeTab;

    return matchesSearch && matchesStatus && matchesLocation && matchesTab;
  });

  const columns: ColumnsType<Promotion> = [
    {
      title: t('promotions.promotionName'),
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (name: string) => (
        <span style={{ fontWeight: 500 }}>{name}</span>
      ),
    },
    {
      title: t('promotions.discount'),
      key: 'discountType',
      width: 120,
      render: (_, record) => (
        <Tag color={discountTypeColors[record.discountType]}>
          {t(`promotions.discountTypes.${record.discountType}`)}
        </Tag>
      ),
    },
    {
      title: t('promotions.discount'),
      dataIndex: 'discountValue',
      key: 'discountValue',
      width: 100,
      align: 'center',
    },
    {
      title: t('promotions.validPeriod'),
      dataIndex: 'validPeriod',
      key: 'validPeriod',
      width: 160,
      render: (period: string) => (
        <Text>
          {period === 'Ongoing' ? t('promotions.ongoing') : period}
        </Text>
      ),
    },
    {
      title: t('promotions.usage'),
      key: 'usage',
      width: 180,
      render: (_, record) => {
        const percent = record.limit
          ? Math.round((record.used / record.limit) * 100)
          : 30;
        return (
          <div>
            <Progress
              percent={percent}
              size="small"
              strokeColor="#1A1A2E"
              format={() =>
                `${record.used}/${record.limit ?? t('promotions.unlimited')}`
              }
            />
          </div>
        );
      },
    },
    {
      title: t('promotions.codes'),
      dataIndex: 'codes',
      key: 'codes',
      width: 80,
      align: 'center',
    },
    {
      title: t('promotions.locations'),
      dataIndex: 'locations',
      key: 'locations',
      width: 180,
      render: (locations: string[]) => (
        <Space size={4} wrap>
          {locations.map((loc) => (
            <Tag key={loc} style={{ fontSize: 11 }}>
              {loc}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: PromotionStatus) => (
        <Tag color={statusColors[status]}>
          {t(`promotions.statuses.${status}`)}
        </Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 130,
      align: 'center',
      render: () => (
        <Space size="small">
          <Tooltip title={t('common.edit')}>
            <Button type="text" size="small" icon={<EditOutlined />} />
          </Tooltip>
          <Tooltip title={t('promotions.duplicatePromotion')}>
            <Button type="text" size="small" icon={<CopyOutlined />} />
          </Tooltip>
          <Tooltip title={t('promotions.deactivate')}>
            <Button type="text" size="small" icon={<StopOutlined />} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const redemptionColumns: ColumnsType<Redemption> = [
    {
      title: t('promotions.codeUsed'),
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <Text code style={{ fontSize: 12 }}>
          {code}
        </Text>
      ),
    },
    {
      title: t('users.name'),
      dataIndex: 'user',
      key: 'user',
    },
    {
      title: t('promotions.promotionName'),
      dataIndex: 'promotion',
      key: 'promotion',
    },
    {
      title: t('promotions.discountApplied'),
      dataIndex: 'discount',
      key: 'discount',
    },
    {
      title: t('promotions.redemptionDate'),
      dataIndex: 'date',
      key: 'date',
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('promotions.title')}
        actions={
          <Button type="primary" icon={<PlusOutlined />}>
            {t('promotions.createPromotion')}
          </Button>
        }
      />

      {/* ─── Stat Cards ──────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('promotions.activePromotions')}
              value={8}
              prefix={<GiftOutlined style={{ color: '#1A1A2E' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('promotions.totalRedemptions')}
              value={2456}
              prefix={<FireOutlined style={{ color: '#E94560' }} />}
              groupSeparator=","
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('promotions.revenueImpact')}
              value={184500}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              suffix="GEL"
              groupSeparator=","
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false}>
            <Statistic
              title={t('promotions.topPromo')}
              value="VISA x FLEX"
              prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
              suffix={
                <Text style={{ fontSize: 12, color: '#999' }}>
                  (145 {t('promotions.uses')})
                </Text>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* ─── Tabs ────────────────────────────────────────────────── */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ marginBottom: 16 }}
        items={[
          { key: 'all', label: t('common.all') },
          { key: 'active', label: t('promotions.statuses.active') },
          { key: 'expired', label: t('promotions.statuses.expired') },
          { key: 'draft', label: t('promotions.statuses.draft') },
        ]}
      />

      {/* ─── Filter Bar ──────────────────────────────────────────── */}
      <div className="filter-bar">
        <Input
          placeholder={t('promotions.searchPlaceholder')}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Select
          placeholder={t('common.status')}
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
          style={{ width: 160 }}
          options={[
            { value: 'active', label: t('promotions.statuses.active') },
            { value: 'expired', label: t('promotions.statuses.expired') },
            { value: 'draft', label: t('promotions.statuses.draft') },
          ]}
        />
        <Select
          placeholder={t('promotions.locations')}
          value={locationFilter}
          onChange={setLocationFilter}
          allowClear
          style={{ width: 180 }}
          options={[
            { value: 'All', label: 'All' },
            { value: 'Stamba', label: 'Stamba' },
            { value: 'Radio City', label: 'Radio City' },
            { value: 'Fabrika', label: 'Fabrika' },
            { value: 'Batumi', label: 'Batumi' },
          ]}
        />
      </div>

      {/* ─── Promotions Table ──────────────────────────────────── */}
      <Table
        columns={columns}
        dataSource={filteredPromotions}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} ${t('promotions.title').toLowerCase()}`,
        }}
        scroll={{ x: 1300 }}
        size="middle"
        style={{
          background: '#fff',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      />

      {/* ─── Recent Redemptions ────────────────────────────────── */}
      <Card
        title={t('promotions.recentRedemptions')}
        bordered={false}
        style={{ borderRadius: 12, marginTop: 24 }}
      >
        <Table
          columns={redemptionColumns}
          dataSource={recentRedemptions}
          pagination={false}
          size="small"
          style={{
            borderRadius: 12,
            overflow: 'hidden',
          }}
        />
      </Card>
    </div>
  );
}
