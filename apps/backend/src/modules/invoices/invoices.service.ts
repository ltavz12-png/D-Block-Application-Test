import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Invoice, InvoiceStatus } from '@/common/database/entities/invoice.entity';
import { Contract, ContractStatus, ContractType } from '@/common/database/entities/contract.entity';
import { Company } from '@/common/database/entities/company.entity';
import { Booking } from '@/common/database/entities/booking.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Contract)
    private readonly contractRepo: Repository<Contract>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
  ) {}

  // ─── Create ───────────────────────────────────────────────────────────

  async create(dto: CreateInvoiceDto, userId: string): Promise<Invoice> {
    if (!dto.userId && !dto.companyId) {
      throw new BadRequestException(
        'At least one of userId or companyId must be provided',
      );
    }

    const invoiceNumber = this.generateInvoiceNumber();

    const lineItems = dto.lineItems.map((item) => {
      const totalPrice = item.quantity * item.unitPrice;
      const taxAmount = (totalPrice * item.taxRate) / 100;
      return {
        description: item.description,
        descriptionKa: item.descriptionKa,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
        taxRate: item.taxRate,
        taxAmount,
        productId: item.productId,
      };
    });

    const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = lineItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = subtotal + taxAmount;

    const invoice = this.invoiceRepo.create({
      invoiceNumber,
      userId: dto.userId || null,
      companyId: dto.companyId || null,
      lineItems,
      subtotal,
      taxAmount,
      totalAmount,
      currency: dto.currency || 'GEL',
      status: InvoiceStatus.DRAFT,
      issueDate: new Date(dto.issueDate),
      dueDate: new Date(dto.dueDate),
      periodStart: dto.periodStart ? new Date(dto.periodStart) : null,
      periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : null,
      language: dto.language || 'en',
      metadata: dto.metadata || null,
      createdBy: userId,
    });

    return this.invoiceRepo.save(invoice);
  }

  // ─── Update ───────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateInvoiceDto): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ['user', 'company'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID "${id}" not found`);
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        'Only invoices in DRAFT status can be updated',
      );
    }

    if (dto.lineItems) {
      const lineItems = dto.lineItems.map((item) => {
        const totalPrice = item.quantity * item.unitPrice;
        const taxAmount = (totalPrice * item.taxRate) / 100;
        return {
          description: item.description,
          descriptionKa: item.descriptionKa,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice,
          taxRate: item.taxRate,
          taxAmount,
          productId: item.productId,
        };
      });

      invoice.lineItems = lineItems;
      invoice.subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
      invoice.taxAmount = lineItems.reduce((sum, item) => sum + item.taxAmount, 0);
      invoice.totalAmount = invoice.subtotal + invoice.taxAmount;
    }

    if (dto.dueDate !== undefined) {
      invoice.dueDate = new Date(dto.dueDate);
    }

    if (dto.language !== undefined) {
      invoice.language = dto.language;
    }

    if (dto.metadata !== undefined) {
      invoice.metadata = dto.metadata;
    }

    return this.invoiceRepo.save(invoice);
  }

  // ─── Find All ─────────────────────────────────────────────────────────

  async findAll(query: QueryInvoiceDto): Promise<{
    data: Invoice[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { userId, companyId, status, dateFrom, dateTo, search, page = 1, limit = 20 } = query;

    const qb = this.invoiceRepo.createQueryBuilder('invoice');

    qb.leftJoinAndSelect('invoice.user', 'user');
    qb.leftJoinAndSelect('invoice.company', 'company');

    if (userId) {
      qb.andWhere('invoice.userId = :userId', { userId });
    }

    if (companyId) {
      qb.andWhere('invoice.companyId = :companyId', { companyId });
    }

    if (status) {
      qb.andWhere('invoice.status = :status', { status });
    }

    if (search) {
      qb.andWhere('invoice.invoiceNumber ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (dateFrom) {
      qb.andWhere('invoice.issueDate >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      qb.andWhere('invoice.issueDate <= :dateTo', { dateTo });
    }

    qb.orderBy('invoice.createdAt', 'DESC');
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  // ─── Find By ID ───────────────────────────────────────────────────────

  async findById(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ['user', 'company'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID "${id}" not found`);
    }

    return invoice;
  }

  // ─── Find By User ────────────────────────────────────────────────────

  async findByUser(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ data: Invoice[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.invoiceRepo.findAndCount({
      where: { userId },
      relations: ['user', 'company'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  // ─── Find By Company ─────────────────────────────────────────────────

  async findByCompany(
    companyId: string,
    page: number,
    limit: number,
  ): Promise<{ data: Invoice[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.invoiceRepo.findAndCount({
      where: { companyId },
      relations: ['user', 'company'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  // ─── Status Transitions ──────────────────────────────────────────────

  async sendInvoice(id: string): Promise<Invoice> {
    const invoice = await this.findById(id);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        'Only invoices in DRAFT status can be sent',
      );
    }

    invoice.status = InvoiceStatus.SENT;

    return this.invoiceRepo.save(invoice);
  }

  async markPaid(id: string, paymentId?: string): Promise<Invoice> {
    const invoice = await this.findById(id);

    if (
      invoice.status !== InvoiceStatus.SENT &&
      invoice.status !== InvoiceStatus.OVERDUE
    ) {
      throw new BadRequestException(
        'Only invoices in SENT or OVERDUE status can be marked as paid',
      );
    }

    invoice.status = InvoiceStatus.PAID;
    invoice.paidDate = new Date();
    invoice.paymentId = paymentId || null;

    return this.invoiceRepo.save(invoice);
  }

  async cancelInvoice(id: string): Promise<Invoice> {
    const invoice = await this.findById(id);

    if (
      invoice.status !== InvoiceStatus.DRAFT &&
      invoice.status !== InvoiceStatus.SENT
    ) {
      throw new BadRequestException(
        'Only invoices in DRAFT or SENT status can be cancelled',
      );
    }

    invoice.status = InvoiceStatus.CANCELLED;

    return this.invoiceRepo.save(invoice);
  }

  async creditInvoice(id: string): Promise<Invoice> {
    const invoice = await this.findById(id);

    if (invoice.status !== InvoiceStatus.PAID) {
      throw new BadRequestException(
        'Only invoices in PAID status can be credited',
      );
    }

    invoice.status = InvoiceStatus.CREDITED;

    return this.invoiceRepo.save(invoice);
  }

  // ─── Generate Monthly B2B Invoices ────────────────────────────────────

  async generateMonthlyB2BInvoices(
    month: Date,
  ): Promise<{ invoicesGenerated: number; totalAmount: number }> {
    const contracts = await this.contractRepo.find({
      where: { status: ContractStatus.ACTIVE },
    });

    const issueDate = new Date(month.getFullYear(), month.getMonth(), 1);
    const dueDate = new Date(month.getFullYear(), month.getMonth(), 15);
    const periodStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const periodEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    let invoicesGenerated = 0;
    let totalAmount = 0;

    for (const contract of contracts) {
      const unitPrice = Number(contract.monthlyAmount);
      const totalPrice = unitPrice;
      const taxRate = 18;
      const taxAmount = (totalPrice * taxRate) / 100;
      const invoiceTotal = totalPrice + taxAmount;

      const invoiceNumber = this.generateInvoiceNumber();

      const lineItems = [
        {
          description: `Monthly rent - ${contract.contractType}`,
          descriptionKa: `ყოველთვიური ქირა - ${contract.contractType}`,
          quantity: 1,
          unitPrice,
          totalPrice,
          taxRate,
          taxAmount,
        },
      ];

      const invoice = this.invoiceRepo.create({
        invoiceNumber,
        companyId: contract.companyId,
        lineItems,
        subtotal: totalPrice,
        taxAmount,
        totalAmount: invoiceTotal,
        currency: contract.currency || 'GEL',
        status: InvoiceStatus.DRAFT,
        issueDate,
        dueDate,
        periodStart,
        periodEnd,
        language: 'en',
      });

      await this.invoiceRepo.save(invoice);
      invoicesGenerated++;
      totalAmount += invoiceTotal;
    }

    return { invoicesGenerated, totalAmount };
  }

  // ─── Check Overdue Invoices ───────────────────────────────────────────

  async checkOverdueInvoices(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.invoiceRepo
      .createQueryBuilder()
      .update(Invoice)
      .set({ status: InvoiceStatus.OVERDUE })
      .where('status = :status', { status: InvoiceStatus.SENT })
      .andWhere('due_date < :today', { today })
      .execute();

    return result.affected || 0;
  }

  // ─── Invoice Summary ─────────────────────────────────────────────────

  async getInvoiceSummary(
    dateFrom?: string,
    dateTo?: string,
    companyId?: string,
  ): Promise<{
    totalInvoiced: number;
    totalPaid: number;
    totalOverdue: number;
    totalDraft: number;
    countByStatus: Record<string, number>;
  }> {
    const qb = this.invoiceRepo.createQueryBuilder('invoice');

    if (dateFrom) {
      qb.andWhere('invoice.issueDate >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      qb.andWhere('invoice.issueDate <= :dateTo', { dateTo });
    }

    if (companyId) {
      qb.andWhere('invoice.companyId = :companyId', { companyId });
    }

    const totalInvoicedResult = await qb
      .clone()
      .select('COALESCE(SUM(invoice.total_amount), 0)', 'total')
      .getRawOne();

    const totalPaidResult = await qb
      .clone()
      .andWhere('invoice.status = :paidStatus', {
        paidStatus: InvoiceStatus.PAID,
      })
      .select('COALESCE(SUM(invoice.total_amount), 0)', 'total')
      .getRawOne();

    const totalOverdueResult = await qb
      .clone()
      .andWhere('invoice.status = :overdueStatus', {
        overdueStatus: InvoiceStatus.OVERDUE,
      })
      .select('COALESCE(SUM(invoice.total_amount), 0)', 'total')
      .getRawOne();

    const totalDraftResult = await qb
      .clone()
      .andWhere('invoice.status = :draftStatus', {
        draftStatus: InvoiceStatus.DRAFT,
      })
      .select('COALESCE(SUM(invoice.total_amount), 0)', 'total')
      .getRawOne();

    const countByStatusResult = await qb
      .clone()
      .select('invoice.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('invoice.status')
      .getRawMany();

    const countByStatus: Record<string, number> = {};
    for (const row of countByStatusResult) {
      countByStatus[row.status] = parseInt(row.count, 10);
    }

    return {
      totalInvoiced: parseFloat(totalInvoicedResult.total),
      totalPaid: parseFloat(totalPaidResult.total),
      totalOverdue: parseFloat(totalOverdueResult.total),
      totalDraft: parseFloat(totalDraftResult.total),
      countByStatus,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────

  private generateInvoiceNumber(): string {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `INV-${datePart}-${randomPart}`;
  }
}
