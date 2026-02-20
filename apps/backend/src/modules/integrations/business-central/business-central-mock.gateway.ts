// ──────────────────────────────────────────────────────────────────────────────
// Business Central Mock Gateway — In-memory implementation for development
// ──────────────────────────────────────────────────────────────────────────────

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  IBusinessCentralGateway,
  BcCustomer,
  BcJournalEntry,
  BcInvoice,
  BcAccount,
} from './business-central.interface';

@Injectable()
export class BusinessCentralMockGateway implements IBusinessCentralGateway {
  private readonly logger = new Logger(BusinessCentralMockGateway.name);

  // ─── In-Memory Stores ───────────────────────────────────────────────────────
  private customers: Map<string, BcCustomer> = new Map();
  private journalEntries: BcJournalEntry[] = [];
  private invoices: Map<string, BcInvoice> = new Map();
  private accounts: BcAccount[] = [];

  // ─── Sequential ID Counters ─────────────────────────────────────────────────
  private customerSeq = 1000;
  private invoiceSeq = 5000;
  private journalLineSeq = 10000;

  constructor() {
    this.seedChartOfAccounts();
    this.logger.log('Mock Business Central gateway initialized with seed data');
  }

  // ─── Seed Data ──────────────────────────────────────────────────────────────

  private seedChartOfAccounts(): void {
    this.accounts = [
      {
        id: 'acct-1000',
        number: '1000',
        displayName: 'Cash/Bank',
        category: 'Assets',
        subCategory: 'Cash',
        accountType: 'Posting',
        blocked: false,
      },
      {
        id: 'acct-1100',
        number: '1100',
        displayName: 'Accounts Receivable',
        category: 'Assets',
        subCategory: 'Accounts Receivable',
        accountType: 'Posting',
        blocked: false,
      },
      {
        id: 'acct-2300',
        number: '2300',
        displayName: 'Deferred Revenue',
        category: 'Liabilities',
        subCategory: 'Current Liabilities',
        accountType: 'Posting',
        blocked: false,
      },
      {
        id: 'acct-4100',
        number: '4100',
        displayName: 'Revenue - Room Bookings',
        category: 'Income',
        subCategory: 'Revenue',
        accountType: 'Posting',
        blocked: false,
      },
      {
        id: 'acct-4200',
        number: '4200',
        displayName: 'Revenue - Hot Desk',
        category: 'Income',
        subCategory: 'Revenue',
        accountType: 'Posting',
        blocked: false,
      },
      {
        id: 'acct-4300',
        number: '4300',
        displayName: 'Revenue - Passes & Subscriptions',
        category: 'Income',
        subCategory: 'Revenue',
        accountType: 'Posting',
        blocked: false,
      },
      {
        id: 'acct-4400',
        number: '4400',
        displayName: 'Revenue - B2B Contracts',
        category: 'Income',
        subCategory: 'Revenue',
        accountType: 'Posting',
        blocked: false,
      },
    ];
  }

  // ─── Auth ───────────────────────────────────────────────────────────────────

  async getAccessToken(): Promise<string> {
    this.logger.log('[MOCK] getAccessToken() — returning fake token');
    return 'mock-access-token-' + Date.now();
  }

  // ─── Customers ──────────────────────────────────────────────────────────────

  async listCustomers(): Promise<BcCustomer[]> {
    this.logger.log(`[MOCK] listCustomers() — returning ${this.customers.size} customers`);
    return Array.from(this.customers.values());
  }

  async getCustomer(id: string): Promise<BcCustomer> {
    this.logger.log(`[MOCK] getCustomer(${id})`);
    const customer = this.customers.get(id);
    if (!customer) {
      throw new NotFoundException(`Mock BC customer not found: ${id}`);
    }
    return customer;
  }

  async createCustomer(customer: BcCustomer): Promise<BcCustomer> {
    this.customerSeq++;
    const newCustomer: BcCustomer = {
      ...customer,
      id: `mock-cust-${this.customerSeq}`,
      number: `C${this.customerSeq}`,
    };
    this.customers.set(newCustomer.id!, newCustomer);
    this.logger.log(
      `[MOCK] createCustomer() — created "${newCustomer.displayName}" with id=${newCustomer.id}`,
    );
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<BcCustomer>): Promise<BcCustomer> {
    this.logger.log(`[MOCK] updateCustomer(${id})`);
    const existing = this.customers.get(id);
    if (!existing) {
      throw new NotFoundException(`Mock BC customer not found: ${id}`);
    }
    const updated: BcCustomer = {
      ...existing,
      ...customer,
      id: existing.id,
      number: existing.number,
    };
    this.customers.set(id, updated);
    this.logger.log(`[MOCK] updateCustomer() — updated "${updated.displayName}"`);
    return updated;
  }

  // ─── Journal Entries ────────────────────────────────────────────────────────

  async postJournalEntry(entry: BcJournalEntry): Promise<BcJournalEntry> {
    this.journalLineSeq++;
    const posted: BcJournalEntry = {
      ...entry,
      lineNumber: this.journalLineSeq,
    };
    this.journalEntries.push(posted);
    this.logger.log(
      `[MOCK] postJournalEntry() — account=${entry.accountNumber} amount=${entry.amount} date=${entry.postingDate}`,
    );
    return posted;
  }

  async postJournalEntries(entries: BcJournalEntry[]): Promise<BcJournalEntry[]> {
    this.logger.log(`[MOCK] postJournalEntries() — posting ${entries.length} entries`);
    const results: BcJournalEntry[] = [];
    for (const entry of entries) {
      const posted = await this.postJournalEntry(entry);
      results.push(posted);
    }
    return results;
  }

  // ─── Invoices ───────────────────────────────────────────────────────────────

  async createInvoice(invoice: BcInvoice): Promise<BcInvoice> {
    this.invoiceSeq++;
    const created: BcInvoice = {
      ...invoice,
      id: `mock-inv-${this.invoiceSeq}`,
      number: `INV${this.invoiceSeq}`,
    };
    this.invoices.set(created.id!, created);
    this.logger.log(
      `[MOCK] createInvoice() — created invoice id=${created.id} for customerId=${invoice.customerId} with ${invoice.lines.length} lines`,
    );
    return created;
  }

  async getInvoice(id: string): Promise<BcInvoice> {
    this.logger.log(`[MOCK] getInvoice(${id})`);
    const invoice = this.invoices.get(id);
    if (!invoice) {
      throw new NotFoundException(`Mock BC invoice not found: ${id}`);
    }
    return invoice;
  }

  async postInvoice(id: string): Promise<void> {
    this.logger.log(`[MOCK] postInvoice(${id}) — finalizing invoice`);
    const invoice = this.invoices.get(id);
    if (!invoice) {
      throw new NotFoundException(`Mock BC invoice not found: ${id}`);
    }
    // In a real gateway this would call Microsoft.NAV.post to finalize.
    // In mock we just log it.
    this.logger.log(`[MOCK] Invoice ${id} (${invoice.number}) has been posted/finalized`);
  }

  // ─── Chart of Accounts ─────────────────────────────────────────────────────

  async listAccounts(): Promise<BcAccount[]> {
    this.logger.log(`[MOCK] listAccounts() — returning ${this.accounts.length} accounts`);
    return [...this.accounts];
  }
}
