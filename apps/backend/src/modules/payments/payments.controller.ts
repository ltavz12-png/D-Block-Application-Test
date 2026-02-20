import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ProcessRefundDto } from './dto/process-refund.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/database/entities/user.entity';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ─── Member Endpoints ─────────────────────────────────────────

  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new payment' })
  async createPayment(
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    return this.paymentsService.createPayment(user.id, dto);
  }

  @ApiBearerAuth()
  @Get('my')
  @ApiOperation({ summary: 'List my payments' })
  async findMyPayments(
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    return this.paymentsService.findByUser(user.id);
  }

  @ApiBearerAuth()
  @Get('my/summary')
  @ApiOperation({ summary: 'Get my payment summary (total paid, refunded, count)' })
  async getMyPaymentSummary(
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    return this.paymentsService.getPaymentSummary(user.id);
  }

  // ─── Admin Endpoints ──────────────────────────────────────────

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @Get('admin')
  @ApiOperation({ summary: 'Paginated list of all payments with filters (admin)' })
  async findAllAdmin(@Query() query: QueryPaymentDto) {
    return this.paymentsService.findAll(query);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm a payment (admin)' })
  async confirmPayment(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.confirmPayment(id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @Post(':id/refund')
  @ApiOperation({ summary: 'Process a refund for a payment (admin)' })
  async processRefund(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProcessRefundDto,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    return this.paymentsService.processRefund(id, dto, user.id);
  }

  // ─── Webhook Endpoint ─────────────────────────────────────────

  @Public()
  @Post('webhook/:gateway')
  @ApiOperation({ summary: 'Receive payment gateway webhook notifications' })
  async handleWebhook(
    @Param('gateway') gateway: string,
    @Req() req: Request,
  ) {
    const payload = req.body as Record<string, any>;
    return this.paymentsService.handleWebhook(gateway, payload);
  }

  // ─── Get Single Payment (must come after named routes) ────────

  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single payment (owner or admin)' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    const payment = await this.paymentsService.findById(id);

    const isAdmin =
      user.role === UserRole.SUPER_ADMIN ||
      user.role === UserRole.FINANCE_ADMIN;

    if (payment.userId !== user.id && !isAdmin) {
      throw new ForbiddenException('You do not have access to this payment');
    }

    return payment;
  }
}
