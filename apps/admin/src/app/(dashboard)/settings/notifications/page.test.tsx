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
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Legend: () => null,
}));

import NotificationsPage from './page';

describe('NotificationsPage', () => {
  it('renders without crashing', () => {
    render(<NotificationsPage />);
  });

  it('displays the page header with the notifications title', () => {
    render(<NotificationsPage />);
    expect(screen.getByText('notifications.title')).toBeInTheDocument();
  });

  it('renders the send broadcast button', () => {
    render(<NotificationsPage />);
    expect(
      screen.getByText('notifications.sendBroadcast'),
    ).toBeInTheDocument();
  });

  it('renders stat cards', () => {
    render(<NotificationsPage />);
    expect(
      screen.getByText('notifications.totalSentToday'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('notifications.deliveryRate'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('notifications.pushEnabledUsers'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('notifications.unreadRate'),
    ).toBeInTheDocument();
  });

  it('renders notification template names in the table', () => {
    render(<NotificationsPage />);
    expect(screen.getByText('Booking Confirmation')).toBeInTheDocument();
    expect(screen.getByText('Payment Receipt')).toBeInTheDocument();
    expect(screen.getByText('Pass Expiring Soon')).toBeInTheDocument();
    expect(screen.getByText('Welcome Message')).toBeInTheDocument();
  });

  it('renders the delivery stats chart section', () => {
    render(<NotificationsPage />);
    expect(
      screen.getByText('notifications.deliveryStats'),
    ).toBeInTheDocument();
  });

  it('renders the search input placeholder', () => {
    render(<NotificationsPage />);
    expect(
      screen.getByPlaceholderText('notifications.searchPlaceholder'),
    ).toBeInTheDocument();
  });
});
