'use client';

import React from 'react';
import {
  Tabs,
  Form,
  Input,
  Select,
  Button,
  Card,
  Table,
  Tag,
  Space,
  Typography,
  Switch,
  Divider,
  Empty,
} from 'antd';
import {
  SaveOutlined,
  PlusOutlined,
  EnvironmentOutlined,
  ShoppingOutlined,
  DollarOutlined,
  BellOutlined,
  GiftOutlined,
  LockOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/PageHeader';

const { Text, Paragraph } = Typography;

// ─── General Settings Tab ──────────────────────────────────────────

function GeneralTab() {
  const { t } = useTranslation();

  return (
    <Card bordered={false} style={{ borderRadius: 12 }}>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        {t('settings.generalDescription')}
      </Paragraph>

      <Form layout="vertical" style={{ maxWidth: 600 }} initialValues={{
        appName: 'D Block Workspace',
        timezone: 'Asia/Tbilisi',
        currency: 'GEL',
        supportEmail: 'support@dblock.ge',
      }}>
        <Form.Item label={t('settings.appName')} name="appName">
          <Input placeholder="D Block Workspace" />
        </Form.Item>

        <Form.Item label={t('settings.timezone')} name="timezone">
          <Select
            options={[
              { value: 'Asia/Tbilisi', label: 'Asia/Tbilisi (GMT+4)' },
              { value: 'Europe/London', label: 'Europe/London (GMT+0)' },
              { value: 'America/New_York', label: 'America/New_York (GMT-5)' },
            ]}
          />
        </Form.Item>

        <Form.Item label={t('settings.currency')} name="currency">
          <Select
            options={[
              { value: 'GEL', label: 'GEL - Georgian Lari' },
              { value: 'USD', label: 'USD - US Dollar' },
              { value: 'EUR', label: 'EUR - Euro' },
            ]}
          />
        </Form.Item>

        <Form.Item label={t('settings.supportEmail')} name="supportEmail">
          <Input type="email" placeholder="support@dblock.ge" />
        </Form.Item>

        <Divider />

        <Form.Item>
          <Button type="primary" icon={<SaveOutlined />}>
            {t('common.save')}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

// ─── Locations Tab ─────────────────────────────────────────────────

function LocationsTab() {
  const { t } = useTranslation();

  const locations = [
    {
      key: '1',
      name: 'D Block Vera',
      city: 'Tbilisi',
      address: '12 Barnovi St',
      status: 'active',
      resources: 45,
    },
    {
      key: '2',
      name: 'D Block Vake',
      city: 'Tbilisi',
      address: '24 Chavchavadze Ave',
      status: 'active',
      resources: 38,
    },
    {
      key: '3',
      name: 'D Block Saburtalo',
      city: 'Tbilisi',
      address: '8 Pekini Ave',
      status: 'active',
      resources: 30,
    },
    {
      key: '4',
      name: 'D Block Old Tbilisi',
      city: 'Tbilisi',
      address: '5 Leselidze St',
      status: 'inactive',
      resources: 22,
    },
  ];

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'City', dataIndex: 'city', key: 'city' },
    { title: 'Address', dataIndex: 'address', key: 'address' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status === 'active' ? t('common.active') : t('common.inactive')}
        </Tag>
      ),
    },
    {
      title: 'Resources',
      dataIndex: 'resources',
      key: 'resources',
      align: 'center' as const,
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: () => (
        <Button type="link" size="small">
          {t('common.edit')}
        </Button>
      ),
    },
  ];

  return (
    <Card
      bordered={false}
      style={{ borderRadius: 12 }}
      extra={
        <Button type="primary" size="small" icon={<PlusOutlined />}>
          Add Location
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={locations}
        pagination={false}
        size="middle"
      />
    </Card>
  );
}

// ─── Products Tab ──────────────────────────────────────────────────

