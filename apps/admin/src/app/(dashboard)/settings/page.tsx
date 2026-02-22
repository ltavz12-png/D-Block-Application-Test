'use client';

import React, { useState } from 'react';
import {
  Tabs,
  Form,
  Input,
  InputNumber,
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
  Modal,
  message,
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
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/PageHeader';
import {
  useAdminProducts,
  useDeleteProduct,
  useCreateProduct,
  useUpdateProduct,
  useLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from '@/lib/api-hooks';
import type { AdminProduct, Location } from '@/lib/types';
import { ProductType, BillingPeriod } from '@/lib/types';

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

// ─── Locations Tab (Real API) ─────────────────────────────────────

function LocationsTab() {
  const { t } = useTranslation();
  const { data: locations, isLoading } = useLocations();
  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  const deleteMutation = useDeleteLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [form] = Form.useForm();

  function openCreate() {
    setEditingLocation(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, currency: 'GEL' });
    setModalOpen(true);
  }

  function openEdit(loc: Location) {
    setEditingLocation(loc);
    form.setFieldsValue({
      name: loc.name,
      city: loc.city,
      address: loc.address,
      phone: loc.phone,
      email: loc.email,
      currency: loc.currency,
      isActive: loc.isActive,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    try {
      const values = await form.validateFields();
      if (editingLocation) {
        await updateMutation.mutateAsync({ id: editingLocation.id, ...values });
        message.success('Location updated');
      } else {
        await createMutation.mutateAsync(values);
        message.success('Location created');
      }
      setModalOpen(false);
    } catch {
      // validation error
    }
  }

  function handleDelete(loc: Location) {
    Modal.confirm({
      title: `Delete "${loc.name}"?`,
      content: 'This will remove the location and may affect associated resources.',
      okText: t('common.delete'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync(loc.id);
          message.success('Location deleted');
        } catch {
          message.error('Failed to delete location');
        }
      },
    });
  }

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'City', dataIndex: 'city', key: 'city' },
    { title: 'Address', dataIndex: 'address', key: 'address' },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? t('common.active') : t('common.inactive')}
        </Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: any, record: Location) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            {t('common.edit')}
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        bordered={false}
        style={{ borderRadius: 12 }}
        extra={
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>
            Add Location
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={locations ?? []}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          size="middle"
        />
      </Card>

      <Modal
        title={editingLocation ? 'Edit Location' : 'Create Location'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText={editingLocation ? t('common.save') : t('common.create')}
        cancelText={t('common.cancel')}
        width={520}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Location name is required' }]}>
            <Input placeholder="e.g. D Block Vake" />
          </Form.Item>
          <Form.Item name="city" label="City" rules={[{ required: true, message: 'City is required' }]}>
            <Input placeholder="e.g. Tbilisi" />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input placeholder="e.g. 12 Chavchavadze Ave" />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input placeholder="+995 ..." />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input type="email" placeholder="location@dblock.ge" />
          </Form.Item>
          <Form.Item name="currency" label="Currency" rules={[{ required: true }]}>
            <Select options={[
              { value: 'GEL', label: 'GEL' },
              { value: 'USD', label: 'USD' },
              { value: 'EUR', label: 'EUR' },
            ]} />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

// ─── Products Tab ──────────────────────────────────────────────────

const productTypeOptions = Object.values(ProductType).map((v) => ({
  value: v,
  label: v.replace(/_/g, ' '),
}));

const billingPeriodOptions = Object.values(BillingPeriod).map((v) => ({
  value: v,
  label: v.replace(/_/g, ' '),
}));

function ProductsTab() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminProducts({ page, limit: 20 });
  const deleteMutation = useDeleteProduct();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [form] = Form.useForm();

  function openCreate() {
    setEditingProduct(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, sortOrder: 0, features: '', billingPeriod: BillingPeriod.MONTHLY, productType: ProductType.COWORKING_PASS });
    setModalOpen(true);
  }

  function openEdit(product: AdminProduct) {
    setEditingProduct(product);
    form.setFieldsValue({
      name: product.name,
      nameKa: product.nameKa,
      description: product.description,
      descriptionKa: product.descriptionKa,
      productType: product.productType,
      billingPeriod: product.billingPeriod,
      sortOrder: product.sortOrder,
      isActive: product.isActive,
      features: (product.features ?? []).join('\n'),
      featuresKa: (product.featuresKa ?? []).join('\n'),
    });
    setModalOpen(true);
  }

  async function handleSave() {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        features: values.features ? values.features.split('\n').filter((f: string) => f.trim()) : [],
        featuresKa: values.featuresKa ? values.featuresKa.split('\n').filter((f: string) => f.trim()) : [],
      };
      if (editingProduct) {
        await updateMutation.mutateAsync({ id: editingProduct.id, ...payload });
        message.success('Product updated');
      } else {
        await createMutation.mutateAsync(payload);
        message.success('Product created');
      }
      setModalOpen(false);
    } catch {
      // validation error
    }
  }

  function handleDelete(product: AdminProduct) {
    Modal.confirm({
      title: `Delete "${product.name}"?`,
      content: 'This action cannot be undone.',
      okText: t('common.delete'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync(product.id);
          message.success('Product deleted');
        } catch {
          message.error('Failed to delete product');
        }
      },
    });
  }

  const columns = [
    { title: 'Product Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Type',
      dataIndex: 'productType',
      key: 'productType',
      render: (type: string) => <Tag>{type.replace(/_/g, ' ')}</Tag>,
    },
    {
      title: 'Billing',
      dataIndex: 'billingPeriod',
      key: 'billingPeriod',
      render: (period: string) => <Tag color="blue">{period.replace(/_/g, ' ')}</Tag>,
    },
    {
      title: 'Price',
      key: 'price',
      render: (_: any, record: AdminProduct) => {
        const rate = record.rateCodes?.[0];
        if (!rate) return '—';
        return `${Number(rate.amount).toFixed(2)} ${rate.currency}`;
      },
    },
    {
      title: 'Rate Codes',
      key: 'rateCount',
      align: 'center' as const,
      render: (_: any, record: AdminProduct) => (
        <Tag color="purple">{record.rateCodes?.length ?? 0}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? t('common.active') : t('common.inactive')}
        </Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: any, record: AdminProduct) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            {t('common.edit')}
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        bordered={false}
        style={{ borderRadius: 12 }}
        extra={
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>
            Add Product
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data?.data ?? []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            total: data?.total ?? 0,
            pageSize: 20,
            onChange: setPage,
            showSizeChanger: false,
          }}
          size="middle"
          expandable={{
            expandedRowRender: (record: AdminProduct) => (
              <Table
                dataSource={record.rateCodes ?? []}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  { title: 'Code', dataIndex: 'code', key: 'code' },
                  { title: 'Name', dataIndex: 'name', key: 'name' },
                  {
                    title: 'Amount',
                    key: 'amount',
                    render: (_: any, rate: any) => `${Number(rate.amount).toFixed(2)} ${rate.currency}`,
                  },
                  {
                    title: 'Tax Rate',
                    dataIndex: 'taxRate',
                    key: 'taxRate',
                    render: (v: string) => `${Number(v)}%`,
                  },
                  {
                    title: 'Status',
                    dataIndex: 'isActive',
                    key: 'isActive',
                    render: (isActive: boolean) => (
                      <Tag color={isActive ? 'green' : 'default'}>
                        {isActive ? 'Active' : 'Inactive'}
                      </Tag>
                    ),
                  },
                ]}
              />
            ),
          }}
        />
      </Card>

      <Modal
        title={editingProduct ? `Edit: ${editingProduct.name}` : 'Create Product'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText={editingProduct ? t('common.save') : t('common.create')}
        cancelText={t('common.cancel')}
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Product Name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input placeholder="e.g. Starter Plan" />
          </Form.Item>
          <Form.Item name="nameKa" label="Name (Georgian)">
            <Input placeholder="e.g. სტარტერ გეგმა" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="productType" label="Product Type" rules={[{ required: true }]}>
              <Select options={productTypeOptions} />
            </Form.Item>
            <Form.Item name="billingPeriod" label="Billing Period" rules={[{ required: true }]}>
              <Select options={billingPeriodOptions} />
            </Form.Item>
          </div>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Short description of the product" />
          </Form.Item>
          <Form.Item name="descriptionKa" label="Description (Georgian)">
            <Input.TextArea rows={2} placeholder="პროდუქტის აღწერა" />
          </Form.Item>
          <Form.Item name="features" label="Features (one per line)">
            <Input.TextArea rows={3} placeholder={"WiFi access\nCommunity events\nLocker included"} />
          </Form.Item>
          <Form.Item name="featuresKa" label="Features Georgian (one per line)">
            <Input.TextArea rows={3} placeholder={"WiFi წვდომა\nსათემო ღონისძიებები"} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="sortOrder" label="Sort Order">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="isActive" label="Active" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </>
  );
}

