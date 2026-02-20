import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/database/entities/user.entity';

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  // ─── Static Routes (before parameterized) ─────────────────────────────

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({ summary: 'List all invoices with filters and pagination' })
  async findAll(@Query() query: QueryInvoiceDto) {
    return this.invoicesService.findAll(query);
  }

  @Get('my')
  @ApiOperation({ summary: 'List current user invoices' })
  async findMyInvoices(
    @CurrentUser() user: { id: string },
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.invoicesService.findByUser(
      user.id,
      page || 1,
      limit || 20,
    );
  }

  @Get('summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({ summary: 'Get invoice summary with aggregated totals' })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  async getSummary(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.invoicesService.getInvoiceSummary(dateFrom, dateTo, companyId);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({ summary: 'Create a new invoice' })
  async create(
    @Body() dto: CreateInvoiceDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.invoicesService.create(dto, user.id);
  }

  @Post('generate-monthly')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({ summary: 'Generate monthly B2B invoices for active contracts' })
  @ApiQuery({ name: 'month', required: true, type: String, description: 'Month in YYYY-MM format' })
  async generateMonthly(@Query('month') month: string) {
    const monthDate = new Date(month + '-01');
    return this.invoicesService.generateMonthlyB2BInvoices(monthDate);
  }

  // ─── Parameterized Routes ─────────────────────────────────────────────

  @Get('company/:companyId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'List invoices for a specific company' })
  @ApiParam({ name: 'companyId', type: String })
  async findByCompany(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.invoicesService.findByCompany(
      companyId,
      page || 1,
      limit || 20,
    );
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get a single invoice by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({ summary: 'Update an invoice (DRAFT only)' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(id, dto);
  }

  @Post(':id/send')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({ summary: 'Send an invoice (DRAFT -> SENT)' })
  @ApiParam({ name: 'id', type: String })
  async send(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.sendInvoice(id);
  }

  @Post(':id/mark-paid')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({ summary: 'Mark an invoice as paid' })
  @ApiParam({ name: 'id', type: String })
  async markPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { paymentId?: string },
  ) {
    return this.invoicesService.markPaid(id, body?.paymentId);
  }

  @Post(':id/cancel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({ summary: 'Cancel an invoice' })
  @ApiParam({ name: 'id', type: String })
  async cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.cancelInvoice(id);
  }

  @Post(':id/credit')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({ summary: 'Create a credit note for a paid invoice' })
  @ApiParam({ name: 'id', type: String })
  async credit(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.creditInvoice(id);
  }
}
