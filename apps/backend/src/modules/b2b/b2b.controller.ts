import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { B2bService } from './b2b.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { QueryCompanyDto } from './dto/query-company.dto';
import { AddEmployeeDto } from './dto/add-employee.dto';
import { UpdateEmployeeRoleDto } from './dto/update-employee-role.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/database/entities/user.entity';

@ApiTags('B2B')
@ApiBearerAuth()
@Controller('b2b/companies')
export class B2bController {
  constructor(private readonly b2bService: B2bService) {}

  // ─── Company Endpoints ────────────────────────────────────────

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.LOCATION_MANAGER)
  @ApiOperation({ summary: 'List all companies with filters and pagination' })
  async findAll(@Query() query: QueryCompanyDto) {
    return this.b2bService.findAll(query);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({ summary: 'Create a new B2B company' })
  async create(
    @Body() dto: CreateCompanyDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.b2bService.createCompany(dto, userId);
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.LOCATION_MANAGER,
    UserRole.COMPANY_ADMIN,
  )
  @ApiOperation({ summary: 'Get a company by ID with employees and contracts' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.b2bService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({ summary: 'Update a company' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.b2bService.updateCompany(id, dto);
  }

  // ─── Company Status Endpoints ─────────────────────────────────

  @Post(':id/suspend')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Suspend a company' })
  async suspend(@Param('id', ParseUUIDPipe) id: string) {
    return this.b2bService.suspendCompany(id);
  }

  @Post(':id/activate')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Activate a company' })
  async activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.b2bService.activateCompany(id);
  }

  @Post(':id/deactivate')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Deactivate a company' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.b2bService.deactivateCompany(id);
  }

  // ─── Employee Endpoints ───────────────────────────────────────

  @Get(':id/employees')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'List employees of a company' })
  async getEmployees(
    @Param('id', ParseUUIDPipe) companyId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.b2bService.getEmployees(
      companyId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Post(':id/employees')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Add an employee to a company' })
  async addEmployee(
    @Param('id', ParseUUIDPipe) companyId: string,
    @Body() dto: AddEmployeeDto,
  ) {
    return this.b2bService.addEmployee(companyId, dto);
  }

  @Patch(':id/employees/:userId/role')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update an employee role within a company' })
  async updateEmployeeRole(
    @Param('id', ParseUUIDPipe) companyId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateEmployeeRoleDto,
  ) {
    return this.b2bService.updateEmployeeRole(companyId, userId, dto);
  }

  @Delete(':id/employees/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Remove an employee from a company' })
  async removeEmployee(
    @Param('id', ParseUUIDPipe) companyId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    await this.b2bService.removeEmployee(companyId, userId);
    return { message: 'Employee removed from company successfully' };
  }

  // ─── Stats Endpoint ───────────────────────────────────────────

  @Get(':id/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get company statistics' })
  async getStats(@Param('id', ParseUUIDPipe) companyId: string) {
    return this.b2bService.getCompanyStats(companyId);
  }
}
