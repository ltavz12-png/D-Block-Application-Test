import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company, CompanyStatus } from '@/common/database/entities/company.entity';
import { User, UserRole, UserStatus } from '@/common/database/entities/user.entity';
import { Contract, ContractStatus } from '@/common/database/entities/contract.entity';
import { CreditPackage, CreditPackageStatus } from '@/common/database/entities/credit-package.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { QueryCompanyDto } from './dto/query-company.dto';
import { AddEmployeeDto } from './dto/add-employee.dto';
import { UpdateEmployeeRoleDto } from './dto/update-employee-role.dto';

@Injectable()
export class B2bService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
  ) {}

  // ─── Company CRUD ─────────────────────────────────────────────

  async createCompany(
    dto: CreateCompanyDto,
    createdById: string,
  ): Promise<Company> {
    const company = this.companyRepository.create({
      ...dto,
      createdBy: createdById,
    });

    return this.companyRepository.save(company);
  }

  async updateCompany(id: string, dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.companyRepository.findOne({ where: { id } });

    if (!company) {
      throw new NotFoundException(`Company with ID "${id}" not found`);
    }

    Object.assign(company, dto);

    return this.companyRepository.save(company);
  }

  async findAll(query: QueryCompanyDto): Promise<{
    data: Company[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { status, locationId, search, page = 1, limit = 20 } = query;

    const qb = this.companyRepository.createQueryBuilder('company');

    if (status) {
      qb.andWhere('company.status = :status', { status });
    }

    if (locationId) {
      qb.andWhere('company.locationId = :locationId', { locationId });
    }

    if (search) {
      qb.andWhere(
        '(company.name ILIKE :search OR company.contactEmail ILIKE :search OR company.contactPersonName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('company.createdAt', 'DESC');
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async findById(id: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['employees', 'contracts'],
    });

    if (!company) {
      throw new NotFoundException(`Company with ID "${id}" not found`);
    }

    return company;
  }

  // ─── Company Status Management ────────────────────────────────

  async suspendCompany(id: string): Promise<Company> {
    const company = await this.companyRepository.findOne({ where: { id } });

    if (!company) {
      throw new NotFoundException(`Company with ID "${id}" not found`);
    }

    company.status = CompanyStatus.SUSPENDED;

    return this.companyRepository.save(company);
  }

  async activateCompany(id: string): Promise<Company> {
    const company = await this.companyRepository.findOne({ where: { id } });

    if (!company) {
      throw new NotFoundException(`Company with ID "${id}" not found`);
    }

    company.status = CompanyStatus.ACTIVE;

    return this.companyRepository.save(company);
  }

  async deactivateCompany(id: string): Promise<Company> {
    const company = await this.companyRepository.findOne({ where: { id } });

    if (!company) {
      throw new NotFoundException(`Company with ID "${id}" not found`);
    }

    company.status = CompanyStatus.INACTIVE;

    return this.companyRepository.save(company);
  }

  // ─── Employee Management ──────────────────────────────────────

  async addEmployee(companyId: string, dto: AddEmployeeDto): Promise<User> {
    // Ensure company exists
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID "${companyId}" not found`);
    }

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException(
        `User with email "${dto.email}" already exists`,
      );
    }

    const user = this.userRepository.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone ?? null,
      companyId,
      role: dto.role ?? UserRole.COMPANY_EMPLOYEE,
      status: UserStatus.ACTIVE,
      emailVerified: false,
    });

    return this.userRepository.save(user);
  }

  async removeEmployee(companyId: string, userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId, companyId },
    });

    if (!user) {
      throw new NotFoundException(
        `Employee with ID "${userId}" not found in company "${companyId}"`,
      );
    }

    user.companyId = null;
    user.role = UserRole.MEMBER;

    await this.userRepository.save(user);
  }

  async updateEmployeeRole(
    companyId: string,
    userId: string,
    dto: UpdateEmployeeRoleDto,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId, companyId },
    });

    if (!user) {
      throw new NotFoundException(
        `Employee with ID "${userId}" not found in company "${companyId}"`,
      );
    }

    user.role = dto.role;

    return this.userRepository.save(user);
  }

  async getEmployees(
    companyId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await this.userRepository.findAndCount({
      where: { companyId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  // ─── Company Stats ────────────────────────────────────────────

  async getCompanyStats(companyId: string): Promise<{
    employeeCount: number;
    activeContractCount: number;
    creditBalance: number;
  }> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID "${companyId}" not found`);
    }

    const employeeCount = await this.userRepository.count({
      where: { companyId },
    });

    const activeContractCount = await this.contractRepository.count({
      where: { companyId, status: ContractStatus.ACTIVE },
    });

    const creditBalanceResult = await this.companyRepository.manager
      .createQueryBuilder()
      .select('COALESCE(SUM(cp.remaining_minutes), 0)::int', 'creditBalance')
      .from('credit_packages', 'cp')
      .where('cp.company_id = :companyId', { companyId })
      .andWhere('cp.status = :status', { status: CreditPackageStatus.ACTIVE })
      .getRawOne();

    return {
      employeeCount,
      activeContractCount,
      creditBalance: creditBalanceResult?.creditBalance ?? 0,
    };
  }
}
