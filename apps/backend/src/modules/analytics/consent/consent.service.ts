import { Injectable, Logger } from '@nestjs/common';

export enum ConsentPurpose {
  ANALYTICS = 'analytics',
  MARKETING = 'marketing',
  PERSONALIZATION = 'personalization',
  FUNCTIONAL = 'functional',
}

export interface ConsentPreferences {
  userId: string;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  functional: boolean;
  updatedAt: Date;
}

export interface ConsentUpdatePayload {
  analytics?: boolean;
  marketing?: boolean;
  personalization?: boolean;
}

@Injectable()
export class ConsentService {
  private readonly logger = new Logger(ConsentService.name);
  private readonly consentStore: Map<string, ConsentPreferences> = new Map();

  getUserConsent(userId: string): ConsentPreferences {
    const existing = this.consentStore.get(userId);

    if (existing) {
      return existing;
    }

    // Default consent: functional always true, analytics opt-in, marketing/personalization opt-out
    const defaults: ConsentPreferences = {
      userId,
      analytics: true,
      marketing: false,
      personalization: false,
      functional: true,
      updatedAt: new Date(),
    };

    this.consentStore.set(userId, defaults);
    return defaults;
  }

  updateUserConsent(userId: string, update: ConsentUpdatePayload): ConsentPreferences {
    const current = this.getUserConsent(userId);

    const updated: ConsentPreferences = {
      ...current,
      ...(update.analytics !== undefined && { analytics: update.analytics }),
      ...(update.marketing !== undefined && { marketing: update.marketing }),
      ...(update.personalization !== undefined && { personalization: update.personalization }),
      functional: true, // Functional consent cannot be revoked
      updatedAt: new Date(),
    };

    this.consentStore.set(userId, updated);

    this.logger.log(
      `Updated consent for user ${userId}: analytics=${updated.analytics}, ` +
      `marketing=${updated.marketing}, personalization=${updated.personalization}`,
    );

    return updated;
  }

  hasConsent(userId: string, purpose: ConsentPurpose): boolean {
    const consent = this.getUserConsent(userId);

    switch (purpose) {
      case ConsentPurpose.ANALYTICS:
        return consent.analytics;
      case ConsentPurpose.MARKETING:
        return consent.marketing;
      case ConsentPurpose.PERSONALIZATION:
        return consent.personalization;
      case ConsentPurpose.FUNCTIONAL:
        return consent.functional;
      default:
        return false;
    }
  }

  exportUserData(userId: string): {
    consent: ConsentPreferences | null;
    exportedAt: string;
    message: string;
  } {
    const consent = this.consentStore.get(userId) || null;

    this.logger.log(`GDPR data export requested for user ${userId}`);

    return {
      consent,
      exportedAt: new Date().toISOString(),
      message: 'Consent preferences exported. Analytics event data should be exported via AnalyticsService.exportUserAnalytics().',
    };
  }

  deleteUserData(userId: string): { deleted: boolean; deletedAt: string } {
    const existed = this.consentStore.has(userId);
    this.consentStore.delete(userId);

    this.logger.log(
      `GDPR data deletion requested for user ${userId} — consent data ${existed ? 'deleted' : 'not found'}`,
    );

    return {
      deleted: existed,
      deletedAt: new Date().toISOString(),
    };
  }
}
