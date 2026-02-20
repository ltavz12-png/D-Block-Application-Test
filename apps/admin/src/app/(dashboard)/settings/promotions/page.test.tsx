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

import PromotionsPage from './page';

describe('PromotionsPage', () => {
  it('renders without crashing', () => {
    render(<PromotionsPage />);
  });

  it('displays the page header with the promotions title', () => {
    render(<PromotionsPage />);
    expect(screen.getByText('promotions.title')).toBeInTheDocument();
  });

  it('renders the create promotion button', () => {
    render(<PromotionsPage />);
    expect(
      screen.getByText('promotions.createPromotion'),
    ).toBeInTheDocument();
  });

  it('renders stat cards', () => {
    render(<PromotionsPage />);
    expect(
      screen.getByText('promotions.activePromotions'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('promotions.totalRedemptions'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('promotions.revenueImpact'),
    ).toBeInTheDocument();
    expect(screen.getByText('promotions.topPromo')).toBeInTheDocument();
  });

  it('renders tabs for filtering promotions', () => {
    render(<PromotionsPage />);
    expect(screen.getByText('common.all')).toBeInTheDocument();
    expect(
      screen.getByText('promotions.statuses.active'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('promotions.statuses.expired'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('promotions.statuses.draft'),
    ).toBeInTheDocument();
  });

  it('renders promotion names in the table', () => {
    render(<PromotionsPage />);
    expect(screen.getByText('VISA x FLEX 50%')).toBeInTheDocument();
    expect(screen.getByText('New Year Day Pass')).toBeInTheDocument();
    expect(screen.getByText('Early Bird Meeting')).toBeInTheDocument();
  });

  it('renders the recent redemptions section', () => {
    render(<PromotionsPage />);
    expect(
      screen.getByText('promotions.recentRedemptions'),
    ).toBeInTheDocument();
  });

  it('renders the search input placeholder', () => {
    render(<PromotionsPage />);
    expect(
      screen.getByPlaceholderText('promotions.searchPlaceholder'),
    ).toBeInTheDocument();
  });
});
