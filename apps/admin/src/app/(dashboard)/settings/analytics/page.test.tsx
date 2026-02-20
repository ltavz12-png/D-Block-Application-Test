import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: jest.fn() },
  }),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/',
}));

// Mock recharts to avoid rendering issues in jsdom
jest.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => <div data-testid="pie" />,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Legend: () => null,
}));

import AnalyticsPage from './page';

describe('AnalyticsPage', () => {
  it('renders without crashing', () => {
    render(<AnalyticsPage />);
  });

  it('displays the page header with the analytics title', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText('analytics.title')).toBeInTheDocument();
  });

  it('displays the analytics subtitle', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText('analytics.subtitle')).toBeInTheDocument();
  });

  it('renders stat cards', () => {
    render(<AnalyticsPage />);
    expect(
      screen.getByText('analytics.activeUsers7d'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('analytics.totalEvents'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('analytics.avgSessionDuration'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('analytics.conversionRate'),
    ).toBeInTheDocument();
  });

  it('renders the user funnel section', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText('analytics.userFunnel')).toBeInTheDocument();
  });

  it('renders chart sections', () => {
    render(<AnalyticsPage />);
    expect(
      screen.getByText('analytics.activeUsersOverTime'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('analytics.platformBreakdown'),
    ).toBeInTheDocument();
  });

  it('renders the top events table section', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText('analytics.topEvents')).toBeInTheDocument();
  });

  it('renders GDPR consent section', () => {
    render(<AnalyticsPage />);
    expect(
      screen.getByText('analytics.gdprConsent'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('analytics.analyticsConsent'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('analytics.marketingConsent'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('analytics.personalizationConsent'),
    ).toBeInTheDocument();
  });

  it('renders event names in the top events table', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText('user.login')).toBeInTheDocument();
    expect(screen.getByText('booking.viewed')).toBeInTheDocument();
    expect(screen.getByText('payment.completed')).toBeInTheDocument();
  });
});
