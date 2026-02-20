// ──────────────────────────────────────────────────────────────────────────────
// Business Central Service — High-level orchestration layer
// ──────────────────────────────────────────────────────────────────────────────

import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessCentralGateway } from './business-central.gateway';
import { BcAccount, BcCustomer, BcJournalEntry } from './business-central.interface';

export interface SyncCompanyInput {
  id: string;
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    countryLetterCode?: string;
    postalCode?: string;
  };
}

export interface RevenueJournalEntryInput {
  accountNumber: string;
  amount: number;
  postingDate: string;
  description: string;
  documentNumber?: string;
}

export interface SyncInvoiceInput {
  id: string;
  companyBcCustomerId: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

@Injectable()
export class BusinessCentralService {
  private readonly logger = new Logger(BusinessCentralService.name);

  constructor(
    private readonly gateway: BusinessCentralGateway,
    private readonly configService: ConfigService,
  ) {}

  // ─── Company / Customer Sync ────────────────────────────────────────────────

  /**
   * Sync a company from the D Block B2B module to Business Central as a customer.
   * If the customer already exists (matched by displayName), it will be updated;
   * otherwise a new customer is created.
   */
  async syncCompanyToBC(
    company: SyncCompanyInput,
  ): Promise<{ bcCustomerId: string }> {
    this.logger.log(`Syncing company "${company.name}" (id=${company.id}) to BC`);

    try {
      // Try to find an existing customer by displayName
      const existingCustomers = await this.gateway.listCustomers();
      const match = existingCustomers.find(
        (c) => c.displayName === company.name,
      );

      const customerPayload: BcCustomer = {
        displayName: company.name,
        email: company.email,
        phoneNumber: company.phone,
        taxRegistrationNumber: company.taxId,
        address: company.address
          ? {
              street: company.address.street,
              city: company.address.city,
              state: company.address.state,
              countryLetterCode: company.address.countryLetterCode,
              postalCode: company.address.postalCode,
            }
          : undefined,
      };

      if (match && match.id) {
        // Update existing customer
        this.logger.log(`Found existing BC customer id=${match.id}, updating`);
        const updated = await this.gateway.updateCustomer(match.id, customerPayload);
        return { bcCustomerId: updated.id! };
      }

      // Create new customer
      this.logger.log('No existing BC customer found, creating new one');
      const created = await this.gateway.createCustomer(customerPayload);
      return { bcCustomerId: created.id! };
    } catch (error) {
      this.logger.error(
        `Failed to sync company "${company.name}" to BC: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  // ─── Revenue Journal Entries ────────────────────────────────────────────────

  /**
   * Post a batch of journal entries to Business Central.
   * Typically called by the IFRS 15 revenue recognition process.
   */
  async postRevenueJournalEntries(
    entries: RevenueJournalEntryInput[],
  ): Promise<void> {
    this.logger.log(`Posting ${entries.length} revenue journal entries to BC`);

    if (entries.length === 0) {
      this.logger.warn('No entries to post — skipping');
      return;
    }

    try {
      const bcEntries: BcJournalEntry[] = entries.map((entry) => ({
        journalBatchName: 'REVENUE',
        accountNumber: entry.accountNumber,
        postingDate: entry.postingDate,
        documentNumber: entry.documentNumber,
        description: entry.description,
        amount: entry.amount,
      }));

      await this.gateway.postJournalEntries(bcEntries);
      this.logger.log(`Successfully posted ${entries.length} journal entries to BC`);
    } catch (error) {
      this.logger.error(
        `Failed to post journal entries to BC: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  // ─── Invoice Sync ──────────────────────────────────────────────────────────

  /**
   * Create a sales invoice in Business Central and optionally post (finalize) it.
   */
  async syncInvoiceToBC(
    invoice: SyncInvoiceInput,
  ): Promise<{ bcInvoiceId: string }> {
    this.logger.log(
      `Syncing invoice "${invoice.id}" to BC for customer=${invoice.companyBcCustomerId}`,
    );

    try {
      const bcInvoice = await this.gateway.createInvoice({
        customerId: invoice.companyBcCustomerId,
        invoiceDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        currencyCode: invoice.currency,
        lines: invoice.lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineType: 'Account',
        })),
      });

      this.logger.log(`Created BC invoice id=${bcInvoice.id}`);

      // Post (finalize) the invoice in BC
      if (bcInvoice.id) {
        try {
          await this.gateway.postInvoice(bcInvoice.id);
          this.logger.log(`Posted (finalized) BC invoice id=${bcInvoice.id}`);
        } catch (postError) {
          // Log but don't fail — the invoice was created, just not posted
          this.logger.warn(
            `Invoice created but posting failed: ${(postError as Error).message}. Manual posting may be required.`,
          );
        }
      }

      return { bcInvoiceId: bcInvoice.id! };
    } catch (error) {
      this.logger.error(
        `Failed to sync invoice to BC: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  // ─── Chart of Accounts ─────────────────────────────────────────────────────

  /**
   * Retrieve the full chart of accounts from Business Central.
   */
  async getChartOfAccounts(): Promise<BcAccount[]> {
    this.logger.log('Fetching chart of accounts from BC');
    try {
      return await this.gateway.listAccounts();
    } catch (error) {
      this.logger.error(
        `Failed to fetch chart of accounts: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  // ─── Customers ──────────────────────────────────────────────────────────────

  /**
   * List all customers in Business Central.
   */
  async listBCCustomers(): Promise<BcCustomer[]> {
    this.logger.log('Listing all BC customers');
    try {
      return await this.gateway.listCustomers();
    } catch (error) {
      this.logger.error(
        `Failed to list BC customers: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  // ─── Connection Test ───────────────────────────────────────────────────────

  /**
   * Verify that the BC connection is working by fetching an access token
   * and querying the accounts endpoint.
   */
  async testConnection(): Promise<{
    connected: boolean;
    environment: string;
    companyId: string;
  }> {
    const environment = this.configService.get<string>(
      'integrations.businessCentral.environment',
      'sandbox',
    );
    const companyId = this.configService.get<string>(
      'integrations.businessCentral.companyId',
      '',
    );

    try {
      // Attempt to get a token and list accounts as a connectivity check
      await this.gateway.getAccessToken();
      await this.gateway.listAccounts();

      this.logger.log('BC connection test succeeded');
      return { connected: true, environment, companyId };
    } catch (error) {
      this.logger.warn(`BC connection test failed: ${(error as Error).message}`);
      return { connected: false, environment, companyId };
    }
  }
}
