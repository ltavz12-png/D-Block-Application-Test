import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  ISaltoKsGateway,
  SaltoUser,
  SaltoAccessGroup,
  SaltoKey,
  SaltoEvent,
} from './salto-ks.interface';

@Injectable()
export class SaltoKsMockGateway implements ISaltoKsGateway {
  private readonly logger = new Logger(SaltoKsMockGateway.name);

  private users = new Map<string, SaltoUser>();
  private keys = new Map<string, SaltoKey>();
  private accessGroups = new Map<string, SaltoAccessGroup>();
  private events: SaltoEvent[] = [];

  constructor() {
    this.seedAccessGroups();
    this.logger.log('SaltoKS Mock Gateway initialized with seeded data');
  }

  private seedAccessGroups(): void {
    const groups: SaltoAccessGroup[] = [
      {
        id: uuidv4(),
        name: 'Stamba Common Areas',
        doorIds: ['door-stamba-main', 'door-stamba-lobby', 'door-stamba-cowork'],
      },
      {
        id: uuidv4(),
        name: 'Stamba All Areas',
        doorIds: [
          'door-stamba-main',
          'door-stamba-lobby',
          'door-stamba-cowork',
          'door-stamba-office-1',
          'door-stamba-office-2',
          'door-stamba-meeting-1',
          'door-stamba-meeting-2',
        ],
      },
      {
        id: uuidv4(),
        name: 'Radio City Common Areas',
        doorIds: ['door-radio-main', 'door-radio-lobby', 'door-radio-cowork'],
      },
      {
        id: uuidv4(),
        name: 'Radio City All Areas',
        doorIds: [
          'door-radio-main',
          'door-radio-lobby',
          'door-radio-cowork',
          'door-radio-office-1',
          'door-radio-office-2',
          'door-radio-meeting-1',
        ],
      },
      {
        id: uuidv4(),
        name: 'Batumi Common Areas',
        doorIds: ['door-batumi-main', 'door-batumi-lobby', 'door-batumi-cowork'],
      },
      {
        id: uuidv4(),
        name: 'Batumi All Areas',
        doorIds: [
          'door-batumi-main',
          'door-batumi-lobby',
          'door-batumi-cowork',
          'door-batumi-office-1',
          'door-batumi-meeting-1',
        ],
      },
    ];

    for (const group of groups) {
      this.accessGroups.set(group.id, group);
    }
  }

  private async simulateDelay(): Promise<void> {
    const delay = 50 + Math.random() * 50;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  async createUser(
    email: string,
    firstName: string,
    lastName: string,
  ): Promise<SaltoUser> {
    await this.simulateDelay();

    const user: SaltoUser = {
      id: uuidv4(),
      email,
      firstName,
      lastName,
    };

    this.users.set(user.id, user);
    this.logger.debug(`Mock: Created SaltoKS user ${user.id} for ${email}`);
    return user;
  }

  async deleteUser(saltoUserId: string): Promise<void> {
    await this.simulateDelay();

    if (!this.users.has(saltoUserId)) {
      throw new NotFoundException(
        `SaltoKS user ${saltoUserId} not found in mock`,
      );
    }

    this.users.delete(saltoUserId);
    this.logger.debug(`Mock: Deleted SaltoKS user ${saltoUserId}`);
  }

  async issueKey(
    userId: string,
    accessGroupId: string,
    validFrom: Date,
    validUntil?: Date,
  ): Promise<SaltoKey> {
    await this.simulateDelay();

    const key: SaltoKey = {
      id: uuidv4(),
      userId,
      status: 'active',
      validFrom,
      validUntil,
    };

    this.keys.set(key.id, key);
    this.logger.debug(
      `Mock: Issued SaltoKS key ${key.id} for user ${userId} in group ${accessGroupId}`,
    );
    return key;
  }

  async revokeKey(keyId: string): Promise<void> {
    await this.simulateDelay();

    const key = this.keys.get(keyId);
    if (!key) {
      throw new NotFoundException(`SaltoKS key ${keyId} not found in mock`);
    }

    key.status = 'revoked';
    this.keys.set(keyId, key);
    this.logger.debug(`Mock: Revoked SaltoKS key ${keyId}`);
  }

  async updateKeyValidity(
    keyId: string,
    validFrom: Date,
    validUntil?: Date,
  ): Promise<SaltoKey> {
    await this.simulateDelay();

    const key = this.keys.get(keyId);
    if (!key) {
      throw new NotFoundException(`SaltoKS key ${keyId} not found in mock`);
    }

    key.validFrom = validFrom;
    key.validUntil = validUntil;
    this.keys.set(keyId, key);
    this.logger.debug(`Mock: Updated validity for SaltoKS key ${keyId}`);
    return key;
  }

  async listAccessGroups(): Promise<SaltoAccessGroup[]> {
    await this.simulateDelay();
    return Array.from(this.accessGroups.values());
  }

  async getAccessGroup(groupId: string): Promise<SaltoAccessGroup> {
    await this.simulateDelay();

    const group = this.accessGroups.get(groupId);
    if (!group) {
      throw new NotFoundException(
        `SaltoKS access group ${groupId} not found in mock`,
      );
    }

    return group;
  }

  async getRecentEvents(since: Date, limit = 100): Promise<SaltoEvent[]> {
    await this.simulateDelay();

    // Generate some mock events based on existing keys
    const mockEvents: SaltoEvent[] = [];
    const methods = ['ble', 'nfc', 'pin', 'qr_code'];
    const directions = ['entry', 'exit'];
    const doorIds = [
      'door-stamba-main',
      'door-stamba-lobby',
      'door-radio-main',
      'door-batumi-main',
    ];

    const activeKeys = Array.from(this.keys.values()).filter(
      (k) => k.status === 'active',
    );

    const eventCount = Math.min(limit, Math.max(5, activeKeys.length * 2));

    for (let i = 0; i < eventCount; i++) {
      const now = new Date();
      const eventTime = new Date(
        since.getTime() +
          Math.random() * (now.getTime() - since.getTime()),
      );

      const activeKey =
        activeKeys.length > 0
          ? activeKeys[Math.floor(Math.random() * activeKeys.length)]
          : undefined;

      mockEvents.push({
        id: uuidv4(),
        doorId: doorIds[Math.floor(Math.random() * doorIds.length)],
        userId: activeKey?.userId,
        method: methods[Math.floor(Math.random() * methods.length)],
        direction: directions[Math.floor(Math.random() * directions.length)],
        granted: Math.random() > 0.05,
        timestamp: eventTime,
      });
    }

    return mockEvents
      .filter((e) => e.timestamp >= since)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}