function ProductsTab() {
  const { t } = useTranslation();

  const products = [
    {
      key: '1',
      name: 'Hot Desk Day Pass',
      type: 'day_pass',
      price: '45 GEL',
      status: 'active',
    },
    {
      key: '2',
      name: 'Meeting Room (Hourly)',
      type: 'hourly',
      price: '60 GEL/hr',
      status: 'active',
    },
    {
      key: '3',
      name: 'Fixed Desk Monthly',
      type: 'monthly',
      price: '850 GEL/mo',
      status: 'active',
    },
    {
      key: '4',
      name: 'Private Office',
      type: 'monthly',
      price: '2,500 GEL/mo',
      status: 'active',
    },
    {
      key: '5',
      name: 'Event Space',
      type: 'hourly',
      price: '200 GEL/hr',
      status: 'active',
    },
  ];

  const columns = [
    { title: 'Product Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag>{type.replace('_', ' ')}</Tag>,
    },
    { title: 'Price', dataIndex: 'price', key: 'price' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status === 'active' ? t('common.active') : t('common.inactive')}
        </Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: () => (
        <Button type="link" size="small">
          {t('common.edit')}
        </Button>
      ),
    },
  ];

  return (
    <Card
      bordered={false}
      style={{ borderRadius: 12 }}
      extra={
        <Button type="primary" size="small" icon={<PlusOutlined />}>
          Add Product
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={products}
        pagination={false}
        size="middle"
      />
    </Card>
  );
}

// ─── Placeholder Tab ───────────────────────────────────────────────

function PlaceholderTab({ name }: { name: string }) {
  return (
    <Card bordered={false} style={{ borderRadius: 12 }}>
      <Empty description={`${name} settings will be configured here`} />
    </Card>
  );
}

// ─── Notifications Tab ─────────────────────────────────────────────

function NotificationsTab() {
  return (
    <Card bordered={false} style={{ borderRadius: 12 }}>
      <Form layout="vertical" style={{ maxWidth: 600 }}>
        <Text strong style={{ display: 'block', marginBottom: 16 }}>
          Email Notifications
        </Text>

        <Form.Item label="Booking confirmations">
          <Switch defaultChecked />
        </Form.Item>

        <Form.Item label="Payment receipts">
          <Switch defaultChecked />
        </Form.Item>

        <Form.Item label="Cancellation alerts">
          <Switch defaultChecked />
        </Form.Item>

        <Divider />

        <Text strong style={{ display: 'block', marginBottom: 16 }}>
          Push Notifications
        </Text>

        <Form.Item label="New bookings">
          <Switch defaultChecked />
        </Form.Item>

        <Form.Item label="Support tickets">
          <Switch defaultChecked />
        </Form.Item>

        <Form.Item label="Low occupancy alerts">
          <Switch />
        </Form.Item>

        <Divider />

        <Form.Item>
          <Button type="primary" icon={<SaveOutlined />}>
            Save Notification Settings
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

// ─── Settings Page ─────────────────────────────────────────────────

export default function SettingsPage() {
  const { t } = useTranslation();

  const tabItems = [
    {
      key: 'general',
      label: (
        <Space>
          <SettingOutlined />
          {t('settings.general')}
        </Space>
      ),
      children: <GeneralTab />,
    },
    {
      key: 'locations',
      label: (
        <Space>
          <EnvironmentOutlined />
          {t('settings.locations')}
        </Space>
      ),
      children: <LocationsTab />,
    },
    {
      key: 'products',
      label: (
        <Space>
          <ShoppingOutlined />
          {t('settings.products')}
        </Space>
      ),
      children: <ProductsTab />,
    },
    {
      key: 'rates',
      label: (
        <Space>
          <DollarOutlined />
          {t('settings.rates')}
        </Space>
      ),
      children: <PlaceholderTab name="Rates" />,
    },
    {
      key: 'notifications',
      label: (
        <Space>
          <BellOutlined />
          {t('settings.notifications')}
        </Space>
      ),
      children: <NotificationsTab />,
    },
    {
      key: 'promotions',
      label: (
        <Space>
          <GiftOutlined />
          {t('settings.promotions')}
        </Space>
      ),
      children: <PlaceholderTab name="Promotions" />,
    },
    {
      key: 'roles',
      label: (
        <Space>
          <LockOutlined />
          {t('settings.roles')}
        </Space>
      ),
      children: <PlaceholderTab name="Roles & Permissions" />,
    },
  ];

  return (
    <div>
      <PageHeader title={t('settings.title')} />
      <Tabs
        defaultActiveKey="general"
        items={tabItems}
        tabPosition="left"
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 16,
          minHeight: 500,
        }}
      />
    </div>
  );
}
