// Mock the auth module so we can use the UserRole enum without importing the api module
jest.mock('@/lib/api', () => ({}));

import { getMenuItemsByRole, menuItems } from './menus';
import { UserRole } from '@/lib/auth';

describe('menus', () => {
  describe('menuItems', () => {
    it('is defined and is a non-empty array', () => {
      expect(Array.isArray(menuItems)).toBe(true);
      expect(menuItems.length).toBeGreaterThan(0);
    });

    it('every item has required fields', () => {
      menuItems.forEach((item) => {
        expect(item).toHaveProperty('key');
        expect(item).toHaveProperty('label');
        expect(item).toHaveProperty('icon');
        expect(item).toHaveProperty('path');
        expect(item).toHaveProperty('roles');
        expect(Array.isArray(item.roles)).toBe(true);
      });
    });
  });

  describe('getMenuItemsByRole', () => {
    it('returns items for SUPER_ADMIN including all top-level menus', () => {
      const items = getMenuItemsByRole(UserRole.SUPER_ADMIN);
      const keys = items.map((i) => i.key);
      expect(keys).toContain('dashboard');
      expect(keys).toContain('users');
      expect(keys).toContain('bookings');
      expect(keys).toContain('finance');
      expect(keys).toContain('operations');
      expect(keys).toContain('reports');
      expect(keys).toContain('settings');
    });

    it('returns finance menu items for FINANCE_ADMIN', () => {
      const items = getMenuItemsByRole(UserRole.FINANCE_ADMIN);
      const keys = items.map((i) => i.key);
      expect(keys).toContain('finance');
      expect(keys).toContain('dashboard');
      expect(keys).toContain('bookings');
    });

    it('does not return finance menu for RECEPTION_STAFF', () => {
      const items = getMenuItemsByRole(UserRole.RECEPTION_STAFF);
      const keys = items.map((i) => i.key);
      expect(keys).not.toContain('finance');
      expect(keys).not.toContain('users');
      expect(keys).not.toContain('settings');
    });

    it('does not return users or settings for SUPPORT_AGENT', () => {
      const items = getMenuItemsByRole(UserRole.SUPPORT_AGENT);
      const keys = items.map((i) => i.key);
      expect(keys).not.toContain('users');
      expect(keys).not.toContain('settings');
      expect(keys).toContain('dashboard');
      expect(keys).toContain('bookings');
    });

    it('returns settings menu with children for MARKETING_ADMIN', () => {
      const items = getMenuItemsByRole(UserRole.MARKETING_ADMIN);
      const settings = items.find((i) => i.key === 'settings');
      expect(settings).toBeDefined();
      expect(settings!.children).toBeDefined();
      expect(settings!.children!.length).toBeGreaterThan(0);

      const childKeys = settings!.children!.map((c) => c.key);
      expect(childKeys).toContain('settings-notifications');
      expect(childKeys).toContain('settings-promotions');
      expect(childKeys).toContain('settings-analytics');
    });

    it('filters out children that the role does not have access to', () => {
      const items = getMenuItemsByRole(UserRole.MARKETING_ADMIN);
      const settings = items.find((i) => i.key === 'settings');
      const childKeys = settings!.children!.map((c) => c.key);
      // settings-general is only for SUPER_ADMIN
      expect(childKeys).not.toContain('settings-general');
    });

    it('returns correct items for LOCATION_MANAGER', () => {
      const items = getMenuItemsByRole(UserRole.LOCATION_MANAGER);
      const keys = items.map((i) => i.key);
      expect(keys).toContain('users');
      expect(keys).toContain('b2b');
      expect(keys).toContain('dashboard');
      expect(keys).not.toContain('finance');
      expect(keys).not.toContain('settings');
    });
  });
});
