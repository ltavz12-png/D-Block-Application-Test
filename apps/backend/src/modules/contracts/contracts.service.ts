import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  Contract,
  ContractStatus,
} from '@/common/database/entities/contract.entity';
import { Company } from '@/common/database/entities/company.entity';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { QueryContractDto } from './dto/query-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  // ─── Core Methods ───────────────────────────────────────────────

  async create(dto: CreateContractDto, userId: string): Promise<Contract> {
    // Validate company exists
    const company = await this.companyRepository.findOne({
      where: { id: dto.companyId },
    });

    if (!company) {
      throw new NotFoundException(
        `Company with ID "${dto.companyId}" not found`,
      );
    }

    // Generate contract number: CTR-YYYYMMDD-XXXX
    const contractNumber = this.generateContractNumber();

    const contract = this.contractRepository.create({
      contractNumber,
      companyId: dto.companyId,
      locationId: dto.locationId,
      contractType: dto.contractType,
      status: ContractStatus.DRAFT,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      monthlyAmount: dto.monthlyAmount,
      currency: dto.currency ?? 'GEL',
      autoRenew: dto.autoRenew ?? false,
      noticePeriodDays: dto.noticePeriodDays ?? 30,
      areaSqm: dto.areaSqm ?? null,
      pricePerSqm: dto.pricePerSqm ?? null,
      resourceIds: dto.resourceIds ?? [],
      terms: dto.terms ?? null,
      metadata: dto.metadata ?? null,
      createdBy: userId,
    });

    const saved = await this.contractRepository.save(contract);

    return this.contractRepository.findOne({
      where: { id: saved.id },
      relations: ['company', 'location'],
    }) as Promise<Contract>;
  }

  async update(id: string, dto: UpdateContractDto): Promise<Contract> {
    const contract = await this.findById(id);

    if (
      contract.status !== ContractStatus.DRAFT &&
      contract.status !== ContractStatus.ACTIVE
    ) {
      throw new BadRequestException(
        `Contract can only be updated when status is DRAFT or ACTIVE. Current status: "${contract.status}"`,
      );
    }

    // Apply updates — cast to any to work with PartialType(OmitType(...))
    const updates = dto as Record<string, any>;
    const dateFields = ['startDate', 'endDate'];
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        (contract as any)[key] = dateFields.includes(key) ? new Date(value) : value;
      }
    }

    await this.contractRepository.save(contract);

    return this.contractRepository.findOne({
      where: { id },
      relations: ['company', 'location'],
    }) as Promise<Contract>;
  }

  async findAll(query: QueryContractDto): Promise<{
    data: Contract[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      companyId,
      locationId,
      contractType,
      status,
      search,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = query;

    const qb = this.contractRepository
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.company', 'company')
      .leftJoinAndSelect('contract.location', 'location');

    if (companyId) {
      qb.andWhere('contract.companyId = :companyId', { companyId });
    }

    if (locationId) {
      qb.andWhere('contract.locationId = :locationId', { locationId });
    }

    if (contractType) {
      qb.andWhere('contract.contractType = :contractType', { contractType });
    }

    if (status) {
      qb.andWhere('contract.status = :status', { status });
    }

    if (search) {
      qb.andWhere('contract.contractNumber ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (dateFrom) {
      qb.andWhere('contract.startDate >= :dateFrom', {
        dateFrom: new Date(dateFrom),
      });
    }

    if (dateTo) {
      qb.andWhere('contract.startDate <= :dateTo', {
        dateTo: new Date(dateTo),
      });
    }

    qb.orderBy('contract.createdAt', 'DESC');
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async findById(id: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { id },
      relations: ['company', 'location'],
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID "${id}" not found`);
    }

    return contract;
  }

  async findByCompany(
    companyId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: Contract[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await this.contractRepository.findAndCount({
      where: { companyId },
      relations: ['company', 'location'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  // ─── Lifecycle Methods ────────────────────────────────────────────

  async sendForSignature(id: string): Promise<Contract> {
    const contract = await this.findById(id);

    if (contract.status !== ContractStatus.DRAFT) {
      throw new BadRequestException(
        `Contract can only be sent for signature when status is DRAFT. Current status: "${contract.status}"`,
      );
    }

    contract.status = ContractStatus.PENDING_SIGNATURE;
    return this.contractRepository.save(contract);
  }

  async markSigned(id: string, dto: SignContractDto): Promise<Contract> {
    const contract = await this.findById(id);

    if (contract.status !== ContractStatus.PENDING_SIGNATURE) {
      throw new BadRequestException(
        `Contract can only be marked as signed when status is PENDING_SIGNATURE. Current status: "${contract.status}"`,
      );
    }

    contract.status = ContractStatus.ACTIVE;
    contract.signedAt = new Date();
    contract.signedByCompany = dto.signedByCompany;
    contract.signedByDblock = dto.signedByDblock;

    if (dto.documentUrl !== undefined) {
      contract.documentUrl = dto.documentUrl;
    }

    if (dto.docusignEnvelopeId !== undefined) {
      contract.docusignEnvelopeId = dto.docusignEnvelopeId;
    }

    return this.contractRepository.save(contract);
  }

  async terminate(id: string, reason?: string): Promise<Contract> {
    const contract = await this.findById(id);

    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException(
        `Contract can only be terminated when status is ACTIVE. Current status: "${contract.status}"`,
      );
    }

    contract.status = ContractStatus.TERMINATED;

    if (reason) {
      contract.metadata = {
        ...(contract.metadata ?? {}),
        terminationReason: reason,
        terminatedAt: new Date().toISOString(),
      };
    }

    return this.contractRepository.save(contract);
  }

  async renewContract(id: string): Promise<Contract> {
    const contract = await this.findById(id);

    if (
      contract.status !== ContractStatus.ACTIVE &&
      contract.status !== ContractStatus.EXPIRED
    ) {
      throw new BadRequestException(
        `Contract can only be renewed when status is ACTIVE or EXPIRED. Current status: "${contract.status}"`,
      );
    }

    // Calculate duration of the original contract
    const oldStart = new Date(contract.startDate);
    const oldEnd = new Date(contract.endDate);
    const durationMs = oldEnd.getTime() - oldStart.getTime();

    // New contract dates
    const newStartDate = new Date(oldEnd);
    const newEndDate = new Date(oldEnd.getTime() + durationMs);

    // Generate new contract number
    const contractNumber = this.generateContractNumber();

    // Create new contract with same terms
    const newContract = this.contractRepository.create({
      contractNumber,
      companyId: contract.companyId,
      locationId: contract.locationId,
      contractType: contract.contractType,
      status: ContractStatus.DRAFT,
      startDate: newStartDate,
      endDate: newEndDate,
      monthlyAmount: contract.monthlyAmount,
      currency: contract.currency,
      autoRenew: contract.autoRenew,
      noticePeriodDays: contract.noticePeriodDays,
      areaSqm: contract.areaSqm,
      pricePerSqm: contract.pricePerSqm,
      resourceIds: contract.resourceIds,
      terms: contract.terms,
      metadata: {
        renewedFromContractId: contract.id,
        renewedFromContractNumber: contract.contractNumber,
      },
      createdBy: contract.createdBy,
    });

    const savedNew = await this.contractRepository.save(newContract);

    // Mark old contract as RENEWED
    contract.status = ContractStatus.RENEWED;
    contract.metadata = {
      ...(contract.metadata ?? {}),
      renewedToContractId: savedNew.id,
      renewedAt: new Date().toISOString(),
    };
    await this.contractRepository.save(contract);

    return this.contractRepository.findOne({
      where: { id: savedNew.id },
      relations: ['company', 'location'],
    }) as Promise<Contract>;
  }

  // ─── Bulk / Utility Methods ───────────────────────────────────────

  async checkExpiredContracts(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.contractRepository
      .createQueryBuilder()
      .update(Contract)
      .set({ status: ContractStatus.EXPIRED })
      .where('status = :status', { status: ContractStatus.ACTIVE })
      .andWhere('end_date < :today', { today })
      .execute();

    return result.affected ?? 0;
  }

  async getContractSummary(companyId: string): Promise<{
    activeContracts: number;
    totalMonthlyValue: number;
    expiringWithin30Days: number;
  }> {
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    // Active contracts count and total monthly value
    const activeResult = await this.contractRepository
      .createQueryBuilder('contract')
      .where('contract.companyId = :companyId', { companyId })
      .andWhere('contract.status = :status', { status: ContractStatus.ACTIVE })
      .select('COUNT(contract.id)', 'count')
      .addSelect('COALESCE(SUM(contract.monthlyAmount), 0)', 'totalMonthly')
      .getRawOne();

    // Contracts expiring within 30 days
    const expiringResult = await this.contractRepository
      .createQueryBuilder('contract')
      .where('contract.companyId = :companyId', { companyId })
      .andWhere('contract.status = :status', { status: ContractStatus.ACTIVE })
      .andWhere('contract.endDate >= :now', { now })
      .andWhere('contract.endDate <= :in30Days', { in30Days })
      .select('COUNT(contract.id)', 'count')
      .getRawOne();

    return {
      activeContracts: parseInt(activeResult.count, 10) || 0,
      totalMonthlyValue: parseFloat(activeResult.totalMonthly) || 0,
      expiringWithin30Days: parseInt(expiringResult.count, 10) || 0,
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────

  private generateContractNumber(): string {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = this.randomChars(4);
    return `CTR-${datePart}-${randomPart}`;
  }

  private randomChars(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