// ─── Rates Tab ────────────────────────────────────────────────────

function RatesTab() {
  const { t } = useTranslation();
  const { data, isLoading } = useAdminProducts({ page: 1, limit: 100 });

  const allRates = (data?.data ?? []).flatMap((product) =>
    (product.rateCodes ?? []).map((rate) => ({
      ...rate,
      productName: product.name,
      productType: product.productType,
      billingPeriod: product.billingPeriod,
    })),
  );

  const columns = [
    { title: 'Product', dataIndex: 'productName', key: 'productName' },
    {
      title: 'Type',
      dataIndex: 'productType',
      key: 'productType',
      render: (type: string) => <Tag>{type.replace(/_/g, ' ')}</Tag>,
    },
    { title: 'Code', dataIndex: 'code', key: 'code' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Amount',
      key: 'amount',
      render: (_: any, record: any) => (
        <Text strong>{Number(record.amount).toFixed(2)} {record.currency}</Text>
      ),
    },
    {
      title: 'Tax Rate',
      dataIndex: 'taxRate',
      key: 'taxRate',
      render: (v: string) => `${Number(v)}%`,
    },
    {
      title: 'Billing',
      dataIndex: 'billingPeriod',
      key: 'billingPeriod',
      render: (period: string) => <Tag color="blue">{period.replace(/_/g, ' ')}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? t('common.active') : t('common.inactive')}
        </Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: () => (
        <Button type="link" size="small" icon={<EditOutlined />}>
          {t('common.edit')}
        </Button>
      ),
    },
  ];

  return (
    <Card bordered={false} style={{ borderRadius: 12 }}>
      <Paragraph type="secondary" style={{ marginBottom: 16 }}>
        All rate codes across products. Edit rates to change pricing for membership plans, day passes, and other products.
      </Paragraph>
      <Table
        columns={columns}
        dataSource={allRates}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        size="middle"
      />
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

// ─── Promotions Tab ────────────────────────────────────────────────

function PromotionsTab() {
  const { t } = useTranslation();

  const promos = [
    { key: '1', name: 'Welcome 20%', code: 'WELCOME20', discount: '20%', type: 'percentage', usageCount: 45, maxUses: 100, status: 'active' },
    { key: '2', name: 'First Month Free', code: 'FIRSTFREE', discount: '100%', type: 'percentage', usageCount: 12, maxUses: 50, status: 'active' },
    { key: '3', name: 'Summer Special', code: 'SUMMER24', discount: '50 GEL', type: 'fixed', usageCount: 88, maxUses: 100, status: 'expired' },
  ];

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Code', dataIndex: 'code', key: 'code', render: (code: string) => <Tag color="purple">{code}</Tag> },
    { title: 'Discount', dataIndex: 'discount', key: 'discount' },
    {
      title: 'Usage',
      key: 'usage',
      render: (_: any, record: any) => `${record.usageCount} / ${record.maxUses}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status === 'active' ? t('common.active') : 'Expired'}
        </Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: () => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />}>
            {t('common.edit')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      bordered={false}
      style={{ borderRadius: 12 }}
      extra={
        <Button type="primary" size="small" icon={<PlusOutlined />}>
          Add Promotion
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={promos}
        pagination={false}
        size="middle"
      />
    </Card>
  );
}

// ─── Roles & Permissions Tab ──────────────────────────────────────

function RolesTab() {
  const { t } = useTranslation();

  const roles = [
    {
      key: 'super_admin',
      name: 'Super Admin',
      description: 'Full system access. Can manage all settings, users, and data.',
      permissions: ['All permissions'],
      userCount: 1,
      color: 'red',
    },
    {
      key: 'finance_admin',
      name: 'Finance Admin',
      description: 'Access to invoices, payments, revenue, accounting periods, and contracts.',
      permissions: ['Invoices', 'Payments', 'Revenue', 'Contracts', 'Companies'],
      userCount: 2,
      color: 'gold',
    },
    {
      key: 'location_manager',
      name: 'Location Manager',
      description: 'Manage bookings, resources, visitors, and access at assigned locations.',
      permissions: ['Bookings', 'Resources', 'Visitors', 'Access Control'],
      userCount: 4,
      color: 'blue',
    },
    {
      key: 'reception_staff',
      name: 'Reception Staff',
      description: 'Check in/out visitors, view today\'s bookings and visitor list.',
      permissions: ['Visitor Check-in', 'View Bookings', 'View Visitors'],
      userCount: 6,
      color: 'cyan',
    },
    {
      key: 'marketing_admin',
      name: 'Marketing Admin',
      description: 'Manage promotions, send notifications and broadcasts.',
      permissions: ['Promotions', 'Notifications', 'Analytics'],
      userCount: 2,
      color: 'purple',
    },
    {
      key: 'support_agent',
      name: 'Support Agent',
      description: 'Handle support tickets and user inquiries.',
      permissions: ['Support Tickets', 'View Users'],
      userCount: 3,
      color: 'green',
    },
    {
      key: 'member',
      name: 'Member',
      description: 'Standard member with access to bookings, passes, and community features.',
      permissions: ['Own Bookings', 'Own Passes', 'Own Profile', 'Community'],
      userCount: 156,
      color: 'default',
    },
  ];

  const columns = [
    {
      title: 'Role',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <Tag color={record.color}>{name}</Tag>
      ),
    },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (perms: string[]) => (
        <Space wrap>
          {perms.map((p) => <Tag key={p}>{p}</Tag>)}
        </Space>
      ),
    },
    {
      title: 'Users',
      dataIndex: 'userCount',
      key: 'userCount',
      align: 'center' as const,
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: any, record: any) =>
        record.key !== 'super_admin' ? (
          <Button type="link" size="small" icon={<EditOutlined />}>
            {t('common.edit')}
          </Button>
        ) : null,
    },
  ];

  return (
    <Card bordered={false} style={{ borderRadius: 12 }}>
      <Paragraph type="secondary" style={{ marginBottom: 16 }}>
        Manage user roles and their associated permissions. Role-based access control determines what each user type can see and do in the system.
      </Paragraph>
      <Table
        columns={columns}
        dataSource={roles}
        pagination={false}
        size="middle"
      />
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
      children: <RatesTab />,
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
      children: <PromotionsTab />,
    },
    {
      key: 'roles',
      label: (
        <Space>
          <LockOutlined />
          {t('settings.roles')}
        </Space>
      ),
      children: <RolesTab />,
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
