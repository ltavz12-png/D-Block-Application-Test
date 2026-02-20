import {
  Controller,
  Get,
  Post,
  Patch,
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
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { QueryContractDto } from './dto/query-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/database/entities/user.entity';

@ApiTags('Contracts')
@ApiBearerAuth()
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  // ──── Static Routes (before parameterized) ────────────────────────

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.LOCATION_MANAGER)
  @ApiOperation({ summary: 'List all contracts with filters' })
  findAll(@Query() query: QueryContractDto) {
    return this.contractsService.findAll(query);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({ summary: 'Create a new contract' })
  create(
    @Body() dto: CreateContractDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.contractsService.create(dto, user.id);
  }

  @Get('company/:companyId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'List contracts by company' })
  findByCompany(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.contractsService.findByCompany(
      companyId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('company/:companyId/summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get contract summary for a company' })
  getCompanySummary(
    @Param('companyId', ParseUUIDPipe) companyId: string,
  ) {
    return this.contractsService.getContractSummary(companyId);
  }

  // ──── Parameterized Routes ────────────────────────────────────────

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.LOCATION_MANAGER,
    UserRole.COMPANY_ADMIN,
  )
  @ApiOperation({ summary: 'Get a single contract by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractsService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({ summary: 'Update a contract' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContractDto,
  ) {
    return this.contractsService.update(id, dto);
  }

  @Post(':id/send-for-signature')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({ summary: 'Send contract for signature' })
  sendForSignature(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractsService.sendForSignature(id);
  }

  @Post(':id/sign')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({ summary: 'Mark contract as signed' })
  markSigned(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SignContractDto,
  ) {
    return this.contractsService.markSigned(id, dto);
  }

  @Post(':id/terminate')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Terminate a contract' })
  terminate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    return this.contractsService.terminate(id, reason);
  }

  @Post(':id/renew')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({ summary: 'Renew a contract' })
  renew(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractsService.renewContract(id);
  }
}
