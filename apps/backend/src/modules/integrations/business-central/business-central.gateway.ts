// ──────────────────────────────────────────────────────────────────────────────
// Business Central Gateway — Real Microsoft BC REST API integration
// ──────────────────────────────────────────────────────────────────────────────

import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IBusinessCentralGateway,
  BcCustomer,
  BcJournalEntry,
  BcInvoice,
  BcAccount,
} from './business-central.interface';
import { BusinessCentralMockGateway } from './business-central-mock.gateway';

interface CachedToken {
  accessToken: string;
  expiresAt: number; // epoch ms
}

@Injectable()
export class BusinessCentralGateway implements IBusinessCentralGateway {
  private readonly logger = new Logger(BusinessCentralGateway.name);

  private readonly mode: string;
  private readonly tenantId: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly environment: string;
  private readonly companyId: string;

  private cachedToken: CachedToken | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly mockGateway: BusinessCentralMockGateway,
  ) {
    this.mode = this.configService.get<string>('integrations.businessCentral.mode', 'mock');
    this.tenantId = this.configService.get<string>('integrations.businessCentral.tenantId', '');
    this.clientId = this.configService.get<string>('integrations.businessCentral.clientId', '');
    this.clientSecret = this.configService.get<string>('integrations.businessCentral.clientSecret', '');
    this.environment = this.configService.get<string>('integrations.businessCentral.environment', 'sandbox');
    this.companyId = this.configService.get<string>('integrations.businessCentral.companyId', '');

    this.logger.log(`Business Central gateway initialized in "${this.mode}" mode`);
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private get isMock(): boolean {
    return this.mode === 'mock';
  }

  private get baseUrl(): string {
    return `https://api.businesscentral.dynamics.com/v2.0/${this.tenantId}/${this.environment}/api/v2.0/companies(${this.companyId})`;
  }

  private get tokenUrl(): string {
    return `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
  }

  /**
   * Perform an HTTP request against the BC REST API.
   * Handles token refresh, error mapping, and ETag support.
   */
  private async bcFetch<T>(
    method: string,
    path: string,
    body?: unknown,
    etag?: string,
  ): Promise<T> {
    const token = await this.getAccessToken();
    const url = `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (etag) {
      headers['If-Match'] = etag;
    }

    this.logger.debug(`BC API ${method} ${url}`);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `BC API error: ${response.status} ${response.statusText} — ${errorBody}`,
        );
        this.mapBcError(response.status, errorBody);
      }

      // 204 No Content (e.g. after posting an invoice)
      if (response.status === 204) {
        return undefined as unknown as T;
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`BC API network error: ${(error as Error).message}`);
      throw new InternalServerErrorException(
        `Failed to communicate with Business Central: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Map BC HTTP status codes to NestJS exceptions.
   */
  private mapBcError(status: number, body: string): never {
    let message: string;
    try {
      const parsed = JSON.parse(body);
      message = parsed?.error?.message || body;
    } catch {
      message = body;
    }

    switch (status) {
      case 400:
        throw new BadRequestException(`Business Central: ${message}`);
      case 401:
      case 403:
        // Invalidate cached token on auth errors
        this.cachedToken = null;
        throw new HttpException(
          `Business Central authentication failed: ${message}`,
          HttpStatus.BAD_GATEWAY,
        );
      case 404:
        throw new NotFoundException(`Business Central resource not found: ${message}`);
      case 409:
        throw new HttpException(
          `Business Central conflict (ETag mismatch or duplicate): ${message}`,
          HttpStatus.CONFLICT,
        );
      default:
        throw new HttpException(
          `Business Central error (${status}): ${message}`,
          HttpStatus.BAD_GATEWAY,
        );
    }
  }

  // ─── Auth ───────────────────────────────────────────────────────────────────

  async getAccessToken(): Promise<string> {
    if (this.isMock) {
      return this.mockGateway.getAccessToken();
    }

    // Return cached token if still valid (with 60s buffer)
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now() + 60_000) {
      return this.cachedToken.accessToken;
    }

    this.logger.log('Requesting new OAuth2 access token from Azure AD');

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: 'https://api.businesscentral.dynamics.com/.default',
    });

    try {
      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Token request failed: ${response.status} — ${errorText}`);
        throw new HttpException(
          'Failed to obtain Business Central access token',
          HttpStatus.BAD_GATEWAY,
        );
      }

      const data = (await response.json()) as {
        access_token: string;
        expires_in: number;
      };

      this.cachedToken = {
        accessToken: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1000,
      };

      this.logger.log('Successfully obtained BC access token');
      return this.cachedToken.accessToken;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Token request network error: ${(error as Error).message}`);
      throw new InternalServerErrorException(
        'Failed to connect to Azure AD for Business Central authentication',
      );
    }
  }

  // ─── Customers ──────────────────────────────────────────────────────────────

  async listCustomers(): Promise<BcCustomer[]> {
    if (this.isMock) return this.mockGateway.listCustomers();

    const result = await this.bcFetch<{ value: BcCustomer[] }>('GET', '/customers');
    return result.value;
  }

  async getCustomer(id: string): Promise<BcCustomer> {
    if (this.isMock) return this.mockGateway.getCustomer(id);

    return this.bcFetch<BcCustomer>('GET', `/customers(${id})`);
  }

  async createCustomer(customer: BcCustomer): Promise<BcCustomer> {
    if (this.isMock) return this.mockGateway.createCustomer(customer);

    return this.bcFetch<BcCustomer>('POST', '/customers', customer);
  }

  async updateCustomer(id: string, customer: Partial<BcCustomer>): Promise<BcCustomer> {
    if (this.isMock) return this.mockGateway.updateCustomer(id, customer);

    // BC requires ETag for PATCH operations — fetch current entity first
    const currentResponse = await fetch(`${this.baseUrl}/customers(${id})`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${await this.getAccessToken()}`,
        Accept: 'application/json',
      },
    });

    if (!currentResponse.ok) {
      const errorBody = await currentResponse.text();
      this.mapBcError(currentResponse.status, errorBody);
    }

    const etag = currentResponse.headers.get('ETag') || currentResponse.headers.get('etag') || '*';

    return this.bcFetch<BcCustomer>('PATCH', `/customers(${id})`, customer, etag);
  }

  // ─── Journal Entries ────────────────────────────────────────────────────────

  async postJournalEntry(entry: BcJournalEntry): Promise<BcJournalEntry> {
    if (this.isMock) return this.mockGateway.postJournalEntry(entry);

    return this.bcFetch<BcJournalEntry>('POST', '/generalJournalLines', entry);
  }

  async postJournalEntries(entries: BcJournalEntry[]): Promise<BcJournalEntry[]> {
    if (this.isMock) return this.mockGateway.postJournalEntries(entries);

    const results: BcJournalEntry[] = [];
    for (const entry of entries) {
      const posted = await this.bcFetch<BcJournalEntry>('POST', '/generalJournalLines', entry);
      results.push(posted);
    }
    return results;
  }

  // ─── Invoices ───────────────────────────────────────────────────────────────

  async createInvoice(invoice: BcInvoice): Promise<BcInvoice> {
    if (this.isMock) return this.mockGateway.createInvoice(invoice);

    // Step 1: Create the sales invoice header
    const { lines, ...invoiceHeader } = invoice;
    const createdInvoice = await this.bcFetch<BcInvoice>('POST', '/salesInvoices', invoiceHeader);

    // Step 2: Add each invoice line
    for (const line of lines) {
      await this.bcFetch(
        'POST',
        `/salesInvoices(${createdInvoice.id})/salesInvoiceLines`,
        {
          ...line,
          lineType: line.lineType || 'Account',
        },
      );
    }

    // Step 3: Return the complete invoice with lines
    return this.bcFetch<BcInvoice>('GET', `/salesInvoices(${createdInvoice.id})?$expand=salesInvoiceLines`);
  }

  async getInvoice(id: string): Promise<BcInvoice> {
    if (this.isMock) return this.mockGateway.getInvoice(id);

    return this.bcFetch<BcInvoice>('GET', `/salesInvoices(${id})?$expand=salesInvoiceLines`);
  }

  async postInvoice(id: string): Promise<void> {
    if (this.isMock) return this.mockGateway.postInvoice(id);

    await this.bcFetch<void>('POST', `/salesInvoices(${id})/Microsoft.NAV.post`);
  }

  // ─── Chart of Accounts ─────────────────────────────────────────────────────

  async listAccounts(): Promise<BcAccount[]> {
    if (this.isMock) return this.mockGateway.listAccounts();

    const result = await this.bcFetch<{ value: BcAccount[] }>('GET', '/accounts');
    return result.value;
  }
}
