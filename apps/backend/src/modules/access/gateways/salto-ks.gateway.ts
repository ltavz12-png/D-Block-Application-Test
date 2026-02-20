import {
  Injectable,
  Logger,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ISaltoKsGateway,
  SaltoUser,
  SaltoAccessGroup,
  SaltoKey,
  SaltoEvent,
} from './salto-ks.interface';
import { SaltoKsMockGateway } from './salto-ks-mock.gateway';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

@Injectable()
export class SaltoKsGateway implements ISaltoKsGateway {
  private readonly logger = new Logger(SaltoKsGateway.name);
  private readonly mode: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl: string;

  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY_MS = 1000;

  constructor(
    private readonly configService: ConfigService,
    private readonly mockGateway: SaltoKsMockGateway,
  ) {
    this.mode = this.configService.get<string>('SALTOKS_MODE', 'mock');
    this.clientId = this.configService.get<string>('SALTOKS_CLIENT_ID', '');
    this.clientSecret = this.configService.get<string>(
      'SALTOKS_CLIENT_SECRET',
      '',
    );
    this.baseUrl = this.configService.get<string>(
      'SALTOKS_BASE_URL',
      'https://api.eu.my-clay.com',
    );

    this.logger.log(`SaltoKS Gateway initialized in ${this.mode} mode`);
  }

  private isMockMode(): boolean {
    return this.mode === 'mock';
  }

  private async ensureToken(): Promise<string> {
    if (
      this.accessToken &&
      this.tokenExpiresAt &&
      this.tokenExpiresAt > new Date()
    ) {
      return this.accessToken;
    }

    const tokenUrl = `${this.baseUrl}/oauth/token`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `Failed to acquire SaltoKS token: ${response.status} ${errorText}`,
      );
      throw new InternalServerErrorException(
        'Failed to authenticate with SaltoKS',
      );
    }

    const data: TokenResponse = await response.json();
    this.accessToken = data.access_token;
    // Expire 60 seconds before actual expiry for safety
    this.tokenExpiresAt = new Date(
      Date.now() + (data.expires_in - 60) * 1000,
    );

    this.logger.debug('SaltoKS OAuth token acquired');
    return this.accessToken;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
    queryParams?: Record<string, string>,
    retryCount = 0,
  ): Promise<T> {
    const token = await this.ensureToken();

    let url = `${this.baseUrl}${path}`;
    if (queryParams) {
      const params = new URLSearchParams(queryParams);
      url += `?${params.toString()}`;
    }

    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    // Handle rate-limiting and server errors with retry
    if (
      (response.status === 429 || response.status >= 500) &&
      retryCount < SaltoKsGateway.MAX_RETRIES
    ) {
      const delay =
        SaltoKsGateway.RETRY_DELAY_MS * Math.pow(2, retryCount);
      this.logger.warn(
        `SaltoKS request ${method} ${path} returned ${response.status}, retrying in ${delay}ms (attempt ${retryCount + 1}/${SaltoKsGateway.MAX_RETRIES})`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.request<T>(method, path, body, queryParams, retryCount + 1);
    }

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `SaltoKS API error: ${method} ${path} -> ${response.status}: ${errorText}`,
      );
      throw new HttpException(
        `SaltoKS API error: ${response.status}`,
        response.status,
      );
    }

    // Handle 204 No Content (e.g., DELETE)
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  // ----- User Management -----

  async createUser(
    email: string,
    firstName: string,
    lastName: string,
  ): Promise<SaltoUser> {
    if (this.isMockMode()) {
      return this.mockGateway.createUser(email, firstName, lastName);
    }

    const result = await this.request<SaltoUser>('POST', '/users', {
      email,
      firstName,
      lastName,
    });

    this.logger.log(`Created SaltoKS user ${result.id} for ${email}`);
    return result;
  }

  async deleteUser(saltoUserId: string): Promise<void> {
    if (this.isMockMode()) {
      return this.mockGateway.deleteUser(saltoUserId);
    }

    await this.request<void>('DELETE', `/users/${saltoUserId}`);
    this.logger.log(`Deleted SaltoKS user ${saltoUserId}`);
  }

  // ----- Key Management -----

  async issueKey(
    userId: string,
    accessGroupId: string,
    validFrom: Date,
    validUntil?: Date,
  ): Promise<SaltoKey> {
    if (this.isMockMode()) {
      return this.mockGateway.issueKey(
        userId,
        accessGroupId,
        validFrom,
        validUntil,
      );
    }

    const body: Record<string, unknown> = {
      userId,
      accessGroupId,
      validFrom: validFrom.toISOString(),
    };
    if (validUntil) {
      body.validUntil = validUntil.toISOString();
    }

    const result = await this.request<SaltoKey>('POST', '/keys', body);
    this.logger.log(
      `Issued SaltoKS key ${result.id} for user ${userId}`,
    );
    return result;
  }

  async revokeKey(keyId: string): Promise<void> {
    if (this.isMockMode()) {
      return this.mockGateway.revokeKey(keyId);
    }

    await this.request<void>('DELETE', `/keys/${keyId}`);
    this.logger.log(`Revoked SaltoKS key ${keyId}`);
  }

  async updateKeyValidity(
    keyId: string,
    validFrom: Date,
    validUntil?: Date,
  ): Promise<SaltoKey> {
    if (this.isMockMode()) {
      return this.mockGateway.updateKeyValidity(keyId, validFrom, validUntil);
    }

    const body: Record<string, unknown> = {
      validFrom: validFrom.toISOString(),
    };
    if (validUntil) {
      body.validUntil = validUntil.toISOString();
    }

    const result = await this.request<SaltoKey>(
      'PATCH',
      `/keys/${keyId}`,
      body,
    );
    this.logger.log(`Updated validity for SaltoKS key ${keyId}`);
    return result;
  }

  // ----- Access Groups -----

  async listAccessGroups(): Promise<SaltoAccessGroup[]> {
    if (this.isMockMode()) {
      return this.mockGateway.listAccessGroups();
    }

    return this.request<SaltoAccessGroup[]>('GET', '/access-groups');
  }

  async getAccessGroup(groupId: string): Promise<SaltoAccessGroup> {
    if (this.isMockMode()) {
      return this.mockGateway.getAccessGroup(groupId);
    }

    return this.request<SaltoAccessGroup>(
      'GET',
      `/access-groups/${groupId}`,
    );
  }

  // ----- Events / Logs -----

  async getRecentEvents(since: Date, limit = 100): Promise<SaltoEvent[]> {
    if (this.isMockMode()) {
      return this.mockGateway.getRecentEvents(since, limit);
    }

    const queryParams: Record<string, string> = {
      since: since.toISOString(),
      limit: limit.toString(),
    };

    return this.request<SaltoEvent[]>(
      'GET',
      '/events',
      undefined,
      queryParams,
    );
  }
}
