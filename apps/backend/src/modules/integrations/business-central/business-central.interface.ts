// ──────────────────────────────────────────────────────────────────────────────
// Business Central Integration — Interfaces & Gateway Contract
// ──────────────────────────────────────────────────────────────────────────────

export interface BcAddress {
  street?: string;
  city?: string;
  state?: string;
  countryLetterCode?: string;
  postalCode?: string;
}

export interface BcCustomer {
  id?: string;
  number?: string;
  displayName: string;
  email?: string;
  phoneNumber?: string;
  taxRegistrationNumber?: string;
  address?: BcAddress;
  currencyCode?: string;
}

export interface BcJournalEntry {
  journalBatchName: string;
  lineNumber?: number;
  accountNumber: string;
  postingDate: string; // YYYY-MM-DD
  documentNumber?: string;
  description: string;
  amount: number;
  balancingAccountNumber?: string;
}

export interface BcInvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  lineType?: string;
  accountId?: string;
}

export interface BcInvoice {
  id?: string;
  number?: string;
  customerId: string;
  invoiceDate: string;
  dueDate: string;
  currencyCode: string;
  lines: BcInvoiceLine[];
}

export interface BcAccount {
  id: string;
  number: string;
  displayName: string;
  category: string;
  subCategory?: string;
  accountType: string;
  blocked: boolean;
}

export interface IBusinessCentralGateway {
  // Auth
  getAccessToken(): Promise<string>;

  // Customers
  listCustomers(): Promise<BcCustomer[]>;
  getCustomer(id: string): Promise<BcCustomer>;
  createCustomer(customer: BcCustomer): Promise<BcCustomer>;
  updateCustomer(id: string, customer: Partial<BcCustomer>): Promise<BcCustomer>;

  // Journal Entries
  postJournalEntry(entry: BcJournalEntry): Promise<BcJournalEntry>;
  postJournalEntries(entries: BcJournalEntry[]): Promise<BcJournalEntry[]>;

  // Invoices
  createInvoice(invoice: BcInvoice): Promise<BcInvoice>;
  getInvoice(id: string): Promise<BcInvoice>;
  postInvoice(id: string): Promise<void>; // Post = finalize in BC

  // Chart of Accounts
  listAccounts(): Promise<BcAccount[]>;
}
