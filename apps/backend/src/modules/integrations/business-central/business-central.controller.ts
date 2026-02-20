// ──────────────────────────────────────────────────────────────────────────────
// Business Central Controller — Admin-facing endpoints for BC integration
// ──────────────────────────────────────────────────────────────────────────────

import {
  Controller,
  Get,
  Post,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BusinessCentralService } from './business-central.service';
import { SyncCompanyDto } from './dto/sync-company.dto';
import { PostJournalDto } from './dto/post-journal.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/database/entities/user.entity';

@ApiTags('Business Central')
@ApiBearerAuth()
@Controller('integrations/business-central')
export class BusinessCentralController {
  constructor(
    private readonly businessCentralService: BusinessCentralService,
  ) {}

  // ─── Connection Test ───────────────────────────────────────────────────────

  @Get('test')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({
    summary: 'Test Business Central connection',
    description: 'Verifies that the BC integration can authenticate and reach the API.',
  })
  async testConnection() {
    return this.businessCentralService.testConnection();
  }

  // ─── Chart of Accounts ─────────────────────────────────────────────────────

  @Get('accounts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({
    summary: 'List chart of accounts from Business Central',
    description: 'Returns all GL accounts configured in Business Central.',
  })
  async listAccounts() {
    const accounts = await this.businessCentralService.getChartOfAccounts();
    return { data: accounts, total: accounts.length };
  }

  // ─── Customers ──────────────────────────────────────────────────────────────

  @Get('customers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({
    summary: 'List customers from Business Central',
    description: 'Returns all customers currently registered in Business Central.',
  })
  async listCustomers() {
    const customers = await this.businessCentralService.listBCCustomers();
    return { data: customers, total: customers.length };
  }

  // ─── Sync Company ──────────────────────────────────────────────────────────

  @Post('sync-company')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({
    summary: 'Sync a company to Business Central as a customer',
    description:
      'Creates or updates a customer record in Business Central based on the provided company data. ' +
      'If a customer with the same display name already exists, it will be updated.',
  })
  async syncCompany(@Body() dto: SyncCompanyDto) {
    return this.businessCentralService.syncCompanyToBC({
      id: dto.id,
      name: dto.name,
      taxId: dto.taxId,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
    });
  }

  // ─── Post Journal Entries ──────────────────────────────────────────────────

  @Post('post-journal')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({
    summary: 'Post journal entries to Business Central',
    description:
      'Posts an array of general journal entries (e.g. revenue recognition entries) to Business Central. ' +
      'Each entry requires an account number, amount, posting date, and description.',
  })
  async postJournal(@Body() dto: PostJournalDto) {
    await this.businessCentralService.postRevenueJournalEntries(dto.entries);
    return { message: `Successfully posted ${dto.entries.length} journal entries to Business Central` };
  }
}
